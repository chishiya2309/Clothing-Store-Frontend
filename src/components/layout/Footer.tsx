import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-primary-container dark:bg-black font-body-sm text-body-sm text-on-primary-container dark:text-surface-container-highest full-width grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-mobile md:px-margin-desktop py-xl w-full">
      {/* Brand Logo */}
      <div className="col-span-1 flex flex-col gap-4">
        <div className="font-display-hero text-headline-lg text-on-primary dark:text-surface-container-lowest tracking-tighter">
          CLOTHY
        </div>
        <p className="text-on-primary-container max-w-xs mt-2">
          Định hình phong cách hiện đại với những thiết kế tối giản, chất lượng cao dành cho giới trẻ Việt Nam.
        </p>
      </div>
      {/* Links */}
      <div className="col-span-1 flex flex-col gap-3 mt-6 md:mt-0">
        <h4 className="font-headline-md text-headline-md text-on-primary dark:text-white mb-2">Về chúng tôi</h4>
        <Link className="text-on-primary-container dark:text-surface-variant hover:text-on-primary dark:hover:text-white transition-colors" to="#">Về CLOTHY</Link>
        <Link className="text-on-primary-container dark:text-surface-variant hover:text-on-primary dark:hover:text-white transition-colors" to="#">Tuyển dụng</Link>
        <Link className="text-on-primary-container dark:text-surface-variant hover:text-on-primary dark:hover:text-white transition-colors" to="#">Cửa hàng</Link>
      </div>
      <div className="col-span-1 flex flex-col gap-3 mt-6 md:mt-0">
        <h4 className="font-headline-md text-headline-md text-on-primary dark:text-white mb-2">Hỗ trợ</h4>
        <Link className="text-on-primary-container dark:text-surface-variant hover:text-on-primary dark:hover:text-white transition-colors" to="#">Hướng dẫn mua hàng</Link>
        <Link className="text-on-primary-container dark:text-surface-variant hover:text-on-primary dark:hover:text-white transition-colors" to="#">Theo dõi đơn hàng</Link>
        <Link className="text-on-primary-container dark:text-surface-variant hover:text-on-primary dark:hover:text-white transition-colors" to="#">Liên hệ</Link>
      </div>
      <div className="col-span-1 flex flex-col gap-3 mt-6 md:mt-0">
        <h4 className="font-headline-md text-headline-md text-on-primary dark:text-white mb-2">Chính sách</h4>
        <Link className="text-on-primary-container dark:text-surface-variant hover:text-on-primary dark:hover:text-white transition-colors" to="#">Chính sách bảo mật</Link>
        <Link className="text-on-primary-container dark:text-surface-variant hover:text-on-primary dark:hover:text-white transition-colors" to="#">Điều khoản dịch vụ</Link>
        <Link className="text-on-primary-container dark:text-surface-variant hover:text-on-primary dark:hover:text-white transition-colors" to="#">Chính sách đổi trả</Link>
        <h4 className="font-headline-md text-headline-md text-on-primary dark:text-white mb-2 mt-4">Mạng xã hội</h4>
        <div className="flex gap-4">
          <Link className="text-on-primary-container hover:text-on-primary transition-colors" to="#">
            <span className="material-symbols-outlined">share</span>
          </Link>
          <Link className="text-on-primary-container hover:text-on-primary transition-colors" to="#">
            <span className="material-symbols-outlined">photo_camera</span>
          </Link>
        </div>
      </div>
      {/* Copyright */}
      <div className="col-span-1 md:col-span-4 mt-12 pt-6 border-t border-on-primary-fixed-variant text-center md:text-left">
        <span>© 2026 CLOTHY. All rights reserved.</span>
      </div>
    </footer>
  );
}
