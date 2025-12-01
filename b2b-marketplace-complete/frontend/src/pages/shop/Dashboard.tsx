import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiGet } from '../../services/api';
import { Button, Card, CardBody, Badge, Spinner, Alert } from '../../components/ui';

const Icons = {
  Package: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  Chat: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  ShoppingCart: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  Search: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Menu: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
  LogOut: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  Home: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  Bell: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  Building: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
};

interface Product { id: string; name: string; basePrice: number; currency: string; supplier: { companyName: string }; }
interface Supplier { id: string; companyName: string; country: string; verificationStatus: string; }
interface Negotiation { id: string; status: string; createdAt: string; supplier?: { companyName: string }; product?: { name: string }; }
interface PurchaseIntent { id: string; intentNumber: string; status: string; totalAmount: number; currency: string; createdAt: string; }

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [purchaseIntents, setPurchaseIntents] = useState<PurchaseIntent[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, suppRes, negRes, piRes] = await Promise.all([
        apiGet<Product[]>('/products?limit=5'),
        apiGet<Supplier[]>('/suppliers?limit=5'),
        apiGet<Negotiation[]>('/negotiations?limit=5'),
        apiGet<PurchaseIntent[]>('/purchase-intents?limit=5'),
      ]);
      if (prodRes.success) setProducts(prodRes.data || []);
      if (suppRes.success) setSuppliers(suppRes.data || []);
      if (negRes.success) setNegotiations(negRes.data || []);
      if (piRes.success) setPurchaseIntents(piRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: 'success' | 'warning' | 'danger' | 'primary' | 'secondary'; label: string }> = {
      VERIFIED: { variant: 'success', label: 'Đã xác minh' },
      ACTIVE: { variant: 'success', label: 'Hoạt động' },
      INITIATED: { variant: 'primary', label: 'Mới' },
      AGREED: { variant: 'success', label: 'Thành công' },
      DRAFT: { variant: 'secondary', label: 'Nháp' },
      WAITING_SUPPLIER_RESPONSE: { variant: 'warning', label: 'Chờ phản hồi' },
    };
    const cfg = map[status] || { variant: 'secondary' as const, label: status };
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  };

  const formatCurrency = (amount: number, currency = 'USD') => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(amount);

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
          <Link to="/shop/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-50 text-primary-700 font-medium">
            <Icons.Home />{sidebarOpen && <span>Dashboard</span>}
          </Link>
          <Link to="/products" className="flex items-center gap-3 px-4 py-3 rounded-xl text-secondary-600 hover:bg-secondary-100 transition">
            <Icons.Search />{sidebarOpen && <span>Tìm sản phẩm</span>}
          </Link>
          <Link to="/suppliers" className="flex items-center gap-3 px-4 py-3 rounded-xl text-secondary-600 hover:bg-secondary-100 transition">
            <Icons.Building />{sidebarOpen && <span>Nhà cung cấp</span>}
          </Link>
          <Link to="/shop/negotiations" className="flex items-center gap-3 px-4 py-3 rounded-xl text-secondary-600 hover:bg-secondary-100 transition">
            <Icons.Chat />{sidebarOpen && <span>Đàm phán</span>}
          </Link>
          <Link to="/shop/purchase-intents" className="flex items-center gap-3 px-4 py-3 rounded-xl text-secondary-600 hover:bg-secondary-100 transition">
            <Icons.ShoppingCart />{sidebarOpen && <span>Đơn mua hàng</span>}
          </Link>
        </nav>
        <div className="p-4 border-t border-secondary-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">Shop</p>
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
              <h1 className="text-xl font-bold text-secondary-900">Shop Dashboard</h1>
              <p className="text-sm text-secondary-500">Chào mừng trở lại!</p>
            </div>
          </div>
          <button className="p-2 hover:bg-secondary-100 rounded-lg transition relative">
            <Icons.Bell /><span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
          </button>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card><CardBody className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600"><Icons.Chat /></div>
              <div><p className="text-sm text-secondary-500">Đàm phán</p><p className="text-2xl font-bold">{negotiations.length}</p></div>
            </CardBody></Card>
            <Card><CardBody className="flex items-center gap-4">
              <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center text-success-600"><Icons.ShoppingCart /></div>
              <div><p className="text-sm text-secondary-500">Đơn mua</p><p className="text-2xl font-bold">{purchaseIntents.length}</p></div>
            </CardBody></Card>
            <Card><CardBody className="flex items-center gap-4">
              <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center text-warning-600"><Icons.Building /></div>
              <div><p className="text-sm text-secondary-500">Nhà cung cấp</p><p className="text-2xl font-bold">{suppliers.length}+</p></div>
            </CardBody></Card>
            <Card><CardBody className="flex items-center gap-4">
              <div className="w-12 h-12 bg-danger-100 rounded-xl flex items-center justify-center text-danger-600"><Icons.Package /></div>
              <div><p className="text-sm text-secondary-500">Sản phẩm</p><p className="text-2xl font-bold">{products.length}+</p></div>
            </CardBody></Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Featured Products */}
            <Card>
              <div className="p-6 border-b border-secondary-200 flex items-center justify-between">
                <h2 className="text-lg font-bold">Sản phẩm nổi bật</h2>
                <Link to="/products"><Button variant="ghost" size="sm">Xem tất cả</Button></Link>
              </div>
              <CardBody className="p-0">
                <div className="divide-y divide-secondary-100">
                  {products.slice(0, 5).map((product) => (
                    <Link key={product.id} to={`/products/${product.id}`} className="p-4 flex items-center justify-between hover:bg-secondary-50 transition block">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-sm text-secondary-500">{product.supplier?.companyName}</p>
                      </div>
                      <p className="font-bold text-primary-600 ml-4">{formatCurrency(product.basePrice, product.currency)}</p>
                    </Link>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Verified Suppliers */}
            <Card>
              <div className="p-6 border-b border-secondary-200 flex items-center justify-between">
                <h2 className="text-lg font-bold">Nhà cung cấp uy tín</h2>
                <Link to="/suppliers"><Button variant="ghost" size="sm">Xem tất cả</Button></Link>
              </div>
              <CardBody className="p-0">
                <div className="divide-y divide-secondary-100">
                  {suppliers.slice(0, 5).map((supplier) => (
                    <Link key={supplier.id} to={`/suppliers/${supplier.id}`} className="p-4 flex items-center justify-between hover:bg-secondary-50 transition block">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
                          {supplier.companyName?.charAt(0)}
                        </div>
                        <div><p className="font-medium">{supplier.companyName}</p><p className="text-sm text-secondary-500">{supplier.country}</p></div>
                      </div>
                      {getStatusBadge(supplier.verificationStatus)}
                    </Link>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* My Negotiations */}
            <Card>
              <div className="p-6 border-b border-secondary-200 flex items-center justify-between">
                <h2 className="text-lg font-bold">Đàm phán của tôi</h2>
                <Link to="/shop/negotiations"><Button variant="ghost" size="sm">Xem tất cả</Button></Link>
              </div>
              <CardBody className="p-0">
                {negotiations.length === 0 ? (
                  <div className="p-6 text-center text-secondary-500"><p>Chưa có đàm phán nào</p></div>
                ) : (
                  <div className="divide-y divide-secondary-100">
                    {negotiations.map((neg) => (
                      <Link key={neg.id} to={`/negotiations/${neg.id}`} className="p-4 flex items-center justify-between hover:bg-secondary-50 transition block">
                        <div><p className="font-medium">{neg.supplier?.companyName || 'Supplier'}</p><p className="text-sm text-secondary-500">{neg.product?.name}</p></div>
                        {getStatusBadge(neg.status)}
                      </Link>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Purchase Intents */}
            <Card>
              <div className="p-6 border-b border-secondary-200 flex items-center justify-between">
                <h2 className="text-lg font-bold">Đơn mua hàng</h2>
                <Link to="/shop/purchase-intents"><Button variant="ghost" size="sm">Xem tất cả</Button></Link>
              </div>
              <CardBody className="p-0">
                {purchaseIntents.length === 0 ? (
                  <div className="p-6 text-center text-secondary-500"><p>Chưa có đơn mua nào</p></div>
                ) : (
                  <div className="divide-y divide-secondary-100">
                    {purchaseIntents.map((pi) => (
                      <div key={pi.id} className="p-4 flex items-center justify-between hover:bg-secondary-50 transition">
                        <div><p className="font-medium">{pi.intentNumber}</p><p className="text-sm text-secondary-500">{formatCurrency(pi.totalAmount, pi.currency)}</p></div>
                        {getStatusBadge(pi.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
