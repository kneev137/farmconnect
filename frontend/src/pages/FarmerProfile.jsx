import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Sprout, MapPin, Star, ShieldCheck, 
  Leaf, ShoppingBag, Phone, Mail, Award, CheckCircle2 
} from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import PriceBreakdownModal from '../components/PriceBreakdownModal';
import '../styles/products.css';

export default function FarmerProfile() {
  const { id } = useParams();
  const [farmer, setFarmer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transparencyProduct, setTransparencyProduct] = useState(null);

  useEffect(() => {
    const fetchFarmer = async () => {
      try {
        setLoading(true);
        const data = await api.get(`/farmers/${id}/`);
        setFarmer(data);
      } catch (err) {
        setError(err.message || 'Failed to load farmer profile');
      } finally {
        setLoading(false);
      }
    };
    fetchFarmer();
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <p className="text-muted">Loading farmer portfolio...</p>
      </div>
    );
  }

  if (error || !farmer) {
    return (
      <div className="container" style={{ padding: '40px 20px' }}>
        <Link to="/" className="btn btn-outline btn-sm" style={{ marginBottom: '20px' }}>
          <ArrowLeft size={16} /> Back to Marketplace
        </Link>
        <div className="catalog-error">{error || 'Farmer profile not found'}</div>
      </div>
    );
  }

  const primaryFarm = farmer.farms && farmer.farms.length > 0 ? farmer.farms[0] : null;

  return (
    <div className="container" style={{ padding: '32px 20px 60px' }}>
      
      {/* Back Link */}
      <Link to="/" className="btn btn-outline btn-sm" style={{ marginBottom: '24px', gap: '6px' }}>
        <ArrowLeft size={16} /> Back to Marketplace
      </Link>

      {/* Farmer Portfolio Header Banner */}
      <div className="card" style={{
        padding: '36px',
        borderRadius: 'var(--radius-xl)',
        background: 'linear-gradient(135deg, var(--primary-subtle) 0%, #FFFFFF 60%, #FFF8F0 100%)',
        border: '1px solid #B7E4C7',
        marginBottom: '40px',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div className="flex items-start justify-between flex-wrap gap-6">
          
          <div className="flex items-start gap-5">
            {/* Farmer Avatar */}
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--primary)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: 800,
              boxShadow: 'var(--shadow-md)',
              border: '4px solid #FFFFFF'
            }}>
              {farmer.farm_name ? farmer.farm_name.charAt(0).toUpperCase() : 'F'}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: '6px' }}>
                <h1 className="title-lg" style={{ color: 'var(--text-main)' }}>
                  {farmer.farm_name}
                </h1>
                {farmer.verified && (
                  <span className="badge badge-fresh" style={{ fontSize: '0.8rem', padding: '4px 12px' }}>
                    <ShieldCheck size={14} /> Verified Local Producer
                  </span>
                )}
              </div>

              {primaryFarm?.location && (
                <div className="flex items-center gap-1 text-muted text-sm font-semibold" style={{ marginBottom: '12px' }}>
                  <MapPin size={15} color="var(--primary)" />
                  <span>{primaryFarm.location}</span>
                  {primaryFarm.size_acres && (
                    <span>• {primaryFarm.size_acres} Acres of Cultivated Land</span>
                  )}
                </div>
              )}

              {/* Bio / Story */}
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.98rem',
                lineHeight: 1.65,
                maxWidth: '680px',
                marginBottom: '16px'
              }}>
                {farmer.bio || "Passionate about sustainable, pesticide-free agriculture and bringing fresh harvests directly to our community."}
              </p>

              {/* Rating Summary */}
              {farmer.avg_rating && (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1" style={{ fontSize: '1rem', fontWeight: 800, color: '#D97706' }}>
                    <Star size={18} fill="#D97706" color="#D97706" />
                    <span>{farmer.avg_rating}</span>
                  </span>
                  <span className="text-muted text-sm">
                    ({farmer.review_count} community review{farmer.review_count === 1 ? '' : 's'})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Ethics / Trust Highlights */}
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 22px',
            maxWidth: '280px',
            width: '100%'
          }}>
            <div className="flex items-center gap-2 font-bold" style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '10px' }}>
              <Award size={18} /> Direct Partnership
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} color="var(--primary)" /> 90% Direct Farmer Payout
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} color="var(--primary)" /> Zero Chemical Sprays
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} color="var(--primary)" /> Harvested & Packed on Demand
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Produce Harvested by this Farmer */}
      <div>
        <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
          <div>
            <h2 className="title-md">Fresh Harvests by {farmer.farm_name}</h2>
            <p className="text-muted text-sm">Browse and order fresh produce harvested directly from these farm grounds.</p>
          </div>
          <span className="badge badge-category">
            {farmer.products ? farmer.products.length : 0} Products Listed
          </span>
        </div>

        {(!farmer.products || farmer.products.length === 0) ? (
          <div className="catalog-empty">
            <Leaf size={48} color="var(--primary)" />
            <h3 className="title-sm">No active produce listed currently</h3>
            <p className="text-muted text-sm">Check back soon for the next seasonal harvest.</p>
          </div>
        ) : (
          <div className="product-grid">
            {farmer.products.map((prod) => (
              <ProductCard
                key={prod.id}
                product={{
                  ...prod,
                  farm_id: primaryFarm?.id,
                  farm_name: farmer.farm_name,
                  farmer_id: farmer.id,
                  farmer_name: farmer.farm_name,
                  farm_location: primaryFarm?.location,
                }}
                onShowTransparency={setTransparencyProduct}
              />
            ))}
          </div>
        )}
      </div>

      {/* Transparency Modal */}
      {transparencyProduct && (
        <PriceBreakdownModal
          product={transparencyProduct}
          onClose={() => setTransparencyProduct(null)}
        />
      )}
    </div>
  );
}
