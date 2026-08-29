import { Plus, Users2, X } from 'lucide-react';
import { useState } from 'react';
import { groupApi } from '../api/adminApi';

function CreateGroupModal({ onClose, onSuccess }) {
  const [clientIds, setClientIds] = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    const ids = clientIds.split(',').map(s => Number(s.trim())).filter(Boolean);
    if (ids.length < 2) { setError('Enter at least 2 client IDs separated by commas.'); return; }
    setLoading(true);
    try {
      const group = await groupApi.create(ids);
      onSuccess(group);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Create Group (SHG / JLG)</h3>
          <button className="modal-close" onClick={onClose} id="close-group-modal"><X size={16} /></button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} id="create-group-form" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="group-client-ids">Client IDs (comma-separated) *</label>
            <input
              id="group-client-ids"
              className="form-input"
              value={clientIds}
              onChange={e => setClientIds(e.target.value)}
              placeholder="e.g. 1, 2, 3, 4, 5"
              required
            />
            <span className="form-error" style={{ color: 'var(--text-muted)' }}>Minimum 2 clients required to form a group.</span>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button id="submit-create-group" type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Plus size={15} />}
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Groups() {
  const [groups, setGroups]   = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [lookupId, setLookupId]   = useState('');
  const [lookupData, setLookupData] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLookup = async () => {
    if (!lookupId) return;
    setError(''); setLoading(true);
    try {
      const data = await groupApi.getById(lookupId);
      setLookupData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (group) => {
    setGroups(prev => [group, ...prev]);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Group Lending</h1>
          <p className="page-subtitle">Manage SHG/JLG groups, GRT and meetings</p>
        </div>
        <button id="create-group-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Create Group
        </button>
      </div>

      {/* Lookup */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h4 style={{ marginBottom: 12, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Look up Group</h4>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            id="group-lookup-id"
            className="form-input"
            type="number"
            placeholder="Enter Group ID…"
            value={lookupId}
            onChange={e => setLookupId(e.target.value)}
            style={{ maxWidth: 200 }}
          />
          <button id="group-lookup-btn" className="btn btn-secondary btn-sm" onClick={handleLookup} disabled={loading || !lookupId}>
            Look Up
          </button>
        </div>
        {error && <div className="alert alert-error" style={{ marginTop: 10 }}>{error}</div>}

        {lookupData && (
          <div style={{ marginTop: 16, background: 'var(--color-surface-2)', borderRadius: 10, padding: 16, border: '1px solid var(--color-border)' }}>
            <h4 style={{ marginBottom: 12 }}>Group #{lookupData.id ?? lookupId}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(lookupData).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 16 }}>
                  <span style={{ color: 'var(--text-muted)', minWidth: 140, fontSize: '0.82rem' }}>{k}</span>
                  <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{JSON.stringify(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Groups Created This Session */}
      {groups.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon" style={{ background: 'var(--color-secondary-dim)', color: 'var(--color-secondary)' }}>
              <Users2 size={28} />
            </div>
            <h3>No groups yet</h3>
            <p>Create a new Self Help Group or Joint Liability Group.</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginTop: 8 }}>
              <Plus size={15} /> Create Group
            </button>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead><tr>
              <th>Group ID</th><th>Clients</th><th>Status</th><th>GRT Status</th><th>Created</th>
            </tr></thead>
            <tbody>
              {groups.map(g => (
                <tr key={g.id}>
                  <td>#{g.id}</td>
                  <td>{g.clientIds?.length ?? '—'} members</td>
                  <td><span className="badge badge-blue badge-dot">{g.status ?? 'ACTIVE'}</span></td>
                  <td>{g.grtStatus ? <span className="badge badge-green badge-dot">{g.grtStatus}</span> : '—'}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{g.createdDate ? new Date(g.createdDate).toLocaleDateString() : 'Just now'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <CreateGroupModal onClose={() => setShowModal(false)} onSuccess={handleSuccess} />}
    </div>
  );
}
