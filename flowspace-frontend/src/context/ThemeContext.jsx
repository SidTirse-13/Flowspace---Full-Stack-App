// FILE: src/context/ThemeContext.jsx
// Global dark/light theme using CSS custom properties
// This makes theme apply everywhere — ProjectDetail, Dashboard, all pages
import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem('fs-theme') !== 'light'  // default dark
  )

  // Apply CSS variables to :root — all pages read from these
  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.style.setProperty('--bg',       '#0a0b0e')
      root.style.setProperty('--surface',  '#12141a')
      root.style.setProperty('--surface2', '#1a1d26')
      root.style.setProperty('--border',   '#252836')
      root.style.setProperty('--text',     '#e8eaf0')
      root.style.setProperty('--muted',    '#7a7f95')
      root.style.setProperty('--dim',      '#5a6080')
      root.style.setProperty('--card',     '#12141a')
      root.style.setProperty('--input',    '#1a1d26')
      root.style.setProperty('--nav',      '#12141a')
      document.body.style.background = '#0a0b0e'
      document.body.style.color      = '#e8eaf0'
    } else {
      root.style.setProperty('--bg',       '#f0f2f8')
      root.style.setProperty('--surface',  '#ffffff')
      root.style.setProperty('--surface2', '#f5f7fc')
      root.style.setProperty('--border',   '#dde2f0')
      root.style.setProperty('--text',     '#1a1d2e')
      root.style.setProperty('--muted',    '#5a6080')
      root.style.setProperty('--dim',      '#8a90aa')
      root.style.setProperty('--card',     '#ffffff')
      root.style.setProperty('--input',    '#f0f2f8')
      root.style.setProperty('--nav',      '#ffffff')
      document.body.style.background = '#f0f2f8'
      document.body.style.color      = '#1a1d2e'
    }
    localStorage.setItem('fs-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const toggleTheme = () => setIsDark(d => !d)

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
