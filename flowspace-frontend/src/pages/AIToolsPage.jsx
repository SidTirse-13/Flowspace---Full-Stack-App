// FILE: src/pages/AIToolsPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/shared/Navbar'
import { useAuth } from '../context/AuthContext'
import { getMyTasks } from '../api/taskApi'
import { getProjects } from '../api/projectApi'
import api from '../api/axiosInstance'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || ''
const GROQ_MODEL   = 'llama-3.1-8b-instant'

async function callGroq(messages) {
  if (!GROQ_API_KEY) throw new Error('VITE_GROQ_API_KEY not set in your .env file')
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({ model: GROQ_MODEL, messages, max_tokens: 1024, temperature: 0.72 }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'Groq API error')
  return data.choices[0]?.message?.content || ''
}

// Is a date within the last N days?
const isRecent = (dateStr, days = 2) => {
  if (!dateStr) return false
  const d = Array.isArray(dateStr)
    ? new Date(dateStr[0], dateStr[1]-1, dateStr[2])
    : new Date(dateStr)
  return (Date.now() - d.getTime()) < days * 86400000
}

const isOverdue = (task) => {
  if (!task.endDate || task.status === 'DONE') return false
  const d = Array.isArray(task.endDate)
    ? new Date(task.endDate[0], task.endDate[1]-1, task.endDate[2])
    : new Date(task.endDate)
  return d < new Date()
}

const formatDate = (d) => {
  if (!d) return null
  if (Array.isArray(d)) return `${d[0]}-${String(d[1]).padStart(2,'0')}-${String(d[2]).padStart(2,'0')}`
  return String(d).split('T')[0]
}

export default function AIToolsPage() {
  const { username } = useAuth()
  const navigate = useNavigate()

  const [myTasks,  setMyTasks]  = useState([])
  const [projects, setProjects] = useState([])
  const [auditLogs,setAuditLogs]= useState([])
  const [activeTab,setActiveTab]= useState('standup')

  // Standup state
  const [standup,         setStandup]         = useState('')
  const [standupLoading,  setStandupLoading]  = useState(false)
  const [copied,          setCopied]          = useState(false)
  const [standupTone,     setStandupTone]     = useState('professional') // professional | casual | detailed

  // Breakdown state
  const [bigTask,          setBigTask]          = useState('')
  const [context,          setContext]          = useState('')
  const [breakdown,        setBreakdown]        = useState([])
  const [breakdownLoading, setBreakdownLoading] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.allSettled([getMyTasks(), getProjects()])
      if (tasksRes.status === 'fulfilled') setMyTasks(tasksRes.value.data || [])
      if (projectsRes.status === 'fulfilled') setProjects(projectsRes.value.data?.content || projectsRes.value.data || [])

      // Load recent audit logs for standup context
      try {
        const auditRes = await api.get('/api/audit/me')
        const logs = Array.isArray(auditRes.data) ? auditRes.data : []
        // Only last 2 days of logs
        setAuditLogs(logs.filter(l => isRecent(l.timestamp, 2)))
      } catch {}
    } catch {}
  }

  // ── STANDUP GENERATOR ──────────────────────────────────────────
  const generateStandup = async () => {
    setStandupLoading(true)
    setStandup('')
    try {
      const today     = new Date()
      const todayStr  = today.toDateString()
      const yestStr   = new Date(Date.now() - 86400000).toDateString()

      // Tasks with endDate = today or yesterday → likely worked on recently
      const recentDone = myTasks.filter(t =>
        t.status === 'DONE' && (
          isRecent(t.endDate, 3) ||
          auditLogs.some(l => l.action === 'STATUS_CHANGE' && l.description?.includes(t.title))
        )
      )

      // Tasks currently in progress
      const inProgress = myTasks.filter(t => t.status === 'IN_PROGRESS')

      // Overdue tasks = blockers
      const overdue = myTasks.filter(t => isOverdue(t))

      // Upcoming TODO tasks (due soon)
      const upcomingTodo = myTasks
        .filter(t => t.status === 'TODO')
        .sort((a, b) => {
          if (!a.endDate) return 1
          if (!b.endDate) return -1
          return new Date(formatDate(a.endDate)) - new Date(formatDate(b.endDate))
        })
        .slice(0, 4)

      // Recent activity from audit logs
      const recentActivity = auditLogs
        .slice(0, 8)
        .map(l => l.description)
        .filter(Boolean)
        .join('\n')

      const toneGuide = {
        professional: 'Write in a professional, concise tone suitable for a business Slack channel.',
        casual:       'Write in a friendly, casual tone like you are messaging your team.',
        detailed:     'Write a detailed standup with specific context, challenges faced, and clear next steps.',
      }

      const systemMsg = `You are an expert at writing accurate, professional daily standup updates. You only use the task data provided — never invent or assume tasks.`

      const userMsg = `Generate a daily standup update for ${username} on ${todayStr}.

${toneGuide[standupTone]}

REAL DATA — use ONLY this:

**Tasks completed recently (last 2-3 days, based on endDate or status change):**
${recentDone.length > 0
  ? recentDone.map(t => `- "${t.title}" [project: ${t.projectName || 'Unknown'}]`).join('\n')
  : '- No tasks marked as DONE recently'}

**Currently IN_PROGRESS tasks (working on these today):**
${inProgress.length > 0
  ? inProgress.map(t => `- "${t.title}" [project: ${t.projectName || 'Unknown'}${t.endDate ? `, due: ${formatDate(t.endDate)}` : ''}]`).join('\n')
  : '- No tasks currently in progress'}

**Next TODO tasks to pick up (sorted by due date):**
${upcomingTodo.length > 0
  ? upcomingTodo.map(t => `- "${t.title}" [project: ${t.projectName || 'Unknown'}${t.endDate ? `, due: ${formatDate(t.endDate)}` : ''}]`).join('\n')
  : '- No upcoming tasks'}

**Overdue tasks (potential blockers):**
${overdue.length > 0
  ? overdue.map(t => `- "${t.title}" was due ${formatDate(t.endDate)}`).join('\n')
  : '- No overdue tasks'}

**Recent activity log (last 48h):**
${recentActivity || '- No recent audit activity'}

INSTRUCTIONS:
- Use ONLY the task names from the data above. Never make up task names.
- For "Yesterday" section: use recently completed tasks. If none, say "No tasks completed — working on in-progress items"
- For "Today" section: use in-progress tasks first, then upcoming TODOs
- For "Blockers" section: use overdue tasks. If none, write "No blockers"
- Keep it under 150 words total
- Format EXACTLY as:

**Yesterday:**
[content]

**Today:**
[content]

**Blockers:**
[content]`

      const result = await callGroq([
        { role: 'system', content: systemMsg },
        { role: 'user',   content: userMsg },
      ])
      setStandup(result.trim())
    } catch (err) {
      setStandup(`❌ Error: ${err.message}\n\nMake sure VITE_GROQ_API_KEY is set in your .env file.`)
    } finally {
      setStandupLoading(false)
    }
  }

  const copyStandup = () => {
    navigator.clipboard.writeText(standup.replace(/\*\*/g, '')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // ── TASK BREAKDOWN ─────────────────────────────────────────────
  const generateBreakdown = async () => {
    if (!bigTask.trim()) return
    setBreakdownLoading(true)
    setBreakdown([])
    try {
      const prompt = `You are an expert software project manager. Break down the following task into smaller, actionable subtasks.

BIG TASK: "${bigTask}"
${context ? `CONTEXT: ${context}` : ''}

Generate 5-8 specific, actionable subtasks. Each should be completable in 1-4 hours.

Respond ONLY with a valid JSON array (no markdown, no code fences, no explanation):
[{"title":"string","description":"string","priority":"HIGH|MEDIUM|LOW","estimatedHours":2}]`

      const result = await callGroq([{ role: 'user', content: prompt }])
      const clean  = result.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setBreakdown(Array.isArray(parsed) ? parsed : [])
    } catch (err) {
      setBreakdown([{
        title: `Error generating breakdown`,
        description: err.message.includes('JSON') ? 'AI returned unexpected format. Try again.' : err.message,
        priority: 'HIGH', estimatedHours: 0
      }])
    } finally {
      setBreakdownLoading(false)
    }
  }

  const PRIORITY_COLORS = {
    HIGH:   { color: '#ff9b9b', bg: 'rgba(255,155,155,0.1)', border: 'rgba(255,155,155,0.25)' },
    MEDIUM: { color: '#ffd166', bg: 'rgba(255,209,102,0.1)', border: 'rgba(255,209,102,0.25)' },
    LOW:    { color: '#7a7f95', bg: 'rgba(122,127,149,0.1)', border: 'rgba(122,127,149,0.25)' },
  }

  const inp = {
    width: '100%', background: 'var(--surface2,#1a1d26)', border: '1px solid var(--border,#252836)',
    borderRadius: 10, padding: '0.75rem 1rem', color: 'var(--text,#e8eaf0)',
    fontSize: '0.875rem', fontFamily: 'Outfit, sans-serif', outline: 'none', boxSizing: 'border-box',
  }

  // Stats for standup preview
  const doneCt       = myTasks.filter(t => t.status === 'DONE').length
  const inProgressCt = myTasks.filter(t => t.status === 'IN_PROGRESS').length
  const todoCt       = myTasks.filter(t => t.status === 'TODO').length
  const overdueCt    = myTasks.filter(t => isOverdue(t)).length
  const recentDoneCt = myTasks.filter(t => t.status === 'DONE' && isRecent(t.endDate, 3)).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg,#0a0b0e)', fontFamily: 'Outfit, sans-serif' }}>
      <Navbar />
      <main style={{ padding: '2rem', maxWidth: 820, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, rgba(108,99,255,0.2), rgba(0,212,170,0.1))', border: '1px solid rgba(108,99,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>🤖</div>
          <div>
            <h1 style={{ color: 'var(--text,#e8eaf0)', fontWeight: 800, fontSize: '1.35rem', margin: 0 }}>AI Tools</h1>
            <p style={{ color: 'var(--muted,#5a6080)', fontSize: '0.78rem', margin: 0 }}>Powered by Groq · Llama 3.1 · Uses your real task data</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'var(--surface,#0e1018)', padding: '0.35rem', borderRadius: 12, border: '1px solid var(--border,#1a1d26)', width: 'fit-content' }}>
          {[
            { key: 'standup',   label: '☀️ Daily Standup' },
            { key: 'breakdown', label: '🧩 Task Breakdown' },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              background: activeTab === t.key ? 'linear-gradient(135deg, rgba(108,99,255,0.2), rgba(0,212,170,0.1))' : 'transparent',
              border: activeTab === t.key ? '1px solid rgba(108,99,255,0.3)' : '1px solid transparent',
              color: activeTab === t.key ? 'var(--text,#e8eaf0)' : 'var(--dim,#5a6080)',
              padding: '0.55rem 1.25rem', borderRadius: 9, cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.15s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── STANDUP TAB ── */}
        {activeTab === 'standup' && (
          <div>
            {/* How it works */}
            <div style={{ background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.15)', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
              <p style={{ color: '#a09bff', fontSize: '0.82rem', fontWeight: 700, margin: '0 0 0.3rem' }}>☀️ How it works</p>
              <p style={{ color: 'var(--muted,#7a7f95)', fontSize: '0.78rem', margin: 0, lineHeight: 1.6 }}>
                Reads your <strong style={{ color: 'var(--text,#e8eaf0)' }}>real tasks</strong> — what you completed recently, what's in progress, and what's overdue — then writes an accurate standup using only your actual data. Never makes up tasks.
              </p>
            </div>

            {/* Live task stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.6rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Recently Done', count: recentDoneCt, color: '#00d4aa', note: 'last 3 days' },
                { label: 'In Progress',  count: inProgressCt, color: '#ffd166', note: 'working now' },
                { label: 'Todo',         count: todoCt,       color: '#7a7f95', note: 'upcoming' },
                { label: 'Overdue',      count: overdueCt,    color: '#ff9b9b', note: 'blockers' },
                { label: 'Total Tasks',  count: myTasks.length, color: '#a09bff', note: 'assigned' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--surface,#0e1018)', border: '1px solid var(--border,#1a1d26)', borderRadius: 10, padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                  <p style={{ color: s.color, fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.1rem' }}>{s.count}</p>
                  <p style={{ color: 'var(--dim,#5a6080)', fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.1rem' }}>{s.label}</p>
                  <p style={{ color: 'var(--dim,#3a3f52)', fontSize: '0.58rem', margin: 0 }}>{s.note}</p>
                </div>
              ))}
            </div>

            {/* Tone selector */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ color: 'var(--muted,#7a7f95)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '0.5rem' }}>TONE</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[
                  { key: 'professional', label: '👔 Professional' },
                  { key: 'casual',       label: '😊 Casual' },
                  { key: 'detailed',     label: '📋 Detailed' },
                ].map(t => (
                  <button key={t.key} onClick={() => setStandupTone(t.key)} style={{
                    background: standupTone === t.key ? 'rgba(108,99,255,0.15)' : 'transparent',
                    border: `1px solid ${standupTone === t.key ? 'rgba(108,99,255,0.4)' : 'var(--border,#252836)'}`,
                    color: standupTone === t.key ? '#a09bff' : 'var(--dim,#5a6080)',
                    padding: '0.4rem 0.9rem', borderRadius: 8, cursor: 'pointer',
                    fontFamily: 'Outfit, sans-serif', fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.15s',
                  }}>{t.label}</button>
                ))}
              </div>
            </div>

            <button onClick={generateStandup} disabled={standupLoading} style={{
              width: '100%', border: 'none', borderRadius: 12, padding: '0.9rem',
              background: standupLoading ? 'var(--surface2,#1a1d26)' : 'linear-gradient(135deg, #6c63ff, #5a52d5)',
              color: standupLoading ? 'var(--dim,#5a6080)' : '#fff',
              fontSize: '0.95rem', fontWeight: 700, cursor: standupLoading ? 'not-allowed' : 'pointer',
              fontFamily: 'Outfit, sans-serif', marginBottom: '1.5rem',
              boxShadow: standupLoading ? 'none' : '0 4px 20px rgba(108,99,255,0.3)',
            }}>
              {standupLoading ? '🤖 Generating from your real tasks...' : '☀️ Generate My Daily Standup'}
            </button>

            {standup && (
              <div style={{ background: 'var(--surface,#0e1018)', border: '1px solid rgba(108,99,255,0.25)', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.1rem', borderBottom: '1px solid var(--border,#1a1d26)', background: 'rgba(108,99,255,0.06)' }}>
                  <span style={{ color: '#a09bff', fontSize: '0.8rem', fontWeight: 700 }}>🤖 Your Standup — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={copyStandup} style={{
                      background: copied ? 'rgba(0,212,170,0.15)' : 'rgba(108,99,255,0.1)',
                      border: `1px solid ${copied ? 'rgba(0,212,170,0.3)' : 'rgba(108,99,255,0.25)'}`,
                      color: copied ? '#00d4aa' : '#a09bff',
                      padding: '0.3rem 0.75rem', borderRadius: 7, cursor: 'pointer',
                      fontFamily: 'Outfit, sans-serif', fontSize: '0.72rem', fontWeight: 600,
                    }}>{copied ? '✅ Copied!' : '📋 Copy'}</button>
                    <button onClick={generateStandup} style={{
                      background: 'transparent', border: '1px solid var(--border,#252836)',
                      color: 'var(--muted,#7a7f95)', padding: '0.3rem 0.75rem', borderRadius: 7,
                      cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.72rem',
                    }}>↻ Regenerate</button>
                  </div>
                </div>

                <div style={{ padding: '1.25rem' }}>
                  {standup.split('\n').map((line, i) => {
                    const isHeader = line.startsWith('**') && line.endsWith('**')
                    const clean    = line.replace(/\*\*/g, '')
                    return (
                      <p key={i} style={{
                        color: isHeader ? 'var(--text,#e8eaf0)' : 'var(--muted,#a0a5bc)',
                        fontWeight: isHeader ? 800 : 400,
                        fontSize: isHeader ? '0.875rem' : '0.82rem',
                        lineHeight: 1.75, margin: isHeader ? '0.75rem 0 0.2rem' : '0 0 0.1rem',
                        marginTop: i === 0 ? 0 : undefined,
                      }}>
                        {clean}
                      </p>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── BREAKDOWN TAB ── */}
        {activeTab === 'breakdown' && (
          <div>
            <div style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.15)', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
              <p style={{ color: '#00d4aa', fontSize: '0.82rem', fontWeight: 700, margin: '0 0 0.3rem' }}>🧩 How it works</p>
              <p style={{ color: 'var(--muted,#7a7f95)', fontSize: '0.78rem', margin: 0, lineHeight: 1.6 }}>
                Describe any big feature or task. AI breaks it into 5–8 actionable subtasks with priority and time estimate. Copy them directly into your Flowspace project.
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: 'var(--muted,#7a7f95)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '0.4rem' }}>BIG TASK OR FEATURE *</label>
              <input
                type="text"
                placeholder='e.g. "Build user authentication system" or "Create dashboard analytics page"'
                value={bigTask} onChange={e => setBigTask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !breakdownLoading && generateBreakdown()}
                style={inp}
                onFocus={e => e.target.style.borderColor = '#6c63ff'}
                onBlur={e => e.target.style.borderColor = 'var(--border,#252836)'}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ color: 'var(--muted,#7a7f95)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '0.4rem' }}>ADDITIONAL CONTEXT (optional)</label>
              <textarea
                placeholder='e.g. "Spring Boot backend, React frontend, JWT auth, PostgreSQL database"'
                value={context} onChange={e => setContext(e.target.value)}
                rows={3} style={{ ...inp, resize: 'vertical' }}
                onFocus={e => e.target.style.borderColor = '#6c63ff'}
                onBlur={e => e.target.style.borderColor = 'var(--border,#252836)'}
              />
            </div>

            <button onClick={generateBreakdown} disabled={breakdownLoading || !bigTask.trim()} style={{
              width: '100%', border: 'none', borderRadius: 12, padding: '0.9rem',
              background: breakdownLoading || !bigTask.trim() ? 'var(--surface2,#1a1d26)' : 'linear-gradient(135deg, #00d4aa, #00a884)',
              color: breakdownLoading || !bigTask.trim() ? 'var(--dim,#5a6080)' : '#0a0b0e',
              fontSize: '0.95rem', fontWeight: 700,
              cursor: breakdownLoading || !bigTask.trim() ? 'not-allowed' : 'pointer',
              fontFamily: 'Outfit, sans-serif', marginBottom: '1.5rem',
              boxShadow: breakdownLoading || !bigTask.trim() ? 'none' : '0 4px 20px rgba(0,212,170,0.3)',
            }}>
              {breakdownLoading ? '🤖 Breaking down task...' : '🧩 Break Down This Task'}
            </button>

            {breakdown.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <p style={{ color: 'var(--text,#e8eaf0)', fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>
                    🎯 {breakdown.length} Subtasks Generated
                  </p>
                  <span style={{ color: 'var(--dim,#5a6080)', fontSize: '0.72rem' }}>
                    ~{breakdown.reduce((s, t) => s + (Number(t.estimatedHours) || 0), 0)}h total
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {breakdown.map((task, i) => {
                    const pc = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM
                    return (
                      <div key={i} style={{
                        background: 'var(--surface,#0e1018)', border: '1px solid var(--border,#1a1d26)',
                        borderRadius: 12, padding: '0.9rem 1rem',
                        position: 'relative', overflow: 'hidden', transition: 'border-color 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = pc.border}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border,#1a1d26)'}
                      >
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: pc.color, borderRadius: '12px 0 0 12px' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginLeft: '0.75rem' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                              <span style={{ color: 'var(--dim,#3a3f52)', fontSize: '0.7rem', fontFamily: 'monospace' }}>#{i + 1}</span>
                              <p style={{ color: 'var(--text,#e8eaf0)', fontWeight: 700, fontSize: '0.875rem', margin: 0 }}>{task.title}</p>
                            </div>
                            {task.description && (
                              <p style={{ color: 'var(--muted,#7a7f95)', fontSize: '0.78rem', margin: '0 0 0.5rem', lineHeight: 1.5 }}>{task.description}</p>
                            )}
                            <span style={{ background: pc.bg, border: `1px solid ${pc.border}`, color: pc.color, fontSize: '0.6rem', fontWeight: 700, padding: '0.12rem 0.5rem', borderRadius: 20 }}>
                              {task.priority}
                            </span>
                          </div>
                          {Number(task.estimatedHours) > 0 && (
                            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
                              <p style={{ color: '#ffd166', fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>{task.estimatedHours}h</p>
                              <p style={{ color: 'var(--dim,#5a6080)', fontSize: '0.58rem', margin: 0 }}>est.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <button onClick={() => {
                  const text = breakdown.map((t, i) =>
                    `${i+1}. ${t.title} (${t.priority}, ~${t.estimatedHours}h)\n   ${t.description}`
                  ).join('\n\n')
                  navigator.clipboard.writeText(text).then(() => {
                    const btn = document.getElementById('copy-all-btn')
                    if (btn) { btn.textContent = '✅ All Copied!'; setTimeout(() => { btn.textContent = '📋 Copy All as Text' }, 2000) }
                  })
                }} id="copy-all-btn" style={{
                  width: '100%', background: 'transparent', border: '1px solid var(--border,#252836)',
                  color: 'var(--muted,#7a7f95)', padding: '0.6rem', borderRadius: 10,
                  cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.78rem', marginTop: '0.75rem', transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(108,99,255,0.35)'; e.currentTarget.style.color = '#a09bff' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border,#252836)'; e.currentTarget.style.color = 'var(--muted,#7a7f95)' }}
                >📋 Copy All as Text</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}