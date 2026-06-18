import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPasswordSchema } from '../utils/auth-schemas';
import type { ResetPasswordFormData } from '../utils/auth-schemas';
import { authService } from '../services/auth.service';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (!token) {
      setError('root', { type: 'server', message: 'Mã xác thực không hợp lệ hoặc đã thiếu.' });
    }
  }, [token, setError]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;

    try {
      setSuccessMessage(null);
      await authService.resetPassword({
        token,
        newPassword: data.password,
        confirmPassword: data.confirm_password,
      });
      setSuccessMessage('Mật khẩu được cập nhật thành công. Tất cả phiên đăng nhập cũ đã bị thu hồi.');
    } catch (error: any) {
      console.error('Reset password failed', error);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra hoặc link đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.';
      setError('root', { type: 'server', message: errorMessage });
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center px-4 py-16 md:py-24 bg-surface min-h-[calc(100vh-160px)]">
      <div className="w-full max-w-[440px] bg-surface-container-lowest p-8 md:p-12 rounded border border-subtle">
        <div className="text-center mb-10">
          <h1 className="font-headline-xl text-headline-xl text-primary mb-2">Đặt lại mật khẩu</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Nhập mật khẩu mới cho tài khoản của bạn
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {errors.root && (
            <div className="p-3 bg-error-container text-on-error-container text-sm font-body-md rounded border border-error bg-opacity-20">
              {errors.root.message}
            </div>
          )}

          {successMessage ? (
            <div className="text-center">
              <div className="p-4 bg-success/10 text-success text-sm font-body-md rounded border border-success mb-6">
                <span className="flex items-center justify-center gap-2 font-bold mb-1 text-[16px]">
                  <span className="material-symbols-outlined">check_circle</span> Thành công!
                </span>
                {successMessage}
              </div>
              <Link
                to="/login"
                className="w-full h-12 bg-primary-container text-on-primary font-label-caps text-label-caps rounded hover:scale-[1.02] hover:shadow-md transition-all duration-200 flex items-center justify-center"
              >
                QUAY LẠI ĐĂNG NHẬP
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="block font-label-caps text-label-caps text-primary" htmlFor="password">
                  Mật khẩu mới
                </label>
                <input
                  className={`w-full px-4 py-3 bg-transparent border ${
                    errors.password ? 'border-error focus:ring-error' : 'border-subtle focus:border-primary-container focus:ring-primary-container'
                  } rounded text-text-primary font-body-md placeholder-text-muted focus:ring-1 outline-none transition-colors`}
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  disabled={!token}
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-error font-body-sm text-sm">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block font-label-caps text-label-caps text-primary" htmlFor="confirm_password">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  className={`w-full px-4 py-3 bg-transparent border ${
                    errors.confirm_password ? 'border-error focus:ring-error' : 'border-subtle focus:border-primary-container focus:ring-primary-container'
                  } rounded text-text-primary font-body-md placeholder-text-muted focus:ring-1 outline-none transition-colors`}
                  id="confirm_password"
                  type="password"
                  placeholder="••••••••"
                  disabled={!token}
                  {...register('confirm_password')}
                />
                {errors.confirm_password && (
                  <p className="text-error font-body-sm text-sm">{errors.confirm_password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !token}
                className="w-full h-12 bg-primary-container text-on-primary font-label-caps text-label-caps rounded hover:scale-[1.02] hover:shadow-md transition-all duration-200 mt-4 flex items-center justify-center disabled:opacity-70 disabled:hover:scale-100"
              >
                {isSubmitting ? 'ĐANG LƯU...' : 'ĐẶT LẠI MẬT KHẨU'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
