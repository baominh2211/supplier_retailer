import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { suppliersApi, productsApi } from '../api';
import { Supplier, Product } from '../types';
import { Building2, Package, Phone, MapPin, ArrowLeft } from 'lucide-react';

export default function SupplierDetailPage() {
  const { id } = useParams();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (id) {
      fetchSupplier();
      fetchProducts();
    }
  }, [id]);
  
  const fetchSupplier = async () => {
    try {
      const response = await suppliersApi.get(Number(id));
      setSupplier(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchProducts = async () => {
    try {
      const response = await productsApi.list({ supplier_id: Number(id) });
      setProducts(response.data);
    } catch (error) {
      console.error(error);
    }
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (!supplier) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 text-lg mb-4">Không tìm thấy nhà cung cấp</p>
        <Link to="/suppliers" className="btn btn-primary">Quay lại</Link>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <Link to="/suppliers" className="inline-flex items-center gap-1 text-gray-600 hover:text-primary-600 mb-6">
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </Link>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white mb-8">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center flex-shrink-0">
            <Building2 className="w-10 h-10 text-primary-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">{supplier.company_name || 'Chưa có tên'}</h1>
            {supplier.description && (
              <p className="text-primary-100 mb-4">{supplier.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm">
              {supplier.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" /> {supplier.phone}
                </span>
              )}
              {supplier.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {supplier.address}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Products */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Sản phẩm ({products.length})
        </h2>
        
        {products.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">Chưa có sản phẩm nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link key={product.id} to={`/products/${product.id}`} className="card hover:shadow-lg transition">
                <div className="aspect-square bg-gray-100 rounded-t-xl flex items-center justify-center">
                  <Package className="w-12 h-12 text-gray-300" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">{product.name}</h3>
                  <p className="text-lg font-bold text-primary-600">{formatPrice(product.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
