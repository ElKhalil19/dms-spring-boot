import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { documentsApi, versionsApi, categoriesApi, departmentsApi, usersApi, activityLogsApi, s3Api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import CommentBox from '@/components/CommentBox'
import { toBrowserAccessiblePresignedUrl } from '@/utils/access'

export default function DocumentDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [doc, setDoc] = useState(null)
  const [versions, setVersions] = useState([])
  const [category, setCategory] = useState(null)
  const [department, setDepartment] = useState(null)
  const [uploader, setUploader] = useState(null)
  const [loading, setLoading] = useState(true)
  const [versionNotes, setVersionNotes] = useState('')
  const [showVersionForm, setShowVersionForm] = useState(false)

  useEffect(() => {
    loadDocument()
  }, [id])

  async function loadDocument() {
    setLoading(true)
    try {
      const docData = await documentsApi.getById(id)
      setDoc(docData)

      const [versionsRes, catsRes, deptsRes, usersRes] = await Promise.allSettled([
        versionsApi.getByDocument(id),
        categoriesApi.getAll(),
        departmentsApi.getAll(),
        usersApi.getAll(),
      ])

      const versionData = versionsRes.status === 'fulfilled' ? versionsRes.value : []
      const cats = catsRes.status === 'fulfilled' ? catsRes.value : []
      const depts = deptsRes.status === 'fulfilled' ? deptsRes.value : []
      const users = usersRes.status === 'fulfilled' ? usersRes.value : []

      setVersions(versionData.sort((a, b) => b.version - a.version))
      setCategory(cats.find((c) => c.id === docData.categoryId))
      setDepartment(depts.find((d) => d.id === docData.departmentId))
      setUploader(users.find((u) => u.id === docData.uploadedBy))

      try {
        await activityLogsApi.create({
          userId: user.id,
          action: 'VIEW',
          description: `Viewed ${docData.title}`,
          createdAt: new Date().toISOString(),
        })
      } catch {
        // ignore activity log failures
      }
    } catch {
      addToast('Failed to load document', 'error')
      navigate('/documents')
    } finally {
      setLoading(false)
    }
  }

  async function handleUploadVersion(e) {
    e.preventDefault()
    if (!versionNotes.trim()) return
    try {
      const nextVersion = (doc.currentVersion || 0) + 1
      const newVersion = await versionsApi.create({
        documentId: Number(id),
        version: nextVersion,
        uploadedBy: user.id,
        createdAt: new Date().toISOString(),
        notes: versionNotes.trim(),
        fileSize: 'N/A',
      })
      const updatedDoc = await documentsApi.update(id, { currentVersion: nextVersion, updatedAt: new Date().toISOString() })
      setDoc(updatedDoc)
      setVersions((prev) => [newVersion, ...prev])
      setVersionNotes('')
      setShowVersionForm(false)
      addToast(`Version ${nextVersion} uploaded!`, 'success')

      await activityLogsApi.create({
        userId: user.id,
        action: 'UPLOAD',
        description: `Uploaded ${doc.title} v${nextVersion}`,
        createdAt: new Date().toISOString(),
      })
    } catch {
      addToast('Failed to upload version', 'error')
    }
  }

  async function handleRestoreVersion(v) {
    try {
      const updatedDoc = await documentsApi.update(id, { currentVersion: v.version, updatedAt: new Date().toISOString() })
      setDoc(updatedDoc)
      addToast(`Restored to version ${v.version}`, 'success')
    } catch {
      addToast('Failed to restore version', 'error')
    }
  }

  async function handleDownload() {
    if (!doc?.s3Key) {
      addToast('No file is attached to this document', 'error')
      return
    }
    try {
      const data = await s3Api.presignDownload(doc.s3Key)
      window.open(toBrowserAccessiblePresignedUrl(data.downloadUrl), '_blank', 'noopener,noreferrer')
    } catch (err) {
      addToast(err.message || 'Failed to prepare download', 'error')
    }
  }

  if (loading) return <div className="page-container"><p className="text-muted">Loading…</p></div>
  if (!doc) return null

  const STATUS_COLORS = { published: 'status-published', draft: 'status-draft', archived: 'status-archived' }

  return (
    <div className="page-container">
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate('/documents')}>← Back</button>
        <h1>{doc.translatedTitle || doc.title}</h1>
        <span className={`status-badge ${STATUS_COLORS[doc.status] || ''}`}>{doc.status}</span>
        <button className="btn btn-primary btn-sm" onClick={handleDownload}>Download</button>
      </div>

      <div className="detail-grid">
        {/* Main Info */}
        <div className="detail-main">
          <div className="card">
            <p className="document-desc">{doc.description}</p>
            <div className="meta-grid">
              <div><span className="meta-label">Category</span><span>{category?.name || '—'}</span></div>
              <div><span className="meta-label">Department</span><span>{department?.name || '—'}</span></div>
              <div><span className="meta-label">Uploaded By</span><span>{uploader?.name || '—'}</span></div>
              <div><span className="meta-label">Current Version</span><span>v{doc.currentVersion}</span></div>
              <div><span className="meta-label">Created</span><span>{new Date(doc.createdAt).toLocaleDateString()}</span></div>
              <div><span className="meta-label">Updated</span><span>{new Date(doc.updatedAt).toLocaleDateString()}</span></div>
            </div>
            {doc.tags?.length > 0 && (
              <div className="tag-list" style={{ marginTop: '1rem' }}>
                {doc.tags.map((t) => <span key={t} className="tag">{t}</span>)}
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <CommentBox documentId={Number(id)} currentUser={user} />
          </div>
        </div>

        {/* Version History Sidebar */}
        <div className="detail-sidebar">
          <div className="card">
            <div className="version-header">
              <h3 className="section-title">Version History</h3>
              <button className="btn btn-primary btn-sm" onClick={() => setShowVersionForm((v) => !v)}>
                {showVersionForm ? 'Cancel' : '+ New Version'}
              </button>
            </div>

            {showVersionForm && (
              <form className="version-form" onSubmit={handleUploadVersion}>
                <textarea
                  className="form-control"
                  placeholder="Version notes (e.g. what changed)…"
                  value={versionNotes}
                  onChange={(e) => setVersionNotes(e.target.value)}
                  rows={2}
                  required
                />
                <button className="btn btn-primary" type="submit">Upload Version</button>
              </form>
            )}

            <ul className="version-list">
              {versions.map((v) => (
                <li key={v.id} className={`version-item ${v.version === doc.currentVersion ? 'version-current' : ''}`}>
                  <div className="version-number">
                    v{v.version}
                    {v.version === doc.currentVersion && <span className="version-badge">current</span>}
                  </div>
                  <div className="version-notes">{v.notes}</div>
                  <div className="version-meta">
                    <span>{new Date(v.createdAt).toLocaleDateString()}</span>
                    <span>{v.fileSize}</span>
                  </div>
                  {v.version !== doc.currentVersion && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleRestoreVersion(v)}
                    >
                      Restore
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
