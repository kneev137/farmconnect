import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { 
  Sprout, ShoppingBag, User, LogOut, LayoutDashboard, 
  PackageCheck, LogIn, UserPlus, Store, Mail, Phone, MapPin, Shield, Calendar,
  Home, Briefcase, Plus
} from 'lucide-react';
import AddressModal from './AddressModal';


export default function Navbar() {
  const { user, isAuthenticated, isFarmer, isConsumer, logout, refreshUser } = useAuth();
  const { cartCount, openCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/login');
  };

  const handleMarketplaceClick = (e) => {
    if (isHomePage) {
      e.preventDefault();
      const el = document.getElementById('marketplace-catalog');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    }}>
      <div className="container flex items-center justify-between" style={{ height: '72px' }}>
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
          <div style={{
            backgroundColor: 'var(--primary)',
            color: '#FFFFFF',
            padding: '8px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <Sprout size={24} />
          </div>
          <div>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.025em' }}>
              Farm<span style={{ color: 'var(--secondary)' }}>Connect</span>
            </span>
            <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '-3px', letterSpacing: '0.04em' }}>
              DIRECT FROM LOCAL FARMS
            </span>
          </div>
        </Link>

        {/* Navigation Links & Actions */}
        <div className="flex items-center gap-3">
          
          <Link
            to="/#marketplace-catalog"
            onClick={handleMarketplaceClick}
            className="btn btn-outline btn-sm"
            style={{ border: 'none', gap: '6px', fontWeight: 700, color: 'var(--primary)' }}
          >
            <Store size={16} />
            <span>Marketplace</span>
          </Link>

          {isAuthenticated && (
            <Link to="/orders" className="btn btn-outline btn-sm" style={{ border: 'none', gap: '6px' }}>
              <PackageCheck size={16} />
              <span>My Orders</span>
            </Link>
          )}

          {isAuthenticated && isFarmer && (
            <Link to="/farmer/dashboard" className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
              <LayoutDashboard size={16} />
              <span>Farmer Dashboard</span>
            </Link>
          )}

          {/* Cart Trigger (For All Users) */}
          <button
            onClick={openCart}
            className="btn btn-secondary btn-sm"
            style={{
              position: 'relative',
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--primary-subtle)',
              color: 'var(--primary)',
              fontWeight: 700
            }}
            title="Open Shopping Cart"
          >
            <ShoppingBag size={18} />
            <span>Cart</span>

              {cartCount > 0 && (
                <span style={{
                  backgroundColor: 'var(--warning)',
                  color: '#FFFFFF',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-full)',
                  marginLeft: '4px'
                }}>
                  {cartCount}
                </span>
              )}
            </button>

          {/* Auth Menu */}

          {isAuthenticated ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="btn btn-secondary btn-sm"
                style={{
                  borderRadius: 'var(--radius-full)',
                  padding: '6px 14px',
                  gap: '8px'
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--primary)',
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user?.username}</span>
              </button>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '115%',
                  width: '280px',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '8px 0',
                  zIndex: 200
                }}>
                  {/* Account Header */}
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>{user?.username}</div>
                      <span className="badge badge-category" style={{ fontSize: '0.68rem', padding: '3px 8px' }}>
                        {user?.role?.toUpperCase()}
                      </span>
                    </div>
                    {user?.farmer_profile?.farm_name && (
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)' }}>
                        🌿 {user.farmer_profile.farm_name}
                      </div>
                    )}
                  </div>

                  {/* Account Details Section */}
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Account Details
                    </div>

                    {user?.email && (
                      <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <Mail size={13} style={{ flexShrink: 0, color: 'var(--primary)' }} />
                        <span style={{ wordBreak: 'break-all' }}>{user.email}</span>
                      </div>
                    )}

                    {user?.phone_number && (
                      <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <Phone size={13} style={{ flexShrink: 0, color: 'var(--primary)' }} />
                        <span>{user.phone_number}</span>
                      </div>
                    )}

                    {/* Saved Addresses Section (Swiggy / Blinkit style) */}
                    <div style={{ marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                          SAVED ADDRESSES ({user?.addresses?.length || 0})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setDropdownOpen(false);
                            setAddressModalOpen(true);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            padding: 0
                          }}
                        >
                          <Plus size={12} /> Manage
                        </button>
                      </div>

                      {user?.addresses && user.addresses.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {user.addresses.slice(0, 3).map((addr) => (
                            <div
                              key={addr.id}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '6px',
                                backgroundColor: addr.is_default ? 'var(--primary-subtle)' : 'var(--surface)',
                                border: '1px solid var(--border)',
                                borderRadius: '6px',
                                padding: '5px 8px',
                              }}
                            >
                              <div style={{ marginTop: '2px', color: 'var(--primary)' }}>
                                {addr.address_type === 'home' ? (
                                  <Home size={12} />
                                ) : addr.address_type === 'office' ? (
                                  <Briefcase size={12} />
                                ) : (
                                  <MapPin size={12} />
                                )}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-main)' }}>
                                    {addr.address_type}
                                  </span>
                                  {addr.is_default && (
                                    <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--primary)' }}>
                                      • Default
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {addr.street_address}
                                </div>
                              </div>
                            </div>
                          ))}
                          {user.addresses.length > 3 && (
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                              +{user.addresses.length - 3} more saved
                            </div>
                          )}
                        </div>
                      ) : user?.consumer_profile?.default_delivery_address ? (
                        <div className="flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                          <MapPin size={13} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--primary)' }} />
                          <span style={{ fontSize: '0.76rem', lineHeight: 1.3 }}>
                            {user.consumer_profile.default_delivery_address}
                          </span>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          No saved addresses yet.
                        </div>
                      )}
                    </div>

                    {user?.created_at && (
                      <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: '2px' }}>
                        <Calendar size={13} style={{ flexShrink: 0 }} />
                        <span>Member since {new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                      </div>
                    )}
                  </div>

                  {/* Navigation Links */}
                  {isFarmer && (
                    <Link
                      to="/farmer/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        fontSize: '0.85rem',
                        color: 'var(--text-main)',
                      }}
                      className="dropdown-item"
                    >
                      <LayoutDashboard size={16} color="var(--primary)" /> Farmer Portal
                    </Link>
                  )}

                  <Link
                    to="/orders"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      fontSize: '0.85rem',
                      color: 'var(--text-main)',
                    }}
                    className="dropdown-item"
                  >
                    <PackageCheck size={16} color="var(--primary)" /> Order History
                  </Link>

                  {/* Sign Out Button */}
                  <div style={{ borderTop: '1px solid var(--border)', marginTop: '4px' }}>
                    <button
                      onClick={handleLogout}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '10px 16px',
                        fontSize: '0.85rem',
                        color: 'var(--warning)',
                        textAlign: 'left',
                        fontWeight: 700
                      }}
                      className="dropdown-item"
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn btn-outline btn-sm">
                <LogIn size={15} /> Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                <UserPlus size={15} /> Join
              </Link>
            </div>
          )}
        </div>
      </div>

      </header>

      {/* Address Management Modal (Swiggy / Blinkit style) */}
      <AddressModal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        addresses={user?.addresses || []}
        selectedAddressId={user?.addresses?.find((a) => a.is_default)?.id}
        onAddressesUpdated={async () => {
          if (refreshUser) await refreshUser();
        }}
      />
    </>
  );
}
