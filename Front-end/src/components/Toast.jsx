import { useToast } from '@/context/ToastContext'

const ICONS = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }

export default function Toast() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`} role="alert">
          <span className="toast-icon">{ICONS[toast.type] || 'ℹ️'}</span>
          <span className="toast-message">{toast.message}</span>
          <button
            className="toast-close"
            onClick={() => removeToast(toast.id)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
