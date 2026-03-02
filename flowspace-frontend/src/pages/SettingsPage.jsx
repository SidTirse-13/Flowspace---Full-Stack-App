// FILE: src/pages/SettingsPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/shared/Navbar'
import { changePassword } from '../api/authApi'

export default function SettingsPage() {
  const navigate = useNavigate()
  const [form, setForm]       = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [show, setShow]       = useState({ current: false, new: false, confirm: false })
  const [saving, setSaving]   = useState(false)

  const token = localStorage.getItem('token') || ''
  const username = (() => {
    try {
      return token ? JSON.parse(atob(token.split('.')[1])).sub : 'User'
    } catch (err) {
      console.error('JWT decode error:', err)
      return 'User'
    }
  })()

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async () => {
    console.log('Change password clicked')
    
    if (!form.currentPassword) {
      toast.error('Enter your current password')
      return
    }
    if (form.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    console.log('Sending password change request...')
    setSaving(true)
    
    try {
      const response = await changePassword(form.currentPassword, form.newPassword)
      console.log('Password change response:', response)
      
      toast.success('Password changed! Please log in again.')
      localStorage.removeItem('token')
      
      setTimeout(() => {
        navigate('/login')
      }, 1500)
      
    } catch (err) {
      console.error('Password change error:', err)
      console.error('Error response:', err.response)
      
      let errorMsg = 'Failed to change password'
      
      if (err.response?.data) {
        // Backend returned error message
        errorMsg = typeof err.response.data === 'string' 
          ? err.response.data 
          : err.response.data.message || errorMsg
      } else if (err.message) {
        errorMsg = err.message
      }
      
      toast.error(errorMsg)
      setSaving(false)
    }
  }

  const inp = {
    width: '100%', background: '#1a1d26', border: '1px solid #252836',
    borderRadius: 10, padding: '0.75rem 1rem', color: '#e8eaf0',
    fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem', outline: 'none',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0b0e' }}>
      <Navbar />
      <main style={{ maxWidth: 520, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <h1 style={{ color: '#e8eaf0', fontWeight: 800, fontSize: '1.6rem', marginBottom: '.3rem' }}>
          ⚙️ Settings
        </h1>
        <p style={{ color: '#5a6080', fontSize: '.85rem', marginBottom: '2.5rem' }}>
          Manage your account preferences
        </p>

        {/* Account Info card */}
        <div style={{ background: '#12141a', border: '1px solid #252836', borderRadius: 16, padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
          <p style={{ color: '#5a6080', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.9rem' }}>
            👤 Account Info
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'linear-gradient(135deg,#6c63ff,#00d4aa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, color: '#fff', fontSize: '1rem',
            }}>
              {username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p style={{ color: '#e8eaf0', fontWeight: 700 }}>{username}</p>
              <p style={{ color: '#5a6080', fontSize: '.78rem' }}>Logged in via JWT</p>
            </div>
          </div>
        </div>

        {/* Change Password card */}
        <div style={{ background: '#12141a', border: '1px solid #252836', borderRadius: 16, padding: '1.5rem' }}>
          <p style={{ color: '#5a6080', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '1.25rem' }}>
            🔒 Change Password
          </p>

          {[
            { label: 'Current Password',  name: 'currentPassword', key: 'current' },
            { label: 'New Password',       name: 'newPassword',     key: 'new' },
            { label: 'Confirm New Password', name: 'confirmPassword', key: 'confirm' },
          ].map(({ label, name, key }) => (
            <div key={name} style={{ marginBottom: '1rem' }}>
              <label style={{ color: '#7a7f95', fontSize: '.78rem', fontWeight: 600, display: 'block', marginBottom: '.4rem' }}>
                {label}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={show[key] ? 'text' : 'password'}
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  placeholder={label}
                  style={{ ...inp, paddingRight: '2.8rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShow(s => ({ ...s, [key]: !s[key] }))}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#5a6080' }}
                >
                  {show[key] ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              width: '100%', marginTop: '.5rem',
              background: saving ? '#1a1d26' : 'linear-gradient(135deg,#6c63ff,#5a52e0)',
              border: 'none', borderRadius: 10, padding: '.85rem',
              color: saving ? '#5a6080' : '#fff', fontWeight: 700, fontSize: '.9rem',
              cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Outfit, sans-serif',
            }}
          >
            {saving ? 'Saving...' : '🔒 Change Password'}
          </button>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          style={{ marginTop: '1.25rem', background: 'none', border: 'none', color: '#5a6080', cursor: 'pointer', fontSize: '.85rem', fontFamily: 'Outfit, sans-serif' }}
        >
          ← Back to Dashboard
        </button>
      </main>
    </div>
  )
}