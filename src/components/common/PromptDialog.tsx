import { useState } from 'react'
import './PromptDialog.css'

interface PromptDialogProps {
  open: boolean
  title: string
  defaultValue?: string
  placeholder?: string
  confirmLabel?: string
  onConfirm: (value: string) => void
  onCancel: () => void
}

export function PromptDialog({
  open,
  title,
  defaultValue = '',
  placeholder,
  confirmLabel = '确认',
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue)

  if (!open) return null

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onConfirm(value)
    if (e.key === 'Escape') onCancel()
  }

  return (
    <div className="confirm-overlay animate-fade-in" onClick={onCancel}>
      <div className="confirm-dialog animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <p className="text-body-large">{title}</p>
        <input
          className="prompt-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <div className="confirm-dialog__actions">
          <button className="confirm-dialog__btn" onClick={onCancel}>取消</button>
          <button
            className="confirm-dialog__btn confirm-dialog__btn--primary"
            onClick={() => onConfirm(value)}
            disabled={!value.trim()}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
