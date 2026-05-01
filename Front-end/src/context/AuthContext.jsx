import { createContext, useContext, useReducer } from 'react'
import { authApi } from '@/services/api'

const AuthContext = createContext(null)

const initialState = {
  user: JSON.parse(localStorage.getItem('dms-user')) || null,
  isAuthenticated: !!localStorage.getItem('dms-user'),
  loading: false,
  error: null,
}

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null }
    case 'LOGIN_SUCCESS':
      return { ...state, loading: false, isAuthenticated: true, user: action.payload, error: null }
    case 'LOGIN_FAILURE':
      return { ...state, loading: false, error: action.payload }
    case 'LOGOUT':
      return { user: null, isAuthenticated: false, loading: false, error: null }
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  const login = async ({ email, password }) => {
    dispatch({ type: 'LOGIN_START' })
    try {
      const result = await authApi.login({ email, password })
      localStorage.setItem('dms-user', JSON.stringify(result.user))
      localStorage.setItem('dms-token', result.token)
      dispatch({ type: 'LOGIN_SUCCESS', payload: result.user })
      return result.user
    } catch (err) {
      dispatch({ type: 'LOGIN_FAILURE', payload: err.message })
      throw err
    }
  }

  const logout = () => {
    localStorage.removeItem('dms-user')
    localStorage.removeItem('dms-token')
    dispatch({ type: 'LOGOUT' })
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
