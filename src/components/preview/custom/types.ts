import type { ReactNode } from 'react'

export interface CustomToolbarAction {
  id: string
  label: string
  icon: string
  disabled?: boolean
  onClick: () => void
}

export interface CustomPreviewProps {
  content: string
  fileName: string
  isEditing: boolean
  onToolbarActions?: (actions: CustomToolbarAction[]) => void
  onClearToolbarActions?: () => void
}

export interface CustomPreviewRegistration {
  id: string
  extensions: string[]
  PreviewComponent: (props: CustomPreviewProps) => ReactNode
  handlesEdit: boolean
}
