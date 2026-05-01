import { Navigate, Routes, Route } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Layout from '@/components/Layout'
import LoginPage from '@/pages/LoginPage'
import DocumentListPage from '@/pages/DocumentListPage'
import DocumentDetailPage from '@/pages/DocumentDetailPage'
import UsersPage from '@/pages/admin/UsersPage'
import DepartmentsPage from '@/pages/admin/DepartmentsPage'
import ActivityLogPage from '@/pages/admin/ActivityLogPage'

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function RequireAdmin({ children }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'admin') return <Navigate to="/documents" replace />
  return children
}

const NotFound = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h2>404 – Page Not Found</h2>
    <a href="/documents">Go to Documents</a>
  </div>
)

function AppRouter() {
  const { isAuthenticated } = useAuth()
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/documents" replace /> : <LoginPage />} />

      {/* Authenticated */}
      <Route path="/" element={<Navigate to="/documents" replace />} />
      <Route
        path="/documents"
        element={
          <RequireAuth>
            <Layout><DocumentListPage /></Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/documents/:id"
        element={
          <RequireAuth>
            <Layout><DocumentDetailPage /></Layout>
          </RequireAuth>
        }
      />

      {/* Admin */}
      <Route
        path="/admin/users"
        element={
          <RequireAdmin>
            <Layout><UsersPage /></Layout>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/departments"
        element={
          <RequireAdmin>
            <Layout><DepartmentsPage /></Layout>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/activity"
        element={
          <RequireAdmin>
            <Layout><ActivityLogPage /></Layout>
          </RequireAdmin>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRouter
