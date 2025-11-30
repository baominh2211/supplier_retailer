import React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Building2, Store, ArrowRight, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Select, Card, CardBody, Alert } from '../../components/ui';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  role: z.enum(['SUPPLIER', 'SHOP']),
  companyName: z.string().optional(),
  shopName: z.string().optional(),
  country: z.string().min(2, 'Country is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine((data) => {
  if (data.role === 'SUPPLIER') return !!data.companyName && data.companyName.length >= 2;
  return true;
}, {
  message: 'Company name is required for suppliers',
  path: ['companyName'],
}).refine((data) => {
  if (data.role === 'SHOP') return !!data.shopName && data.shopName.length >= 2;
  return true;
}, {
  message: 'Shop name is required',
  path: ['shopName'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const countries = [
  { value: 'US', label: 'United States' },
  { value: 'CN', label: 'China' },
  { value: 'DE', label: 'Germany' },
  { value: 'JP', label: 'Japan' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'IN', label: 'India' },
  { value: 'VN', label: 'Vietnam' },
  { value: 'TW', label: 'Taiwan' },
  { value: 'KR', label: 'South Korea' },
  { value: 'TH', label: 'Thailand' },
  { value: 'MY', label: 'Malaysia' },
  { value: 'SG', label: 'Singapore' },
];

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'SHOP',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(null);
      await registerUser({
        email: data.email,
        password: data.password,
        role: data.role,
        companyName: data.companyName,
        shopName: data.shopName,
        country: data.country,
      });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary-600">
            <Building2 className="w-8 h-8" />
            <span>B2B Market</span>
          </Link>
          <p className="text-secondary-600 mt-2">Create your account</p>
        </div>

        <Card>
          <CardBody>
            {error && (
              <Alert variant="error" className="mb-6">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Role Selection */}
              <div>
                <label className="label">I am a</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedRole === 'SHOP'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-secondary-200 hover:border-secondary-300'
                    }`}
                  >
                    <input
                      type="radio"
                      {...register('role')}
                      value="SHOP"
                      className="sr-only"
                    />
                    <Store className={`w-6 h-6 ${selectedRole === 'SHOP' ? 'text-primary-600' : 'text-secondary-400'}`} />
                    <div>
                      <p className="font-medium text-secondary-900">Retailer</p>
                      <p className="text-xs text-secondary-500">Buy products</p>
                    </div>
                  </label>
                  <label
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedRole === 'SUPPLIER'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-secondary-200 hover:border-secondary-300'
                    }`}
                  >
                    <input
                      type="radio"
                      {...register('role')}
                      value="SUPPLIER"
                      className="sr-only"
                    />
                    <Building2 className={`w-6 h-6 ${selectedRole === 'SUPPLIER' ? 'text-primary-600' : 'text-secondary-400'}`} />
                    <div>
                      <p className="font-medium text-secondary-900">Supplier</p>
                      <p className="text-xs text-secondary-500">Sell products</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="relative">
                <Input
                  {...register('email')}
                  type="email"
                  label="Email Address"
                  placeholder="you@example.com"
                  error={errors.email?.message}
                  autoComplete="email"
                />
                <Mail className="absolute right-3 top-9 w-5 h-5 text-secondary-400" />
              </div>

              {selectedRole === 'SUPPLIER' && (
                <div className="relative">
                  <Input
                    {...register('companyName')}
                    label="Company Name"
                    placeholder="Your company name"
                    error={errors.companyName?.message}
                  />
                  <Building2 className="absolute right-3 top-9 w-5 h-5 text-secondary-400" />
                </div>
              )}

              {selectedRole === 'SHOP' && (
                <div className="relative">
                  <Input
                    {...register('shopName')}
                    label="Shop Name"
                    placeholder="Your shop name"
                    error={errors.shopName?.message}
                  />
                  <Store className="absolute right-3 top-9 w-5 h-5 text-secondary-400" />
                </div>
              )}

              <div className="relative">
                <Select
                  {...register('country')}
                  label="Country"
                  options={countries}
                  error={errors.country?.message}
                />
                <Globe className="absolute right-3 top-9 w-5 h-5 text-secondary-400 pointer-events-none" />
              </div>

              <div className="relative">
                <Input
                  {...register('password')}
                  type="password"
                  label="Password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  autoComplete="new-password"
                />
                <Lock className="absolute right-3 top-9 w-5 h-5 text-secondary-400" />
              </div>

              <div className="relative">
                <Input
                  {...register('confirmPassword')}
                  type="password"
                  label="Confirm Password"
                  placeholder="••••••••"
                  error={errors.confirmPassword?.message}
                  autoComplete="new-password"
                />
                <Lock className="absolute right-3 top-9 w-5 h-5 text-secondary-400" />
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  required
                  className="mt-1 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <p className="text-sm text-secondary-600">
                  I agree to the{' '}
                  <Link to="/terms" className="link">Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="link">Privacy Policy</Link>
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isSubmitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-secondary-600">
                Already have an account?{' '}
                <Link to="/login" className="link font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
