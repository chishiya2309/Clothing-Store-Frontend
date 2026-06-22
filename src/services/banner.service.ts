import api from './api'

export interface BannerResponse {
  id: number
  title: string
  imageUrl: string
  linkUrl: string | null
  displayOrder: number
  isActive: boolean
  startDate: string | null
  endDate: string | null
  createdAt: string
}

export const bannerService = {
  // Admin APIs
  getAll: async (): Promise<BannerResponse[]> => {
    const response = await api.get('/admin/banners')
    return response.data.data
  },

  create: async (data: FormData): Promise<BannerResponse> => {
    const response = await api.post('/admin/banners', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data.data
  },

  update: async (id: number, data: FormData): Promise<BannerResponse> => {
    const response = await api.put(`/admin/banners/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/admin/banners/${id}`)
  },

  // Public API
  getActiveBanners: async (): Promise<BannerResponse[]> => {
    const response = await api.get('/guest/banners')
    return response.data.data
  }
}
