import { useState, useEffect } from 'react';
import { adminApi, api } from '../../api';
import { Supplier, Shop } from '../../types';
import { Building2, ShoppingBag, Mail, Clock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface PendingUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  email_verified: boolean;
  is_approved: boolean;
  created_at: string;
}

export default function AdminUsers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [unverifiedUsers, setUnverifiedUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'unverified' | 'suppliers' | 'shops'>('pending');
  
  useEffect(() => { fetchData(); }, []);
  
  const fetchData = async () => {
    try {
      const [suppRes, shopRes, pendingRes, unverifiedRes] = await Promise.all([
        adminApi.getSuppliers(),
        adminApi.getShops(),
        api.get('/admin/users/pending'),
        api.get('/admin/users/unverified'),
      ]);
      setSuppliers(suppRes.data);
      setShops(shopRes.data);
      setPendingUsers(pendingRes.data);
      setUnverifiedUsers(unverifiedRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerifyEmail = async (userId: number) => {
    try {
      await api.patch(`/admin/users/${userId}/verify-email`);
      toast.success('Email đã được xác thực!');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Có lỗi xảy ra');
    }
  };
  
  const handleApprove = async (userId: number) => {
    try {
      await api.patch(`/admin/users/${userId}/approve`);
      toast.success('Tài khoản đã được phê duyệt!');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Có lỗi xảy ra');
    }
  };
  
  const handleReject = async (userId: number) => {
    const reason = prompt('Lý do từ chối (tùy chọn):');
    try {
      await api.patch(`/admin/users/${userId}/reject`, { reason });
      toast.success('Đã từ chối tài khoản');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Có lỗi xảy ra');
    }
  };
  
  const formatDate = (date: string) => new Date(date).toLocaleDateString('vi-VN');
  
  const getRoleBadge = (role: string) => {
    if (role === 'supplier') return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">Nhà cung cấp</span>;
    if (role === 'shop') return <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Cửa hàng</span>;
    return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">{role}</span>;
  };
  
  if (loading) {
    return <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>;
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Quản lý người dùng</h1>
      
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button 
          onClick={() => setTab('pending')}
          className={`btn ${tab === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Clock className="w-5 h-5" /> Chờ duyệt ({pendingUsers.length})
        </button>
        <button 
          onClick={() => setTab('unverified')}
          className={`btn ${tab === 'unverified' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Mail className="w-5 h-5" /> Chưa xác thực ({unverifiedUsers.length})
        </button>
        <button 
          onClick={() => setTab('suppliers')}
          className={`btn ${tab === 'suppliers' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Building2 className="w-5 h-5" /> Nhà cung cấp ({suppliers.length})
        </button>
        <button 
          onClick={() => setTab('shops')}
          className={`btn ${tab === 'shops' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <ShoppingBag className="w-5 h-5" /> Cửa hàng ({shops.length})
        </button>
      </div>
      
      {/* Pending Users */}
      {tab === 'pending' && (
        <div className="card overflow-hidden">
          <div className="p-4 bg-yellow-50 border-b border-yellow-100">
            <p className="text-sm text-yellow-700">
              <Clock className="w-4 h-4 inline mr-1" />
              Các tài khoản đã xác thực email và đang chờ phê duyệt
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người dùng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày đăng ký</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{user.full_name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </td>
                    <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(user.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleApprove(user.id)}
                          className="btn btn-sm bg-green-500 hover:bg-green-600 text-white"
                        >
                          <CheckCircle className="w-4 h-4" /> Duyệt
                        </button>
                        <button 
                          onClick={() => handleReject(user.id)}
                          className="btn btn-sm bg-red-500 hover:bg-red-600 text-white"
                        >
                          <XCircle className="w-4 h-4" /> Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pendingUsers.length === 0 && (
              <div className="text-center py-12 text-gray-500">Không có tài khoản nào chờ duyệt</div>
            )}
          </div>
        </div>
      )}
      
      {/* Unverified Users */}
      {tab === 'unverified' && (
        <div className="card overflow-hidden">
          <div className="p-4 bg-orange-50 border-b border-orange-100">
            <p className="text-sm text-orange-700">
              <Mail className="w-4 h-4 inline mr-1" />
              Các tài khoản chưa xác thực email (Admin có thể xác thực thủ công)
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người dùng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày đăng ký</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {unverifiedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{user.full_name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </td>
                    <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(user.created_at)}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleVerifyEmail(user.id)}
                        className="btn btn-sm bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <Mail className="w-4 h-4" /> Xác thực Email
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {unverifiedUsers.length === 0 && (
              <div className="text-center py-12 text-gray-500">Tất cả đã xác thực email</div>
            )}
          </div>
        </div>
      )}
      
      {/* Suppliers */}
      {tab === 'suppliers' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Công ty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{supplier.company_name}</p>
                          <p className="text-sm text-gray-500">{supplier.user?.full_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{supplier.user?.email}</td>
                    <td className="px-6 py-4">
                      {supplier.user?.is_approved ? (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Đã duyệt</span>
                      ) : (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">Chờ duyệt</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(supplier.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {suppliers.length === 0 && (
              <div className="text-center py-12 text-gray-500">Chưa có nhà cung cấp nào</div>
            )}
          </div>
        </div>
      )}
      
      {/* Shops */}
      {tab === 'shops' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cửa hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shops.map((shop) => (
                  <tr key={shop.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{shop.shop_name}</p>
                          <p className="text-sm text-gray-500">{shop.user?.full_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{shop.user?.email}</td>
                    <td className="px-6 py-4">
                      {shop.user?.is_approved ? (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Đã duyệt</span>
                      ) : (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">Chờ duyệt</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(shop.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {shops.length === 0 && (
              <div className="text-center py-12 text-gray-500">Chưa có cửa hàng nào</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
