import { useState, useEffect } from 'react'
import { departmentsApi, usersApi } from '@/services/api'
import { useToast } from '@/context/ToastContext'

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([])
  const [users, setUsers] = useState([])
  const [selectedDept, setSelectedDept] = useState(null)
  const [assignUserId, setAssignUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [d, u] = await Promise.all([departmentsApi.getAll(), usersApi.getAll()])
      setDepartments(d)
      setUsers(u)
    } catch {
      addToast('Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }

  function getUsersForDept(deptId) {
    return users.filter((u) => u.departmentId === deptId)
  }

  function getUnassignedOrOther(deptId) {
    return users.filter((u) => u.departmentId !== deptId)
  }

  async function handleAssign(e) {
    e.preventDefault()
    if (!assignUserId || !selectedDept) return
    try {
      const updated = await usersApi.update(Number(assignUserId), { departmentId: selectedDept.id })
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      setAssignUserId('')
      addToast(`User assigned to ${selectedDept.name}`, 'success')
    } catch {
      addToast('Failed to assign user', 'error')
    }
  }

  async function handleRemoveUser(userId) {
    try {
      const updated = await usersApi.update(userId, { departmentId: null })
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      addToast('User removed from department', 'success')
    } catch {
      addToast('Failed to remove user', 'error')
    }
  }

  if (loading) return <div className="page-container"><p className="text-muted">Loading…</p></div>

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Departments</h1>
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
