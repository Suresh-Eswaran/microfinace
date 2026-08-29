import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { portfolioApi } from '../api/portfolioApi';

const CHART_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];

const TIP_STYLE = {
  contentStyle: { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 },
  labelStyle:   { color: 'var(--text-muted)' },
};

// Fallback mock data
const MOCK_EFFICIENCY = [
  { month: 'Mar', rate: 88 }, { month: 'Apr', rate: 91 }, { month: 'May', rate: 87 },
  { month: 'Jun', rate: 93 }, { month: 'Jul', rate: 89 }, { month: 'Aug', rate: 95 },
];
const MOCK_YIELD = [
  { name: 'Yield', value: 18.2 }, { name: 'Cost of Funds', value: 10.5 }, { name: 'Net Spread', value: 7.7 },
];
const MOCK_HEATMAP = [
  { region: 'North', par1: 12, par30: 6, par60: 3 },
  { region: 'South', par1: 8, par30: 4, par60: 1 },
  { region: 'East',  par1: 15, par30: 9, par60: 5 },
  { region: 'West',  par1: 10, par30: 3, par60: 2 },
];
const MOCK_OFFICERS = [
  { name: 'Amit Kumar',  disbursed: 45, collected: 43, efficiency: 96 },
  { name: 'Priya Singh', disbursed: 38, collected: 35, efficiency: 92 },
  { name: 'Rahul Dev',   disbursed: 52, collected: 48, efficiency: 92 },
  { name: 'Sunita Rao',  disbursed: 29, collected: 28, efficiency: 97 },
];

export default function Portfolio() {
  const [parSeg, setParSeg]   = useState(null);
  const [efficiency, setEff]  = useState(MOCK_EFFICIENCY);
  const [heatmap, setHeatmap] = useState(MOCK_HEATMAP);
  const [officers, setOfficers] = useState(MOCK_OFFICERS);
  const [yieldCost, setYield] = useState(MOCK_YIELD);
  const [loading, setLoading] = useState(false);
  const [tab, setTab]         = useState('overview');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        portfolioApi.parSegmented(),
        portfolioApi.collectionEfficiency(),
        portfolioApi.delinquencyHeatmap(),
        portfolioApi.officerProductivity(),
        portfolioApi.yieldCost(),
      ]);
      if (results[0].status === 'fulfilled' && results[0].value) setParSeg(results[0].value);
      if (results[1].status === 'fulfilled' && results[1].value?.monthly) setEff(results[1].value.monthly);
      if (results[2].status === 'fulfilled' && Array.isArray(results[2].value)) setHeatmap(results[2].value);
      if (results[3].status === 'fulfilled' && Array.isArray(results[3].value)) setOfficers(results[3].value);
      if (results[4].status === 'fulfilled' && results[4].value) {
        const yc = results[4].value;
        setYield([
          { name: 'Yield',         value: yc.portfolioYield ?? 18.2 },
          { name: 'Cost of Funds', value: yc.costOfFunds    ?? 10.5 },
          { name: 'Net Spread',    value: yc.netSpread       ?? 7.7  },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Portfolio Analytics</h1>
          <p className="page-subtitle">Real-time insights into your loan portfolio performance</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchAll} disabled={loading} id="refresh-portfolio-btn">
          <RefreshCw size={14} className={loading ? 'spinner' : ''} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        {['overview', 'delinquency', 'officers', 'yield'].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} id={`portfolio-tab-${t}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Collection Efficiency */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">Collection Efficiency (%)</div>
                <div className="chart-subtitle">Monthly trend — target: 95%</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={efficiency} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[80, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...TIP_STYLE} formatter={v => [`${v}%`, 'Efficiency']} />
                <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Yield vs Cost */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">Yield vs Cost of Funds</div>
                <div className="chart-subtitle">Annual rates (%)</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={yieldCost} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 0 }}>
                <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 25]} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip {...TIP_STYLE} formatter={v => [`${v}%`, '']} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {yieldCost.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Delinquency Heatmap */}
      {tab === 'delinquency' && (
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Delinquency by Region & Bucket</div>
              <div className="chart-subtitle">PAR 1-30 / 31-60 / 60+ days overdue (%)</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={heatmap} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="region" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...TIP_STYLE} formatter={v => [`${v}%`, '']} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
              <Bar dataKey="par1"  name="PAR 1-30d"  fill="#f59e0b" radius={[4,4,0,0]} />
              <Bar dataKey="par30" name="PAR 31-60d" fill="#ef4444" radius={[4,4,0,0]} />
              <Bar dataKey="par60" name="PAR 60d+"   fill="#6366f1" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Officers Productivity */}
      {tab === 'officers' && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead><tr>
              <th>Officer</th><th>Loans Disbursed</th><th>Collected</th><th>Efficiency</th>
            </tr></thead>
            <tbody>
              {officers.map((o, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{o.name ?? o.officerName ?? `Officer ${i+1}`}</td>
                  <td>{o.disbursed ?? o.loansCount ?? '—'}</td>
                  <td>{o.collected ?? '—'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, height: 6, background: 'var(--color-surface-2)', borderRadius: 3 }}>
                        <div style={{ width: `${o.efficiency ?? 0}%`, height: '100%', background: 'var(--color-primary)', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--color-primary)', minWidth: 36 }}>{o.efficiency ?? '—'}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Yield Tab details */}
      {tab === 'yield' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {yieldCost.map((item, i) => (
            <div key={item.name} className="stat-card" style={{ '--accent-color': CHART_COLORS[i], '--accent-bg': `${CHART_COLORS[i]}20` }}>
              <span className="stat-label">{item.name}</span>
              <div className="stat-value">{item.value}%</div>
              <div className="stat-sub">Annual rate</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
