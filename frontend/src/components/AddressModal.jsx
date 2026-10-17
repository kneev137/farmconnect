import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Home, Briefcase, MapPin, Plus, Check, Trash2, Edit2, X } from 'lucide-react';
import api from '../services/api';

export default function AddressModal({
  isOpen,
  onClose,
  addresses = [],
  selectedAddressId,
  onSelectAddress,
  onAddressesUpdated,
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    address_type: 'home',
    recipient_name: '',
    phone_number: '',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    landmark: '',
    is_default: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    setFormData({
      address_type: 'home',
      recipient_name: '',
      phone_number: '',
      street_address: '',
      city: '',
      state: '',
      postal_code: '',
      landmark: '',
      is_default: false,
    });
    setEditingAddress(null);
    setShowAddForm(false);
    setError('');
  };

  const startEdit = (addr) => {
    setEditingAddress(addr);
    setFormData({
      address_type: addr.address_type || 'home',
      recipient_name: addr.recipient_name || '',
      phone_number: addr.phone_number || '',
      street_address: addr.street_address || '',
      city: addr.city || '',
      state: addr.state || '',
      postal_code: addr.postal_code || '',
      landmark: addr.landmark || '',
      is_default: addr.is_default || false,
    });
    setShowAddForm(true);
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.street_address.trim()) {
      setError('Street address / House details are required.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      if (editingAddress) {
        await api.patch(`/addresses/${editingAddress.id}/`, formData);
      } else {
        await api.post('/addresses/', formData);
      }
      resetForm();
      if (onAddressesUpdated) {
        await onAddressesUpdated();
      }
    } catch (err) {
      setError(err.message || 'Failed to save address.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await api.delete(`/addresses/${id}/`);
      if (onAddressesUpdated) {
        await onAddressesUpdated();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete address.');
    }
  };

  const handleSetDefault = async (id, e) => {
    e.stopPropagation();
    try {
      await api.post(`/addresses/${id}/set-default/`);
      if (onAddressesUpdated) {
        await onAddressesUpdated();
      }
    } catch (err) {
      alert(err.message || 'Failed to set default address.');
    }
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

  const getTypeLabel = (type) => {
    switch (type) {
      case 'home':
        return 'HOME';
      case 'office':
        return 'OFFICE / WORK';
      default:
        return 'OTHER';
    }
  };

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
        boxSizing: 'border-box',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '540px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#F8FAFC',
            flexShrink: 0,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1E293B' }}>
              {showAddForm ? (editingAddress ? 'Edit Address' : 'Add New Address') : 'Saved Delivery Addresses'}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748B' }}>
              Select where you want your fresh farm produce delivered
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (showAddForm) resetForm();
              else onClose();
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748B',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body (Scrollable) */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {showAddForm ? (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Type selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  SAVE AS
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {[
                    { id: 'home', label: 'Home', icon: Home },
                    { id: 'office', label: 'Office', icon: Briefcase },
                    { id: 'other', label: 'Other', icon: MapPin },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setFormData({ ...formData, address_type: id })}
                      style={{
                        padding: '9px 8px',
                        border: formData.address_type === id ? '2px solid #16A34A' : '1px solid #CBD5E1',
                        borderRadius: '10px',
                        backgroundColor: formData.address_type === id ? '#DCFCE7' : '#FFFFFF',
                        color: formData.address_type === id ? '#15803D' : '#475569',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Icon size={15} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Receiver's Name
                  </label>
                  <input
                    type="text"
                    value={formData.recipient_name}
                    onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                    placeholder="e.g. John Doe"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Receiver's Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="e.g. 9876543210"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Complete Address */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Flat / House No. / Building / Street *
                </label>
                <textarea
                  rows="2"
                  value={formData.street_address}
                  onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                  placeholder="e.g. Flat 402, Green Acres, 14th Main Road, Indiranagar"
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Landmark & City */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    placeholder="e.g. Near Metro Station"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Bangalore"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* State & Pincode */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g. Karnataka"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Pincode / Postal Code
                  </label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    placeholder="e.g. 560038"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Default checkbox */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', marginTop: '2px' }}>
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: '#16A34A' }}
                />
                <span style={{ fontWeight: 600, color: '#334155' }}>Make this my default delivery address</span>
              </label>

              {error && (
                <div style={{ padding: '8px 12px', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '8px', fontSize: '0.85rem' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 2,
                    padding: '11px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#16A34A',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                  }}
                >
                  {loading ? 'Saving...' : editingAddress ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </form>
          ) : (
            <div>
              {/* Add New Address Button */}
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowAddForm(true);
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px dashed #16A34A',
                  backgroundColor: '#F0FDF4',
                  color: '#15803D',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  marginBottom: '16px',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <Plus size={18} />
                <span>+ Add New Address</span>
              </button>

              {/* List of saved addresses */}
              {addresses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748B' }}>
                  <MapPin size={36} style={{ margin: '0 auto 8px', color: '#94A3B8' }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>No saved addresses yet.</p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>Add your home or office address to enjoy 1-click checkout.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => {
                          if (onSelectAddress) {
                            onSelectAddress(addr);
                            onClose();
                          }
                        }}
                        style={{
                          border: isSelected ? '2px solid #16A34A' : '1px solid #E2E8F0',
                          backgroundColor: isSelected ? '#F0FDF4' : '#FFFFFF',
                          borderRadius: '12px',
                          padding: '14px 16px',
                          cursor: onSelectAddress ? 'pointer' : 'default',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          position: 'relative',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                backgroundColor: addr.address_type === 'home' ? '#EFF6FF' : addr.address_type === 'office' ? '#FDF2F8' : '#F1F5F9',
                                color: addr.address_type === 'home' ? '#1D4ED8' : addr.address_type === 'office' ? '#BE185D' : '#475569',
                              }}
                            >
                              {getTypeIcon(addr.address_type)}
                              {getTypeLabel(addr.address_type)}
                            </span>

                            {addr.is_default && (
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  color: '#15803D',
                                  backgroundColor: '#DCFCE7',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                }}
                              >
                                DEFAULT
                              </span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {!addr.is_default && (
                              <button
                                type="button"
                                onClick={(e) => handleSetDefault(addr.id, e)}
                                title="Set as Default"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  fontSize: '0.75rem',
                                  color: '#64748B',
                                  cursor: 'pointer',
                                  padding: '4px 6px',
                                  borderRadius: '4px',
                                }}
                              >
                                Set Default
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEdit(addr);
                              }}
                              title="Edit address"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#475569',
                                cursor: 'pointer',
                                padding: '4px',
                              }}
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDelete(addr.id, e)}
                              title="Delete address"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#EF4444',
                                cursor: 'pointer',
                                padding: '4px',
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Recipient info if present */}
                        {(addr.recipient_name || addr.phone_number) && (
                          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1E293B' }}>
                            {addr.recipient_name}
                            {addr.phone_number && <span style={{ color: '#64748B', fontWeight: 500, marginLeft: '6px' }}>• {addr.phone_number}</span>}
                          </div>
                        )}

                        {/* Full address body */}
                        <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.4 }}>
                          {addr.street_address}
                          {addr.landmark && `, Near ${addr.landmark}`}
                          {(addr.city || addr.state || addr.postal_code) && (
                            <div style={{ fontWeight: 500, color: '#64748B', fontSize: '0.8rem', marginTop: '2px' }}>
                              {[addr.city, addr.state, addr.postal_code].filter(Boolean).join(', ')}
                            </div>
                          )}
                        </div>

                        {isSelected && (
                          <div
                            style={{
                              position: 'absolute',
                              right: '12px',
                              bottom: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: '#16A34A',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                            }}
                          >
                            <Check size={16} /> Selected
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
}
