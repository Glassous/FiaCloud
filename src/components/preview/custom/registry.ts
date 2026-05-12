import type { CustomPreviewRegistration } from './types'
import { CsvPreview } from './CsvPreview'
import { MarkdownPreview } from './MarkdownPreview'

const registry: CustomPreviewRegistration[] = [
  CsvPreview,
  MarkdownPreview,
]

export function getCustomPreview(ext: string): CustomPreviewRegistration | undefined {
  return registry.find(r => r.extensions.includes(ext))
}
