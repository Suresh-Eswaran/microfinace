import { FileText } from 'lucide-react';
import { adminApi } from '../api/adminApi';

export default function Reports() {
  const actions = [
    { label: 'Analytics Custom Report', fn: () => adminApi.dashboard(), desc: 'Export a tailored analytics report' },
    { label: 'MIS Report',             fn: () => fetch('/api/portfolio/mis-report', { headers: { Authorization: `Bearer ${localStorage.getItem('mf_token')}` } }).then(r => r.text()), desc: 'Management Information System report' },
    { label: 'Weekly Insights',        fn: () => fetch('/api/analytics/weekly-insights', { headers: { Authorization: `Bearer ${localStorage.getItem('mf_token')}` } }).then(r => r.text()), desc: 'AI-generated weekly performance summary' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Export and download operational reports</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {actions.map((a, i) => (
          <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-secondary-dim)', color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{a.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.desc}</div>
              </div>
            </div>
            <button
              id={`report-btn-${i}`}
              className="btn btn-ghost btn-sm"
              onClick={async () => { try { const r = await a.fn(); alert(JSON.stringify(r).slice(0, 400)); } catch(e){ alert(e.message); } }}
            >
              Generate Report
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
