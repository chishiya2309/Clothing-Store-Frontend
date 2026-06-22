import { create } from 'zustand'
import { wishlistService } from '../services/wishlist.service'

interface WishlistState {
  wishlistProductIds: number[]
  loading: boolean
  error: string | null
  
  // Actions
  initializeWishlist: (ids: number[]) => void
  fetchWishlistIds: () => Promise<void>
  toggleWishlist: (productId: number) => Promise<void>
  checkIsWishlisted: (productId: number) => boolean
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  wishlistProductIds: [],
  loading: false,
  error: null,

  initializeWishlist: (ids: number[]) => {
    set({ wishlistProductIds: ids })
  },

  fetchWishlistIds: async () => {
    try {
      const ids = await wishlistService.getWishlistIds()
      set({ wishlistProductIds: ids })
    } catch (error) {
      console.error('Failed to fetch wishlist IDs', error)
    }
  },

  toggleWishlist: async (productId: number) => {
    try {
      set({ loading: true, error: null })
      await wishlistService.toggleWishlist(productId)
      
      const currentIds = get().wishlistProductIds
      const isCurrentlyWishlisted = currentIds.includes(productId)
      
      if (isCurrentlyWishlisted) {
        set({ wishlistProductIds: currentIds.filter(id => id !== productId) })
      } else {
        set({ wishlistProductIds: [...currentIds, productId] })
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to toggle wishlist' })
    } finally {
      set({ loading: false })
    }
  },

  checkIsWishlisted: (productId: number) => {
    return get().wishlistProductIds.includes(productId)
  }
}))
