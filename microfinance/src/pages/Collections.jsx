import { AlertTriangle, CheckCircle, DollarSign, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collectionApi } from '../api/collectionApi';
import { useAuth } from '../context/AuthContext';

function RecordModal({ onClose, onSuccess, prefillEmiId }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    emiId: prefillEmiId || '',
    amountCollected: '',
    collectedBy: user?.userId || '',
    gpsLat: '',
    gpsLng: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        emiId:           Number(form.emiId),
        amountCollected: parseFloat(form.amountCollected),
        collectedBy:     Number(form.collectedBy),
        gpsLat:          form.gpsLat ? parseFloat(form.gpsLat) : null,
        gpsLng:          form.gpsLng ? parseFloat(form.gpsLng) : null,
      };
      const result = await collectionApi.record(payload);
      onSuccess(result);
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
          <h3>Record Collection</h3>
          <button className="modal-close" onClick={onClose} id="close-collection-modal"><X size={16} /></button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} id="record-collection-form" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="col-emi-id">EMI ID *</label>
              <input id="col-emi-id" className="form-input" type="number" name="emiId" value={form.emiId} onChange={handleChange} required placeholder="e.g. 101" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="col-amount">Amount Collected (₹) *</label>
              <input id="col-amount" className="form-input" type="number" name="amountCollected" value={form.amountCollected} onChange={handleChange} required min="1" step="0.01" placeholder="2500.00" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="col-by">Collected By (User ID) *</label>
            <input id="col-by" className="form-input" type="number" name="collectedBy" value={form.collectedBy} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="col-lat">GPS Latitude</label>
              <input id="col-lat" className="form-input" type="number" step="any" name="gpsLat" value={form.gpsLat} onChange={handleChange} placeholder="12.9716" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="col-lng">GPS Longitude</label>
              <input id="col-lng" className="form-input" type="number" step="any" name="gpsLng" value={form.gpsLng} onChange={handleChange} placeholder="77.5946" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button id="submit-collection-btn" type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <DollarSign size={15} />}
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Collections() {
  const [searchParams] = useSearchParams();
  const prefillEmiId   = searchParams.get('emiId') || '';
  const [overdue, setOverdue]   = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmiId, setSelectedEmiId] = useState('');
  const [tab, setTab]           = useState('overdue');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [od, dash, all] = await Promise.allSettled([
        collectionApi.overdue(),
        collectionApi.dashboard(),
        collectionApi.getAll(),
      ]);
      if (od.status   === 'fulfilled') setOverdue(Array.isArray(od.value) ? od.value : []);
      if (dash.status === 'fulfilled') setDashboard(dash.value);
      if (all.status  === 'fulfilled') setCollections(Array.isArray(all.value) ? all.value : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSuccess = () => {
    fetchData();
  };

  const statCards = [
    { label: 'Total Collected', value: dashboard?.totalCollected ? `₹${Number(dashboard.totalCollected).toLocaleString('en-IN')}` : '—', color: 'var(--color-primary)' },
    { label: 'Overdue EMIs',    value: overdue.length, color: 'var(--color-red)' },
    { label: 'Collection Rate', value: dashboard?.collectionRate ? `${dashboard.collectionRate}%` : '—', color: 'var(--color-gold)' },
    { label: 'Today\'s Target', value: dashboard?.todayTarget ? `₹${Number(dashboard.todayTarget).toLocaleString('en-IN')}` : '—', color: 'var(--color-blue)' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Collections</h1>
          <p className="page-subtitle">Track repayments and overdue EMIs</p>
        </div>
        <button id="open-record-collection-btn" className="btn btn-primary" onClick={() => { setSelectedEmiId(''); setShowModal(true); }}>
          <Plus size={16} /> Record Payment
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        {statCards.map(s => (
          <div key={s.label} className="stat-card" style={{ '--accent-color': s.color, '--accent-bg': `${s.color}20` }}>
            <span className="stat-label">{s.label}</span>
            <div className="stat-value">{loading ? <div className="skeleton" style={{ height: 28, width: 70 }} /> : s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {['overdue', 'recorded'].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} id={`collection-tab-${t}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'overdue' && overdue.length > 0 && (
              <span style={{ marginLeft: 6, background: 'var(--color-red)', color: '#fff', borderRadius: '999px', padding: '1px 7px', fontSize: '0.65rem' }}>{overdue.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Overdue EMIs */}
      {tab === 'overdue' && (
        loading ? (
          <div className="loading-overlay"><div className="spinner" /></div>
        ) : overdue.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon" style={{ background: 'var(--color-primary-dim)', color: 'var(--color-primary)' }}>
                <CheckCircle size={28} />
              </div>
              <h3>No overdue EMIs</h3>
              <p>All EMIs are up to date. Great work!</p>
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr>
                <th>EMI ID</th><th>Loan ID</th><th>Due Date</th>
                <th>Amount</th><th>Status</th><th>Action</th>
              </tr></thead>
              <tbody>
                {overdue.map(e => (
                  <tr key={e.id}>
                    <td>#{e.id}</td>
                    <td>#{e.loanId}</td>
                    <td style={{ color: 'var(--color-red)' }}>
                      <AlertTriangle size={12} style={{ marginRight: 4 }} />
                      {e.dueDate ? new Date(e.dueDate).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ fontWeight: 700 }}>₹{Number(e.emiAmount ?? 0).toLocaleString('en-IN')}</td>
                    <td><span className="badge badge-red badge-dot">Overdue</span></td>
                    <td>
                      <button
                        id={`collect-emi-${e.id}`}
                        className="btn btn-primary btn-sm"
                        onClick={() => { setSelectedEmiId(e.id); setShowModal(true); }}
                      >
                        Collect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Recorded Collections */}
      {tab === 'recorded' && (
        collections.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon" style={{ background: 'var(--color-gold-dim)', color: 'var(--color-gold)' }}>
                <DollarSign size={28} />
              </div>
              <h3>No collections recorded</h3>
              <p>Payments you record in this session will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr>
                <th>Collection ID</th><th>EMI ID</th><th>Amount</th>
                <th>Collected By</th><th>Location</th><th>Time</th>
              </tr></thead>
              <tbody>
                {collections.map(c => (
                  <tr key={c.id}>
                    <td>#{c.id}</td>
                    <td>#{c.emiId}</td>
                    <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>₹{Number(c.amountCollected).toLocaleString('en-IN')}</td>
                    <td>#{c.collectedBy}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {c.gpsLat ? `${c.gpsLat}, ${c.gpsLng}` : '—'}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {c.collectionDate ? new Date(c.collectionDate).toLocaleString() : 'Just now'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {showModal && (
        <RecordModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
          prefillEmiId={selectedEmiId || prefillEmiId}
        />
      )}
    </div>
  );
}
