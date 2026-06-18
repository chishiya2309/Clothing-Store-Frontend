import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Đang xác thực email của bạn...');
  const calledRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Không tìm thấy mã xác thực hợp lệ.');
      return;
    }

    if (calledRef.current) return;
    calledRef.current = true;

    const verifyToken = async () => {
      try {
        await authService.verifyEmail(token);
        setStatus('success');
        setMessage('Xác thực email thành công! Bạn đã có thể đăng nhập vào tài khoản.');
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Xác thực email thất bại. Mã xác thực có thể đã hết hạn hoặc không hợp lệ.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="flex-grow flex items-center justify-center px-4 py-16 md:py-24 bg-surface min-h-[calc(100vh-160px)]">
      <div className="w-full max-w-[440px] bg-surface-container-lowest p-8 md:p-12 rounded border border-subtle text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <h1 className="font-headline-md text-headline-md text-primary">Đang xác thực...</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[32px]">check_circle</span>
            </div>
            <h1 className="font-headline-md text-headline-md text-success">Thành công!</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">{message}</p>
            <Link 
              to="/login"
              className="w-full h-12 bg-primary-container text-on-primary font-label-caps text-label-caps rounded hover:scale-[1.02] hover:shadow-md transition-all duration-200 mt-4 flex items-center justify-center"
            >
              ĐẾN TRANG ĐĂNG NHẬP
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[32px]">error</span>
            </div>
            <h1 className="font-headline-md text-headline-md text-error">Xác thực thất bại</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">{message}</p>
            <Link 
              to="/login"
              className="w-full h-12 bg-surface text-primary font-label-caps text-label-caps rounded border border-primary hover:bg-surface-alt transition-colors mt-4 flex items-center justify-center"
            >
              QUAY LẠI ĐĂNG NHẬP
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
