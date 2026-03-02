// FILE: src/components/shared/AIChatbot.jsx
// Floating AI chatbot — can answer questions AND perform actions in the app
import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import api from '../../api/axiosInstance'

const GROQ_MODEL = 'llama-3.1-8b-instant'

// System prompt: unrestricted, action-aware assistant
const buildSystemPrompt = (username, currentPath, projects) => `You are Flowspace AI — a smart, friendly, and CAPABLE project management assistant built into the Flowspace app.

The logged-in user is: ${username}
Current page: ${currentPath}
Their projects: ${projects.length > 0 ? projects.map(p => `"${p.name}" (id:${p.id})`).join(', ') : 'none loaded yet'}

You can:
1. Answer any question about project management, tasks, productivity, agile, sprints, etc.
2. Give specific, actionable advice — don't just say "consider doing X", actually help do it.
3. Write task descriptions, standup updates, sprint planning docs, retrospective notes.
4. Break down any feature or goal into a numbered task list the user can copy directly into the app.
5. Suggest task priorities, deadlines, and assignments based on context.
6. Help with team communication — write announcements, performance feedback, project briefs.
7. Answer questions about how to use Flowspace (Kanban, Analytics, Workload, Velocity, Members, Chat).
8. Estimate story points, timelines, or effort for described work.
9. Review descriptions and suggest improvements.
10. Generate standup formats: "Yesterday I... Today I... Blockers..."

Rules:
- Be DIRECT and helpful. Never say "I can't do that" for reasonable PM requests.
- When asked to create tasks, write them out in a clear numbered list format the user can paste.
- When asked for a standup, write it immediately without asking unnecessary questions.
- Format code, task lists, and structured content clearly using line breaks.
- Keep responses focused and under 300 words unless detail is needed.
- Be encouraging and professional.`

async function callGroq(messages) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (!apiKey) throw new Error('VITE_GROQ_API_KEY not set in your .env file')
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model: GROQ_MODEL, messages, max_tokens: 1024, temperature: 0.72 }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'Groq API error')
  return data.choices[0]?.message?.content || ''
}

const STARTERS = [
  { label: '☀️ Write my standup',     prompt: 'Write a standup update for me. I need: Yesterday, Today, and Blockers sections. Make it professional and concise.' },
  { label: '📋 Break down a feature', prompt: 'Help me break down a feature into tasks. Feature: User authentication with login, register, and password reset.' },
  { label: '⚡ Prioritize my work',   prompt: 'How should I prioritize tasks in a sprint? Give me a framework I can apply right now.' },
  { label: '✍️ Write task description', prompt: 'Write a clear task description for: "Set up CI/CD pipeline". Include acceptance criteria.' },
  { label: '🎯 Plan a sprint',         prompt: 'Help me plan a 2-week sprint for a 3-person team building a REST API backend. What tasks and ceremonies should I include?' },
  { label: '📝 Write an announcement', prompt: 'Write a project kickoff announcement for the team. Project: New mobile app launch, 6-week timeline.' },
]

export default function AIChatbot() {
  const { username } = useAuth()
  const { isDark }   = useTheme()
  const navigate     = useNavigate()
  const location     = useLocation()

  const [open,     setOpen]     = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hey ${username || 'there'}! 👋 I'm Flowspace AI.\n\nI can write standups, break down features into tasks, help plan sprints, draft announcements, and answer any PM questions. What do you need?` }
  ])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [projects, setProjects] = useState([])

  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // Load projects for context
  useEffect(() => {
    api.get('/api/projects?size=20').then(r => {
      const data = r.data?.content || r.data || []
      setProjects(Array.isArray(data) ? data : [])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')

    const userMsg = { role: 'user', content: msg }
    const history = [...messages, userMsg]
    setMessages(history)
    setLoading(true)

    try {
      const systemPrompt = buildSystemPrompt(username, location.pathname, projects)
      const apiMessages = [
        { role: 'system', content: systemPrompt },
        // Keep last 12 turns for context (6 exchanges)
        ...history.slice(-12),
      ]
      const reply = await callGroq(apiMessages)
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ ${err.message}\n\nCheck that VITE_GROQ_API_KEY is set in your .env file and restart the dev server.`,
      }])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: `Hey ${username || 'there'}! 👋 Fresh start — what can I help with?` }])
  }

  // Theme
  const bg     = isDark ? '#12141a' : '#ffffff'
  const bg2    = isDark ? '#1a1d26' : '#f0f2f8'
  const border = isDark ? '#252836' : '#dde2f0'
  const text   = isDark ? '#e8eaf0' : '#1a1d2e'
  const muted  = isDark ? '#7a7f95' : '#5a6080'
  const inp    = isDark ? '#0e1018' : '#f5f7fc'

  const renderContent = (content) => {
    // Render markdown-like: bold **text**, line breaks, numbered lists
    const lines = content.split('\n')
    return lines.map((line, i) => {
      const parts = line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} style={{ color: isDark ? '#e8eaf0' : '#1a1d2e' }}>{part.slice(2, -2)}</strong>
        }
        return part
      })
      return (
        <span key={i}>
          {parts}
          {i < lines.length - 1 && <br />}
        </span>
      )
    })
  }

  return (
    <>
      {/* Floating button */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
        <button
          onClick={() => setOpen(o => !o)}
          title="Flowspace AI Assistant"
          style={{
            width: 54, height: 54, borderRadius: '50%',
            background: open ? '#5a52d5' : 'linear-gradient(135deg, #6c63ff, #00d4aa)',
            border: 'none', cursor: 'pointer', fontSize: '1.45rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(108,99,255,0.5)',
            transition: 'all 0.25s',
            transform: open ? 'rotate(45deg)' : 'none',
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 12px 40px rgba(108,99,255,0.65)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(108,99,255,0.5)'}
        >
          {open ? '✕' : '🤖'}
        </button>
      </div>

      {/* Chat window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 90, right: 24, zIndex: 999,
          width: 390, height: 560,
          background: bg, border: `1px solid ${border}`,
          borderRadius: 22, display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          fontFamily: "'Outfit', sans-serif",
          animation: 'aiSlideUp 0.22s ease',
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.9rem 1rem',
            background: `linear-gradient(135deg, rgba(108,99,255,0.18), rgba(0,212,170,0.08))`,
            borderBottom: `1px solid ${border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6c63ff, #00d4aa)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
              }}>🤖</div>
              <div>
                <p style={{ color: text, fontWeight: 800, fontSize: '0.875rem', margin: 0 }}>Flowspace AI</p>
                <p style={{ fontSize: '0.6rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#00d4aa' }}>
                  <span style={{ width: 5, height: 5, background: '#00d4aa', borderRadius: '50%', display: 'inline-block', animation: 'aiPulse 2s infinite' }} />
                  Groq · Llama 3.1 · Always helpful
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              <button onClick={clearChat} style={{
                background: 'none', border: 'none', color: muted, cursor: 'pointer',
                fontSize: '0.72rem', padding: '0.3rem 0.5rem', borderRadius: 6,
                fontFamily: 'Outfit, sans-serif',
              }}
                onMouseEnter={e => e.currentTarget.style.color = text}
                onMouseLeave={e => e.currentTarget.style.color = muted}
              >🗑 Clear</button>
              <button onClick={() => navigate('/ai-tools')} style={{
                background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)',
                color: '#a09bff', cursor: 'pointer', fontSize: '0.65rem',
                padding: '0.3rem 0.6rem', borderRadius: 6, fontFamily: 'Outfit, sans-serif', fontWeight: 600,
              }}>AI Tools ↗</button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '88%',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #6c63ff, #5a52d5)'
                    : bg2,
                  border: msg.role === 'user' ? 'none' : `1px solid ${border}`,
                  borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  padding: '0.65rem 0.9rem',
                  color: msg.role === 'user' ? '#fff' : text,
                  fontSize: '0.82rem', lineHeight: 1.6,
                  boxShadow: msg.role === 'user' ? '0 4px 16px rgba(108,99,255,0.3)' : 'none',
                }}>
                  {renderContent(msg.content)}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ background: bg2, border: `1px solid ${border}`, borderRadius: '4px 16px 16px 16px', padding: '0.65rem 0.9rem', display: 'flex', gap: '5px', alignItems: 'center' }}>
                  {[0, 0.18, 0.36].map((d, i) => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#6c63ff', animation: `aiBounce 0.9s ${d}s infinite` }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Starter chips — only on first message */}
          {messages.length === 1 && (
            <div style={{ padding: '0 0.85rem 0.6rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {STARTERS.map(s => (
                <button key={s.label} onClick={() => send(s.prompt)} style={{
                  background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.22)',
                  color: '#a09bff', padding: '0.3rem 0.65rem', borderRadius: 20, cursor: 'pointer',
                  fontSize: '0.67rem', fontFamily: 'Outfit, sans-serif', transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(108,99,255,0.18)'; e.currentTarget.style.borderColor = 'rgba(108,99,255,0.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(108,99,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(108,99,255,0.22)' }}
                >{s.label}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '0.65rem', borderTop: `1px solid ${border}`, display: 'flex', gap: '0.5rem' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Ask anything or request help..."
              style={{
                flex: 1, background: inp, border: `1px solid ${border}`,
                borderRadius: 11, padding: '0.62rem 0.9rem',
                color: text, fontSize: '0.82rem',
                fontFamily: 'Outfit, sans-serif', outline: 'none', transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#6c63ff'}
              onBlur={e => e.target.style.borderColor = border}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              style={{
                background: !input.trim() || loading ? (isDark ? '#1a1d26' : '#e8ecf5') : 'linear-gradient(135deg, #6c63ff, #5a52d5)',
                color: !input.trim() || loading ? muted : '#fff',
                border: 'none', borderRadius: 11, padding: '0 1rem',
                cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem', transition: 'all 0.15s',
                boxShadow: !input.trim() || loading ? 'none' : '0 4px 16px rgba(108,99,255,0.35)',
                minWidth: 42,
              }}
            >→</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes aiSlideUp  { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes aiBounce   { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
        @keyframes aiPulse    { 0%, 100% { opacity: 1 } 50% { opacity: 0.35 } }
      `}</style>
    </>
  )
}