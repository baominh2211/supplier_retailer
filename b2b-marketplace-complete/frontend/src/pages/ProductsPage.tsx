import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsApi } from '../api';
import { Product } from '../types';
import { Search, Filter, Package } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);
  
  const fetchProducts = async (params?: any) => {
    try {
      setLoading(true);
      const response = await productsApi.list(params);
      setProducts(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const response = await productsApi.getCategories();
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error(error);
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts({ search, category: category || undefined });
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sản phẩm</h1>
        <p className="text-gray-600">Khám phá hàng nghìn sản phẩm từ các nhà cung cấp uy tín</p>
      </div>
      
      {/* Search & Filter */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
            placeholder="Tìm kiếm sản phẩm..."
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input w-full sm:w-48"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary">
          <Filter className="w-5 h-5" />
          Lọc
        </button>
      </form>
      
      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Không tìm thấy sản phẩm nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link key={product.id} to={`/products/${product.id}`} className="card hover:shadow-lg transition group">
              {/* Image */}
              <div className="aspect-square bg-gray-100 rounded-t-xl flex items-center justify-center">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-t-xl" />
                ) : (
                  <Package className="w-16 h-16 text-gray-300" />
                )}
              </div>
              
              {/* Content */}
              <div className="p-4">
                {product.category && (
                  <span className="badge badge-info mb-2">{product.category}</span>
                )}
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition line-clamp-2 mb-2">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                  {product.description || 'Chưa có mô tả'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary-600">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-sm text-gray-400">
                    Còn {product.stock}
                  </span>
                </div>
                {product.supplier && (
                  <p className="text-sm text-gray-500 mt-2">
                    {product.supplier.company_name}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
