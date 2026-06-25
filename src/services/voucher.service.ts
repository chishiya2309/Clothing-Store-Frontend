import api from './api'

export type DiscountType = 'percentage' | 'fixed_amount'


export interface VoucherResponse {
  id: number
  code: string
  discountType: DiscountType
  discountValue: number
  maxDiscountAmount: number | null
  minOrderAmount: number
  startDate: string
  endDate: string
  usageLimit: number
  timesUsed: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface StaffVoucherRequest {
  code: string
  discountType: DiscountType
  discountValue: number
  maxDiscountAmount?: number | null
  minOrderAmount: number
  startDate: string
  endDate: string
  usageLimit: number
  isActive: boolean
}

export interface ApplyVoucherRequest {
  code: string
  subtotal: number
  shippingFee: number
}

export interface AppliedVoucherResponse {
  voucherId: number
  code: string
  discountType: DiscountType
  subtotal: number
  shippingFee: number
  discountAmount: number
  shippingDiscountAmount: number
  totalAmount: number
  message: string
}

interface VoucherListData {
  content?: VoucherResponse[]
}

const normalizeVoucherList = (data: VoucherResponse[] | VoucherListData): VoucherResponse[] => {
  return Array.isArray(data) ? data : data.content || []
}

export const voucherService = {
  apply: async (data: ApplyVoucherRequest): Promise<AppliedVoucherResponse> => {
    const response = await api.post('/vouchers/apply', data)
    return response.data.data
  },

  getStaffVouchers: async (): Promise<VoucherResponse[]> => {
    const response = await api.get('/staff/vouchers')
    return normalizeVoucherList(response.data.data)
  },

  getStaffVoucher: async (id: number): Promise<VoucherResponse> => {
    const response = await api.get(`/staff/vouchers/${id}`)
    return response.data.data
  },

  createStaffVoucher: async (data: StaffVoucherRequest): Promise<VoucherResponse> => {
    const response = await api.post('/staff/vouchers', data)
    return response.data.data
  },

  updateStaffVoucher: async (id: number, data: StaffVoucherRequest): Promise<VoucherResponse> => {
    const response = await api.put(`/staff/vouchers/${id}`, data)
    return response.data.data
  },

  deleteStaffVoucher: async (id: number): Promise<void> => {
    await api.delete(`/staff/vouchers/${id}`)
  },
}
