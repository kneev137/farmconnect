import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { 
  Sprout, ShoppingBag, User, LogOut, LayoutDashboard, 
  PackageCheck, LogIn, UserPlus, Store 
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, isFarmer, isConsumer, logout } = useAuth();
  const { cartCount, openCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const [dropdownOpen, setDropdownOpen] = useState(false);

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

          {isAuthenticated && isConsumer && (
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

          {/* Cart Trigger (For Consumers or Guests) */}
          {(!isAuthenticated || isConsumer) && (
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
          )}

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
                  width: '200px',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '8px 0',
                  zIndex: 200
                }}>
                  <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{user?.username}</div>
                    <span className="badge badge-category" style={{ fontSize: '0.7rem', marginTop: '4px' }}>
                      {user?.role?.toUpperCase()}
                    </span>
                  </div>

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
                      <LayoutDashboard size={16} /> Farmer Portal
                    </Link>
                  )}

                  {isConsumer && (
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
                      <PackageCheck size={16} /> Order History
                    </Link>
                  )}

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
                      textAlign: 'left'
                    }}
                    className="dropdown-item"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
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
  );
}
