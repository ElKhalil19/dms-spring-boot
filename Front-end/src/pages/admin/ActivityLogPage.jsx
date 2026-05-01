import { useState, useEffect } from 'react'
import { activityLogsApi, usersApi } from '@/services/api'
import { useToast } from '@/context/ToastContext'

const ACTION_ICONS = { LOGIN: '🔐', LOGOUT: '🚪', UPLOAD: '📤', VIEW: '👁️', COMMENT: '💬', DELETE: '🗑️' }

export default function ActivityLogPage() {
  const [logs, setLogs] = useState([])
  const [users, setUsers] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const { addToast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [logData, userData] = await Promise.all([
        activityLogsApi.getAll(),
        usersApi.getAll(),
      ])
      const userMap = {}
      userData.forEach((u) => { userMap[u.id] = u })
      setUsers(userMap)
      setLogs(logData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
    } catch {
      addToast('Failed to load activity logs', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filtered = filter
    ? logs.filter((l) => l.action === filter)
    : logs

  const actions = [...new Set(logs.map((l) => l.action))]

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Activity Log</h1>
      </div>

      <div className="filters-bar" style={{ marginBottom: '1rem' }}>
        <select
          className="form-control"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All Actions</option>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        {filter && (
          <button className="btn btn-secondary" onClick={() => setFilter('')}>Clear</button>
        )}
      </div>

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id}>
                  <td className="text-muted" style={{ whiteSpace: 'nowrap' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td>{users[log.userId]?.name || `User #${log.userId}`}</td>
                  <td>
                    <span className="action-badge">
                      {ACTION_ICONS[log.action] || '📋'} {log.action}
                    </span>
                  </td>
                  <td>{log.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-muted" style={{ padding: '1rem' }}>No logs found.</p>}
        </div>
      )}
    </div>
  )
}
