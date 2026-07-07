import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const REDIRECT_URI = 'https://portal.clairenhaus.com/onboarding/callback'

export default function OnboardingCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('Connecting your Gmail...')
  const [error, setError] = useState(null)

  useEffect(() => {
    handleCallback()
  }, [])

  async function handleCallback() {
    try {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const state = params.get('state')

      if (!code) {
        setError('Authorization was cancelled or failed. Please try again.')
        return
      }

      setStatus('Exchanging authorization code...')

      const tokenRes = await fetch('https://n8n-production-7c11.up.railway.app/webhook/ea-oauth-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, state, redirect_uri: REDIRECT_URI })
      })

      if (!tokenRes.ok) {
        throw new Error('Failed to exchange authorization code')
      }

      let tokenData
      try {
        tokenData = await tokenRes.json()
      } catch {
        throw new Error('Token exchange returned an invalid response. Please try again.')
      }

      if (!tokenData.access_token) {
        throw new Error('No access token received. Please try again.')
      }

      setStatus('Saving your connection...')

      const { data: { user } } = await supabase.auth.getUser()

      const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('supabase_user_id', user.id)
        .maybeSingle()

      if (!clientData) {
        throw new Error('Client record not found')
      }

      const { error: tokenError } = await supabase
        .from('oauth_tokens')
        .upsert({
          client_id: clientData.id,
          provider: 'google',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expiry: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
          scopes: tokenData.scope?.split(' ') || [],
          connected_email: user.email
        }, { onConflict: 'client_id,provider' })

      if (tokenError) throw tokenError

      await supabase
        .from('clients')
        .update({ onboarding_status: 'oauth_connected' })
        .eq('id', clientData.id)

      setStatus('Gmail connected successfully!')

      setTimeout(() => {
        navigate('/dashboard', { replace: true })
      }, 1500)

    } catch (err) {
      console.error('OAuth callback error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    }
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: '24px'
      }}>
        <div style={{ maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ marginBottom: '8px' }}>Connection failed</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '14px', marginBottom: '24px' }}>{error}</p>
          <button className="btn-primary" onClick={() => navigate('/onboarding')}>
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 20px' }} />
        <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>{status}</p>
      </div>
    </div>
  )
}
