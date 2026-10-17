import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { 
  X, ShoppingBag, Plus, Minus, Trash2, 
  ArrowRight, ShieldCheck, Sparkles 
} from 'lucide-react';

function CartItemRow({ item, updateQuantity, removeFromCart }) {
  const [localQty, setLocalQty] = useState(item.quantity);

  useEffect(() => {
    setLocalQty(item.quantity);
  }, [item.quantity]);

  const handleBlur = () => {
    let parsed = parseFloat(localQty);
    if (isNaN(parsed) || parsed <= 0) {
      removeFromCart(item.id);
    } else if (parsed !== parseFloat(item.quantity)) {
      updateQuantity(item.id, parsed);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  return (
    <div
      className="card flex items-center justify-between"
      style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface-alt)' }}
    >
      <div style={{ flex: 1 }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'capitalize' }}>
          {item.product_name}
        </h4>
        <span className="text-muted text-xs">
          ₹{parseFloat(item.price_per_unit).toFixed(2)} / {item.unit}
        </span>
        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
          ₹{item.item_total ? item.item_total.toFixed(2) : (item.quantity * item.price_per_unit).toFixed(2)}
        </div>
      </div>

      {/* Quantity Controller */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1" style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '2px 4px'
        }}>
          <button
            onClick={() => {
              const current = parseFloat(item.quantity) || 1;
              const step = current <= 1 ? 0.25 : 1;
              const next = parseFloat((current - step).toFixed(3));
              if (next <= 0) removeFromCart(item.id);
              else updateQuantity(item.id, next);
            }}
            className="btn-icon"
            style={{ padding: '3px', color: 'var(--text-secondary)' }}
            title="Decrease quantity"
          >
            <Minus size={14} />
          </button>

          {/* Typable Quantity Input */}
          <input
            type="number"
            min="0.001"
            step="any"
            value={localQty}
            onChange={(e) => setLocalQty(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={{
              width: '56px',
              textAlign: 'center',
              fontSize: '0.85rem',
              fontWeight: 800,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-main)',
              outline: 'none',
              padding: '0 2px'
            }}
            title="Type custom quantity (e.g. 1.5, 0.5, 0.25)"
          />

          <button
            onClick={() => {
              const current = parseFloat(item.quantity) || 0;
              const step = current < 1 ? 0.25 : 1;
              const next = parseFloat((current + step).toFixed(3));
              updateQuantity(item.id, next);
            }}
            className="btn-icon"
            style={{ padding: '3px', color: 'var(--text-secondary)' }}
            title="Increase quantity"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Trash Button */}
        <button
          onClick={() => removeFromCart(item.id)}
          className="btn-icon"
          style={{ color: 'var(--warning)', padding: '6px' }}
          title="Remove item"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

export default function CartDrawer() {
  const { cart, isCartOpen, closeCart, updateQuantity, removeFromCart, clearCart, grandTotal } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const handleCheckoutClick = () => {
    closeCart();
    if (!isAuthenticated) {
      navigate('/login?redirect=checkout');
    } else {
      navigate('/checkout');
    }
  };

  const farmerTotal = (grandTotal * 0.9).toFixed(2);
  const platformFee = (grandTotal * 0.1).toFixed(2);

  return (
    <div className="drawer-overlay" onClick={closeCart}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between" style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} color="var(--primary)" />
            <h2 className="title-sm">Your Fresh Cart</h2>
            {cart?.items?.length > 0 && (
              <span className="badge badge-category">{cart.items.length} items</span>
            )}
          </div>
          <button onClick={closeCart} className="btn-icon" style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Cart Item List */}
        <div className="flex-1" style={{ overflowY: 'auto', padding: '16px 0' }}>
          {(!cart?.items || cart.items.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--surface-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <ShoppingBag size={32} />
              </div>
              <h3 className="title-sm" style={{ color: 'var(--text-main)', marginBottom: '4px' }}>Your cart is empty</h3>
              <p className="text-xs">Explore local farm fresh produce and add items to your cart.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {cart.items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  updateQuantity={updateQuantity}
                  removeFromCart={removeFromCart}
                />
              ))}

              <div style={{ textAlign: 'right', marginTop: '4px' }}>
                <button
                  onClick={clearCart}
                  style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Clear all items
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer & Checkout Summary */}
        {cart?.items?.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            
            {/* Price Transparency Breakdown Banner */}
            <div style={{
              backgroundColor: 'var(--primary-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              marginBottom: '16px',
              fontSize: '0.78rem',
              color: 'var(--primary)'
            }}>
              <div className="flex items-center justify-between font-semibold" style={{ marginBottom: '4px' }}>
                <span className="flex items-center gap-1">
                  <ShieldCheck size={14} /> Direct Farmer Share (90%):
                </span>
                <span>₹{farmerTotal}</span>
              </div>
              <div className="flex items-center justify-between text-muted text-xs">
                <span>Platform & Delivery Operations (10%):</span>
                <span>₹{platformFee}</span>
              </div>
            </div>

            {/* Total Row */}
            <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
              <div>
                <span className="text-muted text-xs">Grand Total</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  ₹{parseFloat(grandTotal).toFixed(2)}
                </div>
              </div>

              <button
                onClick={handleCheckoutClick}
                className="btn btn-primary btn-lg"
                style={{ padding: '12px 24px', fontSize: '1rem' }}
              >
                <span>Checkout</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
