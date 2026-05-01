import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading, error } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await login({ email, password })
      addToast('Login successful! Welcome back.', 'success')
      navigate('/documents')
    } catch {
      // error shown from context
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">📄 Document Management System</h1>
        <p className="login-subtitle">Sign in to your account</p>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="login-hint">
          <p><strong>Demo credentials:</strong></p>
          <p>Admin: admin@dms.com / admin123</p>
          <p>User: bob@dms.com / user123</p>
        </div>
      </div>
    </div>
  )
}
