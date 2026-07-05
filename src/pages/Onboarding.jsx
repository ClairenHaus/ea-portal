import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const REDIRECT_URI = 'https://portal.clairenhaus.com/onboarding/callback'

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email'
].join(' ')

export default function Onboarding() {
  const { user, client } = useAuth()
  const [loading, setLoading] = useState(false)

  function connectGmail() {
    setLoading(true)
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: SCOPES,
      access_type: 'offline',
      prompt: 'consent',
      state: user?.id || ''
    })
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '56px', height: '56px',
            background: 'linear-gradient(135deg, var(--teal), var(--purple))',
            borderRadius: '14px',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            🤖
          </div>
          <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Connect your Gmail</h1>
          <p style={{ color: 'var(--text-2)', fontSize: '14px', lineHeight: 1.6 }}>
            Your EA needs access to your inbox and calendar to get started. This is a one-time setup.
          </p>
          <div className="gradient-bar" style={{ margin: '20px auto 0', maxWidth: '80px' }} />
        </div>

        {/* What access means */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <span className="label" style={{ display: 'block', marginBottom: '16px' }}>What your EA can do</span>
          <div className="flex flex-col gap-12">
            {[
              { icon: '📥', label: 'Read and triage your inbox' },
              { icon: '✏️', label: 'Draft replies in your voice' },
              { icon: '📅', label: 'Read your calendar for briefings' },
              { icon: '🔔', label: 'Alert you to priority emails' }
            ].map(item => (
              <div key={item.label} className="flex items-center gap-12">
                <span style={{ fontSize: '18px', width: '28px', textAlign: 'center' }}>{item.icon}</span>
                <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>{item.label}</span>
              </div>
            ))}
          </div>
          <div className="divider" />
          <p style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.6 }}>
            Your EA cannot delete emails, access attachments without permission, or share your data with third parties. Access can be revoked at any time from your Google account settings.
          </p>
        </div>

        {/* Connect button */}
        <button
          className="btn-primary w-full"
          onClick={connectGmail}
          disabled={loading}
          style={{ padding: '14px', fontSize: '15px', borderRadius: '10px' }}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-8">
              <div className="spinner" style={{ width: '16px', height: '16px' }} />
              Redirecting to Google...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-8">
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#fff" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                <path fill="#fff" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                <path fill="#fff" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
                <path fill="#fff" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
              </svg>
              Connect Gmail
            </div>
          )}
        </button>

        <p style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: '12px', marginTop: '16px' }}>
          You'll be redirected to Google to authorize access.
        </p>
      </div>
    </div>
  )
}
