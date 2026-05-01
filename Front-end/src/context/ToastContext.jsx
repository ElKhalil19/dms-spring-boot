import { createContext, useContext, useReducer, useCallback, useRef } from 'react'

const ToastContext = createContext(null)

function toastReducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return [...state, action.payload]
    case 'REMOVE':
      return state.filter((t) => t.id !== action.payload)
    default:
      return state
  }
}

export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(toastReducer, [])
  const nextId = useRef(1)

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = nextId.current++
    dispatch({ type: 'ADD', payload: { id, message, type } })
    setTimeout(() => dispatch({ type: 'REMOVE', payload: id }), duration)
  }, [])

  const removeToast = useCallback((id) => {
    dispatch({ type: 'REMOVE', payload: id })
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  return context
}
