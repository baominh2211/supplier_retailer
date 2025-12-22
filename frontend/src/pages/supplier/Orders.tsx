import { useState, useEffect, useRef } from 'react';
import { ordersApi } from '../../api';
import { 
  ShoppingCart, Eye, X, Package, Truck, CheckCircle, Clock, 
  CreditCard, Upload, Loader2, QrCode, Store, Settings,
  ChevronRight, Image
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Order {
  id: number;
  order_code: string;
  contract_id: number;
  supplier_id: number;
  shop_id: number;
  quantity: number;
  unit_price: number;
  total_amount: number;
  shipping_address: string;
  note: string;
  status: string;
  payment_method: string;
  payment_proof: string;
  paid_at: string;
  created_at: string;
  contract?: any;
  supplier?: any;
  shop?: any;
  tracking_history?: any[];
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  payment_pending: { label: 'Chờ thanh toán', color: 'bg-orange-100 text-orange-700', icon: CreditCard },
  paid: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-700', icon: CreditCard },
  processing: { label: 'Đang xử lý', color: 'bg-indigo-100 text-indigo-700', icon: Package },
  shipping: { label: 'Đang vận chuyển', color: 'bg-purple-100 text-purple-700', icon: Truck },
  delivered: { label: 'Đã giao hàng', color: 'bg-teal-100 text-teal-700', icon: CheckCircle },
  completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-700', icon: X },
};

const statusFlow = [
  { value: 'pending', next: 'confirmed' },
  { value: 'confirmed', next: 'payment_pending' },
  { value: 'payment_pending', next: 'paid' },
  { value: 'paid', next: 'processing' },
  { value: 'processing', next: 'shipping' },
  { value: 'shipping', next: 'delivered' },
  { value: 'delivered', next: 'completed' },
];

export default function SupplierOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPaymentSettings, setShowPaymentSettings] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  
  const [paymentForm, setPaymentForm] = useState({
    bank_name: '',
    bank_account: '',
    account_holder: ''
  });
  const [savingPayment, setSavingPayment] = useState(false);
  const [uploadingQR, setUploadingQR] = useState(false);
  const qrInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchOrders();
    fetchPaymentInfo();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await ordersApi.list();
      setOrders(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentInfo = async () => {
    try {
      const response = await ordersApi.getMyPaymentInfo();
      setPaymentInfo(response.data);
      setPaymentForm({
        bank_name: response.data.bank_name || '',
        bank_account: response.data.bank_account || '',
        account_holder: response.data.account_holder || ''
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateStatus = async (order: Order, newStatus: string) => {
    setUpdating(true);
    try {
      await ordersApi.updateStatus(order.id, newStatus);
      toast.success('Cập nhật trạng thái thành công!');
      fetchOrders();
      if (selectedOrder?.id === order.id) {
        const response = await ordersApi.get(order.id);
        setSelectedOrder(response.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Lỗi cập nhật');
    } finally {
      setUpdating(false);
    }
  };

  const handleSavePaymentInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPayment(true);
    try {
      await ordersApi.updateMyPaymentInfo(paymentForm);
      toast.success('Lưu thông tin thanh toán thành công!');
      fetchPaymentInfo();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Lỗi lưu');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleUploadQR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingQR(true);
    try {
      await ordersApi.uploadQRCode(file);
      toast.success('Tải mã QR thành công!');
      fetchPaymentInfo();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Lỗi tải file');
    } finally {
      setUploadingQR(false);
    }
  };

  const getNextStatus = (currentStatus: string) => {
    const found = statusFlow.find(s => s.value === currentStatus);
    return found?.next || null;
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const formatDate = (date: string) => new Date(date).toLocaleDateString('vi-VN');
  const formatDateTime = (date: string) => new Date(date).toLocaleString('vi-VN');

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_URL}${url}`;
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
        <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h1>
        <button onClick={() => setShowPaymentSettings(true)} className="btn btn-secondary">
          <Settings className="w-5 h-5" /> Cài đặt thanh toán
        </button>
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã đơn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cửa hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => {
                const status = statusConfig[order.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                const nextStatus = getNextStatus(order.status);
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-sm font-medium text-primary-600">{order.order_code}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{order.contract?.product?.name}</p>
                      <p className="text-sm text-gray-500">SL: {order.quantity}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{order.shop?.shop_name}</td>
                    <td className="px-6 py-4 font-medium text-green-600">{formatPrice(order.total_amount)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{formatDate(order.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setSelectedOrder(order)} className="btn btn-sm btn-secondary">
                          <Eye className="w-4 h-4" />
                        </button>
                        {nextStatus && order.status !== 'completed' && order.status !== 'cancelled' && (
                          <button
                            onClick={() => handleUpdateStatus(order, nextStatus)}
                            disabled={updating}
                            className="btn btn-sm btn-primary"
                          >
                            <ChevronRight className="w-4 h-4" />
                            {statusConfig[nextStatus]?.label}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {orders.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Chưa có đơn hàng nào</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Chi tiết đơn hàng #{selectedOrder.order_code}</h2>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-6">
              {(() => {
                const status = statusConfig[selectedOrder.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                const nextStatus = getNextStatus(selectedOrder.status);
                return (
                  <div className={`p-4 rounded-xl ${status.color}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusIcon className="w-6 h-6" />
                        <span className="font-semibold text-lg">{status.label}</span>
                      </div>
                      {nextStatus && selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                        <button
                          onClick={() => handleUpdateStatus(selectedOrder, nextStatus)}
                          disabled={updating}
                          className="btn btn-sm bg-white text-gray-900 hover:bg-gray-100"
                        >
                          {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                          {statusConfig[nextStatus]?.label}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><Package className="w-5 h-5 text-primary-600" /> Sản phẩm</h3>
                  <p className="font-medium">{selectedOrder.contract?.product?.name}</p>
                  <p className="text-gray-600">Số lượng: {selectedOrder.quantity}</p>
                  <p className="text-gray-600">Đơn giá: {formatPrice(selectedOrder.unit_price)}</p>
                  <p className="text-lg font-bold text-green-600 mt-2">Tổng: {formatPrice(selectedOrder.total_amount)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><Store className="w-5 h-5 text-blue-600" /> Cửa hàng</h3>
                  <p className="font-medium">{selectedOrder.shop?.shop_name}</p>
                  <p className="text-gray-600">{selectedOrder.shop?.phone}</p>
                  <p className="text-gray-600">{selectedOrder.shop?.address}</p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-semibold mb-2">Địa chỉ giao hàng</h3>
                <p className="text-gray-700">{selectedOrder.shipping_address}</p>
              </div>

              {selectedOrder.payment_proof && (
                <div className="bg-green-50 rounded-xl p-4">
                  <h3 className="font-semibold mb-2">Chứng từ thanh toán</h3>
                  <img src={getImageUrl(selectedOrder.payment_proof)} alt="Payment proof" className="max-w-xs rounded-lg border" />
                  <p className="text-sm text-gray-600 mt-2">Thanh toán lúc: {formatDateTime(selectedOrder.paid_at)}</p>
                </div>
              )}

              {selectedOrder.tracking_history && selectedOrder.tracking_history.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Lịch sử đơn hàng</h3>
                  <div className="space-y-3">
                    {selectedOrder.tracking_history.map((track: any, idx: number) => {
                      const trackStatus = statusConfig[track.status] || statusConfig.pending;
                      return (
                        <div key={track.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-primary-600' : 'bg-gray-300'}`} />
                            {idx < selectedOrder.tracking_history!.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-1" />}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="font-medium text-gray-900">{trackStatus.label}</p>
                            <p className="text-sm text-gray-600">{track.note}</p>
                            <p className="text-xs text-gray-400">{formatDateTime(track.created_at)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Settings Modal */}
      {showPaymentSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Cài đặt thanh toán</h2>
              <button onClick={() => setShowPaymentSettings(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSavePaymentInfo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên ngân hàng</label>
                <input type="text" value={paymentForm.bank_name} onChange={(e) => setPaymentForm({ ...paymentForm, bank_name: e.target.value })}
                  className="input" placeholder="VD: Vietcombank" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số tài khoản</label>
                <input type="text" value={paymentForm.bank_account} onChange={(e) => setPaymentForm({ ...paymentForm, bank_account: e.target.value })}
                  className="input" placeholder="VD: 1234567890" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chủ tài khoản</label>
                <input type="text" value={paymentForm.account_holder} onChange={(e) => setPaymentForm({ ...paymentForm, account_holder: e.target.value })}
                  className="input" placeholder="VD: NGUYEN VAN A" />
              </div>

              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Mã QR thanh toán</label>
                <div className="flex items-start gap-4">
                  {paymentInfo?.qr_code_url ? (
                    <img src={getImageUrl(paymentInfo.qr_code_url)} alt="QR Code" className="w-32 h-32 rounded-lg border object-cover" />
                  ) : (
                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                      <QrCode className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  <div>
                    <input ref={qrInputRef} type="file" accept="image/*" onChange={handleUploadQR} className="hidden" />
                    <button type="button" onClick={() => qrInputRef.current?.click()} disabled={uploadingQR} className="btn btn-secondary btn-sm">
                      {uploadingQR ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang tải...</> : <><Image className="w-4 h-4" /> Tải mã QR</>}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">Tải ảnh mã QR từ ứng dụng ngân hàng</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowPaymentSettings(false)} className="btn btn-secondary flex-1">Hủy</button>
                <button type="submit" disabled={savingPayment} className="btn btn-primary flex-1">
                  {savingPayment ? 'Đang lưu...' : 'Lưu thông tin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
