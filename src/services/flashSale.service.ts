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

export interface StaffFlashSaleItem {
  id: number
  productId: number
  productName: string
  originalPrice: number
  flashSalePrice: number
  quota: number
  reservedQuantity: number
  soldQuantity: number
  availableQuantity: number
  createdAt: string
  updatedAt: string
}

export interface StaffFlashSaleCampaign {
  id: number
  name: string
  description: string | null
  startAt: string
  endAt: string
  isActive: boolean
  status: FlashSaleStatus
  items: StaffFlashSaleItem[]
  createdAt: string
  updatedAt: string
}

export interface StaffFlashSaleCampaignRequest {
  name: string
  description?: string
  startAt: string
  endAt: string
  isActive: boolean
}

export interface StaffFlashSaleItemRequest {
  productId: number
  flashSalePrice: number
  quota: number
}

export const flashSaleService = {
  getCurrent: async (): Promise<FlashSaleCampaign | null> => {
    const response = await api.get('/guest/flash-sales/current')
    return response.data.data
  },

  getById: async (campaignId: number): Promise<FlashSaleCampaign> => {
    const response = await api.get(`/guest/flash-sales/${campaignId}`)
    return response.data.data
  },

  getStaffCampaigns: async (): Promise<StaffFlashSaleCampaign[]> => {
    const response = await api.get('/staff/flash-sales')
    return response.data.data
  },

  getStaffCampaign: async (campaignId: number): Promise<StaffFlashSaleCampaign> => {
    const response = await api.get(`/staff/flash-sales/${campaignId}`)
    return response.data.data
  },

  createStaffCampaign: async (data: StaffFlashSaleCampaignRequest): Promise<StaffFlashSaleCampaign> => {
    const response = await api.post('/staff/flash-sales', data)
    return response.data.data
  },

  updateStaffCampaign: async (campaignId: number, data: StaffFlashSaleCampaignRequest): Promise<StaffFlashSaleCampaign> => {
    const response = await api.put(`/staff/flash-sales/${campaignId}`, data)
    return response.data.data
  },

  updateStaffActivation: async (campaignId: number, isActive: boolean): Promise<StaffFlashSaleCampaign> => {
    const response = await api.patch(`/staff/flash-sales/${campaignId}/activation`, { isActive })
    return response.data.data
  },

  addStaffItem: async (campaignId: number, data: StaffFlashSaleItemRequest): Promise<StaffFlashSaleCampaign> => {
    const response = await api.post(`/staff/flash-sales/${campaignId}/items`, data)
    return response.data.data
  },

  updateStaffItem: async (campaignId: number, itemId: number, data: StaffFlashSaleItemRequest): Promise<StaffFlashSaleCampaign> => {
    const response = await api.put(`/staff/flash-sales/${campaignId}/items/${itemId}`, data)
    return response.data.data
  },

  removeStaffItem: async (campaignId: number, itemId: number): Promise<StaffFlashSaleCampaign> => {
    const response = await api.delete(`/staff/flash-sales/${campaignId}/items/${itemId}`)
    return response.data.data
  },
}
