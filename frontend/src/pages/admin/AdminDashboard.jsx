// src/pages/admin/AdminDashboard.jsx

import { useState, useEffect } from 'react';
import { FlaskConical, Clock, CheckCircle2, TrendingUp, Package } from 'lucide-react';
import api from '../../api/axios';
import Layout from '../../components/Layout';

const fmt = n =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/products'), api.get('/orders')])
      .then(([pRes, oRes]) => {
        const products = pRes.data;
        const orders   = oRes.data;
        const approved = orders.filter(o => o.status === 'Approved');
        setStats({
          products: products.length,
          pending:  orders.filter(o => o.status === 'Pending').length,
          approved: approved.length,
          revenue:  approved.reduce((s, o) => s + o.totalAmount, 0),
        });
        setRecent(orders.slice(0, 6));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout>
      <div className="loading-center"><span className="spinner-blue" /> Loading…</div>
    </Layout>
  );

  const statCards = [
    { icon: FlaskConical, label: 'Products',       value: stats.products,       iconBg: 'var(--blue-light)', iconColor: 'var(--blue)'  },
    { icon: Clock,        label: 'Pending Orders', value: stats.pending,        iconBg: 'var(--amber-bg)',   iconColor: 'var(--amber)' },
    { icon: CheckCircle2, label: 'Approved',       value: stats.approved,       iconBg: 'var(--green-bg)',   iconColor: 'var(--green)' },
    { icon: TrendingUp,   label: 'Revenue',        value: fmt(stats.revenue),   iconBg: 'var(--blue-mid)',   iconColor: 'var(--blue)',  small: true },
  ];

  const statusBadge = { Pending: 'badge-amber', Approved: 'badge-green', Rejected: 'badge-red' };

  return (
    <Layout>
      <div className="stats-grid">
        {statCards.map(({ icon: Icon, label, value, iconBg, iconColor, small }) => (
          <div key={label} className="stat-card">
            <div className="stat-icon" style={{ '--icon-bg': iconBg }}>
              <Icon size={18} color={iconColor} />
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: small ? 17 : undefined }}>{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title"><Package size={15} /> Recent Orders</div>
          <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Latest 6</span>
        </div>

        {recent.length === 0 ? (
          <div className="empty-state">
            <Package size={34} style={{ margin: '0 auto 10px', color: 'var(--text-4)' }} />
            <h3>No orders yet</h3>
            <p>Orders from sellers will appear here</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Seller</th><th>Items</th><th>Amount</th><th>Status</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(o => (
                  <tr key={o._id}>
                    <td><code style={{ fontSize: 11, color: 'var(--text-3)' }}>#{o._id.slice(-6).toUpperCase()}</code></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{o.user?.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{o.user?.email}</div>
                    </td>
                    <td style={{ color: 'var(--text-2)' }}>{o.items.length}</td>
                    <td style={{ fontWeight: 700, color: 'var(--blue)' }}>{fmt(o.totalAmount)}</td>
                    <td><span className={`badge ${statusBadge[o.status]}`}>{o.status}</span></td>
                    <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
