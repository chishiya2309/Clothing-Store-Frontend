import { useEffect } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import type { PaymentMethod } from '@/services/checkout.service'
import { useCartStore } from '@/store/cartStore'

interface CheckoutResultState {
  status?: 'success' | 'pending' | 'failed'
  orderCode?: string
  checkoutCode?: string
  paymentReference?: string
  gatewayTransactionId?: string
  paymentMethod?: PaymentMethod
  message?: string
}

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cod: 'Thanh toán khi nhận hàng',
  vnpay: 'VNPay',
  momo: 'MoMo',
}

export default function CheckoutResult() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const fetchCart = useCartStore((state) => state.fetchCart)
  const state = (location.state || {}) as CheckoutResultState

  const status = state.status || searchParams.get('status') || 'success'
  const orderCode = state.orderCode || searchParams.get('orderCode') || ''
  const checkoutCode = state.checkoutCode || searchParams.get('checkoutCode') || ''
  const paymentReference = state.paymentReference || searchParams.get('paymentReference') || ''
  const gatewayTransactionId = state.gatewayTransactionId || searchParams.get('gatewayTransactionId') || ''
  const paymentMethod = state.paymentMethod || (searchParams.get('paymentMethod') as PaymentMethod | null)
  const message =
    state.message ||
    searchParams.get('message') ||
    (status === 'failed'
      ? 'Thanh toán chưa hoàn tất. Vui lòng kiểm tra lại đơn hàng hoặc thử lại.'
      : 'Đơn hàng của bạn đã được ghi nhận thành công.')

  const isSuccess = status !== 'failed'

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  return (
    <div className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-xl">
      <div className="max-w-2xl mx-auto bg-surface-container-lowest border border-border-subtle rounded-xl p-lg text-center">
        <div
          className={`w-16 h-16 rounded-full mx-auto mb-md flex items-center justify-center ${
            isSuccess ? 'bg-success/10 text-success' : 'bg-error-container text-error'
          }`}
        >
          <span className="material-symbols-outlined text-[36px]">{isSuccess ? 'check_circle' : 'error'}</span>
        </div>

        <h1 className="font-headline-lg text-headline-lg text-primary mb-sm">
          {isSuccess ? 'Đặt hàng thành công' : 'Thanh toán không thành công'}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-lg">{message}</p>

        <div className="bg-surface-alt rounded-lg p-md text-left flex flex-col gap-sm mb-lg">
          {orderCode && (
            <div className="flex justify-between gap-md">
              <span className="text-on-surface-variant">Mã đơn hàng</span>
              <span className="font-price-display text-primary">#{orderCode}</span>
            </div>
          )}
          {checkoutCode && (
            <div className="flex justify-between gap-md">
              <span className="text-on-surface-variant">Mã checkout</span>
              <span className="font-price-display text-primary">{checkoutCode}</span>
            </div>
          )}
          {paymentReference && (
            <div className="flex justify-between gap-md">
              <span className="text-on-surface-variant">Mã thanh toán</span>
              <span className="font-price-display text-primary">{paymentReference}</span>
            </div>
          )}
          {gatewayTransactionId && (
            <div className="flex justify-between gap-md">
              <span className="text-on-surface-variant">Mã giao dịch VNPay</span>
              <span className="font-price-display text-primary">{gatewayTransactionId}</span>
            </div>
          )}
          {paymentMethod && (
            <div className="flex justify-between gap-md">
              <span className="text-on-surface-variant">Phương thức</span>
              <span className="font-body-md text-primary">{PAYMENT_LABEL[paymentMethod]}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-sm">
          {orderCode && (
            <Link
              to={`/account/orders/${orderCode}`}
              className="bg-primary text-on-primary px-lg py-sm rounded font-label-caps text-label-caps"
            >
              Xem chi tiết đơn
            </Link>
          )}
          <Link
            to="/"
            className="border border-border-subtle text-primary px-lg py-sm rounded font-label-caps text-label-caps hover:bg-surface-alt transition-colors"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </div>
  )
}
