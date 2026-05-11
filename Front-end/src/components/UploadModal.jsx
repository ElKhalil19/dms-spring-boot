import { useState, useRef, useEffect } from 'react'
import { documentsApi, categoriesApi, departmentsApi, s3Api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'

function getAllowedDepartmentIds(user) {
  if (!user) return []
  const ids = Array.isArray(user.departmentIds) ? [...user.departmentIds] : []
  if (user.departmentId && !ids.includes(user.departmentId)) ids.push(user.departmentId)
  return ids
}

function toBrowserAccessiblePresignedUrl(url) {
  try {
    const parsed = new URL(url)
    if (parsed.host === 'localhost:9000' || parsed.host === 'minio:9000') {
      return `${window.location.origin}/minio${parsed.pathname}${parsed.search}`
    }
    return url
  } catch {
    return url
  }
}

export default function UploadModal({ onClose, onSuccess }) {
  const { user } = useAuth()

  const [categories, setCategories] = useState([])
  const [departments, setDepartments] = useState([])
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    departmentId: '',
    status: 'draft',
    tags: '',
  })

  const fileInputRef = useRef(null)

  useEffect(() => {
    Promise.all([categoriesApi.getAll(), departmentsApi.getAll()])
      .then(([cats, depts]) => {
        setCategories(cats)
        if (user?.role === 'admin') {
          setDepartments(depts)
          return
        }
        const allowed = getAllowedDepartmentIds(user)
        const filtered = depts.filter((d) => allowed.includes(d.id))
        setDepartments(filtered)
        if (filtered.length === 1) {
          setForm((f) => ({ ...f, departmentId: String(filtered[0].id) }))
        }
      })
      .catch(() => {})
  }, [user])

  function handleField(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleFile(file) {
    if (file) {
      setFile(file)
      setFileName(file.name)
      if (!form.title) {
        const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
        setForm((f) => ({ ...f, title: name }))
      }
    }
  }

  function handleFileInput(e) {
    handleFile(e.target.files[0])
  }

  function handleDragOver(e) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!file) {
      setError('Please select a file to upload.')
      return
    }

    if (!form.title.trim()) {
      setError('Title is required.')
      return
    }

    setSubmitting(true)
    try {
      const presign = await s3Api.presignUpload({
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
      })
      
      const uploadRes = await fetch(toBrowserAccessiblePresignedUrl(presign.uploadUrl), {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      })
      
      if (!uploadRes.ok) {
        throw new Error('File upload failed')
      }


      const tags = form.tags
        ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : []

      const now = new Date().toISOString()
      const doc = await documentsApi.create({
        title: form.title.trim(),
        description: form.description.trim(),
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        status: form.status,
        tags,
        uploadedBy: user?.id || null,
        fileName: file.name,
        s3Key: presign.key,
        currentVersion: 1,
        createdAt: now,
        updatedAt: now,
      })
      onSuccess(doc)
    } catch (err) {
      setError(err.message || 'Failed to upload document. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} data-testid="upload-modal">
      <div className="modal-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="upload-modal-title">
        <div className="modal-header">
          <h2 id="upload-modal-title" className="modal-title">Upload Document</h2>
          <button className="btn btn-ghost btn-sm modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {error && <div className="alert alert-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Drop Zone */}
          <div
            className={`drop-zone${dragging ? ' drop-zone-active' : ''}${fileName ? ' drop-zone-filled' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            data-testid="drop-zone"
          >
            <input
              ref={fileInputRef}
              type="file"
              className="drop-zone-input"
              onChange={handleFileInput}
              data-testid="file-input"
            />
            {fileName ? (
              <span className="drop-zone-name">📄 {fileName}</span>
            ) : (
              <>
                <span className="drop-zone-icon">⬆️</span>
                <span className="drop-zone-label">Drag &amp; drop a file here, or <u>click to browse</u></span>
              </>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="upload-title">Title <span aria-hidden="true">*</span></label>
            <input
              id="upload-title"
              className="form-control"
              name="title"
              value={form.title}
              onChange={handleField}
              placeholder="Document title"
              required
              data-testid="upload-title"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="upload-desc">Description</label>
            <textarea
              id="upload-desc"
              className="form-control"
              name="description"
              value={form.description}
              onChange={handleField}
              placeholder="Brief description (optional)"
              rows={2}
              data-testid="upload-description"
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="upload-category">Category</label>
              <select
                id="upload-category"
                className="form-control"
                name="categoryId"
                value={form.categoryId}
                onChange={handleField}
                data-testid="upload-category"
              >
                <option value="">— Select category —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="upload-dept">Department</label>
              <select
                id="upload-dept"
                className="form-control"
                name="departmentId"
                value={form.departmentId}
                onChange={handleField}
                data-testid="upload-department"
              >
                <option value="">— Select department —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="upload-status">Status</label>
              <select
                id="upload-status"
                className="form-control"
                name="status"
                value={form.status}
                onChange={handleField}
                data-testid="upload-status"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="upload-tags">Tags</label>
              <input
                id="upload-tags"
                className="form-control"
                name="tags"
                value={form.tags}
                onChange={handleField}
                placeholder="tag1, tag2, …"
                data-testid="upload-tags"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting} data-testid="upload-submit">
              {submitting ? 'Uploading…' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
