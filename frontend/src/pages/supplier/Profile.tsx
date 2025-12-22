import { useState, useEffect } from 'react';
import { suppliersApi, ordersApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { 
  User, Building2, Mail, Phone, MapPin, Globe, FileText, 
  Save, Camera, Shield, Award, Star, CreditCard, QrCode, Upload, Loader2
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface SupplierProfile {
  id: number;
  company_name: string;
  description: string;
  address: string;
  phone: string;
  website: string;
  tax_code: string;
  business_license: string;
  logo_url: string;
  rating: number;
  total_products: number;
  total_contracts: number;
}

interface PaymentInfo {
  id: number | null;
  supplier_id: number;
  bank_name: string | null;
  bank_account: string | null;
  account_holder: string | null;
  qr_code_url: string | null;
}

export default function SupplierProfile() {
  const { user, fetchUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [uploadingQR, setUploadingQR] = useState(false);
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'payment'>('profile');
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company_name: '',
    description: '',
    address: '',
    website: '',
    tax_code: '',
    business_license: '',
  });

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    id: null,
    supplier_id: 0,
    bank_name: '',
    bank_account: '',
    account_holder: '',
    qr_code_url: null,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const [profileRes, paymentRes] = await Promise.all([
        suppliersApi.getMe(),
        ordersApi.getMyPaymentInfo()
      ]);
      
      setProfile(profileRes.data);
      setFormData({
        full_name: user?.full_name || '',
        email: user?.email || '',
        phone: profileRes.data.phone || user?.phone || '',
        company_name: profileRes.data.company_name || '',
        description: profileRes.data.description || '',
        address: profileRes.data.address || '',
        website: profileRes.data.website || '',
        tax_code: profileRes.data.tax_code || '',
        business_license: profileRes.data.business_license || '',
      });
      
      setPaymentInfo({
        id: paymentRes.data.id || null,
        supplier_id: paymentRes.data.supplier_id || 0,
        bank_name: paymentRes.data.bank_name || '',
        bank_account: paymentRes.data.bank_account || '',
        account_holder: paymentRes.data.account_holder || '',
        qr_code_url: paymentRes.data.qr_code_url || null,
      });
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentInfo({ ...paymentInfo, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await suppliersApi.updateMe({
        company_name: formData.company_name,
        description: formData.description,
        address: formData.address,
        phone: formData.phone,
        website: formData.website,
        tax_code: formData.tax_code,
        business_license: formData.business_license,
      });
      toast.success('Cập nhật thông tin thành công!');
      fetchUser();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayment = async () => {
    try {
      setSavingPayment(true);
      await ordersApi.updateMyPaymentInfo({
        bank_name: paymentInfo.bank_name,
        bank_account: paymentInfo.bank_account,
        account_holder: paymentInfo.account_holder,
      });
      toast.success('Đã cập nhật thông tin thanh toán');
    } catch (error: any) {
      console.error('Error saving payment info:', error);
      toast.error(error.response?.data?.detail || 'Không thể lưu thông tin thanh toán');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleUploadQR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File ảnh phải nhỏ hơn 5MB');
      return;
    }

    try {
      setUploadingQR(true);
      const response = await ordersApi.uploadQRCode(file);
      setPaymentInfo({ ...paymentInfo, qr_code_url: response.data.url });
      toast.success('Đã tải lên mã QR');
    } catch (error: any) {
      console.error('Error uploading QR:', error);
      toast.error(error.response?.data?.detail || 'Không thể tải lên mã QR');
    } finally {
      setUploadingQR(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {formData.company_name?.charAt(0) || user?.full_name?.charAt(0) || 'S'}
            </div>
            <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50">
              <Camera className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          
          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900">{formData.company_name || 'Chưa có tên công ty'}</h1>
            <p className="text-gray-500">{user?.email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                <Shield className="w-4 h-4" />
                Đã xác thực
              </span>
              {profile?.rating && profile.rating > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                  <Star className="w-4 h-4 fill-current" />
                  {profile.rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-primary-600">{profile?.total_products || 0}</p>
              <p className="text-sm text-gray-500">Sản phẩm</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{profile?.total_contracts || 0}</p>
              <p className="text-sm text-gray-500">Hợp đồng</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'profile'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Thông tin doanh nghiệp
          </div>
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'payment'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Thông tin thanh toán
          </div>
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-600" />
              Thông tin cá nhân
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="input"
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    className="input pl-10 bg-gray-50"
                    disabled
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="0901234567"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-600" />
              Thông tin công ty
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên công ty *</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  className="input"
                  placeholder="Công ty TNHH ABC"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả công ty</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="input min-h-[100px]"
                  placeholder="Giới thiệu về công ty của bạn..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="123 Đường ABC, Quận XYZ, TP.HCM"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã số thuế</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="tax_code"
                    value={formData.tax_code}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="0123456789"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Số giấy phép kinh doanh</label>
                <input
                  type="text"
                  name="business_license"
                  value={formData.business_license}
                  onChange={handleChange}
                  className="input"
                  placeholder="41A8-012345"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary px-8 py-3 flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      )}

      {/* Payment Tab */}
      {activeTab === 'payment' && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Thông tin thanh toán</h2>
                <p className="text-sm text-gray-500">
                  Thông tin này sẽ hiển thị cho khách hàng khi thanh toán đơn hàng
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bank Info */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Thông tin ngân hàng
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên ngân hàng
                  </label>
                  <input
                    type="text"
                    name="bank_name"
                    value={paymentInfo.bank_name || ''}
                    onChange={handlePaymentChange}
                    className="input"
                    placeholder="VD: Vietcombank, BIDV, Techcombank..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số tài khoản
                  </label>
                  <input
                    type="text"
                    name="bank_account"
                    value={paymentInfo.bank_account || ''}
                    onChange={handlePaymentChange}
                    className="input"
                    placeholder="Nhập số tài khoản"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chủ tài khoản
                  </label>
                  <input
                    type="text"
                    name="account_holder"
                    value={paymentInfo.account_holder || ''}
                    onChange={handlePaymentChange}
                    className="input"
                    placeholder="Tên chủ tài khoản (viết hoa, không dấu)"
                  />
                </div>
              </div>

              {/* QR Code */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  Mã QR thanh toán
                </h3>
                
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                  {paymentInfo.qr_code_url ? (
                    <div className="space-y-4">
                      <img
                        src={`${API_URL}${paymentInfo.qr_code_url}`}
                        alt="QR Code"
                        className="w-48 h-48 mx-auto object-contain border rounded-lg bg-white"
                      />
                      <p className="text-sm text-gray-500">Mã QR thanh toán của bạn</p>
                    </div>
                  ) : (
                    <div className="py-8">
                      <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">Chưa có mã QR</p>
                      <p className="text-sm text-gray-400">
                        Tải lên mã QR từ ứng dụng ngân hàng
                      </p>
                    </div>
                  )}

                  <label className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                    {uploadingQR ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {paymentInfo.qr_code_url ? 'Thay đổi mã QR' : 'Tải lên mã QR'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadQR}
                      className="hidden"
                      disabled={uploadingQR}
                    />
                  </label>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700">
                    💡 <strong>Mẹo:</strong> Mở ứng dụng ngân hàng → Chọn "Nhận tiền" hoặc "QR của tôi" → 
                    Chụp màn hình hoặc lưu ảnh QR → Tải lên ở đây
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-6 pt-6 border-t">
              <button
                onClick={handleSavePayment}
                disabled={savingPayment}
                className="w-full sm:w-auto btn btn-primary px-8 py-3 flex items-center justify-center gap-2"
              >
                {savingPayment ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {savingPayment ? 'Đang lưu...' : 'Lưu thông tin thanh toán'}
              </button>
            </div>
          </div>

          {/* Preview */}
          {(paymentInfo.bank_name || paymentInfo.bank_account) && (
            <div className="card p-6">
              <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                👁️ Xem trước (khách hàng sẽ thấy khi thanh toán)
              </h4>
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {paymentInfo.qr_code_url && (
                    <img
                      src={`${API_URL}${paymentInfo.qr_code_url}`}
                      alt="QR"
                      className="w-32 h-32 object-contain border-2 border-white rounded-lg shadow-md bg-white"
                    />
                  )}
                  <div className="text-center sm:text-left space-y-2">
                    <p className="text-lg font-semibold text-gray-900">
                      {paymentInfo.bank_name || '---'}
                    </p>
                    <p className="text-2xl font-mono font-bold text-primary-600">
                      {paymentInfo.bank_account || '---'}
                    </p>
                    <p className="text-gray-700 font-medium">
                      {paymentInfo.account_holder || '---'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}