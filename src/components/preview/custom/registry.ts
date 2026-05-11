import type { CustomPreviewRegistration } from './types'
import { CsvPreview } from './CsvPreview'

const registry: CustomPreviewRegistration[] = [
  CsvPreview,
]

export function getCustomPreview(ext: string): CustomPreviewRegistration | undefined {
  return registry.find(r => r.extensions.includes(ext))
}
