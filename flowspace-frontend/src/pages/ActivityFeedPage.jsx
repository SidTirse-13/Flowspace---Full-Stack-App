// FILE: src/pages/ActivityFeedPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/shared/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axiosInstance'

// ── Match EXACTLY what AuditService logs ──────────────────────────
// entityType: "TASK" | "PROJECT"
// action: "CREATE" | "UPDATE" | "DELETE" | "ASSIGN" | "STATUS_CHANGE" | "COMMENT"
const ACTION_CONFIG = {
  // Task actions
  'TASK|CREATE':        { icon: '📋', color: '#a09bff', label: 'created task' },
  'TASK|UPDATE':        { icon: '✏️', color: '#6c9eff', label: 'edited task' },
  'TASK|DELETE':        { icon: '🗑',  color: '#ff6b6b', label: 'deleted task' },
  'TASK|ASSIGN':        { icon: '👤', color: '#ffd166', label: 'assigned task' },
  'TASK|STATUS_CHANGE': { icon: '🔄', color: '#00d4aa', label: 'changed status' },
  'TASK|COMMENT':       { icon: '💬', color: '#00b4d8', label: 'commented on task' },
  // Project actions
  'PROJECT|CREATE':     { icon: '🎉', color: '#00d4aa', label: 'created project' },
  'PROJECT|UPDATE':     { icon: '✏️', color: '#6c9eff', label: 'edited project' },
  'PROJECT|DELETE':     { icon: '🗑',  color: '#ff6b6b', label: 'deleted project' },
  // Member actions (logged under PROJECT entity)
  'PROJECT|MEMBER_ADD': { icon: '➕', color: '#00d4aa', label: 'added member' },
  'PROJECT|MEMBER_REMOVE': { icon: '➖', color: '#ff9b9b', label: 'removed member' },
}

// Fallback: match by action alone if entityType is ambiguous
const ACTION_FALLBACK = {
  CREATE:        { icon: '✅', color: '#a09bff', label: 'created' },
  UPDATE:        { icon: '✏️', color: '#6c9eff', label: 'updated' },
  DELETE:        { icon: '🗑',  color: '#ff6b6b', label: 'deleted' },
  ASSIGN:        { icon: '👤', color: '#ffd166', label: 'assigned' },
  STATUS_CHANGE: { icon: '🔄', color: '#00d4aa', label: 'changed status' },
  COMMENT:       { icon: '💬', color: '#00b4d8', label: 'commented' },
}

const getCfg = (entityType, action) =>
  ACTION_CONFIG[`${entityType}|${action}`] ||
  ACTION_FALLBACK[action] ||
  { icon: '📝', color: '#7a7f95', label: action?.toLowerCase().replace('_', ' ') || 'activity' }

const timeAgo = (dateStr) => {
  if (!dateStr) return 'just now'
  // LocalDateTime from Java comes as array [y,m,d,h,min,s] or ISO string
  let ts
  if (Array.isArray(dateStr)) {
    const [y, mo, d, h = 0, mi = 0, s = 0] = dateStr
    ts = new Date(y, mo - 1, d, h, mi, s).getTime()
  } else {
    ts = new Date(dateStr).getTime()
  }
  const diff  = Date.now() - ts
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  if (Array.isArray(dateStr)) return `${dateStr[2]}/${dateStr[1]}/${dateStr[0]}`
  return new Date(dateStr).toLocaleDateString()
}

const toDateLabel = (dateStr) => {
  if (!dateStr) return 'Unknown'
  let d
  if (Array.isArray(dateStr)) {
    const [y, mo, day] = dateStr
    d = new Date(y, mo - 1, day).toDateString()
  } else {
    d = new Date(dateStr).toDateString()
  }
  const today     = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  if (d === today)     return 'Today'
  if (d === yesterday) return 'Yesterday'
  return d
}

const getInitials = (name) =>
  (name || '?').split(/[_\s-]/).map(w => w[0]?.toUpperCase()).slice(0, 2).join('')

const COLORS = ['#6c63ff','#00d4aa','#ffd166','#ff9b9b','#00b4d8','#a09bff']
const avatarColor = (name) => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length]

const FILTER_OPTIONS = [
  { key: 'ALL',          label: 'All' },
  { key: 'TASK',         label: '📋 Tasks' },
  { key: 'PROJECT',      label: '🗂 Projects' },
  { key: 'STATUS_CHANGE',label: '🔄 Status' },
  { key: 'ASSIGN',       label: '👤 Assigned' },
  { key: 'COMMENT',      label: '💬 Comments' },
]

export default function ActivityFeedPage() {
  const { username } = useAuth()
  const navigate = useNavigate()

  const [logs,        setLogs]        = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [filter,      setFilter]      = useState('ALL')
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => { loadLogs() }, [filter])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(loadLogs, 15000)
    return () => clearInterval(interval)
  }, [autoRefresh, filter])

  const loadLogs = async () => {
    try {
      // /api/audit/me — returns List<AuditLogDTO> for logged-in user
      const res = await api.get('/api/audit/me')
      const data = Array.isArray(res.data) ? res.data : (res.data?.content || [])
      setLogs(data)
      setError(null)
    } catch (err) {
      if (err.response?.status === 404) {
        // endpoint doesn't exist yet — show friendly message
        setError('audit_missing')
      } else {
        setError('failed')
      }
    } finally {
      setLoading(false)
    }
  }

  // Apply filter
  const filtered = logs.filter(log => {
    if (filter === 'ALL')    return true
    if (filter === 'TASK')   return log.entityType === 'TASK'
    if (filter === 'PROJECT')return log.entityType === 'PROJECT'
    return log.action === filter
  })

  // Group by date
  const grouped = filtered.reduce((acc, log) => {
    const label = toDateLabel(log.timestamp)
    if (!acc[label]) acc[label] = []
    acc[label].push(log)
    return acc
  }, {})

  // Navigate to entity when clicked
  const handleLogClick = (log) => {
    if (log.entityType === 'TASK' && log.entityId) {
      // We don't know projectId from audit log, so go to dashboard
      navigate('/dashboard')
    } else if (log.entityType === 'PROJECT' && log.entityId) {
      navigate(`/projects/${log.entityId}`)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg,#0a0b0e)', fontFamily: 'Outfit, sans-serif' }}>
      <Navbar />
      <main style={{ padding: '2rem', maxWidth: 780, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ color: 'var(--text,#e8eaf0)', fontWeight: 800, fontSize: '1.4rem', margin: 0 }}>📡 Activity Feed</h1>
            <p style={{ color: 'var(--muted,#7a7f95)', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
              Your recent actions across all projects
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <button onClick={() => setAutoRefresh(a => !a)} style={{
              background: autoRefresh ? 'rgba(0,212,170,0.1)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${autoRefresh ? 'rgba(0,212,170,0.3)' : 'var(--border,#252836)'}`,
              color: autoRefresh ? '#00d4aa' : 'var(--dim,#5a6080)',
              padding: '0.4rem 0.85rem', borderRadius: 8, cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif', fontSize: '0.75rem', fontWeight: 600,
            }}>
              {autoRefresh ? '🔴 Live' : '⏸ Paused'}
            </button>
            <button onClick={loadLogs} style={{
              background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.25)',
              color: '#a09bff', padding: '0.4rem 0.85rem', borderRadius: 8, cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif', fontSize: '0.75rem', fontWeight: 600,
            }}>↻ Refresh</button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {FILTER_OPTIONS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              background: filter === f.key ? 'rgba(108,99,255,0.15)' : 'transparent',
              border: `1px solid ${filter === f.key ? 'rgba(108,99,255,0.4)' : 'var(--border,#252836)'}`,
              color: filter === f.key ? '#a09bff' : 'var(--dim,#5a6080)',
              padding: '0.3rem 0.75rem', borderRadius: 20, cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif', fontSize: '0.72rem',
              fontWeight: filter === f.key ? 700 : 400, transition: 'all 0.15s',
            }}>{f.label}</button>
          ))}
        </div>

        {/* Feed content */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--muted,#7a7f95)', padding: '4rem', fontSize: '0.85rem' }}>
            Loading activity...
          </div>

        ) : error === 'audit_missing' ? (
          <div style={{ background: 'rgba(255,209,102,0.07)', border: '1px solid rgba(255,209,102,0.2)', borderRadius: 14, padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚠️</div>
            <p style={{ color: '#ffd166', fontWeight: 700, marginBottom: '0.4rem' }}>Audit endpoint not found</p>
            <p style={{ color: 'var(--muted,#7a7f95)', fontSize: '0.8rem' }}>Make sure the backend has <code style={{ color: '#a09bff' }}>/api/audit/me</code> wired up.</p>
          </div>

        ) : error === 'failed' ? (
          <div style={{ background: 'rgba(255,107,107,0.07)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 14, padding: '2rem', textAlign: 'center', color: '#ff9b9b' }}>
            Failed to load activity feed.
            <button onClick={loadLogs} style={{ background: 'none', border: 'none', color: '#a09bff', cursor: 'pointer', marginLeft: '0.5rem', textDecoration: 'underline', fontFamily: 'Outfit, sans-serif' }}>Try again</button>
          </div>

        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--muted,#7a7f95)', padding: '4rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌊</div>
            <p style={{ fontSize: '0.85rem' }}>
              {filter === 'ALL' ? 'No activity yet. Start creating projects and tasks!' : `No ${filter.toLowerCase().replace('_',' ')} activity.`}
            </p>
          </div>

        ) : (
          Object.entries(grouped).map(([dateLabel, dayLogs]) => (
            <div key={dateLabel} style={{ marginBottom: '1.75rem' }}>

              {/* Date divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <span style={{ color: 'var(--dim,#5a6080)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{dateLabel}</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border,#1a1d26)' }} />
                <span style={{ color: 'var(--dim,#5a6080)', fontSize: '0.65rem' }}>{dayLogs.length}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {dayLogs.map((log, i) => {
                  const cfg = getCfg(log.entityType, log.action)
                  const isProject = log.entityType === 'PROJECT'

                  return (
                    <div
                      key={log.id || i}
                      onClick={() => handleLogClick(log)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '0.85rem',
                        background: 'var(--surface,#0e1018)', border: '1px solid var(--border,#1a1d26)',
                        borderRadius: 12, padding: '0.75rem 1rem',
                        cursor: log.entityId ? 'pointer' : 'default',
                        transition: 'border-color 0.15s, background 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = `${cfg.color}40`
                        if (log.entityId) e.currentTarget.style.background = 'var(--surface2,#12141a)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border,#1a1d26)'
                        e.currentTarget.style.background  = 'var(--surface,#0e1018)'
                      }}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                        background: avatarColor(log.performedBy),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.65rem', fontWeight: 800, color: 'white',
                      }}>
                        {getInitials(log.performedBy)}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>

                        {/* Top row: username + action badge + entity type */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                          <span style={{ color: 'var(--text,#e8eaf0)', fontSize: '0.82rem', fontWeight: 700 }}>
                            {log.performedBy}
                          </span>
                          <span style={{
                            background: `${cfg.color}18`, border: `1px solid ${cfg.color}35`,
                            color: cfg.color, fontSize: '0.6rem', fontWeight: 700,
                            padding: '0.1rem 0.45rem', borderRadius: 20,
                          }}>
                            {cfg.icon} {cfg.label}
                          </span>
                          {/* Entity type pill */}
                          <span style={{
                            background: isProject ? 'rgba(255,209,102,0.08)' : 'rgba(108,99,255,0.08)',
                            color: isProject ? '#ffd166' : '#a09bff',
                            fontSize: '0.58rem', fontWeight: 600, padding: '0.1rem 0.4rem', borderRadius: 20,
                          }}>
                            {log.entityType === 'PROJECT' ? '🗂 Project' : '📋 Task'}
                          </span>
                        </div>

                        {/* Description — this is the human-readable text from backend */}
                        {log.description && (
                          <p style={{
                            color: 'var(--muted,#7a7f95)', fontSize: '0.78rem',
                            margin: 0, lineHeight: 1.5,
                            // Highlight task/project names in quotes
                          }}>
                            {log.description.split(/(".*?")/).map((part, idx) =>
                              part.startsWith('"') && part.endsWith('"')
                                ? <span key={idx} style={{ color: 'var(--text,#c8cae0)', fontWeight: 600 }}>{part}</span>
                                : part
                            )}
                          </p>
                        )}

                        {/* Entity ID as subtle ref */}
                        {log.entityId && (
                          <p style={{ color: 'var(--dim,#3a3f52)', fontSize: '0.62rem', margin: '0.2rem 0 0' }}>
                            #{log.entityId}
                            {log.entityType === 'PROJECT' && <span style={{ marginLeft: '0.35rem', color: '#a09bff' }}>→ click to open</span>}
                          </p>
                        )}
                      </div>

                      {/* Timestamp */}
                      <span style={{ color: 'var(--dim,#3a3f52)', fontSize: '0.65rem', flexShrink: 0, marginTop: '0.15rem', fontFamily: 'JetBrains Mono, monospace' }}>
                        {timeAgo(log.timestamp)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  )
}