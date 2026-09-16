import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Mail
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.initialEmail || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      // Navigate to dedicated OTP verification page
      navigate('/verify-otp', {
        state: {
          email: email.trim()
        }
      });
    } catch (err) {
      setError(err.message || 'Failed to send verification code. Please check your email.');
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

        {/* Step Indicator */}
        <div className="auth-steps">
          <div className="auth-step-item active">
            <div className="auth-step-circle">1</div>
            <span>Email</span>
          </div>
          <div className="auth-step-line" />
          <div className="auth-step-item">
            <div className="auth-step-circle">2</div>
            <span>Verify OTP</span>
          </div>
          <div className="auth-step-line" />
          <div className="auth-step-item">
            <div className="auth-step-circle">3</div>
            <span>Password</span>
          </div>
        </div>

        {error && (
          <div className="alert alert-error" role="alert" style={{ marginBottom: 20 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <div>
          <h2 style={{ marginBottom: 6 }}>Forgot Password?</h2>
          <p style={{ marginBottom: 24, fontSize: '0.875rem' }}>
            Enter your registered email address and we'll send you a 6-digit verification code to reset your password.
          </p>

          <form className="auth-form" onSubmit={handleRequestOtp}>
            <div className="form-group">
              <label className="form-label" htmlFor="forgot-email">Registered Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail
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
                  id="forgot-email"
                  className="form-input"
                  type="email"
                  placeholder="e.g. officer@microfin.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>

            <button
              id="request-otp-btn"
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading || !email}
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            >
              {loading ? (
                <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Sending Code…</>
              ) : (
                <>Send Verification Code <ArrowRight size={16} /></>
              )}
            </button>
          </form>
        </div>

        <div className="auth-divider" style={{ marginTop: 24 }}>
          <span>Remembered your password?</span>
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
