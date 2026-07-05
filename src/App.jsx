import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import ClientDashboard from './pages/ClientDashboard'
import OperatorDashboard from './pages/OperatorDashboard'
import './styles/global.css'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RootRedirect() {
  const { user, isOperator, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (isOperator) return <Navigate to="/operator" replace />
  return <Navigate to="/dashboard" replace />
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          width: '36px', height: '36px',
          background: 'linear-gradient(135deg, #00c2a8, #7b6ef6)',
          borderRadius: '8px'
        }} />
        <div className="spinner" />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><ClientDashboard /></ProtectedRoute>
          } />
          <Route path="/operator" element={
            <ProtectedRoute><OperatorDashboard /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
