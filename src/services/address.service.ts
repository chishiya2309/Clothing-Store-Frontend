import api from './api'

export interface AddressResponse {
  id: number
  recipientName: string
  phone: string
  province: string
  district: string
  ward: string
  streetAddress: string
  isDefault: boolean
}

export interface AddressRequest {
  recipientName: string
  phone: string
  province: string
  district: string
  ward: string
  streetAddress: string
  isDefault?: boolean
}

export interface Province {
  code: number
  name: string
}

export interface District {
  code: number
  name: string
}

export interface Ward {
  code: number
  name: string
}

const PROVINCES_API = 'https://provinces.open-api.vn/api'

export const addressService = {
  getAddresses: async (): Promise<AddressResponse[]> => {
    const response = await api.get('/customer/addresses')
    return response.data.data
  },

  getAddress: async (id: number): Promise<AddressResponse> => {
    const response = await api.get(`/customer/addresses/${id}`)
    return response.data.data
  },

  createAddress: async (data: AddressRequest): Promise<AddressResponse> => {
    const response = await api.post('/customer/addresses', data)
    return response.data.data
  },

  updateAddress: async (id: number, data: AddressRequest): Promise<AddressResponse> => {
    const response = await api.put(`/customer/addresses/${id}`, data)
    return response.data.data
  },

  deleteAddress: async (id: number): Promise<void> => {
    await api.delete(`/customer/addresses/${id}`)
  },

  setDefault: async (id: number): Promise<AddressResponse> => {
    const response = await api.patch(`/customer/addresses/${id}/default`)
    return response.data.data
  },

  // Vietnam Provinces API
  getProvinces: async (): Promise<Province[]> => {
    const response = await fetch(`${PROVINCES_API}/p/`)
    return response.json()
  },

  getDistricts: async (provinceCode: number): Promise<District[]> => {
    const response = await fetch(`${PROVINCES_API}/p/${provinceCode}?depth=2`)
    const data = await response.json()
    return data.districts || []
  },

  getWards: async (districtCode: number): Promise<Ward[]> => {
    const response = await fetch(`${PROVINCES_API}/d/${districtCode}?depth=2`)
    const data = await response.json()
    return data.wards || []
  },
}
