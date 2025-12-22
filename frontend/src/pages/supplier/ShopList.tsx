import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, chatApi } from '../../api';
import { Search, Store, MapPin, Phone, Mail, MessageCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Shop {
  id: number;
  shop_name: string;
  address?: string;
  phone?: string;
  user: {
    id: number;
    email: string;
    full_name?: string;
  };
}

export default function ShopList() {
  const navigate = useNavigate();
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [creatingChat, setCreatingChat] = useState<number | null>(null);

  useEffect(() => {
    fetchShops();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredShops(shops);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredShops(
        shops.filter(
          (shop) =>
            shop.shop_name?.toLowerCase().includes(query) ||
            shop.address?.toLowerCase().includes(query) ||
            shop.user?.email?.toLowerCase().includes(query) ||
            shop.user?.full_name?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, shops]);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const response = await api.get('/shops/');
      // Handle different response formats
      const data = response.data;
      if (Array.isArray(data)) {
        setShops(data);
      } else if (data.shops) {
        setShops(data.shops);
      } else {
        setShops([]);
      }
    } catch (error: any) {
      console.error('Error fetching shops:', error);
      toast.error('Không thể tải danh sách shop');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (shop: Shop) => {
    try {
      setCreatingChat(shop.id);
      // Sử dụng user.id của shop để tạo chat room
      const response = await chatApi.createOrGetRoom(shop.user.id);
      const roomId = response.data.id;
      navigate(`/supplier/chat/${roomId}`);
    } catch (error: any) {
      console.error('Error creating chat:', error);
      toast.error(error.response?.data?.detail || 'Không thể tạo cuộc trò chuyện');
    } finally {
      setCreatingChat(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Danh sách Shop</h1>
        <p className="text-gray-500">Tìm kiếm và liên hệ với các cửa hàng</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm theo tên shop, địa chỉ, email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Tổng Shop</p>
          <p className="text-2xl font-bold text-gray-900">{shops.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Kết quả tìm kiếm</p>
          <p className="text-2xl font-bold text-primary-600">{filteredShops.length}</p>
        </div>
      </div>

      {/* Shop List */}
      {filteredShops.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Không tìm thấy shop nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredShops.map((shop) => (
            <div key={shop.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Store className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{shop.shop_name}</h3>
                    <p className="text-sm text-gray-500">
                      Người đại diện: {shop.user?.full_name || 'N/A'}
                    </p>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      {shop.address && (
                        <p className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {shop.address}
                        </p>
                      )}
                      {shop.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {shop.phone}
                        </p>
                      )}
                      {shop.user?.email && (
                        <p className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {shop.user.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleStartChat(shop)}
                  disabled={creatingChat === shop.id}
                  className="btn btn-primary flex items-center gap-2"
                >
                  {creatingChat === shop.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageCircle className="w-4 h-4" />
                  )}
                  Chat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}