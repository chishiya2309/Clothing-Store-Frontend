import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { registerSchema } from '../utils/auth-schemas';
import type { RegisterFormData } from '../utils/auth-schemas';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

export default function Register() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [isSuccess, setIsSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await authService.register(data);
      setIsSuccess(true);
    } catch (error: any) {
      console.error('Registration failed', error);
      const errorMessage = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.';
      setError('root', { type: 'server', message: errorMessage });
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await authService.googleLogin(tokenResponse.access_token);
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
            console.error('Failed to sync cart on Google registration:', syncErr);
          }

          const role = response.data.role?.toLowerCase();
          if (role === 'admin' || role === 'staff') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        } else {
          navigate('/');
        }
      } catch (error: any) {
        console.error('Google registration failed', error);
        const errorMessage = error.response?.data?.message || 'Đăng ký bằng Google thất bại.';
        setError('root', { type: 'server', message: errorMessage });
      }
    },
    onError: (errorResponse) => {
      console.error('Google registration error', errorResponse);
    },
  });

  if (isSuccess) {
    return (
      <div className="flex-grow flex items-center justify-center p-6 md:p-20 bg-[#FAFAF8] min-h-[calc(100vh-160px)]">
        <div className="w-full max-w-md bg-surface-container-lowest shadow-sm border border-subtle rounded-lg p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-primary opacity-10 rounded-full pointer-events-none"></div>
          <span className="material-symbols-outlined text-[64px] text-primary mb-6">mark_email_read</span>
          <h1 className="font-headline-lg text-headline-lg text-primary mb-4">
            Đăng ký thành công!
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mb-8 leading-relaxed">
            Vui lòng kiểm tra email của bạn để kích hoạt tài khoản trước khi có thể đăng nhập.
          </p>
          <Link to="/login" className="inline-block w-full bg-primary-container text-on-primary rounded-lg py-3 px-6 font-label-caps text-label-caps tracking-widest hover:bg-primary transition-all duration-200 hover:shadow-sm transform hover:scale-[1.02]">
            ĐI ĐẾN ĐĂNG NHẬP
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex items-center justify-center p-6 md:p-20 bg-[#FAFAF8] min-h-[calc(100vh-160px)]">
      <div className="w-full max-w-md bg-surface-container-lowest shadow-sm border border-subtle rounded-lg p-12 relative overflow-hidden">
        {/* Decorative minimal background element */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-surface-alt rounded-full opacity-50 pointer-events-none"></div>

        <div className="text-center mb-12 relative z-10">
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-1">
            Đăng ký tài khoản
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Trở thành thành viên để nhận ưu đãi mới nhất</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
          {errors.root && (
            <div className="p-3 bg-error-container text-on-error-container text-sm font-body-md rounded border border-error bg-opacity-20">
              {errors.root.message}
            </div>
          )}
          
          {/* Full Name */}
          <div>
            <label className="sr-only" htmlFor="fullname">Họ và tên</label>
            <input
              className={`w-full border ${
                errors.fullname ? 'border-error focus:ring-error' : 'border-subtle focus:border-primary focus:ring-primary'
              } rounded px-6 py-3 font-body-md text-body-md text-on-surface placeholder:text-text-muted focus:outline-none focus:ring-1 transition-colors bg-surface-bright`}
              id="fullname"
              type="text"
              placeholder="Họ và tên"
              {...register('fullname')}
            />
            {errors.fullname && (
              <p className="text-error font-body-sm text-sm mt-1">{errors.fullname.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="sr-only" htmlFor="email">Email</label>
            <input
              className={`w-full border ${
                errors.email ? 'border-error focus:ring-error' : 'border-subtle focus:border-primary focus:ring-primary'
              } rounded px-6 py-3 font-body-md text-body-md text-on-surface placeholder:text-text-muted focus:outline-none focus:ring-1 transition-colors bg-surface-bright`}
              id="email"
              type="email"
              placeholder="Email"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-error font-body-sm text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="sr-only" htmlFor="password">Mật khẩu</label>
            <input
              className={`w-full border ${
                errors.password ? 'border-error focus:ring-error' : 'border-subtle focus:border-primary focus:ring-primary'
              } rounded px-6 py-3 font-body-md text-body-md text-on-surface placeholder:text-text-muted focus:outline-none focus:ring-1 transition-colors bg-surface-bright`}
              id="password"
              type="password"
              placeholder="Mật khẩu"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-error font-body-sm text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="sr-only" htmlFor="confirm_password">Xác nhận mật khẩu</label>
            <input
              className={`w-full border ${
                errors.confirm_password ? 'border-error focus:ring-error' : 'border-subtle focus:border-primary focus:ring-primary'
              } rounded px-6 py-3 font-body-md text-body-md text-on-surface placeholder:text-text-muted focus:outline-none focus:ring-1 transition-colors bg-surface-bright`}
              id="confirm_password"
              type="password"
              placeholder="Xác nhận mật khẩu"
              {...register('confirm_password')}
            />
            {errors.confirm_password && (
              <p className="text-error font-body-sm text-sm mt-1">{errors.confirm_password.message}</p>
            )}
          </div>

          {/* Terms */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                className="w-4 h-4 rounded border-subtle text-primary-container focus:ring-primary bg-surface-bright"
                id="terms"
                type="checkbox"
                {...register('terms')}
              />
            </div>
            <div className="ml-3 text-sm">
              <label className="font-body-sm text-body-sm text-on-surface-variant" htmlFor="terms">
                Tôi đồng ý với{' '}
                <a href="#" className="text-primary underline hover:opacity-80 transition-opacity">
                  Điều khoản
                </a>{' '}
                &amp;{' '}
                <a href="#" className="text-primary underline hover:opacity-80 transition-opacity">
                  Chính sách bảo mật
                </a>
              </label>
              {errors.terms && (
                <p className="text-error font-body-sm text-sm mt-1">{errors.terms.message}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary-container text-on-primary rounded-lg py-3 px-6 font-label-caps text-label-caps tracking-widest hover:bg-primary transition-all duration-200 hover:shadow-sm transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            {isSubmitting ? 'ĐANG ĐĂNG KÝ...' : 'ĐĂNG KÝ'}
          </button>
        </form>

        {/* Separator */}
        <div className="mt-12 mb-6 relative z-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-subtle"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-surface-container-lowest font-body-sm text-body-sm text-text-muted">Hoặc</span>
          </div>
        </div>

        {/* Google Sign up */}
        <button
          type="button"
          onClick={() => googleLogin()}
          className="relative z-10 w-full flex items-center justify-center gap-3 bg-transparent border-[1.5px] border-primary-container text-primary-container rounded-lg py-3 px-6 font-label-caps text-label-caps tracking-widest hover:bg-surface-alt transition-colors duration-200"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
          </svg>
          Đăng ký với Google
        </button>

        {/* Login Link */}
        <p className="mt-12 text-center font-body-sm text-body-sm text-on-surface-variant relative z-10">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-primary font-bold hover:underline transition-all">
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
