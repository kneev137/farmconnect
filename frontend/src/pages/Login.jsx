import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sprout, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

export default function Login() {
  const { login, isAuthenticated, isFarmer } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect') || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(isFarmer ? '/farmer/dashboard' : redirect);
    }
  }, [isAuthenticated, isFarmer, navigate, redirect]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(username, password);
      navigate(user.role === 'farmer' ? '/farmer/dashboard' : redirect);
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-card__brand">
          <div className="auth-card__logo"><Sprout size={28} /></div>
          <h1 className="title-md">Welcome back</h1>
          <p className="text-muted text-sm">Sign in to your FarmConnect account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input
              id="username"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
