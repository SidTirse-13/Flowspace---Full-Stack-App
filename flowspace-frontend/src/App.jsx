// FILE: src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth }  from './context/AuthContext'
import { ThemeProvider }          from './context/ThemeContext'
import ErrorBoundary              from './components/shared/ErrorBoundary'
import AIChatbot                  from './components/shared/AIChatbot'

// Pages
import LandingPage         from './pages/LandingPage'
import LoginPage           from './pages/LoginPage'
import RegisterPage        from './pages/RegisterPage'
import DashboardPage       from './pages/DashboardPage'
import ProjectDetailPage   from './pages/ProjectDetailPage'
import AnalyticsPage       from './pages/AnalyticsPage'
import SettingsPage        from './pages/SettingsPage'
import KanbanPage          from './pages/KanbanPage'
import ProjectChatPage     from './pages/ProjectChatPage'
import DirectMessagesPage  from './pages/DirectMessagesPage'
import ActivityFeedPage    from './pages/ActivityFeedPage'
import AIToolsPage         from './pages/AIToolsPage'
import WorkloadPage        from './pages/WorkloadPage'
import VelocityPage        from './pages/VelocityPage'
import AdminPage           from './pages/AdminPage'
import UserProfilePage     from './pages/UserProfilePage'
import ProjectMembersPage  from './pages/ProjectMembersPage'
import MeetingPage          from './pages/MeetingPage'

function ProtectedRoute({ children, adminOnly = false }) {
  const { isLoggedIn, isAdmin } = useAuth()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />
  return children
}

function AppContent() {
  const { isLoggedIn } = useAuth()
  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/"         element={<LandingPage />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected — user routes */}
        <Route path="/dashboard"  element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/settings"   element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/messages"   element={<ProtectedRoute><DirectMessagesPage /></ProtectedRoute>} />
        <Route path="/messages/:username" element={<ProtectedRoute><DirectMessagesPage /></ProtectedRoute>} />
        <Route path="/activity"   element={<ProtectedRoute><ActivityFeedPage /></ProtectedRoute>} />
        <Route path="/ai-tools"   element={<ProtectedRoute><AIToolsPage /></ProtectedRoute>} />
        <Route path="/meetings"   element={<ProtectedRoute><MeetingPage /></ProtectedRoute>} />
        <Route path="/profile/:username" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />

        {/* Admin only */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />

        {/* Project routes */}
        <Route path="/projects/:projectId"          element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
        <Route path="/projects/:projectId/kanban"   element={<ProtectedRoute><KanbanPage /></ProtectedRoute>} />
        <Route path="/projects/:projectId/chat"     element={<ProtectedRoute><ProjectChatPage /></ProtectedRoute>} />
        <Route path="/projects/:projectId/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/projects/:projectId/workload" element={<ProtectedRoute><WorkloadPage /></ProtectedRoute>} />
        <Route path="/projects/:projectId/velocity" element={<ProtectedRoute><VelocityPage /></ProtectedRoute>} />
        <Route path="/projects/:projectId/members"  element={<ProtectedRoute><ProjectMembersPage /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />} />
      </Routes>

      {/* Floating AI chatbot on all protected pages */}
      {isLoggedIn && <AIChatbot />}
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1d26', color: '#e8eaf0',
              border: '1px solid #252836', borderRadius: '10px',
              fontFamily: "'Outfit', sans-serif", fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#00d4aa', secondary: '#1a1d26' } },
            error:   { iconTheme: { primary: '#ff6b6b', secondary: '#1a1d26' } },
          }}
        />
        <ErrorBoundary>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  )
}