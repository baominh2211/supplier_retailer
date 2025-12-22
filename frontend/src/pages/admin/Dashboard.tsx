import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api';
import { AdminStats } from '../../types';
import { Users, Building2, ShoppingBag, Package, FileText, MessageSquare, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => { fetchStats(); }, []);
  
  const fetchStats = async () => {
    try {
      const response = await adminApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>;
  }
  
  const statCards = [
    { label: 'Tổng người dùng', value: stats?.total_users || 0, icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Nhà cung cấp', value: stats?.total_suppliers || 0, icon: Building2, color: 'bg-green-100 text-green-600' },
    { label: 'Cửa hàng', value: stats?.total_shops || 0, icon: ShoppingBag, color: 'bg-purple-100 text-purple-600' },
    { label: 'Sản phẩm', value: stats?.total_products || 0, icon: Package, color: 'bg-orange-100 text-orange-600' },
    { label: 'Chờ duyệt', value: stats?.pending_products || 0, icon: AlertCircle, color: 'bg-red-100 text-red-600' },
    { label: 'Hợp đồng', value: stats?.total_contracts || 0, icon: FileText, color: 'bg-teal-100 text-teal-600' },
  ];
  
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
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
      
      {/* Quick Links */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Quản lý nhanh</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/products" className="btn btn-primary">
            <Package className="w-5 h-5" /> Duyệt sản phẩm
            {stats?.pending_products ? (
              <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-sm">
                {stats.pending_products}
              </span>
            ) : null}
          </Link>
          <Link to="/admin/users" className="btn btn-secondary">
            <Users className="w-5 h-5" /> Quản lý người dùng
          </Link>
        </div>
      </div>
      
      {/* System Info */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Thông tin hệ thống</h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-500">Tổng RFQ</span>
            <span className="font-medium">{stats?.total_rfqs || 0}</span>
          </div>
          <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-500">Tổng hợp đồng</span>
            <span className="font-medium">{stats?.total_contracts || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
