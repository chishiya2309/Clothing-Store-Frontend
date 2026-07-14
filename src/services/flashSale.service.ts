import api from './api'

export type FlashSaleStatus = 'UPCOMING' | 'ACTIVE' | 'ENDED' | 'DISABLED'

export interface FlashSaleProduct {
  flashSaleItemId: number
  productId: number
  productName: string
  productSlug: string
  thumbnailUrl: string | null
  originalPrice: number
  flashSalePrice: number
  quota: number
  soldQuantity: number
  availableQuantity: number
  soldOut: boolean
}

export interface FlashSaleCampaign {
  id: number
  name: string
  description: string | null
  startAt: string
  endAt: string
  status: FlashSaleStatus
  serverTime: string
  items: FlashSaleProduct[]
}

export const flashSaleService = {
  getCurrent: async (): Promise<FlashSaleCampaign | null> => {
    const response = await api.get('/guest/flash-sales/current')
    return response.data.data
  },

  getById: async (campaignId: number): Promise<FlashSaleCampaign> => {
    const response = await api.get(`/guest/flash-sales/${campaignId}`)
    return response.data.data
  }
}
