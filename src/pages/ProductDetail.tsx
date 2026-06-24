import { useParams, Link } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { useState, useEffect } from 'react'
import { productService } from '../services/product.service'
import type { ProductDetailResponse, ProductGridResponse } from '../services/product.service'
import { useWishlistStore } from '../store/wishlistStore'
import { useAuthStore } from '../store/authStore'

interface ColorOption {
  name: string
  hex: string
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const addItem = useCartStore((state) => state.addItem)
  const cartLoading = useCartStore((state) => state.loading)

  // API State
  const [product, setProduct] = useState<ProductDetailResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [recommendedProducts, setRecommendedProducts] = useState<ProductGridResponse[]>([])

  // UI state
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState<number>(1)
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0)
  const [addingToCartLocal, setAddingToCartLocal] = useState<boolean>(false)

  const { wishlistProductIds, toggleWishlist } = useWishlistStore()
  const { token } = useAuthStore()
  const isWishlisted = product ? wishlistProductIds.includes(product.id) : false

  const COLOR_HEX_MAP: Record<string, string> = {
    'trắng': '#FFFFFF',
    'đen': '#222222',
    'xám': '#808080',
    'xanh navy': '#1A1A2E',
    'xanh navy nhạt': '#4B6B94',
    'xanh medium': '#4B6B94',
    'xanh nhạt': '#ADD8E6',
    'hồng': '#FFC0CB',
    'kem': '#FFFDD0',
    'hoa nhí xanh': '#4682B4',
    'hoa nhí đỏ': '#CD5C5C',
    'đỏ': '#C1272D',
    'vàng': '#F1C40F',
    'cam': '#E67E22',
    'xanh lá': '#2ECC71',
  }

  const getColorHex = (colorName: string): string => {
    const normalized = colorName.toLowerCase().trim()
    if (COLOR_HEX_MAP[normalized]) return COLOR_HEX_MAP[normalized]
    for (const [key, value] of Object.entries(COLOR_HEX_MAP)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return value
      }
    }
    return '#CCCCCC'
  }

  // Load product detail on slug change
  useEffect(() => {
    if (!slug) return
    let isMounted = true
    setLoading(true)
    setError(null)

    productService.getProductBySlug(slug)
      .then((data) => {
        if (!isMounted) return
        setProduct(data)
        
        // Find unique colors
        const uniqueColors = Array.from(new Set(data.variants.map((v) => v.color))).map((c) => ({
          name: c,
          hex: getColorHex(c),
        }))
        if (uniqueColors.length > 0) {
          setSelectedColor(uniqueColors[0])
        } else {
          setSelectedColor(null)
        }

        // Find unique sizes
        const uniqueSizes = Array.from(new Set(data.variants.map((v) => v.size)))
        if (uniqueSizes.length > 0) {
          setSelectedSize(uniqueSizes[0])
        } else {
          setSelectedSize(null)
        }

        setQuantity(1)
        setActiveImageIndex(0)
        // Fetch recommendations
        productService.getRecommendedProducts(data.id)
          .then((recs) => {
            if (isMounted) setRecommendedProducts(recs)
          })
          .catch((err) => console.error('Lỗi khi tải sản phẩm gợi ý:', err))

        setLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        console.error('Lỗi khi tải chi tiết sản phẩm:', err)
        setError(err.response?.data?.message || 'Không thể tải chi tiết sản phẩm')
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [slug])

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + '₫'
  }

  const handleQuantityDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const handleQuantityIncrement = () => {
    if (!product || !selectedColor || !selectedSize) return
    const currentVariant = product.variants.find(
      (v) =>
        v.color.toLowerCase() === selectedColor.name.toLowerCase() &&
        v.size.toLowerCase() === selectedSize.toLowerCase()
    )
    const stockLimit = currentVariant ? currentVariant.stockQuantity : 99
    if (quantity < stockLimit) {
      setQuantity(quantity + 1)
    } else {
      alert(`Đã đạt giới hạn số lượng tồn kho của biến thể này (${stockLimit} sản phẩm).`)
    }
  }

  const handleAddToCart = async () => {
    if (!product || !selectedColor || !selectedSize) return
    setAddingToCartLocal(true)
    try {
      await addItem(product.id, selectedSize, selectedColor.name, quantity)
      alert(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`)
    } catch (err) {
      console.error(err)
      alert('Có lỗi xảy ra khi thêm vào giỏ hàng.')
    } finally {
      setAddingToCartLocal(false)
    }
  }

  const handleWishlistToggle = async () => {
    if (!product) return
    if (!token) {
      alert('Vui lòng đăng nhập để lưu sản phẩm yêu thích.')
      return
    }
    await toggleWishlist(product.id)
  }

  if (loading) {
    return (
      <main className="flex-grow flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </main>
    )
  }

  if (error || !product) {
    return (
      <main className="flex-grow flex flex-col items-center justify-center min-h-[400px] gap-sm">
        <span className="material-symbols-outlined text-[48px] text-text-muted">error</span>
        <h2 className="font-headline-md text-headline-md text-primary">Không tìm thấy sản phẩm</h2>
        <p className="text-text-muted">{error || 'Sản phẩm không tồn tại hoặc đã bị ngừng bán.'}</p>
        <Link to="/" className="mt-sm bg-primary text-on-primary px-6 py-3 rounded font-label-caps text-label-caps hover:bg-opacity-90">
          Quay lại trang chủ
        </Link>
      </main>
    )
  }

  const displayImages = product.images.length > 0
    ? product.images.map((img) => img.imageUrl)
    : ['https://placehold.co/800x1000?text=No+Image']

  const colors = Array.from(new Set(product.variants.map((v) => v.color))).map((c) => ({
    name: c,
    hex: getColorHex(c),
  }))

  const sizes = Array.from(new Set(product.variants.map((v) => v.size)))

  const isSizeOutOfStock = (sizeName: string) => {
    if (!selectedColor) return false
    const v = product.variants.find(
      (variant) =>
        variant.color.toLowerCase() === selectedColor.name.toLowerCase() &&
        variant.size.toLowerCase() === sizeName.toLowerCase()
    )
    return !v || v.stockQuantity <= 0
  }

  const currentVariant = product.variants.find(
    (v) =>
      v.color.toLowerCase() === selectedColor?.name.toLowerCase() &&
      v.size.toLowerCase() === selectedSize?.toLowerCase()
  )
  const isOutOfStock = !currentVariant || currentVariant.stockQuantity <= 0

  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-lg md:py-xl">
      {/* Breadcrumb */}
      <nav className="mb-gutter text-text-muted font-body-sm text-body-sm flex items-center gap-xs">
        <Link className="hover:text-primary transition-colors" to="/">Trang chủ</Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="hover:text-primary transition-colors">Sản phẩm</span>
        {product.categoryName && (
          <>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="hover:text-primary transition-colors">{product.categoryName}</span>
          </>
        )}
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-on-background">{product.name}</span>
      </nav>

      {/* Product Layout */}
      <div className="flex flex-col lg:flex-row gap-xl">
        {/* Left Column: Images (55%) */}
        <div className="w-full lg:w-[55%] flex flex-col gap-sm">
          <div className="aspect-[3/4] bg-surface-alt rounded overflow-hidden relative">
            <img
              alt={product.name}
              className="w-full h-full object-cover"
              src={displayImages[activeImageIndex]}
            />
          </div>
          <div className="grid grid-cols-5 gap-sm">
            {displayImages.map((img, idx) => (
              <div
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`aspect-square bg-surface-alt rounded overflow-hidden cursor-pointer transition-all ${
                  activeImageIndex === idx ? 'border-2 border-primary' : 'opacity-70 hover:opacity-100'
                }`}
              >
                <img alt={`${product.name} thumbnail ${idx + 1}`} className="w-full h-full object-cover" src={img} />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Details (45%) */}
        <div className="w-full lg:w-[45%] flex flex-col">
          <h1 className="font-headline-lg text-headline-lg md:font-headline-xl md:text-headline-xl text-primary mb-sm">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-xs mb-gutter">
            <div className="flex text-rating-gold">
              {Array.from({ length: 5 }).map((_, i) => {
                const ratingValue = product.averageRating || 5
                const isFilled = i < Math.floor(ratingValue)
                const isHalf = !isFilled && i < ratingValue
                return (
                  <span key={i} className="material-symbols-outlined text-[18px] fill-1">
                    {isFilled ? 'star' : isHalf ? 'star_half' : 'star_outline'}
                  </span>
                )
              })}
            </div>
            <span className="font-body-sm text-body-sm text-text-muted">
              ({product.averageRating.toFixed(1)} / 5.0)
            </span>
            <span className="text-text-muted text-[12px]">•</span>
            <span className="font-body-sm text-body-sm text-text-muted">
              Đã bán {product.totalSold}
            </span>
          </div>

          {/* Prices */}
          <div className="flex items-baseline gap-sm mb-sm">
            <span className="font-price-display text-[24px] font-bold text-on-error-container">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="font-price-display text-[16px] text-text-muted line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Promotion Tags */}
          <div className="flex flex-wrap gap-xs mb-gutter pb-gutter border-b border-border-subtle">
            <span className="inline-flex items-center px-2 py-1 border border-dashed border-on-error-container text-on-error-container font-label-caps text-[10px] rounded-sm bg-error-container/20">
              GIẢM 50K
            </span>
            <span className="inline-flex items-center px-2 py-1 border border-dashed border-success text-success font-label-caps text-[10px] rounded-sm bg-success/10">
              MIỄN PHÍ VẬN CHUYỂN
            </span>
          </div>

          {/* Color Selector */}
          {colors.length > 0 && (
            <div className="mb-gutter">
              <div className="flex justify-between items-end mb-sm">
                <span className="font-label-caps text-label-caps text-text-muted">
                  MÀU SẮC: <span className="text-primary font-bold ml-1">{selectedColor ? selectedColor.name.toUpperCase() : ''}</span>
                </span>
              </div>
              <div className="flex gap-sm">
                {colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color)}
                    style={{ backgroundColor: color.hex }}
                    className={`w-8 h-8 rounded-full border border-gray-300 focus:outline-none transition-all ${
                      selectedColor?.name === color.name ? 'ring-2 ring-offset-2 ring-primary' : 'hover:scale-105'
                    }`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size Selector */}
          {sizes.length > 0 && (
            <div className="mb-gutter">
              <div className="flex justify-between items-end mb-sm">
                <span className="font-label-caps text-label-caps text-text-muted">KÍCH CỠ:</span>
                <a className="font-body-sm text-body-sm text-primary underline underline-offset-2 hover:text-text-muted transition-colors" href="#">
                  Bảng quy đổi kích cỡ
                </a>
              </div>
              <div className="flex flex-wrap gap-sm">
                {sizes.map((size) => {
                  const isOutOfStock = isSizeOutOfStock(size)
                  return (
                    <button
                      key={size}
                      disabled={isOutOfStock}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 flex items-center justify-center rounded font-body-md transition-all ${
                        isOutOfStock
                          ? 'border border-border-subtle text-outline-variant bg-surface-container relative overflow-hidden cursor-not-allowed'
                          : selectedSize === size
                          ? 'border-2 border-primary font-bold text-primary'
                          : 'border border-border-subtle text-primary hover:border-primary'
                      }`}
                    >
                      {size}
                      {isOutOfStock && (
                        <div className="absolute inset-0 w-full h-[1px] bg-outline-variant top-1/2 -translate-y-1/2 rotate-45 origin-center" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Stock Display */}
          {currentVariant && (
            <div className="mb-gutter">
              <span className="font-body-sm text-body-sm text-text-muted">
                Tồn kho: <span className="font-bold text-primary">{currentVariant.stockQuantity} sản phẩm</span>
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-sm mb-gutter">
            <div className="flex border border-border-subtle rounded h-12 bg-transparent">
              <button
                onClick={handleQuantityDecrement}
                className="w-10 flex items-center justify-center text-text-muted hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">remove</span>
              </button>
              <input
                className="w-12 text-center border-none focus:ring-0 font-body-md bg-transparent p-0"
                type="text"
                readOnly
                value={quantity}
              />
              <button
                onClick={handleQuantityIncrement}
                className="w-10 flex items-center justify-center text-text-muted hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={addingToCartLocal || cartLoading || isOutOfStock}
              className="flex-grow bg-primary text-on-primary font-label-caps text-label-caps rounded hover:bg-opacity-90 hover:scale-[1.02] disabled:bg-opacity-50 disabled:cursor-not-allowed transition-all duration-200 h-12 flex items-center justify-center tracking-widest shadow-sm"
            >
              {isOutOfStock ? 'HẾT HÀNG' : (addingToCartLocal || cartLoading ? 'ĐANG THÊM...' : 'THÊM VÀO GIỎ HÀNG')}
            </button>
            <button
              onClick={handleWishlistToggle}
              className={`w-12 h-12 border rounded flex items-center justify-center transition-colors ${isWishlisted ? 'border-error text-error bg-error/5 hover:bg-error/10' : 'border-primary text-primary hover:bg-surface-alt'}`}
            >
              <span 
                className="material-symbols-outlined" 
                data-weight={isWishlisted ? 'fill' : undefined}
              >
                {isWishlisted ? 'favorite' : 'favorite_border'}
              </span>
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-col gap-xs py-sm border-t border-b border-border-subtle mb-lg">
            <div className="flex items-center gap-sm text-text-muted font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-[20px]">cycle</span>
              <span>15 ngày đổi trả miễn phí</span>
            </div>
            <div className="flex items-center gap-sm text-text-muted font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-[20px]">verified</span>
              <span>Hàng chính hãng 100%</span>
            </div>
          </div>

          {/* Accordions */}
          <div className="flex flex-col divide-y divide-border-subtle border-b border-border-subtle">
            <details className="group py-sm" open>
              <summary className="flex justify-between items-center font-headline-md text-[18px] cursor-pointer list-none">
                Mô tả sản phẩm
                <span className="material-symbols-outlined transform group-open:rotate-180 transition-transform duration-200">
                  expand_more
                </span>
              </summary>
              <div className="pt-sm text-text-muted font-body-sm text-body-sm space-y-xs">
                <p>{product.description}</p>
              </div>
            </details>
            <details className="group py-sm">
              <summary className="flex justify-between items-center font-headline-md text-[18px] cursor-pointer list-none">
                Chất liệu & Cách bảo quản
                <span className="material-symbols-outlined transform group-open:rotate-180 transition-transform duration-200">
                  expand_more
                </span>
              </summary>
              <div className="pt-sm text-text-muted font-body-sm text-body-sm">
                <p>
                  Chất liệu: {product.material}
                  <br />
                  Bảo quản: {product.careInstructions}
                </p>
              </div>
            </details>
            <details className="group py-sm">
              <summary className="flex justify-between items-center font-headline-md text-[18px] cursor-pointer list-none">
                Chính sách giao hàng
                <span className="material-symbols-outlined transform group-open:rotate-180 transition-transform duration-200">
                  expand_more
                </span>
              </summary>
              <div className="pt-sm text-text-muted font-body-sm text-body-sm">
                <p>Giao hàng tiêu chuẩn 2-4 ngày làm việc. Miễn phí vận chuyển cho đơn hàng từ 500.000₫.</p>
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {recommendedProducts.length > 0 && (
        <section className="mt-xl pt-lg border-t border-border-subtle">
          <h2 className="font-headline-md text-headline-md md:font-headline-lg md:text-headline-lg text-primary mb-lg text-center">
            SẢN PHẨM GỢI Ý
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
            {recommendedProducts.map((item) => (
              <Link key={item.id} to={`/product/${item.slug}`} className="group cursor-pointer">
                <div className="aspect-[3/4] bg-surface-alt rounded mb-sm overflow-hidden relative">
                  <img
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src={item.thumbnailUrl || 'https://placehold.co/400x500?text=No+Image'}
                  />
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-sm">
                    <button className="w-full bg-surface text-primary font-label-caps text-label-caps py-2 rounded shadow-sm opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-border-subtle">
                      MUA NGAY
                    </button>
                  </div>
                </div>
                <h3 className="font-body-md text-body-md text-primary mb-1 truncate">{item.name}</h3>
                <div className="flex items-baseline gap-2">
                  <p className={`font-price-display text-price-display ${item.salePrice ? 'text-on-error-container' : 'text-text-muted'}`}>
                    {formatPrice(item.salePrice || item.basePrice)}
                  </p>
                  {item.salePrice && (
                    <span className="text-text-muted text-[12px] line-through">
                      {formatPrice(item.basePrice)}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Reviews Section */}
      <section id="reviews" className="mt-xl pt-lg border-t border-border-subtle bg-[#FAFAF8] -mx-margin-mobile md:-mx-margin-desktop px-margin-mobile md:px-margin-desktop">
        <div className="max-w-container-max mx-auto py-lg">
          <h2 className="font-headline-md text-headline-md md:font-headline-lg md:text-headline-lg text-[#1A1A2E] mb-lg">
            ĐÁNH GIÁ SẢN PHẨM
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-xl mb-xl border-b border-border-subtle pb-xl">
            <div className="md:col-span-4 flex flex-col items-center justify-center text-center border-r border-border-subtle">
              <div className="text-[64px] font-bold text-[#1A1A2E] leading-none mb-2">4.8</div>
              <div className="flex text-[#C1272D] mb-2">
                {[1, 2, 3, 4].map((s) => (
                  <span key={s} className="material-symbols-outlined fill-1">star</span>
                ))}
                <span className="material-symbols-outlined">star_half</span>
              </div>
              <p className="font-body-sm text-[#1A1A2E] opacity-70">124 đánh giá & 45 nhận xét</p>
              <button className="mt-gutter bg-[#1A1A2E] text-white px-8 py-3 rounded font-label-caps text-label-caps hover:bg-[#C1272D] transition-colors">
                VIẾT ĐÁNH GIÁ
              </button>
            </div>
            <div className="md:col-span-8 flex flex-col justify-center gap-2">
              {[
                { label: '5 sao', width: '85%', count: 105 },
                { label: '4 sao', width: '12%', count: 15 },
                { label: '3 sao', width: '2%', count: 3 },
                { label: '2 sao', width: '1%', count: 1 },
                { label: '1 sao', width: '0%', count: 0 }
              ].map((r) => (
                <div key={r.label} className="flex items-center gap-4">
                  <span className="w-12 text-body-sm font-medium">{r.label}</span>
                  <div className="flex-grow h-2 bg-surface-container rounded-full overflow-hidden">
                    <div style={{ width: r.width }} className="h-full bg-[#C1272D]" />
                  </div>
                  <span className="w-12 text-body-sm text-right opacity-60">{r.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Review Filter */}
          <div className="flex flex-wrap gap-2 mb-lg items-center">
            <span className="text-body-sm font-bold mr-2">Lọc theo:</span>
            <button className="px-4 py-1.5 border border-[#1A1A2E] bg-[#1A1A2E] text-white text-body-sm rounded-full">
              Tất cả
            </button>
            <button className="px-4 py-1.5 border border-border-subtle hover:border-[#1A1A2E] text-body-sm rounded-full">
              5 Sao (105)
            </button>
            <button className="px-4 py-1.5 border border-border-subtle hover:border-[#1A1A2E] text-body-sm rounded-full">
              Có hình ảnh (45)
            </button>
          </div>

          {/* User Reviews List */}
          <div className="space-y-lg">
            <div className="bg-white p-gutter rounded-lg shadow-sm border border-border-subtle">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-sm">
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center font-bold text-[#1A1A2E]">
                    H
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1A1A2E]">Hoàng Nam</span>
                      <span className="flex items-center gap-1 text-success text-[10px] font-bold border border-success/30 px-1.5 py-0.5 rounded-full bg-success/5">
                        <span className="material-symbols-outlined text-[12px]">verified</span>
                        Đã mua hàng
                      </span>
                    </div>
                    <div className="flex text-[#C1272D] mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className="material-symbols-outlined text-[14px] fill-1">star</span>
                      ))}
                      <span className="text-body-sm text-text-muted ml-2 font-normal">15/05/2024</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <span className="text-body-sm text-text-muted">
                  Phân loại:{' '}
                  <span className="text-[#1A1A2E] font-medium">Beige / Size M</span>
                </span>
              </div>
              <p className="text-body-md text-[#1A1A2E] mb-4">
                Áo rất đẹp, chất vải dầy dặn và đứng form. Mình cao 1m75 nặng 68kg mặc size M rất vừa vặn. Màu beige sang trọng, dễ phối đồ.
              </p>
              <div className="bg-surface-container/50 p-4 rounded mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-body-sm text-[#C1272D]">CLOTHY Phản hồi:</span>
                </div>
                <p className="text-body-sm text-[#1A1A2E] opacity-80">
                  Chào bạn Nam, cảm ơn bạn đã ủng hộ CLOTHY. Rất vui vì bạn hài lòng với sản phẩm Blazer Premium lần này. Chúc bạn có những trải nghiệm tuyệt vời cùng sản phẩm nhé!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
