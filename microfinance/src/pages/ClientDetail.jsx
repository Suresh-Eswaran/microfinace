import { AlertTriangle, ArrowLeft, BarChart2, CheckCircle, CreditCard, Download, FileText, RefreshCw, Shield, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { clientApi } from '../api/clientApi';
import { loanApi } from '../api/loanApi';
import { useAuth } from '../context/AuthContext';

const KYC_BADGE = {
  PENDING: { cls: 'badge-gold', label: 'Pending' },
  VERIFIED: { cls: 'badge-green', label: 'Verified' },
  REJECTED: { cls: 'badge-red', label: 'Rejected' },
};

const LOAN_STATUS_BADGE = {
  SUBMITTED: 'badge-blue', APPROVED: 'badge-green', REJECTED: 'badge-red',
  DISBURSED: 'badge-purple', CLOSED: 'badge-muted', NPA: 'badge-red',
};

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isBranchManager, isCreditOfficer, isLoanOfficer, isCollectionAgent } = useAuth();
  const [client, setClient] = useState(null);
  const [loans, setLoans] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview');
  const [assessing, setAssessing] = useState(false);
  const [fetchingReport, setFetchingReport] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadMsg, setDownloadMsg] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const [clientData, loanData] = await Promise.all([
          clientApi.getById(id),
          loanApi.getByClient(id).catch(() => []),
        ]);
        setClient(clientData);
        setLoans(Array.isArray(loanData) ? loanData : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const fetchReport = async () => {
    setFetchingReport(true);
    setError('');
    try {
      const r = await clientApi.creditReport(id);
      setReport(r);
      setTab('credit');
    } catch (err) {
      setError(err.message);
    } finally {
      setFetchingReport(false);
    }
  };

  const downloadReport = async () => {
    setDownloading(true);
    setDownloadMsg('');
    try {
      const blob = await clientApi.downloadCreditReport(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `credit-report-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setDownloadMsg('PDF downloaded successfully!');
      setTimeout(() => setDownloadMsg(''), 4000);
    } catch (err) {
      setError('Download failed: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const assessCredit = async () => {
    setAssessing(true);
    setError('');
    try {
      const updated = await clientApi.assessCredit(id);
      setClient(updated);
      // Auto update report data
      const r = await clientApi.creditReport(id).catch(() => null);
      if (r) setReport(r);
    } catch (err) {
      setError(err.message);
    } finally {
      setAssessing(false);
    }
  };

  const handleTabChange = (targetTab) => {
    setTab(targetTab);
    setError('');
    if (targetTab === 'credit' && !report && !fetchingReport) {
      fetchReport();
    }
  };

  const approveKyc = async () => {
    try {
      const updated = await clientApi.update(id, { ...client, kycStatus: 'VERIFIED' });
      setClient(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteClient = async () => {
    setDeleteError('');
    setDeleteLoading(true);
    try {
      await clientApi.delete(id);
      navigate('/clients');
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <div className="loading-overlay" style={{ minHeight: 400 }}><div className="spinner" /></div>;
  if (!client) return (
    <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
      <p style={{ color: 'var(--color-red)', marginBottom: 16 }}>{error || 'Client not found'}</p>
      <Link to="/clients" className="btn btn-primary btn-sm">Back to Clients</Link>
    </div>
  );

  const kyc = KYC_BADGE[client.kycStatus] ?? { cls: 'badge-muted', label: client.kycStatus };
  const cibilColor = client.cibilScore >= 700 ? 'var(--color-primary)' : client.cibilScore >= 550 ? 'var(--color-gold)' : 'var(--color-red)';

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/clients" className="btn btn-ghost btn-sm" id="back-to-clients">
            <ArrowLeft size={15} /> Back
          </Link>
          <div>
            <h1 className="page-title">{client.name}</h1>
            <p className="page-subtitle">Client ID #{client.id} · {client.phoneNumber}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className={`badge ${kyc.cls} badge-dot`}>{kyc.label}</span>
          {client.kycStatus === 'PENDING' && (isAdmin || isBranchManager || isCreditOfficer || isLoanOfficer) && (
            <button className="btn btn-primary btn-sm" onClick={approveKyc}>
              Approve KYC
            </button>
          )}
          <button id="assess-credit-btn" className="btn btn-secondary btn-sm" onClick={assessCredit} disabled={assessing}>
            <BarChart2 size={14} /> {assessing ? 'Assessing…' : 'Assess Credit'}
          </button>
          <button id="view-credit-report-btn" className="btn btn-ghost btn-sm" onClick={fetchReport} disabled={fetchingReport}>
            <FileText size={14} /> {fetchingReport ? 'Loading…' : 'Credit Report'}
          </button>
          {!isCollectionAgent && (
            <Link to={`/loans/apply?clientId=${client.id}`} className="btn btn-primary btn-sm" id="apply-loan-for-client">
              <CreditCard size={14} /> Apply Loan
            </Link>
          )}
          {(isAdmin || isBranchManager) && (
            <button
              id="delete-client-detail-btn"
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--color-red)', borderColor: 'rgba(239,68,68,0.2)' }}
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {['overview', 'loans', 'credit'].map(t => (
          <button
            key={t}
            className={`tab-btn ${tab === t ? 'active' : ''}`}
            onClick={() => handleTabChange(t)}
            id={`client-tab-${t}`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card">
            <h4 style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>Personal Information</h4>
            {[
              ['Full Name', client.name],
              ['Phone', client.phoneNumber],
              ['PAN Number', client.panNumber || '—'],
              ['Group ID', client.groupId ? `#${client.groupId}` : '—'],
              ['Registered', client.createdDate ? new Date(client.createdDate).toLocaleString() : '—'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.9rem' }}>{value}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <h4 style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>Credit Profile</h4>
            {/* CIBIL Score Gauge */}
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'Outfit', color: cibilColor, lineHeight: 1 }}>
                {client.cibilScore ?? '—'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6 }}>CIBIL Score</div>
              <div style={{ marginTop: 12 }}>
                <div style={{ height: 8, borderRadius: 4, background: 'var(--color-surface-2)', overflow: 'hidden', maxWidth: 240, margin: '0 auto' }}>
                  <div style={{
                    height: '100%',
                    width: `${client.cibilScore ? ((client.cibilScore - 300) / 600) * 100 : 0}%`,
                    background: cibilColor,
                    borderRadius: 4,
                    transition: 'width 1s ease',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 240, margin: '4px auto 0', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                  <span>300</span><span>900</span>
                </div>
              </div>
            </div>
            <div className="divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>KYC Status</span>
              <span className={`badge ${kyc.cls}`}>{kyc.label}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Loans</span>
              <span style={{ fontWeight: 600 }}>{loans.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Loans Tab */}
      {tab === 'loans' && (
        <div className="card">
          <div className="section-header">
            <h3>Loan History</h3>
            {!isCollectionAgent && (
              <Link to={`/loans/apply?clientId=${client.id}`} className="btn btn-primary btn-sm">+ New Loan</Link>
            )}
          </div>
          {loans.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><CreditCard size={24} /></div>
              <h3>No loans found</h3>
              <p>This client has no loan applications yet.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr>
                  <th>Loan ID</th><th>Amount</th><th>Purpose</th>
                  <th>Tenure</th><th>Rate</th><th>Status</th><th>Applied</th><th></th>
                </tr></thead>
                <tbody>
                  {loans.map(l => (
                    <tr key={l.id}>
                      <td>#{l.id}</td>
                      <td style={{ fontWeight: 600 }}>₹{l.amountRequested?.toLocaleString('en-IN')}</td>
                      <td>{l.purpose}</td>
                      <td>{l.tenureMonths}m</td>
                      <td>{l.annualInterestRate}%</td>
                      <td><span className={`badge ${LOAN_STATUS_BADGE[l.status] ?? 'badge-muted'} badge-dot`}>{l.status}</span></td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {l.appliedDate ? new Date(l.appliedDate).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <Link to={`/loans/${l.id}`} className="btn btn-ghost btn-sm" id={`view-loan-${l.id}`}>View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Credit Report Tab */}
      {tab === 'credit' && (
        <div className="card">
          <div className="section-header">
            <h3>Credit Report</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={fetchReport} disabled={fetchingReport}>
                <RefreshCw size={14} className={fetchingReport ? 'spin' : ''} /> Refresh
              </button>
              <button
                id="download-credit-report-btn"
                className="btn btn-primary btn-sm"
                onClick={downloadReport}
                disabled={downloading}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {downloading
                  ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  : <Download size={14} />}
                {downloading ? 'Generating…' : 'Download PDF'}
              </button>
            </div>
          </div>
          {downloadMsg && (
            <div className="alert" style={{
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.3)',
              color: 'var(--color-primary)',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 16,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <CheckCircle size={15} /> {downloadMsg}
            </div>
          )}
          {fetchingReport ? (
            <div className="loading-overlay" style={{ minHeight: 200 }}><div className="spinner" /></div>
          ) : !report ? (
            <div className="empty-state">
              <div className="empty-icon"><FileText size={24} /></div>
              <h3>No report loaded</h3>
              <p>Click "Credit Report" or "Refresh" to fetch the latest data.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(report).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'capitalize' }}>
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{String(value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Client Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowDeleteModal(false)}>
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
              <button className="modal-close" onClick={() => setShowDeleteModal(false)} id="close-delete-modal"><X size={16} /></button>
            </div>

            {deleteError && (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>
                {deleteError}
              </div>
            )}

            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
              <p style={{ margin: '0 0 12px 0' }}>
                Are you sure you want to permanently delete <strong style={{ color: 'var(--text-primary)' }}>{client.name}</strong> (Client ID: <code>#{client.id}</code>)?
              </p>
              <div style={{
                background: 'var(--color-surface-2)',
                padding: '12px 14px',
                borderRadius: 8,
                borderLeft: '3px solid var(--color-primary)',
                fontSize: '0.82rem'
              }}>
                <strong>Policy Check:</strong> Client deletion is allowed once all loan processes are completed (loans are <code>CLOSED</code> / <code>REJECTED</code>, or client has no loans). Active loans in progress are protected and will prevent deletion.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>
                Cancel
              </button>
              <button
                id="confirm-delete-client-detail-btn"
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteClient}
                disabled={deleteLoading}
                style={{
                  background: 'var(--color-red)',
                  color: '#fff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {deleteLoading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Trash2 size={15} />}
                Delete Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
