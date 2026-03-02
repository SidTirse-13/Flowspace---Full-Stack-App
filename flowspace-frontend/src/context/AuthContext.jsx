// FILE: src/context/AuthContext.jsx
import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [token,    setToken]    = useState(() => localStorage.getItem('token')    || null)
  const [username, setUsername] = useState(() => localStorage.getItem('username') || null)
  const [role,     setRole]     = useState(() => localStorage.getItem('role')     || 'USER')

  // Called after login — backend returns { token, username, role }
  // Pass all three here so role is always correct
  const login = (jwtToken, user, userRole = 'USER') => {
    // Safely extract string token in case an object was passed accidentally
    const cleanToken = typeof jwtToken === 'object' ? (jwtToken?.token || '') : jwtToken
    const cleanRole  = (userRole || 'USER').toUpperCase()

    localStorage.setItem('token',    cleanToken)
    localStorage.setItem('username', user)
    localStorage.setItem('role',     cleanRole)

    setToken(cleanToken)
    setUsername(user)
    setRole(cleanRole)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('role')
    setToken(null)
    setUsername(null)
    setRole('USER')
  }

  return (
    <AuthContext.Provider value={{
      token,
      username,
      role,
      login,
      logout,
      isLoggedIn: !!token,
      isAdmin:    role === 'ADMIN',
      isPM:       role === 'ADMIN' || role === 'PROJECT_MANAGER',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
