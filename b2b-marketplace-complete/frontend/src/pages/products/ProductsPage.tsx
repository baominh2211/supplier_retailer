import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../../services/api';
import { Button, Card, CardBody, Badge, Spinner, Input } from '../../components/ui';

interface Product {
  id: string;
  name: string;
  shortDescription: string;
  basePrice: number;
  currency: string;
  moq: number;
  viewCount: number;
  supplier: { id: string; companyName: string; country: string };
  category: { id: string; name: string };
}

interface Category { id: string; name: string; slug: string; }

export default function ProductsPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { fetchProducts(); fetchCategories(); }, [page, selectedCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = `/products?page=${page}&limit=12`;
      if (selectedCategory) url += `&categoryId=${selectedCategory}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await apiGet<any>(url);
      if (res.success) {
        setProducts(res.data?.data || res.data || []);
        setTotalPages(res.data?.pagination?.totalPages || 1);
      }
    } finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    const res = await apiGet<Category[]>('/categories');
    if (res.success && res.data) setCategories(res.data);
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); fetchProducts(); };
  const formatCurrency = (amount: number, currency = 'USD') => new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(amount);

  return (
    <div className="min-h-screen bg-secondary-50">
      <header className="bg-white border-b border-secondary-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white font-bold">B2</div>
            <span className="font-bold text-lg">B2B Market</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/products" className="text-primary-600 font-medium">Sản phẩm</Link>
            <Link to="/suppliers" className="text-secondary-600 hover:text-primary-600">Nhà cung cấp</Link>
            <Link to="/login"><Button size="sm">Đăng nhập</Button></Link>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <Input placeholder="Tìm kiếm sản phẩm..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
            <Button type="submit">Tìm kiếm</Button>
          </form>
          <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }} className="input w-full md:w-64">
            <option value="">Tất cả danh mục</option>
            {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-20"><p className="text-secondary-500 text-lg">Không tìm thấy sản phẩm nào</p></div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link key={product.id} to={`/products/${product.id}`}>
                  <Card className="h-full hover:shadow-lg transition cursor-pointer">
                    <div className="h-48 bg-secondary-100 rounded-t-xl flex items-center justify-center">
                      <svg className="w-16 h-16 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <CardBody>
                      <Badge variant="secondary" className="mb-2">{product.category?.name || 'Uncategorized'}</Badge>
                      <h3 className="font-bold text-lg mb-1 line-clamp-2">{product.name}</h3>
                      <p className="text-sm text-secondary-500 mb-3 line-clamp-2">{product.shortDescription}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xl font-bold text-primary-600">{formatCurrency(product.basePrice, product.currency)}</p>
                          <p className="text-xs text-secondary-400">MOQ: {product.moq} units</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{product.supplier?.companyName}</p>
                          <p className="text-xs text-secondary-400">{product.supplier?.country}</p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              ))}
            </div>
            <div className="flex justify-center gap-2 mt-8">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Trước</Button>
              <span className="px-4 py-2">Trang {page} / {totalPages}</span>
              <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sau</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
