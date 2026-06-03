// src/pages/admin/AdminProducts.jsx

import { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, X, AlertCircle, CheckCircle2, FlaskConical } from 'lucide-react';
import api from '../../api/axios';
import Layout from '../../components/Layout';

const UNIT_LABELS = { g: 'Grams (g)', ml: 'Milliliters (mL)', item: 'Item (piece)' };
const UNIT_SHORT  = { g: 'g', ml: 'mL', item: 'pc' };
const EMPTY = { name: '', sku: '', category: '', baseUnit: 'g', pricePerBaseUnit: '', stockQuantity: '' };
const fmt = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

export default function AdminProducts() {
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState(false);
  const [editTarget, setEdit]     = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [deleteTarget, setDelete] = useState(null);

  const fetchProducts = async (q = '') => {
    setLoading(true);
    try { const { data } = await api.get('/products', { params: q ? { search: q } : {} }); setProducts(data); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => { const t = setTimeout(() => fetchProducts(search), 300); return () => clearTimeout(t); }, [search]);

  const notify = msg => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };
  const openCreate = () => { setEdit(null); setForm(EMPTY); setError(''); setModal(true); };
  const openEdit   = p  => { setEdit(p); setForm({ name: p.name, sku: p.sku, category: p.category, baseUnit: p.baseUnit, pricePerBaseUnit: p.pricePerBaseUnit, stockQuantity: p.stockQuantity }); setError(''); setModal(true); };
  const onChange   = e  => { setForm(p => ({ ...p, [e.target.name]: e.target.value })); setError(''); };

  const handleSave = async e => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form, pricePerBaseUnit: +form.pricePerBaseUnit, stockQuantity: +form.stockQuantity };
      if (editTarget) { await api.put(`/products/${editTarget._id}`, payload); notify('Product updated'); }
      else            { await api.post('/products', payload); notify('Product created'); }
      setModal(false); fetchProducts(search);
    } catch (err) { setError(err.response?.data?.message || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    try { await api.delete(`/products/${id}`); notify('Product deleted'); setDelete(null); fetchProducts(search); }
    catch (err) { notify('Delete failed'); }
  };

  return (
    <Layout>
      {success && <div className="alert alert-success"><CheckCircle2 size={14} /> {success}</div>}

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <FlaskConical size={15} /> Products
            <span style={{ fontWeight: 400, color: 'var(--text-3)', fontSize: 12 }}>({products.length})</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="search-wrap">
              <span className="search-icon"><Search size={13} /></span>
              <input id="product-search" type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button id="add-product-btn" className="btn btn-primary btn-sm" onClick={openCreate}>
              <Plus size={13} /> Add Product
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-center"><span className="spinner-blue" /> Loading…</div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <FlaskConical size={34} style={{ margin: '0 auto 10px', color: 'var(--text-4)' }} />
            <h3>No products</h3>
            <p>{search ? 'Try a different search' : 'Add your first product'}</p>
          </div>
        ) : (
          <div className="table-wrap" style={{ padding: '0 0 4px' }}>
            <table>
              <thead>
                <tr><th>Name</th><th>SKU</th><th>Category</th><th>Unit</th><th>Price / Unit</th><th>Stock</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td><code style={{ fontSize: 11, color: 'var(--text-3)', background: 'var(--bg)', padding: '1px 5px', borderRadius: 4 }}>{p.sku}</code></td>
                    <td style={{ color: 'var(--text-2)' }}>{p.category}</td>
                    <td><span className="badge badge-blue" style={{ fontSize: 10 }}>{UNIT_LABELS[p.baseUnit]}</span></td>
                    <td style={{ fontWeight: 600 }}>
                      {fmt(p.pricePerBaseUnit)}<span style={{ color: 'var(--text-3)', fontSize: 11, fontWeight: 400 }}>/{UNIT_SHORT[p.baseUnit]}</span>
                    </td>
                    <td style={{ fontWeight: 600, color: p.stockQuantity < 100 ? 'var(--red)' : 'var(--green)' }}>
                      {p.stockQuantity.toLocaleString()} {UNIT_SHORT[p.baseUnit]}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button id={`edit-${p._id}`} className="btn btn-outline btn-sm" onClick={() => openEdit(p)}><Pencil size={12} /> Edit</button>
                        <button id={`del-${p._id}`}  className="btn btn-danger btn-sm"  onClick={() => setDelete(p)}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                {editTarget ? <Pencil size={15} /> : <Plus size={15} />}
                {editTarget ? 'Edit Product' : 'New Product'}
              </div>
              <button className="modal-close" onClick={() => setModal(false)}><X size={15} /></button>
            </div>
            {error && <div className="alert alert-error"><AlertCircle size={13} /> {error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Name *</label><input name="name" className="form-input" placeholder="Acetic Acid" value={form.name} onChange={onChange} required /></div>
                <div className="form-group"><label className="form-label">SKU *</label><input name="sku" className="form-input" placeholder="CHEM-001" value={form.sku} onChange={onChange} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Category *</label><input name="category" className="form-input" placeholder="Chemical, Solvent…" value={form.category} onChange={onChange} required /></div>
                <div className="form-group"><label className="form-label">Base Unit *</label>
                  <select name="baseUnit" className="form-select" value={form.baseUnit} onChange={onChange}>
                    <option value="g">Grams (g) — Weight</option>
                    <option value="ml">Milliliters (mL) — Volume</option>
                    <option value="item">Item (piece) — Count</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Price per unit (Rs.) *</label><input name="pricePerBaseUnit" type="number" step="0.001" min="0" className="form-input" placeholder="0.8" value={form.pricePerBaseUnit} onChange={onChange} required /></div>
                <div className="form-group"><label className="form-label">Stock Quantity *</label><input name="stockQuantity" type="number" step="1" min="0" className="form-input" placeholder="50000" value={form.stockQuantity} onChange={onChange} required /></div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
                <button id="save-product-btn" type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" /> Saving</> : editTarget ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDelete(null)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title"><Trash2 size={15} color="var(--red)" /> Delete Product</div>
              <button className="modal-close" onClick={() => setDelete(null)}><X size={15} /></button>
            </div>
            <p style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.6 }}>
              Delete <strong>{deleteTarget.name}</strong>? This cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setDelete(null)}>Cancel</button>
              <button id="confirm-delete-btn" className="btn btn-danger" onClick={() => handleDelete(deleteTarget._id)}>
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
