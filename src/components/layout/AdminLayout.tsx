import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const role = user?.role?.toLowerCase();
  const isStaffArea = location.pathname.startsWith('/staff');
  const basePath = isStaffArea ? '/staff' : '/admin';
  const panelTitle = isStaffArea ? 'Staff Panel' : 'Admin Panel';

  const isActive = (path: string) => {
    if (path === basePath) {
      return location.pathname === basePath;
    }
    return location.pathname.startsWith(path);
  };

  const adminNavItems = [
    { path: '/admin', label: 'Báo cáo tổng quan', icon: 'dashboard' },
    { path: '/admin/users', label: 'Quản lý tài khoản', icon: 'manage_accounts' },
  ];

  const staffNavItems = [
    { path: '/staff/products', label: 'Sản phẩm & danh mục', icon: 'inventory_2' },
    { path: '/staff/collections', label: 'Bộ sưu tập', icon: 'collections_bookmark' },
    { path: '/staff/inventory', label: 'Báo cáo tồn kho', icon: 'warehouse' },
    { path: '/staff/orders', label: 'Đơn hàng', icon: 'shopping_cart' },
    { path: '/staff/reviews', label: 'Đánh giá', icon: 'reviews' },
    { path: '/staff/coupons', label: 'Mã giảm giá', icon: 'local_offer' },
    { path: '/staff/banners', label: 'Banner', icon: 'view_carousel' },
  ];

  const navItems = isStaffArea ? staffNavItems : adminNavItems;

  return (
    <div className="bg-[#FAFAF8] text-text-primary font-body-md h-screen w-full flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[260px] bg-[#111122] text-white flex-shrink-0 flex flex-col h-full border-r border-[#1D1D35] shadow-2xl">
        {/* Brand Header */}
        <div className="h-20 flex items-center px-lg border-b border-[#1D1D35] bg-[#0E0E1B] relative overflow-hidden group">
          {/* Subtle background glow */}
          <div className="absolute -inset-10 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <h1 className="font-headline-md text-headline-md text-white font-bold tracking-wider relative flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400 animate-pulse">style</span>
            CLOTHY 
          </h1>
        </div>

        {/* Scrollable Navigation */}
        <nav className="flex-1 py-lg px-md flex flex-col gap-xs overflow-y-auto hide-scrollbar select-none">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                className={`flex items-center gap-md px-md py-sm rounded-DEFAULT transition-all duration-300 relative group overflow-hidden ${
                  active
                    ? 'bg-gradient-to-r from-[#1D1D3D] to-[#16162B] text-white font-semibold'
                    : 'text-[#8C8C8C] hover:text-white hover:bg-[#1C1C33]/50'
                }`}
                to={item.path}
              >
                {/* Active/Hover Indicator bar on the left */}
                <div
                  className={`absolute left-0 w-1 bg-amber-400 rounded-r transition-all duration-300 origin-center ${
                    active
                      ? 'h-3/5 scale-y-100 opacity-100'
                      : 'h-3/5 scale-y-0 opacity-0 group-hover:scale-y-75 group-hover:opacity-70'
                  }`}
                />

                {/* Material Icon with micro-animation */}
                <span
                  className={`material-symbols-outlined text-[22px] transition-all duration-300 ${
                    active
                      ? 'text-amber-400 scale-105 filter drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]'
                      : 'group-hover:text-white group-hover:scale-110 group-hover:translate-x-0.5'
                  }`}
                >
                  {item.icon}
                </span>

                {/* Link label with slide translation */}
                <span
                  className={`font-label-caps text-[13px] tracking-wide transition-transform duration-300 ${
                    active
                      ? 'translate-x-0'
                      : 'group-hover:translate-x-1'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Bottom Utility Items */}
          <div className="mt-auto pt-lg border-t border-[#1D1D35] flex flex-col gap-xs">
            <Link
              className={`flex items-center gap-md px-md py-sm rounded-DEFAULT transition-all duration-300 relative group overflow-hidden ${
                isActive(`${basePath}/settings`)
                  ? 'bg-gradient-to-r from-[#1D1D3D] to-[#16162B] text-white font-semibold'
                  : 'text-[#8C8C8C] hover:text-white hover:bg-[#1C1C33]/50'
              }`}
              to={`${basePath}/settings`}
            >
              <div
                className={`absolute left-0 w-1 bg-amber-400 rounded-r transition-all duration-300 origin-center ${
                  isActive(`${basePath}/settings`)
                    ? 'h-3/5 scale-y-100 opacity-100'
                    : 'h-3/5 scale-y-0 opacity-0 group-hover:scale-y-75 group-hover:opacity-70'
                }`}
              />
              <span
                className={`material-symbols-outlined text-[22px] transition-all duration-300 ${
                  isActive(`${basePath}/settings`)
                    ? 'text-amber-400 scale-105'
                    : 'group-hover:text-white group-hover:scale-110 group-hover:translate-x-0.5'
                }`}
              >
                settings
              </span>
              <span
                className={`font-label-caps text-[13px] tracking-wide transition-transform duration-300 ${
                  isActive('/admin/settings') ? 'translate-x-0' : 'group-hover:translate-x-1'
                }`}
              >
                Cài đặt
              </span>
            </Link>

            <Link
              className="flex items-center gap-md px-md py-sm text-[#8C8C8C] hover:text-white hover:bg-[#1C1C33]/50 rounded-DEFAULT transition-all duration-300 relative group overflow-hidden mt-1"
              to="/"
            >
              <div className="absolute left-0 w-1 bg-teal-400 rounded-r transition-all duration-300 origin-center h-3/5 scale-y-0 opacity-0 group-hover:scale-y-75 group-hover:opacity-70" />
              <span className="material-symbols-outlined text-[22px] transition-all duration-300 group-hover:text-white group-hover:scale-110 group-hover:translate-x-0.5">
                storefront
              </span>
              <span className="font-label-caps text-[13px] tracking-wide transition-transform duration-300 group-hover:translate-x-1">
                Về cửa hàng
              </span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-md px-md py-sm text-[#8C8C8C] hover:text-[#FF4D4D] hover:bg-[#FF4D4D]/10 rounded-DEFAULT transition-all duration-300 relative group overflow-hidden mt-1 text-left"
            >
              <div className="absolute left-0 w-1 bg-[#FF4D4D] rounded-r transition-all duration-300 origin-center h-3/5 scale-y-0 opacity-0 group-hover:scale-y-75 group-hover:opacity-70" />
              <span className="material-symbols-outlined text-[22px] transition-all duration-300 group-hover:scale-110 group-hover:translate-x-0.5">
                logout
              </span>
              <span className="font-label-caps text-[13px] tracking-wide transition-transform duration-300 group-hover:translate-x-1">
                Đăng xuất
              </span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-surface flex items-center justify-between px-xl border-b border-border-subtle sticky top-0 z-10">
          <h2 className="font-headline-lg text-headline-lg text-text-primary">{panelTitle}</h2>
          <div className="flex items-center gap-lg">
            <button className="text-text-muted hover:text-text-primary transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="flex items-center gap-md pl-lg border-l border-border-subtle">
              <img
                className="w-10 h-10 rounded-full object-cover"
                alt="Avatar"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDTgQB2JVcd1ZDp5WIUVVPyR77KD--xbc_AiyFY55723-d__boC0S40cP6btGntk6yeRcFhFEQO3WnqodYz38uqmAZDCgp6d0hcmVx-E7srEW_pWi83vvchEiMzgNTwxe6Ahdefeoy56GRLIrkzp-skSzBc_7CyVYcBJ_iIcBEqRakMPLBePRmHC4nHWQ8fDsxGf4irtFnzqWjV8GQ7YIxv4OF3XUr_e6RqSihQQvVghNSMirH_gyPvbCamfUraiHhTKl7hLi5jlw"
              />
              <div className="hidden md:block">
                <p className="font-label-caps text-label-caps text-text-primary">{user?.name || 'Admin'}</p>
                <p className="font-body-sm text-body-sm text-text-muted">{role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-xl overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
