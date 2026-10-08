import api from './api'

export type PaymentMethod = 'cod' | 'vnpay' | 'momo'

export interface ConfirmCheckoutRequest {
  addressId: number
  voucherCode?: string | null
  paymentMethod: PaymentMethod
}

export type CheckoutVoucherDiscountType = 'percentage' | 'fixed_amount'

export interface PreviewCheckoutRequest {
  addressId: number
  voucherCode?: string | null
}

export interface CheckoutPreviewResponse {
  subtotal: number
  shippingFee: number
  membershipDiscountAmount: number
  voucherDiscountAmount: number
  shippingDiscountAmount: number
  discountAmount: number
  totalAmount: number
  voucherApplied: boolean
  voucherId: number | null
  voucherCode: string | null
  voucherDiscountType: CheckoutVoucherDiscountType | null
  voucherMessage: string | null
}

export interface OrderCheckoutResponse {
  orderCode: string
  subtotal: number
  shippingFee: number
  discountAmount: number
  totalAmount: number
  status: string
}

export interface OnlinePaymentResponse {
  paymentReference: string
  paymentUrl: string
  amount: number
  expiresAt: string
}

export interface PlaceOrderResponse {
  checkoutCode: string
  paymentMethod: PaymentMethod
  order: OrderCheckoutResponse | null
  onlinePayment: OnlinePaymentResponse | null
}

export const checkoutService = {
  preview: async (data: PreviewCheckoutRequest): Promise<CheckoutPreviewResponse> => {
    const response = await api.post('/checkouts/preview', data)
    return response.data.data
  },

  confirm: async (data: ConfirmCheckoutRequest): Promise<PlaceOrderResponse> => {
    const response = await api.post('/checkouts/confirm', data)
    return response.data.data
  },
}
