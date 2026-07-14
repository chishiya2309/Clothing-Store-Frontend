import { useEffect } from 'react';
import { useToast } from './ui/ToastProvider';

export default function NetworkStatusBridge() {
  const { success, warning } = useToast();

  useEffect(() => {
    const handleOffline = () => {
      warning('Bạn đang offline. Những trang đã mở trước đó vẫn có thể dùng từ cache.', 5000);
    };

    const handleOnline = () => {
      success('Đã kết nối lại internet.', 3000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [success, warning]);

  return null;
}
