import './ConfirmDialog.css'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '确认',
  cancelLabel = '取消',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="confirm-overlay animate-fade-in" onClick={onCancel}>
      <div className="confirm-dialog animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <p className="text-body-large">{title}</p>
        {message && <p className="text-body-medium confirm-dialog__msg">{message}</p>}
        <div className="confirm-dialog__actions">
          <button className="confirm-dialog__btn" onClick={onCancel}>{cancelLabel}</button>
          <button
            className={`confirm-dialog__btn ${danger ? 'confirm-dialog__btn--danger' : 'confirm-dialog__btn--primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
