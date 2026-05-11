export interface S3FileObject {
  key: string
  size: number
  lastModified: Date
  eTag: string
  storageClass?: string
  contentType?: string
}

export interface S3FolderObject {
  prefix: string
}

export interface FileItem {
  type: 'file' | 'folder'
  name: string
  key: string
  size?: number
  lastModified?: Date
  eTag?: string
}

export type ViewMode = 'grid' | 'list'
export type SortBy = 'name' | 'size' | 'lastModified'
export type SortOrder = 'asc' | 'desc'
