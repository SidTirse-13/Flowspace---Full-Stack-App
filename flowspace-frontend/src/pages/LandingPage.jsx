// FILE: src/pages/LandingPage.jsx
// Feature 1 — Public landing page at "/"
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

const FEATURES = [
  { icon: '⚡', title: 'Kanban Boards', desc: 'Drag tasks across columns visually. TODO → IN PROGRESS → DONE in one glance.' },
  { icon: '🤖', title: 'AI Assistant', desc: 'Auto-suggest priorities, generate task descriptions, predict deadlines with Groq AI.' },
  { icon: '📈', title: 'Velocity Charts', desc: 'Track your team\'s sprint velocity week over week with beautiful SVG charts.' },
  { icon: '💬', title: 'Team Chat', desc: 'Real-time project chat with @mentions, announcements, and emoji reactions.' },
  { icon: '⏱', title: 'Time Tracking', desc: 'Log hours per task, view per-member breakdowns, export reports as CSV or PDF.' },
  { icon: '📊', title: 'Analytics', desc: 'Completion rates, overdue tracking, critical path analysis and burndown charts.' },
]

const STATS = [
  { value: '25+', label: 'Features Built' },
  { value: '100%', label: 'Free to Use' },
  { value: '5s', label: 'Setup Time' },
  { value: '∞', label: 'Projects' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [scrollY, setScrollY] = useState(0)
  const [visible, setVisible] = useState({})

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) setVisible(v => ({ ...v, [e.target.id]: true }))
        })
      },
      { threshold: 0.15 }
    )
    document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div style={{ background: '#07080c', minHeight: '100vh', fontFamily: 'Outfit, sans-serif', overflowX: 'hidden' }}>

      {/* ── Animated background grid ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(108,99,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(108,99,255,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
      }} />

      {/* ── Glows ── */}
      <div style={{ position: 'fixed', top: '10%', left: '20%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: '40%', right: '15%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(0,212,170,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* ── Navbar ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrollY > 50 ? 'rgba(7,8,12,0.9)' : 'transparent',
        backdropFilter: scrollY > 50 ? 'blur(20px)' : 'none',
        borderBottom: scrollY > 50 ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        transition: 'all 0.3s',
        padding: '1rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #6c63ff, #00d4aa)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2.5, padding: '6px',
          }}>
            <div style={{ width: '100%', height: 2, background: 'white', borderRadius: 2 }} />
            <div style={{ width: '70%', height: 2, background: 'rgba(255,255,255,0.75)', borderRadius: 2, alignSelf: 'flex-start' }} />
            <div style={{ width: '45%', height: 2, background: 'rgba(255,255,255,0.5)', borderRadius: 2, alignSelf: 'flex-start' }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#e8eaf0' }}>Flow<span style={{ background: 'linear-gradient(135deg,#6c63ff,#00d4aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>space</span></span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {['Features', 'How it Works', 'About'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g,'-')}`}
              style={{ color: '#7a7f95', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer' }}
              onMouseEnter={e => e.target.style.color = '#e8eaf0'}
              onMouseLeave={e => e.target.style.color = '#7a7f95'}
            >{l}</a>
          ))}
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={() => navigate('/login')} style={{
            background: 'transparent', border: '1px solid #252836', color: '#a09bff',
            padding: '0.5rem 1.1rem', borderRadius: 8, cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(108,99,255,0.5)'; e.currentTarget.style.background = 'rgba(108,99,255,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#252836'; e.currentTarget.style.background = 'transparent' }}
          >Sign In</button>
          <button onClick={() => navigate('/register')} style={{
            background: 'linear-gradient(135deg, #6c63ff, #5a52d5)', color: 'white',
            border: 'none', padding: '0.5rem 1.25rem', borderRadius: 8, cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem', fontWeight: 700,
            boxShadow: '0 4px 20px rgba(108,99,255,0.4)', transition: 'transform 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >Get Started Free →</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', zIndex: 1, paddingTop: '14rem', paddingBottom: '8rem', textAlign: 'center', padding: '14rem 2rem 8rem' }}>

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.25)',
          borderRadius: 20, padding: '0.35rem 1rem', marginBottom: '2rem',
          animation: 'fadeDown 0.6s ease both',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6c63ff', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          <span style={{ color: '#a09bff', fontSize: '0.78rem', fontWeight: 600 }}>AI-Powered Project Management</span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 900,
          lineHeight: 1.08, letterSpacing: '-0.04em',
          margin: '0 auto 1.5rem', maxWidth: 800,
          animation: 'fadeDown 0.6s 0.1s ease both', opacity: 0,
          animationFillMode: 'forwards',
        }}>
          <span style={{ color: '#e8eaf0' }}>Where great</span>
          <br />
          <span style={{
            background: 'linear-gradient(135deg, #6c63ff 0%, #00d4aa 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>projects flow.</span>
        </h1>

        {/* Subheadline */}
        <p style={{
          color: '#7a7f95', fontSize: 'clamp(1rem, 2vw, 1.2rem)',
          maxWidth: 560, margin: '0 auto 3rem', lineHeight: 1.6,
          animation: 'fadeDown 0.6s 0.2s ease both', opacity: 0, animationFillMode: 'forwards',
        }}>
          Manage tasks, collaborate with your team, track velocity, and ship projects faster — all powered by AI.
        </p>

        {/* CTA group */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', animation: 'fadeDown 0.6s 0.3s ease both', opacity: 0, animationFillMode: 'forwards' }}>
          <button onClick={() => navigate('/register')} style={{
            background: 'linear-gradient(135deg, #6c63ff, #5a52d5)', color: 'white',
            border: 'none', padding: '0.9rem 2rem', borderRadius: 12, cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif', fontSize: '1rem', fontWeight: 700,
            boxShadow: '0 8px 32px rgba(108,99,255,0.45)', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(108,99,255,0.55)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(108,99,255,0.45)' }}
          >
            Start for free — it's instant →
          </button>
          <button onClick={() => navigate('/login')} style={{
            background: 'rgba(255,255,255,0.04)', color: '#e8eaf0',
            border: '1px solid #252836', padding: '0.9rem 2rem', borderRadius: 12, cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif', fontSize: '1rem', fontWeight: 600, transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#6c63ff55'; e.currentTarget.style.background = 'rgba(108,99,255,0.06)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#252836'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
          >
            Sign in to your workspace
          </button>
        </div>

        {/* App preview mockup */}
        <div style={{
          marginTop: '5rem', position: 'relative', maxWidth: 900, margin: '5rem auto 0',
          animation: 'fadeUp 0.8s 0.4s ease both', opacity: 0, animationFillMode: 'forwards',
        }}>
          <div style={{
            background: 'linear-gradient(180deg, rgba(108,99,255,0.15) 0%, transparent 100%)',
            borderRadius: 20, padding: '2px',
          }}>
            <div style={{
              background: '#0e1018', borderRadius: 18, overflow: 'hidden',
              border: '1px solid rgba(108,99,255,0.15)',
              boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(108,99,255,0.1)',
            }}>
              {/* Mock browser bar */}
              <div style={{ background: '#12141a', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #1a1d26' }}>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
                </div>
                <div style={{ flex: 1, background: '#1a1d26', borderRadius: 6, padding: '0.3rem 0.75rem', fontSize: '0.7rem', color: '#5a6080', textAlign: 'center' }}>
                  app.flowspace.io/dashboard
                </div>
              </div>

              {/* Mock dashboard UI */}
              <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                {[
                  { label: 'Active Projects', val: '8', color: '#6c63ff', icon: '🗂' },
                  { label: 'Tasks Done', val: '34', color: '#00d4aa', icon: '✅' },
                  { label: 'Team Members', val: '12', color: '#ffd166', icon: '👥' },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#12141a', border: '1px solid #1e2030', borderRadius: 12, padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ color: '#5a6080', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.3rem' }}>{s.label}</p>
                        <p style={{ color: s.color, fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{s.val}</p>
                      </div>
                      <span style={{ fontSize: '1.4rem' }}>{s.icon}</span>
                    </div>
                  </div>
                ))}
                {/* Kanban preview */}
                <div style={{ gridColumn: '1 / -1', background: '#12141a', border: '1px solid #1e2030', borderRadius: 12, padding: '1rem' }}>
                  <p style={{ color: '#5a6080', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Kanban Board</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                    {[
                      { col: 'TODO', color: '#5a6080', tasks: ['Design system audit', 'User research'] },
                      { col: 'IN PROGRESS', color: '#ffd166', tasks: ['Build auth module', 'API integration'] },
                      { col: 'DONE', color: '#00d4aa', tasks: ['Project setup ✓', 'Database schema ✓'] },
                    ].map(col => (
                      <div key={col.col}>
                        <p style={{ color: col.color, fontSize: '0.6rem', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{col.col}</p>
                        {col.tasks.map(t => (
                          <div key={t} style={{ background: '#0a0b0e', border: '1px solid #252836', borderRadius: 6, padding: '0.4rem 0.6rem', marginBottom: '0.35rem', fontSize: '0.65rem', color: '#c0c5dc' }}>{t}</div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Glow under mockup */}
          <div style={{ position: 'absolute', bottom: -40, left: '50%', transform: 'translateX(-50%)', width: '70%', height: 80, background: 'rgba(108,99,255,0.2)', filter: 'blur(40px)', borderRadius: '50%', pointerEvents: 'none' }} />
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '4rem 2rem', borderTop: '1px solid #0e1018', borderBottom: '1px solid #0e1018' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', textAlign: 'center' }}>
          {STATS.map((s, i) => (
            <div key={i}>
              <p style={{ fontSize: '2.5rem', fontWeight: 900, background: 'linear-gradient(135deg, #6c63ff, #00d4aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.25rem' }}>{s.value}</p>
              <p style={{ color: '#5a6080', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ position: 'relative', zIndex: 1, padding: '8rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }} id="feat-header" data-animate>
          <p style={{ color: '#6c63ff', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Everything you need</p>
          <h2 style={{ color: '#e8eaf0', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 1rem' }}>
            Built for teams that ship fast
          </h2>
          <p style={{ color: '#5a6080', fontSize: '1rem', maxWidth: 500, margin: '0 auto' }}>
            Every feature you need to manage projects from idea to completion.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {FEATURES.map((f, i) => (
            <div key={i}
              style={{
                background: 'rgba(14,16,24,0.8)', border: '1px solid #1a1d26',
                borderRadius: 16, padding: '1.5rem',
                transition: 'all 0.25s', cursor: 'default',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(108,99,255,0.3)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a1d26'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ fontSize: '1.75rem', marginBottom: '0.85rem' }}>{f.icon}</div>
              <h3 style={{ color: '#e8eaf0', fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem' }}>{f.title}</h3>
              <p style={{ color: '#5a6080', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ position: 'relative', zIndex: 1, padding: '6rem 2rem', background: 'rgba(14,16,24,0.5)', borderTop: '1px solid #0e1018', borderBottom: '1px solid #0e1018' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#00d4aa', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Simple by design</p>
          <h2 style={{ color: '#e8eaf0', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '4rem' }}>
            Up and running in minutes
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up free in 30 seconds. No credit card required.' },
              { step: '02', title: 'Create Project', desc: 'Add your project, invite team members, set a color theme.' },
              { step: '03', title: 'Start Flowing', desc: 'Create tasks, assign them, track progress, ship faster.' },
            ].map((s, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <div style={{ fontSize: '3rem', fontWeight: 900, background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(0,212,170,0.05))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '1rem', lineHeight: 1 }}>{s.step}</div>
                <h3 style={{ color: '#e8eaf0', fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem' }}>{s.title}</h3>
                <p style={{ color: '#5a6080', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '10rem 2rem', textAlign: 'center' }}>
        <div style={{
          maxWidth: 650, margin: '0 auto',
          background: 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(0,212,170,0.04))',
          border: '1px solid rgba(108,99,255,0.2)', borderRadius: 24, padding: '4rem 2rem',
        }}>
          <h2 style={{ color: '#e8eaf0', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 1rem' }}>
            Ready to make your projects <span style={{ background: 'linear-gradient(135deg,#6c63ff,#00d4aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>flow?</span>
          </h2>
          <p style={{ color: '#5a6080', fontSize: '1rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>
            Join teams who use Flowspace to stay organized, move fast, and ship great work.
          </p>
          <button onClick={() => navigate('/register')} style={{
            background: 'linear-gradient(135deg, #6c63ff, #5a52d5)', color: 'white',
            border: 'none', padding: '1rem 2.5rem', borderRadius: 12, cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif', fontSize: '1rem', fontWeight: 700,
            boxShadow: '0 8px 32px rgba(108,99,255,0.45)', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 48px rgba(108,99,255,0.55)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(108,99,255,0.45)' }}
          >
            Create free account →
          </button>
          <p style={{ color: '#3a3f52', fontSize: '0.75rem', marginTop: '1rem' }}>No credit card · Free forever · Setup in 30 seconds</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid #0e1018', padding: '2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg,#6c63ff,#00d4aa)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, padding: '4px' }}>
            <div style={{ width: '100%', height: 1.5, background: 'white', borderRadius: 1 }} />
            <div style={{ width: '70%', height: 1.5, background: 'rgba(255,255,255,0.75)', borderRadius: 1, alignSelf: 'flex-start' }} />
            <div style={{ width: '45%', height: 1.5, background: 'rgba(255,255,255,0.5)', borderRadius: 1, alignSelf: 'flex-start' }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#e8eaf0' }}>Flow<span style={{ background: 'linear-gradient(135deg,#6c63ff,#00d4aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>space</span></span>
        </div>
        <p style={{ color: '#3a3f52', fontSize: '0.75rem', margin: 0 }}>
          Project Management Reimagined · Built with ❤️ and AI
        </p>
      </footer>

      <style>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}