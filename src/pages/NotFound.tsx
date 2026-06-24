import { Link } from 'react-router-dom';
import { Home, ShoppingBag, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="text-center z-10 max-w-lg mx-auto">
        {/* Animated icon or number */}
        <div className="relative mb-8 flex justify-center items-center">
          <h1 className="text-9xl font-headline-lg text-on-surface/10 font-bold tracking-tighter select-none">404</h1>
          <div className="absolute flex space-x-4 text-primary animate-bounce">
            <ShoppingBag size={48} strokeWidth={1.5} />
          </div>
        </div>

        <h2 className="text-3xl font-headline-md text-on-surface mb-4">
          Oops! Không tìm thấy trang
        </h2>
        <p className="text-body-md text-surface-alt mb-8 px-4">
          Có vẻ như trang bạn đang cố truy cập không tồn tại, đã bị xóa hoặc tạm thời không thể truy cập. Hãy quay lại trang chủ để tiếp tục mua sắm nhé.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-6 py-3 rounded-full border border-outline text-on-surface hover:bg-surface-container transition-colors font-label-md"
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>
          
          <Link 
            to="/" 
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary hover:bg-primary-dark transition-colors font-label-md shadow-sm"
          >
            <Home size={18} />
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
