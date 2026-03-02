// FILE: src/pages/WorkloadPage.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/shared/Navbar'
import { getWorkload } from '../api/taskApi'
import api from '../api/axiosInstance'

const COLORS = ['#6c63ff','#00d4aa','#ffd166','#ff9b9b','#00b4d8','#a09bff','#ff9b9b','#00d4aa']
const STATUS_COLORS = { TODO: '#7a7f95', IN_PROGRESS: '#ffd166', DONE: '#00d4aa' }

const getInitials = (n) => n ? n.split(/[_\s-]/).map(w => w[0]?.toUpperCase()).slice(0,2).join('') : '?'
const avatarColor = (n) => COLORS[(n?.charCodeAt(0) || 0) % COLORS.length]

export default function WorkloadPage() {
  const { projectId } = useParams()
  const navigate      = useNavigate()

  const [workload,     setWorkload]     = useState([])
  const [projectName,  setProjectName]  = useState(`Project #${projectId}`)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [sortBy,       setSortBy]       = useState('total') // 'total' | 'name' | 'done'

  useEffect(() => { loadData() }, [projectId])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [workRes, projRes] = await Promise.allSettled([
        getWorkload(projectId),
        api.get(`/api/projects/${projectId}`),
      ])

      if (projRes.status === 'fulfilled' && projRes.value.data?.name)
        setProjectName(projRes.value.data.name)

      if (workRes.status === 'fulfilled') {
        const data = workRes.value.data || []
        setWorkload(Array.isArray(data) ? data : data.content || [])
      } else {
        // Build workload from tasks if endpoint doesn't exist
        const tasksRes = await api.get(`/api/projects/${projectId}/tasks`)
        const tasks = tasksRes.data || []
        const map = {}
        tasks.forEach(t => {
          const user = t.assignedTo || 'Unassigned'
          if (!map[user]) map[user] = { username: user, todo: 0, inProgress: 0, done: 0, total: 0 }
          if (t.status === 'TODO')        map[user].todo++
          if (t.status === 'IN_PROGRESS') map[user].inProgress++
          if (t.status === 'DONE')        map[user].done++
          map[user].total++
        })
        setWorkload(Object.values(map))
      }
    } catch (err) {
      setError('Failed to load workload data.')
    } finally { setLoading(false) }
  }

  // Sort workload
  const sorted = [...workload].sort((a, b) => {
    if (sortBy === 'name')  return (a.username || '').localeCompare(b.username || '')
    if (sortBy === 'done')  return (b.done || b.tasksDone || 0) - (a.done || a.tasksDone || 0)
    return (b.total || b.totalTasks || 0) - (a.total || a.totalTasks || 0)
  })

  const maxTotal = Math.max(...sorted.map(w => w.total || w.totalTasks || 0), 1)

  // Normalize field names (backend might use different names)
  const normalize = (w) => ({
    username:   w.username || w.memberUsername || w.user || 'Unknown',
    todo:       w.todo       ?? w.todoTasks       ?? w.todoCount       ?? 0,
    inProgress: w.inProgress ?? w.inProgressTasks ?? w.inProgressCount ?? 0,
    done:       w.done       ?? w.tasksDone       ?? w.doneCount       ?? 0,
    total:      w.total      ?? w.totalTasks      ?? w.taskCount       ?? 0,
    hoursLogged:w.hoursLogged ?? w.loggedHours    ?? 0,
  })

  return (
    <div style={{ minHeight: '100vh', background: '#0a0b0e' }}>
      <Navbar />
      <main style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <button onClick={() => navigate(`/projects/${projectId}`)}
              style={{ background: 'none', border: 'none', color: '#7a7f95', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.82rem', marginBottom: '0.5rem', padding: 0 }}>
              ← Back to Project
            </button>
            <h1 style={{ color: '#e8eaf0', fontWeight: 800, fontSize: '1.35rem', margin: 0 }}>
              📊 Team Workload
            </h1>
            <p style={{ color: '#5a6080', fontSize: '0.78rem', margin: '0.2rem 0 0' }}>
              {projectName} · {workload.length} members
            </p>
          </div>

          {/* Sort control */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {[['total','Most Tasks'],['done','Most Done'],['name','Name A-Z']].map(([val, label]) => (
              <button key={val} onClick={() => setSortBy(val)} style={{
                background: sortBy === val ? 'rgba(108,99,255,0.15)' : 'transparent',
                border: `1px solid ${sortBy === val ? 'rgba(108,99,255,0.4)' : '#252836'}`,
                color: sortBy === val ? '#a09bff' : '#5a6080',
                padding: '0.35rem 0.75rem', borderRadius: 8, cursor: 'pointer',
                fontFamily: 'Outfit, sans-serif', fontSize: '0.72rem', fontWeight: 600, transition: 'all 0.15s',
              }}>{label}</button>
            ))}
            <button onClick={loadData} style={{ background: 'transparent', border: '1px solid #252836', color: '#5a6080', padding: '0.35rem 0.7rem', borderRadius: 8, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.72rem' }}>↻</button>
          </div>
        </div>

        {/* Summary cards */}
        {!loading && !error && workload.length > 0 && (() => {
          const totals = workload.reduce((acc, w) => {
            const n = normalize(w)
            acc.todo       += n.todo
            acc.inProgress += n.inProgress
            acc.done       += n.done
            acc.total      += n.total
            return acc
          }, { todo: 0, inProgress: 0, done: 0, total: 0 })
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem', marginBottom: '2rem' }}>
              {[
                { label: 'Total Tasks',  val: totals.total,      color: '#a09bff' },
                { label: 'To Do',        val: totals.todo,       color: '#7a7f95' },
                { label: 'In Progress',  val: totals.inProgress, color: '#ffd166' },
                { label: 'Done',         val: totals.done,       color: '#00d4aa' },
              ].map(s => (
                <div key={s.label} style={{ background: '#0e1018', border: '1px solid #1a1d26', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
                  <p style={{ color: s.color, fontSize: '1.6rem', fontWeight: 900, margin: '0 0 0.2rem' }}>{s.val}</p>
                  <p style={{ color: '#5a6080', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>
          )
        })()}

        {/* Workload table */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#5a6080', padding: '4rem', fontSize: '0.85rem' }}>Loading workload...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', background: 'rgba(255,107,107,0.07)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 14, padding: '2rem', color: '#ff9b9b', fontSize: '0.85rem' }}>{error}</div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#5a6080', padding: '4rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👤</div>
            <p>No workload data. Assign tasks to team members first.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sorted.map((raw, i) => {
              const w   = normalize(raw)
              const pct = w.total > 0 ? Math.round((w.done / w.total) * 100) : 0
              const load = w.total > 0 ? Math.round((w.total / maxTotal) * 100) : 0

              return (
                <div key={w.username + i} style={{
                  background: '#0e1018', border: '1px solid #1a1d26',
                  borderRadius: 14, padding: '1.1rem 1.25rem',
                  transition: 'border-color 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#252836'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#1a1d26'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>

                    {/* Avatar + name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', minWidth: 140 }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: avatarColor(w.username), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: 'white', flexShrink: 0 }}>
                        {getInitials(w.username)}
                      </div>
                      <div>
                        <p style={{ color: '#e8eaf0', fontWeight: 700, fontSize: '0.87rem', margin: 0 }}>{w.username}</p>
                        <p style={{ color: '#5a6080', fontSize: '0.65rem', margin: '0.1rem 0 0' }}>{w.total} task{w.total !== 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    {/* Status pill counts */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {[
                        { label: 'Todo',       val: w.todo,       color: '#7a7f95', bg: 'rgba(122,127,149,0.1)'  },
                        { label: 'In Progress',val: w.inProgress, color: '#ffd166', bg: 'rgba(255,209,102,0.1)' },
                        { label: 'Done',       val: w.done,       color: '#00d4aa', bg: 'rgba(0,212,170,0.1)'   },
                      ].map(s => (
                        <span key={s.label} style={{ background: s.bg, color: s.color, fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 20 }}>
                          {s.val} {s.label}
                        </span>
                      ))}
                      {w.hoursLogged > 0 && (
                        <span style={{ background: 'rgba(108,99,255,0.1)', color: '#a09bff', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 20 }}>
                          ⏱ {w.hoursLogged}h logged
                        </span>
                      )}
                    </div>

                    {/* Completion % */}
                    <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ color: pct >= 70 ? '#00d4aa' : pct >= 40 ? '#ffd166' : '#7a7f95', fontWeight: 800, fontSize: '1rem', margin: 0 }}>{pct}%</p>
                      <p style={{ color: '#3a3f52', fontSize: '0.6rem', margin: 0 }}>complete</p>
                    </div>
                  </div>

                  {/* Workload bar */}
                  <div style={{ marginTop: '0.85rem' }}>
                    <div style={{ height: 6, background: '#1a1d26', borderRadius: 3, overflow: 'hidden' }}>
                      {/* Stacked bar: done | in_progress | todo */}
                      <div style={{ height: '100%', display: 'flex', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${w.total > 0 ? (w.done / w.total) * load : 0}%`, background: '#00d4aa', transition: 'width 0.5s' }} />
                        <div style={{ width: `${w.total > 0 ? (w.inProgress / w.total) * load : 0}%`, background: '#ffd166', transition: 'width 0.5s' }} />
                        <div style={{ width: `${w.total > 0 ? (w.todo / w.total) * load : 0}%`, background: '#3a3f52', transition: 'width 0.5s' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
                      <span style={{ color: '#3a3f52', fontSize: '0.6rem' }}>Workload relative to team</span>
                      <span style={{ color: '#3a3f52', fontSize: '0.6rem' }}>{load}% of max</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
