import { useState, useEffect, useRef } from 'react';
import { Bell, Package, FileText, MessageSquare, CheckCircle, Loader2, ShoppingCart } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  link?: string;
}

const notificationIcons: Record<string, any> = {
  rfq_received: FileText,
  rfq_created: FileText,
  quote_received: Package,
  quote_created: Package,
  contract_created: CheckCircle,
  order_created: ShoppingCart,
  new_message: MessageSquare,
  default: Bell,
};

const notificationColors: Record<string, string> = {
  rfq_received: 'bg-purple-100 text-purple-600',
  rfq_created: 'bg-blue-100 text-blue-600',
  quote_received: 'bg-green-100 text-green-600',
  quote_created: 'bg-teal-100 text-teal-600',
  contract_created: 'bg-emerald-100 text-emerald-600',
  order_created: 'bg-orange-100 text-orange-600',
  new_message: 'bg-indigo-100 text-indigo-600',
  default: 'bg-gray-100 text-gray-600',
};

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications/', { params: { limit: 10 } });
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}`, { is_read: true });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) markAsRead(notification.id);
    setIsOpen(false);

    if (notification.link) {
      navigate(notification.link);
      return;
    }

    const basePath = user?.role === 'supplier' ? '/supplier' : user?.role === 'shop' ? '/shop' : '/admin';
    
    switch (notification.type) {
      case 'rfq_received':
      case 'rfq_created':
      case 'quote_received':
      case 'quote_created':
        navigate(`${basePath}/rfq`);
        break;
      case 'contract_created':
        navigate(`${basePath}/contracts`);
        break;
      case 'order_created':
        navigate(`${basePath}/orders`);
        break;
      case 'new_message':
        navigate(`${basePath}/chat`);
        break;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const diff = Date.now() - new Date(dateString).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Vừa xong';
      if (mins < 60) return `${mins} phút trước`;
      const hours = Math.floor(diff / 3600000);
      if (hours < 24) return `${hours} giờ trước`;
      const days = Math.floor(diff / 86400000);
      if (days < 7) return `${days} ngày trước`;
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch { return ''; }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchNotifications(); }}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between bg-gray-50">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary-600" />
              Thông báo
              {unreadCount > 0 && <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{unreadCount}</span>}
            </h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-sm text-primary-600 hover:underline">
                Đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-600" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Không có thông báo</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = notificationIcons[n.type] || notificationIcons.default;
                const color = notificationColors[n.type] || notificationColors.default;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <p className={`text-sm ${!n.is_read ? 'font-semibold' : ''}`}>{n.title}</p>
                          {!n.is_read && <span className="w-2 h-2 bg-primary-500 rounded-full"></span>}
                        </div>
                        {n.message && <p className="text-sm text-gray-500 line-clamp-2">{n.message}</p>}
                        <p className="text-xs text-gray-400 mt-1">{formatTime(n.created_at)}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}