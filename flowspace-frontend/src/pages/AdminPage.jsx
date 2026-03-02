// FILE: src/pages/AdminPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/shared/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axiosInstance'

const ROLE_COLORS = {
  ADMIN:           { bg: 'rgba(255,107,107,0.12)', border: 'rgba(255,107,107,0.3)', color: '#ff9b9b' },
  PROJECT_MANAGER: { bg: 'rgba(108,99,255,0.12)',  border: 'rgba(108,99,255,0.3)',  color: '#a09bff' },
  USER:            { bg: 'rgba(0,212,170,0.1)',    border: 'rgba(0,212,170,0.25)', color: '#00d4aa' },
}

const COLORS = ['#6c63ff','#00d4aa','#ffd166','#ff9b9b','#00b4d8','#a09bff']
const avatarBg = (n) => `linear-gradient(135deg, ${COLORS[(n?.charCodeAt(0)||0)%COLORS.length]}, ${COLORS[(n?.charCodeAt(1)||1)%COLORS.length]})`
const initials = (n) => (n||'?').split(/[_\s-]/).filter(Boolean).map(w=>w[0].toUpperCase()).slice(0,2).join('')

export default function AdminPage() {
  const { isAdmin, username: me } = useAuth()
  const navigate = useNavigate()

  const [users,       setUsers]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [filterRole,  setFilterRole]  = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [newRole,     setNewRole]     = useState('')
  const [saving,      setSaving]      = useState(false)
  const [stats,       setStats]       = useState(null)

  useEffect(() => {
    if (!isAdmin) { navigate('/dashboard'); return }
    loadUsers()
  }, [isAdmin])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/users')
      const data = Array.isArray(res.data) ? res.data : (res.data?.content || res.data?.users || [])
      setUsers(data)
      // Compute stats
      const roleCounts = data.reduce((acc, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1
        return acc
      }, {})
      setStats({ total: data.length, ...roleCounts })
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Access denied. Admin only.')
        navigate('/dashboard')
      } else {
        toast.error('Failed to load users')
      }
    } finally { setLoading(false) }
  }

  const handleRoleChange = async () => {
    if (!editingUser || !newRole) return
    setSaving(true)
    try {
      await api.put(`/api/admin/users/${editingUser.id}/role`, { role: newRole })
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, role: newRole } : u))
      toast.success(`Role updated to ${newRole}`)
      setEditingUser(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role')
    } finally { setSaving(false) }
  }

  const handleDelete = async (user) => {
    if (user.username === me) { toast.error("You can't delete yourself!"); return }
    if (!confirm(`Delete user "${user.username}"? This cannot be undone.`)) return
    try {
      await api.delete(`/api/admin/users/${user.id}`)
      setUsers(prev => prev.filter(u => u.id !== user.id))
      toast.success(`User ${user.username} deleted`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user')
    }
  }

  const filtered = users.filter(u => {
    const matchSearch = !search || u.username?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
    const matchRole   = !filterRole || u.role === filterRole
    return matchSearch && matchRole
  })

  const S = { background: 'var(--surface,#12141a)', border: '1px solid var(--border,#252836)', color: 'var(--text,#e8eaf0)' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg,#0a0b0e)', fontFamily: 'Outfit, sans-serif' }}>
      <Navbar />
      <main style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--text,#e8eaf0)', fontWeight: 800, fontSize: '1.6rem', margin: 0 }}>🔑 Admin Panel</h1>
          <p style={{ color: 'var(--muted,#7a7f95)', fontSize: '0.85rem', marginTop: '0.3rem' }}>Manage users, roles and system access</p>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.85rem', marginBottom: '2rem' }}>
            {[
              { label: 'Total Users',   val: stats.total,          color: '#a09bff' },
              { label: 'Admins',        val: stats.ADMIN || 0,     color: '#ff9b9b' },
              { label: 'Managers',      val: stats.PROJECT_MANAGER || 0, color: '#6c9eff' },
              { label: 'Regular Users', val: stats.USER || 0,      color: '#00d4aa' },
            ].map(s => (
              <div key={s.label} style={{ ...S, borderRadius: 14, padding: '1rem', textAlign: 'center' }}>
                <p style={{ color: s.color, fontSize: '1.7rem', fontWeight: 900, margin: 0 }}>{s.val}</p>
                <p style={{ color: 'var(--muted,#7a7f95)', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search username or email..."
            style={{ flex: 1, minWidth: 200, ...S, borderRadius: 10, padding: '0.6rem 1rem', fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = '#6c63ff'}
            onBlur={e => e.target.style.borderColor = 'var(--border,#252836)'}
          />
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
            style={{ ...S, borderRadius: 10, padding: '0.6rem 0.9rem', fontFamily: 'Outfit, sans-serif', fontSize: '0.82rem', cursor: 'pointer', outline: 'none' }}>
            <option value="">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="PROJECT_MANAGER">PROJECT_MANAGER</option>
            <option value="USER">USER</option>
          </select>
          <button onClick={loadUsers} style={{ ...S, borderRadius: 10, padding: '0.6rem 1rem', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.82rem' }}>↻ Refresh</button>
        </div>

        {/* Users table */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--muted,#7a7f95)', padding: '4rem', fontSize: '0.85rem' }}>Loading users...</div>
        ) : (
          <div style={{ ...S, borderRadius: 16, overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1fr 1fr', gap: '0.5rem', padding: '0.7rem 1.25rem', background: 'rgba(108,99,255,0.05)', borderBottom: '1px solid var(--border,#252836)' }}>
              {['User', 'Email', 'Role', 'ID', 'Actions'].map(h => (
                <span key={h} style={{ color: 'var(--muted,#7a7f95)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted,#7a7f95)', fontSize: '0.85rem' }}>No users found</div>
            ) : filtered.map((user, i) => {
              const rc = ROLE_COLORS[user.role] || ROLE_COLORS.USER
              return (
                <div key={user.id} style={{
                  display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1fr 1fr', gap: '0.5rem',
                  padding: '0.9rem 1.25rem', alignItems: 'center',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border,#252836)' : 'none',
                  transition: 'background 0.12s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(108,99,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* User */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: avatarBg(user.username), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                      {initials(user.username)}
                    </div>
                    <div>
                      <p style={{ color: 'var(--text,#e8eaf0)', fontWeight: 700, fontSize: '0.85rem', margin: 0 }}>
                        {user.username}
                        {user.username === me && <span style={{ background: 'rgba(108,99,255,0.15)', color: '#a09bff', fontSize: '0.58rem', padding: '0.1rem 0.4rem', borderRadius: 8, marginLeft: '0.4rem' }}>you</span>}
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <span style={{ color: 'var(--muted,#7a7f95)', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email || '—'}</span>

                  {/* Role badge */}
                  <span style={{ background: rc.bg, border: `1px solid ${rc.border}`, color: rc.color, fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 20, display: 'inline-block' }}>
                    {user.role || 'USER'}
                  </span>

                  {/* ID */}
                  <span style={{ color: 'var(--dim,#5a6080)', fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace' }}>#{user.id}</span>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => { setEditingUser(user); setNewRole(user.role || 'USER') }}
                      style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.25)', color: '#a09bff', fontSize: '0.68rem', padding: '0.28rem 0.55rem', borderRadius: 6, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
                      🎭 Role
                    </button>
                    {user.username !== me && (
                      <button onClick={() => handleDelete(user)}
                        style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.25)', color: '#ff9b9b', fontSize: '0.68rem', padding: '0.28rem 0.5rem', borderRadius: 6, cursor: 'pointer' }}>
                        🗑
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Edit Role Modal */}
      {editingUser && (
        <div onClick={e => { if (e.target === e.currentTarget) setEditingUser(null) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
          <div style={{ background: 'var(--surface,#12141a)', border: '1px solid var(--border,#252836)', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 400 }}>
            <h3 style={{ color: 'var(--text,#e8eaf0)', fontWeight: 800, marginBottom: '0.5rem' }}>🎭 Change Role</h3>
            <p style={{ color: 'var(--muted,#7a7f95)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>User: <strong style={{ color: '#a09bff' }}>{editingUser.username}</strong></p>
            <select value={newRole} onChange={e => setNewRole(e.target.value)}
              style={{ width: '100%', background: 'var(--surface2,#1a1d26)', border: '1px solid var(--border,#252836)', borderRadius: 10, padding: '0.75rem 1rem', color: 'var(--text,#e8eaf0)', fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem', outline: 'none', marginBottom: '1.25rem', cursor: 'pointer' }}>
              <option value="USER">👤 USER</option>
              <option value="PROJECT_MANAGER">🛠 PROJECT_MANAGER</option>
              <option value="ADMIN">🔑 ADMIN</option>
            </select>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setEditingUser(null)} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border,#252836)', color: 'var(--muted,#7a7f95)', borderRadius: 10, padding: '0.75rem', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
              <button onClick={handleRoleChange} disabled={saving} style={{ flex: 2, background: 'linear-gradient(135deg,#6c63ff,#5a52d5)', color: '#fff', border: 'none', borderRadius: 10, padding: '0.75rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Outfit, sans-serif', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : '✓ Save Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
