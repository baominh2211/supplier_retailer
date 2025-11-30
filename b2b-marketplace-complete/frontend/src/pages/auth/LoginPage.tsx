import React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, ArrowRight, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Card, CardBody, Alert } from '../../components/ui';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      await login(data.email, data.password);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary-600">
            <Building2 className="w-8 h-8" />
            <span>B2B Market</span>
          </Link>
          <p className="text-secondary-600 mt-2">Sign in to your account</p>
        </div>

        <Card>
          <CardBody>
            {error && (
              <Alert variant="error" className="mb-6">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

              <div className="relative">
                <Input
                  {...register('password')}
                  type="password"
                  label="Password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  autoComplete="current-password"
                />
                <Lock className="absolute right-3 top-9 w-5 h-5 text-secondary-400" />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-secondary-600">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm link">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isSubmitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-secondary-600">
                Don't have an account?{' '}
                <Link to="/register" className="link font-medium">
                  Sign up
                </Link>
              </p>
            </div>

            {/* Demo credentials */}
            <div className="mt-6 pt-6 border-t border-secondary-200">
              <p className="text-xs text-secondary-500 text-center mb-3">
                Demo Accounts (for testing)
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-secondary-50 rounded-lg p-2 text-center">
                  <p className="font-medium text-secondary-700">Admin</p>
                  <p className="text-secondary-500 truncate">admin@b2bmarket.com</p>
                </div>
                <div className="bg-secondary-50 rounded-lg p-2 text-center">
                  <p className="font-medium text-secondary-700">Supplier</p>
                  <p className="text-secondary-500 truncate">supplier@techcorp.com</p>
                </div>
                <div className="bg-secondary-50 rounded-lg p-2 text-center">
                  <p className="font-medium text-secondary-700">Shop</p>
                  <p className="text-secondary-500 truncate">buyer@retailplus.com</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
