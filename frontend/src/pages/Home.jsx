import React, { useState, useEffect, useCallback } from 'react';
import { Leaf, SlidersHorizontal, Search, X, MapPin } from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import PriceBreakdownModal from '../components/PriceBreakdownModal';
import heroImg from '../assets/hero.png';
import '../styles/products.css';

const CATEGORIES = [
  { value: '', label: 'All Produce', icon: '🧺' },
  { value: 'vegetable', label: 'Vegetables', icon: '🥦' },
  { value: 'fruit', label: 'Fruits', icon: '🍎' },
  { value: 'grain', label: 'Grains', icon: '🌾' },
  { value: 'dairy', label: 'Dairy', icon: '🥛' },
  { value: 'other', label: 'Other Farm Goods', icon: '🍯' },
];

const SORT_OPTIONS = [
  { value: '-created_at', label: 'Newest First' },
  { value: 'price_per_unit', label: 'Price: Low to High' },
  { value: '-price_per_unit', label: 'Price: High to Low' },
  { value: 'name', label: 'Name A–Z' },
];

export default function Home({ searchVal, onSearchChange }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStockOnly, setInStockOnly] = useState(true);
  const [ordering, setOrdering] = useState('-created_at');
  const [transparencyProduct, setTransparencyProduct] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        search: searchVal || undefined,
        category: category || undefined,
        min_price: minPrice || undefined,
        max_price: maxPrice || undefined,
        in_stock: inStockOnly ? true : undefined,
        ordering,
      };
      const data = await api.get('/products/', params);
      let list = Array.isArray(data) ? data : data.results || [];

      if (location.trim()) {
        const loc = location.trim().toLowerCase();
        list = list.filter((p) => p.farm_location?.toLowerCase().includes(loc));
      }

      setProducts(list);
    } catch (err) {
      setError(err.message || 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchVal, category, minPrice, maxPrice, inStockOnly, ordering, location]);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 250);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const hasActiveFilters = category || location || minPrice || maxPrice || searchVal;

  const handleResetFilters = () => {
    setCategory('');
    setLocation('');
    setMinPrice('');
    setMaxPrice('');
    if (onSearchChange) onSearchChange('');
  };

  return (
    <div className="marketplace-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-section__inner">
          <div className="hero-section__content">
            <span className="hero-section__eyebrow">
              <Leaf size={14} /> Direct Farm-to-Table Marketplace
            </span>
            <h1 className="hero-section__title">
              Fresh produce, <span className="hero-section__accent">direct from local farms</span>
            </h1>
            <p className="hero-section__subtitle">
              90% of every purchase goes straight to local farmers. Transparent pricing, harvest-fresh quality, delivered directly to your doorstep.
            </p>
            
            {/* Prominent Search Bar */}
            <div className="hero-search">
              <Search size={20} className="hero-search__icon" />
              <input
                type="text"
                className="hero-search__input"
                placeholder="Search fresh tomatoes, carrots, organic honey, farms..."
                value={searchVal || ''}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              />
              {searchVal && (
                <button
                  type="button"
                  onClick={() => onSearchChange && onSearchChange('')}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="hero-section__visual">
            <img src={heroImg} alt="Farm fresh harvest" className="hero-section__image" />
          </div>
        </div>
      </section>

      {/* Catalog & Marketplace */}
      <section id="marketplace-catalog" className="catalog-section container">
        
        {/* Category Chips Bar */}
        <div className="category-chips-bar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              className={`category-chip ${category === cat.value ? 'active' : ''}`}
              onClick={() => setCategory(cat.value)}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="catalog-toolbar">
          <div className="catalog-toolbar__left">
            <button
              type="button"
              className={`btn ${showFilters ? 'btn-primary' : 'btn-outline'} btn-sm`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal size={15} />
              <span>Advanced Filters {hasActiveFilters && '•'}</span>
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleResetFilters}
                style={{ fontSize: '0.8rem' }}
              >
                <X size={14} /> Clear filters
              </button>
            )}

            <span className="text-muted text-sm font-semibold">
              {loading ? 'Searching fresh produce...' : `${products.length} product${products.length === 1 ? '' : 's'} available`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted text-xs font-semibold" style={{ whiteSpace: 'nowrap' }}>Sort by:</span>
            <select
              className="form-select catalog-sort"
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Expandable Advanced Filter Panel */}
        {showFilters && (
          <div className="filter-panel card">
            <div className="filter-panel__grid">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Location / City</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    className="form-input"
                    style={{ paddingLeft: '32px' }}
                    placeholder="e.g. Chennai, Coimbatore"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Min Price (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  placeholder="Min ₹"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Max Price (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  placeholder="Max ₹"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between" style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                />
                <span>Show in-stock produce only</span>
              </label>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  style={{ fontSize: '0.82rem', color: 'var(--warning)', fontWeight: 600 }}
                >
                  Reset all
                </button>
              )}
            </div>
          </div>
        )}

        {error && <div className="catalog-error">{error}</div>}

        {/* Product Grid */}
        {!loading && products.length === 0 ? (
          <div className="catalog-empty">
            <Leaf size={48} color="var(--primary)" />
            <h3 className="title-sm">No produce found matching your search</h3>
            <p className="text-muted text-sm">Try resetting filters or searching for another item.</p>
            <button type="button" className="btn btn-outline btn-sm" onClick={handleResetFilters}>
              Show All Produce
            </button>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onShowTransparency={setTransparencyProduct}
              />
            ))}
          </div>
        )}
      </section>

      {/* Price Transparency Modal */}
      {transparencyProduct && (
        <PriceBreakdownModal
          product={transparencyProduct}
          onClose={() => setTransparencyProduct(null)}
        />
      )}
    </div>
  );
}
