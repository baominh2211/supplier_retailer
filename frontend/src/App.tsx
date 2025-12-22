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
import VerifyEmailPage from './pages/VerifyEmailPage';
import WaitingPage from './pages/WaitingPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import SuppliersPage from './pages/SuppliersPage';
import SupplierDetailPage from './pages/SupplierDetailPage';
import AIPriceSuggestion from './pages/AIPriceSuggestion';

// Supplier Pages
import SupplierDashboard from './pages/supplier/Dashboard';
import SupplierProducts from './pages/supplier/Products';
import SupplierRFQs from './pages/supplier/RFQs';
import SupplierOrders from './pages/supplier/Orders';
import SupplierContracts from './pages/supplier/Contracts';
import SupplierProfile from './pages/supplier/Profile';
import SupplierAIAssistant from './pages/supplier/AIAssistant';
import SupplierShopList from './pages/supplier/ShopList';

// Shop Pages
import ShopDashboard from './pages/shop/Dashboard';
import ShopRFQs from './pages/shop/RFQs';
import ShopOrders from './pages/shop/Orders';
import ShopContracts from './pages/shop/Contracts';
import ShopProfile from './pages/shop/Profile';
import ShopAIAssistant from './pages/shop/AIAssistant';

// Chat Page
import ChatPage from './pages/ChatPage';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminUsers from './pages/admin/Users';
import AdminRFQs from './pages/admin/RFQs';
import AdminContracts from './pages/admin/Contracts';

// Web3 Pages
import Web3Dashboard from './pages/web3/Web3Dashboard';

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
        <Route path="/ai-price" element={<AIPriceSuggestion />} />
      </Route>
      
      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/waiting" element={<WaitingPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      
      {/* Web3 Routes */}
      <Route path="/web3" element={<Web3Dashboard />} />
      
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
        <Route path="orders" element={<SupplierOrders />} />
        <Route path="contracts" element={<SupplierContracts />} />
        <Route path="shops" element={<SupplierShopList />} />
        <Route path="profile" element={<SupplierProfile />} />
        <Route path="ai-assistant" element={<SupplierAIAssistant />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="chat/:roomId" element={<ChatPage />} />
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
        <Route path="orders" element={<ShopOrders />} />
        <Route path="contracts" element={<ShopContracts />} />
        <Route path="profile" element={<ShopProfile />} />
        <Route path="ai-assistant" element={<ShopAIAssistant />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="chat/:roomId" element={<ChatPage />} />
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
        <Route path="rfqs" element={<AdminRFQs />} />
        <Route path="contracts" element={<AdminContracts />} />
      </Route>
      
      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}