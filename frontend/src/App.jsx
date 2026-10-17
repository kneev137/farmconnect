import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import FarmerDashboard from './pages/FarmerDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import FarmerProfile from './pages/FarmerProfile';
import './styles/navbar.css';

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container flex items-center justify-between">
        <div>
          <strong style={{ color: 'var(--primary)' }}>FarmConnect</strong>
          <span className="text-muted" style={{ marginLeft: '8px' }}>
            Direct from local farms to your table.
          </span>
        </div>
        <span className="text-xs text-muted">90% of every purchase goes directly to farmers.</span>
      </div>
    </footer>
  );
}

export default function App() {
  const [searchVal, setSearchVal] = useState('');

  return (
    <>
      <Navbar searchVal={searchVal} onSearchChange={setSearchVal} />
      <main>
        <Routes>
          <Route path="/" element={<Home searchVal={searchVal} onSearchChange={setSearchVal} />} />
          <Route path="/products" element={<Home searchVal={searchVal} onSearchChange={setSearchVal} />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/farmers/:id" element={<FarmerProfile />} />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />

          <Route
            path="/farmer/dashboard"
            element={
              <ProtectedRoute roleRequired="farmer">
                <FarmerDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
      <SiteFooter />
      <CartDrawer />
    </>
  );
}
