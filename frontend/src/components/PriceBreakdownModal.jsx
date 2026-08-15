import React from 'react';
import { X, ShieldCheck, HeartHandshake, Truck, Sprout } from 'lucide-react';

export default function PriceBreakdownModal({ product, onClose }) {
  if (!product) return null;

  const price = parseFloat(product.price_per_unit || 0);
  const farmerShare = (price * 0.9).toFixed(2);
  const platformFee = (price * 0.1).toFixed(2);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <HeartHandshake size={24} color="var(--primary)" />
            <h2 className="title-md">Fair Price Transparency</h2>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <p className="text-sm text-muted" style={{ marginBottom: '20px' }}>
          At FarmConnect, we believe in 100% pricing transparency. When you buy <strong>{product.name}</strong> from <strong>{product.farm_name}</strong>, here is exactly where your ₹{price.toFixed(2)} / {product.unit} goes:
        </p>

        {/* Visual Breakdown Bar */}
        <div style={{
          height: '24px',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          display: 'flex',
          marginBottom: '20px'
        }}>
          <div style={{
            width: '90%',
            backgroundColor: 'var(--primary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 800
          }}>
            90% Direct to Farmer
          </div>
          <div style={{
            width: '10% ',
            backgroundColor: 'var(--secondary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.7rem',
            fontWeight: 800
          }}>
            10%
          </div>
        </div>

        {/* Itemized Cards */}
        <div className="flex flex-col gap-3" style={{ marginBottom: '24px' }}>
          
          <div className="card flex items-center justify-between" style={{ padding: '14px', backgroundColor: 'var(--primary-subtle)', borderColor: '#B7E4C7' }}>
            <div className="flex items-center gap-3">
              <div style={{ backgroundColor: 'var(--primary)', color: '#FFF', padding: '8px', borderRadius: 'var(--radius-md)' }}>
                <Sprout size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)' }}>
                  Local Farmer Payout (90%)
                </h4>
                <p className="text-xs text-muted">Goes straight to {product.farmer_name || product.farm_name} with zero middlemen cuts</p>
              </div>
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
              ₹{farmerShare}
            </span>
          </div>

          <div className="card flex items-center justify-between" style={{ padding: '14px', backgroundColor: 'var(--surface-alt)' }}>
            <div className="flex items-center gap-3">
              <div style={{ backgroundColor: 'var(--secondary)', color: '#FFF', padding: '8px', borderRadius: 'var(--radius-md)' }}>
                <Truck size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                  Platform & Logistics Operations (10%)
                </h4>
                <p className="text-xs text-muted">Covers server infrastructure, order matching, and doorstep delivery routing</p>
              </div>
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>
              ₹{platformFee}
            </span>
          </div>

        </div>

        {/* Footer */}
        <button onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>
          Got it
        </button>

      </div>
    </div>
  );
}
