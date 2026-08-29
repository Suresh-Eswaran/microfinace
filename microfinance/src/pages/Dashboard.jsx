import { AlertTriangle, BarChart2, CheckCircle, CreditCard, DollarSign, RefreshCw, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { adminApi } from '../api/adminApi';
import { collectionApi } from '../api/collectionApi';
import { portfolioApi } from '../api/portfolioApi';
import { useAuth } from '../context/AuthContext';

// Fallback data for when backend is unreachable
const MOCK_TREND = [
  { month: 'Mar', disbursed: 4.2, collected: 3.8 },
  { month: 'Apr', disbursed: 5.1, collected: 4.5 },
  { month: 'May', disbursed: 4.8, collected: 4.6 },
  { month: 'Jun', disbursed: 6.2, collected: 5.8 },
  { month: 'Jul', disbursed: 5.9, collected: 5.6 },
  { month: 'Aug', disbursed: 7.1, collected: 6.8 },
];

const MOCK_PAR = [
  { name: 'Current', value: 72, color: '#10b981' },
  { name: 'PAR 1-30', value: 14, color: '#f59e0b' },
  { name: 'PAR 31-60', value: 8,  color: '#ef4444' },
  { name: 'PAR 60+',  value: 6,  color: '#6366f1' },
];

const CUSTOM_TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 14px' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, fontSize: '0.85rem', fontWeight: 600 }}>
          {p.name}: ₹{p.value}L
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats]       = useState(null);
  const [par, setPar]           = useState(null);
  const [colDash, setColDash]   = useState(null);
  const [overdue, setOverdue]   = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [adminData, parData, colData, overdueData] = await Promise.allSettled([
        adminApi.dashboard(),
        portfolioApi.par(),
        collectionApi.dashboard(),
        collectionApi.overdue(),
      ]);
      if (adminData.status === 'fulfilled') setStats(adminData.value);
      if (parData.status   === 'fulfilled') setPar(parData.value);
      if (colData.status   === 'fulfilled') setColDash(colData.value);
      if (overdueData.status === 'fulfilled') setOverdue(overdueData.value?.slice(0, 5) ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const statCards = [
    {
      label: 'Total Portfolio',
      value: stats?.totalPortfolioValue ? `₹${(stats.totalPortfolioValue/100000).toFixed(1)}L` : '₹—',
      icon: <DollarSign size={20} />,
      accentColor: 'var(--color-primary)',
      accentBg: 'var(--color-primary-dim)',
      sub: 'Active loan book',
    },
    {
      label: 'Active Loans',
      value: stats?.activeLoans ?? '—',
      icon: <CreditCard size={20} />,
      accentColor: 'var(--color-blue)',
      accentBg: 'var(--color-blue-dim)',
      sub: 'Disbursed accounts',
    },
    {
      label: 'Total Clients',
      value: stats?.totalClients ?? '—',
      icon: <Users size={20} />,
      accentColor: 'var(--color-secondary)',
      accentBg: 'var(--color-secondary-dim)',
      sub: 'Registered borrowers',
    },
    {
      label: 'Collection Rate',
      value: colDash?.collectionRate ? `${colDash.collectionRate}%` : '—',
      icon: <TrendingUp size={20} />,
      accentColor: 'var(--color-gold)',
      accentBg: 'var(--color-gold-dim)',
      sub: 'This month',
    },
    {
      label: 'Overdue EMIs',
      value: stats?.overdueEMIs ?? overdue.length,
      icon: <AlertTriangle size={20} />,
      accentColor: 'var(--color-red)',
      accentBg: 'var(--color-red-dim)',
      sub: 'Need attention',
    },
    {
      label: 'Pending Approvals',
      value: stats?.pendingApprovals ?? '—',
      icon: <CheckCircle size={20} />,
      accentColor: 'var(--color-cyan)',
      accentBg: 'rgba(6,182,212,0.15)',
      sub: 'Awaiting review',
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.email?.split('@')[0]} 👋
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={fetchData} id="dashboard-refresh-btn">
            <RefreshCw size={14} /> Refresh
          </button>
          <Link to="/loans/apply" className="btn btn-primary btn-sm" id="new-loan-btn">
            + New Loan
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {statCards.map(card => (
          <div
            key={card.label}
            className="stat-card"
            style={{ '--accent-color': card.accentColor, '--accent-bg': card.accentBg }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="stat-label">{card.label}</span>
              <div className="stat-icon">{card.icon}</div>
            </div>
            <div className="stat-value">
              {loading ? <div className="skeleton" style={{ height: 32, width: 80 }} /> : card.value}
            </div>
            <div className="stat-sub">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="charts-grid" style={{ marginBottom: 24 }}>
        {/* Area Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Disbursement vs Collections</div>
              <div className="chart-subtitle">Last 6 months (₹ Lakhs)</div>
            </div>
            <BarChart2 size={18} color="var(--text-muted)" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={MOCK_TREND} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradIndigo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
              <Area type="monotone" dataKey="disbursed" name="Disbursed" stroke="#10b981" strokeWidth={2} fill="url(#gradGreen)" />
              <Area type="monotone" dataKey="collected" name="Collected" stroke="#6366f1" strokeWidth={2} fill="url(#gradIndigo)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* PAR Pie */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Portfolio at Risk (PAR)</div>
              <div className="chart-subtitle">By ageing bucket</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={MOCK_PAR}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {MOCK_PAR.map((entry, index) => (
                  <Cell key={index} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [`${v}%`, '']}
                contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Overdue EMIs */}
        <div className="card">
          <div className="section-header">
            <h3 style={{ fontSize: '0.95rem' }}>Overdue EMIs</h3>
            <Link to="/collections" className="btn btn-ghost btn-sm" id="view-overdue-link">View all</Link>
          </div>
          {loading ? (
            <div className="loading-overlay"><div className="spinner" /></div>
          ) : overdue.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><CheckCircle size={24} /></div>
              <h3>All clear!</h3>
              <p>No overdue EMIs at the moment</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr>
                  <th>EMI ID</th>
                  <th>Loan ID</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr></thead>
                <tbody>
                  {overdue.map(emi => (
                    <tr key={emi.id}>
                      <td>#{emi.id}</td>
                      <td>
                        <Link to={`/loans/${emi.loanId}`} style={{ color: 'var(--color-primary)' }}>
                          #{emi.loanId}
                        </Link>
                      </td>
                      <td>{emi.dueDate ? new Date(emi.dueDate).toLocaleDateString() : '—'}</td>
                      <td>₹{emi.emiAmount?.toLocaleString('en-IN') ?? '—'}</td>
                      <td><span className="badge badge-red badge-dot">Overdue</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 style={{ fontSize: '0.95rem', marginBottom: 16 }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Register New Client',    to: '/clients',      color: 'var(--color-primary)',   icon: <Users size={16}/> },
              { label: 'Apply for Loan',         to: '/loans/apply',  color: 'var(--color-blue)',      icon: <CreditCard size={16}/> },
              { label: 'Record Collection',      to: '/collections',  color: 'var(--color-gold)',      icon: <DollarSign size={16}/> },
              { label: 'Portfolio Analytics',    to: '/portfolio',    color: 'var(--color-secondary)', icon: <BarChart2 size={16}/> },
              { label: 'Compliance Reports',     to: '/compliance',   color: 'var(--color-cyan)',      icon: <CheckCircle size={16}/> },
            ].map(action => (
              <Link
                key={action.to}
                to={action.to}
                id={`quick-action-${action.label.replace(/\s+/g, '-').toLowerCase()}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  background: 'var(--color-surface-2)',
                  borderRadius: 10,
                  border: '1px solid var(--color-border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = action.color; e.currentTarget.style.background = 'var(--color-surface-3)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface-2)'; }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${action.color}20`, color: action.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {action.icon}
                </div>
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
