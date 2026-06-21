import { create } from 'zustand'
import { cartService } from '../services/cart.service'
import type { CartItemResponse, CartSyncItem } from '../services/cart.service'
import { useAuthStore } from './authStore'

interface CartState {
  items: CartItemResponse[]
  totalAmount: number
  loading: boolean
  error: string | null
  fetchCart: () => Promise<void>
  addItem: (productId: number, size: string, color: string, quantity: number) => Promise<void>
  updateQuantity: (itemId: number | null, productVariantId: number, quantity: number) => Promise<void>
  removeItem: (itemId: number | null, productVariantId: number) => Promise<void>
  clearCart: () => Promise<void>
  syncCartAfterLogin: () => Promise<void>
}

const getLocalItems = (): CartSyncItem[] => {
  try {
    const raw = localStorage.getItem('guest_cart_items')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const setLocalItems = (items: CartSyncItem[]) => {
  localStorage.setItem('guest_cart_items', JSON.stringify(items))
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  totalAmount: 0,
  loading: false,
  error: null,

  fetchCart: async () => {
    set({ loading: true, error: null })
    try {
      const token = useAuthStore.getState().token
      if (token) {
        // Logged in user
        const cart = await cartService.getCart()
        set({ items: cart.items, totalAmount: cart.totalAmount, loading: false })
      } else {
        // Guest user
        const localItems = getLocalItems()
        if (localItems.length === 0) {
          set({ items: [], totalAmount: 0, loading: false })
          return
        }

        const guestCart = await cartService.getGuestCart({ items: localItems })
        
        // Sync local storage if backend capped quantities due to stock limit
        const updatedLocalItems = guestCart.items.map(item => ({
          productId: item.productId,
          size: item.size,
          color: item.color,
          quantity: item.quantity
        }))
        setLocalItems(updatedLocalItems)

        set({ items: guestCart.items, totalAmount: guestCart.totalAmount, loading: false })
      }
    } catch (err: any) {
      console.error('Fetch cart error:', err)
      set({ error: err.response?.data?.message || 'Không thể tải giỏ hàng', loading: false })
    }
  },

  addItem: async (productId: number, size: string, color: string, quantity: number) => {
    set({ loading: true, error: null })
    try {
      const token = useAuthStore.getState().token
      if (token) {
        // Logged in user
        await cartService.addToCart({ productId, size, color, quantity })
        const cart = await cartService.getCart()
        set({ items: cart.items, totalAmount: cart.totalAmount, loading: false })
      } else {
        // Guest user
        const localItems = getLocalItems()
        const existingIndex = localItems.findIndex(
          item => item.productId === productId && 
                  item.size.toLowerCase() === size.toLowerCase() && 
                  item.color.toLowerCase() === color.toLowerCase()
        )

        let targetQty = quantity
        if (existingIndex > -1) {
          targetQty += localItems[existingIndex].quantity
        }

        // Call API to check stock before allowing addition
        const proposedItems = [...localItems]
        if (existingIndex > -1) {
          proposedItems[existingIndex] = { ...proposedItems[existingIndex], quantity: targetQty }
        } else {
          proposedItems.push({ productId, size, color, quantity: targetQty })
        }

        const guestCart = await cartService.getGuestCart({ items: proposedItems })
        
        // Find the item we just tried to add/update in the response
        const returnedItem = guestCart.items.find(
          item => item.productId === productId && 
                  item.size.toLowerCase() === size.toLowerCase() && 
                  item.color.toLowerCase() === color.toLowerCase()
        )

        if (!returnedItem) {
          throw new Error('Sản phẩm đã hết hàng hoặc không hoạt động.')
        }

        // If returned quantity is less than what we proposed, we know stock was insufficient
        if (returnedItem.quantity < targetQty) {
          // If we already had some in cart, check if we can add any more
          const currentQtyInCart = existingIndex > -1 ? localItems[existingIndex].quantity : 0
          const maxAddable = returnedItem.quantity - currentQtyInCart
          
          if (maxAddable <= 0) {
            alert(`Sản phẩm không đủ số lượng tồn kho. Bạn đã có ${currentQtyInCart} sản phẩm trong giỏ hàng và không thể thêm nữa.`)
            set({ loading: false })
            return
          } else {
            alert(`Chỉ có thể thêm ${maxAddable} sản phẩm vào giỏ do giới hạn tồn kho.`)
            targetQty = returnedItem.quantity
          }
        }

        // Update local storage
        if (existingIndex > -1) {
          localItems[existingIndex].quantity = targetQty
        } else {
          localItems.push({ productId, size, color, quantity: targetQty })
        }
        setLocalItems(localItems)

        set({ items: guestCart.items, totalAmount: guestCart.totalAmount, loading: false })
      }
    } catch (err: any) {
      console.error('Add to cart error:', err)
      const errMsg = err.response?.data?.message || err.message || 'Lỗi khi thêm sản phẩm vào giỏ hàng'
      alert(errMsg)
      set({ error: errMsg, loading: false })
    }
  },

  updateQuantity: async (itemId: number | null, productVariantId: number, quantity: number) => {
    set({ loading: true, error: null })
    try {
      const token = useAuthStore.getState().token
      if (token) {
        // Logged in user
        if (!itemId) {
          throw new Error('Mã dòng giỏ hàng không hợp lệ')
        }
        await cartService.updateQuantity(itemId, quantity)
        const cart = await cartService.getCart()
        set({ items: cart.items, totalAmount: cart.totalAmount, loading: false })
      } else {
        // Guest user
        const localItems = getLocalItems()
        const currentItem = get().items.find(item => item.productVariantId === productVariantId)
        if (!currentItem) {
          throw new Error('Không tìm thấy sản phẩm trong giỏ hàng')
        }

        const existingIndex = localItems.findIndex(
          item => item.productId === currentItem.productId && 
                  item.size.toLowerCase() === currentItem.size.toLowerCase() && 
                  item.color.toLowerCase() === currentItem.color.toLowerCase()
        )

        if (existingIndex === -1) {
          throw new Error('Không tìm thấy sản phẩm trong giỏ hàng tạm thời')
        }

        if (quantity === 0) {
          // Remove item
          localItems.splice(existingIndex, 1)
          setLocalItems(localItems)
          await get().fetchCart()
          return
        }

        // Call API to check stock before allowing quantity change
        const proposedItems = [...localItems]
        proposedItems[existingIndex] = { ...proposedItems[existingIndex], quantity }

        const guestCart = await cartService.getGuestCart({ items: proposedItems })
        const returnedItem = guestCart.items.find(item => item.productVariantId === productVariantId)

        if (!returnedItem || returnedItem.quantity < quantity) {
          alert('Sản phẩm không đủ số lượng tồn kho.')
          set({ loading: false })
          return
        }

        // Accept quantity update
        localItems[existingIndex].quantity = quantity
        setLocalItems(localItems)
        set({ items: guestCart.items, totalAmount: guestCart.totalAmount, loading: false })
      }
    } catch (err: any) {
      console.error('Update quantity error:', err)
      const errMsg = err.response?.data?.message || 'Lỗi khi cập nhật số lượng'
      alert(errMsg)
      set({ error: errMsg, loading: false })
    }
  },

  removeItem: async (itemId: number | null, productVariantId: number) => {
    set({ loading: true, error: null })
    try {
      const token = useAuthStore.getState().token
      if (token) {
        // Logged in user
        if (!itemId) {
          throw new Error('Mã dòng giỏ hàng không hợp lệ')
        }
        await cartService.removeItem(itemId)
        const cart = await cartService.getCart()
        set({ items: cart.items, totalAmount: cart.totalAmount, loading: false })
      } else {
        // Guest user
        const localItems = getLocalItems()
        const currentItem = get().items.find(item => item.productVariantId === productVariantId)
        if (!currentItem) return

        const updatedLocal = localItems.filter(
          item => !(item.productId === currentItem.productId && 
                    item.size.toLowerCase() === currentItem.size.toLowerCase() && 
                    item.color.toLowerCase() === currentItem.color.toLowerCase())
        )
        setLocalItems(updatedLocal)
        await get().fetchCart()
      }
    } catch (err: any) {
      console.error('Remove item error:', err)
      set({ error: err.response?.data?.message || 'Lỗi khi xóa sản phẩm', loading: false })
    }
  },

  clearCart: async () => {
    set({ loading: true, error: null })
    try {
      const token = useAuthStore.getState().token
      if (token) {
        // Logged in user
        await cartService.clearCart()
        set({ items: [], totalAmount: 0, loading: false })
      } else {
        // Guest user
        setLocalItems([])
        set({ items: [], totalAmount: 0, loading: false })
      }
    } catch (err: any) {
      console.error('Clear cart error:', err)
      set({ error: err.response?.data?.message || 'Lỗi khi xóa giỏ hàng', loading: false })
    }
  },

  syncCartAfterLogin: async () => {
    const localItems = getLocalItems()
    if (localItems.length === 0) return

    set({ loading: true, error: null })
    try {
      await cartService.syncCart({ items: localItems })
      localStorage.removeItem('guest_cart_items')
      const cart = await cartService.getCart()
      set({ items: cart.items, totalAmount: cart.totalAmount, loading: false })
    } catch (err: any) {
      console.error('Sync cart error:', err)
      set({ error: err.response?.data?.message || 'Không thể đồng bộ giỏ hàng', loading: false })
    }
  }
}))
