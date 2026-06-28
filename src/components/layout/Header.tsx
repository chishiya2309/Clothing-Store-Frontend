import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import SearchModal from '../SearchModal';
import CategoryMenuItem from './CategoryMenuItem';
import { useCategoryStore } from '../../store/categoryStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { collectionService } from '../../services/collection.service';
import type { CollectionResponse } from '../../services/collection.service';

export default function Header() {
  const { token, user, logout } = useAuthStore();
  const { items, fetchCart } = useCartStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { wishlistProductIds } = useWishlistStore();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [collections, setCollections] = useState<CollectionResponse[]>([]);

  useEffect(() => {
    fetchCategories();
    collectionService.getActiveCollections().then(setCollections).catch(console.error);
  }, [fetchCategories]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const cartItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
    <header className="bg-surface dark:bg-on-background font-label-caps text-label-caps text-primary dark:text-on-primary docked full-width top-0 sticky border-b border-border-subtle dark:border-outline-variant flat no shadows z-50">
      <div className="flex justify-between items-center px-margin-desktop py-4 w-full max-w-container-max mx-auto md:flex hidden relative">
        {/* Navigation Links */}
        <nav className="flex items-center gap-6">
          <div className="relative group/collection">
            <button className="flex items-center gap-1 font-semibold hover:text-primary transition-colors py-2 opacity-80 hover:opacity-100 uppercase text-xs tracking-wider">
              BỘ SƯU TẬP
              <span className="material-symbols-outlined text-[16px] group-hover/collection:rotate-180 transition-transform duration-200">expand_more</span>
            </button>
            <div className="absolute left-0 top-full pt-2 opacity-0 group-hover/collection:opacity-100 transition-opacity duration-200 pointer-events-none group-hover/collection:pointer-events-auto z-50">
              <div className="bg-surface-container-lowest border border-border-subtle shadow-sm py-2 w-48 rounded-sm overflow-hidden">
                {collections.map(col => (
                  <Link key={col.id} to={`/collections/${col.slug}`} className="block px-4 py-2 hover:bg-surface-alt transition-colors font-body-md text-[14px]">
                    {col.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {categories.map((category) => (
            <CategoryMenuItem key={category.id} category={category} isRoot={true} />
          ))}
        </nav>
        {/* Brand Logo */}
        <Link className="font-display-hero text-headline-md tracking-tighter text-primary dark:text-on-primary absolute left-1/2 transform -translate-x-1/2" to="/">
          CLOTHY
        </Link>
        {/* Trailing Icons */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="hover:text-primary dark:hover:text-on-primary transition-colors duration-200 opacity-80 hover:opacity-100 hover:scale-95 transition-all"
          >
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
                  {user && (user.role?.toLowerCase() === 'admin' || user.role?.toLowerCase() === 'staff') && (
                    <>
                      <Link className="flex items-center gap-3 px-4 py-3 text-[14px] font-body-md text-amber-600 bg-amber-50 hover:bg-amber-100 font-semibold transition-colors" to="/admin">
                        <span className="material-symbols-outlined text-[20px] text-amber-600">admin_panel_settings</span>
                        <span>Trang quản trị</span>
                      </Link>
                      <div className="border-t border-border-subtle my-1"></div>
                    </>
                  )}
                  <Link className="flex items-center gap-3 px-4 py-3 text-[14px] font-body-md text-primary hover:bg-surface-alt transition-colors" to="/account/profile">
                    <span className="material-symbols-outlined text-[20px]">account_circle</span>
                    <span>Thông tin tài khoản</span>
                  </Link>
                  <Link className="flex items-center gap-3 px-4 py-3 text-[14px] font-body-md text-primary hover:bg-surface-alt transition-colors" to="/account/orders">
                    <span className="material-symbols-outlined text-[20px]">package</span>
                    <span>Đơn hàng của tôi</span>
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

          <Link to="/account/favorites" className="hover:text-primary dark:hover:text-on-primary transition-colors duration-200 opacity-80 hover:opacity-100 hover:scale-95 transition-all relative">
            <span className="material-symbols-outlined" data-icon="favorite">favorite</span>
            {wishlistProductIds.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-error text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                {wishlistProductIds.length}
              </span>
            )}
          </Link>
          <Link to="/cart" className="hover:text-primary dark:hover:text-on-primary transition-colors duration-200 opacity-80 hover:opacity-100 hover:scale-95 transition-all relative">
            <span className="material-symbols-outlined" data-icon="shopping_cart">shopping_cart</span>
            {cartItemsCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-[#C1272D] text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                {cartItemsCount}
              </span>
            )}
          </Link>
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
        <Link to="/cart" className="text-on-surface-variant hover:text-primary transition-colors relative">
          <span className="material-symbols-outlined">shopping_cart</span>
          {cartItemsCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-[#C1272D] text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
              {cartItemsCount}
            </span>
          )}
        </Link>
      </div>
    </header>
      
      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
