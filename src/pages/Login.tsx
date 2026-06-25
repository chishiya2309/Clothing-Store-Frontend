import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { loginSchema } from '../utils/auth-schemas';
import type { LoginFormData } from '../utils/auth-schemas';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('session') === 'expired';
  const { setAuth } = useAuthStore();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await authService.login(data);
      if (response && response.data && response.data.accessToken) {
        setAuth(response.data.accessToken, response.data.refreshToken, {
          id: response.data.id,
          name: response.data.name,
          role: response.data.role
        });
        
        // Synchronize guest cart items with DB
        try {
          await useCartStore.getState().syncCartAfterLogin();
        } catch (syncErr) {
          console.error('Failed to sync cart on login:', syncErr);
        }

        const redirectPath = searchParams.get('redirect');
        const role = response.data.role?.toLowerCase();
        if (role === 'admin') {
          navigate('/admin');
        } else if (role === 'staff') {
          navigate('/staff');
        } else if (redirectPath) {
          navigate(`/${redirectPath}`);
        } else {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    } catch (error: any) {
      console.error('Login failed', error);
      const errorMessage = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.';
      setError('root', { type: 'server', message: errorMessage });
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

        {/* Session expired banner */}
        {sessionExpired && (
          <div className="mb-6 p-4 bg-warning/10 border border-warning rounded-lg flex items-center gap-3">
            <span className="material-symbols-outlined text-warning text-xl">schedule</span>
            <p className="font-body-md text-body-md text-primary">
              Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.
            </p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {errors.root && (
            <div className="p-3 bg-error-container text-on-error-container text-sm font-body-md rounded border border-error bg-opacity-20">
              {errors.root.message}
            </div>
          )}
          
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
            <Link to="/forgot-password" className="font-body-sm text-body-sm text-primary underline hover:opacity-80 transition-opacity">
              Quên mật khẩu?
            </Link>
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
                  const response = await authService.googleLogin(credentialResponse.credential);
                  if (response && response.data && response.data.accessToken) {
                    setAuth(response.data.accessToken, response.data.refreshToken, {
                      id: response.data.id,
                      name: response.data.name,
                      role: response.data.role
                    });

                    // Synchronize guest cart items with DB
                    try {
                      await useCartStore.getState().syncCartAfterLogin();
                    } catch (syncErr) {
                      console.error('Failed to sync cart on Google login:', syncErr);
                    }

                    const redirectPath = searchParams.get('redirect');
                    const role = response.data.role?.toLowerCase();
                    if (role === 'admin') {
                      navigate('/admin');
                    } else if (role === 'staff') {
                      navigate('/staff');
                    } else if (redirectPath) {
                      navigate(`/${redirectPath}`);
                    } else {
                      navigate('/');
                    }
                  } else {
                    const redirectPath = searchParams.get('redirect');
                    if (redirectPath) {
                      navigate(`/${redirectPath}`);
                    } else {
                      navigate('/');
                    }
                  }
                } catch (error: any) {
                  console.error('Google login failed', error);
                  const errorMessage = error.response?.data?.message || 'Đăng nhập Google thất bại.';
                  setError('root', { type: 'server', message: errorMessage });
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
