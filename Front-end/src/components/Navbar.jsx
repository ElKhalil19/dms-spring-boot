import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/documents" className="navbar-logo">📄 DMS</Link>
      </div>
      <div className="navbar-links">
        <Link to="/documents">Documents</Link>
        {user?.role === 'admin' && (
          <>
            <Link to="/admin/users">Users</Link>
            <Link to="/admin/departments">Departments</Link>
            <Link to="/admin/activity">Activity Log</Link>
          </>
        )}
      </div>
      <div className="navbar-actions">
        <button
          className="btn btn-ghost"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        {user && (
          <span className="navbar-user">
            <span className="user-badge">{user.role === 'admin' ? '👑' : '👤'}</span>
            {user.name}
          </span>
        )}
        <button className="btn btn-secondary" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  )
}
