import { CheckCircle2, Download, FileSpreadsheet, FileText, Layers, TrendingUp, Users, Wallet } from 'lucide-react';
import { useState } from 'react';
import { adminApi } from '../api/adminApi';
import { clientApi } from '../api/clientApi';
import { loanApi } from '../api/loanApi';
import { exportToExcel } from '../utils/excelExporter';
export default function Reports() {
  const [loadingAction, setLoadingAction] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const handleExport = async (key, fetchFn, fileName, sheetTitle) => {
    setLoadingAction(key);
    setStatusMsg('');
    setIsError(false);
    try {
      const data = await fetchFn();
      let exportData = data;
      if (typeof data === 'string') {
        try {
          exportData = JSON.parse(data);
        } catch {
          exportData = { ReportContent: data };
        }
      }
      exportToExcel(exportData, fileName, sheetTitle);
      setStatusMsg(`Successfully exported "${sheetTitle}" as an Excel spreadsheet!`);
    } catch (err) {
      setIsError(true);
      setStatusMsg(`Failed to generate report: ${err.message}`);
    } finally {
      setLoadingAction('');
    }
  };
  const reportCards = [
    {
      id: 'custom-analytics',
      label: 'Executive Analytics Report',
      desc: 'System health, KPIs, branch stats & portfolio summary',
      icon: TrendingUp,
      color: 'var(--color-primary)',
      fetchFn: () => adminApi.dashboard(),
      fileName: 'executive_analytics_report',
      title: 'Executive Analytics & KPI Report'
    },
    {
      id: 'mis-report',
      label: 'MIS Management Report',
      desc: 'Portfolio yield, PAR movement and delinquency figures',
      icon: FileSpreadsheet,
      color: 'var(--color-blue)',
      fetchFn: () => fetch('/api/portfolio/mis-report', {
        headers: { Authorization: `Bearer ${localStorage.getItem('mf_token')}` }
      }).then(r => r.json().catch(() => r.text())),
      fileName: 'mis_management_report',
      title: 'MIS Management Information System'
    },
    {
      id: 'weekly-insights',
      label: 'Weekly Strategic Insights',
      desc: 'AI performance summary & bottleneck analytics',
      icon: Layers,
      color: 'var(--color-gold)',
      fetchFn: () => fetch('/api/analytics/weekly-insights', {
        headers: { Authorization: `Bearer ${localStorage.getItem('mf_token')}` }
      }).then(r => r.json().catch(() => r.text())),
      fileName: 'weekly_insights_report',
      title: 'Weekly Performance & Insights'
    },
    {
      id: 'clients-master',
      label: 'Clients Master Directory',
      desc: 'Complete client roster with KYC & credit status',
      icon: Users,
      color: '#a855f7',
      fetchFn: () => clientApi.getAll(),
      fileName: 'clients_master_directory',
      title: 'Clients Master Register'
    },
    {
      id: 'loans-master',
      label: 'Loans & Disbursals Ledger',
      desc: 'All active and approved loan applications',
      icon: Wallet,
      color: '#06b6d4',
      fetchFn: () => loanApi.getAll(),
      fileName: 'loans_disbursals_ledger',
      title: 'Loans & Portfolio Ledger'
    },
    {
      id: 'overdue-collections',
      label: 'Overdue Collections Report',
      desc: 'Delinquent installments requiring field recovery',
      icon: FileText,
      color: 'var(--color-red)',
      fetchFn: () => loanApi.getOverdue(),
      fileName: 'overdue_collections_report',
      title: 'Delinquent Collections Ledger'
    },
  ];
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Exports</h1>
          <p className="page-subtitle">Generate and download operational reports in Microsoft Excel (.xlsx / .xls) format</p>
        </div>
      </div>

      {statusMsg && (
        <div className={`alert ${isError ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: 20 }}>
          {isError ? null : <CheckCircle2 size={16} />} {statusMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {reportCards.map(item => {
          const Icon = item.icon;
          const isLoading = loadingAction === item.id;
          return (
            <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: `${item.color}15`,
                  color: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{item.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                </div>
              </div>

              <button
                id={`export-report-${item.id}`}
                className="btn btn-primary btn-sm"
                onClick={() => handleExport(item.id, item.fetchFn, item.fileName, item.title)}
                disabled={!!loadingAction}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {isLoading ? (
                  <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Generating Excel…</>
                ) : (
                  <><Download size={14} /> Export to Excel (.xlsx)</>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

