import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function Header() {
  const { token, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-surface dark:bg-on-background font-label-caps text-label-caps text-primary dark:text-on-primary docked full-width top-0 sticky border-b border-border-subtle dark:border-outline-variant flat no shadows z-50">
      <div className="flex justify-between items-center px-margin-desktop py-4 w-full max-w-container-max mx-auto md:flex hidden relative">
        {/* Navigation Links */}
        <nav className="flex items-center gap-6">
          <Link className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-on-primary transition-colors duration-200" to="#">NAM</Link>
          <Link className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-on-primary transition-colors duration-200" to="#">NỮ</Link>
          <Link className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-on-primary transition-colors duration-200" to="#">TRẺ EM</Link>
          <Link className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-on-primary transition-colors duration-200" to="#">BỘ SƯU TẬP</Link>
          <Link className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-on-primary transition-colors duration-200" to="#">SALE</Link>
        </nav>
        {/* Brand Logo */}
        <Link className="font-display-hero text-headline-md tracking-tighter text-primary dark:text-on-primary absolute left-1/2 transform -translate-x-1/2" to="/">
          CLOTHY
        </Link>
        {/* Trailing Icons */}
        <div className="flex items-center gap-4">
          <button className="hover:text-primary dark:hover:text-on-primary transition-colors duration-200 opacity-80 hover:opacity-100 hover:scale-95 transition-all">
            <span className="material-symbols-outlined" data-icon="search">search</span>
          </button>
          
          {token ? (
            <div className="relative group/user cursor-pointer">
              <button className="flex items-center gap-1 hover:text-primary dark:hover:text-on-primary transition-colors duration-200 opacity-80 hover:opacity-100 hover:scale-95 transition-all">
                <span className="material-symbols-outlined" data-icon="account_circle">account_circle</span>
                <span className="material-symbols-outlined text-[14px]">expand_more</span>
              </button>
              {/* Dropdown Menu (Hidden by default, shown on hover) */}
              <div className="absolute right-0 top-full pt-2 opacity-0 group-hover/user:opacity-100 transition-opacity duration-200 pointer-events-none group-hover/user:pointer-events-auto z-50">
                <div className="bg-surface-container-lowest border border-border-subtle shadow-sm py-2 w-56 rounded-sm overflow-hidden">
                  <Link className="flex items-center gap-3 px-4 py-3 text-[14px] font-body-md text-primary hover:bg-surface-alt transition-colors" to="/account/profile">
                    <span className="material-symbols-outlined text-[20px]">account_circle</span>
                    <span>Thông tin tài khoản</span>
                  </Link>
                  <Link className="flex items-center gap-3 px-4 py-3 text-[14px] font-body-md text-primary hover:bg-surface-alt transition-colors" to="/orders">
                    <span className="material-symbols-outlined text-[20px]">package</span>
                    <span>Đơn hàng của tôi</span>
                  </Link>
                  <Link className="flex items-center gap-3 px-4 py-3 text-[14px] font-body-md text-primary hover:bg-surface-alt transition-colors" to="/wishlist">
                    <span className="material-symbols-outlined text-[20px]">favorite</span>
                    <span>Sản phẩm yêu thích</span>
                  </Link>
                  <div className="border-t border-border-subtle my-1"></div>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-body-md text-on-tertiary-container hover:bg-surface-alt transition-colors">
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link to="/login" className="hover:text-primary dark:hover:text-on-primary transition-colors duration-200 opacity-80 hover:opacity-100 hover:scale-95 transition-all">
              <span className="material-symbols-outlined" data-icon="person">person</span>
            </Link>
          )}

          <button className="hover:text-primary dark:hover:text-on-primary transition-colors duration-200 opacity-80 hover:opacity-100 hover:scale-95 transition-all">
            <span className="material-symbols-outlined" data-icon="favorite">favorite</span>
          </button>
          <button className="hover:text-primary dark:hover:text-on-primary transition-colors duration-200 opacity-80 hover:opacity-100 hover:scale-95 transition-all">
            <span className="material-symbols-outlined" data-icon="shopping_cart">shopping_cart</span>
          </button>
        </div>
      </div>
      {/* Mobile Header */}
      <div className="flex justify-between items-center px-margin-mobile py-4 w-full md:hidden">
        <button className="text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <Link className="font-display-hero text-headline-md tracking-tighter text-primary" to="/">
          CLOTHY
        </Link>
        <button className="text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">shopping_cart</span>
        </button>
      </div>
    </header>
  );
}
