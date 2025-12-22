import { useState, useEffect } from 'react';
import { api } from '../../api';
import toast from 'react-hot-toast';
import { 
  FileText, Eye, X, Building2, Store, Package, 
  DollarSign, Phone, Mail, MapPin, Calendar,
  CheckCircle, Clock, AlertCircle
} from 'lucide-react';

interface Contract {
  id: number;
  product?: any;
  supplier?: any;
  shop?: any;
  quantity: number;
  agreed_price: number;
  status: string;
  start_date?: string;
  end_date?: string;
  terms?: string;
  created_at: string;
}

export default function AdminContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const res = await api.get('/admin/contracts');
      setContracts(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải danh sách hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const formatDate = (date: string) => date ? new Date(date).toLocaleDateString('vi-VN') : '-';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success">Đang hoạt động</span>;
      case 'draft':
        return <span className="badge badge-warning">Nháp</span>;
      case 'expired':
        return <span className="badge badge-gray">Hết hạn</span>;
      case 'cancelled':
        return <span className="badge badge-danger">Đã hủy</span>;
      default:
        return <span className="badge badge-gray">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const totalValue = contracts.reduce((sum, c) => sum + (c.agreed_price * c.quantity), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Hợp đồng</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <FileText className="w-4 h-4" />
          Tổng: {contracts.length} hợp đồng
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {contracts.filter((c) => c.status === 'active').length}
              </p>
              <p className="text-sm text-gray-500">Đang hoạt động</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {contracts.filter((c) => c.status === 'draft').length}
              </p>
              <p className="text-sm text-gray-500">Nháp</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {contracts.filter((c) => c.status === 'expired').length}
              </p>
              <p className="text-sm text-gray-500">Hết hạn</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(totalValue)}đ
              </p>
              <p className="text-sm text-gray-500">Tổng giá trị</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhà cung cấp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cửa hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá trị</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời hạn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">#{contract.id}</td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{contract.product?.name || 'N/A'}</p>
                    <p className="text-sm text-gray-500">SL: {contract.quantity}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{contract.supplier?.company_name || 'N/A'}</p>
                    <p className="text-sm text-gray-500">{contract.supplier?.user?.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{contract.shop?.shop_name || 'N/A'}</p>
                    <p className="text-sm text-gray-500">{contract.shop?.user?.email}</p>
                  </td>
                  <td className="px-6 py-4 font-medium text-primary-600">
                    {formatPrice(contract.agreed_price * contract.quantity)}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(contract.status)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(contract.start_date || '')} - {formatDate(contract.end_date || '')}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedContract(contract)}
                      className="btn btn-sm btn-secondary flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Chi tiết
                    </button>
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

      {/* Detail Modal */}
      {selectedContract && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Chi tiết Hợp đồng #{selectedContract.id}</h2>
              <button onClick={() => setSelectedContract(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                {getStatusBadge(selectedContract.status)}
                <p className="text-sm text-gray-500">Tạo ngày: {formatDate(selectedContract.created_at)}</p>
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
                    <p className="text-sm text-gray-500">Đơn giá thỏa thuận</p>
                    <p className="font-bold text-primary-600">{formatPrice(selectedContract.agreed_price)}</p>
                  </div>
                </div>
              </div>

              {/* Supplier Info */}
              <div className="bg-indigo-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  Nhà cung cấp
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
                    <span>{selectedContract.supplier?.phone || 'N/A'}</span>
                  </div>
                  {selectedContract.supplier?.address && (
                    <div className="md:col-span-2 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span>{selectedContract.supplier.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Shop Info */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Store className="w-5 h-5 text-blue-600" />
                  Cửa hàng mua
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Tên cửa hàng</p>
                    <p className="font-medium">{selectedContract.shop?.shop_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Người liên hệ</p>
                    <p className="font-medium">{selectedContract.shop?.user?.full_name || 'N/A'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{selectedContract.shop?.user?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{selectedContract.shop?.phone || 'N/A'}</span>
                  </div>
                  {selectedContract.shop?.address && (
                    <div className="md:col-span-2 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span>{selectedContract.shop.address}</span>
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
