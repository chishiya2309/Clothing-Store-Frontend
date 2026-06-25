import api from './api'

export type DiscountType = 'percentage' | 'fixed_amount'

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

export const voucherService = {
  apply: async (data: ApplyVoucherRequest): Promise<AppliedVoucherResponse> => {
    const response = await api.post('/vouchers/apply', data)
    return response.data.data
  },
}
