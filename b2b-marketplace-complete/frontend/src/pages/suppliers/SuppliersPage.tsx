import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../../services/api';
import { Button, Card, CardBody, Badge, Spinner, Input } from '../../components/ui';

interface Supplier {
  id: string;
  companyName: string;
  legalName: string;
  country: string;
  verificationStatus: string;
  rating: number;
  totalProducts: number;
  description: string;
}

export default function SuppliersPage() {
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { fetchSuppliers(); }, [page]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      let url = `/suppliers?page=${page}&limit=12`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await apiGet<any>(url);
      if (res.success) {
        setSuppliers(res.data?.data || res.data || []);
        setTotalPages(res.data?.pagination?.totalPages || 1);
      }
    } finally { setLoading(false); }
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); fetchSuppliers(); };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: 'success' | 'warning' | 'secondary'; label: string }> = {
      VERIFIED: { variant: 'success', label: 'Đã xác minh' },
      PENDING_VERIFICATION: { variant: 'warning', label: 'Đang xác minh' },
      UNVERIFIED: { variant: 'secondary', label: 'Chưa xác minh' },
    };
    const cfg = map[status] || { variant: 'secondary' as const, label: status };
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      <header className="bg-white border-b border-secondary-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white font-bold">B2</div>
            <span className="font-bold text-lg">B2B Market</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/products" className="text-secondary-600 hover:text-primary-600">Sản phẩm</Link>
            <Link to="/suppliers" className="text-primary-600 font-medium">Nhà cung cấp</Link>
            <Link to="/login"><Button size="sm">Đăng nhập</Button></Link>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Nhà cung cấp</h1>
          <p className="text-secondary-500">Tìm kiếm và kết nối với các nhà cung cấp uy tín</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <Input placeholder="Tìm kiếm nhà cung cấp..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 max-w-md" />
          <Button type="submit">Tìm kiếm</Button>
        </form>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-20"><p className="text-secondary-500 text-lg">Không tìm thấy nhà cung cấp nào</p></div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suppliers.map((supplier) => (
                <Link key={supplier.id} to={`/suppliers/${supplier.id}`}>
                  <Card className="h-full hover:shadow-lg transition cursor-pointer">
                    <CardBody>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center text-primary-700 font-bold text-xl">
                            {supplier.companyName?.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{supplier.companyName}</h3>
                            <p className="text-sm text-secondary-500">{supplier.country}</p>
                          </div>
                        </div>
                        {getStatusBadge(supplier.verificationStatus)}
                      </div>
                      <p className="text-secondary-600 text-sm mb-4 line-clamp-2">{supplier.description || 'Chưa có mô tả'}</p>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="font-medium">{supplier.rating?.toFixed(1) || 'N/A'}</span>
                        </div>
                        <span className="text-secondary-500">{supplier.totalProducts || 0} sản phẩm</span>
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
