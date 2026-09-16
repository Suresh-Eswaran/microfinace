import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  User
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/authApi';

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

export default function Register({ initialStep }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Determine initial state: from URL or prop
  const urlEmail = searchParams.get('email') || location.state?.email || '';
  const urlOtp = searchParams.get('otp') || location.state?.demoOtp || '';
  const shouldStartAtVerify = initialStep === 'verify' ||
    searchParams.get('step') === 'verify' ||
    location.pathname === '/verify-email-otp' ||
    !!urlEmail;

  // Step 1: Form, Step 2: OTP Verify, Step 3: Success Celebration
  const [step, setStep] = useState(shouldStartAtVerify ? 2 : 1);

  // Step 1 Form State
  const [form, setForm] = useState({
    fullName: location.state?.fullName || '',
    email: urlEmail,
    password: '',
    role: 'LOAN_OFFICER',
    branch: 'Head Office'
  });

  // Step 2 OTP State
  const [registeredEmail, setRegisteredEmail] = useState(urlEmail);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [demoOtp, setDemoOtp] = useState(urlOtp);
  const [resendTimer, setResendTimer] = useState(60);
  const [resendSuccess, setResendSuccess] = useState('');
  const [resending, setResending] = useState(false);

  // Common UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const inputRefs = useRef([]);

  // Resend Countdown
  useEffect(() => {
    let interval = null;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(t => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Focus first digit box when moving to Step 2
  useEffect(() => {
    if (step === 2 && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    }
  }, [step]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // Handle submitting initial registration form
  const handleRegisterSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await authApi.register(form);
      setRegisteredEmail(form.email);
      setResendTimer(60);
      setError('');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // OTP digit manipulation
  const handleDigitChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    if (cleanVal.length > 1) {
      handlePasteValue(cleanVal);
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal.slice(-1);
    setOtpDigits(newDigits);
    setError('');

    if (index < 5 && cleanVal) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasteData) {
      handlePasteValue(pasteData);
    }
  };

  const handlePasteValue = (value) => {
    const chars = value.split('');
    const newDigits = ['', '', '', '', '', ''];
    chars.forEach((ch, idx) => {
      if (idx < 6) newDigits[idx] = ch;
    });
    setOtpDigits(newDigits);
    setError('');
    const nextIdx = Math.min(chars.length, 5);
    inputRefs.current[nextIdx]?.focus();
  };

  const currentOtp = otpDigits.join('');

  const handleUseDemoOtp = (code) => {
    if (!code) return;
    handlePasteValue(code);
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0 || resending || loading) return;
    setError('');
    setResendSuccess('');
    setResending(true);

    try {
      await authApi.resendEmailOtp(registeredEmail);
      setResendTimer(60);
      setResendSuccess('A new 6-digit verification code has been dispatched to ' + registeredEmail);
      setTimeout(() => setResendSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  // Verify OTP & Activate
  const handleVerifySubmit = async e => {
    if (e) e.preventDefault();
    setError('');

    if (currentOtp.length !== 6) {
      setError('Please enter the full 6-digit code received on your email.');
      return;
    }

    setLoading(true);
    try {
      await authApi.verifyEmailOtp(registeredEmail, currentOtp);
      setStep(3);
      setTimeout(() => {
        navigate('/login', {
          state: { message: 'Your email has been verified! You can now sign in.' },
          replace: true
        });
      }, 2200);
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">💰</div>
          <div>
            <div className="auth-logo-text">MicroFin</div>
            <div className="auth-logo-sub">User Registration</div>
          </div>
        </div>

        {/* Progress Step Indicator */}
        <div className="auth-steps" style={{ marginBottom: 20 }}>
          <div className={`auth-step-item ${step > 1 ? 'completed' : 'active'}`}>
            <div className="auth-step-circle">
              {step > 1 ? <Check size={12} /> : '1'}
            </div>
            <span>Account</span>
          </div>
          <div className={`auth-step-line ${step >= 2 ? 'active' : ''}`} />
          <div className={`auth-step-item ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>
            <div className="auth-step-circle">
              {step > 2 ? <Check size={12} /> : '2'}
            </div>
            <span>Email OTP</span>
          </div>
          <div className={`auth-step-line ${step >= 3 ? 'active' : ''}`} />
          <div className={`auth-step-item ${step === 3 ? 'completed' : ''}`}>
            <div className="auth-step-circle">
              {step === 3 ? <Check size={12} /> : '3'}
            </div>
            <span>Ready</span>
          </div>
        </div>

        {/* STEP 1: Registration Form */}
        {step === 1 && (
          <>
            <h2 style={{ marginBottom: 6 }}>Create account</h2>
            <p style={{ marginBottom: 24, fontSize: '0.875rem' }}>
              Register to access the microfinance system. An email OTP will verify your account.
            </p>

            {error   && <div className="alert alert-error" role="alert"><AlertCircle size={15} /> {error}</div>}
            {success && <div className="alert alert-success" role="status"><Check size={15} /> {success}</div>}

            <form className="auth-form" onSubmit={handleRegisterSubmit} id="register-form">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-fullname">Full Name *</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    id="reg-fullname"
                    className="form-input"
                    type="text"
                    name="fullName"
                    placeholder="Jane Doe"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                    style={{ paddingLeft: 38 }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">Email Address *</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    id="reg-email"
                    className="form-input"
                    type="email"
                    name="email"
                    placeholder="jane@microfinance.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    style={{ paddingLeft: 38 }}
                  />
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
                <label className="form-label" htmlFor="reg-password">Password *</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    id="reg-password"
                    className="form-input"
                    type="password"
                    name="password"
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    style={{ paddingLeft: 38 }}
                  />
                </div>
              </div>

              <button
                id="register-submit-btn"
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
              >
                {loading ? (
                  <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Creating account…</>
                ) : (
                  <>Create Account & Send OTP <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Already have an account?{' '}</span>
              <Link to="/login" id="go-to-login-link" style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.85rem' }}>
                Sign in
              </Link>
            </div>
          </>
        )}

        {/* STEP 2: Email OTP Verification */}
        {step === 2 && (
          <>
            <h2 style={{ marginBottom: 6 }}>Verify Your Email</h2>
            <p style={{ marginBottom: 16, fontSize: '0.875rem' }}>
              We have dispatched a 6-digit verification code to activate your account.
            </p>

            {/* Email summary badge with back / change option */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              marginBottom: 18
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                <Mail size={16} color="var(--color-primary)" />
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {registeredEmail}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setError('');
                  setStep(1);
                }}
                style={{ padding: '3px 8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}
              >
                Edit Email
              </button>
            </div>



            {resendSuccess && (
              <div className="alert alert-success" role="status" style={{ marginBottom: 16 }}>
                <Check size={15} /> {resendSuccess}
              </div>
            )}

            {error && (
              <div className="alert alert-error" role="alert" style={{ marginBottom: 18 }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <form className="auth-form" onSubmit={handleVerifySubmit}>
              <div className="form-group">
                <div className="auth-header-row">
                  <label className="form-label" style={{ margin: 0 }}>Enter 6-Digit Code</label>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0 || resending || loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: resendTimer > 0 ? 'var(--text-muted)' : 'var(--color-primary)',
                      cursor: resendTimer > 0 ? 'default' : 'pointer',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: 0
                    }}
                  >
                    <RefreshCw size={12} className={resending ? 'animate-spin' : ''} />
                    {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend Code'}
                  </button>
                </div>

                {/* 6 Digit Input Boxes */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 10,
                    marginTop: 10,
                    marginBottom: 6,
                    width: '100%'
                  }}
                  onPaste={handlePaste}
                >
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => (inputRefs.current[idx] = el)}
                      id={`reg-otp-box-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleDigitChange(idx, e.target.value)}
                      onKeyDown={e => handleKeyDown(idx, e)}
                      style={{
                        width: '44px',
                        height: '48px',
                        minWidth: 0,
                        maxWidth: '44px',
                        padding: 0,
                        boxSizing: 'border-box',
                        textAlign: 'center',
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        fontFamily: 'Outfit, monospace',
                        borderRadius: 'var(--radius-md)',
                        border: digit
                          ? '2px solid var(--color-primary)'
                          : '1px solid var(--color-border)',
                        background: digit ? 'rgba(16, 185, 129, 0.08)' : 'var(--color-surface-2)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        transition: 'all var(--transition-fast)',
                        boxShadow: digit ? '0 0 10px rgba(16, 185, 129, 0.25)' : 'none'
                      }}
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setError('');
                    setStep(1);
                  }}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <ArrowLeft size={15} /> Back
                </button>
                <button
                  id="verify-email-submit-btn"
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={loading || currentOtp.length !== 6}
                  style={{ flex: 2, justifyContent: 'center' }}
                >
                  {loading ? (
                    <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Activating…</>
                  ) : (
                    <>Verify & Activate <ShieldCheck size={16} /></>
                  )}
                </button>
              </div>
            </form>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Already verified?{' '}</span>
              <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.85rem' }}>
                Sign in
              </Link>
            </div>
          </>
        )}

        {/* STEP 3: Verification Success Celebration */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '24px 8px' }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid var(--color-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              animation: 'pulse 1.5s infinite'
            }}>
              <CheckCircle2 size={36} color="var(--color-primary)" />
            </div>
            <h2 style={{ marginBottom: 8, color: 'var(--text-primary)' }}>Account Verified!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20, lineHeight: 1.5 }}>
              Your email <strong>{registeredEmail}</strong> has been successfully verified. Your account is now active!
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
              <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              Redirecting you to sign in…
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
