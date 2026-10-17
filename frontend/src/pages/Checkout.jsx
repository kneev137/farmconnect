import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Banknote, Smartphone, ShieldCheck, ArrowRight, Home, Briefcase, MapPin, Plus, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import AddressModal from '../components/AddressModal';
import api from '../services/api';
import '../styles/cart.css';

const PAYMENT_METHODS = [
  { value: 'card', label: 'Credit / Debit Card', icon: CreditCard },
  { value: 'upi', label: 'UPI', icon: Smartphone },
  { value: 'cod', label: 'Cash on Delivery', icon: Banknote },
];

export default function Checkout() {
  const { cart, grandTotal, checkout } = useCart();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [customAddress, setCustomAddress] = useState('');
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const farmerShare = (grandTotal * 0.9).toFixed(2);
  const platformFee = (grandTotal * 0.1).toFixed(2);

  const loadAddresses = async () => {
    try {
      const data = await api.get('/addresses/');
      const list = Array.isArray(data) ? data : data?.results || [];
      setAddresses(list);

      // Default selection logic: Pick default address or first address
      if (list.length > 0) {
        const defaultAddr = list.find((a) => a.is_default) || list[0];
        setSelectedAddress((prev) => {
          if (prev) {
            // Keep current selection if still present in list
            const stillExists = list.find((a) => a.id === prev.id);
            return stillExists || defaultAddr;
          }
          return defaultAddr;
        });
        setUseCustomAddress(false);
      } else {
        // No saved address: fallback to user default text or custom input
        setUseCustomAddress(true);
        setCustomAddress(user?.consumer_profile?.default_delivery_address || '');
      }
    } catch {
      setUseCustomAddress(true);
      setCustomAddress(user?.consumer_profile?.default_delivery_address || '');
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const getEffectiveAddressString = () => {
    if (useCustomAddress) {
      return customAddress.trim();
    }
    if (selectedAddress) {
      return selectedAddress.full_address || selectedAddress.street_address;
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const effectiveAddress = getEffectiveAddressString();

    if (!effectiveAddress) {
      setError('Please select or enter a delivery address.');
      return;
    }
    setSubmitting(true);
    setError('');

    const res = await checkout(effectiveAddress, paymentMethod);
    if (!res.success) {
      setError(res.error || 'Checkout failed');
      setSubmitting(false);
      return;
    }

    const order = res.order;
    if (paymentMethod !== 'cod' && order?.payment?.id) {
      try {
        await api.post(`/payments/${order.payment.id}/pay/`);
      } catch {
        /* payment simulation optional */
      }
    }

    navigate('/orders', { state: { newOrderId: order?.id } });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'home':
        return <Home size={15} />;
      case 'office':
        return <Briefcase size={15} />;
      default:
        return <MapPin size={15} />;
    }
  };

  if (!cart?.items?.length) {
    return (
      <div className="container checkout-page">
        <h1 className="title-lg">Checkout</h1>
        <div className="checkout-empty card">
          <p>Your cart is empty. Add some fresh produce first!</p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/')}>
            Browse Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container checkout-page">
      <h1 className="title-lg" style={{ marginBottom: '24px' }}>Checkout</h1>

      <div className="checkout-layout">
        <form onSubmit={handleSubmit} className="checkout-form card">
          {/* Section: Delivery Address like Swiggy / Blinkit */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 className="title-sm" style={{ margin: 0 }}>Delivery Address</h2>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Plus size={15} />
              <span>Manage / Add New</span>
            </button>
          </div>

          {/* Quick Address Cards Selector (Home, Office, Other) */}
          {addresses.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px', marginBottom: '14px' }}>
              {addresses.map((addr) => {
                const isSelected = !useCustomAddress && selectedAddress?.id === addr.id;
                return (
                  <div
                    key={addr.id}
                    onClick={() => {
                      setSelectedAddress(addr);
                      setUseCustomAddress(false);
                    }}
                    style={{
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                      backgroundColor: isSelected ? 'var(--primary-subtle)' : 'var(--surface)',
                      borderRadius: '12px',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                        }}
                      >
                        {getTypeIcon(addr.address_type)}
                        {addr.address_type}
                      </span>
                      {isSelected && <Check size={16} color="var(--primary)" />}
                    </div>

                    {addr.recipient_name && (
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {addr.recipient_name}
                      </div>
                    )}

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                      {addr.street_address}
                      {addr.city && `, ${addr.city}`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Fallback / Custom Address Entry Toggle */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={useCustomAddress}
                onChange={(e) => setUseCustomAddress(e.target.checked)}
                style={{ width: '15px', height: '15px', accentColor: 'var(--primary)' }}
              />
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Deliver to a different address for this order</span>
            </label>

            {useCustomAddress && (
              <textarea
                className="form-textarea"
                rows="3"
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                placeholder="House no., street, landmark, city, pin code..."
                required={useCustomAddress}
              />
            )}
          </div>

          <h2 className="title-sm" style={{ marginTop: '16px' }}>Payment Method</h2>
          <div className="payment-methods">
            {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
              <label key={value} className={`payment-method ${paymentMethod === value ? 'payment-method--active' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value={value}
                  checked={paymentMethod === value}
                  onChange={() => setPaymentMethod(value)}
                />
                <Icon size={20} />
                <span>{label}</span>
              </label>
            ))}
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '20px' }} disabled={submitting}>
            {submitting ? 'Placing Order...' : 'Place Order'}
            <ArrowRight size={18} />
          </button>
        </form>

        <aside className="checkout-summary card">
          <h2 className="title-sm">Order Summary</h2>
          <ul className="checkout-items">
            {cart.items.map((item) => (
              <li key={item.id} className="checkout-item">
                <span className="checkout-item__name">{item.product_name}</span>
                <span className="checkout-item__qty">× {item.quantity}</span>
                <span className="checkout-item__price">
                  ₹{(item.item_total || item.quantity * item.price_per_unit).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>

          <div className="checkout-transparency">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1"><ShieldCheck size={14} /> Farmer Share (90%)</span>
              <span>₹{farmerShare}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Platform & Delivery (10%)</span>
              <span>₹{platformFee}</span>
            </div>
          </div>

          <div className="checkout-total">
            <span>Grand Total</span>
            <span>₹{parseFloat(grandTotal).toFixed(2)}</span>
          </div>
        </aside>
      </div>

      {/* Address Management Modal (Swiggy/Blinkit style) */}
      <AddressModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        addresses={addresses}
        selectedAddressId={selectedAddress?.id}
        onSelectAddress={(addr) => {
          setSelectedAddress(addr);
          setUseCustomAddress(false);
        }}
        onAddressesUpdated={async () => {
          await loadAddresses();
          if (refreshUser) await refreshUser();
        }}
      />
    </div>
  );
}
