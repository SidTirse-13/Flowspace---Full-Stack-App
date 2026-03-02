// ─────────────────────────────────────────────────────────────────
// FILE: src/pages/DashboardPage.jsx
// PURPOSE: Main dashboard — lists all your projects (paginated)
//
// Features:
//  - Paginated list of projects (5 per page)
//  - Create new project (modal form)
//  - Delete project
//  - Click project card → go to project detail
//
// IMPORTANT: Spring's Page response has your projects in .content
//   response.data.content = array of projects
//   response.data.totalPages = how many pages total
// ─────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import Navbar from '../components/shared/Navbar'
import { useAuth } from '../context/AuthContext'
import { getProjects, createProject, deleteProject, editProject, searchProjects } from '../api/projectApi'
import { getMyTasks } from '../api/taskApi'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { username } = useAuth()

  // Greeting + date
  const now       = new Date()
  const dayName   = now.toLocaleDateString('en-US', { weekday: 'long' })
  const dateStr   = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const hour      = now.getHours()
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Project list state
  const [projects, setProjects]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [page, setPage]             = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // My assigned tasks state
  const [myTasks, setMyTasks]           = useState([])
  const [myTasksLoading, setMyTasksLoading] = useState(true)
  const [myTasksFilter, setMyTasksFilter]   = useState('ALL')

  // Edit project state (Feature 2)
  const [editingProject, setEditingProject] = useState(null)

  // Search projects state (Feature 6)
  const [projectSearch, setProjectSearch]   = useState('')
  const [searchResults, setSearchResults]   = useState(null)   // null = not in search mode
  const [searchLoading, setSearchLoading]   = useState(false)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
  })
  const [creating, setCreating] = useState(false)

  // ── Fetch projects whenever page changes ─────────────────────
  useEffect(() => {
    fetchProjects()
  }, [page])

  // ── Fetch MY tasks once on load ───────────────────────────────
  useEffect(() => {
    fetchMyTasks()
  }, [])

  // ── Server-side project search with 350ms debounce ───────────
  useEffect(() => {
    if (!projectSearch.trim()) {
      setSearchResults(null)   // empty query → show normal paginated list
      return
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await searchProjects(projectSearch.trim())
        setSearchResults(res.data)
      } catch (err) {
        toast.error('Search failed')
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [projectSearch])

  const fetchMyTasks = async () => {
    setMyTasksLoading(true)
    try {
      const res = await getMyTasks()
      setMyTasks(res.data)
    } catch (err) {
      // Not an error worth showing — user may just have no assigned tasks
      setMyTasks([])
    } finally {
      setMyTasksLoading(false)
    }
  }

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const res = await getProjects(page, 5)
      // Spring Page object: projects are in .content
      setProjects(res.data.content)
      setTotalPages(res.data.totalPages)
    } catch (err) {
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  // ── Create project ────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault()

    if (!form.name) {
      toast.error('Project name is required')
      return
    }

    setCreating(true)
    try {
      await createProject({
        name:        form.name,
        description: form.description,
        startDate:   form.startDate || null,  // YYYY-MM-DD or null
        endDate:     form.endDate   || null,
      })
      toast.success('Project created! 🎉')
      setShowModal(false)
      setForm({ name: '', description: '', startDate: '', endDate: '' })
      setPage(0)           // go back to first page
      fetchProjects()
    } catch (err) {
      toast.error('Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  // ── Delete project ────────────────────────────────────────────
  const handleDelete = async (projectId, projectName, e) => {
    e.stopPropagation() // don't navigate to project detail

    if (!confirm(`Delete "${projectName}"? This will delete all tasks too.`)) return

    try {
      await deleteProject(projectId)
      toast.success('Project deleted')
      fetchProjects()
    } catch (err) {
      toast.error('Failed to delete project')
    }
  }

  // ── Styles ────────────────────────────────────────────────────
  const cardStyle = {
    background: 'var(--surface,#12141a)',
    border: '1px solid #252836',
    borderRadius: 16,
    padding: '1.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    position: 'relative',
    overflow: 'hidden',
  }

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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg,#0a0b0e)' }}>
      <Navbar />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem' }}>

        {/* ── Greeting ── */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(108,99,255,0.12), rgba(0,212,170,0.06))',
          border: '1px solid rgba(108,99,255,0.2)',
          borderRadius: 18, padding: '1.4rem 1.75rem',
          marginBottom: '2rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem',
        }}>
          <div>
            <h2 style={{ color: '#e8eaf0', fontWeight: 800, fontSize: '1.5rem', margin: 0 }}>
              {greeting}, <span style={{ background: 'linear-gradient(135deg,#6c63ff,#00d4aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{username}</span> 👋
            </h2>
            <p style={{ color: '#7a7f95', fontSize: '0.82rem', marginTop: '0.3rem', margin: '0.3rem 0 0' }}>
              {dayName} · {dateStr}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <div style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 12, padding: '0.6rem 1rem', textAlign: 'center', minWidth: 70 }}>
              <p style={{ color: '#00d4aa', fontWeight: 800, fontSize: '1.2rem', margin: 0 }}>{projects.length}</p>
              <p style={{ color: '#5a6080', fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Projects</p>
            </div>
            <div style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 12, padding: '0.6rem 1rem', textAlign: 'center', minWidth: 70 }}>
              <p style={{ color: '#a09bff', fontWeight: 800, fontSize: '1.2rem', margin: 0 }}>{myTasks.length}</p>
              <p style={{ color: '#5a6080', fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>My Tasks</p>
            </div>
          </div>
        </div>

        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ color: '#e8eaf0', fontSize: '1.75rem', fontWeight: 800 }}>My Projects</h1>
            <p style={{ color: '#7a7f95', marginTop: '0.25rem', fontSize: '0.875rem' }}>
              {projects.length} project{projects.length !== 1 ? 's' : ''} on this page
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            style={{
              background: 'linear-gradient(135deg, #6c63ff, #5a52d5)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              padding: '0.75rem 1.5rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            + New Project
          </button>
        </div>

        {/* Search bar — Feature 6 (FIX: server-side search across all projects) */}
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <input
            value={projectSearch}
            onChange={e => setProjectSearch(e.target.value)}
            placeholder="🔍  Search all projects by name..."
            style={{
              flex: 1, background: 'var(--surface,#12141a)', border: '1px solid #252836',
              borderRadius: 10, padding: '0.6rem 1rem', color: '#e8eaf0',
              fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem', outline: 'none',
            }}
          />
          {projectSearch && (
            <button
              onClick={() => { setProjectSearch(''); setSearchResults(null) }}
              style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.25)', borderRadius: 10, padding: '0.6rem 0.9rem', color: '#ff9b9b', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'Outfit, sans-serif' }}
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* Search mode indicator */}
        {projectSearch && (
          <p style={{ color: '#7a7f95', fontSize: '0.78rem', marginBottom: '0.75rem', fontStyle: 'italic' }}>
            {searchLoading
              ? '🔍 Searching across all your projects...'
              : searchResults !== null
                ? `Found ${searchResults.length} project${searchResults.length !== 1 ? 's' : ''} matching "${projectSearch}"`
                : ''}
          </p>
        )}

        {/* Loading state */}
        {(loading || searchLoading) && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#7a7f95' }}>
            {searchLoading ? 'Searching projects...' : 'Loading projects...'}
          </div>
        )}

        {/* Empty state */}
        {!loading && !searchLoading && (() => {
          const displayList = searchResults !== null ? searchResults : projects
          if (displayList.length > 0) return null
          return (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--surface,#12141a)', border: '1px dashed #252836', borderRadius: 20 }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{searchResults !== null ? '🔍' : '📂'}</div>
              <h3 style={{ color: '#e8eaf0', fontWeight: 700, marginBottom: '0.5rem' }}>
                {searchResults !== null ? `No projects match "${projectSearch}"` : 'No projects yet'}
              </h3>
              <p style={{ color: '#7a7f95', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                {searchResults !== null ? 'Try a different search term' : 'Create your first project to get started'}
              </p>
              {searchResults === null && (
                <button onClick={() => setShowModal(true)} style={{ background: 'linear-gradient(135deg, #6c63ff, #5a52d5)', color: 'white', border: 'none', borderRadius: 10, padding: '0.75rem 1.5rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                  Create Project
                </button>
              )}
            </div>
          )
        })()}

        {/* Project cards grid — shows search results or normal paginated list */}
        {!loading && !searchLoading && (() => {
          const displayList = searchResults !== null ? searchResults : projects
          if (displayList.length === 0) return null
          return (
          <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {displayList.map(project => (
              <div
                key={project.id}
                className="animate-fade-in"
                style={cardStyle}
                onClick={() => navigate(`/projects/${project.id}`)}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#6c63ff'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#252836'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {/* Accent top bar */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0,
                  height: 3,
                  background: 'linear-gradient(90deg, #6c63ff, #00d4aa)',
                  borderRadius: '16px 16px 0 0',
                }} />

                {/* Project name */}
                <h3 style={{
                  color: '#e8eaf0',
                  fontWeight: 700,
                  fontSize: '1rem',
                  marginBottom: '0.5rem',
                  marginTop: '0.25rem',
                }}>
                  {project.name}
                </h3>

                {/* Description */}
                {project.description && (
                  <p style={{
                    color: '#7a7f95',
                    fontSize: '0.825rem',
                    marginBottom: '1rem',
                    lineHeight: 1.5,
                    // clamp to 2 lines
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {project.description}
                  </p>
                )}

                {/* Dates */}
                {(project.startDate || project.endDate) && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {project.startDate && (
                      <span style={{
                        background: 'rgba(108,99,255,0.1)',
                        border: '1px solid rgba(108,99,255,0.2)',
                        color: '#a09bff',
                        fontSize: '0.72rem',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 6,
                        fontFamily: 'JetBrains Mono, monospace',
                      }}>
                        📅 {project.startDate}
                      </span>
                    )}
                    {project.endDate && (
                      <span style={{
                        background: 'rgba(255,107,107,0.1)',
                        border: '1px solid rgba(255,107,107,0.2)',
                        color: '#ff9b9b',
                        fontSize: '0.72rem',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 6,
                        fontFamily: 'JetBrains Mono, monospace',
                      }}>
                        🏁 {project.endDate}
                      </span>
                    )}
                  </div>
                )}

                {/* Footer: actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <span style={{ color: '#7a7f95', fontSize: '0.72rem' }}>
                    Owner: {project.ownerUsername}
                  </span>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button onClick={e => { e.stopPropagation(); navigate(`/projects/${project.id}/kanban`) }}
                      style={{ background: 'rgba(255,209,102,0.1)', border: '1px solid rgba(255,209,102,0.2)', color: '#ffd166', fontSize: '0.7rem', padding: '0.28rem 0.55rem', borderRadius: 6, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
                      🗂 Kanban</button>
                    <button onClick={e => { e.stopPropagation(); navigate(`/projects/${project.id}/chat`) }}
                      style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)', color: '#a09bff', fontSize: '0.7rem', padding: '0.28rem 0.55rem', borderRadius: 6, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
                      💬 Chat</button>
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/projects/${project.id}/analytics`) }}
                      style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)', color: '#00d4aa', fontSize: '0.7rem', padding: '0.28rem 0.55rem', borderRadius: 6, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
                      📊 Analytics</button>
                    <button
                      onClick={e => { e.stopPropagation(); setEditingProject(project) }}
                      style={{ background: 'rgba(255,209,102,0.1)', border: '1px solid rgba(255,209,102,0.2)', color: '#ffd166', fontSize: '0.7rem', padding: '0.28rem 0.55rem', borderRadius: 6, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
                      ✏️ Edit</button>
                    <button
                      onClick={e => handleDelete(project.id, project.name, e)}
                      style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)', color: '#ff9b9b', fontSize: '0.7rem', padding: '0.28rem 0.55rem', borderRadius: 6, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
                      🗑 Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )
        })()}

        {/* Pagination — hidden when in search mode (search returns all matching results) */}
        {!projectSearch && totalPages > 1 && (
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '2rem' }}>
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 0}
              style={{
                background: page === 0 ? '#1a1d26' : '#252836',
                border: '1px solid #252836',
                color: page === 0 ? '#4a4f65' : '#e8eaf0',
                padding: '0.5rem 1rem',
                borderRadius: 8,
                cursor: page === 0 ? 'not-allowed' : 'pointer',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              ← Prev
            </button>

            {/* Page numbers */}
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                style={{
                  background: page === i ? '#6c63ff' : '#1a1d26',
                  border: `1px solid ${page === i ? '#6c63ff' : '#252836'}`,
                  color: 'white',
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: page === i ? 700 : 400,
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages - 1}
              style={{
                background: page === totalPages - 1 ? '#1a1d26' : '#252836',
                border: '1px solid #252836',
                color: page === totalPages - 1 ? '#4a4f65' : '#e8eaf0',
                padding: '0.5rem 1rem',
                borderRadius: 8,
                cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              Next →
            </button>
          </div>
        )}

        {/* ── MY ASSIGNED TASKS SECTION ─────────────────────────── */}
        <div style={{ marginTop: '3rem' }}>

          {/* Section header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '1.25rem',
          }}>
            <div>
              <h2 style={{ color: '#e8eaf0', fontSize: '1.25rem', fontWeight: 800 }}>
                📌 My Assigned Tasks
              </h2>
              <p style={{ color: '#7a7f95', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                Tasks assigned to you across all projects
              </p>
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {['ALL', 'TODO', 'IN_PROGRESS', 'DONE'].map(f => (
                <button
                  key={f}
                  onClick={() => setMyTasksFilter(f)}
                  style={{
                    background: myTasksFilter === f
                      ? filterAccent(f).bg : 'transparent',
                    border: `1px solid ${myTasksFilter === f ? filterAccent(f).border : '#252836'}`,
                    color: myTasksFilter === f ? filterAccent(f).text : '#7a7f95',
                    padding: '0.3rem 0.75rem',
                    borderRadius: 8, cursor: 'pointer',
                    fontSize: '0.72rem', fontWeight: 600,
                    fontFamily: 'Outfit, sans-serif',
                    transition: 'all 0.15s',
                  }}
                >
                  {f === 'ALL' ? `All (${myTasks.length})`
                    : f === 'IN_PROGRESS' ? `In Progress (${myTasks.filter(t => t.status === f).length})`
                    : `${f.charAt(0) + f.slice(1).toLowerCase()} (${myTasks.filter(t => t.status === f).length})`}
                </button>
              ))}
            </div>
          </div>

          {/* Loading */}
          {myTasksLoading && (
            <div style={{ color: '#7a7f95', textAlign: 'center', padding: '2rem', fontSize: '0.875rem' }}>
              Loading your tasks...
            </div>
          )}

          {/* Empty state */}
          {!myTasksLoading && myTasks.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '3rem',
              background: 'var(--surface,#12141a)', border: '1px dashed #252836',
              borderRadius: 16,
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🎉</div>
              <p style={{ color: '#7a7f95', fontSize: '0.875rem' }}>
                No tasks assigned to you yet
              </p>
            </div>
          )}

          {/* Task cards */}
          {!myTasksLoading && myTasks.length > 0 && (() => {
            const filtered = myTasksFilter === 'ALL'
              ? myTasks
              : myTasks.filter(t => t.status === myTasksFilter)

            if (filtered.length === 0) return (
              <div style={{
                textAlign: 'center', padding: '2rem',
                background: 'var(--surface,#12141a)', border: '1px dashed #252836', borderRadius: 16,
              }}>
                <p style={{ color: '#7a7f95', fontSize: '0.875rem' }}>
                  No {myTasksFilter.replace('_',' ').toLowerCase()} tasks
                </p>
              </div>
            )

            return (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1rem',
              }}>
                {filtered.map(task => (
                  <MyTaskCard
                    key={task.taskId}
                    task={task}
                    onGoToProject={() => navigate(`/projects/${task.projectId}`)}
                  />
                ))}
              </div>
            )
          })()}
        </div>

      </main>

      {/* ── EDIT PROJECT MODAL (Feature 2) ──────────────────────── */}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSaved={(updated) => {
            setProjects(prev => prev.map(p => p.id === updated.id ? updated : p))
            setEditingProject(null)
            toast.success('Project updated!')
          }}
        />
      )}

      {/* ── CREATE PROJECT MODAL ───────────────────────────────── */}
      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '1rem',
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div
            className="animate-fade-in"
            style={{
              background: 'var(--surface,#12141a)',
              border: '1px solid #252836',
              borderRadius: 20,
              padding: '2rem',
              width: '100%',
              maxWidth: 480,
            }}
          >
            <h2 style={{ color: '#e8eaf0', fontWeight: 700, fontSize: '1.25rem', marginBottom: '1.5rem' }}>
              Create New Project
            </h2>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <div>
                <label style={{ color: '#7a7f95', fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  PROJECT NAME *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Website Redesign"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#6c63ff'}
                  onBlur={e => e.target.style.borderColor = '#252836'}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ color: '#7a7f95', fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  DESCRIPTION
                </label>
                <textarea
                  placeholder="What is this project about?"
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = '#6c63ff'}
                  onBlur={e => e.target.style.borderColor = '#252836'}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ color: '#7a7f95', fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                    START DATE
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label style={{ color: '#7a7f95', fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                    END DATE
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: '1px solid #252836',
                    color: '#7a7f95',
                    borderRadius: 10,
                    padding: '0.8rem',
                    cursor: 'pointer',
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '0.875rem',
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
                    color: 'white',
                    border: 'none',
                    borderRadius: 10,
                    padding: '0.8rem',
                    fontWeight: 600,
                    cursor: creating ? 'not-allowed' : 'pointer',
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '0.875rem',
                  }}
                >
                  {creating ? 'Creating...' : 'Create Project →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// MyTaskCard — shown in the "My Assigned Tasks" section
// ─────────────────────────────────────────────────────────────────
function MyTaskCard({ task, onGoToProject }) {
  const STATUS_STYLE = {
    TODO:        { bg: 'rgba(122,127,149,0.12)', border: 'rgba(122,127,149,0.3)', text: '#7a7f95', label: '📋 To Do' },
    IN_PROGRESS: { bg: 'rgba(255,209,102,0.12)', border: 'rgba(255,209,102,0.35)', text: '#ffd166', label: '⚡ In Progress' },
    DONE:        { bg: 'rgba(0,212,170,0.12)',   border: 'rgba(0,212,170,0.3)',   text: '#00d4aa', label: '✅ Done' },
  }
  const ss = STATUS_STYLE[task.status] || STATUS_STYLE.TODO

  return (
    <div
      onClick={onGoToProject}
      style={{
        background: 'var(--surface,#12141a)',
        border: '1px solid #252836',
        borderRadius: 14,
        padding: '1.1rem',
        cursor: 'pointer',
        transition: 'border-color 0.18s, transform 0.18s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(108,99,255,0.45)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#252836'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Status colour bar at top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: ss.text,
        opacity: 0.6,
      }} />

      {/* Project tag */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
        background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)',
        borderRadius: 6, padding: '0.15rem 0.55rem', marginBottom: '0.6rem',
      }}>
        <span style={{ color: '#a09bff', fontSize: '0.65rem', fontWeight: 600 }}>
          📂 {task.projectName}
        </span>
      </div>

      {/* Task title */}
      <h4 style={{
        color: '#e8eaf0', fontSize: '0.9rem', fontWeight: 700,
        lineHeight: 1.4, marginBottom: '0.5rem',
      }}>
        {task.title}
      </h4>

      {/* Description preview */}
      {task.description && (
        <p style={{
          color: '#7a7f95', fontSize: '0.78rem', lineHeight: 1.6,
          marginBottom: '0.65rem',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {task.description}
        </p>
      )}

      {/* Bottom row: status + dates + owner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {/* Status badge */}
        <span style={{
          background: ss.bg, border: `1px solid ${ss.border}`,
          color: ss.text, fontSize: '0.68rem', fontWeight: 700,
          padding: '0.2rem 0.55rem', borderRadius: 20,
        }}>
          {ss.label}
        </span>

        {/* Dates */}
        {(task.startDate || task.endDate) && (
          <span style={{
            color: '#4a4f65', fontSize: '0.65rem',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {task.startDate} → {task.endDate}
          </span>
        )}

        {/* Assigned by (project owner) */}
        <span style={{
          marginLeft: 'auto',
          color: '#4a4f65', fontSize: '0.65rem',
        }}>
          by {task.projectOwner}
        </span>
      </div>

      {/* Click hint */}
      <p style={{ color: '#4a4f65', fontSize: '0.65rem', marginTop: '0.6rem' }}>
        Click to open project →
      </p>
    </div>
  )
}

// Filter tab accent colours
function filterAccent(filter) {
  const map = {
    ALL:         { bg: 'rgba(108,99,255,0.12)', border: 'rgba(108,99,255,0.35)', text: '#a09bff' },
    TODO:        { bg: 'rgba(122,127,149,0.12)', border: 'rgba(122,127,149,0.3)', text: '#7a7f95' },
    IN_PROGRESS: { bg: 'rgba(255,209,102,0.12)', border: 'rgba(255,209,102,0.3)', text: '#ffd166' },
    DONE:        { bg: 'rgba(0,212,170,0.1)',    border: 'rgba(0,212,170,0.3)',   text: '#00d4aa' },
  }
  return map[filter] || map.ALL
}

// ─────────────────────────────────────────────────────────────────
// EditProjectModal — Feature 2
// ─────────────────────────────────────────────────────────────────
function EditProjectModal({ project, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:        project.name        || '',
    description: project.description || '',
    startDate:   project.startDate   || '',
    endDate:     project.endDate     || '',
  })
  const [saving, setSaving] = useState(false)

  const inp = {
    width: '100%', background: '#1a1d26', border: '1px solid #252836',
    borderRadius: 10, padding: '0.65rem 0.9rem', color: '#e8eaf0',
    fontFamily: 'Outfit, sans-serif', fontSize: '0.875rem', outline: 'none',
    marginBottom: '0.9rem',
  }

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Project name is required')
    setSaving(true)
    try {
      const res = await editProject(project.id, {
        name:        form.name,
        description: form.description,
        startDate:   form.startDate || null,
        endDate:     form.endDate   || null,
      })
      onSaved(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save project')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, padding: '1rem',
    }}>
      <div style={{ background: 'var(--surface,#12141a)', border: '1px solid rgba(255,209,102,0.3)', borderRadius: 20, width: '100%', maxWidth: 460 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #252836', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: '#e8eaf0', fontWeight: 800 }}>✏️ Edit Project</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#5a6080', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
        </div>
        <div style={{ padding: '1.25rem 1.5rem' }}>
          <label style={{ color: '#7a7f95', fontSize: '.75rem', fontWeight: 600, display: 'block', marginBottom: '.35rem' }}>Project Name *</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inp} placeholder="Project name" />
          <label style={{ color: '#7a7f95', fontSize: '.75rem', fontWeight: 600, display: 'block', marginBottom: '.35rem' }}>Description</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            style={{ ...inp, resize: 'vertical', minHeight: 72 }} placeholder="Description (optional)" />
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
        </div>
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #252836', display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: '#1a1d26', border: '1px solid #252836', color: '#7a7f95', padding: '0.6rem 1.1rem', borderRadius: 9, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ background: 'linear-gradient(135deg,#ffd166,#ffb703)', border: 'none', color: '#0a0b0e', fontWeight: 700, padding: '0.6rem 1.3rem', borderRadius: 9, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}