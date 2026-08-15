import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Package, Truck, CheckCircle2, Clock, Star,
  XCircle, CreditCard, MessageSquare
} from 'lucide-react';
import api from '../services/api';
import '../styles/cart.css';

const DELIVERY_STEPS = [
  { key: 'preparing', label: 'Preparing', icon: Clock },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

const STATUS_ORDER = ['preparing', 'out_for_delivery', 'delivered'];

function DeliveryTimeline({ delivery }) {
  if (!delivery) return null;
  const currentIdx = STATUS_ORDER.indexOf(delivery.status);

  return (
    <div className="delivery-timeline">
      {DELIVERY_STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isComplete = currentIdx >= idx;
        const isCurrent = delivery.status === step.key;
        return (
          <div
            key={step.key}
            className={`delivery-step ${isComplete ? 'delivery-step--complete' : ''} ${isCurrent ? 'delivery-step--current' : ''}`}
          >
            <div className="delivery-step__icon"><Icon size={18} /></div>
            <span className="delivery-step__label">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function ReviewModal({ order, onClose, onSubmitted }) {
  const [productId, setProductId] = useState(order.items[0]?.product || '');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/reviews/', { product: productId, rating, comment });
      onSubmitted();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="title-md" style={{ marginBottom: '16px' }}>
          <MessageSquare size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
          Leave a Review
        </h2>
        <form onSubmit={handleSubmit}>
          {order.items.length > 1 && (
            <div className="form-group">
              <label className="form-label">Product</label>
              <select className="form-select" value={productId} onChange={(e) => setProductId(e.target.value)}>
                {order.items.map((item) => (
                  <option key={item.id} value={item.product}>{item.product_name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Rating</label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className={`star-rating__star ${s <= rating ? 'star-rating__star--active' : ''}`}
                >
                  <Star size={20} fill={s <= rating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Comment</label>
            <textarea className="form-textarea" value={comment} onChange={(e) => setComment(e.target.value)} required />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <div className="flex gap-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OrderCard({ order, onCancel, onPay, onReview }) {
  const statusColors = {
    pending: 'badge-warning',
    confirmed: 'badge-success',
    shipped: 'badge-category',
    delivered: 'badge-success',
    cancelled: 'badge-warning',
  };

  const canCancel = ['pending', 'confirmed'].includes(order.status);
  const canPay = order.payment?.status === 'pending' && order.payment?.method !== 'cod';
  const canReview = order.status === 'delivered';

  return (
    <article className="order-card card">
      <div className="order-card__header">
        <div>
          <span className="text-muted text-xs">Order #{order.id}</span>
          <div className="title-sm">₹{parseFloat(order.total_amount).toFixed(2)}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${statusColors[order.status] || 'badge-category'}`}>
            {order.status}
          </span>
          <span className="text-xs text-muted">
            {new Date(order.placed_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <ul className="order-items-list">
        {order.items.map((item) => (
          <li key={item.id}>
            <span>{item.product_name}</span>
            <span className="text-muted">× {item.quantity} {item.unit}</span>
            <span>₹{item.item_total?.toFixed(2)}</span>
          </li>
        ))}
      </ul>

      {order.delivery && order.status !== 'cancelled' && (
        <DeliveryTimeline delivery={order.delivery} />
      )}

      {order.delivery?.address && (
        <p className="text-xs text-muted" style={{ marginTop: '8px' }}>
          📍 {order.delivery.address}
        </p>
      )}

      <div className="order-card__actions">
        {canPay && (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onPay(order)}>
            <CreditCard size={14} /> Complete Payment
          </button>
        )}
        {canReview && (
          <button type="button" className="btn btn-outline btn-sm" onClick={() => onReview(order)}>
            <Star size={14} /> Write Review
          </button>
        )}
        {canCancel && (
          <button type="button" className="btn btn-danger btn-sm" onClick={() => onCancel(order.id)}>
            <XCircle size={14} /> Cancel Order
          </button>
        )}
      </div>
    </article>
  );
}

export default function Orders() {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [successMsg, setSuccessMsg] = useState(
    location.state?.newOrderId ? `Order #${location.state.newOrderId} placed successfully!` : ''
  );

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await api.get('/orders/');
      setOrders(Array.isArray(data) ? data : data.results || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancel = async (orderId) => {
    if (!confirm('Cancel this order? Stock will be restored.')) return;
    try {
      await api.post(`/orders/${orderId}/cancel/`);
      await fetchOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePay = async (order) => {
    try {
      await api.post(`/payments/${order.payment.id}/pay/`);
      await fetchOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="container orders-page">
      <div className="orders-page__header">
        <Package size={28} color="var(--primary)" />
        <h1 className="title-lg">My Orders</h1>
      </div>

      {successMsg && (
        <div className="orders-success">{successMsg}</div>
      )}

      {loading ? (
        <p className="text-muted">Loading orders...</p>
      ) : orders.length === 0 ? (
        <div className="checkout-empty card">
          <Package size={40} color="var(--text-muted)" />
          <h3 className="title-sm">No orders yet</h3>
          <p className="text-muted text-sm">Your order history will appear here after checkout.</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onCancel={handleCancel}
              onPay={handlePay}
              onReview={setReviewOrder}
            />
          ))}
        </div>
      )}

      {reviewOrder && (
        <ReviewModal
          order={reviewOrder}
          onClose={() => setReviewOrder(null)}
          onSubmitted={fetchOrders}
        />
      )}
    </div>
  );
}
