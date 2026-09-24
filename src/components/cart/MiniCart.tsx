import { Link } from 'react-router-dom'
import type { CartItemResponse } from '../../services/cart.service'

interface MiniCartProps {
  items: CartItemResponse[]
  totalAmount: number
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=300'

const formatPrice = (value: number | string) =>
  `${Number(value || 0).toLocaleString('vi-VN')}₫`

export default function MiniCart({ items, totalAmount }: MiniCartProps) {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <section
      aria-label="Giỏ hàng thu gọn"
      className="w-[400px] overflow-hidden rounded-md border border-border-subtle bg-surface-container-lowest text-primary shadow-xl"
    >
      <div className="flex items-center justify-between border-b border-border-subtle px-md py-sm">
        <h2 className="font-headline-md text-[18px] normal-case tracking-normal">
          Giỏ hàng
        </h2>
        <span className="font-body-sm text-body-sm normal-case text-on-surface-variant">
          {totalQuantity} sản phẩm
        </span>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center px-md py-lg text-center normal-case">
          <span className="material-symbols-outlined mb-2 text-[40px] text-on-surface-variant opacity-50">
            shopping_cart
          </span>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Giỏ hàng của bạn đang trống
          </p>
        </div>
      ) : (
        <>
          <div className="max-h-[420px] overflow-y-auto px-md">
            {items.map((item) => (
              <article
                key={item.id ?? item.productVariantId}
                className="flex gap-sm border-b border-border-subtle py-sm last:border-b-0"
              >
                <div className="h-24 w-20 flex-shrink-0 overflow-hidden rounded bg-surface-alt">
                  <img
                    src={item.imageUrl || FALLBACK_IMAGE}
                    alt={item.productName}
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.onerror = null
                      event.currentTarget.src = FALLBACK_IMAGE
                    }}
                  />
                </div>

                <div className="min-w-0 flex-1 normal-case">
                  <h3 className="line-clamp-2 font-body-md text-[14px] font-semibold leading-5">
                    {item.productName}
                  </h3>
                  <p className="mt-1 font-body-sm text-[12px] text-on-surface-variant">
                    {item.color} • Size {item.size}
                  </p>
                  <p className="font-body-sm text-[12px] text-on-surface-variant">
                    Số lượng: {item.quantity}
                  </p>
                  <div className="mt-2 flex items-end justify-between gap-2">
                    <div className="font-body-sm text-[11px] text-on-surface-variant">
                      <span className="block">Đơn giá</span>
                      <span className="font-price-display text-[13px] text-primary">
                        {formatPrice(item.unitPrice)}
                      </span>
                    </div>
                    <div className="text-right font-body-sm text-[11px] text-on-surface-variant">
                      <span className="block">Thành tiền</span>
                      <span className="font-price-display text-[14px] font-semibold text-primary-container">
                        {formatPrice(item.subtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="border-t border-border-subtle bg-surface px-md py-sm normal-case">
            <div className="mb-sm flex items-center justify-between">
              <span className="font-body-md text-body-md font-semibold">Tổng giỏ hàng</span>
              <span className="font-price-display text-[18px] font-bold text-primary-container">
                {formatPrice(totalAmount)}
              </span>
            </div>
            <Link
              to="/cart"
              className="flex w-full items-center justify-center rounded bg-primary-container px-4 py-3 font-label-caps text-label-caps text-on-primary transition-colors hover:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              XEM GIỎ HÀNG
            </Link>
          </div>
        </>
      )}
    </section>
  )
}
