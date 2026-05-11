export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = bytes / Math.pow(k, i)
  return `${value < 10 ? value.toFixed(2) : value < 100 ? value.toFixed(1) : Math.round(value)} ${units[i]}`
}

export function formatDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatDateFull(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}:${s}`
}

export function getFileExtension(name: string): string {
  const dot = name.lastIndexOf('.')
  if (dot <= 0) return ''
  return name.slice(dot + 1).toLowerCase()
}

export function getFileCategory(ext: string): string {
  const map: Record<string, string> = {
    jpg: '图片', jpeg: '图片', png: '图片', gif: '图片', webp: '图片', svg: '图片', bmp: '图片', ico: '图片',
    mp4: '视频', webm: '视频', mov: '视频', avi: '视频', mkv: '视频', flv: '视频',
    mp3: '音频', wav: '音频', ogg: '音频', flac: '音频', aac: '音频', m4a: '音频',
    pdf: '文档', doc: '文档', docx: '文档', xls: '文档', xlsx: '文档', ppt: '文档', pptx: '文档',
    txt: '文本', md: '文本', log: '文本', csv: '文本',
    zip: '压缩包', rar: '压缩包', '7z': '压缩包', tar: '压缩包', gz: '压缩包',
    js: '代码', ts: '代码', jsx: '代码', tsx: '代码', py: '代码', java: '代码',
    go: '代码', rs: '代码', cpp: '代码', c: '代码', h: '代码', css: '代码', html: '代码',
    json: '配置', yaml: '配置', yml: '配置', xml: '配置', toml: '配置', ini: '配置',
  }
  return map[ext] || '其他'
}

export function getFileIconClass(ext: string): string {
  const map: Record<string, string> = {
    jpg: 'icon-image', jpeg: 'icon-image', png: 'icon-image', gif: 'icon-image', webp: 'icon-image', svg: 'icon-image',
    mp4: 'icon-video', webm: 'icon-video', mov: 'icon-video',
    mp3: 'icon-audio', wav: 'icon-audio', flac: 'icon-audio',
    pdf: 'icon-pdf',
    zip: 'icon-archive', rar: 'icon-archive', '7z': 'icon-archive', tar: 'icon-archive', gz: 'icon-archive',
    js: 'icon-code', ts: 'icon-code', py: 'icon-code', go: 'icon-code', rs: 'icon-code',
    json: 'icon-config', yaml: 'icon-config', yml: 'icon-config', xml: 'icon-config', toml: 'icon-config',
  }
  return map[ext] || 'icon-file'
}

export function getIconForFileItem(name: string, isFolder: boolean): string {
  if (isFolder) return 'folder'
  const ext = getFileExtension(name)
  const map: Record<string, string> = {
    jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', svg: 'image',
    mp4: 'movie', webm: 'movie', mov: 'movie',
    mp3: 'audio_file', wav: 'audio_file', flac: 'audio_file',
    pdf: 'picture_as_pdf',
    zip: 'folder_zip', rar: 'folder_zip', '7z': 'folder_zip',
    js: 'code', ts: 'code', py: 'code', go: 'code', rs: 'code',
    json: 'data_object', yaml: 'data_object', yml: 'data_object', xml: 'data_object',
    txt: 'description', md: 'description', log: 'description',
  }
  return map[ext] || 'draft'
}

export function getPreviewType(name: string): 'text' | 'image' | 'video' | 'audio' | 'none' {
  const ext = getFileExtension(name)
  const category = getFileCategory(ext)

  if (category === '文本' || category === '代码' || category === '配置') return 'text'
  if (category === '图片') return 'image'
  if (category === '视频') return 'video'
  if (category === '音频') return 'audio'

  return 'none'
}
