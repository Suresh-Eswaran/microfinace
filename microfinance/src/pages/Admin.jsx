import { Activity, RefreshCw, Settings, Shield, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { adminApi, userApi } from '../api/adminApi';

export default function Admin() {
  const [dashboard, setDashboard] = useState(null);
  const [health, setHealth]       = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('overview');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dash, h, logs] = await Promise.allSettled([
        adminApi.dashboard(),
        adminApi.health(),
        adminApi.auditLogs(),
      ]);
      if (dash.status  === 'fulfilled') setDashboard(dash.value);
      if (h.status     === 'fulfilled') setHealth(h.value);
      if (logs.status  === 'fulfilled') setAuditLogs(Array.isArray(logs.value) ? logs.value : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const healthColor = (status) =>
    status === 'UP' || status === 'OK' ? 'var(--color-primary)' :
    status === 'DEGRADED' ? 'var(--color-gold)' : 'var(--color-red)';

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">System Admin</h1>
          <p className="page-subtitle">Monitor system health, audit logs, and configuration</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchAll} disabled={loading} id="refresh-admin-btn">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Health Cards */}
      {health && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
          {Object.entries(health).map(([key, value]) => {
            const status = typeof value === 'string' ? value : value?.status ?? 'UNKNOWN';
            const color = healthColor(status);
            return (
              <div key={key} className="stat-card" style={{ '--accent-color': color, '--accent-bg': `${color}15` }}>
                <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between' }}>
                  <span className="stat-label">{key.replace(/_/g, ' ')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
                  <span style={{ fontWeight: 700, color, fontSize: '0.9rem' }}>{status}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {[
          { id: 'overview', icon: <Activity size={14} />,  label: 'Overview' },
          { id: 'audit',    icon: <Shield size={14} />,    label: 'Audit Logs' },
          { id: 'users',    icon: <Users size={14} />,     label: 'Users' },
          { id: 'config',   icon: <Settings size={14} />,  label: 'Config' },
        ].map(t => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)} id={`admin-tab-${t.id}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card">
            <h4 style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>Dashboard Summary</h4>
            {loading ? (
              <div className="loading-overlay"><div className="spinner" /></div>
            ) : dashboard ? (
              Object.entries(dashboard).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'capitalize' }}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{String(value)}</span>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                No dashboard data. Is the backend running?
              </div>
            )}
          </div>

          <div className="card">
            <h4 style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>Quick Admin Actions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'View Integrations',  action: () => adminApi.integrations().then(d => alert(JSON.stringify(d, null, 2))), color: 'var(--color-blue)' },
                { label: 'Search Audit Logs',  action: () => setTab('audit'), color: 'var(--color-secondary)' },
                { label: 'System Health Check',action: () => adminApi.health().then(d => setHealth(d)), color: 'var(--color-primary)' },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={item.action}
                  id={`admin-action-${item.label.replace(/\s+/g,'-').toLowerCase()}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    background: 'var(--color-surface-2)', borderRadius: 10,
                    border: '1px solid var(--color-border)',
                    color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 500,
                    transition: 'all 0.15s ease', cursor: 'pointer',
                    width: '100%', textAlign: 'left',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = item.color; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs */}
      {tab === 'audit' && (
        <div className="card">
          <div className="section-header" style={{ marginBottom: 16 }}>
            <h3>Security Audit Logs</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => adminApi.auditLogs().then(d => setAuditLogs(Array.isArray(d) ? d : []))}>
              <RefreshCw size={13} /> Load
            </button>
          </div>
          {loading ? (
            <div className="loading-overlay"><div className="spinner" /></div>
          ) : auditLogs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Shield size={24} /></div>
              <h3>No audit logs</h3>
              <p>Security events will appear here.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr><th>Time</th><th>User</th><th>Action</th><th>IP</th><th>Status</th></tr></thead>
                <tbody>
                  {auditLogs.slice(0, 50).map((log, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                      </td>
                      <td>{log.userId ?? log.performedBy ?? '—'}</td>
                      <td style={{ fontWeight: 500 }}>{log.action ?? log.event ?? '—'}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{log.ipAddress ?? '—'}</td>
                      <td>
                        <span className={`badge ${log.success === false ? 'badge-red' : 'badge-green'} badge-dot`}>
                          {log.success === false ? 'Failed' : 'Success'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Users placeholder */}
      {tab === 'users' && (
        <div className="card">
          <div className="section-header"><h3>User Management</h3></div>
          <div className="empty-state">
            <div className="empty-icon" style={{ background: 'var(--color-secondary-dim)', color: 'var(--color-secondary)' }}>
              <Users size={28} />
            </div>
            <h3>User management</h3>
            <p>Approve or unlock user accounts via their User ID below.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <input id="admin-user-id-input" className="form-input" type="number" placeholder="User ID" style={{ maxWidth: 180 }} />
            <button id="admin-approve-user-btn" className="btn btn-primary btn-sm"
              onClick={async () => {
                const uid = document.getElementById('admin-user-id-input').value;
                if (!uid) return;
                try { await userApi.approve(uid); alert(`User ${uid} approved.`); } catch(e){ alert(e.message); }
              }}>
              Approve
            </button>
            <button id="admin-unlock-user-btn" className="btn btn-ghost btn-sm"
              onClick={async () => {
                const uid = document.getElementById('admin-user-id-input').value;
                if (!uid) return;
                try { await userApi.unlock(uid); alert(`User ${uid} unlocked.`); } catch(e){ alert(e.message); }
              }}>
              Unlock
            </button>
          </div>
        </div>
      )}

      {/* Config */}
      {tab === 'config' && (
        <div className="card">
          <div className="section-header"><h3>System Configuration</h3></div>
          <div style={{ color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>
            <Settings size={40} style={{ opacity: 0.3, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
            <p>System config management is available via the backend API.<br />Use <code style={{ color: 'var(--color-primary)' }}>POST /api/admin/config</code> with your parameters.</p>
          </div>
        </div>
      )}
    </div>
  );
}
