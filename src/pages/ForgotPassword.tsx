import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { forgotPasswordSchema } from '../utils/auth-schemas';
import type { ForgotPasswordFormData } from '../utils/auth-schemas';
import { authService } from '../services/auth.service';

export default function ForgotPassword() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setSuccessMessage(null);
      await authService.forgotPassword(data.email);
      setSuccessMessage('Nếu email bạn nhập có tồn tại trong hệ thống, một đường dẫn đặt lại mật khẩu đã được gửi đến bạn. Vui lòng kiểm tra hộp thư.');
    } catch (error: any) {
      console.error('Forgot password failed', error);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.';
      setError('root', { type: 'server', message: errorMessage });
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center px-4 py-16 md:py-24 bg-surface min-h-[calc(100vh-160px)]">
      <div className="w-full max-w-[440px] bg-surface-container-lowest p-8 md:p-12 rounded border border-subtle">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-headline-xl text-headline-xl text-primary mb-2">Quên mật khẩu</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Nhập email của bạn để nhận liên kết đặt lại mật khẩu
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {errors.root && (
            <div className="p-3 bg-error-container text-on-error-container text-sm font-body-md rounded border border-error bg-opacity-20">
              {errors.root.message}
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-success/10 text-success text-sm font-body-md rounded border border-success">
              <span className="flex items-center gap-2 font-bold mb-1">
                <span className="material-symbols-outlined">check_circle</span> Đã gửi yêu cầu
              </span>
              {successMessage}
            </div>
          )}

          {!successMessage && (
            <>
              <div className="space-y-2">
                <label className="block font-label-caps text-label-caps text-primary" htmlFor="email">
                  Email đã đăng ký
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-primary-container text-on-primary font-label-caps text-label-caps rounded hover:scale-[1.02] hover:shadow-md transition-all duration-200 mt-4 flex items-center justify-center disabled:opacity-70 disabled:hover:scale-100"
              >
                {isSubmitting ? 'ĐANG GỬI...' : 'GỬI YÊU CẦU'}
              </button>
            </>
          )}

          <div className="pt-4 text-center">
            <Link to="/login" className="font-label-caps text-label-caps text-primary underline hover:opacity-80 transition-opacity inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              QUAY LẠI ĐĂNG NHẬP
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
