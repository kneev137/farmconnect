import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Sprout, LogIn, ShoppingBag, LayoutDashboard, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

export default function Login() {
  const { login, isAuthenticated, isFarmer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const params = new URLSearchParams(location.search);
  const redirect = params.get('redirect') || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(isFarmer ? '/farmer/dashboard' : redirect);
    }
  }, [isAuthenticated, isFarmer, navigate, redirect]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(username, password);
      navigate(user.role === 'farmer' ? '/farmer/dashboard' : redirect);
    } catch (err) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userType) => {
    setError('');
    setLoading(true);
    try {
      const targetUser = userType === 'farmer' ? 'ramesh_patel' : 'priya_sharma';
      setUsername(targetUser);
      setPassword('testpass123');
      const user = await login(targetUser, 'testpass123');
      navigate(user.role === 'farmer' ? '/farmer/dashboard' : redirect);
    } catch (err) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card" style={{ maxWidth: '440px' }}>
        
        {/* Brand Header */}
        <div className="auth-card__brand">
          <div className="auth-card__logo"><Sprout size={28} /></div>
          <h1 className="title-md">Welcome to FarmConnect</h1>
          <p className="text-muted text-sm">
            {redirect !== '/' 
              ? 'Please sign in to add fresh produce to your cart and checkout.'
              : 'Sign in to your FarmConnect account'}
          </p>
        </div>

        {/* Quick Demo Logins for Evaluation */}
        <div style={{
          backgroundColor: 'var(--primary-subtle)',
          border: '1px solid #B7E4C7',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          marginBottom: '20px'
        }}>
          <div className="flex items-center gap-1 font-bold text-xs" style={{ color: 'var(--primary)', marginBottom: '8px' }}>
            <UserCheck size={14} /> 1-Click Quick Demo Sign-In:
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-outline btn-sm flex-1"
              style={{ fontSize: '0.78rem', padding: '6px 8px', backgroundColor: '#FFF' }}
              onClick={() => handleQuickLogin('consumer')}
              disabled={loading}
            >
              <ShoppingBag size={14} /> Consumer
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm flex-1"
              style={{ fontSize: '0.78rem', padding: '6px 8px', backgroundColor: '#FFF' }}
              onClick={() => handleQuickLogin('farmer')}
              disabled={loading}
            >
              <LayoutDashboard size={14} /> Farmer
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input
              id="username"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. priya_sharma or ramesh_patel"
              autoComplete="username"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
            <LogIn size={18} />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-switch">
          New to FarmConnect?{' '}
          <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
