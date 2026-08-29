import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { loanApi } from '../api/loanApi';
import { useAuth } from '../context/AuthContext';

export default function LoanApply() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillClientId = searchParams.get('clientId') || '';

  const [form, setForm] = useState({
    clientId: prefillClientId,
    productId: '',
    amountRequested: '',
    purpose: '',
    officerId: user?.userId || '',
    tenureMonths: '',
    annualInterestRate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [step, setStep]       = useState(1);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        clientId:          Number(form.clientId),
        productId:         form.productId ? Number(form.productId) : null,
        amountRequested:   parseFloat(form.amountRequested),
        purpose:           form.purpose,
        officerId:         form.officerId ? Number(form.officerId) : null,
        tenureMonths:      Number(form.tenureMonths),
        annualInterestRate:parseFloat(form.annualInterestRate),
      };
      const result = await loanApi.apply(payload);
      navigate(`/loans/${result.id}`);
    } catch (err) {
      setError(err.message);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  // Monthly EMI preview
  const emiPreview = () => {
    const P = parseFloat(form.amountRequested);
    const r = parseFloat(form.annualInterestRate) / 12 / 100;
    const n = parseInt(form.tenureMonths);
    if (!P || !r || !n) return null;
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return isFinite(emi) ? emi.toFixed(2) : null;
  };
  const emi = emiPreview();

  return (
    <div className="animate-fade-in" style={{ maxWidth: 680, margin: '0 auto' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/loans" className="btn btn-ghost btn-sm" id="back-to-loans"><ArrowLeft size={15} /> Back</Link>
          <div>
            <h1 className="page-title">New Loan Application</h1>
            <p className="page-subtitle">Step {step} of 2 — {step === 1 ? 'Borrower & Product' : 'Terms & Submission'}</p>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {[1, 2].map(s => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? 'var(--color-primary)' : 'var(--color-surface-2)', transition: 'background 0.3s ease' }} />
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} id="loan-apply-form">
        <div className="card" style={{ marginBottom: 20 }}>
          {step === 1 && (
            <>
              <h3 style={{ marginBottom: 20, color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 600 }}>Borrower Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="loan-client-id">Client ID *</label>
                    <input id="loan-client-id" className="form-input" type="number" name="clientId" value={form.clientId} onChange={handleChange} required placeholder="e.g. 42" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="loan-officer-id">Officer ID</label>
                    <input id="loan-officer-id" className="form-input" type="number" name="officerId" value={form.officerId} onChange={handleChange} placeholder="Assigned officer" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="loan-purpose">Loan Purpose *</label>
                  <select id="loan-purpose" className="form-input" name="purpose" value={form.purpose} onChange={handleChange} required>
                    <option value="">Select purpose…</option>
                    {['Agriculture', 'Animal Husbandry', 'Small Business', 'Home Improvement', 'Education', 'Medical Emergency', 'Other'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h3 style={{ marginBottom: 20, color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 600 }}>Loan Terms</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="loan-amount">Amount Requested (₹) *</label>
                    <input id="loan-amount" className="form-input" type="number" name="amountRequested" value={form.amountRequested} onChange={handleChange} required min="100" step="100" placeholder="25000" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="loan-tenure">Tenure (Months) *</label>
                    <input id="loan-tenure" className="form-input" type="number" name="tenureMonths" value={form.tenureMonths} onChange={handleChange} required min="1" max="120" placeholder="12" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="loan-rate">Annual Interest Rate (%) *</label>
                  <input id="loan-rate" className="form-input" type="number" name="annualInterestRate" value={form.annualInterestRate} onChange={handleChange} required min="0" max="100" step="0.01" placeholder="18.5" />
                </div>

                {/* EMI Preview */}
                {emi && (
                  <div style={{ background: 'var(--color-primary-dim)', border: '1px solid var(--color-primary-glow)', borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 4 }}>Estimated Monthly EMI</div>
                      <div style={{ fontFamily: 'Outfit', fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                        ₹{Number(emi).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      <div>Total: ₹{(Number(emi) * parseInt(form.tenureMonths)).toLocaleString('en-IN')}</div>
                      <div>Interest: ₹{(Number(emi) * parseInt(form.tenureMonths) - parseFloat(form.amountRequested)).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {step === 1 ? (
            <Link to="/loans" className="btn btn-ghost">Cancel</Link>
          ) : (
            <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
          )}
          {step === 1 ? (
            <button
              id="loan-apply-next-btn"
              type="button"
              className="btn btn-primary"
              disabled={!form.clientId || !form.purpose}
              onClick={() => setStep(2)}
            >
              Next: Loan Terms →
            </button>
          ) : (
            <button id="loan-apply-submit-btn" type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Submitting…</> : '✓ Submit Application'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
