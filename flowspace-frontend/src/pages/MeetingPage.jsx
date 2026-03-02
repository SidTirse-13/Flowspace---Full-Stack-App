// FILE: src/pages/MeetingPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/shared/Navbar'
import { useAuth } from '../context/AuthContext'
import {
  getMeetings, createMeeting, updateMeeting,
  deleteMeeting, updateMeetingStatus,
} from '../api/meetingApi'
import { getProjects } from '../api/projectApi'

// ── Config ────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  STANDUP:      { icon: '☀️', color: '#ffd166', bg: 'rgba(255,209,102,0.1)',  border: 'rgba(255,209,102,0.25)', label: 'Standup'      },
  PLANNING:     { icon: '🗺',  color: '#6c9eff', bg: 'rgba(108,158,255,0.1)', border: 'rgba(108,158,255,0.25)', label: 'Planning'     },
  REVIEW:       { icon: '🔍', color: '#00d4aa', bg: 'rgba(0,212,170,0.1)',   border: 'rgba(0,212,170,0.25)',  label: 'Review'       },
  RETROSPECTIVE:{ icon: '🔄', color: '#a09bff', bg: 'rgba(160,155,255,0.1)', border: 'rgba(160,155,255,0.25)', label: 'Retrospective'},
  ONE_ON_ONE:   { icon: '👥', color: '#00b4d8', bg: 'rgba(0,180,216,0.1)',   border: 'rgba(0,180,216,0.25)',  label: '1:1'          },
  GENERAL:      { icon: '📅', color: '#7a7f95', bg: 'rgba(122,127,149,0.1)', border: 'rgba(122,127,149,0.25)', label: 'General'      },
}

const STATUS_CONFIG = {
  SCHEDULED:   { color: '#6c9eff', bg: 'rgba(108,158,255,0.1)', label: 'Scheduled'  },
  IN_PROGRESS: { color: '#ffd166', bg: 'rgba(255,209,102,0.1)', label: 'In Progress'},
  COMPLETED:   { color: '#00d4aa', bg: 'rgba(0,212,170,0.1)',   label: 'Completed'  },
  CANCELLED:   { color: '#ff9b9b', bg: 'rgba(255,155,155,0.1)', label: 'Cancelled'  },
}

const COLORS = ['#6c63ff','#00d4aa','#ffd166','#ff9b9b','#00b4d8','#a09bff']
const avatarBg = (n) => `linear-gradient(135deg, ${COLORS[(n?.charCodeAt(0)||0)%COLORS.length]}, ${COLORS[(n?.charCodeAt(1)||1)%COLORS.length]})`
const initials  = (n) => (n||'?').split(/[_\s-]/).filter(Boolean).map(w=>w[0].toUpperCase()).slice(0,2).join('')

const formatDateTime = (dt) => {
  if (!dt) return '—'
  const d = Array.isArray(dt)
    ? new Date(dt[0], dt[1]-1, dt[2], dt[3]||0, dt[4]||0)
    : new Date(dt)
  return d.toLocaleString('en-US', { weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
}

const formatForInput = (dt) => {
  if (!dt) return ''
  const d = Array.isArray(dt)
    ? new Date(dt[0], dt[1]-1, dt[2], dt[3]||0, dt[4]||0)
    : new Date(dt)
  return d.toISOString().slice(0, 16)
}

const timeUntil = (dt) => {
  if (!dt) return ''
  const d = Array.isArray(dt) ? new Date(dt[0], dt[1]-1, dt[2], dt[3]||0, dt[4]||0) : new Date(dt)
  const diff = d - Date.now()
  if (diff < 0) return 'Past'
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 60)  return `in ${mins}m`
  if (hours < 24) return `in ${hours}h`
  return `in ${days}d`
}

const isUpcoming = (dt) => {
  if (!dt) return false
  const d = Array.isArray(dt) ? new Date(dt[0], dt[1]-1, dt[2], dt[3]||0, dt[4]||0) : new Date(dt)
  return d > Date.now()
}

const EMPTY_FORM = {
  title: '', description: '', startTime: '', endTime: '',
  location: '', meetingType: 'GENERAL', status: 'SCHEDULED',
  projectId: '', attendees: '', agenda: '', notes: '', actionItems: '',
}

export default function MeetingPage() {
  const { username } = useAuth()
  const navigate     = useNavigate()

  const [meetings,    setMeetings]    = useState([])
  const [projects,    setProjects]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [view,        setView]        = useState('upcoming') // upcoming | all | calendar
  const [filterType,  setFilterType]  = useState('ALL')
  const [showModal,   setShowModal]   = useState(false)
  const [editingId,   setEditingId]   = useState(null)
  const [detailId,    setDetailId]    = useState(null)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [saving,      setSaving]      = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [meetRes, projRes] = await Promise.allSettled([getMeetings(), getProjects()])
      if (meetRes.status === 'fulfilled') {
        const data = Array.isArray(meetRes.value.data) ? meetRes.value.data : []
        setMeetings(data.sort((a, b) => {
          const da = Array.isArray(a.startTime) ? new Date(a.startTime[0], a.startTime[1]-1, a.startTime[2], a.startTime[3]||0, a.startTime[4]||0) : new Date(a.startTime)
          const db = Array.isArray(b.startTime) ? new Date(b.startTime[0], b.startTime[1]-1, b.startTime[2], b.startTime[3]||0, b.startTime[4]||0) : new Date(b.startTime)
          return da - db
        }))
      }
      if (projRes.status === 'fulfilled') {
        setProjects(projRes.value.data?.content || projRes.value.data || [])
      }
    } catch { toast.error('Failed to load meetings') }
    finally { setLoading(false) }
  }

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, attendees: username })
    setEditingId(null)
    setShowModal(true)
  }

  const openEdit = (m) => {
    setForm({
      title:       m.title || '',
      description: m.description || '',
      startTime:   formatForInput(m.startTime),
      endTime:     formatForInput(m.endTime),
      location:    m.location || '',
      meetingType: m.meetingType || 'GENERAL',
      status:      m.status || 'SCHEDULED',
      projectId:   m.projectId ? String(m.projectId) : '',
      attendees:   (m.attendees || []).join(', '),
      agenda:      m.agenda || '',
      notes:       m.notes || '',
      actionItems: m.actionItems || '',
    })
    setEditingId(m.id)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.startTime)    { toast.error('Start time is required'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        projectId:  form.projectId ? Number(form.projectId) : null,
        attendees:  form.attendees.split(',').map(s => s.trim()).filter(Boolean),
        startTime:  form.startTime,
        endTime:    form.endTime || null,
      }
      if (editingId) {
        await updateMeeting(editingId, payload)
        toast.success('Meeting updated!')
      } else {
        await createMeeting(payload)
        toast.success('Meeting scheduled! 📅')
      }
      setShowModal(false)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save meeting')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this meeting?')) return
    try {
      await deleteMeeting(id)
      toast.success('Meeting deleted')
      setDetailId(null)
      loadData()
    } catch { toast.error('Failed to delete meeting') }
  }

  const handleStatusChange = async (id, status) => {
    try {
      await updateMeetingStatus(id, status)
      setMeetings(prev => prev.map(m => m.id === id ? { ...m, status } : m))
      if (detailId === id) setDetailId(id) // refresh detail
      toast.success(`Status → ${status}`)
    } catch { toast.error('Failed to update status') }
  }

  // ── Filtered meetings ──────────────────────────────────────────
  const displayed = meetings.filter(m => {
    const typeOk = filterType === 'ALL' || m.meetingType === filterType
    const viewOk = view === 'all' || (view === 'upcoming' && isUpcoming(m.startTime))
    return typeOk && viewOk
  })

  const detailMeeting = meetings.find(m => m.id === detailId)

  // ── Stats ─────────────────────────────────────────────────────
  const upcoming   = meetings.filter(m => isUpcoming(m.startTime) && m.status !== 'CANCELLED').length
  const today      = meetings.filter(m => {
    const d = Array.isArray(m.startTime) ? new Date(m.startTime[0], m.startTime[1]-1, m.startTime[2]) : new Date(m.startTime)
    return d.toDateString() === new Date().toDateString()
  }).length
  const thisWeek   = meetings.filter(m => {
    const d = Array.isArray(m.startTime) ? new Date(m.startTime[0], m.startTime[1]-1, m.startTime[2]) : new Date(m.startTime)
    const diff = d - Date.now()
    return diff >= 0 && diff < 7 * 86400000
  }).length

  // ── Styles ────────────────────────────────────────────────────
  const S = (extra = {}) => ({
    background: 'var(--surface,#12141a)', border: '1px solid var(--border,#252836)',
    borderRadius: 14, ...extra,
  })
  const inp = {
    width: '100%', background: 'var(--surface2,#1a1d26)', border: '1px solid var(--border,#252836)',
    borderRadius: 9, padding: '0.65rem 0.9rem', color: 'var(--text,#e8eaf0)',
    fontSize: '0.85rem', fontFamily: 'Outfit, sans-serif', outline: 'none', boxSizing: 'border-box',
  }
  const labelS = { color: 'var(--muted,#7a7f95)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '0.35rem' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg,#0a0b0e)', fontFamily: 'Outfit, sans-serif' }}>
      <Navbar />
      <main style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ color: 'var(--text,#e8eaf0)', fontWeight: 800, fontSize: '1.5rem', margin: 0 }}>📅 Meetings</h1>
            <p style={{ color: 'var(--muted,#7a7f95)', fontSize: '0.82rem', marginTop: '0.3rem' }}>Schedule, manage and track your team meetings</p>
          </div>
          <button onClick={openCreate} style={{
            background: 'linear-gradient(135deg, #6c63ff, #5a52d5)', color: '#fff',
            border: 'none', padding: '0.7rem 1.4rem', borderRadius: 11, cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.9rem',
            boxShadow: '0 4px 20px rgba(108,99,255,0.4)',
          }}>+ Schedule Meeting</button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: '0.75rem', marginBottom: '1.75rem' }}>
          {[
            { label: 'Total',    val: meetings.length, color: '#a09bff' },
            { label: 'Today',    val: today,           color: '#ffd166' },
            { label: 'This Week',val: thisWeek,        color: '#00b4d8' },
            { label: 'Upcoming', val: upcoming,        color: '#00d4aa' },
          ].map(s => (
            <div key={s.label} style={{ ...S({ padding: '1rem', textAlign: 'center' }) }}>
              <p style={{ color: s.color, fontSize: '1.6rem', fontWeight: 900, margin: 0 }}>{s.val}</p>
              <p style={{ color: 'var(--muted,#7a7f95)', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* View + Filter controls */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', background: 'var(--surface,#12141a)', border: '1px solid var(--border,#252836)', borderRadius: 10, padding: '0.25rem', gap: '0.25rem' }}>
            {[['upcoming','🔜 Upcoming'],['all','📋 All']].map(([v,l]) => (
              <button key={v} onClick={() => setView(v)} style={{
                background: view === v ? 'rgba(108,99,255,0.15)' : 'transparent',
                border: `1px solid ${view === v ? 'rgba(108,99,255,0.35)' : 'transparent'}`,
                color: view === v ? '#a09bff' : 'var(--muted,#7a7f95)',
                padding: '0.35rem 0.85rem', borderRadius: 8, cursor: 'pointer',
                fontFamily: 'Outfit, sans-serif', fontSize: '0.75rem', fontWeight: 600,
              }}>{l}</button>
            ))}
          </div>

          {/* Type filter */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {[['ALL','All'], ...Object.entries(TYPE_CONFIG).map(([k,v]) => [k, `${v.icon} ${v.label}`])].map(([k,l]) => (
              <button key={k} onClick={() => setFilterType(k)} style={{
                background: filterType === k ? 'rgba(108,99,255,0.12)' : 'transparent',
                border: `1px solid ${filterType === k ? 'rgba(108,99,255,0.35)' : 'var(--border,#252836)'}`,
                color: filterType === k ? '#a09bff' : 'var(--muted,#7a7f95)',
                padding: '0.3rem 0.7rem', borderRadius: 20, cursor: 'pointer',
                fontFamily: 'Outfit, sans-serif', fontSize: '0.7rem', fontWeight: filterType === k ? 700 : 400,
              }}>{l}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: detailId ? '1fr 400px' : '1fr', gap: '1.25rem' }}>

          {/* Meeting list */}
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--muted,#7a7f95)', padding: '4rem', fontSize: '0.85rem' }}>Loading meetings...</div>
            ) : displayed.length === 0 ? (
              <div style={{ ...S({ padding: '3rem', textAlign: 'center' }) }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
                <p style={{ color: 'var(--text,#e8eaf0)', fontWeight: 700, marginBottom: '0.4rem' }}>
                  {view === 'upcoming' ? 'No upcoming meetings' : 'No meetings yet'}
                </p>
                <p style={{ color: 'var(--muted,#7a7f95)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                  Schedule your first meeting to get started
                </p>
                <button onClick={openCreate} style={{ background: 'linear-gradient(135deg,#6c63ff,#5a52d5)', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: 10, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
                  + Schedule Meeting
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {displayed.map(m => {
                  const tc = TYPE_CONFIG[m.meetingType] || TYPE_CONFIG.GENERAL
                  const sc = STATUS_CONFIG[m.status]    || STATUS_CONFIG.SCHEDULED
                  const until = timeUntil(m.startTime)
                  const isSelected = detailId === m.id
                  return (
                    <div key={m.id}
                      onClick={() => setDetailId(isSelected ? null : m.id)}
                      style={{
                        ...S({ padding: '1rem 1.25rem', cursor: 'pointer', transition: 'all 0.15s',
                          borderColor: isSelected ? 'rgba(108,99,255,0.5)' : 'var(--border,#252836)',
                          background: isSelected ? 'rgba(108,99,255,0.05)' : 'var(--surface,#12141a)',
                        })
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'rgba(108,99,255,0.3)' }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border,#252836)' }}
                    >
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        {/* Type icon */}
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: tc.bg, border: `1px solid ${tc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                          {tc.icon}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                            <p style={{ color: 'var(--text,#e8eaf0)', fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>{m.title}</p>
                            <span style={{ background: sc.bg, color: sc.color, fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.5rem', borderRadius: 20 }}>{sc.label}</span>
                            <span style={{ background: tc.bg, color: tc.color, fontSize: '0.6rem', fontWeight: 600, padding: '0.1rem 0.5rem', borderRadius: 20 }}>{tc.icon} {tc.label}</span>
                          </div>

                          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                            <span style={{ color: 'var(--muted,#7a7f95)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              🕐 {formatDateTime(m.startTime)}
                            </span>
                            {m.location && (
                              <span style={{ color: 'var(--muted,#7a7f95)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                📍 {m.location.startsWith('http') ? <a href={m.location} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ color: '#6c9eff', textDecoration: 'none' }}>Join Link ↗</a> : m.location}
                              </span>
                            )}
                            {m.projectName && (
                              <span style={{ color: 'var(--muted,#7a7f95)', fontSize: '0.75rem' }}>🗂 {m.projectName}</span>
                            )}
                          </div>

                          {m.attendees?.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                              {m.attendees.slice(0, 5).map(a => (
                                <div key={a} title={a} style={{ width: 22, height: 22, borderRadius: '50%', background: avatarBg(a), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', fontWeight: 800, color: '#fff', border: '1.5px solid var(--bg,#0a0b0e)' }}>
                                  {initials(a)}
                                </div>
                              ))}
                              {m.attendees.length > 5 && <span style={{ color: 'var(--dim,#5a6080)', fontSize: '0.65rem' }}>+{m.attendees.length - 5}</span>}
                            </div>
                          )}
                        </div>

                        {/* Right: time until + actions */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          {isUpcoming(m.startTime) && m.status !== 'CANCELLED' && (
                            <span style={{ color: '#ffd166', fontSize: '0.68rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>{until}</span>
                          )}
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button onClick={e => { e.stopPropagation(); openEdit(m) }}
                              style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.25)', color: '#a09bff', padding: '0.3rem 0.6rem', borderRadius: 7, cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'Outfit, sans-serif' }}>✏️</button>
                            <button onClick={e => { e.stopPropagation(); handleDelete(m.id) }}
                              style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.25)', color: '#ff9b9b', padding: '0.3rem 0.6rem', borderRadius: 7, cursor: 'pointer', fontSize: '0.7rem' }}>🗑</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {detailId && detailMeeting && (() => {
            const m  = detailMeeting
            const tc = TYPE_CONFIG[m.meetingType] || TYPE_CONFIG.GENERAL
            const sc = STATUS_CONFIG[m.status]    || STATUS_CONFIG.SCHEDULED
            return (
              <div style={{ ...S({ padding: '0', overflow: 'hidden', height: 'fit-content', position: 'sticky', top: '1.5rem' }) }}>
                {/* Panel header */}
                <div style={{ padding: '1.1rem 1.25rem', background: `linear-gradient(135deg, ${tc.bg}, transparent)`, borderBottom: '1px solid var(--border,#252836)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>{tc.icon}</div>
                    <h3 style={{ color: 'var(--text,#e8eaf0)', fontWeight: 800, fontSize: '1rem', margin: 0 }}>{m.title}</h3>
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                      <span style={{ background: sc.bg, color: sc.color, fontSize: '0.6rem', fontWeight: 700, padding: '0.12rem 0.5rem', borderRadius: 20 }}>{sc.label}</span>
                      <span style={{ background: tc.bg, color: tc.color, fontSize: '0.6rem', fontWeight: 600, padding: '0.12rem 0.5rem', borderRadius: 20 }}>{tc.label}</span>
                    </div>
                  </div>
                  <button onClick={() => setDetailId(null)} style={{ background: 'none', border: 'none', color: 'var(--muted,#7a7f95)', cursor: 'pointer', fontSize: '1.1rem', padding: 0 }}>✕</button>
                </div>

                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                  {/* Time */}
                  <div>
                    <p style={{ ...labelS }}>🕐 Time</p>
                    <p style={{ color: 'var(--text,#e8eaf0)', fontSize: '0.82rem', margin: 0, fontWeight: 600 }}>{formatDateTime(m.startTime)}</p>
                    {m.endTime && <p style={{ color: 'var(--muted,#7a7f95)', fontSize: '0.75rem', margin: '0.15rem 0 0' }}>until {formatDateTime(m.endTime)}</p>}
                    {isUpcoming(m.startTime) && m.status !== 'CANCELLED' && (
                      <span style={{ color: '#ffd166', fontSize: '0.7rem', fontWeight: 700, marginTop: '0.25rem', display: 'inline-block' }}>{timeUntil(m.startTime)}</span>
                    )}
                  </div>

                  {m.location && (
                    <div>
                      <p style={{ ...labelS }}>📍 Location</p>
                      {m.location.startsWith('http')
                        ? <a href={m.location} target="_blank" rel="noreferrer" style={{ color: '#6c9eff', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>🔗 Join Meeting ↗</a>
                        : <p style={{ color: 'var(--text,#e8eaf0)', fontSize: '0.82rem', margin: 0 }}>{m.location}</p>
                      }
                    </div>
                  )}

                  {m.projectName && (
                    <div>
                      <p style={{ ...labelS }}>🗂 Project</p>
                      <button onClick={() => navigate(`/projects/${m.projectId}`)}
                        style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.25)', color: '#a09bff', padding: '0.35rem 0.75rem', borderRadius: 8, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.78rem', fontWeight: 600 }}>
                        {m.projectName} ↗
                      </button>
                    </div>
                  )}

                  {m.attendees?.length > 0 && (
                    <div>
                      <p style={{ ...labelS }}>👥 Attendees ({m.attendees.length})</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {m.attendees.map(a => (
                          <div key={a} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--surface2,#1a1d26)', borderRadius: 20, padding: '0.2rem 0.6rem 0.2rem 0.2rem' }}>
                            <div style={{ width: 20, height: 20, borderRadius: '50%', background: avatarBg(a), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', fontWeight: 800, color: '#fff' }}>{initials(a)}</div>
                            <span style={{ color: 'var(--text,#e8eaf0)', fontSize: '0.72rem', fontWeight: 600 }}>{a}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {m.agenda && (
                    <div>
                      <p style={{ ...labelS }}>📋 Agenda</p>
                      <p style={{ color: 'var(--muted,#7a7f95)', fontSize: '0.8rem', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{m.agenda}</p>
                    </div>
                  )}

                  {m.notes && (
                    <div>
                      <p style={{ ...labelS }}>📝 Notes</p>
                      <p style={{ color: 'var(--muted,#7a7f95)', fontSize: '0.8rem', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{m.notes}</p>
                    </div>
                  )}

                  {m.actionItems && (
                    <div>
                      <p style={{ ...labelS }}>✅ Action Items</p>
                      <p style={{ color: 'var(--text,#e8eaf0)', fontSize: '0.8rem', margin: 0, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{m.actionItems}</p>
                    </div>
                  )}

                  {/* Status change */}
                  <div>
                    <p style={{ ...labelS }}>Change Status</p>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <button key={k} onClick={() => handleStatusChange(m.id, k)}
                          disabled={m.status === k}
                          style={{
                            background: m.status === k ? v.bg : 'transparent',
                            border: `1px solid ${m.status === k ? v.color + '60' : 'var(--border,#252836)'}`,
                            color: m.status === k ? v.color : 'var(--muted,#7a7f95)',
                            padding: '0.3rem 0.65rem', borderRadius: 8, cursor: m.status === k ? 'default' : 'pointer',
                            fontFamily: 'Outfit, sans-serif', fontSize: '0.68rem', fontWeight: m.status === k ? 700 : 400,
                          }}>{v.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border,#252836)' }}>
                    <button onClick={() => openEdit(m)} style={{ flex: 1, background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.25)', color: '#a09bff', padding: '0.6rem', borderRadius: 9, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.8rem' }}>
                      ✏️ Edit
                    </button>
                    <button onClick={() => handleDelete(m.id)} style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.25)', color: '#ff9b9b', padding: '0.6rem 0.9rem', borderRadius: 9, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.8rem' }}>
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </main>

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
          <div style={{ background: 'var(--surface,#12141a)', border: '1px solid var(--border,#252836)', borderRadius: 22, width: '100%', maxWidth: 620, maxHeight: '92vh', overflowY: 'auto' }}>

            {/* Modal header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border,#252836)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--surface,#12141a)', zIndex: 1, borderRadius: '22px 22px 0 0' }}>
              <h2 style={{ color: 'var(--text,#e8eaf0)', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>
                {editingId ? '✏️ Edit Meeting' : '📅 Schedule Meeting'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--muted,#7a7f95)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Title */}
              <div>
                <label style={labelS}>Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Sprint Planning, Weekly Standup"
                  style={inp} onFocus={e => e.target.style.borderColor = '#6c63ff'} onBlur={e => e.target.style.borderColor = 'var(--border,#252836)'} />
              </div>

              {/* Type + Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelS}>Meeting Type</label>
                  <select value={form.meetingType} onChange={e => setForm(f => ({ ...f, meetingType: e.target.value }))}
                    style={{ ...inp, cursor: 'pointer' }}>
                    {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelS}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    style={{ ...inp, cursor: 'pointer' }}>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Date/Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelS}>Start Time *</label>
                  <input type="datetime-local" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                    style={{ ...inp, colorScheme: 'dark' }} onFocus={e => e.target.style.borderColor = '#6c63ff'} onBlur={e => e.target.style.borderColor = 'var(--border,#252836)'} />
                </div>
                <div>
                  <label style={labelS}>End Time</label>
                  <input type="datetime-local" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                    style={{ ...inp, colorScheme: 'dark' }} onFocus={e => e.target.style.borderColor = '#6c63ff'} onBlur={e => e.target.style.borderColor = 'var(--border,#252836)'} />
                </div>
              </div>

              {/* Location */}
              <div>
                <label style={labelS}>Location / Meeting Link</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="Room 4B, Zoom link, Google Meet URL..."
                  style={inp} onFocus={e => e.target.style.borderColor = '#6c63ff'} onBlur={e => e.target.style.borderColor = 'var(--border,#252836)'} />
              </div>

              {/* Project */}
              <div>
                <label style={labelS}>Link to Project (optional)</label>
                <select value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
                  style={{ ...inp, cursor: 'pointer' }}>
                  <option value="">None</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* Attendees */}
              <div>
                <label style={labelS}>Attendees (comma-separated usernames)</label>
                <input value={form.attendees} onChange={e => setForm(f => ({ ...f, attendees: e.target.value }))}
                  placeholder="alice, bob, charlie"
                  style={inp} onFocus={e => e.target.style.borderColor = '#6c63ff'} onBlur={e => e.target.style.borderColor = 'var(--border,#252836)'} />
              </div>

              {/* Description */}
              <div>
                <label style={labelS}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of the meeting..."
                  rows={2} style={{ ...inp, resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = '#6c63ff'} onBlur={e => e.target.style.borderColor = 'var(--border,#252836)'} />
              </div>

              {/* Agenda */}
              <div>
                <label style={labelS}>Agenda</label>
                <textarea value={form.agenda} onChange={e => setForm(f => ({ ...f, agenda: e.target.value }))}
                  placeholder="1. Review sprint progress&#10;2. Discuss blockers&#10;3. Plan next steps"
                  rows={4} style={{ ...inp, resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = '#6c63ff'} onBlur={e => e.target.style.borderColor = 'var(--border,#252836)'} />
              </div>

              {/* Notes */}
              <div>
                <label style={labelS}>Meeting Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Notes taken during or after the meeting..."
                  rows={3} style={{ ...inp, resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = '#6c63ff'} onBlur={e => e.target.style.borderColor = 'var(--border,#252836)'} />
              </div>

              {/* Action items */}
              <div>
                <label style={labelS}>Action Items</label>
                <textarea value={form.actionItems} onChange={e => setForm(f => ({ ...f, actionItems: e.target.value }))}
                  placeholder="- @alice: Update the API docs by Friday&#10;- @bob: Fix login bug before next sprint"
                  rows={3} style={{ ...inp, resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = '#6c63ff'} onBlur={e => e.target.style.borderColor = 'var(--border,#252836)'} />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border,#252836)', color: 'var(--muted,#7a7f95)', borderRadius: 11, padding: '0.75rem', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{ flex: 2, background: saving ? 'var(--surface2,#1a1d26)' : 'linear-gradient(135deg, #6c63ff, #5a52d5)', color: saving ? 'var(--muted,#7a7f95)' : '#fff', border: 'none', borderRadius: 11, padding: '0.75rem', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem', boxShadow: saving ? 'none' : '0 4px 16px rgba(108,99,255,0.35)' }}>
                  {saving ? 'Saving...' : editingId ? '✓ Update Meeting' : '📅 Schedule Meeting'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}