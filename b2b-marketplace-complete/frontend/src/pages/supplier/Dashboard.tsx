import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiGet } from '../../services/api';
import { Button, Card, CardBody, Badge, Spinner, Alert } from '../../components/ui';

// Simple Icon components
const Icons = {
  Package: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  Chat: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  TrendingUp: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  Users: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Plus: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Eye: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  Menu: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
  LogOut: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  Home: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  Bell: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
};

interface Product {
  id: string;
  name: string;
  sku: string;
  basePrice: number;
  currency: string;
  isActive: boolean;
  viewCount: number;
  createdAt: string;
}

interface Negotiation {
  id: string;
  status: string;
  createdAt: string;
  shop?: { shopName: string };
  product?: { name: string };
}

interface Stats {
  totalProducts: number;
  totalNegotiations: number;
  successfulNegotiations: number;
  rating: number | null;
}

interface SupplierProfile {
  id: string;
  companyName: string;
  verificationStatus: string;
  country: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch supplier profile
      const profileRes = await apiGet<SupplierProfile>('/suppliers/me/profile');
      if (profileRes.success && profileRes.data) {
        setProfile(profileRes.data);
        // Fetch stats
        const statsRes = await apiGet<Stats>(`/suppliers/${profileRes.data.id}/stats`);
        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        }
      }

      // Fetch products
      const productsRes = await apiGet<Product[]>('/products/me/products?limit=5');
      if (productsRes.success && productsRes.data) {
        setProducts(productsRes.data);
      }

      // Fetch negotiations
      const negotiationsRes = await apiGet<Negotiation[]>('/negotiations?limit=5');
      if (negotiationsRes.success && negotiationsRes.data) {
        setNegotiations(negotiationsRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: 'success' | 'warning' | 'danger' | 'primary' | 'secondary'; label: string }> = {
      VERIFIED: { variant: 'success', label: 'Đã xác minh' },
      PENDING_VERIFICATION: { variant: 'warning', label: 'Chờ xác minh' },
      UNVERIFIED: { variant: 'secondary', label: 'Chưa xác minh' },
      ACTIVE: { variant: 'success', label: 'Đang hoạt động' },
      INITIATED: { variant: 'primary', label: 'Mới' },
      AGREED: { variant: 'success', label: 'Thành công' },
      CLOSED_CANCELLED: { variant: 'danger', label: 'Đã hủy' },
    };
    const cfg = map[status] || { variant: 'secondary' as const, label: status };
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  };

  const formatCurrency = (amount: number, currency = 'USD') => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(amount);

  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' });

  if (loading) {
    return <div className="min-h-screen bg-secondary-50 flex items-center justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <div className="min-h-screen bg-secondary-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-secondary-200 transition-all duration-300 flex flex-col`}>
        <div className="h-16 flex items-center justify-center border-b border-secondary-200">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white font-bold">B2</div>
            {sidebarOpen && <span className="font-bold text-lg">B2B Market</span>}
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/supplier/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-50 text-primary-700 font-medium">
            <Icons.Home />{sidebarOpen && <span>Dashboard</span>}
          </Link>
          <Link to="/supplier/products" className="flex items-center gap-3 px-4 py-3 rounded-xl text-secondary-600 hover:bg-secondary-100 transition">
            <Icons.Package />{sidebarOpen && <span>Sản phẩm</span>}
          </Link>
          <Link to="/supplier/negotiations" className="flex items-center gap-3 px-4 py-3 rounded-xl text-secondary-600 hover:bg-secondary-100 transition">
            <Icons.Chat />{sidebarOpen && <span>Đàm phán</span>}
          </Link>
        </nav>
        <div className="p-4 border-t border-secondary-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{profile?.companyName || 'Supplier'}</p>
                <p className="text-xs text-secondary-500 truncate">{user?.email}</p>
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-secondary-600" onClick={handleLogout} leftIcon={<Icons.LogOut />}>
            {sidebarOpen && 'Đăng xuất'}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-secondary-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-secondary-100 rounded-lg transition"><Icons.Menu /></button>
            <div>
              <h1 className="text-xl font-bold text-secondary-900">Dashboard</h1>
              <p className="text-sm text-secondary-500">Xin chào, {profile?.companyName || 'Supplier'}!</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-secondary-100 rounded-lg transition relative">
              <Icons.Bell /><span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
            </button>
            {profile && getStatusBadge(profile.verificationStatus)}
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {error && <Alert variant="error" className="mb-6">{error}</Alert>}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card><CardBody className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600"><Icons.Package /></div>
              <div><p className="text-sm text-secondary-500">Tổng sản phẩm</p><p className="text-2xl font-bold">{stats?.totalProducts || 0}</p></div>
            </CardBody></Card>
            <Card><CardBody className="flex items-center gap-4">
              <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center text-success-600"><Icons.Chat /></div>
              <div><p className="text-sm text-secondary-500">Đàm phán</p><p className="text-2xl font-bold">{stats?.totalNegotiations || 0}</p></div>
            </CardBody></Card>
            <Card><CardBody className="flex items-center gap-4">
              <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center text-warning-600"><Icons.TrendingUp /></div>
              <div><p className="text-sm text-secondary-500">Thành công</p><p className="text-2xl font-bold">{stats?.successfulNegotiations || 0}</p></div>
            </CardBody></Card>
            <Card><CardBody className="flex items-center gap-4">
              <div className="w-12 h-12 bg-danger-100 rounded-xl flex items-center justify-center text-danger-600"><Icons.Users /></div>
              <div><p className="text-sm text-secondary-500">Đánh giá</p><p className="text-2xl font-bold">{stats?.rating?.toFixed(1) || 'N/A'}</p></div>
            </CardBody></Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Products */}
            <Card>
              <div className="p-6 border-b border-secondary-200 flex items-center justify-between">
                <h2 className="text-lg font-bold">Sản phẩm gần đây</h2>
                <Link to="/supplier/products"><Button variant="ghost" size="sm">Xem tất cả</Button></Link>
              </div>
              <CardBody className="p-0">
                {products.length === 0 ? (
                  <div className="p-6 text-center text-secondary-500">
                    <p>Chưa có sản phẩm nào</p>
                    <Link to="/supplier/products"><Button size="sm" className="mt-4" leftIcon={<Icons.Plus />}>Thêm sản phẩm</Button></Link>
                  </div>
                ) : (
                  <div className="divide-y divide-secondary-100">
                    {products.map((product) => (
                      <div key={product.id} className="p-4 flex items-center justify-between hover:bg-secondary-50 transition">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{product.name}</p>
                          <p className="text-sm text-secondary-500">SKU: {product.sku}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-bold text-primary-600">{formatCurrency(product.basePrice, product.currency)}</p>
                          <div className="flex items-center gap-1 text-sm text-secondary-500"><Icons.Eye />{product.viewCount}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Recent Negotiations */}
            <Card>
              <div className="p-6 border-b border-secondary-200 flex items-center justify-between">
                <h2 className="text-lg font-bold">Đàm phán gần đây</h2>
                <Link to="/supplier/negotiations"><Button variant="ghost" size="sm">Xem tất cả</Button></Link>
              </div>
              <CardBody className="p-0">
                {negotiations.length === 0 ? (
                  <div className="p-6 text-center text-secondary-500"><p>Chưa có đàm phán nào</p></div>
                ) : (
                  <div className="divide-y divide-secondary-100">
                    {negotiations.map((neg) => (
                      <Link key={neg.id} to={`/negotiations/${neg.id}`} className="p-4 flex items-center justify-between hover:bg-secondary-50 transition block">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{neg.shop?.shopName || 'Shop'}</p>
                          <p className="text-sm text-secondary-500 truncate">{neg.product?.name || 'Product'}</p>
                        </div>
                        <div className="text-right ml-4">
                          {getStatusBadge(neg.status)}
                          <p className="text-xs text-secondary-500 mt-1">{formatDate(neg.createdAt)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mt-6">
            <h2 className="text-lg font-bold mb-4">Hành động nhanh</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/supplier/products">
                <Card className="hover:shadow-lg transition cursor-pointer">
                  <CardBody className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600"><Icons.Plus /></div>
                    <div><p className="font-medium">Thêm sản phẩm mới</p><p className="text-sm text-secondary-500">Đăng sản phẩm lên marketplace</p></div>
                  </CardBody>
                </Card>
              </Link>
              <Link to="/supplier/negotiations">
                <Card className="hover:shadow-lg transition cursor-pointer">
                  <CardBody className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center text-success-600"><Icons.Chat /></div>
                    <div><p className="font-medium">Quản lý đàm phán</p><p className="text-sm text-secondary-500">Xem và trả lời các yêu cầu</p></div>
                  </CardBody>
                </Card>
              </Link>
              <Card className="hover:shadow-lg transition cursor-pointer">
                <CardBody className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center text-warning-600"><Icons.TrendingUp /></div>
                  <div><p className="font-medium">Xem báo cáo</p><p className="text-sm text-secondary-500">Phân tích hiệu suất bán hàng</p></div>
                </CardBody>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
