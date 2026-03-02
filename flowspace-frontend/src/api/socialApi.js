// FILE: src/api/socialApi.js
import api from './axiosInstance'

// ── Project Chat ──────────────────────────────────────────────
export const getChatMessages  = (projectId)          => api.get(`/api/projects/${projectId}/chat`)
export const sendChatMessage  = (projectId, message) => api.post(`/api/projects/${projectId}/chat`, { message })
export const deleteChatMessage= (projectId, msgId)   => api.delete(`/api/projects/${projectId}/chat/${msgId}`)

// ── Announcements ─────────────────────────────────────────────
export const getAnnouncements   = (projectId)          => api.get(`/api/projects/${projectId}/announcements`)
export const createAnnouncement = (projectId, content) => api.post(`/api/projects/${projectId}/announcements`, { content })
export const deleteAnnouncement = (projectId, annId)   => api.delete(`/api/projects/${projectId}/announcements/${annId}`)
export const togglePin          = (projectId, annId)   => api.put(`/api/projects/${projectId}/announcements/${annId}/toggle-pin`)

// ── Direct Messages ───────────────────────────────────────────
export const getInbox        = ()                        => api.get('/api/messages/inbox')
export const getConversation = (username)                => api.get(`/api/messages/with/${username}`)
export const sendDM          = (username, message)       => api.post(`/api/messages/send/${username}`, { message })

// ── User Status ───────────────────────────────────────────────
export const setMyStatus    = (status, statusMessage)    => api.put('/api/users/me/status', { status, statusMessage })
export const getUserStatus  = (username)                 => api.get(`/api/users/${username}/status`)
export const getBulkStatuses= (usernames)                => api.post('/api/users/bulk-status', { usernames })

// ── Task Reactions ────────────────────────────────────────────
export const getReactions   = (taskId)                   => api.get(`/api/tasks/${taskId}/reactions`)
export const toggleReaction = (taskId, emoji)            => api.post(`/api/tasks/${taskId}/reactions/${emoji}`)

// ── Time Logs ─────────────────────────────────────────────────
export const logTime              = (taskId, data)       => api.post(`/api/tasks/${taskId}/time-logs`, data)
export const getTimeLogs          = (taskId)             => api.get(`/api/tasks/${taskId}/time-logs`)
export const getTotalHours        = (taskId)             => api.get(`/api/tasks/${taskId}/time-logs/total`)
export const deleteTimeLog        = (logId)              => api.delete(`/api/time-logs/${logId}`)
export const getProjectTimeLogSummary = (projectId)      => api.get(`/api/projects/${projectId}/time-logs/summary`)

// ── Velocity & Reports ────────────────────────────────────────
export const getVelocity          = (projectId)          => api.get(`/api/projects/${projectId}/velocity`)
export const getProjectReport     = (projectId)          => api.get(`/api/projects/${projectId}/report`)