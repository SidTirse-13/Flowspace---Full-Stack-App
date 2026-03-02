// FILE: src/components/shared/Navbar.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import toast from 'react-hot-toast'

const ROLE_BADGE = {
  ADMIN:           { bg: 'rgba(255,107,107,.15)', border: 'rgba(255,107,107,.35)', color: '#ff9b9b', label: '🔑 Admin' },
  PROJECT_MANAGER: { bg: 'rgba(108,99,255,.15)',  border: 'rgba(108,99,255,.35)',  color: '#a09bff', label: '🛠 Manager' },
  USER:            { bg: 'rgba(0,212,170,.1)',    border: 'rgba(0,212,170,.25)',   color: '#00d4aa', label: '👤 User' },
}

const NOTIF_ICONS = {
  TASK_ASSIGNED: '📌', TASK_STATUS_CHANGED: '🔄', TASK_OVERDUE: '⚠️',
  DEADLINE_REMINDER: '⏰', MENTIONED: '💬', PROJECT_INVITED: '📩',
}

const timeAgo = (d) => {
  if (!d) return ''
  const m = Math.floor((Date.now() - new Date(d)) / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(d).toLocaleDateString()
}

const initials = (n) =>
  (n || '?').split(/[_\s-]/).filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join('')

const AVATAR_PALETTE = ['#6c63ff','#00d4aa','#ffd166','#ff6b9d','#00b4d8','#a29bfe','#fd79a8','#0984e3']
const avatarGrad = (n) => {
  const i = (n?.charCodeAt(0) || 0) % AVATAR_PALETTE.length
  const j = (n?.charCodeAt(1) || 1) % AVATAR_PALETTE.length
  return `linear-gradient(135deg, ${AVATAR_PALETTE[i]}, ${AVATAR_PALETTE[j]})`
}

async function apiCall(method, path, body) {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    if (!res.ok) return null
    const text = await res.text()
    return text ? JSON.parse(text) : null
  } catch { return null }
}

export default function Navbar() {
  const { username, token, role, logout, isAdmin } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate  = useNavigate()
  const location  = useLocation()

  const [acctOpen,   setAcctOpen]   = useState(false)
  const [notifOpen,  setNotifOpen]  = useState(false)
  const [notifs,     setNotifs]     = useState([])
  const [unread,     setUnread]     = useState(0)
  const [notifLoad,  setNotifLoad]  = useState(false)

  const acctRef  = useRef(null)
  const notifRef = useRef(null)

  const rb = ROLE_BADGE[role] || ROLE_BADGE.USER

  // Token info
  const tokenInfo = (() => {
    if (!token) return null
    try {
      const p = JSON.parse(atob(token.split('.')[1]))
      return { exp: new Date(p.exp * 1000).toLocaleString(), expired: Date.now() > p.exp * 1000 }
    } catch { return null }
  })()

  // Poll unread count
  useEffect(() => {
    if (!token) return
    const fetch_ = async () => {
      const d = await apiCall('GET', '/api/notifications/unread-count')
      if (d != null) setUnread(typeof d === 'number' ? d : d.count || 0)
    }
    fetch_()
    const t = setInterval(fetch_, 30000)
    return () => clearInterval(t)
  }, [token])

  // Close on outside click
  useEffect(() => {
    const h = (e) => {
      if (acctRef.current  && !acctRef.current.contains(e.target))  setAcctOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target))  setNotifOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const openNotifs = async () => {
    setAcctOpen(false)
    const wasOpen = notifOpen
    setNotifOpen(!wasOpen)
    if (!wasOpen) {
      setNotifLoad(true)
      const d = await apiCall('GET', '/api/notifications')
      setNotifs(Array.isArray(d) ? d : d?.content || [])
      setNotifLoad(false)
    }
  }

  const markAll = async () => {
    await apiCall('PUT', '/api/notifications/read-all')
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    setUnread(0)
  }

  const clearAll = async () => {
    await apiCall('DELETE', '/api/notifications')
    setNotifs([])
    setUnread(0)
  }

  const clickNotif = async (n) => {
    if (!n.read) {
      await apiCall('PUT', `/api/notifications/${n.id}/read`)
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
      setUnread(c => Math.max(0, c - 1))
    }
    if (n.projectId) navigate(`/projects/${n.projectId}`)
    setNotifOpen(false)
  }

  const handleLogout = () => {
    logout()
    toast.success('Signed out. See you soon!')
    navigate('/login')
  }

  // Theme-aware colors
  const navBg     = isDark ? '#12141a' : '#ffffff'
  const navBorder = isDark ? '#1e2030' : '#e0e4f0'
  const dropBg    = isDark ? '#12141a' : '#ffffff'
  const textMain  = isDark ? '#e8eaf0' : '#1a1d2e'
  const textMuted = isDark ? '#7a7f95' : '#5a6080'
  const btnBg     = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
  const btnBorder = isDark ? '#252836' : '#dde2f0'
  const rowHover  = isDark ? '#161820' : '#f5f7fc'
  const infoRowBg = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'

  const navLinks = [
    { label: '🏠 Dashboard', path: '/dashboard' },
    { label: '💬 Messages',  path: '/messages' },
    { label: '📅 Meetings',  path: '/meetings' },
    { label: '📡 Activity',  path: '/activity' },
    { label: '🤖 AI Tools',  path: '/ai-tools' },
  ]

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  const btn = (label, onClick, color, bg, border) => (
    <button onClick={onClick} style={{
      width: '100%', padding: '0.5rem 0.9rem',
      background: bg, border: `1px solid ${border}`,
      borderRadius: 8, color, fontSize: '0.78rem', fontWeight: 600,
      cursor: 'pointer', fontFamily: 'Outfit, sans-serif', textAlign: 'left',
      transition: 'opacity 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >{label}</button>
  )

  return (
    <nav style={{
      background: navBg, borderBottom: `1px solid ${navBorder}`,
      height: 64, padding: '0 1.5rem',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 300,
      fontFamily: "'Outfit', 'Inter', sans-serif",
      boxShadow: isDark ? '0 1px 20px rgba(0,0,0,0.35)' : '0 1px 12px rgba(0,0,0,0.08)',
      transition: 'background 0.25s, border-color 0.25s',
    }}>

      {/* ── LEFT: Logo + Nav ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>

        {/* Flowspace logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', padding: '0.35rem 0.6rem', borderRadius: 10, marginRight: '0.5rem', transition: 'background 0.15s' }}
          onClick={() => navigate('/dashboard')}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(108,99,255,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {/* Three-line icon */}
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #6c63ff, #00d4aa)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: '4px', padding: '7px 8px', flexShrink: 0 }}>
            <div style={{ width: '100%', height: 2.5, background: '#fff', borderRadius: 2 }} />
            <div style={{ width: '75%', height: 2.5, background: 'rgba(255,255,255,0.75)', borderRadius: 2 }} />
            <div style={{ width: '50%', height: 2.5, background: 'rgba(255,255,255,0.5)', borderRadius: 2 }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em', color: textMain, whiteSpace: 'nowrap' }}>
            Flow<span style={{ background: 'linear-gradient(135deg,#6c63ff,#00d4aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>space</span>
          </span>
        </div>

        {/* Nav links */}
        {navLinks.map(link => {
          const active = isActive(link.path)
          return (
            <button key={link.path} onClick={() => navigate(link.path)} style={{
              background: active ? 'rgba(108,99,255,0.12)' : 'transparent',
              border:     `1px solid ${active ? 'rgba(108,99,255,0.28)' : 'transparent'}`,
              color:      active ? '#a09bff' : textMuted,
              padding: '0.35rem 0.75rem', borderRadius: 8,
              cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
              fontSize: '0.78rem', fontWeight: active ? 700 : 500,
              whiteSpace: 'nowrap', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(108,99,255,0.07)'; e.currentTarget.style.color = textMain }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = textMuted }}}
            >{link.label}</button>
          )
        })}
      </div>

      {/* ── RIGHT: Actions ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>

        {/* Admin button */}
        {isAdmin && (
          <button onClick={() => navigate('/admin')} style={{
            background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.28)',
            color: '#ff9b9b', padding: '0.35rem 0.85rem', borderRadius: 8,
            cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.76rem', fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,107,107,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,107,107,0.1)'}
          >🔑 Admin</button>
        )}

        {/* Theme toggle */}
        <button onClick={toggleTheme} title="Toggle dark/light mode" style={{
          background: btnBg, border: `1px solid ${btnBorder}`,
          borderRadius: 9, width: 38, height: 38, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem', transition: 'all 0.15s', flexShrink: 0,
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(108,99,255,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = btnBg}
        >{isDark ? '☀️' : '🌙'}</button>

        {/* Notification bell */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button onClick={openNotifs} style={{
            position: 'relative', background: notifOpen ? 'rgba(108,99,255,0.15)' : btnBg,
            border: `1px solid ${notifOpen ? 'rgba(108,99,255,0.4)' : btnBorder}`,
            borderRadius: 9, width: 38, height: 38,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '1rem', transition: 'all 0.15s', flexShrink: 0,
          }}
            onMouseEnter={e => { if (!notifOpen) e.currentTarget.style.background = 'rgba(108,99,255,0.08)' }}
            onMouseLeave={e => { if (!notifOpen) e.currentTarget.style.background = btnBg }}
          >
            🔔
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: -3, right: -3,
                background: '#ff6b6b', color: '#fff', fontSize: '0.52rem', fontWeight: 800,
                borderRadius: '50%', width: 16, height: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2px solid ${navBg}`, userSelect: 'none',
              }}>{unread > 9 ? '9+' : unread}</span>
            )}
          </button>

          {notifOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 360,
              background: dropBg, border: `1px solid ${navBorder}`,
              borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.4)', zIndex: 500, overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', borderBottom: `1px solid ${navBorder}`, background: 'rgba(108,99,255,0.05)' }}>
                <span style={{ color: textMain, fontWeight: 700, fontSize: '0.85rem' }}>
                  🔔 Notifications
                  {unread > 0 && <span style={{ background: '#ff6b6b', color: '#fff', fontSize: '0.54rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: 10, marginLeft: '0.5rem' }}>{unread} new</span>}
                </span>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {notifs.some(n => !n.read) && (
                    <button onClick={markAll} style={{ background: 'none', border: 'none', color: '#6c63ff', fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>Mark all read</button>
                  )}
                  {notifs.length > 0 && (
                    <button onClick={clearAll} style={{ background: 'none', border: 'none', color: textMuted, fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Clear</button>
                  )}
                </div>
              </div>
              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                {notifLoad ? (
                  <p style={{ color: textMuted, textAlign: 'center', padding: '2rem', fontSize: '0.82rem' }}>Loading...</p>
                ) : notifs.length === 0 ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: textMuted }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔔</div>
                    <p style={{ fontSize: '0.8rem', margin: 0 }}>You're all caught up!</p>
                  </div>
                ) : notifs.map(n => (
                  <div key={n.id} onClick={() => clickNotif(n)} style={{
                    display: 'flex', gap: '0.7rem', padding: '0.8rem 1rem',
                    borderBottom: `1px solid ${navBorder}`, cursor: 'pointer',
                    background: n.read ? 'transparent' : 'rgba(108,99,255,0.06)',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = rowHover}
                    onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(108,99,255,0.06)'}
                  >
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>{NOTIF_ICONS[n.type] || '📣'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: n.read ? textMuted : textMain, fontSize: '0.78rem', lineHeight: 1.4, margin: 0 }}>{n.message}</p>
                      <p style={{ color: textMuted, fontSize: '0.62rem', margin: '0.2rem 0 0' }}>{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#6c63ff', flexShrink: 0, marginTop: 5 }} />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Account dropdown */}
        <div style={{ position: 'relative' }} ref={acctRef}>
          <button onClick={() => { setNotifOpen(false); setAcctOpen(o => !o) }} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: acctOpen ? 'rgba(108,99,255,0.15)' : btnBg,
            border: `1px solid ${acctOpen ? 'rgba(108,99,255,0.4)' : btnBorder}`,
            borderRadius: 10, padding: '0.35rem 0.7rem 0.35rem 0.45rem',
            cursor: 'pointer', transition: 'all 0.18s', fontFamily: 'Outfit, sans-serif',
          }}
            onMouseEnter={e => { if (!acctOpen) e.currentTarget.style.background = 'rgba(108,99,255,0.08)' }}
            onMouseLeave={e => { if (!acctOpen) e.currentTarget.style.background = btnBg }}
          >
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: avatarGrad(username), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {initials(username)}
            </div>
            <span style={{ color: textMain, fontSize: '0.82rem', fontWeight: 600, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{username}</span>
            <span style={{ color: textMuted, fontSize: '0.5rem', transform: acctOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
          </button>

          {acctOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 300,
              background: dropBg, border: `1px solid ${navBorder}`,
              borderRadius: 18, boxShadow: '0 20px 60px rgba(0,0,0,0.4)', zIndex: 500, overflow: 'hidden',
            }}>
              {/* Profile header */}
              <div style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(108,99,255,0.14), rgba(0,212,170,0.06))'
                  : 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(0,212,170,0.04))',
                borderBottom: `1px solid ${navBorder}`,
                padding: '1.1rem 1.2rem',
                display: 'flex', alignItems: 'center', gap: '0.85rem',
              }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: avatarGrad(username), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 800, color: '#fff', flexShrink: 0, boxShadow: '0 4px 12px rgba(108,99,255,0.35)' }}>
                  {initials(username)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: textMain, fontWeight: 800, fontSize: '0.95rem', margin: '0 0 0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{username}</p>
                  <span style={{ background: rb.bg, border: `1px solid ${rb.border}`, color: rb.color, fontSize: '0.6rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: 20 }}>{rb.label}</span>
                </div>
                {tokenInfo && (
                  <span style={{
                    background: tokenInfo.expired ? 'rgba(255,107,107,0.15)' : 'rgba(0,212,170,0.12)',
                    border:     `1px solid ${tokenInfo.expired ? 'rgba(255,107,107,0.3)' : 'rgba(0,212,170,0.3)'}`,
                    color:      tokenInfo.expired ? '#ff9b9b' : '#00d4aa',
                    fontSize: '0.58rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: 20, flexShrink: 0,
                  }}>{tokenInfo.expired ? '⚠ Expired' : '● Active'}</span>
                )}
              </div>

              {/* Info rows */}
              <div style={{ padding: '0.55rem 0' }}>
                {[
                  { icon: '👤', label: 'Username', val: username, vc: textMain },
                  { icon: '🎭', label: 'Role',     val: role || 'USER', vc: rb.color },
                  ...(tokenInfo ? [{ icon: '⏰', label: 'Session', val: tokenInfo.exp, vc: tokenInfo.expired ? '#ff9b9b' : '#00d4aa', mono: true }] : []),
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.32rem 1.1rem', background: infoRowBg }}>
                    <span style={{ fontSize: '0.82rem', width: 18, textAlign: 'center', flexShrink: 0 }}>{r.icon}</span>
                    <span style={{ color: textMuted, fontSize: '0.7rem', width: 62, flexShrink: 0 }}>{r.label}</span>
                    <span style={{ color: r.vc || textMain, fontSize: r.mono ? '0.65rem' : '0.76rem', fontFamily: r.mono ? 'JetBrains Mono, monospace' : 'Outfit, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.val}</span>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div style={{ borderTop: `1px solid ${navBorder}`, padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.38rem' }}>
                {btn('👤 My Profile',
                  () => { setAcctOpen(false); navigate(`/profile/${username}`) },
                  '#00d4aa', 'rgba(0,212,170,0.07)', 'rgba(0,212,170,0.2)')}

                {btn('💬 Messages',
                  () => { setAcctOpen(false); navigate('/messages') },
                  '#a09bff', 'rgba(108,99,255,0.07)', 'rgba(108,99,255,0.2)')}

                {btn('⚙️ Settings',
                  () => { setAcctOpen(false); navigate('/settings') },
                  textMuted, isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', navBorder)}

                {isAdmin && btn('🔑 Admin Panel',
                  () => { setAcctOpen(false); navigate('/admin') },
                  '#ff9b9b', 'rgba(255,107,107,0.08)', 'rgba(255,107,107,0.25)')}

                <button onClick={() => { setAcctOpen(false); toggleTheme() }} style={{
                  width: '100%', padding: '0.5rem 0.9rem',
                  background: 'rgba(255,209,102,0.07)', border: '1px solid rgba(255,209,102,0.22)',
                  borderRadius: 8, color: '#ffd166',
                  fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'Outfit, sans-serif', textAlign: 'left',
                  transition: 'opacity 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >{isDark ? '☀️ Switch to Light Mode' : '🌙 Switch to Dark Mode'}</button>

                <button onClick={handleLogout} style={{
                  width: '100%', padding: '0.5rem', borderRadius: 8,
                  background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.25)',
                  color: '#ff9b9b', fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'Outfit, sans-serif', fontSize: '0.82rem',
                  textAlign: 'center', transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,107,107,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,107,107,0.08)'}
                >🚪 Sign Out</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}