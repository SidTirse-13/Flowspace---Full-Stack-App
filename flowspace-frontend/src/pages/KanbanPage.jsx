// FILE: src/pages/KanbanPage.jsx
// Feature 2 — Drag and drop Kanban board for a project
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/shared/Navbar'
import { useAuth } from '../context/AuthContext'
import { getTasks, updateTaskStatus, createTask } from '../api/taskApi'

const COLUMNS = [
  { key: 'TODO',        label: '📋 To Do',      color: '#7a7f95', bg: 'rgba(122,127,149,0.08)', border: 'rgba(122,127,149,0.2)' },
  { key: 'IN_PROGRESS', label: '⚡ In Progress', color: '#ffd166', bg: 'rgba(255,209,102,0.08)', border: 'rgba(255,209,102,0.2)' },
  { key: 'DONE',        label: '✅ Done',        color: '#00d4aa', bg: 'rgba(0,212,170,0.08)',   border: 'rgba(0,212,170,0.2)' },
]

const PRIORITY_COLORS = {
  LOW:    { color: '#7a7f95', label: '⬇' },
  MEDIUM: { color: '#6c9eff', label: '➡' },
  HIGH:   { color: '#ffd166', label: '⬆' },
  URGENT: { color: '#ff6b6b', label: '🔥' },
}

export default function KanbanPage() {
  const { projectId } = useParams()
  const { username } = useAuth()
  const navigate = useNavigate()

  const [tasks,       setTasks]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [dragging,    setDragging]    = useState(null)   // { taskId, fromCol }
  const [dragOver,    setDragOver]    = useState(null)   // column key
  const [showAdd,     setShowAdd]     = useState(null)   // column key for quick-add
  const [newTitle,    setNewTitle]    = useState('')
  const [adding,      setAdding]      = useState(false)
  const [search,      setSearch]      = useState('')
  const inputRef = useRef(null)

  useEffect(() => { loadTasks() }, [projectId])

  useEffect(() => {
    if (showAdd && inputRef.current) inputRef.current.focus()
  }, [showAdd])

  const loadTasks = async () => {
    setLoading(true)
    try {
      const r = await getTasks(projectId)
      setTasks(r.data || [])
    } catch { toast.error('Failed to load tasks') }
    finally { setLoading(false) }
  }

  const getColumnTasks = (colKey) => {
    const filtered = search
      ? tasks.filter(t => t.title?.toLowerCase().includes(search.toLowerCase()))
      : tasks
    return filtered.filter(t => t.status === colKey && !t.parentTaskId)
  }

  // ── Drag handlers ──────────────────────────────────────────────
  const handleDragStart = (e, task, fromCol) => {
    setDragging({ taskId: task.id, fromCol })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', task.id)
  }

  const handleDragOver = (e, colKey) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(colKey)
  }

  const handleDrop = async (e, toCol) => {
    e.preventDefault()
    setDragOver(null)
    if (!dragging || dragging.fromCol === toCol) { setDragging(null); return }

    const taskId = dragging.taskId
    const previousTasks = [...tasks]

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: toCol } : t))
    setDragging(null)

    try {
      await updateTaskStatus(projectId, taskId, toCol)
      toast.success(`Moved to ${COLUMNS.find(c => c.key === toCol)?.label}`)
    } catch {
      setTasks(previousTasks)
      toast.error('Failed to update task status')
    }
  }

  const handleDragEnd = () => { setDragging(null); setDragOver(null) }

  // ── Quick add task ─────────────────────────────────────────────
  const handleQuickAdd = async (colKey) => {
    if (!newTitle.trim()) { setShowAdd(null); return }
    setAdding(true)
    try {
      await createTask(projectId, { title: newTitle.trim(), status: colKey, priority: 'MEDIUM' })
      toast.success('Task created!')
      setNewTitle('')
      setShowAdd(null)
      loadTasks()
    } catch { toast.error('Failed to create task') }
    finally { setAdding(false) }
  }

  const totalDone  = tasks.filter(t => t.status === 'DONE').length
  const totalTasks = tasks.filter(t => !t.parentTaskId).length
  const pct        = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: '#0a0b0e' }}>
      <Navbar />
      <main style={{ padding: '1.5rem 2rem', maxWidth: 1400, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => navigate(`/projects/${projectId}`)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #252836', color: '#7a7f95', padding: '0.4rem 0.75rem', borderRadius: 8, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.8rem' }}>
              ← Back
            </button>
            <div>
              <h1 style={{ color: '#e8eaf0', fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>🗂 Kanban Board</h1>
              <p style={{ color: '#5a6080', fontSize: '0.75rem', margin: '0.15rem 0 0' }}>
                {totalDone}/{totalTasks} tasks done · {pct}% complete
              </p>
            </div>
          </div>

          {/* Search + progress */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {/* Progress bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 120, height: 6, background: '#1a1d26', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #6c63ff, #00d4aa)', borderRadius: 3, transition: 'width 0.5s' }} />
              </div>
              <span style={{ color: '#00d4aa', fontSize: '0.75rem', fontWeight: 700 }}>{pct}%</span>
            </div>

            {/* Search */}
            <input
              type="text" placeholder="🔍 Search tasks..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                background: '#12141a', border: '1px solid #252836', borderRadius: 8,
                padding: '0.4rem 0.85rem', color: '#e8eaf0', fontSize: '0.8rem',
                fontFamily: 'Outfit, sans-serif', outline: 'none', width: 180,
              }}
              onFocus={e => e.target.style.borderColor = '#6c63ff'}
              onBlur={e => e.target.style.borderColor = '#252836'}
            />
          </div>
        </div>

        {/* ── Kanban columns ── */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#5a6080', padding: '4rem' }}>Loading board...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', alignItems: 'start' }}>
            {COLUMNS.map(col => {
              const colTasks = getColumnTasks(col.key)
              const isDragTarget = dragOver === col.key

              return (
                <div
                  key={col.key}
                  onDragOver={e => handleDragOver(e, col.key)}
                  onDrop={e => handleDrop(e, col.key)}
                  onDragLeave={() => setDragOver(null)}
                  style={{
                    background: isDragTarget ? col.bg : 'rgba(14,16,24,0.6)',
                    border: `1px solid ${isDragTarget ? col.border : '#1a1d26'}`,
                    borderRadius: 16, padding: '1rem',
                    transition: 'all 0.15s', minHeight: 200,
                    boxShadow: isDragTarget ? `0 0 0 2px ${col.color}30` : 'none',
                  }}
                >
                  {/* Column header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: col.color, fontWeight: 700, fontSize: '0.85rem' }}>{col.label}</span>
                      <span style={{
                        background: `${col.color}18`, border: `1px solid ${col.color}30`,
                        color: col.color, fontSize: '0.65rem', fontWeight: 700,
                        padding: '0.1rem 0.45rem', borderRadius: 20,
                      }}>{colTasks.length}</span>
                    </div>
                    <button
                      onClick={() => { setShowAdd(col.key); setNewTitle('') }}
                      style={{
                        background: 'transparent', border: '1px solid #252836', color: '#5a6080',
                        width: 24, height: 24, borderRadius: 6, cursor: 'pointer', fontSize: '0.9rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = col.border; e.currentTarget.style.color = col.color }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#252836'; e.currentTarget.style.color = '#5a6080' }}
                    >+</button>
                  </div>

                  {/* Quick add input */}
                  {showAdd === col.key && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <input
                        ref={inputRef}
                        type="text" placeholder="Task title..." value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleQuickAdd(col.key)
                          if (e.key === 'Escape') { setShowAdd(null); setNewTitle('') }
                        }}
                        style={{
                          width: '100%', background: '#12141a', border: `1px solid ${col.color}50`,
                          borderRadius: 8, padding: '0.55rem 0.75rem', color: '#e8eaf0',
                          fontSize: '0.8rem', fontFamily: 'Outfit, sans-serif', outline: 'none', boxSizing: 'border-box',
                        }}
                      />
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                        <button onClick={() => handleQuickAdd(col.key)} disabled={adding} style={{
                          background: col.color, color: col.key === 'IN_PROGRESS' ? '#0a0b0e' : 'white',
                          border: 'none', borderRadius: 6, padding: '0.3rem 0.75rem',
                          fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                        }}>Add</button>
                        <button onClick={() => { setShowAdd(null); setNewTitle('') }} style={{
                          background: 'transparent', border: '1px solid #252836', color: '#5a6080',
                          borderRadius: 6, padding: '0.3rem 0.6rem', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                        }}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {/* Tasks */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {colTasks.length === 0 && !showAdd && (
                      <div style={{
                        textAlign: 'center', padding: '1.5rem 1rem', color: '#3a3f52',
                        fontSize: '0.75rem', border: `1px dashed ${col.border}`, borderRadius: 10,
                      }}>
                        Drop tasks here
                      </div>
                    )}
                    {colTasks.map(task => {
                      const pc = PRIORITY_COLORS[task.priority || 'MEDIUM']
                      const isDraggingThis = dragging?.taskId === task.id

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={e => handleDragStart(e, task, col.key)}
                          onDragEnd={handleDragEnd}
                          onClick={() => navigate(`/projects/${projectId}`)}
                          style={{
                            background: isDraggingThis ? 'rgba(108,99,255,0.15)' : '#12141a',
                            border: `1px solid ${isDraggingThis ? 'rgba(108,99,255,0.4)' : '#252836'}`,
                            borderRadius: 10, padding: '0.75rem',
                            cursor: 'grab', transition: 'all 0.15s',
                            opacity: isDraggingThis ? 0.6 : 1,
                            transform: isDraggingThis ? 'rotate(2deg) scale(0.98)' : 'none',
                            userSelect: 'none',
                          }}
                          onMouseEnter={e => { if (!isDraggingThis) { e.currentTarget.style.borderColor = '#6c63ff44'; e.currentTarget.style.transform = 'translateY(-1px)' }}}
                          onMouseLeave={e => { if (!isDraggingThis) { e.currentTarget.style.borderColor = '#252836'; e.currentTarget.style.transform = 'none' }}}
                        >
                          {/* Task title */}
                          <p style={{
                            color: task.status === 'DONE' ? '#5a6080' : '#e8eaf0',
                            fontSize: '0.83rem', fontWeight: 600, margin: '0 0 0.5rem',
                            textDecoration: task.status === 'DONE' ? 'line-through' : 'none',
                            lineHeight: 1.4,
                          }}>{task.title}</p>

                          {/* Meta */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                              {/* Priority */}
                              <span style={{ color: pc.color, fontSize: '0.65rem', fontWeight: 700 }}>{pc.label} {task.priority || 'MEDIUM'}</span>
                              {/* Subtask count */}
                              {task.subtaskCount > 0 && (
                                <span style={{ color: '#5a6080', fontSize: '0.6rem', background: '#1a1d26', padding: '0.1rem 0.35rem', borderRadius: 4 }}>
                                  {task.subtaskDoneCount}/{task.subtaskCount} sub
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                              {/* Assignee */}
                              {task.assignedTo && (
                                <div style={{
                                  width: 20, height: 20, borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #6c63ff, #00d4aa)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '0.5rem', fontWeight: 800, color: 'white',
                                }}>
                                  {task.assignedTo[0]?.toUpperCase()}
                                </div>
                              )}
                              {/* Due date */}
                              {task.endDate && (
                                <span style={{ color: new Date(task.endDate) < new Date() && task.status !== 'DONE' ? '#ff9b9b' : '#5a6080', fontSize: '0.6rem', fontFamily: 'JetBrains Mono, monospace' }}>
                                  {task.endDate}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Drag tip ── */}
        <p style={{ textAlign: 'center', color: '#2a2d3e', fontSize: '0.7rem', marginTop: '2rem' }}>
          💡 Drag cards between columns to update status · Click + to add a task · Click a card to view project
        </p>
      </main>
    </div>
  )
}
