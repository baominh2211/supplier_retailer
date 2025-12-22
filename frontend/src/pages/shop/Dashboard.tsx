import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { shopsApi, contractsApi } from '../../api';
import { RFQ, Contract } from '../../types';
import { MessageSquare, FileText, Package, TrendingUp } from 'lucide-react';

export default function ShopDashboard() {
  const [rfqs, setRFQs] = useState<RFQ[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => { fetchData(); }, []);
  
  const fetchData = async () => {
    try {
      const [rfqRes, contRes] = await Promise.all([
        shopsApi.getRFQs(),
        shopsApi.getContracts(),
      ]);
      setRFQs(rfqRes.data);
      setContracts(contRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const stats = [
    { label: 'RFQ đã gửi', value: rfqs.length, icon: MessageSquare, color: 'bg-blue-100 text-blue-600' },
    { label: 'Chờ báo giá', value: rfqs.filter(r => r.status === 'pending').length, icon: Package, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Hợp đồng', value: contracts.length, icon: FileText, color: 'bg-green-100 text-green-600' },
    { label: 'Chi tiêu', value: '0đ', icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
  ];
  
  const formatPrice = (price: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  
  if (loading) {
    return <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>;
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
      
      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Hành động nhanh</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/products" className="btn btn-primary">
            <Package className="w-5 h-5" /> Tìm sản phẩm
          </Link>
          <Link to="/suppliers" className="btn btn-secondary">
            Xem nhà cung cấp
          </Link>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-6">
        {/* My RFQs */}
        <div className="card">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">RFQ của tôi</h2>
            <Link to="/shop/rfq" className="text-sm text-primary-600 hover:underline">Xem tất cả</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {rfqs.slice(0, 5).map((rfq) => (
              <div key={rfq.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{rfq.product?.name}</p>
                    <p className="text-sm text-gray-500">Số lượng: {rfq.quantity}</p>
                  </div>
                  <span className={`badge ${rfq.status === 'pending' ? 'badge-warning' : rfq.status === 'quoted' ? 'badge-info' : 'badge-success'}`}>
                    {rfq.status === 'pending' ? 'Chờ báo giá' : rfq.status === 'quoted' ? 'Có báo giá' : 'Đã đóng'}
                  </span>
                </div>
              </div>
            ))}
            {rfqs.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <p className="mb-2">Chưa có RFQ nào</p>
                <Link to="/products" className="btn btn-primary btn-sm">Tìm sản phẩm</Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Contracts */}
        <div className="card">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Hợp đồng</h2>
            <Link to="/shop/contracts" className="text-sm text-primary-600 hover:underline">Xem tất cả</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {contracts.slice(0, 5).map((contract) => (
              <div key={contract.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{contract.product?.name}</p>
                    <p className="text-sm text-gray-500">{contract.supplier?.company_name}</p>
                  </div>
                  <p className="font-medium text-primary-600">{formatPrice(contract.agreed_price)}</p>
                </div>
              </div>
            ))}
            {contracts.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Chưa có hợp đồng nào
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
