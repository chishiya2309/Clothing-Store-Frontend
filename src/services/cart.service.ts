import api from './api'

export interface CartItemResponse {
  id: number | null
  productVariantId: number
  productId: number
  productName: string
  size: string
  color: string
  sku: string
  imageUrl: string
  unitPrice: number
  quantity: number
  subtotal: number
}

export interface CartResponse {
  items: CartItemResponse[]
  totalAmount: number
}

export interface AddToCartRequest {
  productId: number
  size: string
  color: string
  quantity: number
}

export interface CartSyncItem {
  productId: number
  size: string
  color: string
  quantity: number
}

export interface CartSyncRequest {
  items: CartSyncItem[]
}

export const cartService = {
  getCart: async (): Promise<CartResponse> => {
    const response = await api.get('/customer/cart')
    return response.data.data
  },

  addToCart: async (data: AddToCartRequest): Promise<CartItemResponse> => {
    const response = await api.post('/customer/cart/items', data)
    return response.data.data
  },

  updateQuantity: async (itemId: number, quantity: number): Promise<CartItemResponse | null> => {
    const response = await api.put(`/customer/cart/items/${itemId}`, null, {
      params: { quantity }
    })
    return response.data.data
  },

  removeItem: async (itemId: number): Promise<void> => {
    await api.delete(`/customer/cart/items/${itemId}`)
  },

  clearCart: async (): Promise<void> => {
    await api.delete('/customer/cart')
  },

  syncCart: async (data: CartSyncRequest): Promise<CartResponse> => {
    const response = await api.post('/customer/cart/sync', data)
    return response.data.data
  },

  getGuestCart: async (data: CartSyncRequest): Promise<CartResponse> => {
    const response = await api.post('/guest/cart', data)
    return response.data.data
  }
}
