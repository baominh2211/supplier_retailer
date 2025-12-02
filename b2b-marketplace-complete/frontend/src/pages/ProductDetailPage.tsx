import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productsApi, shopsApi } from '../api';
import { Product } from '../types';
import { useAuthStore } from '../store/authStore';
import { Package, Building2, ArrowLeft, MessageSquare, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRFQModal, setShowRFQModal] = useState(false);
  const [rfqData, setRfqData] = useState({ quantity: 1, message: '' });
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);
  
  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productsApi.get(Number(id));
      setProduct(response.data);
    } catch (error) {
      console.error(error);
      toast.error('Không tìm thấy sản phẩm');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendRFQ = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'shop') {
      toast.error('Chỉ tài khoản Shop mới có thể gửi RFQ');
      return;
    }
    
    try {
      setSubmitting(true);
      await shopsApi.createRFQ({
        product_id: product?.id,
        quantity: rfqData.quantity,
        message: rfqData.message,
      });
      toast.success('Gửi yêu cầu báo giá thành công!');
      setShowRFQModal(false);
      navigate('/shop/rfq');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Gửi RFQ thất bại');
    } finally {
      setSubmitting(false);
    }
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 text-lg mb-4">Không tìm thấy sản phẩm</p>
        <Link to="/products" className="btn btn-primary">Quay lại</Link>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/products" className="hover:text-primary-600 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Sản phẩm
        </Link>
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Image */}
        <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-2xl" />
          ) : (
            <Package className="w-32 h-32 text-gray-300" />
          )}
        </div>
        
        {/* Info */}
        <div>
          {product.category && (
            <span className="badge badge-info mb-3">{product.category}</span>
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
          
          <div className="text-3xl font-bold text-primary-600 mb-6">
            {formatPrice(product.price)}
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Tồn kho</span>
              <span className="font-medium">{product.stock} sản phẩm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Trạng thái</span>
              <span className={`badge ${product.status === 'active' ? 'badge-success' : 'badge-gray'}`}>
                {product.status === 'active' ? 'Đang bán' : 'Ngừng bán'}
              </span>
            </div>
          </div>
          
          {/* Supplier */}
          {product.supplier && (
            <Link 
              to={`/suppliers/${product.supplier.id}`}
              className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-primary-300 transition mb-6"
            >
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{product.supplier.company_name}</p>
                <p className="text-sm text-gray-500">Xem hồ sơ nhà cung cấp</p>
              </div>
            </Link>
          )}
          
          {/* Actions */}
          <div className="flex gap-4">
            <button 
              onClick={() => setShowRFQModal(true)}
              className="btn btn-primary flex-1 py-3"
            >
              <MessageSquare className="w-5 h-5" />
              Gửi yêu cầu báo giá
            </button>
          </div>
          
          {/* Description */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Mô tả sản phẩm</h2>
            <p className="text-gray-600 whitespace-pre-wrap">
              {product.description || 'Chưa có mô tả chi tiết'}
            </p>
          </div>
        </div>
      </div>
      
      {/* RFQ Modal */}
      {showRFQModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Gửi yêu cầu báo giá</h2>
            <p className="text-gray-600 mb-6">
              Sản phẩm: <strong>{product.name}</strong>
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số lượng cần mua
                </label>
                <input
                  type="number"
                  min="1"
                  value={rfqData.quantity}
                  onChange={(e) => setRfqData({ ...rfqData, quantity: Number(e.target.value) })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tin nhắn (tùy chọn)
                </label>
                <textarea
                  value={rfqData.message}
                  onChange={(e) => setRfqData({ ...rfqData, message: e.target.value })}
                  className="input h-24 resize-none"
                  placeholder="Mô tả yêu cầu của bạn..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowRFQModal(false)}
                className="btn btn-secondary flex-1"
              >
                Hủy
              </button>
              <button 
                onClick={handleSendRFQ}
                disabled={submitting}
                className="btn btn-primary flex-1"
              >
                {submitting ? 'Đang gửi...' : 'Gửi RFQ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
