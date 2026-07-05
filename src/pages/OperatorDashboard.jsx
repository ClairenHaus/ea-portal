import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

export default function OperatorDashboard() {
  const { signOut } = useAuth()
  const [clients, setClients] = useState([])
  const [activity, setActivity] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('clients')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [c, a] = await Promise.all([
      supabase.from('clients').select('*, telegram_sessions(*), oauth_tokens(id, connected_email, provider)').order('created_at', { ascending: false }),
      supabase.from('activity_log').select('*, clients(name)').order('created_at', { ascending: false }).limit(50)
    ])
    if (c.data) setClients(c.data)
    if (a.data) setActivity(a.data)
    setLoading(false)
  }

  const activeCount = clients.filter(c => c.onboarding_status === 'active').length
  const pendingCount = clients.filter(c => c.onboarding_status === 'pending').length

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
          <span style={{
            background: 'var(--purple-dim)',
            color: 'var(--purple)',
            fontSize: '11px',
            fontWeight: 600,
            padding: '3px 8px',
            borderRadius: '4px',
            letterSpacing: '0.05em'
          }}>
            OPERATOR
          </span>
        </div>
        <button className="btn-ghost" onClick={signOut} style={{ fontSize: '13px', padding: '6px 12px' }}>
          Sign out
        </button>
      </header>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {[
            { label: 'Total Clients', value: clients.length, color: 'var(--teal)' },
            { label: 'Active', value: activeCount, color: 'var(--success)' },
            { label: 'Onboarding', value: pendingCount, color: 'var(--warning)' },
            { label: 'MRR', value: `$${(activeCount * 749).toLocaleString()}`, color: 'var(--orange)' }
          ].map(stat => (
            <div key={stat.label} className="card" style={{ padding: '20px' }}>
              <span className="label">{stat.label}</span>
              <p style={{ fontSize: '28px', fontWeight: 700, color: stat.color, marginTop: '8px', fontFamily: 'Plus Jakarta Sans' }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-4" style={{ marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
          {['clients', 'activity'].map(tab => (
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
            {/* CLIENTS TAB */}
            {activeTab === 'clients' && (
              <div className="flex flex-col gap-12">
                {clients.length === 0 ? (
                  <div className="card text-center" style={{ padding: '60px' }}>
                    <p style={{ color: 'var(--text-3)', marginBottom: '8px' }}>No clients yet.</p>
                    <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>Clients appear here after they complete payment and onboarding.</p>
                  </div>
                ) : clients.map(client => (
                  <div key={client.id} className="card" style={{ cursor: 'pointer' }}
                    onClick={() => setSelected(selected?.id === client.id ? null : client)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-16">
                        <div style={{
                          width: '40px', height: '40px',
                          background: 'linear-gradient(135deg, var(--teal-dim), var(--purple-dim))',
                          border: '1px solid var(--border)',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'Plus Jakarta Sans',
                          fontWeight: 700,
                          fontSize: '16px',
                          color: 'var(--teal)'
                        }}>
                          {client.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '14px' }}>{client.name}</p>
                          <p style={{ color: 'var(--text-2)', fontSize: '12px' }}>{client.email} · {client.business_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-12">
                        <div className="flex gap-8">
                          <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                            Gmail: {client.oauth_tokens?.length > 0 ? '✅' : '—'}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                            Telegram: {client.telegram_sessions?.[0]?.connected ? '✅' : '—'}
                          </span>
                        </div>
                        <span className={`badge badge-${client.onboarding_status === 'active' ? 'active' : client.onboarding_status === 'pending' ? 'pending' : 'paused'}`}>
                          {client.onboarding_status}
                        </span>
                        <span style={{ color: 'var(--text-3)', fontSize: '18px' }}>
                          {selected?.id === client.id ? '↑' : '↓'}
                        </span>
                      </div>
                    </div>

                    {/* Expanded client detail */}
                    {selected?.id === client.id && (
                      <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                          <div>
                            <span className="label">Pilot Period</span>
                            <p style={{ fontSize: '13px', marginTop: '4px' }}>
                              {client.pilot_start_date ? format(new Date(client.pilot_start_date), 'MMM d') : '—'}
                              {' '} to {' '}
                              {client.pilot_end_date ? format(new Date(client.pilot_end_date), 'MMM d, yyyy') : '—'}
                            </p>
                          </div>
                          <div>
                            <span className="label">Timezone</span>
                            <p style={{ fontSize: '13px', marginTop: '4px' }}>{client.timezone}</p>
                          </div>
                          <div>
                            <span className="label">Notifications</span>
                            <p style={{ fontSize: '13px', marginTop: '4px' }}>
                              {client.notification_channels?.join(', ') || '—'}
                            </p>
                          </div>
                          <div>
                            <span className="label">HubSpot ID</span>
                            <p style={{ fontSize: '13px', marginTop: '4px', color: 'var(--text-2)' }}>
                              {client.hubspot_contact_id || '—'}
                            </p>
                          </div>
                          <div>
                            <span className="label">Drive Folder</span>
                            <p style={{ fontSize: '13px', marginTop: '4px', color: 'var(--text-2)' }}>
                              {client.google_drive_folder_id ? (
                                <a href={`https://drive.google.com/drive/folders/${client.google_drive_folder_id}`} target="_blank" rel="noreferrer">
                                  Open folder
                                </a>
                              ) : '—'}
                            </p>
                          </div>
                          <div>
                            <span className="label">Briefing Times</span>
                            <p style={{ fontSize: '13px', marginTop: '4px', color: 'var(--text-2)' }}>
                              {client.briefing_time_morning} / {client.briefing_time_evening}
                            </p>
                          </div>
                        </div>
                        <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                          <a
                            href={`mailto:${client.email}`}
                            className="btn-secondary"
                            style={{ fontSize: '12px', padding: '6px 14px' }}
                          >
                            Email client
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ACTIVITY TAB */}
            {activeTab === 'activity' && (
              <div className="card">
                <span className="label" style={{ display: 'block', marginBottom: '16px' }}>Live Activity Feed</span>
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
                          <div className="flex items-center gap-8">
                            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--teal)' }}>
                              {item.clients?.name}
                            </p>
                            <span style={{ color: 'var(--text-3)', fontSize: '11px' }}>
                              {format(new Date(item.created_at), 'MMM d · h:mm a')}
                            </span>
                          </div>
                          <p style={{ fontSize: '13px', marginTop: '2px' }}>{item.summary}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>No activity yet.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function getActionEmoji(type) {
  const map = {
    email_triaged: '📥', email_drafted: '✏️', email_sent: '📤',
    calendar_checked: '📅', meeting_prepped: '📋',
    morning_briefing: '☀️', evening_debrief: '🌙', weekly_recap: '📊',
    client_message: '💬', ea_response: '🤖',
    crm_updated: '🔄', hubspot_logged: '🔶'
  }
  return map[type] || '•'
}
