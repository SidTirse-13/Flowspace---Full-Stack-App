// FILE: src/api/notificationApi.js
import api from './axiosInstance'

// ── Notifications ─────────────────────────────────────────────
export const getNotifications   = ()    => api.get('/api/notifications')
export const getUnreadCount     = ()    => api.get('/api/notifications/unread-count')
export const markAllRead        = ()    => api.put('/api/notifications/read-all')
export const markOneRead        = (id)  => api.put(`/api/notifications/${id}/read`)
export const clearNotifications = ()    => api.delete('/api/notifications')

// ── User Profiles ─────────────────────────────────────────────
export const getUserProfile = (username) => api.get(`/api/users/${username}/profile`)
export const getMyProfile   = ()          => api.get('/api/users/me/profile')
export const mentionSearch  = (query)     => api.get('/api/users/mention-search', { params: { query } })

// ── Workload ──────────────────────────────────────────────────
export const getWorkload = (projectId) => api.get(`/api/projects/${projectId}/workload`)