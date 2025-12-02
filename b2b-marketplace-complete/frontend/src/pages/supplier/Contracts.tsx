import { useState, useEffect } from 'react';
import { contractsApi } from '../../api';
import { Contract } from '../../types';
import { FileText } from 'lucide-react';

export default function SupplierContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => { fetchContracts(); }, []);
  
  const fetchContracts = async () => {
    try {
      const response = await contractsApi.list();
      setContracts(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const formatPrice = (price: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  
  const formatDate = (date: string) => date ? new Date(date).toLocaleDateString('vi-VN') : '-';
  
  if (loading) {
    return <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>;
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Hợp đồng</h1>
      
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá thỏa thuận</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời hạn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{contract.product?.name}</td>
                  <td className="px-6 py-4 text-gray-600">{contract.shop?.shop_name}</td>
                  <td className="px-6 py-4 font-medium text-primary-600">{formatPrice(contract.agreed_price)}</td>
                  <td className="px-6 py-4">{contract.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(contract.start_date || '')} - {formatDate(contract.end_date || '')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${
                      contract.status === 'active' ? 'badge-success' : 
                      contract.status === 'draft' ? 'badge-warning' : 'badge-gray'
                    }`}>
                      {contract.status === 'active' ? 'Đang hoạt động' : 
                       contract.status === 'draft' ? 'Nháp' : 'Hết hạn'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {contracts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Chưa có hợp đồng nào</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
