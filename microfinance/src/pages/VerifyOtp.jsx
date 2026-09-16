import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  KeyRound,
  Mail,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/authApi';

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Retrieve email and optional demo OTP from navigation state or URL query
  const email = location.state?.email || searchParams.get('email') || '';
  const initialDemoOtp = location.state?.demoOtp || searchParams.get('otp') || '';

  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [demoOtp, setDemoOtp] = useState(initialDemoOtp);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [resendSuccess, setResendSuccess] = useState('');

  const inputRefs = useRef([]);

  // Resend OTP countdown timer
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(t => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Focus first input on mount
  useEffect(() => {
    if (!email) {
      // If user came here directly without email, redirect to forgot-password
      navigate('/forgot-password', { replace: true });
      return;
    }
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [email, navigate]);

  // Handle single digit input
  const handleDigitChange = (index, value) => {
    // Only accept numbers
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    // If pasted or typed multi-digits
    if (cleanVal.length > 1) {
      handlePasteValue(cleanVal);
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal.slice(-1);
    setOtpDigits(newDigits);
    setError('');

    // Advance focus to next input
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

  const handleResendOtp = async () => {
    if (resendTimer > 0 || resending || loading) return;
    setError('');
    setResendSuccess('');
    setResending(true);
    try {
      await authApi.forgotPassword(email);
      setResendTimer(60);
      setResendSuccess('New verification code sent to ' + email);
      setTimeout(() => setResendSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (currentOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      await authApi.verifyOtp(email, currentOtp);
      // Navigate to Change Password page with verified email and OTP
      navigate('/reset-password', {
        state: { email, otp: currentOtp },
        replace: true
      });
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">🔑</div>
          <div>
            <div className="auth-logo-text">MicroFin</div>
            <div className="auth-logo-sub">Password Recovery</div>
          </div>
        </div>

        {/* Step Indicator: 1. Email (Done), 2. OTP Verify (Active), 3. Change Password */}
        <div className="auth-steps">
          <div className="auth-step-item completed">
            <div className="auth-step-circle">
              <Check size={12} />
            </div>
            <span>Email</span>
          </div>
          <div className="auth-step-line active" />
          <div className="auth-step-item active">
            <div className="auth-step-circle">2</div>
            <span>Verify OTP</span>
          </div>
          <div className="auth-step-line" />
          <div className="auth-step-item">
            <div className="auth-step-circle">3</div>
            <span>Password</span>
          </div>
        </div>

        <h2 style={{ marginBottom: 6 }}>Verify Security Code</h2>
        <p style={{ marginBottom: 16, fontSize: '0.875rem' }}>
          We sent a 6-digit verification code to
        </p>

        {/* Email pill with change option */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          marginBottom: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
            <Mail size={16} color="var(--color-primary)" />
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {email}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/forgot-password', { state: { initialEmail: email } })}
            style={{ padding: '3px 8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}
          >
            Change
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

        <form className="auth-form" onSubmit={handleVerify}>
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

            {/* 6 Digit Input Boxes - Compact & Centered */}
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
                  id={`otp-box-${idx}`}
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

          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate('/forgot-password', { state: { initialEmail: email } })}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <ArrowLeft size={15} /> Back
            </button>
            <button
              id="verify-otp-submit-btn"
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading || currentOtp.length !== 6}
              style={{ flex: 2, justifyContent: 'center' }}
            >
              {loading ? (
                <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Verifying…</>
              ) : (
                <>Verify & Continue <ArrowRight size={16} /></>
              )}
            </button>
          </div>
        </form>

        <div className="auth-divider" style={{ marginTop: 24 }}>
          <span>Remember your password?</span>
        </div>
        <Link
          to="/login"
          id="back-to-login-link"
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
        >
          <ArrowLeft size={15} /> Back to Sign In
        </Link>
      </div>
    </div>
  );
}
