// ─────────────────────────────────────────────────────────────────
// FILE: src/pages/ProjectMembersPage.jsx
// PURPOSE: Manage project team members
//  - View all current members with their roles
//  - Invite new members by searching usernames
//  - Remove members (owner / project_manager / admin only)
// ─────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/shared/Navbar'
import { useAuth } from '../context/AuthContext'
import {
  getMembers, inviteMember, removeMember, searchInvitableUsers
} from '../api/memberApi'

const ROLE_STYLE = {
  OWNER:          { bg: 'rgba(255,209,102,.15)', border: 'rgba(255,209,102,.35)', text: '#ffd166', label: '👑 Owner' },
  PROJECT_MANAGER:{ bg: 'rgba(108,99,255,.15)',  border: 'rgba(108,99,255,.35)',  text: '#a09bff', label: '🛠 Project Manager' },
  MEMBER:         { bg: 'rgba(0,212,170,.12)',   border: 'rgba(0,212,170,.3)',    text: '#00d4aa', label: '👤 Member' },
}

export default function ProjectMembersPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { username, isAdmin, isPM } = useAuth()

  const [members, setMembers]       = useState([])
  const [loading, setLoading]       = useState(true)

  // Invite state
  const [inviteQuery, setInviteQuery]   = useState('')
  const [inviteRole, setInviteRole]     = useState('MEMBER')
  const [searchResults, setResults]     = useState([])
  const [searchLoading, setSearchLoad]  = useState(false)
  const [inviting, setInviting]         = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => { fetchMembers() }, [projectId])

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const res = await getMembers(projectId)
      setMembers(res.data)
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Access denied')
        navigate('/dashboard')
      } else {
        toast.error('Failed to load members')
      }
    } finally {
      setLoading(false)
    }
  }

  // Debounced search for invitable users
  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!inviteQuery.trim()) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setSearchLoad(true)
      try {
        const res = await searchInvitableUsers(projectId, inviteQuery)
        setResults(res.data)
      } catch { setResults([]) }
      finally { setSearchLoad(false) }
    }, 300)
  }, [inviteQuery])

  const handleInvite = async (targetUsername) => {
    setInviting(true)
    try {
      const res = await inviteMember(projectId, { username: targetUsername, memberRole: inviteRole })
      setMembers(prev => [...prev, res.data])
      setInviteQuery('')
      setResults([])
      toast.success(`${targetUsername} added to project!`)
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data || 'Failed to invite')
    } finally { setInviting(false) }
  }

  const handleRemove = async (targetUsername) => {
    if (!confirm(`Remove ${targetUsername} from this project?`)) return
    try {
      await removeMember(projectId, targetUsername)
      setMembers(prev => prev.filter(m => m.username !== targetUsername))
      toast.success(`${targetUsername} removed`)
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data || 'Failed to remove')
    }
  }

  // Determine if logged-in user can manage members
  const myMember = members.find(m => m.username === username)
  const isOwner = myMember?.memberRole === 'OWNER'
  const canManage = isOwner || myMember?.memberRole === 'PROJECT_MANAGER' || isAdmin

  return (
    <div style={{ minHeight: '100vh', background: '#0a0b0e' }}>
      <Navbar />
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '2rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => navigate(`/projects/${projectId}`)} style={{ background: '#1a1d26', border: '1px solid #252836', color: '#7a7f95', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.8rem' }}>
            ← Back
          </button>
          <div>
            <h1 style={{ color: '#e8eaf0', fontSize: '1.5rem', fontWeight: 800 }}>👥 Team Members</h1>
            <p style={{ color: '#7a7f95', fontSize: '0.8rem' }}>{members.length} member{members.length !== 1 ? 's' : ''} in this project</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: canManage ? '1fr 340px' : '1fr', gap: '1.5rem', alignItems: 'start' }}>

          {/* ── MEMBER LIST ── */}
          <div style={{ background: '#12141a', border: '1px solid #252836', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '1.1rem 1.25rem', borderBottom: '1px solid #252836', background: 'rgba(108,99,255,0.05)' }}>
              <h2 style={{ color: '#e8eaf0', fontWeight: 700, fontSize: '0.95rem' }}>Current Team</h2>
            </div>

            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#7a7f95' }}>Loading...</div>
            ) : (
              <div>
                {members.map(member => {
                  const rs = ROLE_STYLE[member.memberRole] || ROLE_STYLE.MEMBER
                  const isMe = member.username === username
                  const canRemoveThis = canManage && member.memberRole !== 'OWNER' && !isMe

                  return (
                    <div key={member.id} style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      padding: '0.9rem 1.25rem',
                      borderBottom: '1px solid #1a1d26',
                      transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = '#161820'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Avatar */}
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #6c63ff, #00d4aa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '0.85rem', flexShrink: 0 }}>
                        {member.username.slice(0, 2).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: '#e8eaf0', fontWeight: 700, fontSize: '0.875rem', margin: 0 }}>
                          {member.username} {isMe && <span style={{ color: '#6c63ff', fontSize: '0.65rem' }}>(you)</span>}
                        </p>
                        {member.email && <p style={{ color: '#5a6080', fontSize: '0.72rem', margin: 0 }}>{member.email}</p>}
                        {member.joinedAt && (
                          <p style={{ color: '#3a3f52', fontSize: '0.65rem', margin: 0 }}>
                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {/* Role badge */}
                      <span style={{ background: rs.bg, border: `1px solid ${rs.border}`, color: rs.text, fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 20, whiteSpace: 'nowrap' }}>
                        {rs.label}
                      </span>

                      {/* Remove button */}
                      {canRemoveThis && (
                        <button onClick={() => handleRemove(member.username)} style={{
                          background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.25)',
                          color: '#ff9b9b', fontSize: '0.7rem', padding: '0.3rem 0.6rem',
                          borderRadius: 6, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', flexShrink: 0,
                        }}>
                          Remove
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── INVITE PANEL (only shown to managers/owners/admins) ── */}
          {canManage && (
            <div style={{ background: '#12141a', border: '1px solid #252836', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '1.1rem 1.25rem', borderBottom: '1px solid #252836', background: 'rgba(0,212,170,0.05)' }}>
                <h2 style={{ color: '#e8eaf0', fontWeight: 700, fontSize: '0.95rem' }}>➕ Invite Member</h2>
              </div>
              <div style={{ padding: '1.25rem' }}>

                {/* Role to assign */}
                <label style={{ color: '#7a7f95', fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                  ASSIGN ROLE
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  {[
                    { v: 'MEMBER', l: '👤 Member' },
                    { v: 'PROJECT_MANAGER', l: '🛠 PM / TL' },
                  ].map(r => (
                    <button key={r.v} onClick={() => setInviteRole(r.v)} style={{
                      flex: 1, padding: '0.5rem', borderRadius: 8, cursor: 'pointer',
                      fontFamily: 'Outfit, sans-serif', fontSize: '0.75rem', fontWeight: 600,
                      background: inviteRole === r.v ? 'rgba(108,99,255,0.2)' : '#1a1d26',
                      border: `1px solid ${inviteRole === r.v ? 'rgba(108,99,255,0.5)' : '#252836'}`,
                      color: inviteRole === r.v ? '#a09bff' : '#7a7f95',
                    }}>
                      {r.l}
                    </button>
                  ))}
                </div>

                {/* Search input */}
                <label style={{ color: '#7a7f95', fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                  SEARCH BY USERNAME
                </label>
                <input
                  value={inviteQuery}
                  onChange={e => setInviteQuery(e.target.value)}
                  placeholder="Type a username..."
                  style={{ width: '100%', background: '#1a1d26', border: '1px solid #252836', borderRadius: 8, padding: '0.65rem 0.9rem', color: '#e8eaf0', fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#6c63ff'}
                  onBlur={e => e.target.style.borderColor = '#252836'}
                />

                {/* Search results */}
                {searchLoading && (
                  <p style={{ color: '#5a6080', fontSize: '0.75rem', marginTop: '0.5rem' }}>Searching...</p>
                )}
                {!searchLoading && searchResults.length > 0 && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 280, overflowY: 'auto' }}>
                    {searchResults.map(user => (
                      <div key={user.id} style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        background: '#0e1018', border: '1px solid #1e2230',
                        borderRadius: 10, padding: '0.65rem 0.85rem',
                      }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#6c63ff,#5a52d5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                          {user.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: '#e8eaf0', fontSize: '0.82rem', fontWeight: 600, margin: 0 }}>{user.username}</p>
                          <p style={{ color: '#5a6080', fontSize: '0.68rem', margin: 0 }}>{user.email}</p>
                        </div>
                        <span style={{ background: 'rgba(122,127,149,.1)', border: '1px solid rgba(122,127,149,.2)', color: '#7a7f95', fontSize: '0.6rem', padding: '0.15rem 0.45rem', borderRadius: 20 }}>
                          {user.role}
                        </span>
                        <button
                          onClick={() => handleInvite(user.username)}
                          disabled={inviting}
                          style={{ background: 'rgba(0,212,170,.15)', border: '1px solid rgba(0,212,170,.3)', color: '#00d4aa', fontSize: '0.72rem', padding: '0.3rem 0.7rem', borderRadius: 6, cursor: inviting ? 'not-allowed' : 'pointer', fontFamily: 'Outfit, sans-serif', flexShrink: 0 }}>
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {!searchLoading && inviteQuery && searchResults.length === 0 && (
                  <p style={{ color: '#5a6080', fontSize: '0.75rem', marginTop: '0.5rem' }}>No users found matching "{inviteQuery}"</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
