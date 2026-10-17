import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sprout, UserPlus, Eye, EyeOff, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

export default function Register() {
  const { register, isAuthenticated, isFarmer } = useAuth();
  const navigate = useNavigate();

  // Registration form state
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    phone_number: '',
    role: 'consumer',
    farm_name: '',
    default_delivery_address: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(isFarmer ? '/farmer/dashboard' : '/');
    }
  }, [isAuthenticated, isFarmer, navigate]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const passwordsMatch = form.confirm_password.length > 0 && form.password === form.confirm_password;
  const passwordsMismatch = form.confirm_password.length > 0 && form.password !== form.confirm_password;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email.trim()) {
      setError('Please provide a valid email address.');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match. Please verify and retype your password.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        confirm_password: form.confirm_password,
        phone_number: form.phone_number.trim(),
        role: form.role,
      };
      if (form.role === 'farmer') payload.farm_name = form.farm_name.trim();
      if (form.role === 'consumer') payload.default_delivery_address = form.default_delivery_address.trim();

      const user = await register(payload);
      navigate(user.role === 'farmer' ? '/farmer/dashboard' : '/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card auth-card--wide">
        <div className="auth-card__brand">
          <div className="auth-card__logo"><Sprout size={28} /></div>
          <h1 className="title-md">Join FarmConnect</h1>
          <p className="text-muted text-sm">Shop fresh produce or sell directly from your farm</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-role-toggle">
            <button
              type="button"
              className={`auth-role-btn ${form.role === 'consumer' ? 'auth-role-btn--active' : ''}`}
              onClick={() => setForm({ ...form, role: 'consumer' })}
            >
              I'm a Consumer
            </button>
            <button
              type="button"
              className={`auth-role-btn ${form.role === 'farmer' ? 'auth-role-btn--active' : ''}`}
              onClick={() => setForm({ ...form, role: 'farmer' })}
            >
              I'm a Farmer
            </button>
          </div>

          <div className="auth-form-grid">
            <div className="form-group">
              <label className="form-label">Username *</label>
              <input className="form-input" value={form.username} onChange={update('username')} required placeholder="e.g. john_doe" />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input type="email" className="form-input" value={form.email} onChange={update('email')} required placeholder="e.g. john@example.com" />
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label className="form-label">Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingRight: '40px' }}
                  value={form.password}
                  onChange={update('password')}
                  minLength={8}
                  placeholder="At least 8 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Retype / Confirm Password Field */}
            <div className="form-group">
              <label className="form-label">Retype Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{
                    paddingRight: '40px',
                    borderColor: passwordsMismatch ? 'var(--warning)' : passwordsMatch ? 'var(--primary)' : undefined
                  }}
                  value={form.confirm_password}
                  onChange={update('confirm_password')}
                  minLength={8}
                  placeholder="Re-enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordsMatch && (
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                  <Check size={13} /> Passwords match
                </span>
              )}
              {passwordsMismatch && (
                <span style={{ fontSize: '0.75rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                  <X size={13} /> Passwords do not match
                </span>
              )}
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Phone Number</label>
              <input className="form-input" value={form.phone_number} onChange={update('phone_number')} placeholder="e.g. 9876543210" />
            </div>
          </div>

          {form.role === 'farmer' && (
            <div className="form-group">
              <label className="form-label">Farm Name</label>
              <input className="form-input" value={form.farm_name} onChange={update('farm_name')} placeholder="Green Valley Organics" />
            </div>
          )}

          {form.role === 'consumer' && (
            <div className="form-group">
              <label className="form-label">Delivery Address (Optional)</label>
              <textarea
                className="form-textarea"
                rows="2"
                value={form.default_delivery_address}
                onChange={update('default_delivery_address')}
                placeholder="House/flat no., street, landmark, city, pin code..."
              />
            </div>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
            <UserPlus size={18} />
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
