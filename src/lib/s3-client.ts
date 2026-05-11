import { S3Client, ListObjectsV2Command, HeadObjectCommand, DeleteObjectCommand, PutObjectCommand, CopyObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { S3Profile, S3FileObject, S3FolderObject } from '../types'

export interface ListResult {
  files: S3FileObject[]
  folders: S3FolderObject[]
  continuationToken?: string
  isTruncated: boolean
}

let currentClient: S3Client | null = null
let currentProfileId: string | null = null

function buildEndpoint(profile: S3Profile): { endpoint: string; forcePathStyle: boolean } | undefined {
  if (!profile.endpoint) return undefined

  let url = profile.endpoint
  if (!url.startsWith('http')) {
    url = `https://${url}`
  }

  return {
    endpoint: url,
    forcePathStyle: profile.forcePathStyle,
  }
}

function getClient(profile: S3Profile): S3Client {
  if (currentClient && currentProfileId === profile.id) {
    return currentClient
  }

  const endpointConfig = buildEndpoint(profile)

  currentClient = new S3Client({
    region: profile.region || 'auto',
    credentials: {
      accessKeyId: profile.accessKeyId,
      secretAccessKey: profile.secretAccessKey,
    },
    ...(endpointConfig && {
      endpoint: endpointConfig.endpoint,
      forcePathStyle: endpointConfig.forcePathStyle,
    }),
    ...(profile.accelerate && {
      useAccelerateEndpoint: true,
    }),
  })
  currentProfileId = profile.id
  return currentClient
}

export function resetClient(): void {
  currentClient = null
  currentProfileId = null
}

export async function listObjects(
  profile: S3Profile,
  prefix: string,
  continuationToken?: string,
): Promise<ListResult> {
  const client = getClient(profile)

  const normalizedPrefix = prefix ? (prefix.endsWith('/') ? prefix : `${prefix}/`) : ''

  const command = new ListObjectsV2Command({
    Bucket: profile.bucket,
    Prefix: normalizedPrefix,
    Delimiter: '/',
    MaxKeys: 1000,
    ...(continuationToken && { ContinuationToken: continuationToken }),
  })

  const response = await client.send(command)

  const files: S3FileObject[] = (response.Contents || []).map((item) => ({
    key: item.Key || '',
    size: item.Size || 0,
    lastModified: item.LastModified || new Date(),
    eTag: item.ETag || '',
    storageClass: item.StorageClass,
  }))

  const folders: S3FolderObject[] = (response.CommonPrefixes || []).map((item) => ({
    prefix: item.Prefix || '',
  }))

  return {
    files,
    folders,
    continuationToken: response.NextContinuationToken,
    isTruncated: response.IsTruncated || false,
  }
}

export async function getObjectInfo(
  profile: S3Profile,
  key: string,
): Promise<{ contentType?: string; contentLength?: number; lastModified?: Date; eTag?: string; metadata?: Record<string, string> }> {
  const client = getClient(profile)

  const command = new HeadObjectCommand({
    Bucket: profile.bucket,
    Key: key,
  })

  const response = await client.send(command)

  return {
    contentType: response.ContentType,
    contentLength: response.ContentLength,
    lastModified: response.LastModified,
    eTag: response.ETag,
    metadata: response.Metadata as Record<string, string> | undefined,
  }
}

export async function deleteObject(
  profile: S3Profile,
  key: string,
): Promise<void> {
  const client = getClient(profile)
  await client.send(new DeleteObjectCommand({
    Bucket: profile.bucket,
    Key: key,
  }))
}

export async function deleteFolder(
  profile: S3Profile,
  prefix: string,
): Promise<void> {
  const client = getClient(profile)
  const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`

  let continuationToken: string | undefined
  do {
    const listResponse = await client.send(new ListObjectsV2Command({
      Bucket: profile.bucket,
      Prefix: normalizedPrefix,
      ContinuationToken: continuationToken,
    }))

    const objects = listResponse.Contents || []
    if (objects.length > 0) {
      await Promise.all(
        objects.map((obj) =>
          client.send(new DeleteObjectCommand({
            Bucket: profile.bucket,
            Key: obj.Key!,
          }))
        )
      )
    }

    continuationToken = listResponse.NextContinuationToken
  } while (continuationToken)
}

export async function createFolder(
  profile: S3Profile,
  prefix: string,
): Promise<void> {
  const client = getClient(profile)
  const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`

  await client.send(new PutObjectCommand({
    Bucket: profile.bucket,
    Key: normalizedPrefix,
    Body: '',
  }))
}

export async function renameObject(
  profile: S3Profile,
  sourceKey: string,
  destKey: string,
): Promise<void> {
  const client = getClient(profile)

  await client.send(new CopyObjectCommand({
    Bucket: profile.bucket,
    CopySource: `${profile.bucket}/${encodeURIComponent(sourceKey)}`,
    Key: destKey,
  }))

  await client.send(new DeleteObjectCommand({
    Bucket: profile.bucket,
    Key: sourceKey,
  }))
}

export async function uploadObject(
  profile: S3Profile,
  key: string,
  body: File | Uint8Array | string,
  contentType?: string,
): Promise<void> {
  const client = getClient(profile)

  let finalBody: any = body
  if (body instanceof File) {
    finalBody = await body.arrayBuffer()
  } else if (typeof body === 'string') {
    finalBody = new TextEncoder().encode(body)
  }

  await client.send(new PutObjectCommand({
    Bucket: profile.bucket,
    Key: key,
    Body: finalBody,
    ContentType: contentType || (body instanceof File ? body.type : typeof body === 'string' ? 'text/plain' : 'application/octet-stream'),
    CacheControl: 'no-cache, no-store, must-revalidate',
  }))
}

export async function getObject(
  profile: S3Profile,
  key: string,
): Promise<{ body: Uint8Array; contentType?: string }> {
  const client = getClient(profile)
  const command = new GetObjectCommand({
    Bucket: profile.bucket,
    Key: key,
    ResponseCacheControl: 'no-cache, no-store, must-revalidate',
  })

  const response = await client.send(command)
  const bytes = await response.Body?.transformToByteArray()

  return {
    body: bytes || new Uint8Array(),
    contentType: response.ContentType,
  }
}

export async function getDownloadUrl(
  profile: S3Profile,
  key: string,
  expiresIn = 3600,
): Promise<string> {
  const client = getClient(profile)
  const command = new GetObjectCommand({
    Bucket: profile.bucket,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${key.split('/').pop()}"`,
    ResponseCacheControl: 'no-cache, no-store, must-revalidate',
  })

  return getSignedUrl(client, command, { expiresIn })
}

export async function getPreviewUrl(
  profile: S3Profile,
  key: string,
  expiresIn = 3600,
): Promise<string> {
  const client = getClient(profile)
  const command = new GetObjectCommand({
    Bucket: profile.bucket,
    Key: key,
    ResponseCacheControl: 'no-cache, no-store, must-revalidate',
  })

  return getSignedUrl(client, command, { expiresIn })
}

export function buildPublicUrl(profile: S3Profile, key: string): string {
  if (profile.publicUrl) {
    const base = profile.publicUrl.replace(/\/$/, '')
    return `${base}/${key}`
  }

  const endpoint = profile.endpoint || `s3.${profile.region}.amazonaws.com`
  const base = endpoint.startsWith('http') ? endpoint : `https://${endpoint}`

  if (profile.forcePathStyle) {
    return `${base}/${profile.bucket}/${key}`
  }

  return `${base}/${profile.bucket}/${key}`
}
