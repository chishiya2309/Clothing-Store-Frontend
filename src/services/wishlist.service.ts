import axios from 'axios'
import type { PageResponse, ProductGridResponse } from './product.service'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export const wishlistService = {
  getWishlist: async (page: number = 0, size: number = 12): Promise<PageResponse<ProductGridResponse>> => {
    const response = await axios.get(`${API_URL}/customer/wishlist`, {
      params: { page, size },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    return response.data.data
  },

  toggleWishlist: async (productId: number): Promise<void> => {
    await axios.post(`${API_URL}/customer/wishlist/toggle`, null, {
      params: { productId },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
  },

  checkWishlist: async (productId: number): Promise<boolean> => {
    try {
      const response = await axios.get(`${API_URL}/customer/wishlist/check`, {
        params: { productId },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      return response.data.data.isWishlisted
    } catch (error) {
      return false
    }
  },

  getWishlistIds: async (): Promise<number[]> => {
    try {
      const response = await axios.get(`${API_URL}/customer/wishlist/ids`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      return response.data.data
    } catch (error) {
      return []
    }
  }
}
