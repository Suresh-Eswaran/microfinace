import { AlertTriangle, Download, FileSpreadsheet, RefreshCw, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { complianceApi } from '../api/adminApi';
import { exportToExcel } from '../utils/excelExporter';

export default function Compliance() {
  const [kycReminders, setKycReminders] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');
  const [exportMsg, setExportMsg] = useState('');
  const [tab, setTab] = useState('alerts');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kyc, cal] = await Promise.allSettled([
        complianceApi.kycReminders(),
        complianceApi.alerts(),
      ]);
      if (kyc.status === 'fulfilled') setKycReminders(Array.isArray(kyc.value) ? kyc.value : []);
      if (cal.status === 'fulfilled') setAlerts(Array.isArray(cal.value) ? cal.value : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const doExport = async (type) => {
    setExporting(type); setExportMsg('');
    try {
      let result;
      let title = '';
      if (type === 'cibil') {
        result = await complianceApi.cibilExport();
        title = 'CIBIL Credit Bureau Report';
      } else if (type === 'rbi') {
        result = await complianceApi.rbiExport();
        title = 'RBI Regulatory Compliance Report';
      } else if (type === 'mfin') {
        result = await complianceApi.mfinReport();
        title = 'MFIN Network Return Report';
      }

      // Export directly to styled Excel format
      exportToExcel(result, `${type}_report`, title);

      setExportMsg(`${type.toUpperCase()} report generated & downloaded as Excel spreadsheet successfully!`);
    } catch (err) {
      setExportMsg(`Export failed: ${err.message}`);
    } finally {
      setExporting('');
    }
  };

  const exportCurrentTable = () => {
    if (tab === 'alerts') {
      exportToExcel(alerts, 'compliance_alerts', 'Compliance Alerts & Deadlines');
    } else {
      exportToExcel(kycReminders, 'kyc_reminders', 'Pending Client KYC Reminders');
    }
  };

  const exportActions = [
    { id: 'cibil', label: 'CIBIL Export', desc: 'Credit bureau Excel report', color: 'var(--color-primary)' },
    { id: 'rbi', label: 'RBI Report', desc: 'Reserve Bank of India Excel return', color: 'var(--color-blue)' },
    { id: 'mfin', label: 'MFIN Report', desc: 'MFIN Network Excel submission', color: 'var(--color-gold)' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Compliance</h1>
          <p className="page-subtitle">Regulatory exports, KYC reminders and compliance calendar</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchData} id="refresh-compliance-btn">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Export Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {exportActions.map(action => (
          <div
            key={action.id}
            className="card"
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${action.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: action.color }}>
                <ShieldCheck size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{action.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{action.desc}</div>
              </div>
            </div>
            <button
              id={`export-${action.id}-btn`}
              className="btn btn-ghost btn-sm"
              onClick={() => doExport(action.id)}
              disabled={!!exporting}
            >
              {exporting === action.id ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <Download size={13} />}
              {exporting === action.id ? 'Exporting…' : 'Export'}
            </button>
          </div>
        ))}
      </div>

      {exportMsg && (
        <div className={`alert ${exportMsg.startsWith('Export failed') ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: 16 }}>
          {exportMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {['alerts', 'kyc-reminders'].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} id={`compliance-tab-${t.replace('-', '')}`}>
            {t === 'alerts' ? 'Compliance Alerts' : 'KYC Reminders'}
            {t === 'kyc-reminders' && kycReminders.length > 0 && (
              <span style={{ marginLeft: 6, background: 'var(--color-gold)', color: '#000', borderRadius: '999px', padding: '1px 7px', fontSize: '0.65rem', fontWeight: 700 }}>
                {kycReminders.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="spinner" /></div>
      ) : tab === 'alerts' ? (
        alerts.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon" style={{ background: 'var(--color-primary-dim)', color: 'var(--color-primary)' }}>
                <ShieldCheck size={28} />
              </div>
              <h3>No compliance alerts</h3>
              <p>You're all caught up on regulatory requirements.</p>
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Title</th><th>Due Date</th><th>Category</th><th>Priority</th></tr></thead>
              <tbody>
                {alerts.map((a, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{a.title ?? a.event ?? `Alert ${i + 1}`}</td>
                    <td>{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '—'}</td>
                    <td>{a.category ?? '—'}</td>
                    <td>
                      <span className={`badge ${a.priority === 'HIGH' ? 'badge-red' : a.priority === 'MEDIUM' ? 'badge-gold' : 'badge-muted'} badge-dot`}>
                        {a.priority ?? 'NORMAL'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* KYC Reminders */
        kycReminders.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon" style={{ background: 'var(--color-primary-dim)', color: 'var(--color-primary)' }}>
                <ShieldCheck size={28} />
              </div>
              <h3>No KYC reminders</h3>
              <p>All client KYC is up to date.</p>
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr>
                <th>Client ID</th><th>Name</th><th>Phone</th><th>KYC Status</th><th>Registered</th>
              </tr></thead>
              <tbody>
                {kycReminders.map(c => (
                  <tr key={c.id}>
                    <td>#{c.id}</td>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.phoneNumber}</td>
                    <td><span className="badge badge-gold badge-dot"><AlertTriangle size={10} /> {c.kycStatus}</span></td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {c.createdDate ? new Date(c.createdDate).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
