import api from './axiosInstance'

export const getMyTasks = () => api.get('/api/tasks/my-tasks')
export const getTasks = (projectId) => api.get(`/api/projects/${projectId}/tasks`)
export const searchTasks = (projectId, query = '', status = '') =>
  api.get(`/api/projects/${projectId}/tasks/search`, { params: { query, status } })
export const createTask = (projectId, taskData) =>
  api.post(`/api/projects/${projectId}/tasks`, taskData)

// FIX (Bug #03): editTask now includes clearDependency flag so the backend knows
// when to explicitly remove a dependency (vs just not updating it).
export const editTask = (projectId, taskId, taskData) => {
  const payload = { ...taskData }
  // If dependsOnTaskId is null and the user explicitly cleared it, signal the backend.
  if (taskData.dependsOnTaskId === null || taskData.dependsOnTaskId === undefined) {
    payload.clearDependency = true
    payload.dependsOnTaskId = null
  } else {
    payload.clearDependency = false
  }
  return api.put(`/api/projects/${projectId}/tasks/${taskId}`, payload)
}

export const updateTaskStatus = (projectId, taskId, newStatus) =>
  api.put(`/api/projects/${projectId}/tasks/${taskId}/status`, null, { params: { status: newStatus } })
export const assignTask = (projectId, taskId, username) =>
  api.put(`/api/projects/${projectId}/tasks/${taskId}/assign`, { username })
export const deleteTask = (projectId, taskId) =>
  api.delete(`/api/projects/${projectId}/tasks/${taskId}`)
export const getComments = (projectId, taskId) =>
  api.get(`/api/projects/${projectId}/tasks/${taskId}/comments`)
export const addComment = (projectId, taskId, content) =>
  api.post(`/api/projects/${projectId}/tasks/${taskId}/comments`, { content })
export const deleteComment = (projectId, taskId, commentId) =>
  api.delete(`/api/projects/${projectId}/tasks/${taskId}/comments/${commentId}`)
export const getAnalytics = (projectId) => api.get(`/api/projects/${projectId}/analytics`)
export const getGanttData = (projectId) => api.get(`/api/projects/${projectId}/gantt`)
export const getCriticalPath = (projectId) => api.get(`/api/projects/${projectId}/critical-path`)
export const getSlack = (projectId) => api.get(`/api/projects/${projectId}/slack`)
export const getWorkload = (projectId) => api.get(`/api/projects/${projectId}/workload`)

// ── Attachments (Feature 9) ───────────────────────────────────────
export const getAttachments = (projectId, taskId) =>
  api.get(`/api/projects/${projectId}/tasks/${taskId}/attachments`)

export const uploadAttachment = (projectId, taskId, file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post(
    `/api/projects/${projectId}/tasks/${taskId}/attachments`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
}

export const downloadAttachment = (projectId, taskId, attachmentId, fileName) =>
  api.get(
    `/api/projects/${projectId}/tasks/${taskId}/attachments/${attachmentId}`,
    { responseType: 'blob' }
  ).then(response => {
    const url  = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href  = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  })

export const deleteAttachment = (projectId, taskId, attachmentId) =>
  api.delete(`/api/projects/${projectId}/tasks/${taskId}/attachments/${attachmentId}`)

// ── Audit Logs (Feature 11) ───────────────────────────────────────
export const getTaskAuditLogs    = (taskId)    => api.get(`/api/audit/task/${taskId}`)
export const getProjectAuditLogs = (projectId) => api.get(`/api/audit/project/${projectId}`)
export const getMyAuditLogs      = ()          => api.get('/api/audit/me')
