import { Outlet, Link } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './Header'
import Footer from './Footer'
import { useAuthStore } from '@/store/authStore'
import { useWishlistStore } from '@/store/wishlistStore'

export default function MainLayout() { 
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const fetchWishlistIds = useWishlistStore((state) => state.fetchWishlistIds)

  useEffect(() => {
    if (token) {
      fetchWishlistIds()
    } else {
      useWishlistStore.getState().initializeWishlist([])
    }
  }, [token, fetchWishlistIds])

  const isAdminOrStaff = user && (user.role?.toLowerCase() === 'admin' || user.role?.toLowerCase() === 'staff');

  return (
    <>
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />

      {/* Floating Admin/Staff Dashboard Shortcut Button */}
      {isAdminOrStaff && (
        <div className="fixed bottom-6 right-6 z-[9999] group">
          <Link
            to="/admin"
            className="flex items-center gap-2 px-6 py-3 bg-[#111122] text-white hover:bg-black border border-[#1D1D35] rounded-full shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-amber-500/10 font-label-caps text-label-caps select-none"
          >
            {/* Subtle glow background */}
            <span className="absolute -inset-0.5 bg-amber-400 rounded-full blur opacity-30 group-hover:opacity-60 transition-opacity duration-300 animate-pulse pointer-events-none" />
            <span className="relative flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-400 text-lg">admin_panel_settings</span>
              <span>Bảng điều khiển {user.role?.toLowerCase() === 'admin' ? 'Admin' : 'Staff'}</span>
            </span>
          </Link>
        </div>
      )}
    </>
  ) 
}
