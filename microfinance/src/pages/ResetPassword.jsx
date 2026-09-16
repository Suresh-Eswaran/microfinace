import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/authApi';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || searchParams.get('email') || '';
  const otp = location.state?.otp || searchParams.get('otp') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // If no email or OTP was passed, redirect to start of recovery flow
  useEffect(() => {
    if (!email || !otp) {
      navigate('/forgot-password', { replace: true });
    }
  }, [email, otp, navigate]);

  const hasMinLength = newPassword.length >= 6;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

  const strengthScore = [hasMinLength, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['#ef4444', '#f59e0b', '#eab308', '#3b82f6', '#10b981'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !otp) {
      setError('Missing email or OTP verification code. Please start over.');
      return;
    }
    if (!hasMinLength) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(email.trim(), otp.trim(), newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to change password. Please verify your OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">🔐</div>
          <div>
            <div className="auth-logo-text">MicroFin</div>
            <div className="auth-logo-sub">Password Reset</div>
          </div>
        </div>

        {/* Step Indicator: 1. Email (Done), 2. OTP (Done), 3. Password (Active/Done) */}
        <div className="auth-steps">
          <div className="auth-step-item completed">
            <div className="auth-step-circle">
              <Check size={12} />
            </div>
            <span>Email</span>
          </div>
          <div className="auth-step-line active" />
          <div className="auth-step-item completed">
            <div className="auth-step-circle">
              <Check size={12} />
            </div>
            <span>Verify OTP</span>
          </div>
          <div className="auth-step-line active" />
          <div className={`auth-step-item ${success ? 'completed' : 'active'}`}>
            <div className="auth-step-circle">
              {success ? <Check size={12} /> : '3'}
            </div>
            <span>Password</span>
          </div>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: 'var(--color-primary)'
            }}>
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ marginBottom: 8 }}>Password Changed!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 28 }}>
              Your password has been successfully updated for <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>. You can now log in with your new password.
            </p>

            <button
              id="goto-login-btn"
              type="button"
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/login', { state: { message: 'Password updated successfully! Please sign in with your new password.' } })}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Sign In to Your Account <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div>
            <h2 style={{ marginBottom: 6 }}>Create New Password</h2>
            <p style={{ marginBottom: 16, fontSize: '0.875rem' }}>
              Set a strong, new password for your account.
            </p>

            {/* Email info banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
              marginBottom: 18,
              fontSize: '0.82rem'
            }}>
              <Mail size={15} color="var(--color-primary)" />
              <span style={{ color: 'var(--text-muted)' }}>Account:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
            </div>

            {error && (
              <div className="alert alert-error" role="alert" style={{ marginBottom: 18 }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              {/* New Password Field */}
              <div className="form-group">
                <label className="form-label" htmlFor="reset-new-password">New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={16}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      pointerEvents: 'none'
                    }}
                  />
                  <input
                    id="reset-new-password"
                    className="form-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    autoFocus
                    style={{ paddingLeft: 38, paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 0
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {newPassword.length > 0 && (
                  <div className="pw-strength-container">
                    <div className="pw-strength-bar">
                      <div
                        className="pw-strength-fill"
                        style={{
                          width: `${(strengthScore / 4) * 100}%`,
                          backgroundColor: strengthColors[strengthScore] || '#ef4444'
                        }}
                      />
                    </div>
                    <div className="pw-strength-text">
                      <span style={{ color: 'var(--text-muted)' }}>Strength:</span>
                      <span style={{ color: strengthColors[strengthScore] || '#ef4444' }}>
                        {strengthLabels[strengthScore]}
                      </span>
                    </div>

                    <div className="pw-req-list">
                      <div className={`pw-req-item ${hasMinLength ? 'met' : ''}`}>
                        {hasMinLength ? <Check size={11} /> : <X size={11} />} Min 6 characters
                      </div>
                      <div className={`pw-req-item ${hasUpper ? 'met' : ''}`}>
                        {hasUpper ? <Check size={11} /> : <X size={11} />} Uppercase letter
                      </div>
                      <div className={`pw-req-item ${hasNumber ? 'met' : ''}`}>
                        {hasNumber ? <Check size={11} /> : <X size={11} />} Number (0-9)
                      </div>
                      <div className={`pw-req-item ${hasSpecial ? 'met' : ''}`}>
                        {hasSpecial ? <Check size={11} /> : <X size={11} />} Symbol (@, #, $)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="form-group">
                <label className="form-label" htmlFor="reset-confirm-password">Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <ShieldCheck
                    size={16}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      pointerEvents: 'none'
                    }}
                  />
                  <input
                    id="reset-confirm-password"
                    className="form-input"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    style={{ paddingLeft: 38, paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(s => !s)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 0
                    }}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-red)', marginTop: 4 }}>
                    Passwords do not match
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => navigate('/verify-otp', { state: { email, otp } })}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <ArrowLeft size={15} /> Back
                </button>
                <button
                  id="reset-submit-btn"
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={loading || !newPassword || newPassword !== confirmPassword || !hasMinLength}
                  style={{ flex: 2, justifyContent: 'center' }}
                >
                  {loading ? (
                    <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Updating…</>
                  ) : (
                    'Save New Password'
                  )}
                </button>
              </div>
            </form>

            <div className="auth-divider" style={{ marginTop: 24 }}>
              <span>Return to sign in</span>
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
        )}
      </div>
    </div>
  );
}
