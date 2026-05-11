export interface S3Profile {
  id: string
  name: string
  endpoint: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  forcePathStyle: boolean
  accelerate: boolean
  publicUrl?: string
  createdAt: number
  updatedAt: number
}

export interface AppConfig {
  activeProfileId: string
  profiles: S3Profile[]
  theme: 'light' | 'dark' | 'system'
  defaultView: 'grid' | 'list'
  sidebarExpanded: boolean
}
