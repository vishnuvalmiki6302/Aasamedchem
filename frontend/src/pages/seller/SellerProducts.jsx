// src/pages/seller/SellerProducts.jsx — Light theme + Lucide icons

import { useState, useEffect } from 'react';
import { Search, FlaskConical, Tag, Scale } from 'lucide-react';
import api from '../../api/axios';
import Layout from '../../components/Layout';

const UNIT_SHORT = { g: 'g', ml: 'mL', item: 'pc' };
const fmt = n =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

export default function SellerProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

  const fetchProducts = async (q = '') => {
    setLoading(true);
    try {
      const { data } = await api.get('/products', { params: q ? { search: q } : {} });
      setProducts(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => {
    const t = setTimeout(() => fetchProducts(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const categories = [...new Set(products.map(p => p.category))];

  return (
    <Layout>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <span className="icon-label"><FlaskConical size={15} />
              Product Catalog <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({products.length})</span>
            </span>
          </h3>
          <div className="search-bar">
            <span className="search-icon"><Search size={14} /></span>
            <input
              id="seller-product-search"
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-page"><span className="loading-spinner-blue" /> Loading catalog…</div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <FlaskConical size={40} className="empty-icon" />
            <h3>No products found</h3>
            <p>{search ? 'Try a different search term' : 'Contact your administrator to add products'}</p>
          </div>
        ) : (
          <div>
            {categories.map(cat => {
              const catProds = products.filter(p => p.category === cat);
              return (
                <div key={cat} style={{ marginBottom: 28 }}>
                  {/* Category header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 12, fontWeight: 700, color: 'var(--blue-700)',
                    textTransform: 'uppercase', letterSpacing: '.8px',
                    marginBottom: 12, paddingBottom: 8,
                    borderBottom: '2px solid var(--blue-100)',
                  }}>
                    <Tag size={13} />
                    {cat}
                    <span style={{ fontWeight: 400, color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>
                      · {catProds.length} product{catProds.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Product cards grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
                    {catProds.map(p => (
                      <div key={p._id} className="product-grid-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3, flex: 1 }}>{p.name}</div>
                          <code style={{ fontSize: 10, background: 'var(--bg-input)', padding: '2px 5px', borderRadius: 4, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }}>
                            {p.sku}
                          </code>
                        </div>

                        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                          <span className="badge badge-seller" style={{ fontSize: 10 }}>{p.category}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                          <div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--blue-700)' }}>
                              {fmt(p.pricePerBaseUnit)}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Scale size={10} /> per {UNIT_SHORT[p.baseUnit]}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{
                              fontSize: 14, fontWeight: 700,
                              color: p.stockQuantity < 100 ? 'var(--danger)' : 'var(--success)',
                            }}>
                              {p.stockQuantity.toLocaleString()}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {UNIT_SHORT[p.baseUnit]} in stock
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
