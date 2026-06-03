// src/pages/seller/SellerPlaceOrder.jsx — Light theme + Lucide icons

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ShoppingCart, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import { convertToBaseUnit, getOrderingUnits } from '../../utils/conversion';

const EMPTY_ITEM = { productId: '', orderedQuantity: '', orderedUnit: '' };
const fmt = n =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

export default function SellerPlaceOrder() {
  const navigate = useNavigate();
  const [products, setProducts]   = useState([]);
  const [items, setItems]         = useState([{ ...EMPTY_ITEM }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  useEffect(() => {
    api.get('/products').then(({ data }) => setProducts(data)).catch(console.error);
  }, []);

  const getProduct = id => products.find(p => p._id === id);

  const addItem    = () => setItems(p => [...p, { ...EMPTY_ITEM }]);
  const removeItem = idx => setItems(p => p.filter((_, i) => i !== idx));

  const updateItem = (idx, field, value) => {
    setItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === 'productId') {
        const prod  = products.find(p => p._id === value);
        const units = prod ? getOrderingUnits(prod.baseUnit) : [];
        next[idx].orderedUnit     = units[0]?.value || '';
        next[idx].orderedQuantity = '';
      }
      return next;
    });
    setError('');
  };

  const lineTotal = item => {
    const prod = getProduct(item.productId);
    if (!prod || !item.orderedQuantity || !item.orderedUnit) return null;
    const qty = parseFloat(item.orderedQuantity);
    if (isNaN(qty) || qty <= 0) return null;
    return convertToBaseUnit(qty, item.orderedUnit) * prod.pricePerBaseUnit;
  };

  const totalAmount = items.reduce((s, it) => s + (lineTotal(it) || 0), 0);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    for (const item of items) {
      if (!item.productId)                                  { setError('Select a product for all rows.');    return; }
      if (!item.orderedQuantity || +item.orderedQuantity <= 0) { setError('Enter a valid quantity for all items.'); return; }
      if (!item.orderedUnit)                                { setError('Select a unit for all items.');      return; }
    }
    setSubmitting(true);
    try {
      await api.post('/orders', { items });
      setSuccess('Order placed successfully!');
      setTimeout(() => navigate('/seller/my-orders'), 1400);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order.');
    } finally { setSubmitting(false); }
  };

  return (
    <Layout>
      {success && <div className="alert alert-success"><CheckCircle2 size={14} /> {success} Redirecting…</div>}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="icon-label"><ShoppingCart size={15} /> Build Your Order</span>
            </h3>
            <button type="button" id="add-item-btn" className="btn btn-secondary btn-sm" onClick={addItem}>
              <Plus size={13} /> Add Item
            </button>
          </div>

          {error && <div className="alert alert-error"><AlertCircle size={14} /> {error}</div>}

          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 130px 110px', gap: 8, padding: '0 4px', marginBottom: 8 }}>
            {['Product', 'Quantity', 'Unit', 'Line Total'].map(h => (
              <div key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</div>
            ))}
          </div>

          {items.map((item, idx) => {
            const prod  = getProduct(item.productId);
            const units = prod ? getOrderingUnits(prod.baseUnit) : [];
            const lt    = lineTotal(item);

            return (
              <div key={idx} className="order-item-row" style={{ gridTemplateColumns: '1fr 110px 130px 110px' }}>
                {/* Product */}
                <div className="form-group" style={{ margin: 0 }}>
                  <select
                    id={`item-product-${idx}`}
                    className="form-select"
                    value={item.productId}
                    onChange={e => updateItem(idx, 'productId', e.target.value)}
                  >
                    <option value="">— Select —</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                  {prod && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                      {fmt(prod.pricePerBaseUnit)} / {prod.baseUnit}
                    </div>
                  )}
                </div>

                {/* Quantity */}
                <div className="form-group" style={{ margin: 0 }}>
                  <input
                    id={`item-qty-${idx}`}
                    type="number"
                    className="form-input"
                    placeholder="0"
                    min="0.001"
                    step="any"
                    value={item.orderedQuantity}
                    onChange={e => updateItem(idx, 'orderedQuantity', e.target.value)}
                  />
                </div>

                {/* Unit */}
                <div className="form-group" style={{ margin: 0 }}>
                  <select
                    id={`item-unit-${idx}`}
                    className="form-select"
                    value={item.orderedUnit}
                    onChange={e => updateItem(idx, 'orderedUnit', e.target.value)}
                    disabled={!prod}
                  >
                    {units.length === 0 && <option value="">— Pick product first —</option>}
                    {units.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </select>
                </div>

                {/* Line total + remove */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    fontWeight: 700, fontSize: 13,
                    color: lt != null ? 'var(--blue-700)' : 'var(--text-light)',
                    flex: 1, textAlign: 'right',
                  }}>
                    {lt != null ? fmt(lt) : '—'}
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      id={`remove-item-${idx}`}
                      className="btn btn-ghost btn-sm"
                      onClick={() => removeItem(idx)}
                      style={{ color: 'var(--danger)', padding: '4px' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Total */}
          <div className="order-total-bar">
            <span className="order-total-label">
              Order Total · {items.length} item{items.length !== 1 ? 's' : ''}
            </span>
            <span className="order-total-value">{fmt(totalAmount)}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18, gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/seller/products')}>
            <ArrowLeft size={14} /> Back to Catalog
          </button>
          <button
            id="submit-order-btn"
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={submitting || totalAmount === 0}
          >
            {submitting
              ? <><span className="loading-spinner" /> Placing Order…</>
              : <><ShoppingCart size={15} /> Place Order · {fmt(totalAmount)}</>}
          </button>
        </div>
      </form>
    </Layout>
  );
}
