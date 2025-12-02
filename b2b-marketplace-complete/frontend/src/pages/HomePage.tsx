import { Link } from 'react-router-dom';
import { ArrowRight, Building2, ShoppingBag, MessageSquare, FileCheck, Users, Package } from 'lucide-react';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-gray-900 text-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Kết nối. Đàm phán. <span className="text-primary-400">Phát triển.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-10">
            Nền tảng B2B hàng đầu kết nối các nhà cung cấp với cửa hàng bán lẻ. 
            Đàm phán giá cả, gửi yêu cầu báo giá và ký hợp đồng trực tuyến.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn btn-primary btn-lg">
              Bắt đầu miễn phí
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/products" className="btn btn-lg bg-white/10 text-white hover:bg-white/20 border border-white/20">
              Xem sản phẩm
            </Link>
          </div>
        </div>
      </section>
      
      {/* Stats */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '1,000+', label: 'Nhà cung cấp' },
              { value: '50,000+', label: 'Sản phẩm' },
              { value: '5,000+', label: 'Cửa hàng' },
              { value: '100+', label: 'Danh mục' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl md:text-4xl font-bold text-primary-600">{stat.value}</p>
                <p className="text-gray-600 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How it works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Cách hoạt động
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Quy trình đơn giản để kết nối và giao dịch
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', icon: Package, title: 'Tìm sản phẩm', desc: 'Duyệt qua hàng nghìn sản phẩm từ các nhà cung cấp uy tín' },
              { step: '2', icon: MessageSquare, title: 'Gửi RFQ', desc: 'Gửi yêu cầu báo giá cho sản phẩm bạn quan tâm' },
              { step: '3', icon: Users, title: 'Đàm phán', desc: 'Thương lượng giá cả và điều khoản trực tiếp' },
              { step: '4', icon: FileCheck, title: 'Ký hợp đồng', desc: 'Chốt deal và ký hợp đồng điện tử' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-primary-600" />
                </div>
                <div className="bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto -mt-8 mb-4 text-sm font-bold border-4 border-white">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* For Suppliers & Shops */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Supplier Card */}
            <div className="card p-8 hover:shadow-lg transition">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Building2 className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Dành cho Nhà cung cấp</h3>
              <ul className="space-y-3 text-gray-600 mb-6">
                <li className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Đăng sản phẩm không giới hạn
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Nhận RFQ từ cửa hàng
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Quản lý hợp đồng tập trung
                </li>
              </ul>
              <Link to="/register?role=supplier" className="btn btn-primary w-full">
                Đăng ký làm Supplier
              </Link>
            </div>
            
            {/* Shop Card */}
            <div className="card p-8 hover:shadow-lg transition">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <ShoppingBag className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Dành cho Cửa hàng</h3>
              <ul className="space-y-3 text-gray-600 mb-6">
                <li className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Tìm kiếm sản phẩm đa dạng
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Gửi yêu cầu báo giá dễ dàng
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  So sánh báo giá từ nhiều supplier
                </li>
              </ul>
              <Link to="/register?role=shop" className="btn btn-success w-full">
                Đăng ký làm Shop
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Sẵn sàng bắt đầu?
          </h2>
          <p className="text-lg text-primary-100 mb-8">
            Tham gia cùng hàng nghìn doanh nghiệp đang sử dụng nền tảng của chúng tôi
          </p>
          <Link to="/register" className="btn btn-lg bg-white text-primary-600 hover:bg-gray-100">
            Đăng ký miễn phí ngay
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
