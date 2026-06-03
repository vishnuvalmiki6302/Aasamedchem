import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, Mail, Lock, User, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  'Track chemicals and lab equipment',
  'Role-based access for admins and sellers',
  'Auto unit conversion (g → kg, mL → L)',
  'Real-time order status management',
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'seller' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      // Auto login after registration
      login(data.user, data.token);
      navigate(data.user.role === 'admin' ? '/admin/dashboard' : '/seller/shop');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        
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
                <User size={20} color="#fff" strokeWidth={2} />
              </div>
              <div>
                <h1 className="lc-title">Create Account</h1>
                <p className="lc-sub">Join AASAMED today</p>
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
                <label htmlFor="name" className="lc-label">Full Name</label>
                <div className="lc-input-wrap">
                  <User size={14} className="lc-input-icon" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="lc-input"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={handleChange}
                    autoComplete="name"
                    autoFocus
                  />
                </div>
              </div>

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
                    placeholder="Create a strong password"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="lc-field">
                <label htmlFor="role" className="lc-label">Account Role</label>
                <div className="lc-input-wrap">
                  <Shield size={14} className="lc-input-icon" />
                  <select
                    id="role"
                    name="role"
                    className="lc-input"
                    value={form.role}
                    onChange={handleChange}
                  >
                    <option value="seller">Seller (Order Chemicals)</option>
                    <option value="admin">Admin (Manage Inventory)</option>
                  </select>
                </div>
              </div>

              <button
                id="register-submit-btn"
                type="submit"
                className="lc-submit"
                disabled={loading}
              >
                {loading
                  ? <><span className="spinner" /> Creating account…</>
                  : 'Create Account'}
              </button>
            </form>

            <div className="lc-divider"><span>Already have an account?</span></div>
            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                className="lc-demo-btn"
                onClick={() => navigate('/login')}
                style={{ width: '100%' }}
              >
                Sign in instead
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
