// ─────────────────────────────────────────────────────────────────
// FILE: src/pages/AnalyticsPage.jsx
// PURPOSE: Analytics page for a project
//
// Shows:
//  - Completion % ring + task count cards
//  - Pie chart: TODO vs IN_PROGRESS vs DONE (via Recharts)
//  - Critical Path: total duration + task chain
//  - Slack Days table per task
//  - Gantt-style task timeline
//
// All data is fetched from 4 different endpoints
// ─────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

import Navbar from '../components/shared/Navbar'
import {
  getAnalytics,
  getCriticalPath,
  getSlack,
  getGanttData,
  getWorkload,
  getProjectAuditLogs,
} from '../api/taskApi'

// Pie chart colors
const PIE_COLORS = {
  TODO:        '#7a7f95',
  IN_PROGRESS: '#ffd166',
  DONE:        '#00d4aa',
}

export default function AnalyticsPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()

  const [analytics, setAnalytics]     = useState(null)
  const [criticalPath, setCriticalPath] = useState(null)
  const [slackData, setSlackData]     = useState([])
  const [ganttData, setGanttData]     = useState([])
  const [workload, setWorkload]       = useState([])
  const [auditLogs, setAuditLogs]     = useState([])
  const [loading, setLoading]         = useState(true)

  // ── Fetch all analytics data at once ──────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        // Use allSettled so one failing endpoint never blocks the rest
        const [analyticsRes, critRes, slackRes, ganttRes, workloadRes, auditRes] = await Promise.allSettled([
          getAnalytics(projectId),
          getCriticalPath(projectId),
          getSlack(projectId),
          getGanttData(projectId),
          getWorkload(projectId),
          getProjectAuditLogs(projectId),
        ])
        if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data)
        if (critRes.status     === 'fulfilled') setCriticalPath(critRes.value.data)
        if (slackRes.status    === 'fulfilled') setSlackData(slackRes.value.data || [])
        if (ganttRes.status    === 'fulfilled') setGanttData(ganttRes.value.data || [])
        if (workloadRes.status === 'fulfilled') setWorkload(workloadRes.value.data || [])
        if (auditRes.status    === 'fulfilled') setAuditLogs(auditRes.value.data || [])

        // Only show error if the main analytics call failed
        if (analyticsRes.status === 'rejected') {
          toast.error('Failed to load analytics data')
        }
      } catch (err) {
        toast.error('Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [projectId])

  // ── Pie chart data ─────────────────────────────────────────────
  const pieData = analytics ? [
    { name: 'To Do',       value: Number(analytics.todo),       key: 'TODO' },
    { name: 'In Progress', value: Number(analytics.inProgress), key: 'IN_PROGRESS' },
    { name: 'Done',        value: Number(analytics.done),       key: 'DONE' },
  ].filter(d => d.value > 0) : []

  // ── Get project date range for Gantt ──────────────────────────
  const ganttStart = ganttData.length > 0
    ? new Date(Math.min(...ganttData.map(t => new Date(t.start))))
    : new Date()

  const ganttEnd = ganttData.length > 0
    ? new Date(Math.max(...ganttData.map(t => new Date(t.end))))
    : new Date()

  const totalDays = Math.max(
    1,
    Math.ceil((ganttEnd - ganttStart) / (1000 * 60 * 60 * 24))
  )

  // Convert task date to % of total range
  const toPercent = (dateStr, which) => {
    const d = new Date(dateStr)
    const days = (d - ganttStart) / (1000 * 60 * 60 * 24)
    return Math.max(0, Math.min(100, (days / totalDays) * 100))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0b0e' }}>
      <Navbar />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            style={{
              background: 'none', border: 'none',
              color: '#7a7f95', cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem',
              marginBottom: '0.5rem',
            }}
          >
            ← Back to Tasks
          </button>
          <h1 style={{ color: '#e8eaf0', fontSize: '1.75rem', fontWeight: 800 }}>
            Project Analytics
          </h1>
          <p style={{ color: '#7a7f95', marginTop: '0.25rem', fontSize: '0.875rem' }}>
            Project #{projectId}
          </p>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', color: '#7a7f95', padding: '4rem' }}>
            Loading analytics...
          </div>
        )}

        {!loading && analytics && (
          <>
            {/* ── TOP STATS CARDS ───────────────────────────────── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}>
              {/* Completion % */}
              <StatCard
                label="Completion"
                value={`${analytics.completionPercentage}%`}
                color="#6c63ff"
                emoji="🎯"
              />
              <StatCard
                label="Total Tasks"
                value={analytics.totalTasks}
                color="#e8eaf0"
                emoji="📋"
              />
              <StatCard
                label="To Do"
                value={analytics.todo}
                color="#7a7f95"
                emoji="📌"
              />
              <StatCard
                label="In Progress"
                value={analytics.inProgress}
                color="#ffd166"
                emoji="⚡"
              />
              <StatCard
                label="Done"
                value={analytics.done}
                color="#00d4aa"
                emoji="✅"
              />
            </div>

            {/* ── PROGRESS BAR ──────────────────────────────────── */}
            <div
              style={{
                background: '#12141a',
                border: '1px solid #252836',
                borderRadius: 14,
                padding: '1.5rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: '#e8eaf0', fontWeight: 600, fontSize: '0.9rem' }}>
                  Overall Progress
                </span>
                <span style={{ color: '#6c63ff', fontWeight: 700, fontSize: '0.9rem' }}>
                  {analytics.completionPercentage}%
                </span>
              </div>
              {/* Track */}
              <div style={{
                background: '#1a1d26',
                borderRadius: 100,
                height: 12,
                overflow: 'hidden',
              }}>
                {/* Fill */}
                <div style={{
                  height: '100%',
                  width: `${analytics.completionPercentage}%`,
                  background: 'linear-gradient(90deg, #6c63ff, #00d4aa)',
                  borderRadius: 100,
                  transition: 'width 0.8s ease',
                }} />
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem' }}>
                <span style={{ color: '#7a7f95', fontSize: '0.75rem' }}>
                  {analytics.done} of {analytics.totalTasks} tasks completed
                </span>
              </div>
            </div>

            {/* ── PIE CHART + CRITICAL PATH ─────────────────────── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem',
              marginBottom: '1.5rem',
            }}>
              {/* Pie chart */}
              <div style={{
                background: '#12141a',
                border: '1px solid #252836',
                borderRadius: 14,
                padding: '1.5rem',
              }}>
                <h3 style={{ color: '#e8eaf0', fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem' }}>
                  📊 Task Distribution
                </h3>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        strokeWidth={0}
                      >
                        {pieData.map((entry) => (
                          <Cell
                            key={entry.key}
                            fill={PIE_COLORS[entry.key]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: '#1a1d26',
                          border: '1px solid #252836',
                          borderRadius: 8,
                          color: '#e8eaf0',
                          fontFamily: 'Outfit, sans-serif',
                          fontSize: '0.85rem',
                        }}
                      />
                      <Legend
                        formatter={(value) => (
                          <span style={{ color: '#b0b5cc', fontSize: '0.8rem' }}>{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', color: '#4a4f65', padding: '2rem', fontSize: '0.875rem' }}>
                    No tasks yet
                  </div>
                )}
              </div>

              {/* Critical Path */}
              <div style={{
                background: '#12141a',
                border: '1px solid #252836',
                borderRadius: 14,
                padding: '1.5rem',
              }}>
                <h3 style={{ color: '#e8eaf0', fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem' }}>
                  🔴 Critical Path
                </h3>

                {criticalPath ? (
                  <>
                    <div style={{
                      background: 'rgba(255,107,107,0.08)',
                      border: '1px solid rgba(255,107,107,0.2)',
                      borderRadius: 10,
                      padding: '0.75rem 1rem',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}>
                      <span style={{ fontSize: '1.5rem' }}>⏱</span>
                      <div>
                        <p style={{ color: '#ff9b9b', fontWeight: 700, fontSize: '1.1rem' }}>
                          {criticalPath.totalDurationDays} days
                        </p>
                        <p style={{ color: '#7a7f95', fontSize: '0.75rem' }}>
                          Minimum project duration
                        </p>
                      </div>
                    </div>

                    <p style={{ color: '#7a7f95', fontSize: '0.75rem', marginBottom: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                      CRITICAL TASKS (in order):
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {criticalPath.criticalTasks.map((task, idx) => (
                        <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {idx > 0 && (
                            <span style={{ color: '#252836', marginLeft: '0.5rem' }}>↓</span>
                          )}
                          <div style={{
                            background: 'rgba(255,107,107,0.1)',
                            border: '1px solid rgba(255,107,107,0.25)',
                            borderRadius: 8,
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.8rem',
                            color: '#ff9b9b',
                            flex: 1,
                          }}>
                            <span style={{ color: '#4a4f65', marginRight: '0.5rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem' }}>
                              #{task.id}
                            </span>
                            {task.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', color: '#4a4f65', padding: '2rem', fontSize: '0.875rem' }}>
                    No tasks yet
                  </div>
                )}
              </div>
            </div>

            {/* ── SLACK TABLE ────────────────────────────────────── */}
            {slackData.length > 0 && (
              <div style={{
                background: '#12141a',
                border: '1px solid #252836',
                borderRadius: 14,
                padding: '1.5rem',
                marginBottom: '1.5rem',
              }}>
                <h3 style={{ color: '#e8eaf0', fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem' }}>
                  ⏱ Slack Days per Task
                </h3>
                <p style={{ color: '#7a7f95', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  Slack = how many days a task can be delayed without affecting the project end date. 
                  <span style={{ color: '#ff9b9b' }}> 0 slack = critical task.</span>
                </p>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '0.5rem 1rem', color: '#7a7f95', fontSize: '0.72rem', fontWeight: 600, background: '#1a1d26', borderRadius: '8px 0 0 8px' }}>
                        TASK
                      </th>
                      <th style={{ textAlign: 'left', padding: '0.5rem 1rem', color: '#7a7f95', fontSize: '0.72rem', fontWeight: 600, background: '#1a1d26' }}>
                        TASK ID
                      </th>
                      <th style={{ textAlign: 'left', padding: '0.5rem 1rem', color: '#7a7f95', fontSize: '0.72rem', fontWeight: 600, background: '#1a1d26', borderRadius: '0 8px 8px 0' }}>
                        SLACK DAYS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {slackData.map(item => (
                      <tr key={item.taskId}>
                        <td style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #1a1d26', color: '#e8eaf0' }}>
                          {item.title}
                        </td>
                        <td style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #1a1d26', color: '#7a7f95', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>
                          #{item.taskId}
                        </td>
                        <td style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #1a1d26' }}>
                          <span style={{
                            background: item.slackDays === 0
                              ? 'rgba(255,107,107,0.15)'
                              : 'rgba(0,212,170,0.1)',
                            color: item.slackDays === 0 ? '#ff9b9b' : '#00d4aa',
                            padding: '0.2rem 0.6rem',
                            borderRadius: 6,
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            fontFamily: 'JetBrains Mono, monospace',
                          }}>
                            {item.slackDays === 0 ? '🔴 0 (Critical)' : `${item.slackDays}d`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── GANTT CHART (custom bar chart) ─────────────────── */}
            {ganttData.length > 0 && (
              <div style={{
                background: '#12141a',
                border: '1px solid #252836',
                borderRadius: 14,
                padding: '1.5rem',
              }}>
                <h3 style={{ color: '#e8eaf0', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                  📅 Gantt Timeline
                </h3>
                <p style={{ color: '#7a7f95', fontSize: '0.75rem', marginBottom: '1.25rem' }}>
                  From {ganttStart.toLocaleDateString()} to {ganttEnd.toLocaleDateString()} ({totalDays} days)
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {ganttData.map(task => {
                    const leftPct  = toPercent(task.start)
                    const rightPct = toPercent(task.end)
                    const widthPct = Math.max(2, rightPct - leftPct)

                    return (
                      <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {/* Task name */}
                        <div style={{
                          width: 160,
                          flexShrink: 0,
                          color: '#b0b5cc',
                          fontSize: '0.78rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {task.name}
                        </div>

                        {/* Bar track */}
                        <div style={{
                          flex: 1,
                          background: '#1a1d26',
                          borderRadius: 6,
                          height: 28,
                          position: 'relative',
                          overflow: 'hidden',
                        }}>
                          {/* Bar fill */}
                          <div style={{
                            position: 'absolute',
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                            height: '100%',
                            background: task.progress === 100
                              ? 'linear-gradient(90deg, #00d4aa, #00a884)'
                              : task.progress > 0
                                ? 'linear-gradient(90deg, #ffd166, #e6bb5a)'
                                : 'linear-gradient(90deg, #6c63ff, #5a52d5)',
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            paddingLeft: '0.5rem',
                          }}>
                            <span style={{
                              color: task.progress === 100 ? '#0a0b0e' : 'white',
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                            }}>
                              {task.progress}%
                            </span>
                          </div>
                        </div>

                        {/* Date range */}
                        <div style={{
                          width: 140,
                          flexShrink: 0,
                          color: '#4a4f65',
                          fontSize: '0.65rem',
                          fontFamily: 'JetBrains Mono, monospace',
                          textAlign: 'right',
                        }}>
                          {task.start} → {task.end}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── WORKLOAD PER USER (Feature 8) ─────────────────── */}
            {workload.length > 0 && (
              <div style={{ background: '#12141a', border: '1px solid #252836', borderRadius: 16, padding: '1.5rem', marginTop: '1.5rem' }}>
                <h2 style={{ color: '#e8eaf0', fontSize: '1rem', fontWeight: 700, marginBottom: '1.1rem' }}>
                  👥 Workload per Assignee
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {workload.map(w => {
                    const total = w.totalAssigned || 1
                    const doneWidth  = `${(w.done / total * 100).toFixed(0)}%`
                    const inProgWidth = `${(w.inProgress / total * 100).toFixed(0)}%`
                    const todoWidth  = `${(w.todo / total * 100).toFixed(0)}%`
                    return (
                      <div key={w.username} style={{ background: '#0e1018', border: '1px solid #252836', borderRadius: 12, padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#6c63ff,#00d4aa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '0.8rem' }}>
                              {w.username.slice(0,2).toUpperCase()}
                            </div>
                            <div>
                              <p style={{ color: '#e8eaf0', fontWeight: 700, fontSize: '0.88rem' }}>{w.username}</p>
                              <p style={{ color: '#5a6080', fontSize: '0.7rem' }}>{w.totalAssigned} task{w.totalAssigned !== 1 ? 's' : ''} assigned</p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {w.done > 0        && <span style={{ background:'rgba(0,212,170,.12)',  border:'1px solid rgba(0,212,170,.25)',  color:'#00d4aa', fontSize:'0.65rem', padding:'0.15rem 0.5rem', borderRadius:20, fontWeight:700 }}>✅ {w.done} done</span>}
                            {w.inProgress > 0  && <span style={{ background:'rgba(255,209,102,.1)', border:'1px solid rgba(255,209,102,.25)', color:'#ffd166', fontSize:'0.65rem', padding:'0.15rem 0.5rem', borderRadius:20, fontWeight:700 }}>⚡ {w.inProgress} in progress</span>}
                            {w.todo > 0        && <span style={{ background:'rgba(122,127,149,.1)', border:'1px solid rgba(122,127,149,.25)', color:'#7a7f95', fontSize:'0.65rem', padding:'0.15rem 0.5rem', borderRadius:20, fontWeight:700 }}>📋 {w.todo} todo</span>}
                            {w.overdue > 0     && <span style={{ background:'rgba(255,107,107,.1)', border:'1px solid rgba(255,107,107,.25)', color:'#ff9b9b', fontSize:'0.65rem', padding:'0.15rem 0.5rem', borderRadius:20, fontWeight:700 }}>⚠️ {w.overdue} overdue</span>}
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div style={{ height: 6, borderRadius: 3, background: '#1e2230', overflow: 'hidden', display: 'flex' }}>
                          <div style={{ width: doneWidth,    background: '#00d4aa', transition: 'width 0.4s' }} />
                          <div style={{ width: inProgWidth,  background: '#ffd166', transition: 'width 0.4s' }} />
                          <div style={{ width: todoWidth,    background: '#3a3f52', transition: 'width 0.4s' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── PROJECT ACTIVITY LOG (FIX: was implemented in API but never shown) ── */}
            {auditLogs.length > 0 && (
              <div style={{ background: '#12141a', border: '1px solid #252836', borderRadius: 16, padding: '1.5rem', marginTop: '1.5rem' }}>
                <h3 style={{ color: '#e8eaf0', fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📋 Project Activity Log
                  <span style={{ background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)', color: '#a09bff', fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: 20, fontWeight: 700 }}>
                    {auditLogs.length} events
                  </span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: 360, overflowY: 'auto', paddingRight: '0.25rem' }}>
                  {auditLogs.slice(0, 50).map(log => (
                    <div key={log.id} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', padding: '0.6rem 0.85rem', background: '#0e1018', borderRadius: 10, border: '1px solid #1e2230' }}>
                      <span style={{ fontSize: '0.95rem', flexShrink: 0, marginTop: 1 }}>{actionEmoji(log.action)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: '#c8cad4', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: '0.2rem' }}>{log.description}</p>
                        <p style={{ color: '#4a4f65', fontSize: '0.67rem', fontFamily: 'JetBrains Mono, monospace' }}>
                          {log.performedBy} · {log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}
                        </p>
                      </div>
                      <span style={{
                        fontSize: '0.6rem', fontFamily: 'JetBrains Mono, monospace', padding: '0.15rem 0.5rem',
                        borderRadius: 4, flexShrink: 0, whiteSpace: 'nowrap',
                        background: actionColor(log.action).bg, color: actionColor(log.action).text,
                        border: `1px solid ${actionColor(log.action).border}`,
                      }}>{log.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function actionEmoji(action) {
  const map = { CREATE: '✨', UPDATE: '✏️', DELETE: '🗑', ASSIGN: '👤', STATUS_CHANGE: '🔄', COMMENT: '💬', ATTACHMENT_UPLOAD: '📎' }
  return map[action] || '📝'
}

function actionColor(action) {
  const map = {
    CREATE:           { bg: 'rgba(0,212,170,.08)',   border: 'rgba(0,212,170,.2)',   text: '#00d4aa' },
    UPDATE:           { bg: 'rgba(255,209,102,.08)', border: 'rgba(255,209,102,.2)', text: '#ffd166' },
    DELETE:           { bg: 'rgba(255,107,107,.08)', border: 'rgba(255,107,107,.2)', text: '#ff9b9b' },
    ASSIGN:           { bg: 'rgba(108,99,255,.08)',  border: 'rgba(108,99,255,.2)',  text: '#a09bff' },
    STATUS_CHANGE:    { bg: 'rgba(90,180,255,.08)',  border: 'rgba(90,180,255,.2)',  text: '#7ac8ff' },
    COMMENT:          { bg: 'rgba(200,160,255,.08)', border: 'rgba(200,160,255,.2)', text: '#c8a0ff' },
    ATTACHMENT_UPLOAD:{ bg: 'rgba(255,160,100,.08)', border: 'rgba(255,160,100,.2)', text: '#ffb06e' },
  }
  return map[action] || { bg: 'rgba(122,127,149,.08)', border: 'rgba(122,127,149,.2)', text: '#7a7f95' }
}

// ── StatCard sub-component ────────────────────────────────────────
function StatCard({ label, value, color, emoji }) {
  return (
    <div style={{
      background: '#12141a',
      border: '1px solid #252836',
      borderRadius: 14,
      padding: '1.25rem',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{emoji}</div>
      <div style={{ color, fontSize: '1.5rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>
        {value}
      </div>
      <div style={{ color: '#7a7f95', fontSize: '0.72rem', marginTop: '0.25rem', fontWeight: 600 }}>
        {label}
      </div>
    </div>
  )
}