import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';

// Layouts
import MainLayout from './components/MainLayout';
import DashboardLayout from './components/DashboardLayout';

// Public Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RegisterSuccessPage from './pages/RegisterSuccessPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import SuppliersPage from './pages/SuppliersPage';
import SupplierDetailPage from './pages/SupplierDetailPage';

// Supplier Pages
import SupplierDashboard from './pages/supplier/Dashboard';
import SupplierProducts from './pages/supplier/Products';
import SupplierRFQs from './pages/supplier/RFQs';
import SupplierContracts from './pages/supplier/Contracts';

// Shop Pages
import ShopDashboard from './pages/shop/Dashboard';
import ShopRFQs from './pages/shop/RFQs';
import ShopContracts from './pages/shop/Contracts';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminUsers from './pages/admin/Users';

// Protected Route Component
function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  const { token, fetchUser } = useAuthStore();
  
  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token, fetchUser]);
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/suppliers/:id" element={<SupplierDetailPage />} />
      </Route>
      
      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register/success" element={<RegisterSuccessPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      
      {/* Supplier Routes */}
      <Route path="/supplier" element={
        <ProtectedRoute roles={['supplier']}>
          <DashboardLayout role="supplier" />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SupplierDashboard />} />
        <Route path="products" element={<SupplierProducts />} />
        <Route path="rfq" element={<SupplierRFQs />} />
        <Route path="contracts" element={<SupplierContracts />} />
      </Route>
      
      {/* Shop Routes */}
      <Route path="/shop" element={
        <ProtectedRoute roles={['shop']}>
          <DashboardLayout role="shop" />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ShopDashboard />} />
        <Route path="rfq" element={<ShopRFQs />} />
        <Route path="contracts" element={<ShopContracts />} />
      </Route>
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute roles={['admin']}>
          <DashboardLayout role="admin" />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>
      
      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
