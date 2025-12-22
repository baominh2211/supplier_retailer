import { useState, useEffect } from 'react';
import { api } from '../../api';
import toast from 'react-hot-toast';
import { 
  MessageSquare, Eye, X, Building2, Store, Package, 
  DollarSign, Phone, Mail, MapPin, Calendar, FileText,
  CheckCircle, Clock, AlertCircle
} from 'lucide-react';

interface RFQ {
  id: number;
  product_id: number;
  shop_id: number;
  quantity: number;
  target_price: number;
  message: string;
  status: string;
  created_at: string;
  product?: any;
  shop?: any;
  quotes?: any[];
}

export default function AdminRFQs() {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null);

  useEffect(() => {
    fetchRFQs();
  }, []);

  const fetchRFQs = async () => {
    try {
      const res = await api.get('/admin/rfqs');
      setRfqs(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải danh sách RFQ');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-warning">Chờ báo giá</span>;
      case 'quoted':
        return <span className="badge badge-info">Đã báo giá</span>;
      case 'accepted':
        return <span className="badge badge-success">Đã chấp nhận</span>;
      case 'rejected':
        return <span className="badge badge-danger">Đã từ chối</span>;
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý RFQ & Báo giá</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MessageSquare className="w-4 h-4" />
          Tổng: {rfqs.length} RFQ
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {rfqs.filter((r) => r.status === 'pending').length}
              </p>
              <p className="text-sm text-gray-500">Chờ báo giá</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {rfqs.filter((r) => r.status === 'quoted').length}
              </p>
              <p className="text-sm text-gray-500">Đã báo giá</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {rfqs.filter((r) => r.status === 'accepted').length}
              </p>
              <p className="text-sm text-gray-500">Đã chấp nhận</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {rfqs.filter((r) => r.status === 'rejected').length}
              </p>
              <p className="text-sm text-gray-500">Đã từ chối</p>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop yêu cầu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá mong muốn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rfqs.map((rfq) => (
                <tr key={rfq.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">#{rfq.id}</td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{rfq.product?.name || 'N/A'}</p>
                    <p className="text-sm text-gray-500">{rfq.product?.category}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{rfq.shop?.shop_name || 'N/A'}</p>
                    <p className="text-sm text-gray-500">{rfq.shop?.user?.email}</p>
                  </td>
                  <td className="px-6 py-4">{rfq.quantity}</td>
                  <td className="px-6 py-4 font-medium text-primary-600">
                    {rfq.target_price ? formatPrice(rfq.target_price) : 'Không giới hạn'}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(rfq.status)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(rfq.created_at)}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedRFQ(rfq)}
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
          {rfqs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Chưa có yêu cầu báo giá nào</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRFQ && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Chi tiết RFQ #{selectedRFQ.id}</h2>
              <button onClick={() => setSelectedRFQ(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                {getStatusBadge(selectedRFQ.status)}
                <p className="text-sm text-gray-500">Tạo lúc: {formatDate(selectedRFQ.created_at)}</p>
              </div>

              {/* Product Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary-600" />
                  Thông tin sản phẩm yêu cầu
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Tên sản phẩm</p>
                    <p className="font-medium">{selectedRFQ.product?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Danh mục</p>
                    <p className="font-medium">{selectedRFQ.product?.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Số lượng yêu cầu</p>
                    <p className="font-medium">{selectedRFQ.quantity} {selectedRFQ.product?.unit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Giá mong muốn</p>
                    <p className="font-bold text-primary-600">
                      {selectedRFQ.target_price ? formatPrice(selectedRFQ.target_price) : 'Không giới hạn'}
                    </p>
                  </div>
                </div>
                {selectedRFQ.message && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-1">Tin nhắn từ Shop</p>
                    <p className="text-gray-700 bg-white rounded-lg p-3">{selectedRFQ.message}</p>
                  </div>
                )}
              </div>

              {/* Shop Info */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Store className="w-5 h-5 text-blue-600" />
                  Thông tin Shop yêu cầu
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Tên cửa hàng</p>
                    <p className="font-medium">{selectedRFQ.shop?.shop_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Người liên hệ</p>
                    <p className="font-medium">{selectedRFQ.shop?.user?.full_name || 'N/A'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{selectedRFQ.shop?.user?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{selectedRFQ.shop?.phone || selectedRFQ.shop?.user?.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Supplier Info */}
              <div className="bg-indigo-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  Thông tin Nhà cung cấp
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Tên công ty</p>
                    <p className="font-medium">{selectedRFQ.product?.supplier?.company_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Người liên hệ</p>
                    <p className="font-medium">{selectedRFQ.product?.supplier?.user?.full_name || 'N/A'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{selectedRFQ.product?.supplier?.user?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{selectedRFQ.product?.supplier?.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Quotes */}
              {selectedRFQ.quotes && selectedRFQ.quotes.length > 0 && (
                <div className="bg-green-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Báo giá đã nhận ({selectedRFQ.quotes.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedRFQ.quotes.map((quote: any) => (
                      <div key={quote.id} className="bg-white rounded-lg p-4 border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-gray-900">{quote.supplier?.company_name || 'Nhà cung cấp'}</p>
                          <span className={`badge ${
                            quote.status === 'accepted' ? 'badge-success' :
                            quote.status === 'rejected' ? 'badge-danger' : 'badge-warning'
                          }`}>
                            {quote.status === 'accepted' ? 'Đã chấp nhận' :
                             quote.status === 'rejected' ? 'Đã từ chối' : 'Đang chờ'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Giá đề xuất</p>
                            <p className="font-bold text-green-600">{formatPrice(quote.price_per_unit)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Thời gian giao</p>
                            <p className="font-medium">{quote.delivery_time || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Ngày báo giá</p>
                            <p className="font-medium">{formatDate(quote.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
