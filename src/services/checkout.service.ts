import api from './api'

export type PaymentMethod = 'cod' | 'vnpay' | 'momo'

export interface ConfirmCheckoutRequest {
  addressId: number
  voucherCode?: string | null
  paymentMethod: PaymentMethod
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
  confirm: async (data: ConfirmCheckoutRequest): Promise<PlaceOrderResponse> => {
    const response = await api.post('/checkouts/confirm', data)
    return response.data.data
  },
}
