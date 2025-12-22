import { useState, useEffect } from 'react';
import { shopsApi, quotesApi } from '../../api';
import { RFQ, Quote } from '../../types';
import { MessageSquare, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ShopRFQs() {
  const [rfqs, setRFQs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null);
  
  useEffect(() => { fetchRFQs(); }, []);
  
  const fetchRFQs = async () => {
    try {
      const response = await shopsApi.getRFQs();
      setRFQs(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAcceptQuote = async (quote: Quote) => {
    try {
      // Use new accept endpoint - this will update quote status, RFQ status, and create contract
      await quotesApi.accept(quote.id);
      
      toast.success('Đã chấp nhận báo giá và tạo hợp đồng!');
      setSelectedRFQ(null);
      fetchRFQs();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Lỗi');
    }
  };
  
  const handleRejectQuote = async (quote: Quote) => {
    try {
      await quotesApi.reject(quote.id);
      toast.success('Đã từ chối báo giá');
      fetchRFQs();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Lỗi');
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">RFQ của tôi</h1>
      
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày gửi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Báo giá</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rfqs.map((rfq) => (
                <tr key={rfq.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{rfq.product?.name}</p>
                    <p className="text-sm text-gray-500">{rfq.product?.supplier?.company_name}</p>
                  </td>
                  <td className="px-6 py-4">{rfq.quantity}</td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(rfq.created_at)}</td>
                  <td className="px-6 py-4">
                    <span className={`badge ${rfq.status === 'pending' ? 'badge-warning' : rfq.status === 'quoted' ? 'badge-info' : 'badge-success'}`}>
                      {rfq.status === 'pending' ? 'Chờ báo giá' : rfq.status === 'quoted' ? 'Có báo giá' : 'Đã đóng'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {rfq.quotes && rfq.quotes.length > 0 ? (
                      <span className="text-primary-600 font-medium">{rfq.quotes.length} báo giá</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {rfq.quotes && rfq.quotes.length > 0 && (
                      <button onClick={() => setSelectedRFQ(rfq)} className="btn btn-primary btn-sm">
                        Xem báo giá
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
              <p>Chưa có RFQ nào</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Quotes Modal */}
      {selectedRFQ && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Báo giá nhận được</h2>
            <p className="text-gray-600 mb-6">
              Sản phẩm: <strong>{selectedRFQ.product?.name}</strong> - Số lượng: <strong>{selectedRFQ.quantity}</strong>
            </p>
            
            <div className="space-y-4">
              {selectedRFQ.quotes?.map((quote) => (
                <div key={quote.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{quote.supplier?.company_name}</p>
                      <p className="text-2xl font-bold text-primary-600">{formatPrice(quote.price)}</p>
                    </div>
                    <span className={`badge ${quote.status === 'pending' ? 'badge-warning' : quote.status === 'accepted' ? 'badge-success' : 'badge-danger'}`}>
                      {quote.status === 'pending' ? 'Chờ xác nhận' : quote.status === 'accepted' ? 'Đã chấp nhận' : 'Đã từ chối'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div><span className="text-gray-500">MOQ:</span> {quote.min_order_qty || '-'}</div>
                    <div><span className="text-gray-500">Thời gian giao:</span> {quote.lead_time ? `${quote.lead_time} ngày` : '-'}</div>
                  </div>
                  {quote.message && <p className="text-gray-600 text-sm mb-4">{quote.message}</p>}
                  
                  {quote.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleRejectQuote(quote)} className="btn btn-secondary btn-sm flex-1">
                        <X className="w-4 h-4" /> Từ chối
                      </button>
                      <button onClick={() => handleAcceptQuote(quote)} className="btn btn-success btn-sm flex-1">
                        <Check className="w-4 h-4" /> Chấp nhận
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <button onClick={() => setSelectedRFQ(null)} className="btn btn-secondary w-full mt-6">Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
}
