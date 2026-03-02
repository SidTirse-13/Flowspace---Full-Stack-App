// ─────────────────────────────────────────────────────────────────
// FILE: src/pages/RegisterPage.jsx
// PURPOSE: Register a new user account
//
// Sends: { username, email, password, role }
// Role is hardcoded to "USER" (you can add a dropdown if needed)
// On success → redirect to /login
// ─────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { register as registerApi } from '../api/authApi'

export default function RegisterPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)

  // Update any field in the form object
  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!form.username || !form.email || !form.password) {
      toast.error('Please fill in all fields')
      return
    }

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match!')
      return
    }

    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      await registerApi(form.username, form.email, form.password, 'USER')
      toast.success('Account created! Please login.')
      navigate('/login')

    } catch (err) {
      const msg = err.response?.data || 'Registration failed. Try again.'
      toast.error(msg)

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
  }

  const labelStyle = {
    color: '#7a7f95',
    fontSize: '0.8rem',
    fontWeight: 600,
    display: 'block',
    marginBottom: '0.4rem',
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0b0e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          background: '#12141a',
          border: '1px solid #252836',
          borderRadius: 20,
          padding: '2.5rem',
          width: '100%',
          maxWidth: 440,
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ color: '#e8eaf0', fontSize: '1.5rem', fontWeight: 700 }}>
            Create Account
          </h1>
          <p style={{ color: '#7a7f95', marginTop: '0.35rem', fontSize: '0.875rem' }}>
            Join ProjectFlow and start managing your projects
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <div>
            <label style={labelStyle}>USERNAME</label>
            <input
              type="text"
              placeholder="Choose a username"
              value={form.username}
              onChange={handleChange('username')}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#6c63ff'}
              onBlur={e => e.target.style.borderColor = '#252836'}
            />
          </div>

          <div>
            <label style={labelStyle}>EMAIL</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={handleChange('email')}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#6c63ff'}
              onBlur={e => e.target.style.borderColor = '#252836'}
            />
          </div>

          <div>
            <label style={labelStyle}>PASSWORD</label>
            <input
              type="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={handleChange('password')}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#6c63ff'}
              onBlur={e => e.target.style.borderColor = '#252836'}
            />
          </div>

          <div>
            <label style={labelStyle}>CONFIRM PASSWORD</label>
            <input
              type="password"
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={handleChange('confirmPassword')}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#6c63ff'}
              onBlur={e => e.target.style.borderColor = '#252836'}
            />
          </div>

          {/* Role hint */}
          <div
            style={{
              background: 'rgba(108,99,255,0.08)',
              border: '1px solid rgba(108,99,255,0.2)',
              borderRadius: 8,
              padding: '0.75rem 1rem',
              color: '#a09bff',
              fontSize: '0.8rem',
            }}
          >
            ℹ️ Your role will be set to <strong>USER</strong> by default.
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#2a2d3e' : 'linear-gradient(135deg, #00d4aa, #00a884)',
              color: loading ? '#7a7f95' : '#0a0b0e',
              border: 'none',
              borderRadius: 10,
              padding: '0.9rem',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Outfit, sans-serif',
              marginTop: '0.5rem',
            }}
          >
            {loading ? 'Creating account...' : 'Create Account →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#7a7f95', fontSize: '0.875rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#6c63ff', textDecoration: 'none', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
