// ─────────────────────────────────────────────────────────────────
// FILE: src/pages/ProjectDetailPage.jsx
// PURPOSE: Project detail page with Kanban board
//
// Features:
//  - 3 kanban columns: TODO | IN_PROGRESS | DONE
//  - Create task (with optional dependency)
//  - Update task status (with business rule error handling)
//  - Assign task to a username
//  - Delete task
//  - Critical path badge (red highlight if task.critical === true)
//  - Shows slack days on each task
// ─────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import Navbar from '../components/shared/Navbar'
import {
  getTasks,
  createTask,
  editTask,
  updateTaskStatus,
  assignTask,
  deleteTask,
  searchTasks,
  getComments,
  addComment,
  deleteComment,
  getAttachments,
  uploadAttachment,
  downloadAttachment,
  deleteAttachment,
  getTaskAuditLogs,
} from '../api/taskApi'

// Status columns config
// ─────────────────────────────────────────────────────────────────
// WHY THIS HELPER EXISTS:
//   The backend returns errors as an object: { timestamp, status, error, message }
//   If you pass that object directly to toast.error() React crashes (white screen)
//   because it can't render a plain JS object as text.
//   This function always extracts a safe string no matter what shape the error is.
// ─────────────────────────────────────────────────────────────────
const getErrMsg = (err, fallback = 'Something went wrong') => {
  const data = err?.response?.data
  if (!data) return fallback
  if (typeof data === 'string') return data           // plain string → use as-is
  if (typeof data === 'object' && data.message) return data.message  // object → use .message
  return fallback
}

const COLUMNS = [
  { key: 'TODO',        label: '📋 To Do',       color: '#7a7f95', accent: '#252836' },
  { key: 'IN_PROGRESS', label: '⚡ In Progress',  color: '#ffd166', accent: 'rgba(255,209,102,0.15)' },
  { key: 'DONE',        label: '✅ Done',         color: '#00d4aa', accent: 'rgba(0,212,170,0.1)' },
]

export default function ProjectDetailPage() {
  const { projectId } = useParams()  // from URL: /projects/:projectId
  const navigate = useNavigate()

  const [tasks, setTasks]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [showCreate, setShowCreate]   = useState(false)
  const [showAssign, setShowAssign]   = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [editingTask, setEditingTask]   = useState(null)  // task being edited
  const [searchQuery, setSearchQuery]   = useState('')     // search bar value
  const [searchStatus, setSearchStatus] = useState('')     // filter by status

  // Create task form
  const [taskForm, setTaskForm] = useState({
    title:          '',
    description:    '',
    status:         'TODO',
    startDate:      '',
    endDate:        '',
    dependsOnTaskId: '',  // optional
  })
  const [creating, setCreating] = useState(false)

  // Assign form
  const [assignUsername, setAssignUsername] = useState('')

  // ── Fetch tasks ────────────────────────────────────────────────
  useEffect(() => {
    fetchTasks()
  }, [projectId])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const res = await getTasks(projectId)
      setTasks(res.data)  // returns TaskResponse[] directly (not paginated)
    } catch (err) {
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  // Filter tasks by status column — also applies search query and status filter
  const tasksByStatus = (status) => {
    return tasks.filter(t => {
      if (t.status !== status) return false
      if (searchStatus && searchStatus !== status) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return t.title.toLowerCase().includes(q) ||
               (t.description && t.description.toLowerCase().includes(q))
      }
      return true
    })
  }

  // ── Create task ────────────────────────────────────────────────
  const handleCreateTask = async (e) => {
    e.preventDefault()

    if (!taskForm.title) {
      toast.error('Task title is required')
      return
    }
    if (!taskForm.startDate || !taskForm.endDate) {
      toast.error('Start and End dates are required (needed for analytics)')
      return
    }

    setCreating(true)
    try {
      await createTask(projectId, {
        title:           taskForm.title,
        description:     taskForm.description.trim() || null,
        status:          taskForm.status,
        startDate:       taskForm.startDate,
        endDate:         taskForm.endDate,
        dependsOnTaskId: taskForm.dependsOnTaskId ? Number(taskForm.dependsOnTaskId) : null,
      })
      toast.success('Task created! ✅')
      setShowCreate(false)
      setTaskForm({ title: '', description: '', status: 'TODO', startDate: '', endDate: '', dependsOnTaskId: '' })
      fetchTasks()
    } catch (err) {
      toast.error(getErrMsg(err, 'Failed to create task'))
    } finally {
      setCreating(false)
    }
  }

  // ── Update task status ─────────────────────────────────────────
  const handleStatusChange = async (task, newStatus) => {
    if (task.status === newStatus) return

    try {
      await updateTaskStatus(projectId, task.id, newStatus)
      toast.success(`Task moved to ${newStatus.replace('_', ' ')}`)
      fetchTasks()
    } catch (err) {
      // ⚠️ IMPORTANT: Backend returns this specific error:
      // "Cannot complete task before dependency is DONE"
      const msg = getErrMsg(err, 'Failed to update status')
      toast.error(msg)
    }
  }

  // ── Assign task ────────────────────────────────────────────────
  const handleAssign = async (e) => {
    e.preventDefault()
    if (!assignUsername.trim()) {
      toast.error('Enter a username')
      return
    }
    try {
      await assignTask(projectId, showAssign.id, assignUsername.trim())
      toast.success(`Task assigned to ${assignUsername}`)
      setShowAssign(null)
      setAssignUsername('')
      fetchTasks()
    } catch (err) {
      toast.error(getErrMsg(err, 'Failed to assign task'))
    }
  }

  // ── Delete task ────────────────────────────────────────────────
  const handleDelete = async (task) => {
    if (!confirm(`Delete task "${task.title}"?`)) return
    try {
      await deleteTask(projectId, task.id)
      toast.success('Task deleted')
      fetchTasks()
    } catch (err) {
      toast.error('Failed to delete task')
    }
  }

  // ── Styles ─────────────────────────────────────────────────────
  const inputStyle = {
    width: '100%',
    background: '#1a1d26',
    border: '1px solid #252836',
    borderRadius: 10,
    padding: '0.75rem 1rem',
    color: '#e8eaf0',
    fontSize: '0.875rem',
    fontFamily: 'Outfit, sans-serif',
    outline: 'none',
  }

  // Read theme from CSS vars (set by ThemeContext on document root)
  const isDark = document.documentElement.style.getPropertyValue('--bg') === '#0a0b0e' || !document.documentElement.style.getPropertyValue('--bg')
  const BG      = 'var(--bg,#0a0b0e)'
  const SURFACE = 'var(--surface,#12141a)'
  const TEXT    = 'var(--text,#e8eaf0)'
  const MUTED   = 'var(--muted,#7a7f95)'
  const BORDER  = 'var(--border,#252836)'

  return (
    <div style={{ minHeight: '100vh', background: BG, transition: 'background 0.25s, color 0.25s' }}>
      <Navbar />

      <main style={{ padding: '2rem', maxWidth: 1280, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem' }}
            >
              ← Back to Dashboard
            </button>
            <h1 style={{ color: TEXT, fontSize: '1.5rem', fontWeight: 800 }}>
              Project Tasks
            </h1>
            <p style={{ color: MUTED, fontSize: '0.8rem', marginTop: '0.2rem' }}>
              Project #{projectId} · {tasks.length} total tasks
            </p>
          </div>

          {/* All header buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={() => navigate(`/projects/${projectId}/kanban`)}
              style={{ background: 'rgba(255,209,102,0.1)', border: '1px solid rgba(255,209,102,0.28)', color: '#ffd166', padding: '0.5rem 0.9rem', borderRadius: 9, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.8rem' }}>
              🗂 Kanban
            </button>
            <button onClick={() => navigate(`/projects/${projectId}/chat`)}
              style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.28)', color: '#a09bff', padding: '0.5rem 0.9rem', borderRadius: 9, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.8rem' }}>
              💬 Chat
            </button>
            <button onClick={() => navigate(`/projects/${projectId}/members`)}
              style={{ background: 'rgba(0,180,216,0.1)', border: '1px solid rgba(0,180,216,0.28)', color: '#00b4d8', padding: '0.5rem 0.9rem', borderRadius: 9, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.8rem' }}>
              👥 Members
            </button>
            <button onClick={() => navigate(`/projects/${projectId}/analytics`)}
              style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.28)', color: '#00d4aa', padding: '0.5rem 0.9rem', borderRadius: 9, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.8rem' }}>
              📊 Analytics
            </button>
            <button onClick={() => navigate(`/projects/${projectId}/workload`)}
              style={{ background: 'rgba(160,155,255,0.1)', border: '1px solid rgba(160,155,255,0.28)', color: '#a09bff', padding: '0.5rem 0.9rem', borderRadius: 9, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.8rem' }}>
              📋 Workload
            </button>
            <button onClick={() => navigate(`/projects/${projectId}/velocity`)}
              style={{ background: 'rgba(108,158,255,0.1)', border: '1px solid rgba(108,158,255,0.28)', color: '#6c9eff', padding: '0.5rem 0.9rem', borderRadius: 9, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.8rem' }}>
              📈 Velocity
            </button>
            <button onClick={() => setShowCreate(true)}
              style={{ background: 'linear-gradient(135deg, #6c63ff, #5a52d5)', color: '#fff', border: 'none', padding: '0.55rem 1.1rem', borderRadius: 9, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.875rem', boxShadow: '0 4px 16px rgba(108,99,255,0.35)' }}>
              + Add Task
            </button>
          </div>
        </div>

        {/* ── SEARCH BAR (Feature 6) ─────────────────────────── */}
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="🔍  Search tasks..."
            style={{
              flex: 1, minWidth: 200,
              background: '#12141a', border: '1px solid #252836',
              borderRadius: 10, padding: '0.6rem 1rem',
              color: '#e8eaf0', fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem', outline: 'none',
            }}
          />
          <select
            value={searchStatus}
            onChange={e => setSearchStatus(e.target.value)}
            style={{
              background: '#12141a', border: '1px solid #252836',
              borderRadius: 10, padding: '0.6rem 0.9rem',
              color: searchStatus ? '#e8eaf0' : '#5a6080',
              fontFamily: 'Outfit, sans-serif', fontSize: '0.82rem', outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="">All Statuses</option>
            <option value="TODO">📋 To Do</option>
            <option value="IN_PROGRESS">⚡ In Progress</option>
            <option value="DONE">✅ Done</option>
          </select>
          {(searchQuery || searchStatus) && (
            <button
              onClick={() => { setSearchQuery(''); setSearchStatus('') }}
              style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.25)', borderRadius: 10, padding: '0.6rem 0.9rem', color: '#ff9b9b', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'Outfit, sans-serif' }}
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', color: '#7a7f95', padding: '3rem' }}>
            Loading tasks...
          </div>
        )}

        {/* Kanban Board */}
        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
            {COLUMNS.map(col => (
              <div key={col.key}>
                {/* Column header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem',
                  padding: '0.5rem 0',
                }}>
                  <span style={{ color: col.color, fontWeight: 700, fontSize: '0.875rem' }}>
                    {col.label}
                  </span>
                  <span style={{
                    background: '#1a1d26',
                    border: '1px solid #252836',
                    color: '#7a7f95',
                    fontSize: '0.72rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: 20,
                    fontFamily: 'JetBrains Mono, monospace',
                  }}>
                    {tasksByStatus(col.key).length}
                  </span>
                </div>

                {/* Task cards column */}
                <div
                  className="kanban-col"
                  style={{
                    background: '#0f1117',
                    border: '1px solid #252836',
                    borderRadius: 14,
                    padding: '0.75rem',
                    minHeight: 200,
                  }}
                >
                  {tasksByStatus(col.key).length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      padding: '2rem 1rem',
                      color: '#4a4f65',
                      fontSize: '0.8rem',
                    }}>
                      No tasks here
                    </div>
                  )}

                  {tasksByStatus(col.key).map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      allTasks={tasks}
                      onStatusChange={handleStatusChange}
                      onAssign={() => setShowAssign(task)}
                      onDelete={() => handleDelete(task)}
                      onView={() => setSelectedTask(task)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── CREATE TASK MODAL ──────────────────────────────────── */}
      {showCreate && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '1rem',
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowCreate(false) }}
        >
          <div
            className="animate-fade-in"
            style={{
              background: '#12141a',
              border: '1px solid #252836',
              borderRadius: 20,
              padding: '2rem',
              width: '100%',
              maxWidth: 500,
            }}
          >
            <h2 style={{ color: '#e8eaf0', fontWeight: 700, fontSize: '1.2rem', marginBottom: '1.5rem' }}>
              Add New Task
            </h2>

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>

              <div>
                <label style={{ color: '#7a7f95', fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>TITLE *</label>
                <input
                  type="text"
                  placeholder="Task title"
                  value={taskForm.title}
                  onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#6c63ff'}
                  onBlur={e => e.target.style.borderColor = '#252836'}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ color: '#7a7f95', fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>DESCRIPTION</label>
                <textarea
                  placeholder="What needs to be done?"
                  value={taskForm.description}
                  onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))}
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = '#6c63ff'}
                  onBlur={e => e.target.style.borderColor = '#252836'}
                />
              </div>

              {/* Status selector */}
              <div>
                <label style={{ color: '#7a7f95', fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>INITIAL STATUS</label>
                <select
                  value={taskForm.status}
                  onChange={e => setTaskForm(p => ({ ...p, status: e.target.value }))}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="TODO">📋 TODO</option>
                  <option value="IN_PROGRESS">⚡ IN_PROGRESS</option>
                  <option value="DONE">✅ DONE</option>
                </select>
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ color: '#7a7f95', fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>START DATE *</label>
                  <input
                    type="date"
                    value={taskForm.startDate}
                    onChange={e => setTaskForm(p => ({ ...p, startDate: e.target.value }))}
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label style={{ color: '#7a7f95', fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>END DATE *</label>
                  <input
                    type="date"
                    value={taskForm.endDate}
                    onChange={e => setTaskForm(p => ({ ...p, endDate: e.target.value }))}
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                  />
                </div>
              </div>

              {/* Dependency selector */}
              <div>
                <label style={{ color: '#7a7f95', fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  DEPENDS ON (optional)
                </label>
                <select
                  value={taskForm.dependsOnTaskId}
                  onChange={e => setTaskForm(p => ({ ...p, dependsOnTaskId: e.target.value }))}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">-- No dependency --</option>
                  {tasks.map(t => (
                    <option key={t.id} value={t.id}>
                      [{t.id}] {t.title}
                    </option>
                  ))}
                </select>
                <p style={{ color: '#4a4f65', fontSize: '0.7rem', marginTop: '0.3rem' }}>
                  If set, this task can't be marked DONE before its dependency
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  style={{
                    flex: 1, background: 'transparent',
                    border: '1px solid #252836', color: '#7a7f95',
                    borderRadius: 10, padding: '0.75rem',
                    cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    flex: 2,
                    background: creating ? '#2a2d3e' : 'linear-gradient(135deg, #6c63ff, #5a52d5)',
                    color: 'white', border: 'none',
                    borderRadius: 10, padding: '0.75rem',
                    fontWeight: 600, cursor: creating ? 'not-allowed' : 'pointer',
                    fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  {creating ? 'Creating...' : 'Create Task →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ASSIGN TASK MODAL ──────────────────────────────────── */}
      {showAssign && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: '1rem',
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowAssign(null) }}
        >
          <div
            className="animate-fade-in"
            style={{
              background: '#12141a',
              border: '1px solid #252836',
              borderRadius: 20,
              padding: '2rem',
              width: '100%',
              maxWidth: 400,
            }}
          >
            <h2 style={{ color: '#e8eaf0', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              Assign Task
            </h2>
            <p style={{ color: '#7a7f95', fontSize: '0.825rem', marginBottom: '1.5rem' }}>
              "{showAssign.title}"
            </p>

            <form onSubmit={handleAssign} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ color: '#7a7f95', fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  ASSIGN TO (username)
                </label>
                <input
                  type="text"
                  placeholder="Enter username"
                  value={assignUsername}
                  onChange={e => setAssignUsername(e.target.value)}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#6c63ff'}
                  onBlur={e => e.target.style.borderColor = '#252836'}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAssign(null)}
                  style={{
                    flex: 1, background: 'transparent',
                    border: '1px solid #252836', color: '#7a7f95',
                    borderRadius: 10, padding: '0.75rem',
                    cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    background: 'linear-gradient(135deg, #00d4aa, #00a884)',
                    color: '#0a0b0e', border: 'none',
                    borderRadius: 10, padding: '0.75rem',
                    fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  Assign →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TASK DETAIL MODAL ──────────────────────────────────── */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          allTasks={tasks}
          projectId={projectId}
          onClose={() => setSelectedTask(null)}
          onAssign={() => { setSelectedTask(null); setShowAssign(selectedTask) }}
          onStatusChange={handleStatusChange}
          onDelete={() => { handleDelete(selectedTask); setSelectedTask(null) }}
          onEdit={() => { setEditingTask(selectedTask); setSelectedTask(null) }}
        />
      )}

      {/* ── EDIT TASK MODAL (Feature 1) ─────────────────────────── */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          allTasks={tasks}
          projectId={projectId}
          onClose={() => setEditingTask(null)}
          onSaved={(updated) => {
            setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
            setEditingTask(null)
            toast.success('Task updated!')
          }}
        />
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// TaskDetailModal — full info panel shown when clicking a task
// ────────────────────────────────────────────────────────────────
function TaskDetailModal({ task, allTasks, projectId, onClose, onAssign, onStatusChange, onDelete, onEdit }) {
  const dependency = task.dependencyTaskId
    ? allTasks.find(t => t.id === task.dependencyTaskId)
    : null

  const dependents = allTasks.filter(t => t.dependencyTaskId === task.id)

  const STATUS_COLORS = {
    TODO:        { bg: 'rgba(122,127,149,0.12)', border: 'rgba(122,127,149,0.3)', text: '#7a7f95' },
    IN_PROGRESS: { bg: 'rgba(255,209,102,0.12)', border: 'rgba(255,209,102,0.3)', text: '#ffd166' },
    DONE:        { bg: 'rgba(0,212,170,0.12)',   border: 'rgba(0,212,170,0.3)',   text: '#00d4aa' },
  }
  const sc = STATUS_COLORS[task.status] || STATUS_COLORS.TODO

  // Calculate duration in days
  const getDuration = () => {
    if (!task.startDate || !task.endDate) return null
    const diff = (new Date(task.endDate) - new Date(task.startDate)) / (1000*60*60*24)
    return Math.max(0, Math.round(diff))
  }

  const duration = getDuration()

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 300, padding: '1rem',
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          background: '#12141a',
          border: `1px solid ${task.critical ? 'rgba(255,107,107,0.4)' : '#252836'}`,
          borderRadius: 20,
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        {/* Critical top bar */}
        {task.critical && (
          <div style={{
            height: 3,
            background: 'linear-gradient(90deg, #ff6b6b, #ff9b9b)',
            borderRadius: '20px 20px 0 0',
          }} />
        )}

        {/* Header */}
        <div style={{
          padding: '1.5rem 1.5rem 1rem',
          borderBottom: '1px solid #252836',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Task ID badge */}
            <span style={{
              background: '#1a1d26', border: '1px solid #252836',
              color: '#7a7f95', fontSize: '0.68rem',
              fontFamily: 'JetBrains Mono, monospace',
              padding: '0.15rem 0.5rem', borderRadius: 5,
              display: 'inline-block', marginBottom: '0.5rem',
            }}>
              TASK #{task.id}
            </span>
            <h2 style={{
              color: '#e8eaf0', fontWeight: 800, fontSize: '1.15rem',
              lineHeight: 1.3, wordBreak: 'break-word',
            }}>
              {task.title}
            </h2>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid #252836',
              color: '#7a7f95', width: 32, height: 32, borderRadius: 8,
              cursor: 'pointer', fontSize: '1rem', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(255,107,107,0.15)'; e.currentTarget.style.color='#ff9b9b' }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.color='#7a7f95' }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

          {/* Status + Critical row */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              background: sc.bg, border: `1px solid ${sc.border}`,
              color: sc.text, fontWeight: 700, fontSize: '0.75rem',
              padding: '0.3rem 0.8rem', borderRadius: 20,
            }}>
              {task.status === 'IN_PROGRESS' ? '⚡ IN PROGRESS' : task.status === 'DONE' ? '✅ DONE' : '📋 TODO'}
            </span>
            {task.critical && (
              <span style={{
                background: 'rgba(255,107,107,0.12)', border: '1px solid rgba(255,107,107,0.3)',
                color: '#ff9b9b', fontWeight: 700, fontSize: '0.75rem',
                padding: '0.3rem 0.8rem', borderRadius: 20,
              }}>
                🔴 CRITICAL PATH
              </span>
            )}
            <span style={{
              background: task.slackDays === 0 ? 'rgba(255,107,107,0.1)' : 'rgba(0,212,170,0.08)',
              border: `1px solid ${task.slackDays === 0 ? 'rgba(255,107,107,0.2)' : 'rgba(0,212,170,0.15)'}`,
              color: task.slackDays === 0 ? '#ff9b9b' : '#00d4aa',
              fontSize: '0.72rem', padding: '0.3rem 0.7rem', borderRadius: 20,
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              ⏱ {task.slackDays}d slack
            </span>
          </div>

          {/* Description */}
          {task.description && task.description.trim() ? (
            <Section icon="📝" title="Description">
              <p style={{ color: '#b0b5cc', fontSize: '0.875rem', lineHeight: 1.7 }}>
                {task.description}
              </p>
            </Section>
          ) : (
            <Section icon="📝" title="Description">
              <p style={{ color: '#4a4f65', fontSize: '0.825rem', fontStyle: 'italic' }}>
                No description added
              </p>
            </Section>
          )}

          {/* Dates + Duration */}
          <Section icon="📅" title="Timeline">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <DateBox label="Start" value={task.startDate} color="#6c63ff" />
              <DateBox label="End"   value={task.endDate}   color="#ff9b9b" />
              <DateBox label="Duration" value={duration !== null ? `${duration} days` : '—'} color="#ffd166" />
            </div>
          </Section>

          {/* Assigned to */}
          <Section icon="👤" title="Assigned To">
            {task.assignedTo ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)',
                borderRadius: 10, padding: '0.65rem 0.9rem',
              }}>
                <div style={{
                  width: 32, height: 32,
                  background: 'linear-gradient(135deg,#6c63ff,#00d4aa)',
                  borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800,
                  color: 'white', flexShrink: 0,
                }}>
                  {task.assignedTo.slice(0,2).toUpperCase()}
                </div>
                <span style={{ color: '#a09bff', fontWeight: 600, fontSize: '0.875rem' }}>
                  {task.assignedTo}
                </span>
              </div>
            ) : (
              <p style={{ color: '#4a4f65', fontSize: '0.825rem', fontStyle: 'italic' }}>
                Not assigned to anyone yet
              </p>
            )}
          </Section>

          {/* Dependencies */}
          <Section icon="🔗" title="Dependencies">
            {dependency ? (
              <div style={{
                background: 'rgba(255,209,102,0.07)', border: '1px solid rgba(255,209,102,0.2)',
                borderRadius: 10, padding: '0.65rem 0.9rem',
                display: 'flex', alignItems: 'center', gap: '0.6rem',
              }}>
                <span style={{ color: '#ffd166', fontSize: '0.7rem',
                  fontFamily: 'JetBrains Mono, monospace' }}>#{dependency.id}</span>
                <span style={{ color: '#ffd166', fontSize: '0.85rem' }}>{dependency.title}</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.65rem',
                  background: STATUS_COLORS_MAP[dependency.status]?.bg,
                  border: `1px solid ${STATUS_COLORS_MAP[dependency.status]?.border}`,
                  color: STATUS_COLORS_MAP[dependency.status]?.text,
                  padding: '0.1rem 0.4rem', borderRadius: 4 }}>
                  {dependency.status}
                </span>
              </div>
            ) : (
              <p style={{ color: '#4a4f65', fontSize: '0.825rem', fontStyle: 'italic' }}>
                No dependencies — this task can start anytime
              </p>
            )}
          </Section>

          {/* Blocks (dependents) */}
          {dependents.length > 0 && (
            <Section icon="⛓" title={`Blocks ${dependents.length} task${dependents.length > 1 ? 's' : ''}`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {dependents.map(t => (
                  <div key={t.id} style={{
                    background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.15)',
                    borderRadius: 8, padding: '0.5rem 0.8rem',
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                  }}>
                    <span style={{ color: '#7a7f95', fontSize: '0.68rem',
                      fontFamily: 'JetBrains Mono, monospace' }}>#{t.id}</span>
                    <span style={{ color: '#c0c5dc', fontSize: '0.82rem', flex: 1 }}>{t.title}</span>
                    <span style={{
                      fontSize: '0.62rem',
                      background: STATUS_COLORS_MAP[t.status]?.bg,
                      border: `1px solid ${STATUS_COLORS_MAP[t.status]?.border}`,
                      color: STATUS_COLORS_MAP[t.status]?.text,
                      padding: '0.1rem 0.4rem', borderRadius: 4,
                    }}>{t.status}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* ── COMMENTS SECTION (Feature 4) ─────────────────────── */}
        <CommentsSection task={task} projectId={projectId} />

        {/* ── ATTACHMENTS SECTION (Feature 9) ──────────────────── */}
        <AttachmentsSection task={task} projectId={projectId} />

        {/* ── AUDIT LOG SECTION (Feature 11) ───────────────────── */}
        <AuditLogSection task={task} />

        {/* Footer action buttons */}
        <div style={{
          borderTop: '1px solid #252836', padding: '1rem 1.5rem',
          display: 'flex', gap: '0.6rem', flexWrap: 'wrap',
        }}>
          {task.status !== 'TODO' && (
            <button onClick={() => { onStatusChange(task,'TODO'); onClose() }} style={actionBtn('#7a7f95','rgba(122,127,149,0.12)')}>
              📋 Move to To Do
            </button>
          )}
          {task.status !== 'IN_PROGRESS' && (
            <button onClick={() => { onStatusChange(task,'IN_PROGRESS'); onClose() }} style={actionBtn('#ffd166','rgba(255,209,102,0.1)')}>
              ⚡ Mark In Progress
            </button>
          )}
          {task.status !== 'DONE' && (
            <button onClick={() => { onStatusChange(task,'DONE'); onClose() }} style={actionBtn('#00d4aa','rgba(0,212,170,0.1)')}>
              ✅ Mark Done
            </button>
          )}
          <button onClick={onAssign} style={actionBtn('#a09bff','rgba(108,99,255,0.1)')}>
            👤 Assign
          </button>
          {/* Edit button — Feature 1 */}
          <button onClick={onEdit} style={actionBtn('#ffd166','rgba(255,209,102,0.08)')}>
            ✏️ Edit
          </button>
          <button onClick={onDelete} style={{ ...actionBtn('#ff9b9b','rgba(255,107,107,0.08)'), marginLeft: 'auto' }}>
            🗑 Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// Color map for dependency/dependent status badges
const STATUS_COLORS_MAP = {
  TODO:        { bg: 'rgba(122,127,149,0.1)', border: 'rgba(122,127,149,0.25)', text: '#7a7f95' },
  IN_PROGRESS: { bg: 'rgba(255,209,102,0.1)', border: 'rgba(255,209,102,0.25)', text: '#ffd166' },
  DONE:        { bg: 'rgba(0,212,170,0.1)',   border: 'rgba(0,212,170,0.25)',   text: '#00d4aa' },
}

// Section wrapper with icon + title
function Section({ icon, title, children }) {
  return (
    <div>
      <p style={{
        color: '#7a7f95', fontSize: '0.7rem', fontWeight: 700,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
      }}>
        <span>{icon}</span> {title}
      </p>
      {children}
    </div>
  )
}

// Date display box
function DateBox({ label, value, color }) {
  return (
    <div style={{
      background: '#1a1d26', border: '1px solid #252836',
      borderRadius: 10, padding: '0.65rem 0.75rem', textAlign: 'center',
    }}>
      <p style={{ color: '#4a4f65', fontSize: '0.65rem', fontWeight: 600,
        textTransform: 'uppercase', marginBottom: '0.3rem' }}>{label}</p>
      <p style={{
        color: value && value !== '—' ? color : '#4a4f65',
        fontSize: value && value.includes('days') ? '0.85rem' : '0.78rem',
        fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
      }}>{value || '—'}</p>
    </div>
  )
}

// Action button style helper for modal footer
function actionBtn(color, bg) {
  return {
    background: bg, border: `1px solid ${color}30`,
    color, fontSize: '0.78rem', fontWeight: 600,
    padding: '0.5rem 0.85rem', borderRadius: 8,
    cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
    whiteSpace: 'nowrap', transition: 'opacity 0.15s',
  }
}


// ────────────────────────────────────────────────────────────────
// TaskCard — clickable card shown in each Kanban column
// Clicking anywhere on the card opens the TaskDetailModal
// ────────────────────────────────────────────────────────────────
function TaskCard({ task, allTasks, onStatusChange, onAssign, onDelete, onView }) {
  const dependency = task.dependencyTaskId
    ? allTasks.find(t => t.id === task.dependencyTaskId)
    : null

  return (
    <div
      className="animate-fade-in"
      onClick={onView}
      style={{
        background: '#12141a',
        border: `1px solid ${task.critical ? 'rgba(255,107,107,0.35)' : '#252836'}`,
        borderRadius: 12,
        padding: '1rem',
        marginBottom: '0.75rem',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.18s, transform 0.18s, box-shadow 0.18s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = task.critical ? 'rgba(255,107,107,0.65)' : 'rgba(108,99,255,0.45)'
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.35)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = task.critical ? 'rgba(255,107,107,0.35)' : '#252836'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Critical top bar */}
      {task.critical && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, #ff6b6b, #ff9b9b)',
        }} />
      )}

      {/* Title row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <h4 style={{ color: '#e8eaf0', fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.4 }}>
          {task.title}
        </h4>
        <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0, alignItems: 'center' }}>
          {task.critical && (
            <span style={{
              background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.3)',
              color: '#ff9b9b', fontSize: '0.58rem', padding: '0.12rem 0.35rem',
              borderRadius: 4, fontWeight: 700,
            }}>🔴 CRITICAL</span>
          )}
          {/* Click hint */}
          <span style={{ color: '#4a4f65', fontSize: '0.6rem' }}>›</span>
        </div>
      </div>

      {/* Badges row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.55rem' }}>
        {task.assignedTo && (
          <span style={{
            background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)',
            color: '#a09bff', fontSize: '0.63rem', padding: '0.12rem 0.4rem', borderRadius: 4,
          }}>👤 {task.assignedTo}</span>
        )}
        <span style={{
          background: task.slackDays === 0 ? 'rgba(255,107,107,0.1)' : 'rgba(0,212,170,0.08)',
          border: `1px solid ${task.slackDays === 0 ? 'rgba(255,107,107,0.2)' : 'rgba(0,212,170,0.15)'}`,
          color: task.slackDays === 0 ? '#ff9b9b' : '#00d4aa',
          fontSize: '0.63rem', padding: '0.12rem 0.4rem', borderRadius: 4,
          fontFamily: 'JetBrains Mono, monospace',
        }}>⏱ {task.slackDays}d slack</span>
        {dependency && (
          <span style={{
            background: 'rgba(255,209,102,0.08)', border: '1px solid rgba(255,209,102,0.2)',
            color: '#ffd166', fontSize: '0.63rem', padding: '0.12rem 0.4rem', borderRadius: 4,
          }}>🔗 {dependency.title}</span>
        )}
      </div>

      {/* Dates */}
      {(task.startDate || task.endDate) && (
        <p style={{ color: '#4a4f65', fontSize: '0.63rem', marginTop: '0.4rem', fontFamily: 'JetBrains Mono, monospace' }}>
          {task.startDate} → {task.endDate}
        </p>
      )}

      {/* Quick action buttons — stop propagation so they don't open the modal */}
      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
        {task.status !== 'TODO' && (
          <button onClick={e => { e.stopPropagation(); onStatusChange(task,'TODO') }} style={smallBtn('#7a7f95','#252836')}>
            📋 To Do
          </button>
        )}
        {task.status !== 'IN_PROGRESS' && (
          <button onClick={e => { e.stopPropagation(); onStatusChange(task,'IN_PROGRESS') }} style={smallBtn('#ffd166','rgba(255,209,102,0.15)')}>
            ⚡ In Progress
          </button>
        )}
        {task.status !== 'DONE' && (
          <button onClick={e => { e.stopPropagation(); onStatusChange(task,'DONE') }} style={smallBtn('#00d4aa','rgba(0,212,170,0.1)')}>
            ✅ Done
          </button>
        )}
        <button onClick={e => { e.stopPropagation(); onAssign() }} style={smallBtn('#a09bff','rgba(108,99,255,0.1)')}>
          👤 Assign
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete() }} style={smallBtn('#ff9b9b','rgba(255,107,107,0.1)')}>
          🗑
        </button>
      </div>
    </div>
  )
}

// Small button style helper for TaskCard quick actions
function smallBtn(color, bg) {
  return {
    background: bg, border: `1px solid ${color}30`, color,
    fontSize: '0.63rem', padding: '0.22rem 0.45rem', borderRadius: 6,
    cursor: 'pointer', fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap',
  }
}

// ─────────────────────────────────────────────────────────────────
// EditTaskModal — Feature 1: edit task title, description, dates, dependency
// ─────────────────────────────────────────────────────────────────
function EditTaskModal({ task, allTasks, projectId, onClose, onSaved }) {
  const [form, setForm] = useState({
    title:          task.title       || '',
    description:    task.description || '',
    startDate:      task.startDate   || '',
    endDate:        task.endDate     || '',
    dependsOnTaskId: task.dependencyTaskId || '',
  })
  const [saving, setSaving] = useState(false)

  const inp = {
    width: '100%', background: '#1a1d26', border: '1px solid #252836',
    borderRadius: 10, padding: '0.65rem 0.9rem', color: '#e8eaf0',
    fontFamily: 'Outfit, sans-serif', fontSize: '0.875rem', outline: 'none',
    marginBottom: '0.9rem',
  }

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Title is required')
    setSaving(true)
    try {
      const res = await editTask(projectId, task.id, {
        title:          form.title,
        description:    form.description.trim() || null,
        startDate:      form.startDate   || null,
        endDate:        form.endDate     || null,
        dependsOnTaskId: form.dependsOnTaskId ? Number(form.dependsOnTaskId) : null,
      })
      onSaved(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, padding: '1rem',
    }}>
      <div style={{
        background: '#12141a', border: '1px solid rgba(255,209,102,0.3)',
        borderRadius: 20, width: '100%', maxWidth: 480,
      }}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #252836', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: '#e8eaf0', fontWeight: 800 }}>✏️ Edit Task</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#5a6080', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
        </div>

        <div style={{ padding: '1.25rem 1.5rem' }}>
          <label style={{ color: '#7a7f95', fontSize: '.75rem', fontWeight: 600, display: 'block', marginBottom: '.35rem' }}>Title *</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inp} placeholder="Task title" />

          <label style={{ color: '#7a7f95', fontSize: '.75rem', fontWeight: 600, display: 'block', marginBottom: '.35rem' }}>Description</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            style={{ ...inp, resize: 'vertical', minHeight: 80 }} placeholder="Description (optional)" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' }}>
            <div>
              <label style={{ color: '#7a7f95', fontSize: '.75rem', fontWeight: 600, display: 'block', marginBottom: '.35rem' }}>Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                style={{ ...inp, marginBottom: 0, colorScheme: 'dark' }} />
            </div>
            <div>
              <label style={{ color: '#7a7f95', fontSize: '.75rem', fontWeight: 600, display: 'block', marginBottom: '.35rem' }}>End Date</label>
              <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                style={{ ...inp, marginBottom: 0, colorScheme: 'dark' }} />
            </div>
          </div>

          <label style={{ color: '#7a7f95', fontSize: '.75rem', fontWeight: 600, display: 'block', marginTop: '.9rem', marginBottom: '.35rem' }}>
            Dependency (depends on)
          </label>
          <select value={form.dependsOnTaskId} onChange={e => setForm(f => ({ ...f, dependsOnTaskId: e.target.value }))}
            style={{ ...inp, cursor: 'pointer', marginBottom: 0 }}>
            <option value="">No dependency</option>
            {allTasks.filter(t => t.id !== task.id).map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #252836', display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: '#1a1d26', border: '1px solid #252836', color: '#7a7f95', padding: '0.6rem 1.1rem', borderRadius: 9, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{ background: 'linear-gradient(135deg,#ffd166,#ffb703)', border: 'none', color: '#0a0b0e', fontWeight: 700, padding: '0.6rem 1.3rem', borderRadius: 9, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// CommentsSection — Feature 4
// Shows inside TaskDetailModal. Loads comments and lets owner/assignee post.
// ─────────────────────────────────────────────────────────────────
function CommentsSection({ task, projectId }) {
  const [comments, setComments]     = useState([])
  const [text, setText]             = useState('')
  const [loading, setLoading]       = useState(true)
  const [posting, setPosting]       = useState(false)
  const bottomRef                   = useRef(null)

  // Decode current user from JWT
  const token    = localStorage.getItem('token') || ''
  const username = token ? (() => { try { return JSON.parse(atob(token.split('.')[1])).sub } catch { return '' } })() : ''

  useEffect(() => {
    setLoading(true)
    getComments(projectId, task.id)
      .then(r => setComments(r.data || []))
      .catch(() => setComments([]))
      .finally(() => setLoading(false))
  }, [task.id, projectId])

  const handlePost = async () => {
    if (!text.trim()) return
    setPosting(true)
    try {
      const res = await addComment(projectId, task.id, text.trim())
      setComments(prev => [...prev, res.data])
      setText('')
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err) {
      toast.error(err.response?.data || 'Failed to post comment')
    } finally {
      setPosting(false)
    }
  }

  const handleDelete = async (commentId) => {
    try {
      await deleteComment(projectId, task.id, commentId)
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch {
      toast.error('Failed to delete comment')
    }
  }

  const fmt = (dt) => {
    if (!dt) return ''
    const d = new Date(dt)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ borderTop: '1px solid #252836', padding: '1rem 1.5rem' }}>
      <p style={{ color: '#5a6080', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.8rem' }}>
        💬 Comments {comments.length > 0 && `(${comments.length})`}
      </p>

      {/* Comment list */}
      <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.55rem', marginBottom: '0.8rem' }}>
        {loading && <p style={{ color: '#5a6080', fontSize: '0.78rem' }}>Loading...</p>}
        {!loading && comments.length === 0 && (
          <p style={{ color: '#3a3f52', fontSize: '0.78rem', fontStyle: 'italic' }}>No comments yet. Be the first to comment.</p>
        )}
        {comments.map(c => (
          <div key={c.id} style={{ background: '#0e1018', border: '1px solid #1e2230', borderRadius: 10, padding: '0.65rem 0.85rem', display: 'flex', gap: '0.6rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#6c63ff,#00d4aa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '0.65rem', flexShrink: 0, marginTop: 1 }}>
              {c.authorUsername?.slice(0,2).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ color: '#a0a8c0', fontWeight: 700, fontSize: '0.75rem' }}>{c.authorUsername}</span>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <span style={{ color: '#3a3f52', fontSize: '0.65rem' }}>{fmt(c.createdAt)}</span>
                  {c.authorUsername === username && (
                    <button onClick={() => handleDelete(c.id)} style={{ background: 'none', border: 'none', color: '#3a3f52', cursor: 'pointer', fontSize: '0.7rem', padding: '0 0.2rem' }} title="Delete comment">✕</button>
                  )}
                </div>
              </div>
              <p style={{ color: '#c0c5d8', fontSize: '0.8rem', marginTop: '0.2rem', lineHeight: 1.5 }}>{c.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Post a comment */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePost() } }}
          placeholder="Write a comment... (Enter to post)"
          style={{
            flex: 1, background: '#1a1d26', border: '1px solid #252836', borderRadius: 9,
            padding: '0.55rem 0.85rem', color: '#e8eaf0',
            fontFamily: 'Outfit, sans-serif', fontSize: '0.8rem', outline: 'none',
          }}
        />
        <button
          onClick={handlePost}
          disabled={posting || !text.trim()}
          style={{
            background: text.trim() ? 'linear-gradient(135deg,#6c63ff,#5a52e0)' : '#1a1d26',
            border: '1px solid #252836', borderRadius: 9, padding: '0.55rem 0.9rem',
            color: text.trim() ? '#fff' : '#3a3f52', cursor: text.trim() ? 'pointer' : 'not-allowed',
            fontFamily: 'Outfit, sans-serif', fontSize: '0.8rem', fontWeight: 600,
            transition: 'background 0.15s',
          }}
        >
          {posting ? '...' : 'Post'}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// AttachmentsSection — Feature 9: File Attachments
// ─────────────────────────────────────────────────────────────────
function AttachmentsSection({ task, projectId }) {
  const [attachments, setAttachments] = useState([])
  const [uploading,   setUploading]   = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const fileInputRef = useRef(null)

  // Safely decode username from JWT
  const getUsername = () => {
    try {
      const token = localStorage.getItem('token') || ''
      if (!token) return ''
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.sub || ''
    } catch { return '' }
  }
  const username = getUsername()

  useEffect(() => {
    setLoading(true)
    setError(null)
    getAttachments(projectId, task.id)
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : []
        setAttachments(data)
      })
      .catch(err => {
        console.error('Failed to load attachments:', err)
        setAttachments([])
      })
      .finally(() => setLoading(false))
  }, [task.id, projectId])

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Reset input immediately so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB')
      return
    }

    setUploading(true)
    try {
      const res = await uploadAttachment(projectId, task.id, file)
      // Refresh full list from server to get correct data
      const refreshed = await getAttachments(projectId, task.id)
      const data = Array.isArray(refreshed.data) ? refreshed.data : []
      setAttachments(data)
      toast.success('File uploaded! 📎')
    } catch (err) {
      console.error('Upload error:', err)
      const msg = err.response?.data?.message
        || err.response?.data
        || err.message
        || 'Upload failed'
      toast.error(typeof msg === 'string' ? msg : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (att) => {
    try {
      await downloadAttachment(projectId, task.id, att.id, att.fileName)
    } catch (err) {
      console.error('Download error:', err)
      toast.error('Download failed')
    }
  }

  const handleDelete = async (attId) => {
    try {
      await deleteAttachment(projectId, task.id, attId)
      setAttachments(prev => prev.filter(a => a.id !== attId))
      toast.success('Attachment removed')
    } catch (err) {
      console.error('Delete error:', err)
      toast.error('Failed to delete attachment')
    }
  }

  const formatSize = (bytes) => {
    if (!bytes) return '0 B'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const fileIcon = (contentType) => {
    if (!contentType) return '📄'
    if (contentType.startsWith('image/')) return '🖼️'
    if (contentType === 'application/pdf') return '📕'
    if (contentType.includes('word')) return '📝'
    if (contentType.includes('excel') || contentType.includes('spreadsheet')) return '📊'
    if (contentType.includes('zip')) return '🗜️'
    return '📄'
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    try { return new Date(dateStr).toLocaleDateString() }
    catch { return '' }
  }

  return (
    <div style={{ borderTop: '1px solid #1e2130', padding: '1.25rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
        <p style={{ color: '#5a6080', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
          📎 Attachments {attachments.length > 0 && `(${attachments.length})`}
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.25)',
            borderRadius: 8, padding: '0.35rem 0.8rem', color: '#a09bff',
            fontSize: '0.75rem', fontWeight: 600,
            cursor: uploading ? 'not-allowed' : 'pointer',
            opacity: uploading ? 0.6 : 1,
            fontFamily: 'inherit',
          }}
        >
          {uploading ? '⏳ Uploading...' : '+ Upload File'}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUpload}
          style={{ display: 'none' }}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
        />
      </div>

      {/* File list */}
      {loading ? (
        <p style={{ color: '#4a4f65', fontSize: '0.8rem', fontStyle: 'italic' }}>Loading...</p>
      ) : attachments.length === 0 ? (
        <p style={{ color: '#4a4f65', fontSize: '0.825rem', fontStyle: 'italic' }}>No files attached yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {attachments.map(att => att && att.id ? (
            <div key={att.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#1a1d26', border: '1px solid #252836', borderRadius: 10,
              padding: '0.6rem 0.85rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                <span style={{ fontSize: '1.1rem' }}>{fileIcon(att.contentType)}</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: '#c8cce0', fontSize: '0.82rem', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                    {att.fileName || 'Unknown file'}
                  </p>
                  <p style={{ color: '#4a4f65', fontSize: '0.7rem', margin: 0 }}>
                    {formatSize(att.fileSize)} · {att.uploadedBy || ''}{att.uploadedAt ? ' · ' + formatDate(att.uploadedAt) : ''}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                <button
                  onClick={() => handleDownload(att)}
                  style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 7, padding: '0.3rem 0.6rem', color: '#00d4aa', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  ⬇ Download
                </button>
                {att.uploadedBy === username && (
                  <button
                    onClick={() => handleDelete(att.id)}
                    style={{ background: 'rgba(255,107,107,0.07)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 7, padding: '0.3rem 0.6rem', color: '#ff9b9b', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ) : null)}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// AuditLogSection — Feature 11: Activity Log
// ─────────────────────────────────────────────────────────────────
function AuditLogSection({ task }) {
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [open,    setOpen]    = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getTaskAuditLogs(task.id)
      .then(r => setLogs(r.data || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [task.id, open])

  const actionColor = (action) => {
    switch (action) {
      case 'CREATE':         return '#00d4aa'
      case 'DELETE':         return '#ff9b9b'
      case 'STATUS_CHANGE':  return '#ffd166'
      case 'ASSIGN':         return '#a09bff'
      case 'UPDATE':         return '#6c9eff'
      case 'COMMENT':        return '#7a7f95'
      case 'ATTACHMENT_UPLOAD': return '#00b4d8'
      default:               return '#5a6080'
    }
  }

  const fmt = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ borderTop: '1px solid #1e2130', padding: '1.25rem 1.5rem' }}>
      {/* Collapsible header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: 0, width: '100%',
        }}
      >
        <p style={{ color: '#5a6080', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
          📋 Activity Log
        </p>
        <span style={{ color: '#4a4f65', fontSize: '0.7rem', marginLeft: 'auto' }}>
          {open ? '▲ Hide' : '▼ Show'}
        </span>
      </button>

      {open && (
        <div style={{ marginTop: '0.9rem' }}>
          {loading ? (
            <p style={{ color: '#4a4f65', fontSize: '0.8rem', fontStyle: 'italic' }}>Loading history...</p>
          ) : logs.length === 0 ? (
            <p style={{ color: '#4a4f65', fontSize: '0.825rem', fontStyle: 'italic' }}>No activity recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 260, overflowY: 'auto' }}>
              {logs.map(log => (
                <div key={log.id} style={{
                  display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                  padding: '0.55rem 0.75rem',
                  background: '#1a1d26', border: '1px solid #252836', borderRadius: 10,
                }}>
                  {/* Action badge */}
                  <span style={{
                    flexShrink: 0, fontSize: '0.62rem', fontWeight: 700,
                    padding: '0.2rem 0.5rem', borderRadius: 20,
                    background: actionColor(log.action) + '18',
                    color: actionColor(log.action),
                    border: `1px solid ${actionColor(log.action)}30`,
                    marginTop: 2,
                  }}>
                    {log.action.replace('_', ' ')}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#b0b5cc', fontSize: '0.8rem', margin: '0 0 0.2rem 0' }}>
                      {log.description}
                    </p>
                    <p style={{ color: '#4a4f65', fontSize: '0.7rem', margin: 0 }}>
                      {fmt(log.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}