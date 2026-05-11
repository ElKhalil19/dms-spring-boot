const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

function getAuthToken() {
  return localStorage.getItem('dms-token')
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`
  const token = getAuthToken()
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  }
  if (config.body && typeof config.body !== 'string') {
    config.body = JSON.stringify(config.body)
  }
  const response = await fetch(url, config)
  if (!response.ok) {
    const error = await response.text()
    console.error(`API ${config.method || 'GET'} ${url} failed:`, response.status, error)
    throw new Error(error || `HTTP ${response.status}`)
  }
  if (response.status === 204) return null
  const contentType = response.headers.get('content-type') || ''
  return contentType.includes('application/json') ? response.json() : response.text()
}

export const api = {
  get: (path, params) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request(`${path}${query}`)
  },
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
}

// --- Users ---
export const usersApi = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
}

// --- Auth ---
export const authApi = {
  login: (data) => api.post('/auth/login', data),
}

// --- Documents ---
export const documentsApi = {
  getAll: (params) => api.get('/documents', params),
  getById: (id) => api.get(`/documents/${id}`),
  create: (data) => api.post('/documents', data),
  update: (id, data) => api.patch(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`),
}

// --- Versions ---
export const versionsApi = {
  getByDocument: (documentId) => api.get('/versions', { documentId }),
  create: (data) => api.post('/versions', data),
}

// --- Comments ---
export const commentsApi = {
  getByDocument: (documentId) => api.get('/comments', { documentId }),
  create: (data) => api.post('/comments', data),
  delete: (id) => api.delete(`/comments/${id}`),
}

// --- S3 ---
export const s3Api = {
  presignUpload: (data) => api.post('/s3/presign', data),
  presignDownload: (key) => api.get('/s3/presign-download', { key }),
}

// --- Categories ---
export const categoriesApi = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
}

// --- Departments ---
export const departmentsApi = {
  getAll: () => api.get('/departments'),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.patch(`/departments/${id}`, data),
}

// --- Activity Logs ---
export const activityLogsApi = {
  getAll: () => api.get('/activityLogs'), // OK
  create: () => {} // REMOVE THIS or implement backend POST
}
