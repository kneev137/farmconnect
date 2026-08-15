import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { mediaUrl } from '../services/api';
import FreshnessBadge from './FreshnessBadge';
import { 
  ShoppingBag, Star, MapPin, CheckCircle2, 
  Info, Leaf
} from 'lucide-react';

export default function ProductCard({ product, onShowTransparency }) {
  const { addToCart } = useCart();
  const { isAuthenticated, isFarmer } = useAuth();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const stock = parseFloat(product.quantity_available || 0);
  const isOutOfStock = stock <= 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (isOutOfStock || isFarmer) return;

    setAdding(true);
    const res = await addToCart(product.id, 1);
    setAdding(false);

    if (res.success) {
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2000);
    } else if (res.requireAuth) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
    } else {
      alert(res.error || 'Failed to add to cart');
    }
  };

  // Category fallback illustrations/icons
  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'vegetable': return '#2D6A4F';
      case 'fruit': return '#E76F51';
      case 'grain': return '#D4A373';
      case 'dairy': return '#457B9D';
      default: return '#52B788';
    }
  };

  return (
    <div className="card card-hover flex flex-col justify-between" style={{
      padding: '16px',
      position: 'relative',
      height: '100%',
      backgroundColor: 'var(--surface)',
      border: '1px solid var(--border)'
    }}>
      
      {/* Top Banner / Image Area */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '160px',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        backgroundColor: 'var(--surface-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '14px'
      }}>
        {mediaUrl(product.image) ? (
          <img
            src={mediaUrl(product.image)}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ textAlign: 'center', color: getCategoryColor(product.category) }}>
            <Leaf size={48} strokeWidth={1.5} />
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginTop: '4px', letterSpacing: '0.05em' }}>
              {product.category}
            </span>
          </div>
        )}

        {product.freshness?.label && (
          <div style={{ position: 'absolute', top: '8px', left: '8px', boxShadow: 'var(--shadow-xs)' }}>
            <FreshnessBadge freshness={product.freshness} />
          </div>
        )}

        {/* Category Pill (Absolute top-right) */}
        <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
          <span className="badge badge-category" style={{ fontSize: '0.72rem', backgroundColor: 'rgba(255,255,255,0.9)' }}>
            {product.category}
          </span>
        </div>
      </div>

      {/* Product Information */}
      <div className="flex-1 flex flex-col">
        
        {/* Farm & Location */}
        <div className="flex items-center justify-between" style={{ marginBottom: '4px' }}>
          {product.farmer_id ? (
            <Link
              to={`/farmers/${product.farmer_id}`}
              style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}
              title="View Farmer Portfolio"
            >
              {product.farm_name}
            </Link>
          ) : (
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>
              {product.farm_name}
            </span>
          )}
          {product.farm_location && (
            <span className="flex items-center gap-1 text-muted" style={{ fontSize: '0.75rem' }}>
              <MapPin size={11} />
              <span>{product.farm_location}</span>
            </span>
          )}
        </div>

        {/* Product Title */}
        <Link to={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
          <h3 className="title-sm" style={{ 
            color: 'var(--text-main)', 
            marginBottom: '6px',
            textTransform: 'capitalize' 
          }}>
            {product.name}
          </h3>
        </Link>

        {/* Description snippet */}
        {product.description && (
          <p className="text-muted text-xs" style={{ 
            marginBottom: '10px', 
            overflow: 'hidden', 
            display: '-webkit-box', 
            WebkitLineClamp: 2, 
            WebkitBoxOrient: 'vertical' 
          }}>
            {product.description}
          </p>
        )}

        {/* Rating & Stock row */}
        <div className="flex items-center justify-between" style={{ marginTop: 'auto', marginBottom: '12px' }}>
          <div className="flex items-center gap-1">
            {product.avg_rating ? (
              <span className="flex items-center gap-1" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#D97706' }}>
                <Star size={14} fill="#D97706" color="#D97706" />
                <span>{product.avg_rating}</span>
                <span className="text-muted text-xs">({product.review_count})</span>
              </span>
            ) : (
              <span className="text-muted text-xs">New listing</span>
            )}
          </div>

          <div>
            {isOutOfStock ? (
              <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                Out of Stock
              </span>
            ) : (
              <span className="badge badge-stock" style={{ fontSize: '0.7rem' }}>
                {stock} {product.unit} left
              </span>
            )}
          </div>
        </div>

        {/* Direct Farmer Payout Pill */}
        {product.price_breakdown && (
          <button
            type="button"
            onClick={() => onShowTransparency && onShowTransparency(product)}
            className="flex items-center justify-between"
            style={{
              padding: '6px 10px',
              backgroundColor: 'var(--primary-subtle)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '14px',
              fontSize: '0.75rem',
              color: 'var(--primary)',
              fontWeight: 600,
              textAlign: 'left'
            }}
            title="Click to view 90% direct farmer payout breakdown"
          >
            <span className="flex items-center gap-1">
              <CheckCircle2 size={13} color="var(--primary)" />
              <span>90% goes directly to farmer</span>
            </span>
            <Info size={13} />
          </button>
        )}
      </div>

      {/* Bottom Action / Price & Button */}
      <div className="flex items-center justify-between" style={{ paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
        <div>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
            ₹{parseFloat(product.price_per_unit).toFixed(2)}
          </span>
          <span className="text-muted text-xs" style={{ marginLeft: '3px' }}>
            / {product.unit}
          </span>
        </div>

        {!isFarmer && (
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || adding}
            className={`btn ${addedSuccess ? 'btn-success' : 'btn-primary'} btn-sm`}
            style={{ padding: '8px 14px' }}
          >
            <ShoppingBag size={15} />
            <span>{addedSuccess ? 'Added!' : isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
