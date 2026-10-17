import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, IndianRupee, Package, AlertTriangle,
  Plus, Pencil, Trash2, Sprout, Truck, ClipboardList,
  Upload, Image as ImageIcon
} from 'lucide-react';
import api, { mediaUrl } from '../services/api';
import '../styles/dashboard.css';

const CATEGORIES = ['vegetable', 'fruit', 'grain', 'dairy', 'other'];
const DELIVERY_STATUSES = [
  { value: 'preparing', label: 'Preparing' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
];

const EMPTY_PRODUCT = {
  name: '', category: 'vegetable', description: '', price_per_unit: '',
  unit: 'kg', farm: '', initial_stock: '10', is_active: true,
};

function MetricCard({ icon: Icon, label, value, accent }) {
  return (
    <div className={`metric-card metric-card--${accent}`}>
      <div className="metric-card__icon"><Icon size={22} /></div>
      <div>
        <div className="metric-card__value">{value}</div>
        <div className="metric-card__label">{label}</div>
      </div>
    </div>
  );
}

function ProductFormModal({ product, farms, onSave, onClose }) {
  const [form, setForm] = useState(product || { ...EMPTY_PRODUCT, farm: farms[0]?.id || '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(product?.image ? mediaUrl(product.image) : null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!product?.id;

  const update = (field) => (e) => {
    const val = field === 'is_active' ? e.target.checked : e.target.value;
    setForm({ ...form, [field]: val });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('category', form.category);
      formData.append('description', form.description || '');
      formData.append('price_per_unit', form.price_per_unit);
      formData.append('unit', form.unit);
      formData.append('farm', parseInt(form.farm, 10));
      formData.append('is_active', form.is_active);

      if (!isEdit) {
        formData.append('initial_stock', form.initial_stock || '0');
      }

      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (isEdit) {
        await api.request(`/products/${product.id}/`, {
          method: 'PATCH',
          body: formData,
        });
      } else {
        await api.request('/products/', {
          method: 'POST',
          body: formData,
        });
      }
      onSave();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 className="title-md" style={{ marginBottom: '16px' }}>
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="dashboard-form-grid">
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input className="form-input" value={form.name} onChange={update('name')} required placeholder="e.g. Organic Tomatoes" />
            </div>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-select" value={form.category} onChange={update('category')}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Price (₹) *</label>
              <input type="number" step="0.01" min="0.01" className="form-input" value={form.price_per_unit} onChange={update('price_per_unit')} required placeholder="e.g. 40.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Unit *</label>
              <input className="form-input" value={form.unit} onChange={update('unit')} placeholder="kg, dozen, litre, g" required />
            </div>
            <div className="form-group">
              <label className="form-label">Farm *</label>
              <select className="form-select" value={form.farm} onChange={update('farm')} required>
                {farms.map((f) => <option key={f.id} value={f.id}>{f.name} — {f.location}</option>)}
              </select>
            </div>
            {!isEdit && (
              <div className="form-group">
                <label className="form-label">Initial Stock</label>
                <input type="number" step="any" min="0" className="form-input" value={form.initial_stock} onChange={update('initial_stock')} placeholder="e.g. 25" />
              </div>
            )}
          </div>

          {/* Product Picture Upload */}
          <div className="form-group" style={{ marginTop: '4px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ImageIcon size={16} /> Product Picture
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '14px',
              border: '2px dashed var(--border)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--surface-alt)'
            }}>
              {imagePreview ? (
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: '1px solid var(--border)'
                }}>
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--surface-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  flexShrink: 0,
                  border: '1px solid var(--border)'
                }}>
                  <ImageIcon size={30} />
                </div>
              )}

              <div style={{ flex: 1 }}>
                <input
                  type="file"
                  id="product-image-upload"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor="product-image-upload"
                  className="btn btn-outline btn-sm"
                  style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Upload size={14} />
                  <span>{imagePreview ? 'Change Picture' : 'Upload Picture'}</span>
                </label>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Supports PNG, JPG, or WEBP (Max 5MB)
                </div>
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '8px' }}>
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows="2" value={form.description} onChange={update('description')} placeholder="Fresh organic produce details, farm harvesting notes..." />
          </div>

          <label className="filter-checkbox" style={{ marginTop: '6px' }}>
            <input type="checkbox" checked={form.is_active} onChange={update('is_active')} />
            <span>Active listing (visible in marketplace)</span>
          </label>

          {error && <p className="auth-error" style={{ marginTop: '10px' }}>{error}</p>}

          <div className="flex gap-2" style={{ marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function HarvestModal({ products, onSave, onClose }) {
  const [form, setForm] = useState({
    product: products[0]?.id || '',
    harvest_date: new Date().toISOString().split('T')[0],
    quantity_harvested: '',
    notes: 'Freshly picked',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/harvest-records/', {
        product: parseInt(form.product, 10),
        harvest_date: form.harvest_date,
        quantity_harvested: parseFloat(form.quantity_harvested),
        notes: form.notes,
      });
      onSave();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="title-md" style={{ marginBottom: '16px' }}>Log Harvest</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Product</label>
            <select className="form-select" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })}>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="dashboard-form-grid">
            <div className="form-group">
              <label className="form-label">Harvest Date</label>
              <input type="date" className="form-input" value={form.harvest_date} onChange={(e) => setForm({ ...form, harvest_date: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Quantity Harvested</label>
              <input type="number" step="0.01" className="form-input" value={form.quantity_harvested} onChange={(e) => setForm({ ...form, quantity_harvested: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <input className="form-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <div className="flex gap-2" style={{ marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-success" disabled={saving}>
              {saving ? 'Logging...' : 'Log Harvest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FarmerDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [products, setProducts] = useState([]);
  const [farms, setFarms] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showHarvestForm, setShowHarvestForm] = useState(false);
  const [stockEdits, setStockEdits] = useState({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [metricsData, productsData, farmsData, inventoryData, ordersData] = await Promise.all([
        api.get('/farmer/metrics/'),
        api.get('/my-products/'),
        api.get('/farms/'),
        api.get('/inventory/'),
        api.get('/farmer-orders/'),
      ]);
      setMetrics(metricsData);
      setProducts(Array.isArray(productsData) ? productsData : productsData.results || []);
      setFarms(Array.isArray(farmsData) ? farmsData : farmsData.results || []);
      setInventory(Array.isArray(inventoryData) ? inventoryData : inventoryData.results || []);
      setOrders(Array.isArray(ordersData) ? ordersData : ordersData.results || []);
    } catch {
      /* partial load ok */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const inventoryMap = inventory.reduce((acc, inv) => {
    acc[inv.product] = inv;
    return acc;
  }, {});

  const handleDeleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}/`);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStockSave = async (productId) => {
    const inv = inventoryMap[productId];
    const newQty = stockEdits[productId];
    if (!inv || newQty === undefined) return;
    try {
      await api.patch(`/inventory/${inv.id}/`, { quantity_available: parseFloat(newQty) });
      setStockEdits((prev) => { const n = { ...prev }; delete n[productId]; return n; });
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeliveryUpdate = async (deliveryId, status) => {
    try {
      await api.patch(`/deliveries/${deliveryId}/status/`, { status });
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateFarm = async () => {
    const name = prompt('Farm name:');
    const location = prompt('Farm location:');
    if (!name) return;
    try {
      await api.post('/farms/', { name, location: location || '', description: '' });
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="container dashboard-page">
        <p className="text-muted">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container dashboard-page">
      <div className="dashboard-header">
        <LayoutDashboard size={28} color="var(--primary)" />
        <div>
          <h1 className="title-lg">Farmer Operations Desk</h1>
          <p className="text-muted text-sm">Manage products, inventory, orders, and harvests</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="metrics-grid">
        <MetricCard icon={IndianRupee} label="Total Revenue" value={`₹${parseFloat(metrics?.total_revenue || 0).toFixed(0)}`} accent="green" />
        <MetricCard icon={Package} label="Active Orders" value={metrics?.active_orders || 0} accent="blue" />
        <MetricCard icon={Sprout} label="Total Products" value={metrics?.total_products || 0} accent="sage" />
        <MetricCard icon={AlertTriangle} label="Low Stock Alerts" value={metrics?.low_stock_products || 0} accent="amber" />
      </div>

      {/* Products Section */}
      <section className="dashboard-section card">
        <div className="dashboard-section__header">
          <h2 className="title-sm">My Products</h2>
          <div className="flex gap-2">
            {farms.length === 0 && (
              <button type="button" className="btn btn-outline btn-sm" onClick={handleCreateFarm}>
                <Plus size={14} /> Add Farm
              </button>
            )}
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowHarvestForm(true)} disabled={!products.length}>
              <ClipboardList size={14} /> Log Harvest
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => { setEditProduct(null); setShowProductForm(true); }}
              disabled={!farms.length}
            >
              <Plus size={14} /> Add Product
            </button>
          </div>
        </div>

        {products.length === 0 ? (
          <p className="text-muted text-sm">No products yet. Create a farm first, then add products.</p>
        ) : (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const stock = parseFloat(p.quantity_available || 0);
                  const isLow = stock <= 5;
                  return (
                    <tr key={p.id} className={isLow ? 'dashboard-table__row--warning' : ''}>
                      <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{p.name}</td>
                      <td><span className="badge badge-category">{p.category}</span></td>
                      <td>₹{parseFloat(p.price_per_unit).toFixed(2)}/{p.unit}</td>
                      <td>
                        <div className="stock-editor">
                          <input
                            type="number"
                            className="form-input stock-editor__input"
                            value={stockEdits[p.id] ?? stock}
                            onChange={(e) => setStockEdits({ ...stockEdits, [p.id]: e.target.value })}
                          />
                          {stockEdits[p.id] !== undefined && (
                            <button type="button" className="btn btn-success btn-sm" onClick={() => handleStockSave(p.id)}>
                              Save
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${p.is_active ? 'badge-success' : 'badge-warning'}`}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button type="button" className="btn-icon" onClick={() => { setEditProduct(p); setShowProductForm(true); }} title="Edit">
                            <Pencil size={15} />
                          </button>
                          <button type="button" className="btn-icon" style={{ color: 'var(--warning)' }} onClick={() => handleDeleteProduct(p.id)} title="Delete">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Farmer Orders */}
      <section className="dashboard-section card">
        <div className="dashboard-section__header">
          <h2 className="title-sm"><Truck size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Incoming Orders</h2>
        </div>

        {orders.length === 0 ? (
          <p className="text-muted text-sm">No orders containing your products yet.</p>
        ) : (
          <div className="farmer-orders-list">
            {orders.map((order) => (
              <div key={order.id} className="farmer-order-card">
                <div className="farmer-order-card__header">
                  <span className="font-semibold">Order #{order.id}</span>
                  <span className="text-muted text-xs">{order.consumer_name} · ₹{parseFloat(order.total_amount).toFixed(2)}</span>
                  <span className={`badge badge-category`}>{order.status}</span>
                </div>
                <ul className="text-sm text-muted" style={{ marginBottom: '10px' }}>
                  {order.items.filter((i) => i.farm_name).map((item) => (
                    <li key={item.id}>{item.quantity} × {item.product_name} ({item.farm_name})</li>
                  ))}
                </ul>
                {order.delivery && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted">Delivery: {order.delivery.status.replace(/_/g, ' ')}</span>
                    {DELIVERY_STATUSES.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        className={`btn btn-sm ${order.delivery.status === s.value ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => handleDeliveryUpdate(order.delivery.id, s.value)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {showProductForm && (
        <ProductFormModal
          product={editProduct}
          farms={farms}
          onSave={loadData}
          onClose={() => { setShowProductForm(false); setEditProduct(null); }}
        />
      )}

      {showHarvestForm && (
        <HarvestModal
          products={products}
          onSave={loadData}
          onClose={() => setShowHarvestForm(false)}
        />
      )}
    </div>
  );
}
