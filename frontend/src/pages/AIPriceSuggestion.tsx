import { useState, useEffect } from 'react';
import { api } from '../api';
import toast from 'react-hot-toast';
import { 
  Sparkles, TrendingUp, TrendingDown, Minus, Search, 
  Package, DollarSign, BarChart3, AlertCircle, Lightbulb,
  ArrowRight, RefreshCw, Target, Activity
} from 'lucide-react';

interface PriceSuggestion {
  suggested_price: number;
  min_price: number;
  max_price: number;
  confidence: number;
  confidence_percent: string;
  market_trend: string;
  reasoning: string[];
  comparable_products: any[];
  demand_score: number;
  supply_score: number;
  demand_level: string;
  supply_level: string;
}

interface Category {
  name: string;
  product_count: number;
}

export default function AIPriceSuggestion() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<PriceSuggestion | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/ai/categories');
      setCategories(res.data.categories);
      if (res.data.categories.length > 0) {
        setSelectedCategory(res.data.categories[0].name);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getPriceSuggestion = async () => {
    if (!selectedCategory) {
      toast.error('Vui lòng chọn danh mục');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        category: selectedCategory,
        quantity: quantity.toString(),
      });
      if (productName) {
        params.append('product_name', productName);
      }

      const res = await api.get(`/ai/price-suggestion?${params}`);
      setSuggestion(res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Không thể lấy gợi ý giá');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'falling':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTrendText = (trend: string) => {
    switch (trend) {
      case 'rising':
        return 'Đang tăng';
      case 'falling':
        return 'Đang giảm';
      default:
        return 'Ổn định';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Gợi ý Giá</h1>
            <p className="text-purple-200">Phân tích thị trường và đề xuất giá tối ưu</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-primary-600" />
              Thông tin sản phẩm
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Danh mục *
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input"
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name} ({cat.product_count} sản phẩm)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên sản phẩm (tùy chọn)
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="input"
                  placeholder="VD: Laptop Dell XPS 15"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nhập tên để có gợi ý chính xác hơn
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số lượng dự kiến
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="input"
                  min="1"
                />
              </div>

              <button
                onClick={getPriceSuggestion}
                disabled={loading || !selectedCategory}
                className="btn btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Đang phân tích...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Lấy gợi ý giá
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {!suggestion && !loading && (
            <div className="card p-12 text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nhận gợi ý giá thông minh
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Chọn danh mục và nhập thông tin sản phẩm để nhận gợi ý giá dựa trên phân tích thị trường
              </p>
            </div>
          )}

          {suggestion && (
            <>
              {/* Main Price Suggestion */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary-600" />
                    Giá đề xuất
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                    Độ tin cậy: {suggestion.confidence_percent}
                  </span>
                </div>

                <div className="text-center py-6">
                  <p className="text-5xl font-bold text-primary-600 mb-2">
                    {formatPrice(suggestion.suggested_price)}
                  </p>
                  <p className="text-gray-500">/ đơn vị</p>
                </div>

                {/* Price Range */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>Giá thấp nhất</span>
                    <span>Giá cao nhất</span>
                  </div>
                  <div className="relative h-3 bg-gray-200 rounded-full">
                    <div 
                      className="absolute h-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
                      style={{
                        left: '0%',
                        width: '100%',
                      }}
                    ></div>
                    <div 
                      className="absolute w-4 h-4 bg-primary-600 rounded-full -top-0.5 border-2 border-white shadow"
                      style={{
                        left: `${((suggestion.suggested_price - suggestion.min_price) / (suggestion.max_price - suggestion.min_price)) * 100}%`,
                        transform: 'translateX(-50%)',
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm font-medium mt-2">
                    <span className="text-green-600">{formatPrice(suggestion.min_price)}</span>
                    <span className="text-blue-600">{formatPrice(suggestion.max_price)}</span>
                  </div>
                </div>
              </div>

              {/* Market Indicators */}
              <div className="grid md:grid-cols-3 gap-4">
                {/* Market Trend */}
                <div className="card p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      suggestion.market_trend === 'rising' ? 'bg-green-100' :
                      suggestion.market_trend === 'falling' ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                      {getTrendIcon(suggestion.market_trend)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Xu hướng giá</p>
                      <p className="font-semibold text-gray-900">{getTrendText(suggestion.market_trend)}</p>
                    </div>
                  </div>
                </div>

                {/* Demand */}
                <div className="card p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Activity className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Nhu cầu</p>
                      <p className="font-semibold text-gray-900">{suggestion.demand_level}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-orange-500 rounded-full"
                        style={{ width: `${suggestion.demand_score}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Supply */}
                <div className="card p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Nguồn cung</p>
                      <p className="font-semibold text-gray-900">{suggestion.supply_level}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-blue-500 rounded-full"
                        style={{ width: `${suggestion.supply_score}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reasoning */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Phân tích & Lý do
                </h3>
                <ul className="space-y-2">
                  {suggestion.reasoning.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-600">
                      <ArrowRight className="w-4 h-4 text-primary-600 mt-1 flex-shrink-0" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Comparable Products */}
              {suggestion.comparable_products.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary-600" />
                    Sản phẩm tương tự
                  </h3>
                  <div className="space-y-3">
                    {suggestion.comparable_products.map((product, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.unit}</p>
                        </div>
                        <p className="font-semibold text-primary-600">
                          {formatPrice(product.price)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
