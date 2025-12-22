import { useState } from 'react';
import { api } from '../../api';
import toast from 'react-hot-toast';
import { 
  Sparkles, Send, Bot, User, FileText, DollarSign, 
  MessageSquare, TrendingUp, Lightbulb, Copy, Check,
  Loader2, ChevronDown, ChevronUp
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function SupplierAIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'tools'>('chat');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  // Tool states
  const [descriptionForm, setDescriptionForm] = useState({
    product_name: '',
    category: '',
    features: '',
  });
  const [pricingForm, setPricingForm] = useState({
    product_name: '',
    category: '',
    cost_price: '',
    target_margin: '20',
  });
  const [quoteForm, setQuoteForm] = useState({
    product_name: '',
    quantity: '',
    customer_message: '',
    proposed_price: '',
    delivery_days: '',
    company_name: '',
  });
  
  const [toolResult, setToolResult] = useState<any>(null);
  const [expandedTool, setExpandedTool] = useState<string | null>('description');

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

  const generateDescription = async () => {
    if (!descriptionForm.product_name || !descriptionForm.category) {
      toast.error('Vui lòng nhập tên sản phẩm và danh mục');
      return;
    }
    
    setLoading(true);
    setToolResult(null);
    
    try {
      const res = await api.post('/ai/generate-description', descriptionForm);
      setToolResult({ type: 'description', data: res.data });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Lỗi tạo mô tả');
    } finally {
      setLoading(false);
    }
  };

  const getPricingStrategy = async () => {
    if (!pricingForm.product_name || !pricingForm.cost_price) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    
    setLoading(true);
    setToolResult(null);
    
    try {
      const res = await api.post('/ai/pricing-strategy', {
        ...pricingForm,
        cost_price: parseFloat(pricingForm.cost_price),
        target_margin: parseFloat(pricingForm.target_margin),
      });
      setToolResult({ type: 'pricing', data: res.data });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Lỗi phân tích giá');
    } finally {
      setLoading(false);
    }
  };

  const draftQuote = async () => {
    if (!quoteForm.product_name || !quoteForm.proposed_price) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    
    setLoading(true);
    setToolResult(null);
    
    try {
      const res = await api.post('/ai/draft-quote', {
        ...quoteForm,
        quantity: parseInt(quoteForm.quantity) || 1,
        proposed_price: parseFloat(quoteForm.proposed_price),
        delivery_days: parseInt(quoteForm.delivery_days) || 7,
      });
      setToolResult({ type: 'quote', data: res.data });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Lỗi tạo báo giá');
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "Làm sao để tăng doanh số bán hàng B2B?",
    "Chiến lược định giá cạnh tranh",
    "Cách viết mô tả sản phẩm hấp dẫn",
    "Tips đàm phán với khách hàng lớn",
  ];

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-t-2xl p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">AI Assistant</h1>
            <p className="text-purple-200 text-sm">Trợ lý thông minh cho nhà cung cấp</p>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'chat' ? 'bg-white text-purple-600' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            💬 Chat
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'tools' ? 'bg-white text-purple-600' : 'bg-white/20 hover:bg-white/30'
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
                <p className="text-gray-500 mb-4">Tôi có thể giúp bạn về kinh doanh, định giá, và chiến lược bán hàng B2B</p>
                
                <div className="flex flex-wrap justify-center gap-2">
                  {quickPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(prompt)}
                      className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:border-purple-300 hover:bg-purple-50 transition"
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
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-purple-600" />
                  </div>
                )}
                
                <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user' 
                    ? 'bg-purple-600 text-white' 
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
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-purple-600" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
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
                className="btn btn-primary px-4"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Tools Tab */
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
          {/* Tool 1: Generate Description */}
          <div className="card">
            <button
              onClick={() => setExpandedTool(expandedTool === 'description' ? null : 'description')}
              className="w-full p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Tạo mô tả sản phẩm</h3>
                  <p className="text-sm text-gray-500">AI tạo mô tả chuyên nghiệp cho sản phẩm</p>
                </div>
              </div>
              {expandedTool === 'description' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {expandedTool === 'description' && (
              <div className="p-4 pt-0 space-y-3">
                <input
                  type="text"
                  placeholder="Tên sản phẩm *"
                  value={descriptionForm.product_name}
                  onChange={(e) => setDescriptionForm({...descriptionForm, product_name: e.target.value})}
                  className="input"
                />
                <input
                  type="text"
                  placeholder="Danh mục *"
                  value={descriptionForm.category}
                  onChange={(e) => setDescriptionForm({...descriptionForm, category: e.target.value})}
                  className="input"
                />
                <input
                  type="text"
                  placeholder="Đặc điểm nổi bật (tùy chọn)"
                  value={descriptionForm.features}
                  onChange={(e) => setDescriptionForm({...descriptionForm, features: e.target.value})}
                  className="input"
                />
                <button
                  onClick={generateDescription}
                  disabled={loading}
                  className="btn btn-primary w-full"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  <span className="ml-2">Tạo mô tả</span>
                </button>
              </div>
            )}
          </div>

          {/* Tool 2: Pricing Strategy */}
          <div className="card">
            <button
              onClick={() => setExpandedTool(expandedTool === 'pricing' ? null : 'pricing')}
              className="w-full p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Chiến lược giá</h3>
                  <p className="text-sm text-gray-500">Phân tích và đề xuất giá bán tối ưu</p>
                </div>
              </div>
              {expandedTool === 'pricing' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {expandedTool === 'pricing' && (
              <div className="p-4 pt-0 space-y-3">
                <input
                  type="text"
                  placeholder="Tên sản phẩm *"
                  value={pricingForm.product_name}
                  onChange={(e) => setPricingForm({...pricingForm, product_name: e.target.value})}
                  className="input"
                />
                <input
                  type="text"
                  placeholder="Danh mục"
                  value={pricingForm.category}
                  onChange={(e) => setPricingForm({...pricingForm, category: e.target.value})}
                  className="input"
                />
                <input
                  type="number"
                  placeholder="Giá vốn (VND) *"
                  value={pricingForm.cost_price}
                  onChange={(e) => setPricingForm({...pricingForm, cost_price: e.target.value})}
                  className="input"
                />
                <input
                  type="number"
                  placeholder="Mục tiêu lợi nhuận (%)"
                  value={pricingForm.target_margin}
                  onChange={(e) => setPricingForm({...pricingForm, target_margin: e.target.value})}
                  className="input"
                />
                <button
                  onClick={getPricingStrategy}
                  disabled={loading}
                  className="btn btn-primary w-full"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
                  <span className="ml-2">Phân tích giá</span>
                </button>
              </div>
            )}
          </div>

          {/* Tool 3: Draft Quote */}
          <div className="card">
            <button
              onClick={() => setExpandedTool(expandedTool === 'quote' ? null : 'quote')}
              className="w-full p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Soạn báo giá</h3>
                  <p className="text-sm text-gray-500">AI soạn phản hồi báo giá chuyên nghiệp</p>
                </div>
              </div>
              {expandedTool === 'quote' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {expandedTool === 'quote' && (
              <div className="p-4 pt-0 space-y-3">
                <input
                  type="text"
                  placeholder="Tên sản phẩm *"
                  value={quoteForm.product_name}
                  onChange={(e) => setQuoteForm({...quoteForm, product_name: e.target.value})}
                  className="input"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Số lượng"
                    value={quoteForm.quantity}
                    onChange={(e) => setQuoteForm({...quoteForm, quantity: e.target.value})}
                    className="input"
                  />
                  <input
                    type="number"
                    placeholder="Giá đề xuất (VND) *"
                    value={quoteForm.proposed_price}
                    onChange={(e) => setQuoteForm({...quoteForm, proposed_price: e.target.value})}
                    className="input"
                  />
                </div>
                <input
                  type="number"
                  placeholder="Thời gian giao hàng (ngày)"
                  value={quoteForm.delivery_days}
                  onChange={(e) => setQuoteForm({...quoteForm, delivery_days: e.target.value})}
                  className="input"
                />
                <input
                  type="text"
                  placeholder="Tên công ty của bạn"
                  value={quoteForm.company_name}
                  onChange={(e) => setQuoteForm({...quoteForm, company_name: e.target.value})}
                  className="input"
                />
                <textarea
                  placeholder="Ghi chú từ khách hàng (nếu có)"
                  value={quoteForm.customer_message}
                  onChange={(e) => setQuoteForm({...quoteForm, customer_message: e.target.value})}
                  className="input min-h-[80px]"
                />
                <button
                  onClick={draftQuote}
                  disabled={loading}
                  className="btn btn-primary w-full"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lightbulb className="w-5 h-5" />}
                  <span className="ml-2">Soạn báo giá</span>
                </button>
              </div>
            )}
          </div>

          {/* Tool Result */}
          {toolResult && (
            <div className="card p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-purple-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Kết quả AI
                </h3>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(toolResult.data, null, 2), -1)}
                  className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
                >
                  <Copy className="w-4 h-4" /> Copy
                </button>
              </div>
              
              {toolResult.type === 'description' && toolResult.data.short_desc && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Mô tả ngắn:</p>
                    <p className="bg-white rounded-lg p-3">{toolResult.data.short_desc}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Mô tả đầy đủ:</p>
                    <p className="bg-white rounded-lg p-3 whitespace-pre-wrap">{toolResult.data.full_desc}</p>
                  </div>
                  {toolResult.data.key_features?.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Đặc điểm nổi bật:</p>
                      <ul className="bg-white rounded-lg p-3 list-disc list-inside">
                        {toolResult.data.key_features.map((f: string, i: number) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              {toolResult.type === 'pricing' && (
                <div className="space-y-3">
                  {toolResult.data.suggested_price && (
                    <div className="text-center bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-500">Giá đề xuất</p>
                      <p className="text-3xl font-bold text-green-600">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(toolResult.data.suggested_price)}
                      </p>
                    </div>
                  )}
                  {toolResult.data.strategy && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Chiến lược:</p>
                      <p className="bg-white rounded-lg p-3">{toolResult.data.strategy}</p>
                    </div>
                  )}
                  {toolResult.data.reasoning?.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Phân tích:</p>
                      <ul className="bg-white rounded-lg p-3 list-disc list-inside space-y-1">
                        {toolResult.data.reasoning.map((r: string, i: number) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {toolResult.data.raw_response && (
                    <p className="bg-white rounded-lg p-3 whitespace-pre-wrap">{toolResult.data.raw_response}</p>
                  )}
                </div>
              )}
              
              {toolResult.type === 'quote' && (
                <div className="bg-white rounded-lg p-4 whitespace-pre-wrap">
                  {toolResult.data.draft}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
