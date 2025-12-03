import { Link, useLocation } from 'react-router-dom';

export default function RegisterSuccessPage() {
  const location = useLocation();
  const email = location.state?.email || 'email của bạn';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        
        <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Đăng ký thành công! 🎉</h1>
        <p className="text-gray-600 mb-6">
          Chúng tôi đã gửi email xác thực đến <strong className="text-indigo-600">{email}</strong>
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-blue-800 mb-2">📋 Các bước tiếp theo:</h3>
          <ol className="text-sm text-blue-700 space-y-2">
            <li className="flex items-start">
              <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2 mt-0.5">1</span>
              <span>Kiểm tra hộp thư email (cả spam/junk)</span>
            </li>
            <li className="flex items-start">
              <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2 mt-0.5">2</span>
              <span>Click vào link xác thực trong email</span>
            </li>
            <li className="flex items-start">
              <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2 mt-0.5">3</span>
              <span>Chờ Admin phê duyệt tài khoản</span>
            </li>
            <li className="flex items-start">
              <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2 mt-0.5">4</span>
              <span>Đăng nhập và sử dụng hệ thống</span>
            </li>
          </ol>
        </div>
        
        <div className="space-y-3">
          <Link 
            to="/login" 
            className="inline-block w-full py-3 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all"
          >
            Đi đến trang đăng nhập
          </Link>
          
          <p className="text-sm text-gray-500">
            Không nhận được email?{' '}
            <button 
              onClick={() => alert('Chức năng gửi lại email sẽ được thêm sau')}
              className="text-indigo-600 hover:underline"
            >
              Gửi lại
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
