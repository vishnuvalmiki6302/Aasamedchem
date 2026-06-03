// src/pages/LoginPage.jsx — Clean login, no emojis

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, Mail, Lock, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login }  = useAuth();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleChange = e => { setForm(p => ({ ...p, [e.target.name]: e.target.value })); setError(''); };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Please fill in both fields.'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.user, data.token);
      navigate(data.user.role === 'admin' ? '/admin/dashboard' : '/seller/shop');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
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
      {/* Left panel */}
      <div className="login-left">
        <div style={{ maxWidth: 340, width: '100%' }}>
          <div className="login-left-logo" style={{ justifyContent: 'center' }}>
            <div className="login-left-icon"><FlaskConical size={22} color="#fff" /></div>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>AASAMED</span>
          </div>
          <div className="login-left-title" style={{ textAlign: 'center' }}>
            Lab Inventory &amp;<br />Order Management
          </div>
          <div className="login-left-sub" style={{ textAlign: 'center' }}>
            Streamline your laboratory supply chain with smart ordering and real-time tracking.
          </div>
          <div style={{ marginTop: 28 }}>
            {[
              'Track chemicals and lab equipment',
              'Role-based access for admins and sellers',
              'Auto unit conversion (g, kg, mL, L)',
              'Real-time order status management',
            ].map(f => (
              <div key={f} className="login-feature">
                <div className="login-feature-dot" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="login-right">
        <div className="login-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, background: 'var(--blue)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <FlaskConical size={18} />
            </div>
            <div>
              <div className="login-title" style={{ fontSize: 18, marginBottom: 0 }}>Welcome back</div>
              <div className="login-sub" style={{ marginBottom: 0, fontSize: 12 }}>Sign in to AASAMED</div>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
                <input id="email" name="email" type="email" className="form-input" placeholder="you@example.com"
                  value={form.email} onChange={handleChange} style={{ paddingLeft: 30 }} autoComplete="email" autoFocus />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
                <input id="password" name="password" type="password" className="form-input" placeholder="Password"
                  value={form.password} onChange={handleChange} style={{ paddingLeft: 30 }} autoComplete="current-password" />
              </div>
            </div>

            <button id="login-submit-btn" type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? <><span className="spinner" /> Signing in</> : 'Sign In'}
            </button>
          </form>

          <div className="divider-text">Demo access</div>
          <div className="demo-row">
            <button id="fill-admin-btn" className="btn btn-outline btn-full btn-sm" onClick={() => fillDemo('admin')}>Admin Login</button>
            <button id="fill-seller-btn" className="btn btn-outline btn-full btn-sm" onClick={() => fillDemo('seller')}>Seller Login</button>
          </div>
        </div>
      </div>
    </div>
  );
}
