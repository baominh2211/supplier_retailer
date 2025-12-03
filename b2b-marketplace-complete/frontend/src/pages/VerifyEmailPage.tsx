import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_verified'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token không hợp lệ');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await api.get(`/auth/verify-email?token=${token}`);
        
        if (response.data.status === 'already_verified') {
          setStatus('already_verified');
          setMessage('Email đã được xác thực trước đó');
        } else {
          setStatus('success');
          setMessage(response.data.message || 'Email đã được xác thực thành công!');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.detail || 'Có lỗi xảy ra khi xác thực email');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        
        {status === 'loading' && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Đang xác thực...</h1>
            <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Xác thực thành công! 🎉</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-left">
                  <p className="text-sm font-medium text-yellow-800">Bước tiếp theo</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Tài khoản của bạn đang chờ Admin phê duyệt. Bạn sẽ nhận được email thông báo khi được duyệt.
                  </p>
                </div>
              </div>
            </div>
            
            <Link 
              to="/login" 
              className="inline-block w-full py-3 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all"
            >
              Đi đến trang đăng nhập
            </Link>
          </>
        )}

        {status === 'already_verified' && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Email đã xác thực</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            
            <Link 
              to="/login" 
              className="inline-block w-full py-3 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all"
            >
              Đăng nhập
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Xác thực thất bại</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            
            <div className="space-y-3">
              <Link 
                to="/register" 
                className="inline-block w-full py-3 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all"
              >
                Đăng ký lại
              </Link>
              <Link 
                to="/login" 
                className="inline-block w-full py-3 px-6 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
              >
                Đăng nhập
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
