import { Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Building2, ShoppingBag, Menu, X, User } from 'lucide-react';
import { useState } from 'react';

export default function MainLayout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'admin': return '/admin/dashboard';
      case 'supplier': return '/supplier/dashboard';
      case 'shop': return '/shop/dashboard';
      default: return '/';
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">B2B Market</span>
            </Link>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/products" className="text-gray-600 hover:text-primary-600 font-medium flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Sản phẩm
              </Link>
              <Link to="/suppliers" className="text-gray-600 hover:text-primary-600 font-medium">
                Nhà cung cấp
              </Link>
            </nav>
            
            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link to={getDashboardLink()} className="btn btn-secondary btn-sm">
                    <User className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <button onClick={logout} className="btn btn-outline btn-sm">
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-outline btn-sm">
                    Đăng nhập
                  </Link>
                  <Link to="/register" className="btn btn-primary btn-sm">
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
            
            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white py-4 px-4 space-y-3">
            <Link to="/products" className="flex items-center gap-2 text-gray-600 hover:text-primary-600 font-medium py-2">
              <ShoppingBag className="w-4 h-4" />
              Sản phẩm
            </Link>
            <Link to="/suppliers" className="block text-gray-600 hover:text-primary-600 font-medium py-2">
              Nhà cung cấp
            </Link>
            <hr />
            {isAuthenticated ? (
              <>
                <Link to={getDashboardLink()} className="block btn btn-secondary w-full">
                  Dashboard
                </Link>
                <button onClick={logout} className="btn btn-outline w-full">
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block btn btn-outline w-full">
                  Đăng nhập
                </Link>
                <Link to="/register" className="block btn btn-primary w-full">
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        )}
      </header>
      
      {/* Main Content */}
      <main>
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-8 h-8 text-primary-400" />
                <span className="font-bold text-lg">B2B Market</span>
              </div>
              <p className="text-gray-400 text-sm">
                Nền tảng kết nối nhà cung cấp và các cửa hàng bán lẻ.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Sản phẩm</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/products" className="hover:text-white flex items-center gap-1"><ShoppingBag className="w-3 h-3" /> Tất cả sản phẩm</Link></li>
                <li><Link to="/suppliers" className="hover:text-white">Nhà cung cấp</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Tài khoản</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/register" className="hover:text-white">Đăng ký Supplier</Link></li>
                <li><Link to="/register" className="hover:text-white">Đăng ký Shop</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Hỗ trợ</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Trung tâm trợ giúp</a></li>
                <li><a href="#" className="hover:text-white">Liên hệ</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            © 2025 B2B Marketplace. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}