import {
  BarChart2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  Users2,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const navSections = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard',   icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/clients',     icon: <Users size={18} />,           label: 'Clients' },
      { to: '/loans',       icon: <CreditCard size={18} />,      label: 'Loans' },
      { to: '/collections', icon: <DollarSign size={18} />,      label: 'Collections' },
      { to: '/groups',      icon: <Users2 size={18} />,          label: 'Groups' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { to: '/portfolio',   icon: <BarChart2 size={18} />,       label: 'Portfolio' },
      { to: '/compliance',  icon: <ShieldCheck size={18} />,     label: 'Compliance' },
      { to: '/reports',     icon: <FileText size={18} />,        label: 'Reports' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/admin',       icon: <Settings size={18} />,        label: 'Admin' },
    ],
  },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'US';

  // Get current page label for breadcrumb
  const currentLabel =
    navSections.flatMap(s => s.items).find(i => location.pathname.startsWith(i.to))?.label
    ?? 'Dashboard';

  return (
    <div className="app-layout">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">💰</div>
          {!collapsed && (
            <div>
              <div className="sidebar-logo-text">MicroFin</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Loan System</div>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {navSections.map(section => (
            <div key={section.label}>
              <div className="nav-section-label">{section.label}</div>
              {section.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="nav-item"
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand' : 'Collapse'}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!collapsed && <span>Collapse</span>}
          </button>
          <button
            className="nav-item"
            onClick={handleLogout}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-red)' }}
            title="Logout"
          >
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Topbar ──────────────────────────────────────── */}
      <header className={`topbar ${collapsed ? 'collapsed' : ''}`}>
        <div className="topbar-left">
          <button className="topbar-toggle" onClick={() => setCollapsed(c => !c)} id="sidebar-toggle-btn">
            <Menu size={18} />
          </button>
          <div className="topbar-breadcrumb">
            <span>MicroFin</span>
            {' / '}
            <strong>{currentLabel}</strong>
          </div>
        </div>

        <div className="topbar-right">
          <ThemeToggle />
          <div className="role-badge">{user?.role?.replace('_', ' ') ?? 'USER'}</div>
          <div className="avatar" title={user?.email}>{initials}</div>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────── */}
      <main className={`main-content ${collapsed ? 'collapsed' : ''}`}>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
