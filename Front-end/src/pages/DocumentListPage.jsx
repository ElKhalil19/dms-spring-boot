import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { documentsApi, categoriesApi, departmentsApi } from '@/services/api'
import { useDocuments } from '@/context/DocumentContext'
import { useAuth } from '@/context/AuthContext'
import { useDebounce } from '@/hooks/useDebounce'
import Pagination from '@/components/Pagination'
import UploadModal from '@/components/UploadModal'
import { getUserDepartmentIds } from '@/utils/access'

const STATUS_OPTIONS = ['', 'draft', 'published', 'archived']
const STATUS_COLORS = { published: 'status-published', draft: 'status-draft', archived: 'status-archived' }

export default function DocumentListPage() {
  const { filters, setFilters, pagination, setPagination } = useDocuments()
  const { user } = useAuth()
  const [allDocuments, setAllDocuments] = useState([])
  const [categories, setCategories] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [searchInput, setSearchInput] = useState(filters.search)

  const debouncedSearch = useDebounce(searchInput, 400)

  useEffect(() => {
    setFilters({ search: debouncedSearch })
  }, [debouncedSearch, setFilters])

  useEffect(() => {
    loadMeta()
  }, [])

  // Only re-fetch when filter values change, not on every render
  useEffect(() => {
    loadDocuments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.category, filters.status, filters.department])

  async function loadMeta() {
    try {
      const [cats, depts] = await Promise.all([
        categoriesApi.getAll(),
        departmentsApi.getAll(),
      ])
      setCategories(cats)
      setDepartments(depts)
    } catch {
      // Non-critical — filters will just be empty
    }
  }

  async function loadDocuments() {
    setLoading(true)
    setFetchError('')
    try {
      const docs = await documentsApi.getAll()
      setAllDocuments(docs)
    } catch (err) {
      setFetchError(err.message || 'Could not load documents. Make sure the server is running.')
      setAllDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = allDocuments.filter((doc) => {
    if (user?.role !== 'admin') {
      const userDepartmentIds = getUserDepartmentIds(user)
      if (userDepartmentIds.length > 0 && !userDepartmentIds.includes(doc.departmentId)) {
        return false
      }
    }
    const q = filters.search.toLowerCase()
    const matchSearch =
      !q ||
      doc.title.toLowerCase().includes(q) ||
      (doc.description || '').toLowerCase().includes(q)
    const matchCategory = !filters.category || String(doc.categoryId) === String(filters.category)
    const matchStatus = !filters.status || doc.status === filters.status
    const matchDept = !filters.department || String(doc.departmentId) === String(filters.department)
    return matchSearch && matchCategory && matchStatus && matchDept
  })

  const totalItems = filtered.length
  const { page, limit } = pagination
  const paginated = filtered.slice((page - 1) * limit, page * limit)

  useEffect(() => {
    setPagination({ total: totalItems })
  }, [totalItems, setPagination])

  function clearFilters() {
    setSearchInput('')
    setFilters({ search: '', category: '', status: '', department: '' })
  }

  function handleUploadSuccess(newDoc) {
    setAllDocuments((prev) => [newDoc, ...prev])
    setShowUpload(false)
  }

  const getCategoryName = (id) => categories.find((c) => c.id === id)?.name || '—'
  const getDeptName = (id) => departments.find((d) => d.id === id)?.name || '—'

  const hasActiveFilters = filters.search || filters.category || filters.status || filters.department

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Documents</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowUpload(true)}
          data-testid="upload-document-btn"
        >
          ＋ Upload Document
        </button>
      </div>

      {/* Search & Filters Panel */}
      <div className="filters-panel card">
        <input
          className="form-control search-input"
          placeholder="Search by title or description…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          data-testid="search-input"
        />

        <div className="filters-row">
          <select
            className="form-control"
            value={filters.category}
            onChange={(e) => setFilters({ category: e.target.value })}
            data-testid="category-filter"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            className="form-control"
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value })}
            data-testid="status-filter"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Statuses'}</option>
            ))}
          </select>

          <select
            className="form-control"
            value={filters.department}
            onChange={(e) => setFilters({ department: e.target.value })}
            data-testid="department-filter"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button className="btn btn-secondary btn-sm" onClick={clearFilters} data-testid="clear-filters">
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Fetch error */}
      {fetchError && (
        <div className="alert alert-error" data-testid="fetch-error">
          ⚠️ {fetchError}
          <button className="btn btn-sm btn-secondary" style={{ marginLeft: '0.75rem' }} onClick={loadDocuments}>
            Retry
          </button>
        </div>
      )}

      {/* Document List */}
      {loading ? (
        <div className="loading-state" data-testid="loading-spinner">
          <span className="spinner" />
          <span>Loading documents…</span>
        </div>
      ) : paginated.length === 0 ? (
        <div className="empty-state" data-testid="empty-state">
          <span className="empty-icon">📭</span>
          <p className="empty-title">
            {hasActiveFilters ? 'No documents match your filters.' : 'No documents yet.'}
          </p>
          <p className="empty-hint">
            {hasActiveFilters
              ? 'Try adjusting your search or clearing the filters.'
              : 'Upload your first document to get started.'}
          </p>
          {hasActiveFilters && (
            <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="document-grid">
          {paginated.map((doc) => (
            <Link to={`/documents/${doc.id}`} key={doc.id} className="document-card" data-testid="document-card">
              <div className="document-card-header">
                <h2 className="document-title">{doc.title}</h2>
                <span className={`status-badge ${STATUS_COLORS[doc.status] || ''}`}>{doc.status}</span>
              </div>
              <p className="document-desc">{doc.description}</p>
              <div className="document-meta">
                <span>📁 {getCategoryName(doc.categoryId)}</span>
                <span>🏢 {getDeptName(doc.departmentId)}</span>
                <span>v{doc.currentVersion}</span>
              </div>
              {doc.tags?.length > 0 && (
                <div className="tag-list">
                  {doc.tags.map((t) => <span key={t} className="tag">{t}</span>)}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      <Pagination
        totalItems={totalItems}
        itemsPerPage={limit}
        currentPage={page}
        onPageChange={(p) => setPagination({ page: p })}
      />

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  )
}
