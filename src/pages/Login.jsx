import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function Login() {
  const { signInWithGoogle, signInWithEmail } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('choose') // choose | email
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleGoogle() {
    setError('')
    await signInWithGoogle()
  }

  async function handleEmail(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signInWithEmail(email, password)
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      navigate('/')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'var(--bg)'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div className="text-center" style={{ marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '8px'
          }}>
            <div style={{
              width: '36px', height: '36px',
              background: 'linear-gradient(135deg, var(--teal), var(--purple))',
              borderRadius: '8px'
            }} />
            <span style={{
              fontFamily: 'Plus Jakarta Sans',
              fontWeight: 700,
              fontSize: '18px'
            }}>Clairen Haus</span>
          </div>
          <div className="gradient-bar" style={{ margin: '12px auto', maxWidth: '60px' }} />
          <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>EA Client Portal</p>
        </div>

        {/* Card */}
        <div className="card">
          <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Welcome back</h2>
          <p style={{ color: 'var(--text-2)', marginBottom: '24px', fontSize: '13px' }}>
            Sign in to access your executive assistant dashboard.
          </p>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius)',
              padding: '10px 14px',
              color: 'var(--error)',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          {mode === 'choose' && (
            <div className="flex flex-col gap-12">
              <button
                className="btn-secondary w-full flex items-center gap-8"
                onClick={handleGoogle}
                style={{ justifyContent: 'center', padding: '12px' }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                  <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                  <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
                  <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-12">
                <div className="divider" style={{ flex: 1, margin: 0 }} />
                <span style={{ color: 'var(--text-3)', fontSize: '12px' }}>or</span>
                <div className="divider" style={{ flex: 1, margin: 0 }} />
              </div>

              <button
                className="btn-secondary w-full"
                onClick={() => setMode('email')}
                style={{ padding: '12px' }}
              >
                Sign in with email
              </button>
            </div>
          )}

          {mode === 'email' && (
            <form onSubmit={handleEmail} className="flex flex-col gap-16">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading}
                style={{ padding: '12px' }}
              >
                {loading ? <div className="spinner" style={{ margin: '0 auto' }} /> : 'Sign in'}
              </button>

              <button
                type="button"
                className="btn-ghost w-full"
                onClick={() => setMode('choose')}
                style={{ fontSize: '13px' }}
              >
                Back to sign in options
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: '12px', marginTop: '24px' }}>
          Powered by <a href="https://clairenhaus.com" target="_blank">Clairen Haus</a>
        </p>
      </div>
    </div>
  )
}
