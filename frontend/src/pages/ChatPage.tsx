import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { chatApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { Send, MessageCircle, User, Building2, Store, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Message {
  id: number;
  chat_room_id: number;
  sender_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: number;
    full_name: string;
  };
}

interface ChatRoom {
  id: number;
  supplier_id: number;
  shop_id: number;
  created_at: string;
  updated_at: string;
  supplier?: any;
  shop?: any;
  messages: Message[];
  last_message?: Message;
  unread_count: number;
}

export default function ChatPage() {
  const { roomId } = useParams();
  const { user } = useAuthStore();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchRooms();
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, []);

  useEffect(() => {
    if (roomId) {
      fetchRoom(parseInt(roomId));
    }
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Poll for new messages
  useEffect(() => {
    if (activeRoom) {
      pollInterval.current = setInterval(() => {
        fetchRoom(activeRoom.id, true);
      }, 5000);
      return () => {
        if (pollInterval.current) clearInterval(pollInterval.current);
      };
    }
  }, [activeRoom?.id]);

  const fetchRooms = async () => {
    try {
      const response = await chatApi.getRooms();
      setRooms(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoom = async (id: number, silent = false) => {
    try {
      const response = await chatApi.getRoom(id);
      setActiveRoom(response.data);
      setMessages(response.data.messages || []);
      if (!silent) {
        fetchRooms(); // Refresh list to update unread counts
      }
    } catch (error) {
      console.error(error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoom) return;

    setSending(true);
    try {
      await chatApi.sendMessage(activeRoom.id, newMessage.trim());
      setNewMessage('');
      fetchRoom(activeRoom.id);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Lỗi gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Hôm qua';
    } else if (days < 7) {
      return `${days} ngày trước`;
    }
    return date.toLocaleDateString('vi-VN');
  };

  const getPartnerInfo = (room: ChatRoom) => {
    if (user?.role === 'supplier') {
      return {
        name: room.shop?.shop_name || 'Shop',
        icon: Store,
        color: 'bg-blue-500'
      };
    }
    return {
      name: room.supplier?.company_name || 'Supplier',
      icon: Building2,
      color: 'bg-indigo-500'
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Tin nhắn</h1>
      
      <div className="flex h-[calc(100%-3rem)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Sidebar - Chat list */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Cuộc trò chuyện</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {rooms.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Chưa có cuộc trò chuyện</p>
              </div>
            ) : (
              rooms.map(room => {
                const partner = getPartnerInfo(room);
                const isActive = activeRoom?.id === room.id;
                return (
                  <div
                    key={room.id}
                    onClick={() => fetchRoom(room.id)}
                    className={`p-4 border-b border-gray-100 cursor-pointer transition hover:bg-gray-50 ${
                      isActive ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 ${partner.color} rounded-full flex items-center justify-center`}>
                        <partner.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900 truncate">{partner.name}</p>
                          {room.last_message && (
                            <span className="text-xs text-gray-400">
                              {formatTime(room.last_message.created_at)}
                            </span>
                          )}
                        </div>
                        {room.last_message && (
                          <p className="text-sm text-gray-500 truncate">
                            {room.last_message.sender_id === user?.id ? 'Bạn: ' : ''}
                            {room.last_message.message}
                          </p>
                        )}
                      </div>
                      {room.unread_count > 0 && (
                        <span className="bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                          {room.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col">
          {activeRoom ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  {(() => {
                    const partner = getPartnerInfo(activeRoom);
                    return (
                      <>
                        <div className={`w-10 h-10 ${partner.color} rounded-full flex items-center justify-center`}>
                          <partner.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{partner.name}</p>
                          <p className="text-sm text-gray-500">
                            {user?.role === 'supplier' ? 'Cửa hàng' : 'Nhà cung cấp'}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => {
                  const isOwn = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] ${isOwn ? 'order-2' : ''}`}>
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            isOwn
                              ? 'bg-primary-600 text-white rounded-br-md'
                              : 'bg-gray-100 text-gray-900 rounded-bl-md'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                        </div>
                        <p className={`text-xs text-gray-400 mt-1 ${isOwn ? 'text-right' : ''}`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 input"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="btn btn-primary px-4"
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Chọn một cuộc trò chuyện để bắt đầu</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
