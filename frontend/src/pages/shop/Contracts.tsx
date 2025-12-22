import { useState, useEffect } from 'react';
import { shopsApi, contractsApi } from '../../api';
import { Contract } from '../../types';
import { FileText, Eye, X, Building2, Store, Package, Calendar, DollarSign, Phone, Mail, MapPin, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ShopContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<number | null>(null);
  
  useEffect(() => { fetchContracts(); }, []);
  
  const fetchContracts = async () => {
    try {
      const response = await shopsApi.getContracts();
      setContracts(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (contractId: number) => {
    setDownloadingPdf(contractId);
    try {
      const response = await contractsApi.downloadPdf(contractId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hop-dong-${contractId.toString().padStart(4, '0')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Đã tải hợp đồng PDF!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Lỗi tải PDF');
    } finally {
      setDownloadingPdf(null);
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Hợp đồng của tôi</h1>
      
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhà cung cấp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá thỏa thuận</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời hạn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{contract.product?.name}</td>
                  <td className="px-6 py-4 text-gray-600">{contract.supplier?.company_name}</td>
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
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedContract(contract)}
                        className="btn btn-sm btn-secondary flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Chi tiết
                      </button>
                      <button 
                        onClick={() => handleDownloadPdf(contract.id)}
                        disabled={downloadingPdf === contract.id}
                        className="btn btn-sm btn-primary flex items-center gap-1"
                      >
                        {downloadingPdf === contract.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        PDF
                      </button>
                    </div>
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

      {/* Contract Detail Modal */}
      {selectedContract && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Chi tiết hợp đồng #{selectedContract.id}</h2>
              <button 
                onClick={() => setSelectedContract(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  selectedContract.status === 'active' ? 'bg-green-100 text-green-700' : 
                  selectedContract.status === 'draft' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {selectedContract.status === 'active' ? '✅ Đang hoạt động' : 
                   selectedContract.status === 'draft' ? '📝 Nháp' : '⏹️ Hết hạn'}
                </span>
                <p className="text-sm text-gray-500">
                  Tạo ngày: {formatDate(selectedContract.created_at || '')}
                </p>
              </div>

              {/* Product Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary-600" />
                  Thông tin sản phẩm
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Tên sản phẩm</p>
                    <p className="font-medium">{selectedContract.product?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Danh mục</p>
                    <p className="font-medium">{selectedContract.product?.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Số lượng</p>
                    <p className="font-medium">{selectedContract.quantity} {selectedContract.product?.unit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Giá thỏa thuận</p>
                    <p className="font-bold text-primary-600 text-lg">{formatPrice(selectedContract.agreed_price)}</p>
                  </div>
                </div>
              </div>

              {/* Supplier Info */}
              <div className="bg-indigo-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  Thông tin nhà cung cấp
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Tên công ty</p>
                    <p className="font-medium">{selectedContract.supplier?.company_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Người liên hệ</p>
                    <p className="font-medium">{selectedContract.supplier?.user?.full_name || 'N/A'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{selectedContract.supplier?.user?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{selectedContract.supplier?.phone || selectedContract.supplier?.user?.phone || 'N/A'}</span>
                  </div>
                  {selectedContract.supplier?.address && (
                    <div className="md:col-span-2 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span>{selectedContract.supplier.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contract Period */}
              <div className="bg-purple-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Thời hạn hợp đồng
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Ngày bắt đầu</p>
                    <p className="font-medium">{formatDate(selectedContract.start_date || '')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ngày kết thúc</p>
                    <p className="font-medium">{formatDate(selectedContract.end_date || '')}</p>
                  </div>
                </div>
              </div>

              {/* Total Value */}
              <div className="bg-green-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Giá trị hợp đồng
                </h3>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {formatPrice(selectedContract.agreed_price * selectedContract.quantity)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedContract.quantity} x {formatPrice(selectedContract.agreed_price)}
                  </p>
                </div>
              </div>

              {/* Download PDF Button */}
              <div className="flex justify-center">
                <button 
                  onClick={() => handleDownloadPdf(selectedContract.id)}
                  disabled={downloadingPdf === selectedContract.id}
                  className="btn btn-primary flex items-center gap-2 px-8"
                >
                  {downloadingPdf === selectedContract.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  Tải hợp đồng PDF
                </button>
              </div>

              {/* Terms */}
              {selectedContract.terms && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Điều khoản</h3>
                  <p className="text-gray-600 bg-gray-50 rounded-lg p-4">{selectedContract.terms}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
