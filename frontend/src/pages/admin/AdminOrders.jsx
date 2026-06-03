// src/pages/admin/AdminOrders.jsx

import { useState, useEffect } from 'react';
import { ClipboardList, ChevronDown, ChevronRight, Check, X, RotateCcw, CheckCircle2 } from 'lucide-react';
import api from '../../api/axios';
import Layout from '../../components/Layout';

const UNIT_SHORT = { g: 'g', ml: 'mL', item: 'pc' };
const fmt = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
const STATUS_BADGE = { Pending: 'badge-amber', Approved: 'badge-green', Rejected: 'badge-red' };

export default function AdminOrders() {
  const [orders, setOrders]     = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('All');
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [success, setSuccess]   = useState('');

  useEffect(() => {
    api.get('/orders')
      .then(({ data }) => { setOrders(data); setFiltered(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setFiltered(filter === 'All' ? orders : orders.filter(o => o.status === filter));
  }, [filter, orders]);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await api.put(`/orders/${id}/status`, { status });
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
      setSuccess(`Order marked as ${status}`);
      setTimeout(() => setSuccess(''), 3000);
    } finally { setUpdating(null); }
  };

  const counts = {
    All: orders.length,
    Pending:  orders.filter(o => o.status === 'Pending').length,
    Approved: orders.filter(o => o.status === 'Approved').length,
    Rejected: orders.filter(o => o.status === 'Rejected').length,
  };

  return (
    <Layout>
      {success && <div className="alert alert-success"><CheckCircle2 size={14} /> {success}</div>}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {['All', 'Pending', 'Approved', 'Rejected'].map(s => (
          <button
            key={s}
            id={`filter-${s.toLowerCase()}`}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter(s)}
          >
            {s}
            <span style={{ background: filter === s ? 'rgba(255,255,255,.25)' : 'var(--bg)', borderRadius: 100, padding: '0 5px', fontSize: 10, marginLeft: 2 }}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title"><ClipboardList size={15} /> Orders</div>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{filtered.length} shown</span>
        </div>

        {loading ? (
          <div className="loading-center"><span className="spinner-blue" /> Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={34} style={{ margin: '0 auto 10px', color: 'var(--text-4)' }} />
            <h3>No orders</h3>
            <p>{filter !== 'All' ? `No ${filter.toLowerCase()} orders` : 'No orders yet'}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Order ID</th><th>Seller</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <>
                    <tr key={order._id}>
                      <td>
                        <button
                          id={`expand-${order._id}`}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, color: 'var(--blue)', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, padding: 0 }}
                          onClick={() => setExpanded(expanded === order._id ? null : order._id)}
                        >
                          {expanded === order._id ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          #{order._id.slice(-6).toUpperCase()}
                        </button>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{order.user?.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{order.user?.email}</div>
                      </td>
                      <td style={{ color: 'var(--text-2)' }}>{order.items.length}</td>
                      <td style={{ fontWeight: 700, color: 'var(--blue)' }}>{fmt(order.totalAmount)}</td>
                      <td><span className={`badge ${STATUS_BADGE[order.status]}`}>{order.status}</span></td>
                      <td style={{ color: 'var(--text-3)', fontSize: 12 }}>
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                        <div style={{ fontSize: 10 }}>{new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td>
                        {order.status === 'Pending' ? (
                          <div style={{ display: 'flex', gap: 5 }}>
                            <button id={`approve-${order._id}`} className="btn btn-success btn-sm" disabled={updating === order._id} onClick={() => updateStatus(order._id, 'Approved')}>
                              {updating === order._id ? <span className="spinner" style={{ borderTopColor: 'var(--green)' }} /> : <Check size={12} />} Approve
                            </button>
                            <button id={`reject-${order._id}`} className="btn btn-danger btn-sm" disabled={updating === order._id} onClick={() => updateStatus(order._id, 'Rejected')}>
                              <X size={12} /> Reject
                            </button>
                          </div>
                        ) : (
                          <button id={`reset-${order._id}`} className="btn btn-amber btn-sm" disabled={updating === order._id} onClick={() => updateStatus(order._id, 'Pending')}>
                            <RotateCcw size={12} /> Reset
                          </button>
                        )}
                      </td>
                    </tr>

                    {expanded === order._id && (
                      <tr key={`${order._id}-exp`}>
                        <td colSpan={7} style={{ padding: 0 }}>
                          <div style={{ background: 'var(--bg)', padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
                            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
                              Items
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                              {order.items.map((item, i) => (
                                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, padding: '8px 12px', background: 'var(--surface)', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12.5, alignItems: 'center' }}>
                                  <div>
                                    <div style={{ fontWeight: 600 }}>{item.product?.name}</div>
                                    <code style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{item.product?.sku}</code>
                                  </div>
                                  <div style={{ color: 'var(--text-2)' }}>
                                    {item.orderedQuantity} {item.orderedUnit}
                                    <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>→ {item.convertedQuantity} {UNIT_SHORT[item.product?.baseUnit]}</div>
                                  </div>
                                  <div style={{ fontWeight: 700, color: 'var(--blue)', textAlign: 'right' }}>{fmt(item.lineTotal)}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
