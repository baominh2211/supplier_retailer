import { useState, useEffect } from 'react';
import { rfqApi, suppliersApi } from '../../api';
import { RFQ } from '../../types';
import { MessageSquare, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SupplierRFQs() {
  const [rfqs, setRFQs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null);
  const [quoteData, setQuoteData] = useState({ price: '', min_order_qty: '', lead_time: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => { fetchRFQs(); }, []);
  
  const fetchRFQs = async () => {
    try {
      const response = await rfqApi.list();
      setRFQs(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const openQuoteModal = (rfq: RFQ) => {
    setSelectedRFQ(rfq);
    setQuoteData({ price: '', min_order_qty: '', lead_time: '', message: '' });
    setShowQuoteModal(true);
  };
  
  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRFQ) return;
    try {
      setSubmitting(true);
      await suppliersApi.createQuote({
        rfq_id: selectedRFQ.id,
        price: parseFloat(quoteData.price),
        min_order_qty: quoteData.min_order_qty ? parseInt(quoteData.min_order_qty) : null,
        lead_time: quoteData.lead_time ? parseInt(quoteData.lead_time) : null,
        message: quoteData.message
      });
      toast.success('Gửi báo giá thành công!');
      setShowQuoteModal(false);
      fetchRFQs();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Lỗi khi gửi báo giá');
    } finally {
      setSubmitting(false);
    }
  };
  
  const formatPrice = (price: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  
  const formatDate = (date: string) => new Date(date).toLocaleDateString('vi-VN');
  
  if (loading) {
    return <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>;
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Yêu cầu báo giá</h1>
      
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày gửi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rfqs.map((rfq) => (
                <tr key={rfq.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{rfq.product?.name}</p>
                    <p className="text-sm text-gray-500">{formatPrice(rfq.product?.price || 0)}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{rfq.shop?.shop_name}</td>
                  <td className="px-6 py-4 font-medium">{rfq.quantity}</td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(rfq.created_at)}</td>
                  <td className="px-6 py-4">
                    <span className={`badge ${rfq.status === 'pending' ? 'badge-warning' : rfq.status === 'quoted' ? 'badge-info' : 'badge-success'}`}>
                      {rfq.status === 'pending' ? 'Chờ báo giá' : rfq.status === 'quoted' ? 'Đã báo giá' : 'Đã đóng'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {rfq.status === 'pending' && (
                      <button onClick={() => openQuoteModal(rfq)} className="btn btn-primary btn-sm">
                        <Send className="w-4 h-4" /> Báo giá
                      </button>
                    )}
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
      
      {/* Quote Modal */}
      {showQuoteModal && selectedRFQ && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Gửi báo giá</h2>
            <p className="text-gray-600 mb-6">
              Sản phẩm: <strong>{selectedRFQ.product?.name}</strong> - Số lượng: <strong>{selectedRFQ.quantity}</strong>
            </p>
            <form onSubmit={handleSubmitQuote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá đề xuất (VND) *</label>
                <input type="number" value={quoteData.price} onChange={(e) => setQuoteData({...quoteData, price: e.target.value})} className="input" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MOQ</label>
                  <input type="number" value={quoteData.min_order_qty} onChange={(e) => setQuoteData({...quoteData, min_order_qty: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian giao (ngày)</label>
                  <input type="number" value={quoteData.lead_time} onChange={(e) => setQuoteData({...quoteData, lead_time: e.target.value})} className="input" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea value={quoteData.message} onChange={(e) => setQuoteData({...quoteData, message: e.target.value})} className="input h-24 resize-none" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowQuoteModal(false)} className="btn btn-secondary flex-1">Hủy</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                  {submitting ? 'Đang gửi...' : 'Gửi báo giá'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
