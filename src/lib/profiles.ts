import type { S3Profile } from '../types'

export interface ProfileTemplate {
  name: string
  endpoint: string
  region: string
  forcePathStyle: boolean
  accelerate: boolean
}

export const PROFILE_TEMPLATES: Record<string, ProfileTemplate> = {
  aws: {
    name: 'Amazon S3',
    endpoint: '',
    region: 'us-east-1',
    forcePathStyle: false,
    accelerate: false,
  },
  oss: {
    name: '阿里云 OSS',
    endpoint: '',
    region: 'oss-cn-hangzhou',
    forcePathStyle: false,
    accelerate: false,
  },
  r2: {
    name: 'Cloudflare R2',
    endpoint: '',
    region: 'auto',
    forcePathStyle: true,
    accelerate: false,
  },
  minio: {
    name: 'MinIO',
    endpoint: '',
    region: 'us-east-1',
    forcePathStyle: true,
    accelerate: false,
  },
}

export function generateProfileId(): string {
  return `profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function createDefaultProfile(template?: ProfileTemplate): S3Profile {
  const now = Date.now()
  return {
    id: generateProfileId(),
    name: template?.name || '新配置',
    endpoint: template?.endpoint || '',
    region: template?.region || '',
    accessKeyId: '',
    secretAccessKey: '',
    bucket: '',
    forcePathStyle: template?.forcePathStyle ?? false,
    accelerate: template?.accelerate ?? false,
    createdAt: now,
    updatedAt: now,
  }
}
