import api from './axiosInstance'

export const getProjects = (page = 0, size = 5) =>
  api.get('/api/projects', { params: { page, size, sort: 'id,desc' } })
export const createProject = (data) => api.post('/api/projects', data)
export const deleteProject = (id) => api.delete(`/api/projects/${id}`)
export const editProject = (id, data) => api.put(`/api/projects/${id}`, data)
export const searchProjects = (query) => api.get('/api/projects/search', { params: { query } })
