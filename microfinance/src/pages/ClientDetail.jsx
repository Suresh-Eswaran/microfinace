import { ArrowLeft, BarChart2, CreditCard, FileText, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { clientApi } from '../api/clientApi';
import { loanApi } from '../api/loanApi';
import { useAuth } from '../context/AuthContext';

const KYC_BADGE = {
  PENDING:  { cls: 'badge-gold',  label: 'Pending' },
  VERIFIED: { cls: 'badge-green', label: 'Verified' },
  REJECTED: { cls: 'badge-red',   label: 'Rejected' },
};

const LOAN_STATUS_BADGE = {
  SUBMITTED: 'badge-blue', APPROVED: 'badge-green', REJECTED: 'badge-red',
  DISBURSED: 'badge-purple', CLOSED: 'badge-muted', NPA: 'badge-red',
};

export default function ClientDetail() {
  const { id } = useParams();
  const { isAdmin, isBranchManager, isCreditOfficer, isLoanOfficer } = useAuth();
  const [client, setClient]   = useState(null);
  const [loans, setLoans]     = useState([]);
  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [tab, setTab]         = useState('overview');
  const [assessing, setAssessing] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
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
    try {
      const r = await clientApi.creditReport(id);
      setReport(r);
      setTab('credit');
    } catch (err) {
      setError(err.message);
    }
  };

  const assessCredit = async () => {
    setAssessing(true);
    try {
      const updated = await clientApi.assessCredit(id);
      setClient(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setAssessing(false);
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

  if (loading) return <div className="loading-overlay" style={{ minHeight: 400 }}><div className="spinner" /></div>;
  if (error)   return <div className="alert alert-error">{error}</div>;
  if (!client) return null;

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
        <div style={{ display: 'flex', gap: 10 }}>
          <span className={`badge ${kyc.cls} badge-dot`}>{kyc.label}</span>
          {client.kycStatus === 'PENDING' && (isAdmin || isBranchManager || isCreditOfficer || isLoanOfficer) && (
            <button className="btn btn-primary btn-sm" onClick={approveKyc}>
               Approve KYC
            </button>
          )}
          <button id="assess-credit-btn" className="btn btn-secondary btn-sm" onClick={assessCredit} disabled={assessing}>
            <BarChart2 size={14} /> {assessing ? 'Assessing…' : 'Assess Credit'}
          </button>
          <button id="view-credit-report-btn" className="btn btn-ghost btn-sm" onClick={fetchReport}>
            <FileText size={14} /> Credit Report
          </button>
          <Link to={`/loans/apply?clientId=${client.id}`} className="btn btn-primary btn-sm" id="apply-loan-for-client">
            <CreditCard size={14} /> Apply Loan
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {['overview', 'loans', 'credit'].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} id={`client-tab-${t}`}>
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
              ['Full Name',    client.name],
              ['Phone',        client.phoneNumber],
              ['PAN Number',   client.panNumber || '—'],
              ['Group ID',     client.groupId ? `#${client.groupId}` : '—'],
              ['Registered',   client.createdDate ? new Date(client.createdDate).toLocaleString() : '—'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
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
            <Link to={`/loans/apply?clientId=${client.id}`} className="btn btn-primary btn-sm">+ New Loan</Link>
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
            <button className="btn btn-ghost btn-sm" onClick={fetchReport}><ShieldCheck size={14} /> Refresh</button>
          </div>
          {!report ? (
            <div className="empty-state">
              <div className="empty-icon"><FileText size={24} /></div>
              <h3>No report loaded</h3>
              <p>Click "Credit Report" to fetch the latest data.</p>
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
    </div>
  );
}
