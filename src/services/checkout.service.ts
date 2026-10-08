import api from './api'

export type PaymentMethod = 'cod' | 'vnpay' | 'momo'

export interface ConfirmCheckoutRequest {
  addressId: number
  voucherCode?: string | null
  productVoucherCode?: string | null
  shippingVoucherCode?: string | null
  paymentMethod: PaymentMethod
}

export type CheckoutVoucherDiscountType = 'percentage' | 'fixed_amount' | 'shipping_fixed_amount' | 'cheapest_item_free'

export interface PreviewCheckoutRequest {
  addressId: number
  voucherCode?: string | null
  productVoucherCode?: string | null
  shippingVoucherCode?: string | null
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
  productVoucherApplied: boolean
  productVoucherId: number | null
  productVoucherCode: string | null
  productVoucherDiscountType: CheckoutVoucherDiscountType | null
  productVoucherMessage: string | null
  shippingVoucherApplied: boolean
  shippingVoucherId: number | null
  shippingVoucherCode: string | null
  shippingVoucherDiscountType: CheckoutVoucherDiscountType | null
  shippingVoucherMessage: string | null
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
