import { useEffect } from 'react'
import './Toast.css'

export interface ToastMessage {
  id: string
  text: string
  type?: 'info' | 'success' | 'error'
  duration?: number
}

interface ToastProps {
  messages: ToastMessage[]
  onDismiss: (id: string) => void
}

export function Toast({ messages, onDismiss }: ToastProps) {
  return (
    <div className="toast-container">
      {messages.map((msg) => (
        <ToastItem key={msg.id} message={msg} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({ message, onDismiss }: { message: ToastMessage; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(message.id)
    }, message.duration || 3000)
    return () => clearTimeout(timer)
  }, [message, onDismiss])

  const icons: Record<string, string> = {
    info: 'info',
    success: 'check_circle',
    error: 'error',
  }

  return (
    <div className={`toast-item toast-item--${message.type || 'info'} animate-slide-in-up`}>
      <span className="material-symbols-outlined toast-item__icon">
        {icons[message.type || 'info']}
      </span>
      <span className="text-body-small toast-item__text">{message.text}</span>
      <button className="toast-item__close" onClick={() => onDismiss(message.id)}>
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  )
}
