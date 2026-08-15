import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated, isConsumer } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const fetchCart = async () => {
    if (!isAuthenticated || !isConsumer) {
      setCart(null);
      return;
    }
    try {
      setLoading(true);
      const data = await api.get('/cart/');
      setCart(data);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated, isConsumer]);

  const addToCart = async (productId, quantity = 1) => {
    try {
      await api.post('/cart-items/', { product: productId, quantity });
      await fetchCart();
      setIsCartOpen(true);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    if (quantity <= 0) {
      return removeFromCart(cartItemId);
    }
    try {
      await api.patch(`/cart-items/${cartItemId}/`, { quantity });
      await fetchCart();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      await api.delete(`/cart-items/${cartItemId}/`);
      await fetchCart();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart/clear/');
      await fetchCart();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const checkout = async (address, paymentMethod = 'card') => {
    try {
      const order = await api.post('/checkout/', {
        address,
        payment_method: paymentMethod
      });
      await fetchCart();
      setIsCartOpen(false);
      return { success: true, order };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const value = {
    cart,
    cartCount: cart?.total_items || 0,
    grandTotal: cart?.grand_total || 0,
    loading,
    isCartOpen,
    setIsCartOpen,
    openCart: () => setIsCartOpen(true),
    closeCart: () => setIsCartOpen(false),
    fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    checkout
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
