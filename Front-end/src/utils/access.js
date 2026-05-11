export function getUserDepartmentIds(user) {
  if (!user) return []
  const ids = Array.isArray(user.departmentIds) ? [...user.departmentIds] : []
  if (user.departmentId && !ids.includes(user.departmentId)) ids.push(user.departmentId)
  return ids
}

export function toBrowserAccessiblePresignedUrl(url) {
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
