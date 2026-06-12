import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { loginSchema } from '../utils/auth-schemas';
import type { LoginFormData } from '../utils/auth-schemas';
import { authService } from '../services/auth.service';

export default function Login() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await authService.login(data);
      // Handle successful login (e.g., save token, update store)
      navigate('/');
    } catch (error) {
      console.error('Login failed', error);
      // Handle error display
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center px-4 py-16 md:py-24 bg-surface min-h-[calc(100vh-160px)]">
      <div className="w-full max-w-[440px] bg-surface-container-lowest p-8 md:p-12 rounded border border-subtle">
        {/* Header section */}
        <div className="text-center mb-10">
          <h1 className="font-headline-xl text-headline-xl text-primary mb-2">Đăng nhập</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Chào mừng bạn quay lại với CLOTHY</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="block font-label-caps text-label-caps text-primary" htmlFor="email">
              Email
            </label>
            <input
              className={`w-full px-4 py-3 bg-transparent border ${
                errors.email ? 'border-error focus:ring-error' : 'border-subtle focus:border-primary-container focus:ring-primary-container'
              } rounded text-text-primary font-body-md placeholder-text-muted focus:ring-1 outline-none transition-colors`}
              id="email"
              type="email"
              placeholder="nhap@email.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-error font-body-sm text-sm">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block font-label-caps text-label-caps text-primary" htmlFor="password">
              Mật khẩu
            </label>
            <input
              className={`w-full px-4 py-3 bg-transparent border ${
                errors.password ? 'border-error focus:ring-error' : 'border-subtle focus:border-primary-container focus:ring-primary-container'
              } rounded text-text-primary font-body-md placeholder-text-muted focus:ring-1 outline-none transition-colors`}
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-error font-body-sm text-sm">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                className="w-4 h-4 rounded-sm border-subtle text-primary-container focus:ring-primary-container bg-transparent"
                type="checkbox"
                {...register('remember')}
              />
              <span className="font-body-sm text-body-sm text-on-surface-variant group-hover:text-primary transition-colors">
                Ghi nhớ đăng nhập
              </span>
            </label>
            <a href="#" className="font-body-sm text-body-sm text-primary underline hover:opacity-80 transition-opacity">
              Quên mật khẩu?
            </a>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-primary-container text-on-primary font-label-caps text-label-caps rounded hover:scale-[1.02] hover:shadow-md transition-all duration-200 mt-4 flex items-center justify-center disabled:opacity-70 disabled:hover:scale-100"
          >
            {isSubmitting ? 'ĐANG ĐĂNG NHẬP...' : 'ĐĂNG NHẬP'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-subtle"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-surface-container-lowest font-body-sm text-body-sm text-text-muted">Hoặc</span>
          </div>
        </div>

        {/* Social Login */}
        <div className="flex justify-center w-full">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              if (credentialResponse.credential) {
                try {
                  await authService.googleLogin(credentialResponse.credential);
                  navigate('/');
                } catch (error) {
                  console.error('Google login failed', error);
                }
              }
            }}
            onError={() => {
              console.error('Google login error');
            }}
            shape="rectangular"
            size="large"
            theme="outline"
            text="signin_with"
            width="100%"
          />
        </div>

        {/* Footer Link */}
        <p className="mt-8 text-center font-body-sm text-body-sm text-on-surface-variant">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-primary font-bold underline hover:opacity-80 transition-opacity">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
