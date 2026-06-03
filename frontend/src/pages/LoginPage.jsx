// src/pages/LoginPage.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  'Track chemicals and lab equipment',
  'Role-based access for admins and sellers',
  'Auto unit conversion  (g → kg, mL → L)',
  'Real-time order status management',
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login }  = useAuth();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleChange = e => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Please fill in both fields.'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.user, data.token);
      navigate(data.user.role === 'admin' ? '/admin/dashboard' : '/seller/shop');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally { setLoading(false); }
  };

  const fillDemo = role => {
    setForm(role === 'admin'
      ? { email: 'admin@test.com',  password: 'password123' }
      : { email: 'seller@test.com', password: 'password123' });
    setError('');
  };

  return (
    <div className="login-page">

      {/* ── Left Panel ────────────────────────────────── */}
      <div className="login-left">
        <div className="login-left-inner">

          {/* Logo */}
          <div className="ll-logo">
            <div className="ll-logo-icon">
              <FlaskConical size={24} color="#fff" strokeWidth={2} />
            </div>
            <span className="ll-logo-text">AASAMED</span>
          </div>

          {/* Headline */}
          <div className="ll-headline">
            Lab Inventory &amp;<br />Order Management
          </div>
          <div className="ll-sub">
            Streamline your laboratory supply chain with smart ordering and real-time tracking.
          </div>

          {/* Feature list */}
          <div className="ll-features">
            {FEATURES.map(f => (
              <div key={f} className="ll-feature">
                <CheckCircle size={14} color="rgba(255,255,255,0.7)" strokeWidth={2} />
                <span>{f}</span>
              </div>
            ))}
          </div>

          {/* Decorative pill badge */}
          <div className="ll-badge">
            Chemical Lab Management System
          </div>
        </div>
      </div>

      {/* ── Right Panel ───────────────────────────────── */}
      <div className="login-right">
        <div className="login-card">

          {/* Card header */}
          <div className="lc-header">
            <div className="lc-icon">
              <FlaskConical size={20} color="#fff" strokeWidth={2} />
            </div>
            <div>
              <h1 className="lc-title">Welcome back</h1>
              <p className="lc-sub">Sign in to your AASAMED account</p>
            </div>
          </div>

          {/* Error alert */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="lc-field">
              <label htmlFor="email" className="lc-label">Email address</label>
              <div className="lc-input-wrap">
                <Mail size={14} className="lc-input-icon" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="lc-input"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div className="lc-field">
              <label htmlFor="password" className="lc-label">Password</label>
              <div className="lc-input-wrap">
                <Lock size={14} className="lc-input-icon" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="lc-input"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              className="lc-submit"
              disabled={loading}
            >
              {loading
                ? <><span className="spinner" /> Signing in…</>
                : 'Sign In'}
            </button>
          </form>

          {/* Demo shortcuts */}
          <div className="lc-divider"><span>Quick demo access</span></div>
          <div className="lc-demo-row">
            <button
              id="fill-admin-btn"
              className="lc-demo-btn"
              onClick={() => fillDemo('admin')}
            >
              Admin
            </button>
            <button
              id="fill-seller-btn"
              className="lc-demo-btn"
              onClick={() => fillDemo('seller')}
            >
              Seller
            </button>
          </div>

          <p className="lc-hint">Demo password: <code>password123</code></p>
        </div>
      </div>

    </div>
  );
}
