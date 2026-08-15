import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, ShoppingBag, MapPin, Star, Leaf,
  CheckCircle2, Info, Minus, Plus, Sprout, Clock,
  Calendar, ShieldCheck, ArrowRight, Truck, Heart
} from 'lucide-react';
import api, { mediaUrl } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import PriceBreakdownModal from '../components/PriceBreakdownModal';
import ReviewSection from '../components/ReviewSection';
import '../styles/products.css';

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { isFarmer } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [showTransparency, setShowTransparency] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.get(`/products/${id}/`);
        setProduct(data);
      } catch (err) {
        setError(err.message || 'Product not found');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="container product-detail-page" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <p className="text-muted">Loading produce details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container product-detail-page" style={{ padding: '40px 20px' }}>
        <Link to="/" className="btn btn-outline btn-sm" style={{ marginBottom: '20px' }}>
          <ArrowLeft size={16} /> Back to Marketplace
        </Link>
        <p className="catalog-error">{error || 'Product not found'}</p>
      </div>
    );
  }

  const stock = parseFloat(product.quantity_available || 0);
  const isOutOfStock = stock <= 0;
  const imageSrc = mediaUrl(product.image);

  const handleAddToCart = async () => {
    if (isOutOfStock || isFarmer) return;
    setAdding(true);
    const res = await addToCart(product.id, quantity);
    setAdding(false);
    if (res.success) {
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2500);
    } else {
      alert(res.error || 'Failed to add to cart');
    }
  };

  return (
    <div className="container product-detail-page" style={{ padding: '32px 20px 60px' }}>
      
      {/* Back Button */}
      <Link to="/" className="btn btn-outline btn-sm" style={{ marginBottom: '24px', gap: '6px' }}>
        <ArrowLeft size={16} /> Back to Marketplace
      </Link>

      <div className="product-detail grid" style={{ gridTemplateColumns: '1fr 1.1fr', gap: '48px', marginBottom: '48px' }}>
        
        {/* Left Column: Produce Visuals & Freshness Timeline */}
        <div>
          <div style={{
            width: '100%',
            height: '380px',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            backgroundColor: 'var(--surface-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-md)',
            position: 'relative',
            marginBottom: '24px'
          }}>
            {imageSrc ? (
              <img src={imageSrc} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--primary)' }}>
                <Leaf size={72} strokeWidth={1.5} />
                <span style={{ display: 'block', fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', marginTop: '8px' }}>
                  {product.category}
                </span>
              </div>
            )}

            {product.freshness?.label && (
              <div style={{ position: 'absolute', top: '14px', left: '14px' }}>
                <span className="badge badge-fresh" style={{ fontSize: '0.82rem', padding: '6px 14px', boxShadow: 'var(--shadow-sm)' }}>
                  <Clock size={14} /> {product.freshness.label}
                </span>
              </div>
            )}
          </div>

          {/* Harvest Timeline Card */}
          <div className="card" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--surface-alt)' }}>
            <h3 className="title-sm flex items-center gap-2" style={{ color: 'var(--primary)', marginBottom: '14px' }}>
              <Calendar size={18} /> Farm-to-Table Freshness Journey
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
              <div className="flex items-start gap-3">
                <div style={{ backgroundColor: 'var(--primary)', color: '#FFF', borderRadius: 'var(--radius-full)', padding: '4px', marginTop: '2px' }}>
                  <CheckCircle2 size={12} />
                </div>
                <div>
                  <strong>Harvest Date:</strong> {product.freshness?.latest_harvest_date || 'Fresh listing'}
                  <div className="text-muted text-xs">{product.freshness?.notes || 'Direct natural picking'}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div style={{ backgroundColor: 'var(--primary)', color: '#FFF', borderRadius: 'var(--radius-full)', padding: '4px', marginTop: '2px' }}>
                  <CheckCircle2 size={12} />
                </div>
                <div>
                  <strong>Zero Warehouse Storage:</strong> Produce stays with the farmer until you order.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div style={{ backgroundColor: 'var(--primary)', color: '#FFF', borderRadius: 'var(--radius-full)', padding: '4px', marginTop: '2px' }}>
                  <CheckCircle2 size={12} />
                </div>
                <div>
                  <strong>Direct Doorstep Delivery:</strong> Local transit minimizes food miles and emissions.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Information, Pricing, Farmer Card, Add to Cart */}
        <div>
          
          {/* Category & Rating */}
          <div className="flex items-center gap-2" style={{ marginBottom: '10px' }}>
            <span className="badge badge-category">{product.category}</span>
            {product.avg_rating && (
              <span className="flex items-center gap-1" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#D97706' }}>
                <Star size={15} fill="#D97706" color="#D97706" />
                {product.avg_rating} ({product.review_count} review{product.review_count === 1 ? '' : 's'})
              </span>
            )}
          </div>

          <h1 className="title-xl" style={{ textTransform: 'capitalize', marginBottom: '12px' }}>
            {product.name}
          </h1>

          {/* Farm Link / Story Card */}
          {product.farmer_id && (
            <Link
              to={`/farmers/${product.farmer_id}`}
              className="card flex items-center justify-between"
              style={{
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-subtle)',
                border: '1px solid #B7E4C7',
                marginBottom: '20px',
                textDecoration: 'none'
              }}
            >
              <div className="flex items-center gap-3">
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--primary)',
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800
                }}>
                  <Sprout size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {product.farm_name}
                  </div>
                  <div className="flex items-center gap-1 text-muted text-xs">
                    <MapPin size={12} /> {product.farm_location || 'Local Farm Grounds'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 font-semibold text-xs" style={{ color: 'var(--primary)' }}>
                <span>View Farmer Story</span>
                <ArrowRight size={14} />
              </div>
            </Link>
          )}

          {/* Description */}
          {product.description && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: 1.7, marginBottom: '24px' }}>
              {product.description}
            </p>
          )}

          {/* Price & Stock */}
          <div className="flex items-center justify-between" style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                ₹{parseFloat(product.price_per_unit).toFixed(2)}
              </span>
              <span className="text-muted text-sm font-semibold" style={{ marginLeft: '4px' }}>
                / {product.unit}
              </span>
            </div>

            <div>
              {isOutOfStock ? (
                <span className="badge badge-warning" style={{ fontSize: '0.85rem' }}>Out of Stock</span>
              ) : (
                <span className="badge badge-stock" style={{ fontSize: '0.85rem' }}>
                  {stock} {product.unit} fresh in stock
                </span>
              )}
            </div>
          </div>

          {/* 90% Direct Farmer Payout Pill */}
          {product.price_breakdown && (
            <button
              type="button"
              onClick={() => setShowTransparency(true)}
              className="flex items-center justify-between"
              style={{
                width: '100%',
                padding: '10px 16px',
                backgroundColor: 'var(--primary-subtle)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '24px',
                fontSize: '0.85rem',
                color: 'var(--primary)',
                fontWeight: 700,
                textAlign: 'left',
                border: '1px solid #B7E4C7'
              }}
            >
              <span className="flex items-center gap-2">
                <ShieldCheck size={16} />
                <span>90% goes directly to {product.farmer_name || product.farm_name}</span>
              </span>
              <span style={{ fontSize: '0.78rem', textDecoration: 'underline' }}>View Breakdown</span>
            </button>
          )}

          {/* Add to Cart Controller */}
          {!isFarmer && (
            <div className="flex items-center gap-4" style={{ marginBottom: '24px' }}>
              <div className="flex items-center gap-2" style={{
                backgroundColor: 'var(--surface)',
                border: '2px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '4px 8px'
              }}>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="btn-icon"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Minus size={16} />
                </button>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, minWidth: '32px', textAlign: 'center' }}>
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                  className="btn-icon"
                  disabled={quantity >= stock}
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                type="button"
                className={`btn ${addedSuccess ? 'btn-success' : 'btn-primary'} btn-lg flex-1`}
                onClick={handleAddToCart}
                disabled={isOutOfStock || adding}
              >
                <ShoppingBag size={18} />
                <span>{addedSuccess ? 'Added to Cart!' : isOutOfStock ? 'Sold Out' : `Add ${quantity} ${product.unit} to Cart`}</span>
              </button>
            </div>
          )}

          {/* Eco-Impact Badge */}
          <div style={{
            backgroundColor: '#F0FDF4',
            border: '1px dashed #86EFAC',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.82rem',
            color: '#166534'
          }}>
            <Heart size={18} color="#16A34A" />
            <span><strong>Eco-Friendly:</strong> Direct farm dispatch reduces ~1.4 kg CO₂ emission by avoiding industrial cold chains.</span>
          </div>

        </div>
      </div>

      {/* Review Section */}
      <ReviewSection productId={product.id} productName={product.name} />

      {/* Transparency Modal */}
      {showTransparency && (
        <PriceBreakdownModal product={product} onClose={() => setShowTransparency(false)} />
      )}
    </div>
  );
}
