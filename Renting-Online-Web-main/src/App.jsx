import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import ProductPage from './pages/ProductPage';
import HomePage from './pages/HomePage';
import OrdersPage from './pages/OrdersPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ProfilePage from './pages/ProfilePage';
import CartPage from './pages/CartPage';
import ProductDetails from './pages/ProductDetails';
import ReviewPage from './pages/Review';
import OrderDetailPage from './pages/OrderDetailPage';
import ReviewSummary from './pages/ReviewSummary';
import PaymentPage from './pages/PaymentPage';
import NotFoundPage from './pages/NotFoundPage';

// Seller Pages
import SellerDashboard from './pages/seller/SellerDashboard';
import SellerProducts from './pages/seller/SellerProducts';
import SellerOrders from './pages/seller/SellerOrders';
import SellerOrderDetail from './pages/seller/SellerOrderDetail';
import AddProductPage from './pages/seller/AddProductPage';
import SellerProfile from './pages/seller/SellerProfile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminReports from './pages/admin/AdminReports';
import AdminViolations from './pages/admin/AdminViolations';
import AdminProducts from './pages/admin/AdminProducts';
import AdminPage from './pages/AdminPage';
const App = () => {
  return (
    <Routes>
      {/* Public routes - Only accessible when NOT logged in */}
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />
      <Route path="/signup" element={
        <PublicRoute>
          <SignUpPage />
        </PublicRoute>
      } />
      <Route path="/forgot-password" element={
        <PublicRoute>
          <ForgotPasswordPage />
        </PublicRoute>
      } />
      
      {/* Protected routes - All routes wrapped with ProtectedRoute */}
      <Route path="/" element={
        <ProtectedRoute>
          <HomePage />
        </ProtectedRoute>
      } />
      
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />
      
      {/* Seller Dashboard Routes */}
      <Route path="/seller" element={<Navigate to="/seller/dashboard" replace />} />
      <Route path="/seller/dashboard" element={
        <ProtectedRoute>
          <SellerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/seller/products" element={
        <ProtectedRoute>
          <SellerProducts />
        </ProtectedRoute>
      } />
      <Route path="/seller/orders" element={
        <ProtectedRoute>
          <SellerOrders />
        </ProtectedRoute>
      } />
      <Route path="/seller/orders/:orderNumber" element={
        <ProtectedRoute>
          <SellerOrderDetail />
        </ProtectedRoute>
      } />
      <Route path="/seller/add-product" element={
        <ProtectedRoute>
          <AddProductPage />
        </ProtectedRoute>
      } />
      <Route path="/seller/edit-product" element={
        <ProtectedRoute>
          <AddProductPage />
        </ProtectedRoute>
      } />
      <Route path="/seller/profile" element={
        <ProtectedRoute>
          <SellerProfile />
        </ProtectedRoute>
      } />
      
      {/* Admin Dashboard Routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute>
          <AdminPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/products" element={
        <ProtectedRoute>
          <AdminProducts />
        </ProtectedRoute>
      } />
      <Route path="/admin/reports" element={
        <ProtectedRoute>
          <AdminReports />
        </ProtectedRoute>
      } />
      <Route path="/admin/resolve-violations" element={
        <ProtectedRoute>
          <AdminViolations />
        </ProtectedRoute>
      } />

      {/* Legacy admin route - redirect to new dashboard */}
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/seller-dashboard" element={
        <ProtectedRoute>
          <SellerDashboard />
        </ProtectedRoute>
      } />
      
      {/* Cart - Has Header and Footer */}
      <Route path="/cart" element={
        <ProtectedRoute>
          <CartPage />
        </ProtectedRoute>
      } />
      <Route path="/payment" element={
        <ProtectedRoute>
          <PaymentPage />
        </ProtectedRoute>
      } />
      
      {/* Product & Orders Pages - Has Header and Footer */}
      <Route path="/product" element={
        <ProtectedRoute>
          <ProductPage />
        </ProtectedRoute>
      } />
      <Route path="/product/:productId" element={
        <ProtectedRoute>
          <ProductDetails />
        </ProtectedRoute>
      } />
      <Route path="/orders" element={
        <ProtectedRoute>
          <OrdersPage />
        </ProtectedRoute>
      } />
      <Route path="/orders/:orderId" element={
        <ProtectedRoute>
          <OrderDetailPage />
        </ProtectedRoute>
      } />
      <Route path="/review/:productId" element={
        <ProtectedRoute>
          <ReviewPage />
        </ProtectedRoute>
      } />
      <Route path="/review/completed" element={
        <ProtectedRoute>
          <ReviewSummary />
        </ProtectedRoute>
      } />
      
      {/* 404 Page - Catch all unmatched routes */}
      <Route path="*" element={
        <ProtectedRoute>
          <NotFoundPage />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

export default App;
