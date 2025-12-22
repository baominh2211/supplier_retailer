import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import toast from 'react-hot-toast';
import { Mail, RefreshCw, Clock, CheckCircle, LogIn } from 'lucide-react';

export default function WaitingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  
  const [resending, setResending] = useState(false);
  const [status, setStatus] = useState({
    email_verified: false,
    is_approved: false
  });
  const [approved, setApproved] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Check status every 5 seconds
  useEffect(() => {
    if (!email || approved) return;

    const checkStatus = async () => {
      try {
        const response = await api.get(`/auth/check-status?email=${encodeURIComponent(email)}`);
        setStatus(response.data);
        
        // If just got verified, show toast
        if (response.data.email_verified && !status.email_verified) {
          toast.success('Email đã được xác thực!');
        }
        
        // If approved, start countdown
        if (response.data.is_approved && !approved) {
          setApproved(true);
          toast.success('Tài khoản đã được phê duyệt!');
        }
      } catch (error) {
        console.error('Error checking status:', error);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [email, approved, status.email_verified]);

  // Countdown when approved
  useEffect(() => {
    if (!approved) return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      navigate('/login');
    }
  }, [approved, countdown, navigate]);

  const handleResendEmail = async () => {
    if (!email) return;
    
    setResending(true);
    try {
      await api.post(`/auth/resend-verification?email=${encodeURIComponent(email)}`);
      toast.success('Đã gửi lại email xác thực!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Không thể gửi lại email');
    } finally {
      setResending(false);
    }
  };

  // No email - show error
  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Có lỗi xảy ra</h1>
          <p className="text-gray-600 mb-6">Không tìm thấy thông tin. Vui lòng đăng ký lại.</p>
          <Link to="/register" className="btn btn-primary w-full">Đăng ký</Link>
        </div>
      </div>
    );
  }

  // Approved - show success with countdown
  if (approved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-14 h-14 text-green-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">🎉 Hoàn tất!</h1>
          <p className="text-gray-600 mb-6">
            Tài khoản của bạn đã được phê duyệt. Bạn có thể đăng nhập ngay bây giờ.
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-700">
              Chuyển đến trang đăng nhập sau <strong className="text-xl">{countdown}</strong> giây...
            </p>
          </div>
          
          <Link 
            to="/login" 
            className="inline-flex items-center justify-center gap-2 w-full py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all text-lg"
          >
            <LogIn className="w-5 h-5" />
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  // Waiting state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        
        {/* Header */}
        <div className="w-20 h-20 mx-auto mb-6 bg-indigo-100 rounded-full flex items-center justify-center relative">
          <Clock className="w-10 h-10 text-indigo-600" />
          <div className="absolute inset-0 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Đang chờ xử lý</h1>
        <p className="text-gray-600 mb-6">
          Email: <strong className="text-indigo-600">{email}</strong>
        </p>
        
        {/* Progress Steps */}
        <div className="bg-gray-50 rounded-xl p-5 mb-6 text-left">
          
          {/* Step 1: Register - Always done */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">✓</div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">Đăng ký tài khoản</p>
              <p className="text-sm text-green-600">Hoàn thành</p>
            </div>
          </div>
          
          {/* Step 2: Email Verification */}
          <div className="flex items-center gap-3 mb-4">
            {status.email_verified ? (
              <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">✓</div>
            ) : (
              <div className="w-10 h-10 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold animate-pulse">2</div>
            )}
            <div className="flex-1">
              <p className="font-medium text-gray-800">Xác thực email</p>
              {status.email_verified ? (
                <p className="text-sm text-green-600">Hoàn thành</p>
              ) : (
                <p className="text-sm text-yellow-600">⏳ Vui lòng kiểm tra email và click link xác thực</p>
              )}
            </div>
          </div>
          
          {/* Step 3: Admin Approval */}
          <div className="flex items-center gap-3 mb-4">
            {status.is_approved ? (
              <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">✓</div>
            ) : status.email_verified ? (
              <div className="w-10 h-10 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold animate-pulse">3</div>
            ) : (
              <div className="w-10 h-10 bg-gray-300 text-white rounded-full flex items-center justify-center font-bold">3</div>
            )}
            <div className="flex-1">
              <p className={`font-medium ${status.email_verified ? 'text-gray-800' : 'text-gray-400'}`}>Admin phê duyệt</p>
              {status.is_approved ? (
                <p className="text-sm text-green-600">Hoàn thành</p>
              ) : status.email_verified ? (
                <p className="text-sm text-yellow-600">⏳ Đang chờ Admin phê duyệt...</p>
              ) : (
                <p className="text-sm text-gray-400">Chờ xác thực email</p>
              )}
            </div>
          </div>
          
          {/* Step 4: Login */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-300 text-white rounded-full flex items-center justify-center font-bold">4</div>
            <div className="flex-1">
              <p className="font-medium text-gray-400">Đăng nhập & sử dụng</p>
              <p className="text-sm text-gray-400">Chờ Admin phê duyệt</p>
            </div>
          </div>
        </div>
        
        {/* Notice */}
        {!status.email_verified && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-amber-800">
              <strong>💡 Lưu ý:</strong> Kiểm tra cả thư mục <strong>Spam/Junk</strong> nếu không thấy email.
            </p>
          </div>
        )}
        
        {status.email_verified && !status.is_approved && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-blue-800">
              <Mail className="w-4 h-4 inline mr-1" />
              Bạn sẽ nhận được email khi tài khoản được phê duyệt.
            </p>
          </div>
        )}
        
        {/* Actions */}
        <div className="space-y-3">
          {!status.email_verified && (
            <button 
              onClick={handleResendEmail}
              disabled={resending}
              className="w-full py-3 px-6 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${resending ? 'animate-spin' : ''}`} />
              {resending ? 'Đang gửi...' : 'Gửi lại email xác thực'}
            </button>
          )}
          
          <Link 
            to="/login" 
            className="inline-block w-full py-3 px-6 text-gray-500 font-medium hover:text-gray-700 transition-all"
          >
            Quay lại đăng nhập
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-4">
          Tự động kiểm tra mỗi 5 giây
        </p>

      </div>
    </div>
  );
}
