//─────────────────────────────────────────────────────────────────
// FILE: src/pages/LoginPage.jsx
// CHANGES:
//   - Added show/hide password toggle button (eye icon)
//   - Password field switches between type="password" and type="text"
// ─────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { login as loginApi } from '../api/authApi'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [username, setUsername]         = useState('')
  const [password, setPassword]         = useState('')
  const [loading, setLoading]           = useState(false)
  const [showPassword, setShowPassword] = useState(false) // toggle show/hide

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      const response = await loginApi(username, password)
      // Backend returns { token, username, role, email } as a JSON object
      const jwtToken = response?.token || response
      const userRole = response?.role || 'USER'
      const actualUsername = response?.username || username
      login(jwtToken, actualUsername, userRole)
      toast.success(`Welcome back, ${actualUsername}! 🎉`)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data || 'Login failed. Try again.'
      toast.error(typeof msg === 'object' ? msg.message || 'Login failed.' : msg)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    background: '#1a1d26',
    border: '1px solid #252836',
    borderRadius: 10,
    padding: '0.85rem 1rem',
    color: '#e8eaf0',
    fontSize: '0.9rem',
    fontFamily: 'Outfit, sans-serif',
    outline: 'none',
    transition: 'border-color 0.2s',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0b0e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div className="animate-fade-in" style={{
        background: '#12141a',
        border: '1px solid #252836',
        borderRadius: 20,
        padding: '2.5rem',
        width: '100%',
        maxWidth: 420,
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56,
            background: 'linear-gradient(135deg, #6c63ff, #00d4aa)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: 800, color: 'white',
            margin: '0 auto 1rem',
          }}>
            PM
          </div>
          <h1 style={{ color: '#e8eaf0', fontSize: '1.5rem', fontWeight: 700 }}>Welcome back</h1>
          <p style={{ color: '#7a7f95', marginTop: '0.35rem', fontSize: '0.875rem' }}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Username */}
          <div>
            <label style={{ color: '#7a7f95', fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
              USERNAME
            </label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#6c63ff'}
              onBlur={e => e.target.style.borderColor = '#252836'}
            />
          </div>

          {/* Password with show/hide toggle */}
          <div>
            <label style={{ color: '#7a7f95', fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
              PASSWORD
            </label>
            {/* Wrapper: input + toggle button side by side */}
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  ...inputStyle,
                  paddingRight: '3rem', // leave room for the eye button
                }}
                onFocus={e => e.target.style.borderColor = '#6c63ff'}
                onBlur={e => e.target.style.borderColor = '#252836'}
              />

              {/* Eye toggle button — sits inside the input on the right */}
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                title={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  color: showPassword ? '#6c63ff' : '#7a7f95',
                  padding: '0.2rem',
                  lineHeight: 1,
                  transition: 'color 0.15s',
                  userSelect: 'none',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#a09bff'}
                onMouseLeave={e => e.currentTarget.style.color = showPassword ? '#6c63ff' : '#7a7f95'}
              >
                {/* 👁 = show, 🙈 = hide */}
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            {/* Hint text below password */}
            <p style={{ color: '#4a4f65', fontSize: '0.72rem', marginTop: '0.35rem' }}>
              {showPassword ? '🔓 Password is visible' : '🔒 Password is hidden — click 👁️ to reveal'}
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#2a2d3e' : 'linear-gradient(135deg, #6c63ff, #5a52d5)',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              padding: '0.9rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Outfit, sans-serif',
              transition: 'all 0.2s',
              marginTop: '0.5rem',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#7a7f95', fontSize: '0.875rem' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#6c63ff', textDecoration: 'none', fontWeight: 600 }}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}