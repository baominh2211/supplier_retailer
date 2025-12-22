import { useState } from 'react';
import { api } from '../../api';
import toast from 'react-hot-toast';
import { 
  Sparkles, Send, Bot, User, FileText, DollarSign, 
  MessageSquare, TrendingUp, Lightbulb, Copy, Check,
  Loader2, ChevronDown, ChevronUp, Building2, Search
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ShopAIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'tools'>('chat');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  // Tool states
  const [rfqForm, setRfqForm] = useState({
    product_name: '',
    quantity: '',
    requirements: '',
    deadline: '',
  });
  const [negotiationForm, setNegotiationForm] = useState({
    product_name: '',
    listed_price: '',
    quantity: '',
    market_avg_price: '',
  });
  const [supplierIdToAnalyze, setSupplierIdToAnalyze] = useState('');
  
  const [toolResult, setToolResult] = useState<any>(null);
  const [expandedTool, setExpandedTool] = useState<string | null>('rfq');

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      const res = await api.post('/ai/chat', { message: input });
      const assistantMessage: Message = {
        role: 'assistant',
        content: res.data.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      toast.error('Không thể gửi tin nhắn');
      const errorMessage: Message = {
        role: 'assistant',
        content: '⚠️ Đã xảy ra lỗi. Vui lòng thử lại.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success('Đã copy!');
  };

  const draftRFQ = async () => {
    if (!rfqForm.product_name || !rfqForm.quantity) {
      toast.error('Vui lòng nhập tên sản phẩm và số lượng');
      return;
    }
    
    setLoading(true);
    setToolResult(null);
    
    try {
      const res = await api.post('/ai/draft-rfq', {
        ...rfqForm,
        quantity: parseInt(rfqForm.quantity),
      });
      setToolResult({ type: 'rfq', data: res.data });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Lỗi tạo RFQ');
    } finally {
      setLoading(false);
    }
  };

  const getNegotiationStrategy = async () => {
    if (!negotiationForm.product_name || !negotiationForm.listed_price) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    
    setLoading(true);
    setToolResult(null);
    
    try {
      const res = await api.post('/ai/negotiation-strategy', {
        ...negotiationForm,
        listed_price: parseFloat(negotiationForm.listed_price),
        quantity: parseInt(negotiationForm.quantity) || 1,
        market_avg_price: negotiationForm.market_avg_price ? parseFloat(negotiationForm.market_avg_price) : null,
      });
      setToolResult({ type: 'negotiation', data: res.data });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Lỗi phân tích');
    } finally {
      setLoading(false);
    }
  };

  const analyzeSupplier = async () => {
    if (!supplierIdToAnalyze) {
      toast.error('Vui lòng nhập ID nhà cung cấp');
      return;
    }
    
    setLoading(true);
    setToolResult(null);
    
    try {
      const res = await api.get(`/ai/analyze-supplier/${supplierIdToAnalyze}`);
      setToolResult({ type: 'supplier', data: res.data });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Lỗi phân tích nhà cung cấp');
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "Làm sao để đàm phán giá tốt hơn?",
    "Cách đánh giá nhà cung cấp uy tín",
    "Tips mua hàng số lượng lớn",
    "So sánh báo giá từ nhiều NCC",
  ];

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-t-2xl p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">AI Assistant</h1>
            <p className="text-emerald-200 text-sm">Trợ lý thông minh cho người mua</p>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'chat' ? 'bg-white text-emerald-600' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            💬 Chat
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'tools' ? 'bg-white text-emerald-600' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            🛠️ Công cụ AI
          </button>
        </div>
      </div>

      {activeTab === 'chat' ? (
        <>
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Xin chào! Tôi là AI Assistant</h3>
                <p className="text-gray-500 mb-4">Tôi có thể giúp bạn tìm nhà cung cấp, đàm phán giá, và tối ưu mua hàng</p>
                
                <div className="flex flex-wrap justify-center gap-2">
                  {quickPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(prompt)}
                      className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:border-emerald-300 hover:bg-emerald-50 transition"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-emerald-600" />
                  </div>
                )}
                
                <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-white border border-gray-200'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => copyToClipboard(msg.content, idx)}
                      className="mt-2 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                    >
                      {copiedIndex === idx ? (
                        <><Check className="w-3 h-3" /> Đã copy</>
                      ) : (
                        <><Copy className="w-3 h-3" /> Copy</>
                      )}
                    </button>
                  )}
                </div>
                
                {msg.role === 'user' && (
                  <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Nhập câu hỏi của bạn..."
                className="flex-1 input"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="btn btn-primary px-4 bg-emerald-600 hover:bg-emerald-700"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Tools Tab */
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
          {/* Tool 1: Draft RFQ */}
          <div className="card">
            <button
              onClick={() => setExpandedTool(expandedTool === 'rfq' ? null : 'rfq')}
              className="w-full p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Soạn yêu cầu báo giá</h3>
                  <p className="text-sm text-gray-500">AI soạn RFQ chuyên nghiệp</p>
                </div>
              </div>
              {expandedTool === 'rfq' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {expandedTool === 'rfq' && (
              <div className="p-4 pt-0 space-y-3">
                <input
                  type="text"
                  placeholder="Tên sản phẩm cần mua *"
                  value={rfqForm.product_name}
                  onChange={(e) => setRfqForm({...rfqForm, product_name: e.target.value})}
                  className="input"
                />
                <input
                  type="number"
                  placeholder="Số lượng *"
                  value={rfqForm.quantity}
                  onChange={(e) => setRfqForm({...rfqForm, quantity: e.target.value})}
                  className="input"
                />
                <textarea
                  placeholder="Yêu cầu đặc biệt (tùy chọn)"
                  value={rfqForm.requirements}
                  onChange={(e) => setRfqForm({...rfqForm, requirements: e.target.value})}
                  className="input min-h-[80px]"
                />
                <input
                  type="text"
                  placeholder="Deadline (VD: 2 tuần)"
                  value={rfqForm.deadline}
                  onChange={(e) => setRfqForm({...rfqForm, deadline: e.target.value})}
                  className="input"
                />
                <button
                  onClick={draftRFQ}
                  disabled={loading}
                  className="btn btn-primary w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageSquare className="w-5 h-5" />}
                  <span className="ml-2">Soạn RFQ</span>
                </button>
              </div>
            )}
          </div>

          {/* Tool 2: Negotiation Strategy */}
          <div className="card">
            <button
              onClick={() => setExpandedTool(expandedTool === 'negotiation' ? null : 'negotiation')}
              className="w-full p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Chiến lược đàm phán</h3>
                  <p className="text-sm text-gray-500">AI gợi ý cách đàm phán giá tốt nhất</p>
                </div>
              </div>
              {expandedTool === 'negotiation' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {expandedTool === 'negotiation' && (
              <div className="p-4 pt-0 space-y-3">
                <input
                  type="text"
                  placeholder="Tên sản phẩm *"
                  value={negotiationForm.product_name}
                  onChange={(e) => setNegotiationForm({...negotiationForm, product_name: e.target.value})}
                  className="input"
                />
                <input
                  type="number"
                  placeholder="Giá niêm yết (VND) *"
                  value={negotiationForm.listed_price}
                  onChange={(e) => setNegotiationForm({...negotiationForm, listed_price: e.target.value})}
                  className="input"
                />
                <input
                  type="number"
                  placeholder="Số lượng cần mua"
                  value={negotiationForm.quantity}
                  onChange={(e) => setNegotiationForm({...negotiationForm, quantity: e.target.value})}
                  className="input"
                />
                <input
                  type="number"
                  placeholder="Giá thị trường TB (nếu biết)"
                  value={negotiationForm.market_avg_price}
                  onChange={(e) => setNegotiationForm({...negotiationForm, market_avg_price: e.target.value})}
                  className="input"
                />
                <button
                  onClick={getNegotiationStrategy}
                  disabled={loading}
                  className="btn btn-primary w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lightbulb className="w-5 h-5" />}
                  <span className="ml-2">Phân tích</span>
                </button>
              </div>
            )}
          </div>

          {/* Tool 3: Analyze Supplier */}
          <div className="card">
            <button
              onClick={() => setExpandedTool(expandedTool === 'supplier' ? null : 'supplier')}
              className="w-full p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Đánh giá nhà cung cấp</h3>
                  <p className="text-sm text-gray-500">AI phân tích và đánh giá NCC</p>
                </div>
              </div>
              {expandedTool === 'supplier' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {expandedTool === 'supplier' && (
              <div className="p-4 pt-0 space-y-3">
                <input
                  type="number"
                  placeholder="ID nhà cung cấp *"
                  value={supplierIdToAnalyze}
                  onChange={(e) => setSupplierIdToAnalyze(e.target.value)}
                  className="input"
                />
                <p className="text-xs text-gray-500">
                  Bạn có thể tìm ID nhà cung cấp trong trang chi tiết sản phẩm hoặc danh sách nhà cung cấp
                </p>
                <button
                  onClick={analyzeSupplier}
                  disabled={loading}
                  className="btn btn-primary w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  <span className="ml-2">Phân tích</span>
                </button>
              </div>
            )}
          </div>

          {/* Tool Result */}
          {toolResult && (
            <div className="card p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-emerald-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Kết quả AI
                </h3>
                <button
                  onClick={() => copyToClipboard(
                    toolResult.type === 'rfq' ? toolResult.data.draft : JSON.stringify(toolResult.data, null, 2), 
                    -1
                  )}
                  className="text-sm text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                >
                  <Copy className="w-4 h-4" /> Copy
                </button>
              </div>
              
              {toolResult.type === 'rfq' && (
                <div className="bg-white rounded-lg p-4 whitespace-pre-wrap">
                  {toolResult.data.draft}
                </div>
              )}
              
              {toolResult.type === 'negotiation' && (
                <div className="space-y-3">
                  {toolResult.data.target_price && (
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-500">Giá mở đầu</p>
                        <p className="font-bold text-blue-600">{formatPrice(toolResult.data.opening_offer)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-500">Giá mục tiêu</p>
                        <p className="font-bold text-green-600">{formatPrice(toolResult.data.target_price)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-500">Giá tối đa</p>
                        <p className="font-bold text-red-600">{formatPrice(toolResult.data.walk_away_price)}</p>
                      </div>
                    </div>
                  )}
                  {toolResult.data.strategy && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Chiến lược:</p>
                      <p className="bg-white rounded-lg p-3">{toolResult.data.strategy}</p>
                    </div>
                  )}
                  {toolResult.data.talking_points?.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Điểm đàm phán:</p>
                      <ul className="bg-white rounded-lg p-3 list-disc list-inside space-y-1">
                        {toolResult.data.talking_points.map((p: string, i: number) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {toolResult.data.raw_response && (
                    <p className="bg-white rounded-lg p-3 whitespace-pre-wrap">{toolResult.data.raw_response}</p>
                  )}
                </div>
              )}
              
              {toolResult.type === 'supplier' && (
                <div className="space-y-3">
                  {toolResult.data.score && (
                    <div className="text-center bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-500">Điểm đánh giá</p>
                      <p className="text-4xl font-bold text-emerald-600">{toolResult.data.score}/10</p>
                    </div>
                  )}
                  {toolResult.data.strengths?.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">✅ Điểm mạnh:</p>
                      <ul className="bg-white rounded-lg p-3 space-y-1">
                        {toolResult.data.strengths.map((s: string, i: number) => (
                          <li key={i} className="text-green-700">• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {toolResult.data.concerns?.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">⚠️ Lưu ý:</p>
                      <ul className="bg-white rounded-lg p-3 space-y-1">
                        {toolResult.data.concerns.map((c: string, i: number) => (
                          <li key={i} className="text-orange-700">• {c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {toolResult.data.recommendation && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">💡 Khuyến nghị:</p>
                      <p className="bg-white rounded-lg p-3">{toolResult.data.recommendation}</p>
                    </div>
                  )}
                  {toolResult.data.raw_response && (
                    <p className="bg-white rounded-lg p-3 whitespace-pre-wrap">{toolResult.data.raw_response}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
