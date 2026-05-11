import { useState, useCallback, useRef } from 'react'
import type { S3Profile, FileItem, SortBy, SortOrder } from '../types'
import { listObjects, deleteObject, deleteFolder, createFolder, renameObject } from '../lib/s3-client'

interface UseFileExplorerReturn {
  items: FileItem[]
  loading: boolean
  error: string | null
  currentPrefix: string
  hasMore: boolean
  sortBy: SortBy
  sortOrder: SortOrder
  loadFiles: (profile: S3Profile, prefix?: string) => Promise<void>
  loadMore: (profile: S3Profile) => Promise<void>
  refresh: (profile: S3Profile) => Promise<void>
  navigateTo: (profile: S3Profile, prefix: string) => Promise<void>
  navigateUp: (profile: S3Profile) => void
  deleteItem: (profile: S3Profile, key: string, isFolder: boolean) => Promise<void>
  makeFolder: (profile: S3Profile, name: string) => Promise<void>
  renameItem: (profile: S3Profile, oldKey: string, newKey: string) => Promise<void>
  setSortBy: (sort: SortBy) => void
  setSortOrder: (order: SortOrder) => void
}

function extractNameFromKey(key: string, parentPrefix: string): string {
  const relative = key.slice(parentPrefix.length)
  return relative.replace(/\/$/, '')
}

function sortItems(items: FileItem[], sortBy: SortBy, sortOrder: SortOrder): FileItem[] {
  const folders = items.filter((i) => i.type === 'folder')
  const files = items.filter((i) => i.type === 'file')

  const sortFn = (a: FileItem, b: FileItem) => {
    let cmp = 0
    switch (sortBy) {
      case 'name':
        cmp = a.name.localeCompare(b.name)
        break
      case 'size':
        cmp = (a.size || 0) - (b.size || 0)
        break
      case 'lastModified':
        cmp = (a.lastModified?.getTime() || 0) - (b.lastModified?.getTime() || 0)
        break
    }
    return sortOrder === 'asc' ? cmp : -cmp
  }

  folders.sort(sortFn)
  files.sort(sortFn)
  return [...folders, ...files]
}

export function useFileExplorer(): UseFileExplorerReturn {
  const [items, setItems] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPrefix, setCurrentPrefix] = useState('')
  const [hasMore, setHasMore] = useState(false)
  const [sortBy, setSortBy] = useState<SortBy>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const continuationTokenRef = useRef<string | undefined>(undefined)
  const allItemsRef = useRef<FileItem[]>([])


  const loadFiles = useCallback(async (profile: S3Profile, prefix = '') => {
    setLoading(true)
    setError(null)
    try {
      const result = await listObjects(profile, prefix)
      const folders: FileItem[] = result.folders.map((f) => ({
        type: 'folder' as const,
        name: extractNameFromKey(f.prefix, prefix),
        key: f.prefix,
      }))
      const files: FileItem[] = result.files.map((f) => ({
        type: 'file' as const,
        name: extractNameFromKey(f.key, prefix),
        key: f.key,
        size: f.size,
        lastModified: f.lastModified,
        eTag: f.eTag,
      }))
      const merged = [...folders, ...files]
      allItemsRef.current = merged
      continuationTokenRef.current = result.continuationToken
      setItems(sortItems(merged, sortBy, sortOrder))
      setCurrentPrefix(prefix)
      setHasMore(result.isTruncated)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '加载文件列表失败'
      setError(msg)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [sortBy, sortOrder])

  const loadMore = useCallback(async (profile: S3Profile) => {
    if (!continuationTokenRef.current) return
    setLoading(true)
    try {
      const result = await listObjects(profile, currentPrefix, continuationTokenRef.current)
      const folders: FileItem[] = result.folders.map((f) => ({
        type: 'folder' as const,
        name: extractNameFromKey(f.prefix, currentPrefix),
        key: f.prefix,
      }))
      const files: FileItem[] = result.files.map((f) => ({
        type: 'file' as const,
        name: extractNameFromKey(f.key, currentPrefix),
        key: f.key,
        size: f.size,
        lastModified: f.lastModified,
        eTag: f.eTag,
      }))
      const merged = [...allItemsRef.current, ...folders, ...files]
      allItemsRef.current = merged
      continuationTokenRef.current = result.continuationToken
      setItems(sortItems(merged, sortBy, sortOrder))
      setHasMore(result.isTruncated)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '加载更多失败'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [currentPrefix, sortBy, sortOrder])

  const refresh = useCallback(async (profile: S3Profile) => {
    await loadFiles(profile, currentPrefix)
  }, [currentPrefix, loadFiles])

  const navigateTo = useCallback(async (profile: S3Profile, prefix: string) => {
    allItemsRef.current = []
    continuationTokenRef.current = undefined
    await loadFiles(profile, prefix)
  }, [loadFiles])

  const navigateUp = useCallback((_profile: S3Profile) => {
    const parts = currentPrefix.split('/').filter(Boolean)
    parts.pop()
    const parent = parts.length > 0 ? parts.join('/') + '/' : ''
    allItemsRef.current = []
    continuationTokenRef.current = undefined
    loadFiles(_profile, parent)
  }, [currentPrefix, loadFiles])

  const deleteItem = useCallback(async (profile: S3Profile, key: string, isFolder: boolean) => {
    try {
      if (isFolder) {
        await deleteFolder(profile, key)
      } else {
        await deleteObject(profile, key)
      }
      await refresh(profile)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '删除失败'
      setError(msg)
    }
  }, [refresh])

  const makeFolder = useCallback(async (profile: S3Profile, name: string) => {
    try {
      const prefix = currentPrefix + name + '/'
      await createFolder(profile, prefix)
      await refresh(profile)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '创建文件夹失败'
      setError(msg)
    }
  }, [currentPrefix, refresh])

  const renameItem = useCallback(async (profile: S3Profile, oldKey: string, newKey: string) => {
    try {
      await renameObject(profile, oldKey, newKey)
      await refresh(profile)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '重命名失败'
      setError(msg)
    }
  }, [refresh])

  const handleSetSortBy = useCallback((sort: SortBy) => {
    setSortBy(sort)
    setItems(() => sortItems([...allItemsRef.current], sort, sortOrder))
  }, [sortOrder])

  const handleSetSortOrder = useCallback((order: SortOrder) => {
    setSortOrder(order)
    setItems(() => sortItems([...allItemsRef.current], sortBy, order))
  }, [sortBy])

  return {
    items,
    loading,
    error,
    currentPrefix,
    hasMore,
    sortBy,
    sortOrder,
    loadFiles,
    loadMore,
    refresh,
    navigateTo,
    navigateUp,
    deleteItem,
    makeFolder,
    renameItem,
    setSortBy: handleSetSortBy,
    setSortOrder: handleSetSortOrder,
  }
}
