import { useState, useEffect } from 'react'
import { categoriesApi, departmentsApi, usersApi } from '@/services/api'
import { useToast } from '@/context/ToastContext'

function getDepartmentIds(user) {
  const ids = Array.isArray(user.departmentIds) ? [...user.departmentIds] : []
  if (user.departmentId && !ids.includes(user.departmentId)) ids.push(user.departmentId)
  return ids
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([])
  const [categories, setCategories] = useState([])
  const [users, setUsers] = useState([])
  const [selectedDept, setSelectedDept] = useState(null)
  const [assignUserId, setAssignUserId] = useState('')
  const [newDepartmentName, setNewDepartmentName] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [d, u, c] = await Promise.all([departmentsApi.getAll(), usersApi.getAll(), categoriesApi.getAll()])
      setDepartments(d)
      setUsers(u)
      setCategories(c)
    } catch (err) {
      addToast(err.message || 'Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }

  function getUsersForDept(deptId) {
    return users.filter((u) => getDepartmentIds(u).includes(deptId))
  }

  function getUnassignedOrOther(deptId) {
    return users.filter((u) => !getDepartmentIds(u).includes(deptId))
  }

  async function handleAssign(e) {
    e.preventDefault()
    if (!assignUserId || !selectedDept) return
    try {
      const selectedUser = users.find((u) => u.id === Number(assignUserId))
      const mergedDepartmentIds = [...new Set([...getDepartmentIds(selectedUser), selectedDept.id])]
      const updated = await usersApi.update(Number(assignUserId), {
        departmentIds: mergedDepartmentIds,
        departmentId: mergedDepartmentIds[0] ?? null,
      })
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      setAssignUserId('')
      addToast(`User assigned to ${selectedDept.name}`, 'success')
    } catch (err) {
      addToast(err.message || 'Failed to assign user', 'error')
    }
  }

  async function handleRemoveUser(userId) {
    try {
      const selectedUser = users.find((u) => u.id === userId)
      const remainingIds = getDepartmentIds(selectedUser).filter((id) => id !== selectedDept.id)
      const updated = await usersApi.update(userId, {
        departmentIds: remainingIds,
        departmentId: remainingIds[0] ?? null,
      })
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      addToast('User removed from department', 'success')
    } catch (err) {
      addToast(err.message || 'Failed to remove user', 'error')
    }
  }

  async function handleCreateDepartment(e) {
    e.preventDefault()
    if (!newDepartmentName.trim()) return
    try {
      const created = await departmentsApi.create({ name: newDepartmentName.trim() })
      setDepartments((prev) => [...prev, created])
      setNewDepartmentName('')
      addToast('Department created', 'success')
    } catch (err) {
      addToast(err.message || 'Failed to create department', 'error')
    }
  }

  async function handleCreateCategory(e) {
    e.preventDefault()
    if (!newCategoryName.trim()) return
    try {
      const created = await categoriesApi.create({ name: newCategoryName.trim() })
      setCategories((prev) => [...prev, created])
      setNewCategoryName('')
      addToast('Category created', 'success')
    } catch (err) {
      addToast(err.message || 'Failed to create category', 'error')
    }
  }

  if (loading) return <div className="page-container"><p className="text-muted">Loading…</p></div>

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Departments</h1>
      </div>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <form className="form-row" onSubmit={handleCreateDepartment} style={{ marginBottom: '1rem' }}>
          <input
            className="form-control"
            placeholder="New department name"
            value={newDepartmentName}
            onChange={(e) => setNewDepartmentName(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">Create Department</button>
        </form>
        <form className="form-row" onSubmit={handleCreateCategory}>
          <input
            className="form-control"
            placeholder="New category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <button className="btn btn-secondary" type="submit">Create Category</button>
        </form>
        <p className="text-muted" style={{ marginTop: '0.75rem' }}>
          Categories: {categories.map((c) => c.name).join(', ') || '—'}
        </p>
      </div>

      <div className="dept-layout">
        {/* Department List */}
        <div className="dept-list">
          {departments.map((d) => (
            <div
              key={d.id}
              className={`card dept-card ${selectedDept?.id === d.id ? 'dept-selected' : ''}`}
              onClick={() => { setSelectedDept(d); setAssignUserId('') }}
              data-testid="dept-card"
            >
              <h3>{d.name}</h3>
              <p className="text-muted">{d.description}</p>
              <p className="dept-count">{getUsersForDept(d.id).length} member(s)</p>
            </div>
          ))}
        </div>

        {/* Department Detail */}
        {selectedDept && (
          <div className="dept-detail">
            <div className="card">
              <h2 className="section-title">{selectedDept.name} — Members</h2>

              {/* Current members */}
              <ul className="member-list">
                {getUsersForDept(selectedDept.id).length === 0 ? (
                  <li className="text-muted">No members assigned yet.</li>
                ) : (
                  getUsersForDept(selectedDept.id).map((u) => (
                    <li key={u.id} className="member-item" data-testid="member-item">
                      <div>
                        <strong>{u.name}</strong>
                        <span className="text-muted"> — {u.email}</span>
                        <span className={`role-badge role-${u.role}`} style={{ marginLeft: '0.5rem' }}>{u.role}</span>
                      </div>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleRemoveUser(u.id)}
                      >
                        Remove
                      </button>
                    </li>
                  ))
                )}
              </ul>

              {/* Assign user */}
              <form className="assign-form" onSubmit={handleAssign}>
                <h3 className="section-title" style={{ marginTop: '1.5rem' }}>Assign User</h3>
                <div className="form-row">
                  <select
                    className="form-control"
                    value={assignUserId}
                    onChange={(e) => setAssignUserId(e.target.value)}
                    data-testid="assign-user-select"
                    required
                  >
                    <option value="">— Select user to assign —</option>
                    {getUnassignedOrOther(selectedDept.id).map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                  <button className="btn btn-primary" type="submit" data-testid="assign-user-btn">
                    Assign
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {!selectedDept && (
          <div className="dept-detail">
            <p className="text-muted" style={{ padding: '2rem' }}>Select a department to manage its members.</p>
          </div>
        )}
      </div>
    </div>
  )
}
