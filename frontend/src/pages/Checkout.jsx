import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Banknote, Smartphone, ShieldCheck, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/cart.css';

const PAYMENT_METHODS = [
  { value: 'card', label: 'Credit / Debit Card', icon: CreditCard },
  { value: 'upi', label: 'UPI', icon: Smartphone },
  { value: 'cod', label: 'Cash on Delivery', icon: Banknote },
];

export default function Checkout() {
  const { cart, grandTotal, checkout } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState(user?.consumer_profile?.default_delivery_address || '');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const farmerShare = (grandTotal * 0.9).toFixed(2);
  const platformFee = (grandTotal * 0.1).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address.trim()) {
      setError('Please enter a delivery address.');
      return;
    }
    setSubmitting(true);
    setError('');

    const res = await checkout(address.trim(), paymentMethod);
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
          <h2 className="title-sm">Delivery Details</h2>
          <div className="form-group">
            <label className="form-label" htmlFor="address">Delivery Address</label>
            <textarea
              id="address"
              className="form-textarea"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House no., street, city, pin code..."
              required
            />
          </div>

          <h2 className="title-sm" style={{ marginTop: '8px' }}>Payment Method</h2>
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

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '16px' }} disabled={submitting}>
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
    </div>
  );
}
