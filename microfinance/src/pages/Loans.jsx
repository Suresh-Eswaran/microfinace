import { AlertTriangle, CheckCircle, Filter, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loanApi } from '../api/loanApi';
import { useAuth } from '../context/AuthContext';

const STATUS_BADGE = {
  SUBMITTED:  'badge-blue',
  APPROVED:   'badge-green',
  REJECTED:   'badge-red',
  DISBURSED:  'badge-purple',
  CLOSED:     'badge-muted',
  NPA:        'badge-red',
  WRITTEN_OFF:'badge-muted',
};

const STATUSES = ['ALL', 'SUBMITTED', 'APPROVED', 'DISBURSED', 'REJECTED', 'CLOSED'];

function DeleteLoanModal({ loan, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleDelete = async () => {
    setError('');
    setLoading(true);
    try {
      await loanApi.delete(loan.id);
      onSuccess(loan.id);
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
            <h3 style={{ margin: 0, color: 'var(--color-red)' }}>Delete Loan Record</h3>
          </div>
          <button className="modal-close" onClick={onClose} id="close-delete-loan-modal"><X size={16} /></button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
          <p style={{ margin: '0 0 12px 0' }}>
            Are you sure you want to delete Loan <strong style={{ color: 'var(--text-primary)' }}>#{loan.id}</strong> (Amount: <code>₹{Number(loan.amountRequested).toLocaleString('en-IN')}</code>, Status: <code>{loan.status}</code>, Client: <code>#{loan.clientId}</code>)?
          </p>
          <div style={{
            background: 'var(--color-surface-2)',
            padding: '12px 14px',
            borderRadius: 8,
            borderLeft: '3px solid var(--color-primary)',
            fontSize: '0.82rem'
          }}>
            <strong>Note:</strong> Deleting this loan will cleanly remove its EMI schedules, repayment logs, and related deliberation records.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            id="confirm-delete-loan-btn"
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
            Delete Loan
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Loans() {
  const { isCollectionAgent, isAdmin, isBranchManager } = useAuth();
  const [loans, setLoans]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilter] = useState('ALL');
  const [lookupId, setLookupId]   = useState('');
  const [loanToDelete, setLoanToDelete] = useState(null);
  const [error, setError]         = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllLoans = async () => {
      setLoading(true);
      try {
        const data = await loanApi.getAll();
        setLoans(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAllLoans();
  }, []);

  const lookupLoan = async () => {
    if (!lookupId) return;
    setError(''); 
    setSuccessMsg('');
    setLoading(true);
    try {
      const data = await loanApi.getById(lookupId);
      const loan = data.loanApplication ?? data;
      setLoans([loan]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const lookupByClient = async () => {
    if (!lookupId) return;
    setError(''); 
    setSuccessMsg('');
    setLoading(true);
    try {
      const data = await loanApi.getByClient(lookupId);
      setLoans(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSuccess = (deletedId) => {
    setLoans(prev => prev.filter(l => l.id !== deletedId));
    setSuccessMsg(`Loan #${deletedId} and associated schedules deleted successfully.`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const filtered = loans.filter(l => {
    const matchStatus = filterStatus === 'ALL' || l.status === filterStatus;
    const matchSearch =
      String(l.id).includes(search) ||
      String(l.clientId).includes(search) ||
      l.purpose?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Loan Applications</h1>
          <p className="page-subtitle">Search and manage the loan lifecycle</p>
        </div>
        {!isCollectionAgent && (
          <Link to="/loans/apply" id="new-loan-application-btn" className="btn btn-primary">
            <Plus size={16} /> New Application
          </Link>
        )}
      </div>

      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}

      {/* Lookup Panel */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h4 style={{ marginBottom: 12, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Lookup</h4>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            id="loan-lookup-id"
            className="form-input"
            type="number"
            placeholder="Enter Loan ID or Client ID…"
            value={lookupId}
            onChange={e => setLookupId(e.target.value)}
            style={{ maxWidth: 260 }}
          />
          <button id="lookup-by-loan-id-btn" className="btn btn-secondary btn-sm" onClick={lookupLoan} disabled={loading || !lookupId}>
            <Search size={14} /> By Loan ID
          </button>
          <button id="lookup-by-client-id-btn" className="btn btn-ghost btn-sm" onClick={lookupByClient} disabled={loading || !lookupId}>
            By Client ID
          </button>
        </div>
        {error && <div className="alert alert-error" style={{ marginTop: 12 }}>{error}</div>}
      </div>

      {/* Filters */}
      {loans.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-bar" style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              id="loans-search-input"
              placeholder="Search loans…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {STATUSES.map(s => (
              <button
                key={s}
                id={`filter-status-${s.toLowerCase()}`}
                className={`btn btn-sm ${filterStatus === s ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => setFilter(s)}
              >
                {s === 'ALL' ? <><Filter size={13} /> All</> : s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="loading-overlay"><div className="spinner" /></div>
      ) : loans.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon" style={{ background: 'var(--color-blue-dim)', color: 'var(--color-blue)' }}>
              <Plus size={28} />
            </div>
            <h3>No loans found</h3>
            <p>Create a new application to get started.</p>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Loan ID</th><th>Client ID</th><th>Amount</th>
                <th>Purpose</th><th>Tenure</th><th>Rate %</th>
                <th>Status</th><th>Applied</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} onClick={() => navigate(`/loans/${l.id}`)} style={{ cursor: 'pointer' }}>
                  <td>#{l.id}</td>
                  <td>
                    <Link to={`/clients/${l.clientId}`} style={{ color: 'var(--color-primary)' }} onClick={e => e.stopPropagation()}>
                      #{l.clientId}
                    </Link>
                  </td>
                  <td style={{ fontWeight: 700 }}>₹{Number(l.amountRequested).toLocaleString('en-IN')}</td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.purpose}</td>
                  <td>{l.tenureMonths}m</td>
                  <td>{l.annualInterestRate}%</td>
                  <td><span className={`badge ${STATUS_BADGE[l.status] ?? 'badge-muted'} badge-dot`}>{l.status}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    {l.appliedDate ? new Date(l.appliedDate).toLocaleDateString() : '—'}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <Link to={`/loans/${l.id}`} className="btn btn-ghost btn-sm" id={`view-loan-${l.id}`}>View</Link>
                      {(isAdmin || isBranchManager) && (
                        <button
                          id={`delete-loan-${l.id}`}
                          className="btn btn-ghost btn-sm"
                          title="Delete Loan"
                          onClick={() => setLoanToDelete(l)}
                          style={{ color: 'var(--color-red)', padding: '4px 8px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', borderTop: '1px solid var(--color-border)' }}>
            Showing {filtered.length} of {loans.length} records
          </div>
        </div>
      )}

      {loanToDelete && (
        <DeleteLoanModal
          loan={loanToDelete}
          onClose={() => setLoanToDelete(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}
