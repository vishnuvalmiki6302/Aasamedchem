// src/pages/seller/SellerMyOrders.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, ChevronDown, ChevronRight, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import api from '../../api/axios';
import Layout from '../../components/Layout';

const UNIT_SHORT = { g: 'g', ml: 'mL', item: 'pc' };
const fmt = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
const STATUS_BADGE = { Pending: 'badge-amber', Approved: 'badge-green', Rejected: 'badge-red' };

export default function SellerMyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get('/orders/my-orders')
      .then(({ data }) => setOrders(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout><div className="loading-center"><span className="spinner-blue" /> Loading…</div></Layout>
  );

  const approved      = orders.filter(o => o.status === 'Approved');
  const approvedValue = approved.reduce((s, o) => s + o.totalAmount, 0);

  const statCards = [
    { icon: Package,      label: 'Total Orders', value: orders.length,    iconBg: 'var(--blue-light)', c: 'var(--blue)'  },
    { icon: Clock,        label: 'Pending',      value: orders.filter(o => o.status === 'Pending').length, iconBg: 'var(--amber-bg)', c: 'var(--amber)' },
    { icon: CheckCircle2, label: 'Approved',     value: approved.length,  iconBg: 'var(--green-bg)',  c: 'var(--green)' },
    { icon: TrendingUp,   label: 'Value',        value: fmt(approvedValue), iconBg: 'var(--blue-mid)', c: 'var(--blue)', small: true },
  ];

  return (
    <Layout>
      {orders.length > 0 && (
        <div className="stats-grid" style={{ marginBottom: 18 }}>
          {statCards.map(({ icon: Icon, label, value, iconBg, c, small }) => (
            <div key={label} className="stat-card">
              <div className="stat-icon" style={{ '--icon-bg': iconBg }}><Icon size={18} color={c} /></div>
              <div>
                <div className="stat-value" style={{ fontSize: small ? 16 : undefined }}>{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title"><Package size={15} /> Order History</div>
          <button id="new-order-btn" className="btn btn-primary btn-sm" onClick={() => navigate('/seller/shop')}>
            <Plus size={13} /> New Order
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="empty-state">
            <Package size={34} style={{ margin: '0 auto 10px', color: 'var(--text-4)' }} />
            <h3>No orders yet</h3>
            <p>Place your first order from the Shop page</p>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('/seller/shop')}>
              <Plus size={12} /> Go to Shop
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {orders.map(order => (
              <div key={order._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                {/* Summary row */}
                <div
                  style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: 16, padding: '12px 20px', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setExpanded(expanded === order._id ? null : order._id)}
                >
                  <div>
                    <div style={{ fontFamily: 'monospace', fontSize: 12.5, fontWeight: 700, color: 'var(--blue)' }}>
                      #{order._id.slice(-6).toUpperCase()}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>Items</div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{order.items.length}</div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>Total</div>
                    <div style={{ fontWeight: 700, color: 'var(--blue)', fontSize: 13 }}>{fmt(order.totalAmount)}</div>
                  </div>

                  <span className={`badge ${STATUS_BADGE[order.status]}`}>{order.status}</span>

                  <span style={{ color: 'var(--text-4)', display: 'flex', alignItems: 'center' }}>
                    {expanded === order._id ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </span>
                </div>

                {/* Expanded items */}
                {expanded === order._id && (
                  <div style={{ background: 'var(--bg)', padding: '10px 20px 14px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Items Ordered</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {order.items.map((item, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, padding: '8px 12px', background: 'var(--surface)', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12.5, alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{item.product?.name}</div>
                            <code style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{item.product?.sku}</code>
                          </div>
                          <div style={{ color: 'var(--text-2)' }}>
                            {item.orderedQuantity} {item.orderedUnit}
                            <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>= {item.convertedQuantity} {UNIT_SHORT[item.product?.baseUnit]}</div>
                          </div>
                          <div style={{ fontWeight: 700, color: 'var(--blue)', textAlign: 'right' }}>{fmt(item.lineTotal)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
