// FILE: src/pages/UserProfilePage.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/shared/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axiosInstance'

const COLORS = ['#6c63ff','#00d4aa','#ffd166','#ff9b9b','#00b4d8','#a09bff','#f72585','#4cc9f0']
const avatarBg = (n) => `linear-gradient(135deg, ${COLORS[(n?.charCodeAt(0)||0)%COLORS.length]}, ${COLORS[(n?.charCodeAt(1)||1)%COLORS.length]})`
const initials = (n) => (n||'?').split(/[_\s-]/).filter(Boolean).map(w=>w[0].toUpperCase()).slice(0,2).join('')

const ROLE_BADGE = {
  ADMIN:           { bg: 'rgba(255,107,107,.15)', border: 'rgba(255,107,107,.3)', color: '#ff9b9b', label: '🔑 Admin' },
  PROJECT_MANAGER: { bg: 'rgba(108,99,255,.12)',  border: 'rgba(108,99,255,.3)',  color: '#a09bff', label: '🛠 Manager' },
  USER:            { bg: 'rgba(0,212,170,.1)',    border: 'rgba(0,212,170,.25)', color: '#00d4aa', label: '👤 User' },
}

export default function UserProfilePage() {
  const { username: profileUser } = useParams()
  const { username: me, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile]   = useState(null)
  const [tasks,   setTasks]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [error,   setError]     = useState(null)

  const isMe = profileUser === me

  useEffect(() => {
    loadProfile()
  }, [profileUser])

  const loadProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      // Try profile endpoint, fallback to /me
      let profileData = null
      try {
        const res = await api.get(`/api/users/${profileUser}/profile`)
        profileData = res.data
      } catch {
        if (isMe) {
          const res = await api.get('/api/auth/me')
          profileData = res.data
        }
      }

      setProfile(profileData)

      // Load user's tasks
      try {
        const taskRes = await api.get('/api/tasks/my-tasks')
        setTasks(Array.isArray(taskRes.data) ? taskRes.data : [])
      } catch { setTasks([]) }
    } catch (err) {
      setError('Could not load profile.')
    } finally { setLoading(false) }
  }

  const taskStats = {
    total:      tasks.length,
    todo:       tasks.filter(t => t.status === 'TODO').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    done:       tasks.filter(t => t.status === 'DONE').length,
  }

  const rb = ROLE_BADGE[profile?.role] || ROLE_BADGE.USER

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg,#0a0b0e)', fontFamily: 'Outfit, sans-serif' }}>
      <Navbar />
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted,#7a7f95)' }}>Loading profile...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg,#0a0b0e)', fontFamily: 'Outfit, sans-serif' }}>
      <Navbar />
      <main style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>

        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--muted,#7a7f95)', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem', marginBottom: '1.5rem', padding: 0 }}>
          ← Back
        </button>

        {error ? (
          <div style={{ background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 14, padding: '2rem', textAlign: 'center', color: '#ff9b9b' }}>
            {error}
          </div>
        ) : (
          <>
            {/* Profile card */}
            <div style={{ background: 'var(--surface,#12141a)', border: '1px solid var(--border,#252836)', borderRadius: 20, overflow: 'hidden', marginBottom: '1.5rem' }}>
              {/* Banner */}
              <div style={{ height: 100, background: `linear-gradient(135deg, rgba(108,99,255,0.3), rgba(0,212,170,0.2))` }} />

              <div style={{ padding: '0 1.75rem 1.75rem', marginTop: -44 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: avatarBg(profileUser), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 800, color: '#fff', border: '3px solid var(--bg,#0a0b0e)', flexShrink: 0, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
                    {initials(profileUser)}
                  </div>
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    {isMe && (
                      <button onClick={() => navigate('/settings')} style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.25)', color: '#a09bff', padding: '0.5rem 1rem', borderRadius: 9, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.8rem', fontWeight: 600 }}>
                        ⚙️ Settings
                      </button>
                    )}
                    {!isMe && (
                      <button onClick={() => navigate(`/messages/${profileUser}`)} style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.25)', color: '#00d4aa', padding: '0.5rem 1rem', borderRadius: 9, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.8rem', fontWeight: 600 }}>
                        💬 Message
                      </button>
                    )}
                  </div>
                </div>

                <h1 style={{ color: 'var(--text,#e8eaf0)', fontWeight: 800, fontSize: '1.4rem', margin: '0.75rem 0 0.25rem' }}>{profileUser}</h1>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ background: rb.bg, border: `1px solid ${rb.border}`, color: rb.color, fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.65rem', borderRadius: 20 }}>{rb.label}</span>
                  {profile?.email && <span style={{ color: 'var(--muted,#7a7f95)', fontSize: '0.8rem' }}>✉️ {profile.email}</span>}
                  {isMe && <span style={{ background: 'rgba(108,99,255,0.1)', color: '#a09bff', fontSize: '0.6rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 10 }}>That's you!</span>}
                </div>
              </div>
            </div>

            {/* Task Stats */}
            {isMe && (
              <>
                <h2 style={{ color: 'var(--text,#e8eaf0)', fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>📊 My Task Stats</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {[
                    { label: 'Total',       val: taskStats.total,      color: '#a09bff' },
                    { label: 'To Do',       val: taskStats.todo,       color: '#7a7f95' },
                    { label: 'In Progress', val: taskStats.inProgress, color: '#ffd166' },
                    { label: 'Done',        val: taskStats.done,       color: '#00d4aa' },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'var(--surface,#12141a)', border: '1px solid var(--border,#252836)', borderRadius: 14, padding: '1rem', textAlign: 'center' }}>
                      <p style={{ color: s.color, fontSize: '1.7rem', fontWeight: 900, margin: 0 }}>{s.val}</p>
                      <p style={{ color: 'var(--muted,#7a7f95)', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Recent tasks */}
                {tasks.length > 0 && (
                  <div style={{ background: 'var(--surface,#12141a)', border: '1px solid var(--border,#252836)', borderRadius: 16, overflow: 'hidden' }}>
                    <div style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid var(--border,#252836)', background: 'rgba(108,99,255,0.04)' }}>
                      <h3 style={{ color: 'var(--text,#e8eaf0)', fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>📋 My Assigned Tasks</h3>
                    </div>
                    <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                      {tasks.slice(0, 20).map(task => {
                        const statusColor = task.status === 'DONE' ? '#00d4aa' : task.status === 'IN_PROGRESS' ? '#ffd166' : '#7a7f95'
                        return (
                          <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border,#252836)' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
                            <span style={{ color: 'var(--text,#e8eaf0)', fontSize: '0.82rem', flex: 1 }}>{task.title}</span>
                            <span style={{ color: statusColor, fontSize: '0.65rem', fontWeight: 700 }}>{task.status?.replace('_',' ')}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
