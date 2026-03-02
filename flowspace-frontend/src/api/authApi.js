// FIX (Bug #07): Standardized to use the shared axiosInstance instead of raw axios
// with import.meta.env.VITE_API_BASE_URL. Previously authApi.js used a different
// base URL mechanism than all other API files, causing auth calls to fail in
// production without the VITE_API_BASE_URL env var being set.
import api from './axiosInstance'

export const login = async (username, password) => {
  const res = await api.post('/api/auth/login', { username, password })
  return res.data
}

export const register = async (username, email, password, role = 'USER') => {
  const res = await api.post('/api/auth/register', { username, email, password, role })
  return res.data
}

// Feature 5: change password
export const changePassword = (currentPassword, newPassword) =>
  api.post('/api/user/change-password', { currentPassword, newPassword })
