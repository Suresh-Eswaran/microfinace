import { Activity, AlertTriangle, CheckCircle, Lock, Plus, RefreshCw, Search, Settings, Shield, Trash2, Unlock, UserCheck, UserX, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminApi, userApi } from '../api/adminApi';

const ROLE_BADGES = {
  ADMIN:             'badge-purple',
  BRANCH_MANAGER:    'badge-blue',
  CREDIT_OFFICER:    'badge-gold',
  LOAN_OFFICER:      'badge-green',
  COLLECTIONS_AGENT: 'badge-muted',
  CLIENT:            'badge-gold',
};

const STATUS_BADGES = {
  ACTIVE:    'badge-green',
  PENDING:   'badge-gold',
  SUSPENDED: 'badge-red',
  INACTIVE:  'badge-muted',
};

export default function Admin() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'BRANCH_MANAGER';

  const [dashboard, setDashboard] = useState(null);
  const [health, setHealth]       = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [users, setUsers]         = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading]     = useState(true);
  const [userLoading, setUserLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [tab, setTab]             = useState('overview');
  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const calls = [
        adminApi.dashboard(),
        adminApi.health(),
        adminApi.auditLogs(),
      ];
      if (isAdmin) {
        calls.push(userApi.getAll());
      }
      const results = await Promise.allSettled(calls);
      if (results[0].status === 'fulfilled') setDashboard(results[0].value);
      if (results[1].status === 'fulfilled') setHealth(results[1].value);
      if (results[2].status === 'fulfilled') setAuditLogs(Array.isArray(results[2].value) ? results[2].value : []);
      if (isAdmin && results[3]?.status === 'fulfilled') setUsers(Array.isArray(results[3].value) ? results[3].value : []);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!isAdmin) {
      setActionErr(`Access restricted: Signed in as ${currentUser?.role?.replace('_', ' ') || 'User'}. Managing system users requires an ADMIN or BRANCH MANAGER role.`);
      return;
    }
    setUserLoading(true);
    setActionErr('');
    try {
      const data = await userApi.getAll();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setActionErr(err.message || 'Access Denied: Admin privileges required.');
    } finally {
      setUserLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    setActionErr('');
    try {
      const data = await adminApi.auditLogs();
      setAuditLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setActionErr('Failed to load audit logs: ' + (err.message || 'Unknown error'));
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => { 
    fetchAll(); 
  }, []);

  const handleTabChange = (targetTab) => {
    setTab(targetTab);
    setActionMsg('');
    setActionErr('');
    if (targetTab === 'users' && users.length === 0) {
      fetchUsers();
    }
    if (targetTab === 'audit') {
      fetchAuditLogs();
    }
  };

  const handleApproveUser = async (id, name) => {
    setActionErr('');
    try {
      const updated = await userApi.approve(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: updated.status ?? 'ACTIVE' } : u));
      setActionMsg(`User #${id} (${name || 'User'}) approved and activated successfully.`);
      setTimeout(() => setActionMsg(''), 5000);
    } catch (err) {
      setActionErr(err.message);
    }
  };

  const handleUnlockUser = async (id, name) => {
    setActionErr('');
    try {
      const updated = await userApi.unlock(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: updated.status ?? 'ACTIVE' } : u));
      setActionMsg(`User #${id} (${name || 'User'}) unlocked successfully.`);
      setTimeout(() => setActionMsg(''), 5000);
    } catch (err) {
      setActionErr(err.message);
    }
  };

  const handleToggleStatus = async (user) => {
    setActionErr('');
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const updated = await userApi.setStatus(user.id, newStatus);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: updated.status ?? newStatus } : u));
      setActionMsg(`User #${user.id} status updated to ${newStatus}.`);
      setTimeout(() => setActionMsg(''), 5000);
    } catch (err) {
      setActionErr(err.message);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete user #${id} (${name})?`)) return;
    setActionErr('');
    try {
      await userApi.delete(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      setActionMsg(`User #${id} (${name}) deleted successfully.`);
      setTimeout(() => setActionMsg(''), 5000);
    } catch (err) {
      setActionErr(err.message);
    }
  };

  const healthColor = (status) =>
    status === 'UP' || status === 'OK' ? 'var(--color-primary)' :
    status === 'DEGRADED' ? 'var(--color-gold)' : 'var(--color-red)';

  const filteredUsers = users.filter(u =>
    u.fullName?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role?.toLowerCase().includes(userSearch.toLowerCase()) ||
    String(u.id).includes(userSearch)
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">System Admin</h1>
          <p className="page-subtitle">Monitor system health, audit logs, user management, and configuration</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchAll} disabled={loading} id="refresh-admin-btn">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {actionMsg && (
        <div className="alert alert-success" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={16} /> {actionMsg}
        </div>
      )}

      {actionErr && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          {actionErr}
        </div>
      )}

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
          { id: 'users',    icon: <Users size={14} />,     label: `Users (${users.length})` },
          { id: 'audit',    icon: <Shield size={14} />,    label: 'Audit Logs' },
          { id: 'config',   icon: <Settings size={14} />,  label: 'Config' },
        ].map(t => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => handleTabChange(t.id)} id={`admin-tab-${t.id}`}>
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
                { label: 'Manage & Delete Completed Clients', action: () => navigate('/clients'), color: 'var(--color-red)' },
                { label: 'Manage System Users', action: () => setTab('users'), color: 'var(--color-purple)' },
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

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="card">
          <div className="section-header" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0 }}>User Management</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                Approve, unlock, modify status, and manage system user accounts
              </p>
            </div>
            {isAdmin && (
              <button className="btn btn-ghost btn-sm" onClick={fetchUsers} disabled={userLoading}>
                <RefreshCw size={13} className={userLoading ? 'spin' : ''} /> Refresh Users
              </button>
            )}
          </div>

          {!isAdmin && (
            <div className="alert alert-warning" style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <AlertTriangle size={18} style={{ minWidth: 18, marginTop: 2 }} />
              <div>
                <strong>Role Permission Required:</strong> You are currently signed in as <strong>{currentUser?.role?.replace('_', ' ') || 'User'}</strong>.
                Viewing and modifying system users requires <strong>ADMIN</strong> or <strong>BRANCH MANAGER</strong> role.
                Please log out and sign in as <strong>Admin</strong> (<code>admin@microfin.com</code>) to manage users.
              </div>
            </div>
          )}

          {/* Search bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
            <div className="search-bar" style={{ maxWidth: 360 }}>
              <Search size={15} className="search-icon" style={{ position: 'absolute', left: 12, color: 'var(--text-muted)' }} />
              <input
                id="users-search-input"
                placeholder="Search by name, email, or role…"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
              />
            </div>
          </div>

          {userLoading ? (
            <div className="loading-overlay"><div className="spinner" /></div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon" style={{ background: 'var(--color-secondary-dim)', color: 'var(--color-secondary)' }}>
                <Users size={28} />
              </div>
              <h3>No users found</h3>
              <p>{userSearch ? 'No user matches your search filter.' : 'No users currently registered in the database.'}</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Branch</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => {
                    const roleBadge = ROLE_BADGES[u.role] ?? 'badge-muted';
                    const statusBadge = STATUS_BADGES[u.status] ?? 'badge-muted';
                    return (
                      <tr key={u.id}>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>#{u.id}</td>
                        <td style={{ fontWeight: 600 }}>{u.fullName}</td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`badge ${roleBadge}`}>{u.role}</span>
                        </td>
                        <td>{u.branch || '—'}</td>
                        <td>
                          <span className={`badge ${statusBadge} badge-dot`}>
                            {u.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            {u.status !== 'ACTIVE' && (
                              <button
                                id={`approve-user-${u.id}`}
                                className="btn btn-primary btn-sm"
                                style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                                title="Approve & Activate User"
                                onClick={() => handleApproveUser(u.id, u.fullName)}
                              >
                                <UserCheck size={13} /> Approve
                              </button>
                            )}
                            {u.status === 'SUSPENDED' && (
                              <button
                                id={`unlock-user-${u.id}`}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                                title="Unlock User Account"
                                onClick={() => handleUnlockUser(u.id, u.fullName)}
                              >
                                <Unlock size={13} /> Unlock
                              </button>
                            )}
                            {u.status === 'ACTIVE' && (
                              <button
                                id={`suspend-user-${u.id}`}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '3px 8px', fontSize: '0.75rem', color: 'var(--color-gold)' }}
                                title="Suspend User Account"
                                onClick={() => handleToggleStatus(u)}
                              >
                                <Lock size={13} /> Suspend
                              </button>
                            )}
                            <button
                              id={`delete-user-${u.id}`}
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '3px 8px', fontSize: '0.75rem', color: 'var(--color-red)' }}
                              title="Delete User"
                              onClick={() => handleDeleteUser(u.id, u.fullName)}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Audit Logs */}
      {tab === 'audit' && (
        <div className="card">
          <div className="section-header" style={{ marginBottom: 16 }}>
            <div>
              <h3>Security Audit Logs</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time immutable log of security, authentication, and administrative events</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={fetchAuditLogs} disabled={auditLoading}>
              <RefreshCw size={13} className={auditLoading ? 'animate-spin' : ''} /> {auditLoading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
          {auditLoading || loading ? (
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
                <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Details</th><th>Status</th></tr></thead>
                <tbody>
                  {auditLogs.slice(0, 100).map((log, i) => (
                    <tr key={log.id || i}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                      </td>
                      <td style={{ fontWeight: 600 }}>{log.email || (log.userId ? `#${log.userId}` : 'System')}</td>
                      <td>
                        <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                          {log.action ?? log.event ?? '—'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: 400 }}>
                        {log.details || '—'}
                      </td>
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
