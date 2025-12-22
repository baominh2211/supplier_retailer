import { useState, useEffect } from 'react';
import { suppliersApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { 
  User, Building2, Mail, Phone, MapPin, Globe, FileText, 
  Save, Camera, Shield, Award, Star
} from 'lucide-react';

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

export default function SupplierProfile() {
  const { user, fetchUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  
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

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await suppliersApi.getMe();
      setProfile(res.data);
      setFormData({
        full_name: user?.full_name || '',
        email: user?.email || '',
        phone: res.data.phone || user?.phone || '',
        company_name: res.data.company_name || '',
        description: res.data.description || '',
        address: res.data.address || '',
        website: res.data.website || '',
        tax_code: res.data.tax_code || '',
        business_license: res.data.business_license || '',
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
      fetchUser(); // Refresh user data
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
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

      {/* Form */}
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
    </div>
  );
}
