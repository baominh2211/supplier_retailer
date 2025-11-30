import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { LoadingScreen } from './components/ui';

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'));

const HomePage = lazy(() => import('./pages/HomePage'));
const SuppliersPage = lazy(() => import('./pages/suppliers/SuppliersPage'));
const SupplierDetailPage = lazy(() => import('./pages/suppliers/SupplierDetailPage'));
const ProductsPage = lazy(() => import('./pages/products/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/products/ProductDetailPage'));

const SupplierDashboard = lazy(() => import('./pages/supplier/Dashboard'));
const SupplierProducts = lazy(() => import('./pages/supplier/Products'));
const SupplierNegotiations = lazy(() => import('./pages/supplier/Negotiations'));

const ShopDashboard = lazy(() => import('./pages/shop/Dashboard'));
const ShopNegotiations = lazy(() => import('./pages/shop/Negotiations'));
const ShopPurchaseIntents = lazy(() => import('./pages/shop/PurchaseIntents'));

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminSuppliers = lazy(() => import('./pages/admin/Suppliers'));
const AdminCategories = lazy(() => import('./pages/admin/Categories'));

const NegotiationDetail = lazy(() => import('./pages/negotiations/NegotiationDetail'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Route guard for authenticated routes
function PrivateRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Route guard for guest routes (login/register)
function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated && user) {
    // Redirect to appropriate dashboard
    switch (user.role) {
      case 'ADMIN':
        return <Navigate to="/admin" replace />;
      case 'SUPPLIER':
        return <Navigate to="/supplier/dashboard" replace />;
      case 'SHOP':
        return <Navigate to="/shop/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/suppliers/:id" element={<SupplierDetailPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />

        {/* Auth routes (guest only) */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* Supplier routes */}
        <Route
          path="/supplier/dashboard"
          element={
            <PrivateRoute allowedRoles={['SUPPLIER', 'ADMIN']}>
              <SupplierDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/supplier/products"
          element={
            <PrivateRoute allowedRoles={['SUPPLIER', 'ADMIN']}>
              <SupplierProducts />
            </PrivateRoute>
          }
        />
        <Route
          path="/supplier/negotiations"
          element={
            <PrivateRoute allowedRoles={['SUPPLIER', 'ADMIN']}>
              <SupplierNegotiations />
            </PrivateRoute>
          }
        />

        {/* Shop routes */}
        <Route
          path="/shop/dashboard"
          element={
            <PrivateRoute allowedRoles={['SHOP', 'ADMIN']}>
              <ShopDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/shop/negotiations"
          element={
            <PrivateRoute allowedRoles={['SHOP', 'ADMIN']}>
              <ShopNegotiations />
            </PrivateRoute>
          }
        />
        <Route
          path="/shop/purchase-intents"
          element={
            <PrivateRoute allowedRoles={['SHOP', 'ADMIN']}>
              <ShopPurchaseIntents />
            </PrivateRoute>
          }
        />

        {/* Shared authenticated routes */}
        <Route
          path="/negotiations/:id"
          element={
            <PrivateRoute>
              <NegotiationDetail />
            </PrivateRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/suppliers"
          element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <AdminSuppliers />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <AdminCategories />
            </PrivateRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
