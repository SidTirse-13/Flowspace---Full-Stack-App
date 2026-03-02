// FILE: src/pages/DirectMessagesPage.jsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/shared/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axiosInstance'

const timeAgo = (d) => {
  if (!d) return ''
  const m = Math.floor((Date.now() - new Date(d)) / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(d).toLocaleDateString()
}

const initials = (n) => {
  if (!n || n === '?') return '?'
  return n.split(/[_\s-]/).filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join('')
}

const COLORS = ['#6c63ff','#00d4aa','#ffd166','#ff9b9b','#00b4d8','#a09bff','#f72585','#4cc9f0']
const avatarColor = (n) => COLORS[(n?.charCodeAt(0) || 0) % COLORS.length]

// Resolve the "other" participant from any backend response shape
const getOtherUser = (item, me) => {
  const candidates = [
    item.otherUsername, item.withUsername, item.participant,
    item.senderUsername, item.recipientUsername, item.username,
    item.with, item.sender, item.recipient,
  ]
  for (const c of candidates) {
    if (c && c !== me && c !== '?') return c
  }
  return null
}

const getLastMsg  = (item) => item.lastMessage || item.content || item.message || item.lastContent || ''
const getLastTime = (item) => item.lastMessageTime || item.sentAt || item.createdAt || item.timestamp || null

export default function DirectMessagesPage() {
  const { username: paramUser }  = useParams()
  const { username }             = useAuth()
  const navigate                 = useNavigate()

  const [inbox,        setInbox]        = useState([])
  const [conversation, setConversation] = useState([])
  const [activeUser,   setActiveUser]   = useState(paramUser || null)
  const [input,        setInput]        = useState('')
  const [sending,      setSending]      = useState(false)
  const [loading,      setLoading]      = useState(true)
  const [newUser,      setNewUser]      = useState('')
  const [showNewDM,    setShowNewDM]    = useState(false)
  const [apiError,     setApiError]     = useState(null)

  const bottomRef = useRef(null)
  const pollRef   = useRef(null)

  useEffect(() => {
    loadInbox()
    if (paramUser) setActiveUser(paramUser)
  }, [])

  useEffect(() => {
    if (activeUser) {
      loadConversation(activeUser)
      clearInterval(pollRef.current)
      pollRef.current = setInterval(() => loadConversation(activeUser), 4000)
    }
    return () => clearInterval(pollRef.current)
  }, [activeUser])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])

  const loadInbox = async () => {
    setLoading(true)
    setApiError(null)
    try {
      const r = await api.get('/api/messages/inbox')
      const raw = r.data || []
      const data = Array.isArray(raw) ? raw : (raw.content || raw.messages || [])
      setInbox(data)
    } catch (err) {
      if (err.response?.status === 404) {
        setApiError('Messages endpoint not available. Ask your admin to deploy the messaging feature.')
      } else if (err.response?.status === 403) {
        setApiError('Access denied to messages.')
      } else {
        setInbox([])
      }
    } finally { setLoading(false) }
  }

  const loadConversation = async (user) => {
    try {
      const r = await api.get(`/api/messages/with/${user}`)
      const raw = r.data || []
      setConversation(Array.isArray(raw) ? raw : (raw.content || raw.messages || []))
    } catch {}
  }

  const handleSend = async () => {
    if (!input.trim() || !activeUser) return
    setSending(true)
    try {
      await api.post(`/api/messages/send/${activeUser}`, { message: input.trim() })
      setInput('')
      await loadConversation(activeUser)
      loadInbox()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message')
    } finally { setSending(false) }
  }

  const openConv = (user) => {
    if (!user) return
    setActiveUser(user)
    navigate(`/messages/${user}`, { replace: true })
  }

  const handleNewDM = () => {
    const u = newUser.trim()
    if (!u) return
    setShowNewDM(false)
    openConv(u)
    setNewUser('')
  }

  // Theme-aware (CSS vars set by ThemeContext)
  const BG  = 'var(--bg,#0a0b0e)'
  const SRF = 'var(--surface,#12141a)'
  const BRD = 'var(--border,#252836)'
  const TXT = 'var(--text,#e8eaf0)'
  const MUT = 'var(--muted,#7a7f95)'
  const DIM = 'var(--dim,#5a6080)'

  return (
    <div style={{ minHeight: '100vh', background: BG }}>
      <Navbar />

      <div style={{ display: 'flex', height: 'calc(100vh - 64px)', maxWidth: 1050, margin: '0 auto' }}>

        {/* ── Sidebar ── */}
        <div style={{ width: 285, flexShrink: 0, borderRight: `1px solid ${BRD}`, display: 'flex', flexDirection: 'column', background: BG }}>

          {/* Header */}
          <div style={{ padding: '1.2rem 1rem 0.9rem', borderBottom: `1px solid ${BRD}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ color: TXT, fontWeight: 800, fontSize: '0.95rem', margin: 0, fontFamily: 'Outfit, sans-serif' }}>💬 Messages</h2>
                <p style={{ color: DIM, fontSize: '0.68rem', margin: '0.1rem 0 0', fontFamily: 'Outfit, sans-serif' }}>Direct Messages</p>
              </div>
              <button
                onClick={() => setShowNewDM(s => !s)}
                style={{ background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.3)', color: '#a09bff', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
              >+</button>
            </div>

            {showNewDM && (
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem' }}>
                <input
                  type="text" placeholder="Enter username..."
                  value={newUser} onChange={e => setNewUser(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleNewDM(); if (e.key === 'Escape') setShowNewDM(false) }}
                  autoFocus
                  style={{ flex: 1, background: SRF, border: '1px solid rgba(108,99,255,0.4)', borderRadius: 8, padding: '0.42rem 0.65rem', color: TXT, fontSize: '0.78rem', fontFamily: 'Outfit, sans-serif', outline: 'none' }}
                />
                <button onClick={handleNewDM} style={{ background: 'rgba(108,99,255,0.2)', border: '1px solid rgba(108,99,255,0.35)', color: '#a09bff', padding: '0.42rem 0.7rem', borderRadius: 8, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.75rem', fontWeight: 700 }}>Go</button>
              </div>
            )}
          </div>

          {/* Conversation list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <p style={{ color: DIM, fontSize: '0.75rem', textAlign: 'center', padding: '2rem 1rem', fontFamily: 'Outfit, sans-serif' }}>Loading...</p>
            ) : apiError ? (
              <div style={{ padding: '1.5rem 1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚠️</div>
                <p style={{ color: '#ff9b9b', fontSize: '0.72rem', lineHeight: 1.5, margin: 0, fontFamily: 'Outfit, sans-serif' }}>{apiError}</p>
              </div>
            ) : inbox.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: DIM }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.6rem' }}>✉️</div>
                <p style={{ fontSize: '0.75rem', margin: 0, lineHeight: 1.6, fontFamily: 'Outfit, sans-serif' }}>No conversations yet.<br />Click <strong style={{ color: '#a09bff' }}>+</strong> to start one.</p>
              </div>
            ) : inbox.map((item, idx) => {
              // All variable definitions before any JSX
              const other       = getOtherUser(item, username)
              const displayName = other || (item.id ? `User #${item.id}` : `Chat ${idx + 1}`)
              const canOpen     = !!other
              const lastMessage = getLastMsg(item)
              const lastTime    = getLastTime(item)
              const unreadCount = item.unreadCount || 0
              const isActive    = activeUser === other

              return (
                <div
                  key={displayName + idx}
                  onClick={() => canOpen && openConv(other)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.7rem',
                    padding: '0.7rem 1rem',
                    cursor: canOpen ? 'pointer' : 'default',
                    background: isActive ? 'rgba(108,99,255,0.1)' : 'transparent',
                    borderLeft: `2px solid ${isActive ? '#6c63ff' : 'transparent'}`,
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => { if (!isActive && canOpen) e.currentTarget.style.background = 'rgba(108,99,255,0.05)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  {/* Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: avatarColor(displayName), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 800, color: '#fff' }}>
                      {initials(displayName)}
                    </div>
                    {unreadCount > 0 && (
                      <div style={{ position: 'absolute', top: -2, right: -2, background: '#ff6b6b', color: '#fff', fontSize: '0.5rem', fontWeight: 800, borderRadius: '50%', width: 15, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0a0b0e' }}>
                        {unreadCount}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: isActive ? '#e8eaf0' : '#c0c5dc', fontWeight: unreadCount > 0 ? 700 : 500, fontSize: '0.82rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Outfit, sans-serif' }}>
                      {displayName}
                    </p>
                    {lastMessage && (
                      <p style={{ color: DIM, fontSize: '0.68rem', margin: '0.1rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Outfit, sans-serif' }}>
                        {lastMessage.length > 30 ? lastMessage.slice(0, 30) + '...' : lastMessage}
                      </p>
                    )}
                  </div>

                  {lastTime && <span style={{ color: DIM, fontSize: '0.6rem', flexShrink: 0, fontFamily: 'Outfit, sans-serif' }}>{timeAgo(lastTime)}</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Conversation pane ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: BG }}>
          {!activeUser ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: DIM }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>💬</div>
              <p style={{ fontSize: '0.9rem', margin: '0 0 1.5rem', color: MUT, fontFamily: 'Outfit, sans-serif' }}>Select a conversation or start a new one</p>
              <button onClick={() => setShowNewDM(true)} style={{ background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.3)', color: '#a09bff', padding: '0.6rem 1.5rem', borderRadius: 10, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem', fontWeight: 700 }}>
                + New Message
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ padding: '0.9rem 1.25rem', borderBottom: `1px solid ${BRD}`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: avatarColor(activeUser), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 800, color: '#fff' }}>
                  {initials(activeUser)}
                </div>
                <div>
                  <p style={{ color: TXT, fontWeight: 700, fontSize: '0.9rem', margin: 0, fontFamily: 'Outfit, sans-serif' }}>{activeUser}</p>
                  <p style={{ color: DIM, fontSize: '0.65rem', margin: 0, fontFamily: 'Outfit, sans-serif' }}>Direct Message</p>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {conversation.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: DIM, paddingBottom: '4rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👋</div>
                    <p style={{ fontSize: '0.82rem', fontFamily: 'Outfit, sans-serif' }}>Start your conversation with {activeUser}</p>
                  </div>
                ) : conversation.map((msg, i) => {
                  const sender  = msg.senderUsername || msg.sender || msg.from || ''
                  const isMine  = sender === username
                  const msgText = msg.message || msg.content || msg.text || ''
                  const msgTime = msg.sentAt || msg.createdAt || msg.timestamp
                  const prev    = i > 0 ? (conversation[i-1].senderUsername || conversation[i-1].sender) : null
                  const showMeta = sender !== prev

                  return (
                    <div key={msg.id || i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-end', flexDirection: isMine ? 'row-reverse' : 'row', marginTop: showMeta ? '0.75rem' : '0.1rem' }}>
                      {!isMine && (
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: avatarColor(activeUser), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 800, color: '#fff', flexShrink: 0, visibility: showMeta ? 'visible' : 'hidden' }}>
                          {initials(activeUser)}
                        </div>
                      )}
                      <div style={{ maxWidth: '65%' }}>
                        <div style={{
                          background: isMine ? 'rgba(108,99,255,0.2)' : SRF,
                          border:     `1px solid ${isMine ? 'rgba(108,99,255,0.3)' : BRD}`,
                          borderRadius: isMine ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                          padding: '0.6rem 0.9rem', color: TXT,
                          fontSize: '0.875rem', lineHeight: 1.5,
                          fontFamily: 'Outfit, sans-serif', wordBreak: 'break-word',
                        }}>{msgText}</div>
                        {showMeta && msgTime && (
                          <p style={{ color: DIM, fontSize: '0.6rem', margin: '0.2rem 0.2rem 0', textAlign: isMine ? 'right' : 'left', fontFamily: 'Outfit, sans-serif' }}>{timeAgo(msgTime)}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input bar */}
              <div style={{ padding: '0.9rem 1.25rem', borderTop: `1px solid ${BRD}` }}>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                  <input
                    type="text" placeholder={`Message ${activeUser}...`}
                    value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }}}
                    style={{ flex: 1, background: SRF, border: `1px solid ${BRD}`, borderRadius: 10, padding: '0.7rem 1rem', color: TXT, fontSize: '0.875rem', fontFamily: 'Outfit, sans-serif', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = '#6c63ff'}
                    onBlur={e => e.target.style.borderColor = BRD}
                  />
                  <button onClick={handleSend} disabled={sending || !input.trim()} style={{
                    background: sending || !input.trim() ? 'rgba(108,99,255,0.08)' : 'linear-gradient(135deg,#6c63ff,#5a52d5)',
                    color: sending || !input.trim() ? MUT : '#fff', border: 'none',
                    borderRadius: 10, padding: '0.7rem 1.25rem',
                    cursor: sending || !input.trim() ? 'not-allowed' : 'pointer',
                    fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.85rem',
                    boxShadow: sending || !input.trim() ? 'none' : '0 4px 14px rgba(108,99,255,0.35)',
                    transition: 'all 0.15s',
                  }}>{sending ? '...' : 'Send →'}</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
