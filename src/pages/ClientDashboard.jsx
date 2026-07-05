import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

export default function ClientDashboard() {
  const { client, user, signOut } = useAuth()
  const [briefings, setBriefings] = useState([])
  const [activity, setActivity] = useState([])
  const [telegram, setTelegram] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('today')

  useEffect(() => {
    if (client) loadData()
  }, [client])

  async function loadData() {
    setLoading(true)
    const [b, a, t] = await Promise.all([
      supabase.from('briefings').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('activity_log').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('telegram_sessions').select('*').eq('client_id', client.id).single()
    ])
    if (b.data) setBriefings(b.data)
    if (a.data) setActivity(a.data)
    if (t.data) setTelegram(t.data)
    setLoading(false)
  }

  const todayBriefing = briefings.find(b => {
    const today = new Date().toDateString()
    return new Date(b.created_at).toDateString() === today && b.type === 'morning'
  })

  const eveningBriefing = briefings.find(b => {
    const today = new Date().toDateString()
    return new Date(b.created_at).toDateString() === today && b.type === 'evening'
  })

  const tabs = ['today', 'history', 'activity', 'settings']

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-2)'
      }}>
        <div className="flex items-center gap-12">
          <div style={{
            width: '28px', height: '28px',
            background: 'linear-gradient(135deg, var(--teal), var(--purple))',
            borderRadius: '6px'
          }} />
          <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '15px' }}>
            Clairen Haus EA
          </span>
        </div>
        <div className="flex items-center gap-16">
          <span style={{ color: 'var(--text-2)', fontSize: '13px' }}>
            {user?.email}
          </span>
          <button className="btn-ghost" onClick={signOut} style={{ fontSize: '13px', padding: '6px 12px' }}>
            Sign out
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Welcome */}
        <div style={{ marginBottom: '32px' }}>
          <div className="flex items-center gap-12" style={{ marginBottom: '4px' }}>
            <h1 style={{ fontSize: '24px' }}>
              Good {getTimeOfDay()}, {client?.name?.split(' ')[0] || 'there'}
            </h1>
            <span className={`badge badge-${client?.onboarding_status === 'active' ? 'active' : 'pending'}`}>
              {client?.onboarding_status === 'active' ? 'Active' : 'Setting up'}
            </span>
          </div>
          <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>
            {client?.business_name} · Pilot Day {getPilotDay(client?.pilot_start_date)}
          </p>
          <div className="gradient-bar" style={{ marginTop: '16px', maxWidth: '120px' }} />
        </div>

        {/* Tabs */}
        <div className="flex gap-4" style={{ marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 500,
                color: activeTab === tab ? 'var(--teal)' : 'var(--text-2)',
                borderBottom: activeTab === tab ? '2px solid var(--teal)' : '2px solid transparent',
                borderRadius: 0,
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center" style={{ padding: '60px' }}>
            <div className="spinner" style={{ width: '32px', height: '32px' }} />
          </div>
        ) : (
          <>
            {/* TODAY TAB */}
            {activeTab === 'today' && (
              <div className="flex flex-col gap-16">

                {/* Telegram Connect Banner */}
                {!telegram?.connected && (
                  <div style={{
                    background: 'var(--teal-dim)',
                    border: '1px solid var(--teal-mid)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px'
                  }}>
                    <div>
                      <p style={{ fontWeight: 600, marginBottom: '4px' }}>Connect your EA on Telegram</p>
                      <p style={{ color: 'var(--text-2)', fontSize: '13px' }}>
                        Get morning briefings, updates, and chat with your EA directly in Telegram.
                      </p>
                    </div>
                    {telegram?.bot_username && (
                      <a
                        href={`https://t.me/${telegram.bot_username}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary"
                        style={{ whiteSpace: 'nowrap', padding: '10px 20px' }}
                      >
                        Open in Telegram
                      </a>
                    )}
                  </div>
                )}

                {/* Gmail Connect Banner */}
                {client?.onboarding_status === 'pending' && (
                  <div style={{
                    background: 'var(--orange-dim)',
                    border: '1px solid rgba(255,107,53,0.25)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px'
                  }}>
                    <div>
                      <p style={{ fontWeight: 600, marginBottom: '4px' }}>Connect your Gmail</p>
                      <p style={{ color: 'var(--text-2)', fontSize: '13px' }}>
                        Your EA needs access to your inbox and calendar to get started.
                      </p>
                    </div>
                    <a
                      href="/onboarding"
                      className="btn-primary"
                      style={{ whiteSpace: 'nowrap', padding: '10px 20px', background: 'var(--orange)', display: 'inline-block' }}
                    >
                      Connect Gmail
                    </a>
                  </div>
                )}

                {/* Morning Briefing */}
                <div className="card">
                  <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                    <div>
                      <span className="label">Morning Briefing</span>
                      <p style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '2px' }}>
                        {todayBriefing ? format(new Date(todayBriefing.created_at), 'MMMM d · h:mm a') : 'Today'}
                      </p>
                    </div>
                    <span style={{ fontSize: '20px' }}>☀️</span>
                  </div>
                  {todayBriefing ? (
                    <p style={{ color: 'var(--text)', lineHeight: 1.7, fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                      {todayBriefing.content}
                    </p>
                  ) : (
                    <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>
                      Your morning briefing will appear here once your EA is active.
                    </p>
                  )}
                </div>

                {/* Evening Debrief */}
                <div className="card">
                  <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                    <div>
                      <span className="label">Evening Debrief</span>
                      <p style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '2px' }}>
                        {eveningBriefing ? format(new Date(eveningBriefing.created_at), 'MMMM d · h:mm a') : 'Today'}
                      </p>
                    </div>
                    <span style={{ fontSize: '20px' }}>🌙</span>
                  </div>
                  {eveningBriefing ? (
                    <p style={{ color: 'var(--text)', lineHeight: 1.7, fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                      {eveningBriefing.content}
                    </p>
                  ) : (
                    <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>
                      Your evening debrief will appear here after 6 PM.
                    </p>
                  )}
                </div>

                {/* Recent Activity */}
                <div className="card">
                  <span className="label" style={{ display: 'block', marginBottom: '16px' }}>Recent Activity</span>
                  {activity.slice(0, 5).length > 0 ? (
                    <div className="flex flex-col gap-12">
                      {activity.slice(0, 5).map(item => (
                        <div key={item.id} className="flex items-center gap-12">
                          <div style={{
                            width: '32px', height: '32px',
                            background: 'var(--bg-3)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            flexShrink: 0
                          }}>
                            {getActionEmoji(item.action_type)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '13px' }}>{item.summary}</p>
                            <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>
                              {format(new Date(item.created_at), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>
                      Activity will appear here once your EA is running.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* HISTORY TAB */}
            {activeTab === 'history' && (
              <div className="flex flex-col gap-16">
                {briefings.length > 0 ? briefings.map(b => (
                  <div key={b.id} className="card">
                    <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                      <span className="label">{b.type === 'morning' ? 'Morning Briefing' : b.type === 'evening' ? 'Evening Debrief' : 'Weekly Recap'}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                        {format(new Date(b.created_at), 'MMMM d, yyyy')}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text)', lineHeight: 1.7, fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                      {b.content}
                    </p>
                  </div>
                )) : (
                  <div className="card text-center" style={{ padding: '48px' }}>
                    <p style={{ color: 'var(--text-3)' }}>No briefing history yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* ACTIVITY TAB */}
            {activeTab === 'activity' && (
              <div className="card">
                <span className="label" style={{ display: 'block', marginBottom: '16px' }}>All Activity</span>
                {activity.length > 0 ? (
                  <div className="flex flex-col gap-12">
                    {activity.map(item => (
                      <div key={item.id} style={{
                        display: 'flex',
                        gap: '12px',
                        paddingBottom: '12px',
                        borderBottom: '1px solid var(--border)'
                      }}>
                        <div style={{
                          width: '32px', height: '32px',
                          background: 'var(--bg-3)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          flexShrink: 0
                        }}>
                          {getActionEmoji(item.action_type)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '13px' }}>{item.summary}</p>
                          <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>
                            {format(new Date(item.created_at), 'MMM d · h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>No activity yet.</p>
                )}
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="flex flex-col gap-16">
                <div className="card">
                  <span className="label" style={{ display: 'block', marginBottom: '16px' }}>Notification Preferences</span>
                  <p style={{ color: 'var(--text-2)', fontSize: '13px' }}>
                    Contact your Clairen Haus operator to update notification settings.
                  </p>
                  <a href="mailto:michelle@clairenhaus.com" className="btn-secondary" style={{
                    display: 'inline-block', marginTop: '16px', padding: '10px 20px'
                  }}>
                    Contact Support
                  </a>
                </div>

                <div className="card">
                  <span className="label" style={{ display: 'block', marginBottom: '16px' }}>Connected Accounts</span>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-12">
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '8px',
                        background: 'var(--bg-3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <svg width="18" height="18" viewBox="0 0 18 18">
                          <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                          <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                          <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
                          <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
                        </svg>
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 500 }}>Gmail</p>
                        <p style={{ fontSize: '11px', color: 'var(--text-3)' }}>{user?.email}</p>
                      </div>
                    </div>
                    <span className="badge badge-active">Connected</span>
                  </div>

                  <div className="divider" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-12">
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '8px',
                        background: 'var(--bg-3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '18px'
                      }}>
                        ✈️
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 500 }}>Telegram</p>
                        <p style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                          {telegram?.connected ? `@${telegram.bot_username}` : 'Not connected'}
                        </p>
                      </div>
                    </div>
                    {telegram?.connected ? (
                      <span className="badge badge-active">Connected</span>
                    ) : telegram?.bot_username ? (
                      <a
                        href={`https://t.me/${telegram.bot_username}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary"
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                      >
                        Connect
                      </a>
                    ) : (
                      <span className="badge badge-pending">Pending setup</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function getPilotDay(startDate) {
  if (!startDate) return '—'
  const diff = Math.floor((new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24))
  return diff < 0 ? 'starts soon' : `${diff + 1} of 30`
}

function getActionEmoji(type) {
  const map = {
    email_triaged: '📥',
    email_drafted: '✏️',
    email_sent: '📤',
    calendar_checked: '📅',
    meeting_prepped: '📋',
    morning_briefing: '☀️',
    evening_debrief: '🌙',
    weekly_recap: '📊',
    client_message: '💬',
    ea_response: '🤖',
    crm_updated: '🔄',
    hubspot_logged: '🔶'
  }
  return map[type] || '•'
}
