// FILE: src/api/meetingApi.js
import api from './axiosInstance'

export const getMeetings        = ()              => api.get('/api/meetings')
export const getUpcomingMeetings= ()              => api.get('/api/meetings/upcoming')
export const getMeetingById     = (id)            => api.get(`/api/meetings/${id}`)
export const createMeeting      = (data)          => api.post('/api/meetings', data)
export const updateMeeting      = (id, data)      => api.put(`/api/meetings/${id}`, data)
export const deleteMeeting      = (id)            => api.delete(`/api/meetings/${id}`)
export const updateMeetingStatus= (id, status)    => api.patch(`/api/meetings/${id}/status`, { status })
export const getMeetingsByProject=(projectId)     => api.get(`/api/meetings/project/${projectId}`)