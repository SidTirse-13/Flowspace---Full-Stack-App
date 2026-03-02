// FILE: src/pages/ProjectChatPage.jsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/shared/Navbar'
import { useAuth } from '../context/AuthContext'
import { getChatMessages, sendChatMessage, deleteChatMessage, getAnnouncements, createAnnouncement, deleteAnnouncement, togglePin } from '../api/socialApi'
import api from '../api/axiosInstance'

const timeAgo = (d) => {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(d).toLocaleDateString()
}

const getInitials = (n) => n ? n.split(/[_\s-]/).map(w => w[0]?.toUpperCase()).slice(0,2).join('') : '?'
const COLORS = ['#6c63ff','#00d4aa','#ffd166','#ff9b9b','#00b4d8','#a09bff']
const avatarColor = (n) => COLORS[(n?.charCodeAt(0) || 0) % COLORS.length]

// Highlight @mentions in a message
const renderMessage = (text) => {
  if (!text) return text
  const parts = text.split(/(@\w+)/g)
  return parts.map((part, i) =>
    part.startsWith('@')
      ? <span key={i} style={{ background: 'rgba(108,99,255,0.2)', color: '#a09bff', borderRadius: 4, padding: '0 3px', fontWeight: 600 }}>{part}</span>
      : part
  )
}

export default function ProjectChatPage() {
  const { projectId } = useParams()
  const { username }  = useAuth()
  const navigate      = useNavigate()

  const [messages,    setMessages]    = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [members,     setMembers]     = useState([])
  const [input,       setInput]       = useState('')
  const [sending,     setSending]     = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [showAnnForm, setShowAnnForm] = useState(false)
  const [annContent,  setAnnContent]  = useState('')
  const [mentionQuery,setMentionQuery]= useState('')
  const [mentionOpen, setMentionOpen] = useState(false)
  const [projectName, setProjectName] = useState(`Project #${projectId}`)

  const bottomRef   = useRef(null)
  const inputRef    = useRef(null)
  const pollRef     = useRef(null)

  useEffect(() => {
    loadAll()
    pollRef.current = setInterval(loadMessages, 5000)
    return () => clearInterval(pollRef.current)
  }, [projectId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadAll = async () => {
    setLoading(true)
    await Promise.all([loadMessages(), loadAnnouncements(), loadMembers()])
    setLoading(false)
  }

  const loadMessages = async () => {
    try {
      const r = await getChatMessages(projectId)
      setMessages(r.data || [])
    } catch {}
  }

  const loadAnnouncements = async () => {
    try {
      const r = await getAnnouncements(projectId)
      setAnnouncements(r.data || [])
    } catch {}
  }

  const loadMembers = async () => {
    try {
      const r = await api.get(`/api/projects/${projectId}/members`)
      setMembers(r.data || [])
      // Also get project name
      const pr = await api.get(`/api/projects/${projectId}`)
      if (pr.data?.name) setProjectName(pr.data.name)
    } catch {}
  }

  const handleSend = async () => {
    if (!input.trim()) return
    setSending(true)
    try {
      await sendChatMessage(projectId, input.trim())
      setInput('')
      setMentionOpen(false)
      await loadMessages()
    } catch { toast.error('Failed to send message') }
    finally { setSending(false) }
  }

  const handleDelete = async (msgId) => {
    try {
      await deleteChatMessage(projectId, msgId)
      setMessages(prev => prev.filter(m => m.id !== msgId))
    } catch { toast.error('Cannot delete this message') }
  }

  const handleCreateAnnouncement = async () => {
    if (!annContent.trim()) return
    try {
      await createAnnouncement(projectId, annContent.trim())
      setAnnContent('')
      setShowAnnForm(false)
      toast.success('Announcement posted!')
      loadAnnouncements()
    } catch { toast.error('Failed to post announcement') }
  }

  const handleDeleteAnn = async (annId) => {
    try {
      await deleteAnnouncement(projectId, annId)
      setAnnouncements(prev => prev.filter(a => a.id !== annId))
    } catch { toast.error('Cannot delete announcement') }
  }

  const handleTogglePin = async (annId) => {
    try {
      await togglePin(projectId, annId)
      loadAnnouncements()
    } catch {}
  }

  // ── @mention autocomplete ──────────────────────────────────
  const handleInputChange = (e) => {
    const val = e.target.value
    setInput(val)
    const atIdx = val.lastIndexOf('@')
    if (atIdx !== -1) {
      const query = val.slice(atIdx + 1)
      if (!query.includes(' ')) {
        setMentionQuery(query)
        setMentionOpen(true)
        return
      }
    }
    setMentionOpen(false)
  }

  const insertMention = (memberUsername) => {
    const atIdx = input.lastIndexOf('@')
    const newInput = input.slice(0, atIdx) + `@${memberUsername} `
    setInput(newInput)
    setMentionOpen(false)
    inputRef.current?.focus()
  }

  const filteredMembers = members.filter(m =>
    m.username?.toLowerCase().includes(mentionQuery.toLowerCase()) && m.username !== username
  )

  const pinnedAnnouncements = announcements.filter(a => a.pinned)

  return (
    <div style={{ minHeight: '100vh', background: '#0a0b0e', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', maxWidth: 1100, width: '100%', margin: '0 auto', padding: '1.5rem 2rem', gap: '1.25rem', boxSizing: 'border-box' }}>

        {/* ── Left: Chat ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button onClick={() => navigate(`/projects/${projectId}`)}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #252836', color: '#7a7f95', padding: '0.35rem 0.7rem', borderRadius: 8, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.78rem' }}>
                ← Back
              </button>
              <div>
                <h1 style={{ color: '#e8eaf0', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>💬 {projectName}</h1>
                <p style={{ color: '#5a6080', fontSize: '0.72rem', margin: 0 }}>{messages.length} messages · {members.length} members</p>
              </div>
            </div>
          </div>

          {/* Pinned announcements */}
          {pinnedAnnouncements.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              {pinnedAnnouncements.map(ann => (
                <div key={ann.id} style={{ background: 'rgba(255,209,102,0.07)', border: '1px solid rgba(255,209,102,0.2)', borderRadius: 10, padding: '0.65rem 0.9rem', marginBottom: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div>
                    <span style={{ color: '#ffd166', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>📌 Pinned</span>
                    <p style={{ color: '#e8eaf0', fontSize: '0.82rem', margin: '0.2rem 0 0', lineHeight: 1.5 }}>{ann.content}</p>
                    <p style={{ color: '#5a6080', fontSize: '0.65rem', margin: '0.2rem 0 0' }}>by {ann.authorUsername}</p>
                  </div>
                  <button onClick={() => handleDeleteAnn(ann.id)} style={{ background: 'none', border: 'none', color: '#3a3f52', cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0 }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Messages list */}
          <div style={{ flex: 1, overflowY: 'auto', background: '#0e1018', border: '1px solid #1a1d26', borderRadius: 14, padding: '1rem', marginBottom: '0.75rem', minHeight: 400, maxHeight: 'calc(100vh - 340px)' }}>
            {loading ? (
              <p style={{ color: '#5a6080', textAlign: 'center', padding: '2rem', fontSize: '0.82rem' }}>Loading messages...</p>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#3a3f52' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💬</div>
                <p style={{ fontSize: '0.82rem' }}>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMine = msg.senderUsername === username
                const showAvatar = i === 0 || messages[i-1]?.senderUsername !== msg.senderUsername

                return (
                  <div key={msg.id} style={{ display: 'flex', gap: '0.65rem', marginBottom: showAvatar ? '0.85rem' : '0.2rem', alignItems: 'flex-start', flexDirection: isMine ? 'row-reverse' : 'row' }}>
                    {/* Avatar */}
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: avatarColor(msg.senderUsername), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800, color: 'white', flexShrink: 0, visibility: showAvatar ? 'visible' : 'hidden' }}>
                      {getInitials(msg.senderUsername)}
                    </div>

                    <div style={{ maxWidth: '70%' }}>
                      {showAvatar && (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.2rem', flexDirection: isMine ? 'row-reverse' : 'row' }}>
                          <span style={{ color: isMine ? '#a09bff' : '#e8eaf0', fontSize: '0.75rem', fontWeight: 700 }}>{msg.senderUsername}</span>
                          <span style={{ color: '#3a3f52', fontSize: '0.62rem' }}>{timeAgo(msg.sentAt)}</span>
                        </div>
                      )}
                      <div
                        style={{
                          background: isMine ? 'rgba(108,99,255,0.18)' : '#12141a',
                          border: `1px solid ${isMine ? 'rgba(108,99,255,0.25)' : '#1e2030'}`,
                          borderRadius: isMine ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                          padding: '0.55rem 0.85rem',
                          color: '#e8eaf0', fontSize: '0.85rem', lineHeight: 1.5,
                          position: 'relative',
                        }}
                        onMouseEnter={e => e.currentTarget.querySelector('.del-btn')?.style && (e.currentTarget.querySelector('.del-btn').style.opacity = '1')}
                        onMouseLeave={e => e.currentTarget.querySelector('.del-btn')?.style && (e.currentTarget.querySelector('.del-btn').style.opacity = '0')}
                      >
                        {renderMessage(msg.message)}
                        {isMine && (
                          <button className="del-btn" onClick={() => handleDelete(msg.id)}
                            style={{ position: 'absolute', top: -8, right: -8, background: '#ff6b6b', border: 'none', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: '0.55rem', cursor: 'pointer', opacity: 0, transition: 'opacity 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div style={{ position: 'relative' }}>
            {/* @mention dropdown */}
            {mentionOpen && filteredMembers.length > 0 && (
              <div style={{ position: 'absolute', bottom: '100%', left: 0, background: '#12141a', border: '1px solid #252836', borderRadius: 10, overflow: 'hidden', zIndex: 50, minWidth: 180, marginBottom: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                {filteredMembers.map(m => (
                  <div key={m.username} onClick={() => insertMention(m.username)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.85rem', cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(108,99,255,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: avatarColor(m.username), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 800, color: 'white' }}>
                      {getInitials(m.username)}
                    </div>
                    <span style={{ color: '#e8eaf0', fontSize: '0.8rem' }}>@{m.username}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <input
                ref={inputRef}
                type="text" placeholder={`Message ${projectName}... (type @ to mention)`}
                value={input} onChange={handleInputChange}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey && !mentionOpen) { e.preventDefault(); handleSend() }
                  if (e.key === 'Escape') setMentionOpen(false)
                }}
                style={{ flex: 1, background: '#12141a', border: '1px solid #252836', borderRadius: 10, padding: '0.75rem 1rem', color: '#e8eaf0', fontSize: '0.875rem', fontFamily: 'Outfit, sans-serif', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#6c63ff'}
                onBlur={e => e.target.style.borderColor = '#252836'}
              />
              <button onClick={handleSend} disabled={sending || !input.trim()} style={{
                background: sending || !input.trim() ? '#1a1d26' : 'linear-gradient(135deg, #6c63ff, #5a52d5)',
                color: sending || !input.trim() ? '#5a6080' : 'white',
                border: 'none', borderRadius: 10, padding: '0.75rem 1.25rem',
                cursor: sending || !input.trim() ? 'not-allowed' : 'pointer',
                fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap',
              }}>
                {sending ? '...' : 'Send →'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: Announcements panel ── */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <div style={{ background: '#0e1018', border: '1px solid #1a1d26', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', borderBottom: '1px solid #1a1d26', background: 'rgba(108,99,255,0.05)' }}>
              <span style={{ color: '#e8eaf0', fontWeight: 700, fontSize: '0.82rem' }}>📢 Announcements</span>
              <button onClick={() => setShowAnnForm(f => !f)} style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.25)', color: '#a09bff', padding: '0.2rem 0.6rem', borderRadius: 6, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.7rem', fontWeight: 600 }}>
                + New
              </button>
            </div>

            {showAnnForm && (
              <div style={{ padding: '0.85rem', borderBottom: '1px solid #1a1d26' }}>
                <textarea
                  placeholder="Write announcement..."
                  value={annContent} onChange={e => setAnnContent(e.target.value)}
                  rows={3}
                  style={{ width: '100%', background: '#1a1d26', border: '1px solid #252836', borderRadius: 8, padding: '0.6rem', color: '#e8eaf0', fontSize: '0.78rem', fontFamily: 'Outfit, sans-serif', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                  <button onClick={handleCreateAnnouncement} style={{ flex: 1, background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)', color: '#a09bff', padding: '0.4rem', borderRadius: 6, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.72rem', fontWeight: 700 }}>Post</button>
                  <button onClick={() => { setShowAnnForm(false); setAnnContent('') }} style={{ background: 'transparent', border: '1px solid #252836', color: '#5a6080', padding: '0.4rem 0.6rem', borderRadius: 6, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.72rem' }}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {announcements.length === 0 ? (
                <p style={{ color: '#3a3f52', fontSize: '0.75rem', textAlign: 'center', padding: '1.5rem' }}>No announcements yet</p>
              ) : (
                announcements.map(ann => (
                  <div key={ann.id} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #0e1018' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <p style={{ color: '#e8eaf0', fontSize: '0.78rem', margin: 0, lineHeight: 1.5, flex: 1 }}>{ann.content}</p>
                      <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0, marginLeft: '0.5rem' }}>
                        <button onClick={() => handleTogglePin(ann.id)} title={ann.pinned ? 'Unpin' : 'Pin'}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', opacity: ann.pinned ? 1 : 0.4 }}>📌</button>
                        <button onClick={() => handleDeleteAnn(ann.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff9b9b', fontSize: '0.7rem' }}>✕</button>
                      </div>
                    </div>
                    <p style={{ color: '#3a3f52', fontSize: '0.62rem', margin: '0.3rem 0 0' }}>
                      {ann.authorUsername} · {timeAgo(ann.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Members list */}
          <div style={{ background: '#0e1018', border: '1px solid #1a1d26', borderRadius: 14, overflow: 'hidden', marginTop: '1rem' }}>
            <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #1a1d26', background: 'rgba(0,212,170,0.04)' }}>
              <span style={{ color: '#e8eaf0', fontWeight: 700, fontSize: '0.82rem' }}>👥 Members ({members.length})</span>
            </div>
            <div style={{ padding: '0.5rem 0' }}>
              {members.slice(0, 8).map(m => (
                <div key={m.username} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.4rem 1rem' }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: avatarColor(m.username), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 800, color: 'white', flexShrink: 0 }}>
                    {getInitials(m.username)}
                  </div>
                  <span style={{ color: '#c0c5dc', fontSize: '0.78rem' }}>{m.username}</span>
                  {m.username === m.ownerUsername && <span style={{ color: '#ffd166', fontSize: '0.58rem', fontWeight: 700 }}>owner</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
