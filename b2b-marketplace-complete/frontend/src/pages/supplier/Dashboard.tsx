import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { suppliersApi, rfqApi, contractsApi } from '../../api';
import { Product, RFQ, Contract } from '../../types';
import { Package, MessageSquare, FileText, TrendingUp } from 'lucide-react';

export default function SupplierDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [rfqs, setRFQs] = useState<RFQ[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      const [prodRes, rfqRes, contRes] = await Promise.all([
        suppliersApi.getProducts(),
        rfqApi.list(),
        contractsApi.list(),
      ]);
      setProducts(prodRes.data);
      setRFQs(rfqRes.data);
      setContracts(contRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const stats = [
    { label: 'Sản phẩm', value: products.length, icon: Package, color: 'bg-blue-100 text-blue-600' },
    { label: 'Yêu cầu báo giá', value: rfqs.length, icon: MessageSquare, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Hợp đồng', value: contracts.length, icon: FileText, color: 'bg-green-100 text-green-600' },
    { label: 'Doanh thu', value: '0đ', icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
  ];
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent RFQs */}
        <div className="card">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Yêu cầu báo giá mới</h2>
            <Link to="/supplier/rfq" className="text-sm text-primary-600 hover:underline">Xem tất cả</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {rfqs.slice(0, 5).map((rfq) => (
              <div key={rfq.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{rfq.product?.name}</p>
                    <p className="text-sm text-gray-500">Số lượng: {rfq.quantity}</p>
                  </div>
                  <span className={`badge ${rfq.status === 'pending' ? 'badge-warning' : 'badge-success'}`}>
                    {rfq.status === 'pending' ? 'Chờ báo giá' : 'Đã báo giá'}
                  </span>
                </div>
              </div>
            ))}
            {rfqs.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Chưa có yêu cầu báo giá nào
              </div>
            )}
          </div>
        </div>
        
        {/* Recent Products */}
        <div className="card">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Sản phẩm của bạn</h2>
            <Link to="/supplier/products" className="text-sm text-primary-600 hover:underline">Xem tất cả</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {products.slice(0, 5).map((product) => (
              <div key={product.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-500">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                  </p>
                </div>
                <span className={`badge ${product.status === 'active' ? 'badge-success' : product.status === 'pending' ? 'badge-warning' : 'badge-gray'}`}>
                  {product.status === 'active' ? 'Đang bán' : product.status === 'pending' ? 'Chờ duyệt' : 'Ẩn'}
                </span>
              </div>
            ))}
            {products.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <p className="mb-2">Chưa có sản phẩm nào</p>
                <Link to="/supplier/products" className="btn btn-primary btn-sm">Thêm sản phẩm</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
