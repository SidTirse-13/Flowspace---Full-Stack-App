// FILE: src/pages/VelocityPage.jsx
// Features: Velocity chart, Time tracking panel, Export PDF/CSV, Project Report
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/shared/Navbar'
import { getVelocity, getProjectReport, getProjectTimeLogSummary } from '../api/socialApi'
import { useAuth } from '../context/AuthContext'

// ── SVG Velocity Chart ─────────────────────────────────────────────
function VelocityChart({ weeks }) {
  if (!weeks || weeks.length === 0) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:160, color:'#5a6080', fontSize:'0.8rem', flexDirection:'column', gap:'0.5rem' }}>
      <span style={{ fontSize:'2rem' }}>📈</span>
      <span>Complete some tasks to see velocity</span>
    </div>
  )

  const maxVal = Math.max(...weeks.map(w => Math.max(w.tasksCompleted, w.tasksCreated)), 1)
  const W = 480, H = 160, PAD = 40
  const xStep = (W - PAD * 2) / Math.max(weeks.length - 1, 1)

  const toSVG = (weeks, key) => weeks.map((w, i) => {
    const x = PAD + i * xStep
    const y = H - PAD - ((w[key] / maxVal) * (H - PAD * 2))
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:'visible' }}>
      {[0,0.25,0.5,0.75,1].map((f,i) => {
        const y = H - PAD - f * (H - PAD * 2)
        return <g key={i}><line x1={PAD} x2={W-PAD} y1={y} y2={y} stroke="#1e2230" strokeWidth="1" /><text x={PAD-6} y={y+4} fill="#5a6080" fontSize="9" textAnchor="end">{Math.round(f*maxVal)}</text></g>
      })}

      {/* Completed bars */}
      {weeks.map((w, i) => {
        const x = PAD + i * xStep - 6
        const barH = (w.tasksCompleted / maxVal) * (H - PAD * 2)
        return <rect key={i} x={x} y={H - PAD - barH} width={12} height={barH} fill="rgba(108,99,255,0.4)" rx="2" />
      })}

      {/* Created line */}
      <polyline points={toSVG(weeks, 'tasksCreated')} fill="none" stroke="#ffd166" strokeWidth="2" strokeDasharray="5,3" />

      {/* Completed line */}
      <polyline points={toSVG(weeks, 'tasksCompleted')} fill="none" stroke="#6c63ff" strokeWidth="2.5" />
      {weeks.map((w, i) => {
        const x = PAD + i * xStep
        const y = H - PAD - ((w.tasksCompleted / maxVal) * (H - PAD * 2))
        return <circle key={i} cx={x} cy={y} r="3.5" fill="#6c63ff" stroke="#0a0b0e" strokeWidth="1.5" />
      })}

      {/* X labels */}
      {weeks.filter((_,i) => i % Math.ceil(weeks.length/6) === 0 || i === weeks.length-1).map((w,i) => {
        const origIdx = weeks.indexOf(w)
        const x = PAD + origIdx * xStep
        return <text key={i} x={x} y={H-8} fill="#5a6080" fontSize="8" textAnchor="middle">{w.weekLabel}</text>
      })}

      {/* Legend */}
      <rect x={W-100} y={8} width={10} height={10} fill="rgba(108,99,255,0.4)" rx="2" />
      <text x={W-86} y={17} fill="#a09bff" fontSize="9">Completed</text>
      <line x1={W-100} x2={W-90} y1={28} y2={28} stroke="#ffd166" strokeWidth="2" strokeDasharray="4,2" />
      <text x={W-86} y={32} fill="#ffd166" fontSize="9">Created</text>
    </svg>
  )
}

export default function VelocityPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { username } = useAuth()

  const [velocity,    setVelocity]    = useState(null)
  const [report,      setReport]      = useState(null)
  const [timeSummary, setTimeSummary] = useState(null)
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      getVelocity(projectId),
      getProjectReport(projectId),
      getProjectTimeLogSummary(projectId),
    ]).then(([v, r, t]) => {
      setVelocity(v.data)
      setReport(r.data)
      setTimeSummary(t.data)
    }).catch(() => toast.error('Failed to load data'))
    .finally(() => setLoading(false))
  }, [projectId])

  // ── Export CSV ──────────────────────────────────────────────────
  const exportCSV = () => {
    if (!report) return
    const rows = [
      ['Project', report.projectName],
      ['Owner', report.ownerUsername],
      ['Total Tasks', report.totalTasks],
      ['Done', report.doneTasks],
      ['In Progress', report.inProgressTasks],
      ['Todo', report.todoTasks],
      ['Completion %', report.completionPercent + '%'],
      ['Overdue', report.overdueTasks],
      ['Hours Logged', report.totalHoursLogged],
      [],
      ['Member', 'Assigned', 'Done', 'Hours'],
      ...(report.memberStats || []).map(m => [m.username, m.assigned, m.done, m.hoursLogged]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type:'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `${report.projectName.replace(/\s+/g,'_')}_report.csv`
    a.click(); URL.revokeObjectURL(url)
    toast.success('CSV exported! 📊')
  }

  // ── Export PDF (print-based) ────────────────────────────────────
  const exportPDF = () => {
    if (!report) return
    const html = `
      <html><head><title>${report.projectName} Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 2rem; color: #111; }
        h1 { color: #333; border-bottom: 2px solid #6c63ff; padding-bottom: 0.5rem; }
        .grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; margin: 1.5rem 0; }
        .card { background: #f5f5f5; border-radius: 8px; padding: 1rem; text-align: center; }
        .card .val { font-size: 2rem; font-weight: 800; color: #6c63ff; }
        .card .lbl { font-size: 0.8rem; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; }
        th { background: #6c63ff; color: white; padding: 0.5rem; text-align: left; }
        td { padding: 0.5rem; border-bottom: 1px solid #eee; }
        tr:nth-child(even) td { background: #f9f9f9; }
      </style></head><body>
      <h1>📊 ${report.projectName} — Project Report</h1>
      <p><strong>Owner:</strong> ${report.ownerUsername} &nbsp;|&nbsp; <strong>Period:</strong> ${report.startDate || 'N/A'} → ${report.endDate || 'N/A'}</p>
      <div class="grid">
        <div class="card"><div class="val">${report.completionPercent}%</div><div class="lbl">Completion Rate</div></div>
        <div class="card"><div class="val">${report.doneTasks}/${report.totalTasks}</div><div class="lbl">Tasks Done</div></div>
        <div class="card"><div class="val">${report.overdueTasks}</div><div class="lbl" style="color:#e53">Overdue</div></div>
        <div class="card"><div class="val">${report.totalHoursLogged}h</div><div class="lbl">Hours Logged</div></div>
        <div class="card"><div class="val">${report.inProgressTasks}</div><div class="lbl">In Progress</div></div>
        <div class="card"><div class="val">${report.todoTasks}</div><div class="lbl">To Do</div></div>
      </div>
      <h2>Team Performance</h2>
      <table><thead><tr><th>Member</th><th>Assigned</th><th>Done</th><th>Hours Logged</th></tr></thead><tbody>
        ${(report.memberStats || []).map(m => `<tr><td>${m.username}</td><td>${m.assigned}</td><td>${m.done}</td><td>${m.hoursLogged}h</td></tr>`).join('')}
      </tbody></table>
      </body></html>`
    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    win.print()
    toast.success('PDF ready to print! 🖨️')
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0a0b0e' }}>
      <Navbar />
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - 64px)', color:'#7a7f95' }}>Loading...</div>
    </div>
  )

  const hoursPerUser = timeSummary?.hoursPerUser || {}

  return (
    <div style={{ minHeight:'100vh', background:'#0a0b0e' }}>
      <Navbar />
      <main style={{ padding:'2rem', maxWidth:1100, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom:'1.5rem' }}>
          <button onClick={() => navigate(`/projects/${projectId}`)} style={{ background:'none', border:'none', color:'#7a7f95', cursor:'pointer', fontFamily:'Outfit,sans-serif', fontSize:'0.85rem', marginBottom:'0.5rem', padding:0 }}>← Back</button>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:'1rem' }}>
            <div>
              <h1 style={{ color:'#e8eaf0', fontSize:'1.4rem', fontWeight:800, margin:0 }}>📈 Velocity & Reports</h1>
              <p style={{ color:'#7a7f95', fontSize:'0.8rem', margin:'0.25rem 0 0' }}>{report?.projectName}</p>
            </div>
            <div style={{ display:'flex', gap:'0.6rem' }}>
              <button onClick={exportCSV} style={{ background:'rgba(0,212,170,0.1)', border:'1px solid rgba(0,212,170,0.3)', color:'#00d4aa', padding:'0.55rem 1rem', borderRadius:10, cursor:'pointer', fontFamily:'Outfit,sans-serif', fontWeight:600, fontSize:'0.8rem' }}>⬇ Export CSV</button>
              <button onClick={exportPDF} style={{ background:'rgba(255,107,107,0.1)', border:'1px solid rgba(255,107,107,0.3)', color:'#ff9b9b', padding:'0.55rem 1rem', borderRadius:10, cursor:'pointer', fontFamily:'Outfit,sans-serif', fontWeight:600, fontSize:'0.8rem' }}>🖨 Export PDF</button>
            </div>
          </div>
        </div>

        {/* ── Summary cards ── */}
        {report && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
            {[
              { label:'Completion', value:`${report.completionPercent}%`, color:'#6c63ff', icon:'🎯' },
              { label:'Hours Logged', value:`${report.totalHoursLogged}h`, color:'#00d4aa', icon:'⏱' },
              { label:'Tasks Done', value:`${report.doneTasks}/${report.totalTasks}`, color:'#a09bff', icon:'✅' },
              { label:'Overdue', value:report.overdueTasks, color: report.overdueTasks > 0 ? '#ff9b9b' : '#00d4aa', icon:'⚠️' },
            ].map((s,i) => (
              <div key={i} style={{ background:'#12141a', border:'1px solid #252836', borderRadius:16, padding:'1.25rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <div>
                    <p style={{ color:'#7a7f95', fontSize:'0.7rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 0.35rem' }}>{s.label}</p>
                    <p style={{ color:s.color, fontSize:'1.6rem', fontWeight:800, margin:0 }}>{s.value}</p>
                  </div>
                  <span style={{ fontSize:'1.4rem' }}>{s.icon}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Velocity chart ── */}
        <div style={{ background:'#12141a', border:'1px solid #252836', borderRadius:18, padding:'1.5rem', marginBottom:'1.25rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <p style={{ color:'#7a7f95', fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', margin:0 }}>📈 Velocity (Tasks per Week)</p>
            {velocity && <span style={{ background:'rgba(108,99,255,0.1)', border:'1px solid rgba(108,99,255,0.25)', color:'#a09bff', fontSize:'0.72rem', padding:'0.2rem 0.6rem', borderRadius:20 }}>avg {velocity.averagePerWeek} tasks/week</span>}
          </div>
          <VelocityChart weeks={velocity?.weeks || []} />
        </div>

        {/* ── Time logged per user + Team report ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem', marginBottom:'1.25rem' }}>

          {/* Hours per member */}
          <div style={{ background:'#12141a', border:'1px solid #252836', borderRadius:18, padding:'1.5rem' }}>
            <p style={{ color:'#7a7f95', fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'1rem' }}>⏱ Hours Logged by Member</p>
            {Object.keys(hoursPerUser).length === 0
              ? <p style={{ color:'#5a6080', fontSize:'0.8rem', textAlign:'center', padding:'1rem' }}>No time logged yet</p>
              : (
                <div style={{ display:'flex', flexDirection:'column', gap:'0.65rem' }}>
                  {Object.entries(hoursPerUser).sort((a,b) => b[1]-a[1]).map(([user, hours]) => {
                    const maxH = Math.max(...Object.values(hoursPerUser))
                    return (
                      <div key={user}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.25rem' }}>
                          <span style={{ color:'#c0c5dc', fontSize:'0.78rem' }}>{user}</span>
                          <span style={{ color:'#00d4aa', fontSize:'0.72rem', fontFamily:'JetBrains Mono,monospace', fontWeight:700 }}>{hours}h</span>
                        </div>
                        <div style={{ height:6, background:'#1a1d26', borderRadius:3, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${(hours/maxH)*100}%`, background:'linear-gradient(90deg,#6c63ff,#00d4aa)', borderRadius:3 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
          </div>

          {/* Team performance table */}
          <div style={{ background:'#12141a', border:'1px solid #252836', borderRadius:18, padding:'1.5rem' }}>
            <p style={{ color:'#7a7f95', fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'1rem' }}>👥 Team Performance</p>
            {!report?.memberStats?.length
              ? <p style={{ color:'#5a6080', fontSize:'0.8rem', textAlign:'center', padding:'1rem' }}>No assigned tasks yet</p>
              : (
                <div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 60px 60px 70px', gap:'0.5rem', paddingBottom:'0.5rem', borderBottom:'1px solid #1e2230' }}>
                    {['Member','Done','Tasks','Hours'].map(h => <span key={h} style={{ color:'#5a6080', fontSize:'0.62rem', fontWeight:700, textTransform:'uppercase' }}>{h}</span>)}
                  </div>
                  {report.memberStats.map(m => {
                    const rate = m.assigned > 0 ? Math.round((m.done/m.assigned)*100) : 0
                    return (
                      <div key={m.username} style={{ display:'grid', gridTemplateColumns:'1fr 60px 60px 70px', gap:'0.5rem', padding:'0.5rem 0', borderBottom:'1px solid #1a1d26', alignItems:'center' }}>
                        <span style={{ color:'#c0c5dc', fontSize:'0.78rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.username}</span>
                        <span style={{ color:'#00d4aa', fontSize:'0.78rem', fontWeight:700, fontFamily:'JetBrains Mono,monospace' }}>{m.done}</span>
                        <span style={{ color:'#7a7f95', fontSize:'0.78rem', fontFamily:'JetBrains Mono,monospace' }}>{m.assigned}</span>
                        <span style={{ color:'#ffd166', fontSize:'0.72rem', fontFamily:'JetBrains Mono,monospace' }}>{m.hoursLogged}h</span>
                      </div>
                    )
                  })}
                </div>
              )}
          </div>
        </div>

        {/* ── Velocity weekly breakdown table ── */}
        {velocity?.weeks?.length > 0 && (
          <div style={{ background:'#12141a', border:'1px solid #252836', borderRadius:18, padding:'1.5rem' }}>
            <p style={{ color:'#7a7f95', fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'1rem' }}>📋 Weekly Breakdown</p>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    {['Week','Completed','Created','Ratio'].map(h => (
                      <th key={h} style={{ color:'#5a6080', fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', padding:'0.5rem 0.75rem', textAlign:'left', borderBottom:'1px solid #252836' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {velocity.weeks.map((w,i) => (
                    <tr key={i} style={{ borderBottom:'1px solid #1a1d26' }}>
                      <td style={{ color:'#7a7f95', fontSize:'0.75rem', padding:'0.5rem 0.75rem', fontFamily:'JetBrains Mono,monospace' }}>{w.weekLabel}</td>
                      <td style={{ color:'#6c63ff', fontSize:'0.75rem', padding:'0.5rem 0.75rem', fontWeight:700 }}>{w.tasksCompleted}</td>
                      <td style={{ color:'#ffd166', fontSize:'0.75rem', padding:'0.5rem 0.75rem' }}>{w.tasksCreated}</td>
                      <td style={{ color: w.tasksCreated > 0 && w.tasksCompleted >= w.tasksCreated ? '#00d4aa' : '#ff9b9b', fontSize:'0.75rem', padding:'0.5rem 0.75rem', fontFamily:'JetBrains Mono,monospace' }}>
                        {w.tasksCreated > 0 ? `${Math.round((w.tasksCompleted/w.tasksCreated)*100)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
