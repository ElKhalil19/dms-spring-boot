import { useState, useEffect } from 'react'
import { usersApi, departmentsApi } from '@/services/api'
import { useToast } from '@/context/ToastContext'
import Pagination from '@/components/Pagination'

const ROLES = ['user', 'admin']
const EMPTY_FORM = { name: '', email: '', password: '', role: 'user', departmentId: '', status: 'active' }

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 5
  const { addToast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [u, d] = await Promise.all([usersApi.getAll(), departmentsApi.getAll()])
      setUsers(u)
      setDepartments(d)
    } catch {
      addToast('Failed to load users', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddUser(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const newUser = await usersApi.create({
        ...form,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
      })
      setUsers((prev) => [...prev, newUser])
      setForm(EMPTY_FORM)
      addToast(`User ${newUser.name} added!`, 'success')
    } catch {
      addToast('Failed to add user', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this user?')) return
    try {
      await usersApi.delete(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
      addToast('User deleted', 'success')
    } catch {
      addToast('Failed to delete user', 'error')
    }
  }

  const getDeptName = (id) => departments.find((d) => d.id === id)?.name || '—'
  const paginated = users.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>User Management</h1>
      </div>

      {/* Users Table */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        {loading ? (
          <p className="text-muted">Loading users…</p>
        ) : (
          <>
            <table className="data-table" data-testid="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((u) => (
                  <tr key={u.id} data-testid="user-row">
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
                    <td>{getDeptName(u.departmentId)}</td>
                    <td>{u.status}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(u.id)}
                        data-testid="delete-user-btn"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              totalItems={users.length}
              itemsPerPage={ITEMS_PER_PAGE}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Add User Form */}
      <div className="card">
        <h2 className="section-title">Add New User</h2>
        <form className="form-grid" onSubmit={handleAddUser} data-testid="add-user-form">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-control"
              placeholder="Jane Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              data-testid="user-name-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-control"
              type="email"
              placeholder="jane@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              data-testid="user-email-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-control"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select
              className="form-control"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              data-testid="user-role-select"
            >
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Department</label>
            <select
              className="form-control"
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              data-testid="user-dept-select"
            >
              <option value="">— Select Department —</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="form-group form-full">
            <button
              className="btn btn-primary"
              type="submit"
              disabled={submitting}
              data-testid="add-user-submit"
            >
              {submitting ? 'Adding…' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
