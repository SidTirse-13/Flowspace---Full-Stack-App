// ─────────────────────────────────────────────────────────────────
// FILE: src/api/memberApi.js
// Members, project chat, and admin user management
// ─────────────────────────────────────────────────────────────────
import api from './axiosInstance'

// ── PROJECT MEMBERS ───────────────────────────────────────────────
export const getMembers    = (projectId)           => api.get(`/api/projects/${projectId}/members`)
export const inviteMember  = (projectId, data)     => api.post(`/api/projects/${projectId}/members`, data)
export const removeMember  = (projectId, username) => api.delete(`/api/projects/${projectId}/members/${username}`)
export const searchInvitableUsers = (projectId, query) =>
  api.get(`/api/projects/${projectId}/members/search`, { params: { query } })

// ── PROJECT CHAT ──────────────────────────────────────────────────
export const getChatMessages = (projectId)              => api.get(`/api/projects/${projectId}/chat`)
export const sendChatMessage = (projectId, message)     => api.post(`/api/projects/${projectId}/chat`, { message })
export const deleteChatMessage = (projectId, messageId) => api.delete(`/api/projects/${projectId}/chat/${messageId}`)

// ── ADMIN — USER MANAGEMENT ───────────────────────────────────────
export const adminGetAllUsers  = ()           => api.get('/api/admin/users')
export const adminSearchUsers  = (query)      => api.get('/api/admin/users/search', { params: { query } })
export const adminDeleteUser   = (userId)     => api.delete(`/api/admin/users/${userId}`)
export const adminUpdateRole   = (userId, role) => api.put(`/api/admin/users/${userId}/role`, { role })
