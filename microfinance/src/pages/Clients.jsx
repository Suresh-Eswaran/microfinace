import { AlertTriangle, CheckCircle, Plus, Search, ShieldCheck, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { clientApi } from '../api/clientApi';
import { useAuth } from '../context/AuthContext';

const KYC_BADGE = {
  PENDING: { cls: 'badge-gold', label: 'Pending' },
  VERIFIED: { cls: 'badge-green', label: 'Verified' },
  REJECTED: { cls: 'badge-red', label: 'Rejected' },
};

function RegisterModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', phoneNumber: '', plainAadhaar: '', panNumber: '', cibilScore: '', groupId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        cibilScore: form.cibilScore ? Number(form.cibilScore) : undefined,
        groupId: form.groupId ? Number(form.groupId) : undefined,
      };
      const client = await clientApi.register(payload);
      onSuccess(client);
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
          <h3>Register New Client</h3>
          <button className="modal-close" onClick={onClose} id="close-register-modal"><X size={16} /></button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} id="register-client-form" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="cli-name">Full Name *</label>
              <input id="cli-name" className="form-input" name="name" value={form.name} onChange={handleChange} required placeholder="Priya Sharma" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cli-phone">Phone *</label>
              <input id="cli-phone" className="form-input" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} required maxLength={10} placeholder="9876543210" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="cli-aadhaar">Aadhaar Number</label>
              <input id="cli-aadhaar" className="form-input" name="plainAadhaar" value={form.plainAadhaar} onChange={handleChange} maxLength={12} placeholder="XXXX XXXX XXXX" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cli-pan">PAN Number</label>
              <input id="cli-pan" className="form-input" name="panNumber" value={form.panNumber} onChange={handleChange} maxLength={10} placeholder="ABCDE1234F" style={{ textTransform: 'uppercase' }} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="cli-cibil">CIBIL Score (300–900)</label>
              <input id="cli-cibil" className="form-input" type="number" name="cibilScore" value={form.cibilScore} onChange={handleChange} min={300} max={900} placeholder="750" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cli-group">Group ID</label>
              <input id="cli-group" className="form-input" type="number" name="groupId" value={form.groupId} onChange={handleChange} placeholder="Optional" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button id="submit-register-client" type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Plus size={15} />}
              Register Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteClientModal({ client, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setError('');
    setLoading(true);
    try {
      await clientApi.delete(client.id);
      onSuccess(client.id, client.name);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-red)'
            }}>
              <AlertTriangle size={18} />
            </div>
            <h3 style={{ margin: 0, color: 'var(--color-red)' }}>Delete Client Profile</h3>
          </div>
          <button className="modal-close" onClick={onClose} id="close-delete-modal"><X size={16} /></button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
          <p style={{ margin: '0 0 12px 0' }}>
            Are you sure you want to delete client <strong style={{ color: 'var(--text-primary)' }}>{client.name}</strong> (Client ID: <code>#{client.id}</code>, Phone: <code>{client.phoneNumber}</code>)?
          </p>
          <div style={{
            background: 'var(--color-surface-2)',
            padding: '12px 14px',
            borderRadius: 8,
            borderLeft: '3px solid var(--color-primary)',
            fontSize: '0.82rem'
          }}>
            <strong>Policy Check:</strong> Client deletion is permitted for completed clients (where all loans are <code>CLOSED</code> / <code>REJECTED</code> or client has no active loans). Active loans in progress will be protected.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            id="confirm-delete-client-btn"
            type="button"
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={loading}
            style={{
              background: 'var(--color-red)',
              color: '#fff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            {loading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Trash2 size={15} />}
            Delete Client
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Clients() {
  const { isCollectionAgent, isAdmin, isBranchManager } = useAuth();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [lookupId, setLookupId] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchAllClients = async () => {
      setLoading(true);
      try {
        const data = await clientApi.getAll();
        setClients(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAllClients();
  }, []);

  const lookupClient = async () => {
    if (!lookupId) return;
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const client = await clientApi.getById(lookupId);
      setClients([client]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = client => {
    setClients(prev => [client, ...prev]);
    setSuccessMsg(`Client ${client.name} registered successfully.`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleDeleteSuccess = (deletedId, clientName) => {
    setClients(prev => prev.filter(c => c.id !== deletedId));
    setSuccessMsg(`Client #${deletedId} (${clientName}) and associated completed records deleted successfully.`);
    setTimeout(() => setSuccessMsg(''), 6000);
  };

  const filtered = clients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phoneNumber?.includes(search) ||
    String(c.id).includes(search)
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">Manage borrower profiles, KYC, and completed client lifecycle</p>
        </div>
        {!isCollectionAgent && (
          <button id="open-register-client-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Register Client
          </button>
        )}
      </div>

      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}

      {/* Lookup by ID */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h4 style={{ marginBottom: 12, color: 'var(--text-secondary)' }}>Look up a client by ID</h4>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            id="client-id-lookup-input"
            className="form-input"
            type="number"
            placeholder="Enter Client ID…"
            value={lookupId}
            onChange={e => setLookupId(e.target.value)}
            style={{ maxWidth: 240 }}
          />
          <button id="client-lookup-btn" className="btn btn-secondary" onClick={lookupClient} disabled={loading || !lookupId}>
            <Search size={15} /> Look Up
          </button>
        </div>
        {error && <div className="alert alert-error" style={{ marginTop: 12 }}>{error}</div>}
      </div>

      {/* Search */}
      {clients.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
          <div className="search-bar">
            <Search size={15} className="search-icon" style={{ position: 'absolute', left: 12, color: 'var(--text-muted)' }} />
            <input
              id="clients-search-input"
              placeholder="Search by name, phone or ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-overlay"><div className="spinner" /></div>
      ) : clients.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon" style={{ background: 'var(--color-primary-dim)', color: 'var(--color-primary)' }}>
              <ShieldCheck size={28} />
            </div>
            <h3>No clients found</h3>
            <p>Register a new client to get started.</p>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>PAN</th>
                <th>CIBIL Score</th>
                <th>KYC Status</th>
                <th>Group</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const kyc = KYC_BADGE[c.kycStatus] ?? { cls: 'badge-muted', label: c.kycStatus };
                return (
                  <tr key={c.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>#{c.id}</td>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.phoneNumber}</td>
                    <td>{c.panNumber || '—'}</td>
                    <td>
                      {c.cibilScore ? (
                        <span style={{ color: c.cibilScore >= 700 ? 'var(--color-primary)' : c.cibilScore >= 550 ? 'var(--color-gold)' : 'var(--color-red)', fontWeight: 700 }}>
                          {c.cibilScore}
                        </span>
                      ) : '—'}
                    </td>
                    <td><span className={`badge ${kyc.cls} badge-dot`}>{kyc.label}</span></td>
                    <td>{c.groupId ? `#${c.groupId}` : '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {c.createdDate ? new Date(c.createdDate).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <Link to={`/clients/${c.id}`} className="btn btn-ghost btn-sm" id={`view-client-${c.id}`}>
                          View
                        </Link>
                        {(isAdmin || isBranchManager) && (
                          <button
                            id={`delete-client-${c.id}`}
                            className="btn btn-ghost btn-sm"
                            title="Delete Client Profile"
                            onClick={() => setClientToDelete(c)}
                            style={{ color: 'var(--color-red)', padding: '4px 8px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <RegisterModal onClose={() => setShowModal(false)} onSuccess={handleSuccess} />}
      {clientToDelete && (
        <DeleteClientModal
          client={clientToDelete}
          onClose={() => setClientToDelete(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}
