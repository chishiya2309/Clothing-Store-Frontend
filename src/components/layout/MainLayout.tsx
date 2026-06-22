import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './Header'
import Footer from './Footer'
import { useAuthStore } from '@/store/authStore'
import { useWishlistStore } from '@/store/wishlistStore'

export default function MainLayout() { 
  const token = useAuthStore((state) => state.token)
  const fetchWishlistIds = useWishlistStore((state) => state.fetchWishlistIds)

  useEffect(() => {
    if (token) {
      fetchWishlistIds()
    } else {
      useWishlistStore.getState().initializeWishlist([])
    }
  }, [token, fetchWishlistIds])

  return (
    <>
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </>
  ) 
}
