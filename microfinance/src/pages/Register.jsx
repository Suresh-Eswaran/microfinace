import { Building2, Lock, Mail, User } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'ADMIN',             label: 'Admin' },
  { value: 'BRANCH_MANAGER',    label: 'Branch Manager' },
  { value: 'CREDIT_OFFICER',    label: 'Credit Officer' },
  { value: 'LOAN_OFFICER',      label: 'Loan Officer' },
  { value: 'COLLECTIONS_AGENT', label: 'Collections Agent' },
  { value: 'CLIENT',            label: 'Client' },
];

const BRANCHES = [
  { value: 'Head Office',    label: 'Head Office' },
  { value: 'Main Branch',    label: 'Main Branch' },
  { value: 'North Branch',   label: 'North Branch' },
  { value: 'South Branch',   label: 'South Branch' },
  { value: 'East Branch',    label: 'East Branch' },
  { value: 'West Branch',    label: 'West Branch' },
  { value: 'Central Branch', label: 'Central Branch' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', role: 'LOAN_OFFICER', branch: 'Head Office'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      await register(form);
      setSuccess('Account created! Awaiting admin approval. Redirecting to login…');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">💰</div>
          <div>
            <div className="auth-logo-text">MicroFin</div>
            <div className="auth-logo-sub">User Registration</div>
          </div>
        </div>

        <h2 style={{ marginBottom: 6 }}>Create account</h2>
        <p style={{ marginBottom: 24, fontSize: '0.875rem' }}>Register to access the microfinance system</p>

        {error   && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form className="auth-form" onSubmit={handleSubmit} id="register-form">
          <div className="form-group">
            <label className="form-label" htmlFor="reg-fullname">Full Name *</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input id="reg-fullname" className="form-input" type="text" name="fullName" placeholder="Jane Doe" value={form.fullName} onChange={handleChange} required style={{ paddingLeft: 38 }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email *</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input id="reg-email" className="form-input" type="email" name="email" placeholder="jane@microfinance.com" value={form.email} onChange={handleChange} required style={{ paddingLeft: 38 }} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-role">Role *</label>
              <select id="reg-role" className="form-input" name="role" value={form.role} onChange={handleChange} required>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-branch">Branch *</label>
              <select id="reg-branch" className="form-input" name="branch" value={form.branch} onChange={handleChange} required>
                {BRANCHES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input id="reg-password" className="form-input" type="password" name="password" placeholder="Min. 8 characters" value={form.password} onChange={handleChange} required minLength={6} style={{ paddingLeft: 38 }} />
            </div>
          </div>

          <button id="register-submit-btn" type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
            {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Creating…</> : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Already have an account?{' '}</span>
          <Link to="/login" id="go-to-login-link" style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.85rem' }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
