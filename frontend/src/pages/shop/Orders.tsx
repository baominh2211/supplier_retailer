import { useState, useEffect, useRef } from 'react';
import { ordersApi, contractsApi } from '../../api';
import { 
  ShoppingCart, Eye, X, Package, Truck, CheckCircle, Clock, 
  CreditCard, Upload, Loader2, QrCode, Building2, FileText,
  Plus, AlertCircle
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

interface Contract {
  id: number;
  product?: any;
  supplier?: any;
  agreed_price: number;
  quantity: number;
  status: string;
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

export default function ShopOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [orderForm, setOrderForm] = useState({
    quantity: 1,
    shipping_address: '',
    note: '',
    payment_method: 'bank_transfer'
  });
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchOrders();
    fetchContracts();
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

  const fetchContracts = async () => {
    try {
      const response = await contractsApi.list();
      setContracts(response.data.filter((c: Contract) => c.status === 'active'));
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;

    setCreating(true);
    try {
      await ordersApi.create({
        contract_id: selectedContract.id,
        quantity: orderForm.quantity,
        shipping_address: orderForm.shipping_address,
        note: orderForm.note,
        payment_method: orderForm.payment_method
      });
      toast.success('Tạo đơn hàng thành công!');
      setShowCreateModal(false);
      setSelectedContract(null);
      setOrderForm({ quantity: 1, shipping_address: '', note: '', payment_method: 'bank_transfer' });
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Lỗi tạo đơn hàng');
    } finally {
      setCreating(false);
    }
  };

  const handleShowPayment = async (order: Order) => {
    setSelectedOrder(order);
    try {
      const response = await ordersApi.getSupplierPaymentInfo(order.supplier_id);
      setPaymentInfo(response.data);
    } catch (error) {
      setPaymentInfo(null);
    }
    setShowPaymentModal(true);
  };

  const handleUploadPaymentProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedOrder) return;

    setUploading(true);
    try {
      await ordersApi.uploadPaymentProof(selectedOrder.id, file);
      toast.success('Tải chứng từ thanh toán thành công!');
      setShowPaymentModal(false);
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Lỗi tải file');
    } finally {
      setUploading(false);
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Đơn hàng của tôi</h1>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus className="w-5 h-5" /> Tạo đơn hàng
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhà cung cấp</th>
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
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-sm font-medium text-primary-600">
                      {order.order_code}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{order.contract?.product?.name}</p>
                      <p className="text-sm text-gray-500">SL: {order.quantity}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{order.supplier?.company_name}</td>
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
                          <Eye className="w-4 h-4" /> Chi tiết
                        </button>
                        {(order.status === 'confirmed' || order.status === 'payment_pending') && (
                          <button onClick={() => handleShowPayment(order)} className="btn btn-sm btn-primary">
                            <CreditCard className="w-4 h-4" /> Thanh toán
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

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Tạo đơn hàng mới</h2>
              <button onClick={() => { setShowCreateModal(false); setSelectedContract(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!selectedContract ? (
              <div>
                <p className="text-gray-600 mb-4">Chọn hợp đồng để tạo đơn hàng:</p>
                {contracts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Chưa có hợp đồng nào còn hiệu lực</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contracts.map((contract) => (
                      <div key={contract.id} onClick={() => setSelectedContract(contract)}
                        className="p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{contract.product?.name}</p>
                            <p className="text-sm text-gray-500">{contract.supplier?.company_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary-600">{formatPrice(contract.agreed_price)}</p>
                            <p className="text-sm text-gray-500">Tối đa: {contract.quantity}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleCreateOrder} className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-500">Hợp đồng đã chọn:</p>
                  <p className="font-medium">{selectedContract.product?.name}</p>
                  <p className="text-sm text-gray-600">{selectedContract.supplier?.company_name}</p>
                  <p className="text-primary-600 font-bold">{formatPrice(selectedContract.agreed_price)} / sản phẩm</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng * (Tối đa: {selectedContract.quantity})</label>
                    <input type="number" min="1" max={selectedContract.quantity} value={orderForm.quantity}
                      onChange={(e) => setOrderForm({ ...orderForm, quantity: parseInt(e.target.value) || 1 })}
                      className="input" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phương thức thanh toán</label>
                    <select value={orderForm.payment_method} onChange={(e) => setOrderForm({ ...orderForm, payment_method: e.target.value })} className="input">
                      <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                      <option value="qr_code">QR Code</option>
                      <option value="cod">Thanh toán khi nhận hàng</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ giao hàng *</label>
                  <textarea value={orderForm.shipping_address} onChange={(e) => setOrderForm({ ...orderForm, shipping_address: e.target.value })}
                    className="input h-20 resize-none" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <textarea value={orderForm.note} onChange={(e) => setOrderForm({ ...orderForm, note: e.target.value })}
                    className="input h-20 resize-none" />
                </div>

                <div className="bg-green-50 rounded-xl p-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Tổng tiền:</span>
                    <span className="text-green-600">{formatPrice(selectedContract.agreed_price * orderForm.quantity)}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setSelectedContract(null)} className="btn btn-secondary flex-1">Quay lại</button>
                  <button type="submit" disabled={creating} className="btn btn-primary flex-1">
                    {creating ? 'Đang tạo...' : 'Tạo đơn hàng'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && !showPaymentModal && (
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
                return (
                  <div className={`p-4 rounded-xl ${status.color}`}>
                    <div className="flex items-center gap-2">
                      <StatusIcon className="w-6 h-6" />
                      <span className="font-semibold text-lg">{status.label}</span>
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
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><Building2 className="w-5 h-5 text-indigo-600" /> Nhà cung cấp</h3>
                  <p className="font-medium">{selectedOrder.supplier?.company_name}</p>
                  <p className="text-gray-600">{selectedOrder.supplier?.phone}</p>
                  <p className="text-gray-600">{selectedOrder.supplier?.address}</p>
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

      {/* Payment Modal */}
      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Thanh toán đơn hàng</h2>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-gray-600">Số tiền cần thanh toán:</p>
                <p className="text-3xl font-bold text-green-600">{formatPrice(selectedOrder.total_amount)}</p>
              </div>

              {paymentInfo ? (
                <div className="space-y-4">
                  {paymentInfo.qr_code_url && (
                    <div className="text-center">
                      <p className="font-medium mb-2">Quét mã QR để thanh toán:</p>
                      <img src={getImageUrl(paymentInfo.qr_code_url)} alt="QR Code" className="w-48 h-48 mx-auto rounded-lg border" />
                    </div>
                  )}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-medium mb-2">Thông tin chuyển khoản:</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-500">Ngân hàng:</span> {paymentInfo.bank_name || 'Chưa cập nhật'}</p>
                      <p><span className="text-gray-500">Số tài khoản:</span> {paymentInfo.bank_account || 'Chưa cập nhật'}</p>
                      <p><span className="text-gray-500">Chủ tài khoản:</span> {paymentInfo.account_holder || 'Chưa cập nhật'}</p>
                      <p><span className="text-gray-500">Nội dung:</span> <span className="font-mono font-medium">{selectedOrder.order_code}</span></p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 rounded-xl p-4 text-center">
                  <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-yellow-700">Nhà cung cấp chưa cập nhật thông tin thanh toán</p>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="font-medium mb-2">Tải lên chứng từ thanh toán:</p>
                <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleUploadPaymentProof} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn btn-primary w-full">
                  {uploading ? <><Loader2 className="w-5 h-5 animate-spin" /> Đang tải...</> : <><Upload className="w-5 h-5" /> Chọn file</>}
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">Hỗ trợ: JPG, PNG, PDF (tối đa 10MB)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
