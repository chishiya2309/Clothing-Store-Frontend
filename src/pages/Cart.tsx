import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import { calculateShippingFee } from '../utils/shipping'

export default function Cart() {
  const { items, totalAmount, loading, fetchCart, updateQuantity, removeItem } = useCartStore()
  const token = useAuthStore((state) => state.token)
  const navigate = useNavigate()
  const shippingFee = calculateShippingFee(totalAmount)
  const orderTotal = Number(totalAmount || 0) + shippingFee

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  const formatPrice = (price: number | string) => {
    return Number(price).toLocaleString('vi-VN') + 'đ'
  }

  const handleCheckout = () => {
    if (!token) {
      alert('Vui lòng đăng nhập để tiến hành thanh toán.')
      navigate('/login?redirect=checkout')
    } else {
      navigate('/checkout')
    }
  }

  const handleQuantityDecrement = async (item: any) => {
    if (item.quantity > 1) {
      await updateQuantity(item.id, item.productVariantId, item.quantity - 1)
    } else {
      if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?')) {
        await removeItem(item.id, item.productVariantId)
      }
    }
  }

  const handleQuantityIncrement = async (item: any) => {
    await updateQuantity(item.id, item.productVariantId, item.quantity + 1)
  }

  const handleRemoveItem = async (item: any) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?')) {
      await removeItem(item.id, item.productVariantId)
    }
  }

  if (loading && items.length === 0) {
    return (
      <div className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-lg md:py-xl flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-on-surface-variant font-body-md">Đang tải giỏ hàng...</p>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-lg md:py-xl text-center min-h-[400px] flex flex-col items-center justify-center">
        <span className="material-symbols-outlined text-[64px] text-on-surface-variant mb-4 opacity-50">shopping_cart</span>
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-2">Giỏ hàng trống</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-8 max-w-md">
          Giỏ hàng của bạn hiện đang trống. Hãy quay lại cửa hàng để chọn những bộ cánh ưng ý nhé!
        </p>
        <Link
          to="/"
          className="bg-primary text-on-primary font-label-caps text-label-caps py-3 px-8 rounded hover:opacity-95 transition-opacity duration-200 tracking-wider shadow-sm"
        >
          TIẾP TỤC MUA SẮM
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-lg md:py-xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
        {/* Left Column: Cart Items */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="flex items-baseline justify-between mb-lg">
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">
              Giỏ hàng của bạn{' '}
              <span className="text-on-surface-variant text-headline-md font-normal">
                ({items.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm)
              </span>
            </h1>
          </div>

          <div className="flex flex-col gap-md">
            {items.map((item) => (
              <div key={item.productVariantId} className="flex gap-md py-md border-b border-border-subtle group">
                <div className="w-[100px] md:w-[120px] aspect-[3/4] bg-surface-alt rounded overflow-hidden flex-shrink-0 relative">
                  <img
                    className="w-full h-full object-cover mix-blend-multiply"
                    src={item.imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=300'}
                    alt={item.productName}
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=300'
                    }}
                  />
                </div>
                <div className="flex flex-col justify-between flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-headline-md text-headline-md text-primary text-[18px] mb-xs">
                        {item.productName}
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {item.color} • Size {item.size}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item)}
                      aria-label="Remove item"
                      disabled={loading}
                      className="text-on-surface-variant hover:text-[#C1272D] transition-colors flex items-center disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                  <div className="flex justify-between items-end mt-sm">
                    <div className="flex items-center border border-border-subtle rounded w-fit bg-surface-container-lowest">
                      <button
                        onClick={() => handleQuantityDecrement(item)}
                        disabled={loading}
                        className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:bg-surface-alt transition-colors rounded-l disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">remove</span>
                      </button>
                      <span className="font-body-sm text-body-sm w-8 text-center border-l border-r border-border-subtle h-8 flex items-center justify-center select-none">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityIncrement(item)}
                        disabled={loading}
                        className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:bg-surface-alt transition-colors rounded-r disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                      </button>
                    </div>
                    <div className="font-price-display text-price-display text-primary flex flex-col items-end">
                      <span>{formatPrice(item.subtotal)}</span>
                      {item.quantity > 1 && (
                        <span className="text-on-surface-variant text-[12px] font-normal">
                          ({formatPrice(item.unitPrice)}/sp)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-md text-on-surface-variant font-body-sm text-body-sm flex items-center gap-xs">
            <span className="material-symbols-outlined text-[18px]">undo</span>
            <Link className="underline hover:text-primary transition-colors" to="/">
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-4 relative mt-lg lg:mt-0">
          <div className="sticky top-[100px] bg-surface-container-lowest border border-border-subtle rounded-lg p-md md:p-lg flex flex-col gap-md shadow-sm">
            <h2 className="font-headline-md text-headline-md text-primary border-b border-border-subtle pb-sm">
              Tóm tắt đơn hàng
            </h2>
            <div className="flex flex-col gap-sm mt-sm">
              <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                <span>Tạm tính ({items.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm)</span>
                <span className="font-price-display text-primary">{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                <span>Phí vận chuyển</span>
                <span className={`font-price-display ${shippingFee === 0 ? 'text-success uppercase text-[12px] font-bold' : 'text-primary'}`}>
                  {shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
                </span>
              </div>
            </div>

            <div className="border-t border-border-subtle mt-sm pt-sm flex justify-between items-end">
              <span className="font-headline-md text-headline-md text-primary">Tổng cộng</span>
              <div className="text-right">
                <span className="font-price-display text-primary-container text-[28px] font-bold block leading-none">
                  {formatPrice(orderTotal)}
                </span>
                <span className="font-body-sm text-[12px] text-on-surface-variant italic mt-1">
                  Đã bao gồm VAT
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-primary-container text-on-primary font-label-caps text-label-caps py-md rounded-md hover:bg-primary transition-all mt-md shadow-sm hover:shadow-md active:scale-[0.98] tracking-wider disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
            >
              TIẾN HÀNH THANH TOÁN
            </button>

            {/* Trust Signals */}
            <div className="flex justify-between items-center mt-md pt-md border-t border-border-subtle">
              <div className="flex flex-col items-center gap-1 text-center group cursor-default">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant group-hover:text-primary transition-colors">
                  lock
                </span>
                <span className="font-label-caps text-[10px] text-on-surface-variant">
                  Thanh toán
                  <br />
                  bảo mật
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center group cursor-default">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant group-hover:text-primary transition-colors">
                  verified
                </span>
                <span className="font-label-caps text-[10px] text-on-surface-variant">
                  Hàng chính hãng
                  <br />
                  100%
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center group cursor-default">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant group-hover:text-primary transition-colors">
                  restart_alt
                </span>
                <span className="font-label-caps text-[10px] text-on-surface-variant">
                  Đổi trả miễn phí
                  <br />
                  trong 15 ngày
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
