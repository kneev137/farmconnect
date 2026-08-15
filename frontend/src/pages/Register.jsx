import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sprout, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

export default function Register() {
  const { register, isAuthenticated, isFarmer } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    phone_number: '',
    role: 'consumer',
    farm_name: '',
    default_delivery_address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(isFarmer ? '/farmer/dashboard' : '/');
    }
  }, [isAuthenticated, isFarmer, navigate]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        username: form.username,
        email: form.email,
        password: form.password,
        phone_number: form.phone_number,
        role: form.role,
      };
      if (form.role === 'farmer') payload.farm_name = form.farm_name;
      if (form.role === 'consumer') payload.default_delivery_address = form.default_delivery_address;

      const user = await register(payload);
      navigate(user.role === 'farmer' ? '/farmer/dashboard' : '/');
    } catch (err) {
      setError(err.message || 'Registration failed');
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
          <p className="text-muted text-sm">Shop fresh produce or sell from your farm</p>
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
              <label className="form-label">Username</label>
              <input className="form-input" value={form.username} onChange={update('username')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={form.email} onChange={update('email')} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" value={form.password} onChange={update('password')} minLength={8} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone_number} onChange={update('phone_number')} />
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
              <label className="form-label">Default Delivery Address</label>
              <textarea className="form-textarea" value={form.default_delivery_address} onChange={update('default_delivery_address')} />
            </div>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
            <UserPlus size={18} />
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
