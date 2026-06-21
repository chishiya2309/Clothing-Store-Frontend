import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="bg-[#FAFAF8] text-text-primary font-body-md min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-[260px] bg-[#1A1A2E] text-white flex-shrink-0 flex flex-col h-screen sticky top-0">
        <div className="h-20 flex items-center px-lg border-b border-[#2A2A4A]">
          <h1 className="font-headline-md text-headline-md text-white font-bold">CLOTHY Admin</h1>
        </div>
        <nav className="flex-1 py-lg px-md flex flex-col gap-sm overflow-y-auto">
          <Link className="flex items-center gap-md px-md py-sm bg-[#2A2A4A] rounded-DEFAULT text-white" to="/admin">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-label-caps text-label-caps">Tổng quan</span>
          </Link>
          <Link className="flex items-center gap-md px-md py-sm text-[#8C8C8C] hover:text-white hover:bg-[#2A2A4A] rounded-DEFAULT transition-colors" to="/admin/products">
            <span className="material-symbols-outlined">inventory_2</span>
            <span className="font-label-caps text-label-caps">Sản phẩm</span>
          </Link>
          <Link className="flex items-center gap-md px-md py-sm text-[#8C8C8C] hover:text-white hover:bg-[#2A2A4A] rounded-DEFAULT transition-colors" to="/admin/orders">
            <span className="material-symbols-outlined">shopping_cart</span>
            <span className="font-label-caps text-label-caps">Đơn hàng</span>
          </Link>
          <Link className="flex items-center gap-md px-md py-sm text-[#8C8C8C] hover:text-white hover:bg-[#2A2A4A] rounded-DEFAULT transition-colors" to="/admin/customers">
            <span className="material-symbols-outlined">group</span>
            <span className="font-label-caps text-label-caps">Khách hàng</span>
          </Link>
          {user?.role === 'admin' && (
            <Link className="flex items-center gap-md px-md py-sm text-[#8C8C8C] hover:text-white hover:bg-[#2A2A4A] rounded-DEFAULT transition-colors" to="/admin/users">
              <span className="material-symbols-outlined">manage_accounts</span>
              <span className="font-label-caps text-label-caps">Quản lý tài khoản</span>
            </Link>
          )}
          <Link className="flex items-center gap-md px-md py-sm text-[#8C8C8C] hover:text-white hover:bg-[#2A2A4A] rounded-DEFAULT transition-colors" to="/admin/coupons">
            <span className="material-symbols-outlined">local_offer</span>
            <span className="font-label-caps text-label-caps">Mã giảm giá</span>
          </Link>
          <Link className="flex items-center gap-md px-md py-sm text-[#8C8C8C] hover:text-white hover:bg-[#2A2A4A] rounded-DEFAULT transition-colors" to="/admin/banners">
            <span className="material-symbols-outlined">view_carousel</span>
            <span className="font-label-caps text-label-caps">Quản lý banner</span>
          </Link>
          <div className="mt-auto pt-lg">
            <Link className="flex items-center gap-md px-md py-sm text-[#8C8C8C] hover:text-white hover:bg-[#2A2A4A] rounded-DEFAULT transition-colors" to="/admin/settings">
              <span className="material-symbols-outlined">settings</span>
              <span className="font-label-caps text-label-caps">Cài đặt</span>
            </Link>
            <Link className="flex items-center gap-md px-md py-sm text-[#8C8C8C] hover:text-white hover:bg-[#2A2A4A] rounded-DEFAULT transition-colors mt-2" to="/">
              <span className="material-symbols-outlined">storefront</span>
              <span className="font-label-caps text-label-caps">Về cửa hàng</span>
            </Link>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-md px-md py-sm text-[#8C8C8C] hover:text-white hover:bg-[#2A2A4A] rounded-DEFAULT transition-colors mt-2"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="font-label-caps text-label-caps">Đăng xuất</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 bg-surface flex items-center justify-between px-xl border-b border-border-subtle sticky top-0 z-10">
          <h2 className="font-headline-lg text-headline-lg text-text-primary">Admin Panel</h2>
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
                <p className="font-body-sm text-body-sm text-text-muted">{user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-xl overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
