import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { suppliersApi } from '../api';
import { Supplier } from '../types';
import { Search, Building2 } from 'lucide-react';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  useEffect(() => {
    fetchSuppliers();
  }, []);
  
  const fetchSuppliers = async (params?: any) => {
    try {
      setLoading(true);
      const response = await suppliersApi.list(params);
      setSuppliers(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSuppliers({ search });
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Nhà cung cấp</h1>
        <p className="text-gray-600">Tìm và kết nối với các nhà cung cấp uy tín</p>
      </div>
      
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
            placeholder="Tìm kiếm nhà cung cấp..."
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Tìm kiếm
        </button>
      </form>
      
      {/* Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Không tìm thấy nhà cung cấp nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((supplier) => (
            <Link key={supplier.id} to={`/suppliers/${supplier.id}`} className="card p-6 hover:shadow-lg transition">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-7 h-7 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">
                    {supplier.company_name || 'Chưa có tên'}
                  </h3>
                  {supplier.user && (
                    <p className="text-sm text-gray-500 mb-2">{supplier.user.email}</p>
                  )}
                  {supplier.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{supplier.description}</p>
                  )}
                </div>
              </div>
              {(supplier.address || supplier.phone) && (
                <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                  {supplier.phone && <p>📞 {supplier.phone}</p>}
                  {supplier.address && <p className="truncate">📍 {supplier.address}</p>}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
