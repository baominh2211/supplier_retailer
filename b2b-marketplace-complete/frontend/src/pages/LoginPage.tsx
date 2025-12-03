import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Building2, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    try {
      await login(email, password);
      toast.success('Đăng nhập thành công!');
      
      // Redirect based on role
      const user = useAuthStore.getState().user;
      if (user?.role === 'admin') navigate('/admin/dashboard');
      else if (user?.role === 'supplier') navigate('/supplier/dashboard');
      else navigate('/shop/dashboard');
    } catch (error: any) {
      const detail = error.response?.data?.detail || 'Đăng nhập thất bại';
      setErrorMessage(detail);
      
      // Show different toast based on error type
      if (error.response?.status === 403) {
        toast.error('Tài khoản chưa được kích hoạt');
      } else {
        toast.error(detail);
      }
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-white">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <span className="font-bold text-2xl">B2B Market</span>
          </Link>
        </div>
        
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Đăng nhập
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Chào mừng bạn quay trở lại
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">{errorMessage}</div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="email@example.com"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-3"
            >
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-600">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-primary-600 hover:underline font-medium">
              Đăng ký ngay
            </Link>
          </div>
          
          {/* Demo accounts */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-500 mb-2">Tài khoản demo:</p>
            <div className="space-y-1 text-xs text-gray-600">
              <p>Admin: admin@b2bmarket.com / Admin123!</p>
              <p>Supplier: supplier1@techcorp.com / Supplier123!</p>
              <p>Shop: shop1@retailplus.com / Shop123!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
