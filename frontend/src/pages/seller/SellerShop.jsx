// src/pages/seller/SellerShop.jsx
// Combined products + cart page. Sellers browse, add to cart, and place orders here.

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ShoppingCart, Plus, Minus, Trash2,
  FlaskConical, AlertCircle, CheckCircle2, Package
} from 'lucide-react';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import { convertToBaseUnit, getOrderingUnits } from '../../utils/conversion';

const fmt = n =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

const UNIT_SHORT = { g: 'g', ml: 'mL', item: 'pc' };

// ─── Cart Item Row ──────────────────────────────────────────────────────────
function CartItem({ item, product, onQtyChange, onUnitChange, onRemove }) {
  const units = product ? getOrderingUnits(product.baseUnit) : [];
  const qty   = parseFloat(item.qty) || 0;
  const lineTotal = product && qty > 0 && item.unit
    ? convertToBaseUnit(qty, item.unit) * product.pricePerBaseUnit
    : 0;

  return (
    <div className="cart-item">
      <div className="cart-item-name" title={product?.name}>{product?.name}</div>
      <div className="cart-item-controls">
        {/* Quantity */}
        <input
          type="number"
          className="form-input"
          style={{ padding: '5px 8px', fontSize: 12 }}
          min="0.001"
          step="any"
          placeholder="Qty"
          value={item.qty}
          onChange={e => onQtyChange(e.target.value)}
        />
        {/* Unit */}
        <select
          className="form-select"
          style={{ padding: '5px 8px', fontSize: 12 }}
          value={item.unit}
          onChange={e => onUnitChange(e.target.value)}
        >
          {units.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
        </select>
        {/* Remove */}
        <button className="btn btn-ghost btn-sm" style={{ padding: '5px 6px', color: 'var(--red)' }} onClick={onRemove}>
          <Trash2 size={13} />
        </button>
      </div>
      <div className="cart-item-total">
        {lineTotal > 0 ? fmt(lineTotal) : '—'}
      </div>
    </div>
  );
}

// ─── Product Card ───────────────────────────────────────────────────────────
function ProductCard({ product, inCart, onAdd }) {
  return (
    <div className="product-card">
      <div>
        <div className="product-name">{product.name}</div>
        <div className="product-sku">{product.sku}</div>
      </div>

      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        <span className="badge badge-gray" style={{ fontSize: 10 }}>{product.category}</span>
        <span className="badge badge-blue" style={{ fontSize: 10 }}>{UNIT_SHORT[product.baseUnit]}</span>
      </div>

      <div>
        <div className="product-price">{fmt(product.pricePerBaseUnit)}</div>
        <div className="product-unit">per {product.baseUnit}</div>
      </div>

      <div className="product-stock">
        <span className={product.stockQuantity < 100 ? 'stock-low' : 'stock-ok'}>
          {product.stockQuantity.toLocaleString()} {UNIT_SHORT[product.baseUnit]} in stock
        </span>
      </div>

      <button
        id={`add-cart-${product._id}`}
        className={`btn btn-full btn-sm ${inCart ? 'btn-outline' : 'btn-primary'}`}
        style={{ marginTop: 2 }}
        onClick={() => onAdd(product)}
      >
        <ShoppingCart size={12} />
        {inCart ? 'Added' : 'Add to Cart'}
      </button>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function SellerShop() {
  const navigate = useNavigate();

  // Products
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [activeCat, setActiveCat] = useState('All');

  // Cart: { [productId]: { productId, qty, unit } }
  const [cart, setCart]           = useState({});

  // Order state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');

  // Load products
  useEffect(() => {
    api.get('/products')
      .then(({ data }) => setProducts(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Categories
  const categories = useMemo(() => ['All', ...new Set(products.map(p => p.category))], [products]);

  // Filtered products
  const filtered = useMemo(() => {
    let list = products;
    if (activeCat !== 'All') list = list.filter(p => p.category === activeCat);
    if (search.trim()) list = list.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    );
    return list;
  }, [products, activeCat, search]);

  // Add product to cart (default qty=1, first unit)
  const addToCart = product => {
    if (cart[product._id]) return; // already in cart — don't overwrite
    const units = getOrderingUnits(product.baseUnit);
    setCart(prev => ({
      ...prev,
      [product._id]: { productId: product._id, qty: '1', unit: units[0]?.value || product.baseUnit },
    }));
  };

  const updateCartItem = (productId, field, value) => {
    setCart(prev => ({ ...prev, [productId]: { ...prev[productId], [field]: value } }));
    setError('');
  };

  const removeFromCart = productId => {
    setCart(prev => { const next = { ...prev }; delete next[productId]; return next; });
  };

  const clearCart = () => setCart({});

  // Cart calculations
  const cartEntries = Object.values(cart);
  const cartItemCount = cartEntries.length;

  const cartTotal = cartEntries.reduce((sum, item) => {
    const prod = products.find(p => p._id === item.productId);
    if (!prod || !item.qty || !item.unit) return sum;
    const qty = parseFloat(item.qty);
    if (isNaN(qty) || qty <= 0) return sum;
    return sum + convertToBaseUnit(qty, item.unit) * prod.pricePerBaseUnit;
  }, 0);

  // Place order
  const placeOrder = async () => {
    setError('');
    // Validate
    for (const item of cartEntries) {
      if (!item.qty || parseFloat(item.qty) <= 0) {
        setError('Please enter a valid quantity for all cart items.');
        return;
      }
    }
    if (cartEntries.length === 0) { setError('Your cart is empty.'); return; }

    setSubmitting(true);
    try {
      await api.post('/orders', {
        items: cartEntries.map(i => ({
          productId:       i.productId,
          orderedQuantity: parseFloat(i.qty),
          orderedUnit:     i.unit,
        })),
      });
      setSuccess('Order placed successfully!');
      clearCart();
      setTimeout(() => { setSuccess(''); navigate('/seller/my-orders'); }, 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order.');
    } finally { setSubmitting(false); }
  };

  return (
    <Layout>
      {success && <div className="alert alert-success"><CheckCircle2 size={14} /> {success}</div>}
      {error   && <div className="alert alert-error"><AlertCircle size={14} /> {error}</div>}

      <div className="shop-layout">
        {/* ── Products Panel ── */}
        <div className="card" style={{ minWidth: 0 }}>
          {/* Header */}
          <div className="card-header">
            <div className="card-title">
              <FlaskConical size={15} />
              Products
              {!loading && (
                <span style={{ fontWeight: 400, color: 'var(--text-3)', fontSize: 12 }}>
                  ({filtered.length})
                </span>
              )}
            </div>
            <div className="search-wrap">
              <span className="search-icon"><Search size={13} /></span>
              <input
                id="shop-search"
                type="text"
                placeholder="Search by name or SKU…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Category tabs */}
          {!loading && categories.length > 1 && (
            <div className="cat-tabs">
              {categories.map(cat => (
                <button
                  key={cat}
                  id={`cat-${cat}`}
                  className={`cat-tab${activeCat === cat ? ' active' : ''}`}
                  onClick={() => setActiveCat(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="loading-center">
              <span className="spinner-blue" /> Loading products…
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <FlaskConical size={36} style={{ margin: '0 auto 10px', color: 'var(--text-4)' }} />
              <h3>No products found</h3>
              <p>{search ? 'Try a different search term' : 'No products in this category'}</p>
            </div>
          ) : (
            <div className="products-grid">
              {filtered.map(product => (
                <ProductCard
                  key={product._id}
                  product={product}
                  inCart={!!cart[product._id]}
                  onAdd={addToCart}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Cart Panel ── */}
        <div className="cart-panel">
          <div className="cart-header">
            <div className="cart-title">
              <ShoppingCart size={15} />
              Cart
              {cartItemCount > 0 && (
                <span className="cart-count">{cartItemCount}</span>
              )}
            </div>
            {cartItemCount > 0 && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 11, color: 'var(--red)', padding: '3px 7px' }}
                onClick={clearCart}
              >
                Clear
              </button>
            )}
          </div>

          {cartItemCount === 0 ? (
            <div className="cart-empty">
              <Package size={32} className="cart-empty-icon" style={{ margin: '0 auto 10px' }} />
              <p>Your cart is empty.<br />Click "Add to Cart" on any product.</p>
            </div>
          ) : (
            <>
              <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                {cartEntries.map(item => {
                  const product = products.find(p => p._id === item.productId);
                  return (
                    <CartItem
                      key={item.productId}
                      item={item}
                      product={product}
                      onQtyChange={v => updateCartItem(item.productId, 'qty', v)}
                      onUnitChange={v => updateCartItem(item.productId, 'unit', v)}
                      onRemove={() => removeFromCart(item.productId)}
                    />
                  );
                })}
              </div>

              <div className="cart-footer">
                <div className="cart-total-row">
                  <span className="cart-total-label">Total</span>
                  <span className="cart-total-value">{fmt(cartTotal)}</span>
                </div>
                <button
                  id="place-order-btn"
                  className="btn btn-primary btn-full"
                  onClick={placeOrder}
                  disabled={submitting || cartTotal === 0}
                >
                  {submitting
                    ? <><span className="spinner" /> Placing Order…</>
                    : 'Place Order'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
