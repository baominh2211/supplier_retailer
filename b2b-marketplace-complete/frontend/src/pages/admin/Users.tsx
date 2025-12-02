import { useState, useEffect } from 'react';
import { adminApi } from '../../api';
import { Supplier, Shop } from '../../types';
import { Building2, ShoppingBag, Users } from 'lucide-react';

export default function AdminUsers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'suppliers' | 'shops'>('suppliers');
  
  useEffect(() => { fetchData(); }, []);
  
  const fetchData = async () => {
    try {
      const [suppRes, shopRes] = await Promise.all([
        adminApi.getSuppliers(),
        adminApi.getShops(),
      ]);
      setSuppliers(suppRes.data);
      setShops(shopRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (date: string) => new Date(date).toLocaleDateString('vi-VN');
  
  if (loading) {
    return <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>;
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Quản lý người dùng</h1>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
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
      
      {/* Suppliers */}
      {tab === 'suppliers' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Công ty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Điện thoại</th>
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
                    <td className="px-6 py-4 text-gray-600">{supplier.phone || '-'}</td>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Điện thoại</th>
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
                    <td className="px-6 py-4 text-gray-600">{shop.phone || '-'}</td>
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
