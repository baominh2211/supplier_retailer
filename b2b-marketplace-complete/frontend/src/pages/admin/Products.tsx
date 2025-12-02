import { useState, useEffect } from 'react';
import { adminApi } from '../../api';
import { Product } from '../../types';
import { Package, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => { fetchProducts(); }, []);
  
  const fetchProducts = async () => {
    try {
      const response = await adminApi.getPendingProducts();
      setProducts(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleApprove = async (id: number) => {
    try {
      await adminApi.approveProduct(id);
      toast.success('Đã duyệt sản phẩm');
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Lỗi');
    }
  };
  
  const handleReject = async (id: number) => {
    try {
      await adminApi.rejectProduct(id);
      toast.success('Đã từ chối sản phẩm');
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Lỗi');
    }
  };
  
  const formatPrice = (price: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  
  if (loading) {
    return <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>;
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sản phẩm chờ duyệt</h1>
      
      {products.length === 0 ? (
        <div className="card p-12 text-center">
          <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-xl font-medium text-gray-900 mb-2">Không có sản phẩm nào chờ duyệt</p>
          <p className="text-gray-500">Tất cả sản phẩm đã được xử lý</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <div key={product.id} className="card p-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-lg">{product.name}</h3>
                  <p className="text-gray-600 mt-1">{product.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-primary-600 font-medium">{formatPrice(product.price)}</span>
                    <span className="text-gray-500">Tồn kho: {product.stock}</span>
                    {product.category && <span className="badge badge-info">{product.category}</span>}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Nhà cung cấp: {product.supplier?.company_name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleReject(product.id)} className="btn btn-danger btn-sm">
                    <X className="w-4 h-4" /> Từ chối
                  </button>
                  <button onClick={() => handleApprove(product.id)} className="btn btn-success btn-sm">
                    <Check className="w-4 h-4" /> Duyệt
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
