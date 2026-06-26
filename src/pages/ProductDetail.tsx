import { useParams, Link } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { useState, useEffect } from 'react'
import { productService } from '../services/product.service'
import type { ProductDetailResponse, ProductGridResponse } from '../services/product.service'
import { useWishlistStore } from '../store/wishlistStore'
import { useAuthStore } from '../store/authStore'
import { reviewService } from '../services/review.service'

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

  // Reviews state
  const [reviewSummary, setReviewSummary] = useState<any>(null)
  const [reviewFilter, setReviewFilter] = useState<{ rating?: number; withImages?: boolean }>({})
  const [reviewPage, setReviewPage] = useState(0)
  const [eligibleOrders, setEligibleOrders] = useState<any[]>([])
  const [showReviewForm, setShowReviewForm] = useState(
    new URLSearchParams(window.location.search).get('write-review') === 'true'
  )

  // Review Form state
  const [submitRating, setSubmitRating] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [submitContent, setSubmitContent] = useState<string>('')
  const [submitOrderId, setSubmitOrderId] = useState<number | ''>('')
  const [submitImages, setSubmitImages] = useState<string[]>([])
  const [newImageUrl, setNewImageUrl] = useState<string>('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null)
  const [uploadingImages, setUploadingImages] = useState<boolean>(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

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

  // Fetch reviews when product or filter change
  useEffect(() => {
    if (!product) return
    let isMounted = true
    reviewService.getProductReviews(product.id, {
      rating: reviewFilter.rating,
      withImages: reviewFilter.withImages,
      page: reviewPage,
      size: 5
    })
      .then((data) => {
        if (isMounted) {
          setReviewSummary(data)
        }
      })
      .catch((err) => {
        console.error('Error fetching product reviews:', err)
      })

    return () => {
      isMounted = false
    }
  }, [product?.id, reviewFilter, reviewPage])

  // Fetch eligible orders for review
  useEffect(() => {
    if (!product || !token) {
      setEligibleOrders([])
      return
    }
    let isMounted = true
    reviewService.getEligibleOrders(product.id)
      .then((data) => {
        if (isMounted) {
          setEligibleOrders(data)
          if (data.length > 0) {
            setSubmitOrderId(data[0].id)
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching eligible orders:', err)
      })

    return () => {
      isMounted = false
    }
  }, [product?.id, token])

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product || !submitOrderId) return
    if (submitContent.trim().length < 10) {
      alert('Nội dung đánh giá cần tối thiểu 10 ký tự.')
      return
    }
    setSubmittingReview(true)
    try {
      await reviewService.createReview({
        productId: product.id,
        orderId: Number(submitOrderId),
        rating: submitRating,
        content: submitContent,
        imageUrls: submitImages
      })
      alert('Gửi đánh giá thành công! Đánh giá đang được chờ kiểm duyệt.')
      setShowReviewForm(false)
      setSubmitContent('')
      setSubmitImages([])
      // Refresh eligible orders
      const orders = await reviewService.getEligibleOrders(product.id)
      setEligibleOrders(orders)
      if (orders.length > 0) {
        setSubmitOrderId(orders[0].id)
      } else {
        setSubmitOrderId('')
      }
      // Refresh reviews list
      const summary = await reviewService.getProductReviews(product.id, {
        rating: reviewFilter.rating,
        withImages: reviewFilter.withImages,
        page: reviewPage,
        size: 5
      })
      setReviewSummary(summary)
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá.')
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return
    if (submitImages.length >= 5) {
      alert('Tối đa chỉ được thêm 5 ảnh.')
      return
    }
    setSubmitImages([...submitImages, newImageUrl.trim()])
    setNewImageUrl('')
  }

  const handleRemoveImageUrl = (index: number) => {
    setSubmitImages(submitImages.filter((_, i) => i !== index))
  }

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (submitImages.length + files.length > 5) {
      alert('Tối đa chỉ được chọn 5 ảnh.')
      return
    }

    setUploadingImages(true)
    setUploadError(null)

    try {
      const uploadedUrls: string[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file.type.startsWith('image/')) {
          alert(`File ${file.name} không phải là hình ảnh.`)
          continue
        }
        if (file.size > 5 * 1024 * 1024) {
          alert(`File ${file.name} vượt quá dung lượng cho phép (tối đa 5MB).`)
          continue
        }

        const url = await reviewService.uploadImage(file)
        uploadedUrls.push(url)
      }

      setSubmitImages([...submitImages, ...uploadedUrls])
    } catch (err: any) {
      console.error(err)
      setUploadError(err.response?.data?.message || 'Có lỗi xảy ra khi tải ảnh lên.')
    } finally {
      setUploadingImages(false)
      e.target.value = ''
    }
  }

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
              {(() => {
                const displayRating = reviewSummary !== null ? (reviewSummary.averageRating || 0) : 0
                return Array.from({ length: 5 }).map((_, i) => {
                  const isFilled = i < Math.floor(displayRating)
                  const isHalf = !isFilled && i < displayRating
                  return (
                    <span 
                      key={i} 
                      className={`material-symbols-outlined text-[18px] ${isFilled ? 'fill-1' : ''}`}
                    >
                      {isFilled ? 'star' : isHalf ? 'star_half' : 'star'}
                    </span>
                  )
                })
              })()}
            </div>
            <span className="font-body-sm text-body-sm text-text-muted">
              ({(reviewSummary !== null ? (reviewSummary.averageRating || 0) : 0).toFixed(1)} / 5.0)
            </span>
            <span className="text-text-muted text-[12px]">•</span>
            <span className="font-body-sm text-body-sm text-text-muted">
              {reviewSummary !== null ? (reviewSummary.totalReviews || 0) : 0} đánh giá
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
              <div className="text-[64px] font-bold text-[#1A1A2E] leading-none mb-2">
                {reviewSummary?.averageRating?.toFixed(1) || '0.0'}
              </div>
              <div className="flex text-[#C1272D] mb-2">
                {(() => {
                  const rating = reviewSummary?.averageRating || 0
                  const fullStars = Math.floor(rating)
                  const halfStar = rating % 1 >= 0.3 && rating % 1 <= 0.8
                  return [...Array(5)].map((_, i) => {
                    if (i < fullStars) {
                      return <span key={i} className="material-symbols-outlined fill-1">star</span>
                    } else if (i === fullStars && halfStar) {
                      return <span key={i} className="material-symbols-outlined">star_half</span>
                    } else {
                      return <span key={i} className="material-symbols-outlined">star</span>
                    }
                  })
                })()}
              </div>
              <p className="font-body-sm text-[#1A1A2E] opacity-70">
                {reviewSummary?.totalReviews || 0} đánh giá đã được duyệt
              </p>
              
              {token ? (
                eligibleOrders.length > 0 ? (
                  <button 
                    onClick={() => setShowReviewForm(true)}
                    className="mt-gutter bg-[#1A1A2E] text-white px-8 py-3 rounded font-label-caps text-label-caps hover:bg-[#C1272D] transition-colors"
                  >
                    VIẾT ĐÁNH GIÁ
                  </button>
                ) : (
                  <div className="mt-gutter text-body-sm text-[#C1272D] font-medium bg-red-50 border border-red-200 p-3 rounded">
                    Bạn chưa có đơn hàng hoàn thành nào chưa đánh giá cho sản phẩm này.
                  </div>
                )
              ) : (
                <div className="mt-gutter text-body-sm text-text-muted">
                  Vui lòng <Link to="/login" className="text-[#C1272D] underline font-bold">Đăng nhập</Link> để viết đánh giá.
                </div>
              )}
            </div>
            
            <div className="md:col-span-8 flex flex-col justify-center gap-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = reviewSummary?.ratingDistribution?.[stars] || 0
                const total = reviewSummary?.totalReviews || 0
                const percent = total > 0 ? (count / total) * 100 : 0
                return (
                  <div key={stars} className="flex items-center gap-4">
                    <span className="w-12 text-body-sm font-medium">{stars} sao</span>
                    <div className="flex-grow h-2 bg-surface-container rounded-full overflow-hidden">
                      <div style={{ width: `${percent}%` }} className="h-full bg-[#C1272D]" />
                    </div>
                    <span className="w-12 text-body-sm text-right opacity-60">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Review Filter */}
          <div className="flex flex-wrap gap-2 mb-lg items-center">
            <span className="text-body-sm font-bold mr-2">Lọc theo:</span>
            <button 
              onClick={() => { setReviewFilter({}); setReviewPage(0); }}
              className={`px-4 py-1.5 border text-body-sm rounded-full transition-all ${
                !reviewFilter.rating && !reviewFilter.withImages
                  ? 'border-[#1A1A2E] bg-[#1A1A2E] text-white'
                  : 'border-border-subtle hover:border-[#1A1A2E] text-[#1A1A2E]'
              }`}
            >
              Tất cả ({reviewSummary?.totalReviews || 0})
            </button>
            {[5, 4, 3, 2, 1].map((s) => (
              <button 
                key={s}
                onClick={() => { setReviewFilter({ rating: s }); setReviewPage(0); }}
                className={`px-4 py-1.5 border text-body-sm rounded-full transition-all ${
                  reviewFilter.rating === s
                    ? 'border-[#1A1A2E] bg-[#1A1A2E] text-white'
                    : 'border-border-subtle hover:border-[#1A1A2E] text-[#1A1A2E]'
                }`}
              >
                {s} Sao ({reviewSummary?.ratingDistribution?.[s] || 0})
              </button>
            ))}
            <button 
              onClick={() => { setReviewFilter({ withImages: true }); setReviewPage(0); }}
              className={`px-4 py-1.5 border text-body-sm rounded-full transition-all ${
                reviewFilter.withImages
                  ? 'border-[#1A1A2E] bg-[#1A1A2E] text-white'
                  : 'border-border-subtle hover:border-[#1A1A2E] text-[#1A1A2E]'
              }`}
            >
              Có hình ảnh
            </button>
          </div>

          {/* User Reviews List */}
          <div className="space-y-lg">
            {reviewSummary?.reviews?.content?.length > 0 ? (
              reviewSummary.reviews.content.map((r: any) => (
                <div key={r.id} className="bg-white p-gutter rounded-lg shadow-sm border border-border-subtle">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-sm">
                      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center font-bold text-[#1A1A2E]">
                        {r.reviewerName ? r.reviewerName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1A1A2E]">{r.reviewerName}</span>
                          <span className="flex items-center gap-1 text-success text-[10px] font-bold border border-success/30 px-1.5 py-0.5 rounded-full bg-success/5">
                            <span className="material-symbols-outlined text-[12px]">verified</span>
                            Đã mua hàng
                          </span>
                        </div>
                        <div className="flex text-[#C1272D] mt-1">
                          {[...Array(5)].map((_, i) => (
                            <span 
                              key={i} 
                              className={`material-symbols-outlined text-[14px] ${i < r.rating ? 'fill-1' : ''}`}
                            >
                              star
                            </span>
                          ))}
                          <span className="text-body-sm text-text-muted ml-2 font-normal">
                            {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {r.variantInfo && (
                    <div className="mb-4">
                      <span className="text-body-sm text-text-muted">
                        Phân loại:{' '}
                        <span className="text-[#1A1A2E] font-medium">{r.variantInfo}</span>
                      </span>
                    </div>
                  )}
                  <p className="text-body-md text-[#1A1A2E] mb-4">{r.content}</p>
                  
                  {/* Attached Images */}
                  {r.imageUrls && r.imageUrls.length > 0 && (
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {r.imageUrls.map((url: string, index: number) => (
                        <img 
                          key={index} 
                          src={url} 
                          alt={`review-img-${index}`} 
                          onClick={() => setZoomImageUrl(url)}
                          className="w-20 h-20 object-cover rounded border border-border-subtle cursor-zoom-in hover:opacity-90 transition-opacity"
                        />
                      ))}
                    </div>
                  )}

                  {/* Admin Reply */}
                  {r.adminReply && (
                    <div className="bg-surface-container/50 p-4 rounded mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-body-sm text-[#C1272D]">CLOTHY Phản hồi:</span>
                        {r.repliedAt && (
                          <span className="text-[10px] text-text-muted">
                            ({new Date(r.repliedAt).toLocaleDateString('vi-VN')})
                          </span>
                        )}
                      </div>
                      <p className="text-body-sm text-[#1A1A2E] opacity-80">{r.adminReply}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-xl bg-white rounded-lg border border-border-subtle">
                <span className="material-symbols-outlined text-[48px] text-text-muted mb-2">rate_review</span>
                <p className="text-text-muted">Chưa có đánh giá nào cho sản phẩm này.</p>
              </div>
            )}

            {/* Pagination */}
            {reviewSummary?.reviews?.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-lg">
                {[...Array(reviewSummary.reviews.totalPages)].map((_, pageIdx) => (
                  <button
                    key={pageIdx}
                    onClick={() => setReviewPage(pageIdx)}
                    className={`w-8 h-8 rounded-full border text-body-sm transition-all ${
                      reviewPage === pageIdx
                        ? 'bg-[#1A1A2E] text-white border-[#1A1A2E]'
                        : 'border-border-subtle hover:border-[#1A1A2E] text-[#1A1A2E]'
                    }`}
                  >
                    {pageIdx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Write Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center p-gutter border-b border-border-subtle">
              <h3 className="font-headline-sm text-headline-sm text-[#1A1A2E]">Viết Đánh Giá Sản Phẩm</h3>
              <button 
                onClick={() => setShowReviewForm(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-[#1A1A2E]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {eligibleOrders.length === 0 ? (
              <div className="p-gutter text-center space-y-4">
                <div className="w-12 h-12 bg-red-50 text-[#C1272D] rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[24px]">info</span>
                </div>
                <p className="text-body-sm text-[#1A1A2E] font-medium leading-relaxed">
                  Bạn không có đơn hàng nào ở trạng thái <strong>Hoàn thành</strong> mà chưa đánh giá cho sản phẩm này.
                </p>
                <div className="pt-4 border-t border-border-subtle flex justify-end">
                  <button
                    onClick={() => setShowReviewForm(false)}
                    className="bg-[#1A1A2E] text-white px-6 py-2 rounded font-label-caps text-label-caps hover:bg-[#C1272D] transition-colors text-xs"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="p-gutter space-y-gutter">
                <div>
                  <label className="block text-body-sm font-bold text-[#1A1A2E] mb-2">Chọn đơn hàng chứa sản phẩm này *</label>
                  <select
                    value={submitOrderId}
                    onChange={(e) => setSubmitOrderId(Number(e.target.value))}
                    required
                    className="w-full border border-border-subtle rounded px-3 py-2 bg-white"
                  >
                    {eligibleOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        Đơn #{o.orderCode} (Ngày mua: {new Date(o.createdAt).toLocaleDateString('vi-VN')})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-body-sm font-bold text-[#1A1A2E] mb-2">Số sao đánh giá *</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const activeRating = hoverRating !== null ? hoverRating : submitRating
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setSubmitRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          className="text-[#C1272D] hover:scale-120 transition-transform duration-150"
                        >
                          <span className={`material-symbols-outlined text-[32px] ${star <= activeRating ? 'fill-1' : ''}`}>
                            star
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-body-sm font-bold text-[#1A1A2E] mb-2">Nội dung đánh giá *</label>
                  <textarea
                    value={submitContent}
                    onChange={(e) => setSubmitContent(e.target.value)}
                    placeholder="Chia sẻ nhận xét của bạn về chất lượng sản phẩm, kích thước, chất vải..."
                    required
                    rows={4}
                    className="w-full border border-border-subtle rounded p-3 text-body-md"
                  />
                  <span className="text-body-xs text-text-muted">
                    Tối thiểu 10 ký tự. Hiện có: {submitContent.trim().length} ký tự.
                  </span>
                </div>

                <div>
                  <label className="block text-body-sm font-bold text-[#1A1A2E] mb-2">Hình ảnh sản phẩm (Tùy chọn, tối đa 5 ảnh)</label>
                  
                  {/* Image Previews */}
                  <div className="flex gap-3 mb-3 flex-wrap">
                    {submitImages.map((imgUrl, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-lg border border-border-subtle overflow-hidden shadow-sm hover:scale-105 transition-transform">
                        <img src={imgUrl} alt="review-submit-preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImageUrl(idx)}
                          className="absolute top-0 right-0 w-6 h-6 bg-red-600 text-white rounded-bl flex items-center justify-center hover:bg-red-700 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    ))}
                    {uploadingImages && (
                      <div className="w-20 h-20 rounded-lg border border-dashed border-[#1A1A2E] flex flex-col items-center justify-center bg-surface-container animate-pulse">
                        <span className="material-symbols-outlined animate-spin text-[#1A1A2E] text-[24px]">sync</span>
                        <span className="text-[10px] text-text-muted mt-1">Uploading...</span>
                      </div>
                    )}
                  </div>

                  {/* Upload input and trigger */}
                  <div className="space-y-2">
                    <input
                      type="file"
                      id="review-image-file-input"
                      accept="image/*"
                      multiple
                      onChange={handleImageFileChange}
                      disabled={uploadingImages || submitImages.length >= 5}
                      className="hidden"
                    />
                    <label
                      htmlFor="review-image-file-input"
                      className={`flex flex-col items-center justify-center border-2 border-dashed border-border-subtle hover:border-[#1A1A2E] rounded-lg p-6 cursor-pointer bg-surface-container/20 transition-all ${
                        uploadingImages || submitImages.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <span className="material-symbols-outlined text-[32px] text-text-muted mb-1">
                        add_photo_alternate
                      </span>
                      <span className="text-body-sm font-bold text-[#1A1A2E]">
                        Chọn ảnh từ thiết bị của bạn ({submitImages.length}/5)
                      </span>
                      <span className="text-[11px] text-text-muted mt-1">
                        Hỗ trợ JPG, PNG, WEBP (tối đa 5MB)
                      </span>
                    </label>

                    {uploadError && (
                      <div className="text-body-xs text-[#C1272D] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">error</span>
                        {uploadError}
                      </div>
                    )}

                    <div className="text-center py-2 flex items-center gap-2">
                      <div className="h-px bg-border-subtle flex-grow" />
                      <span className="text-body-xs text-text-muted">Hoặc dùng liên kết ảnh</span>
                      <div className="h-px bg-border-subtle flex-grow" />
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="Dán link ảnh (URL)..."
                        className="flex-grow border border-border-subtle rounded px-3 py-1.5 text-body-sm"
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="bg-[#1A1A2E] text-white px-4 py-1.5 rounded text-body-sm font-bold hover:bg-[#C1272D] transition-colors"
                      >
                        Thêm
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-sm border-t border-border-subtle flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="border border-border-subtle text-[#1A1A2E] px-6 py-2.5 rounded font-label-caps text-label-caps hover:bg-surface-container transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="bg-[#1A1A2E] text-white px-6 py-2.5 rounded font-label-caps text-label-caps hover:bg-[#C1272D] transition-colors disabled:opacity-50"
                  >
                    {submittingReview ? 'Đang gửi...' : 'Gửi Đánh Giá'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Zoom Image Modal */}
      {zoomImageUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 cursor-zoom-out"
          onClick={() => setZoomImageUrl(null)}
        >
          <img 
            src={zoomImageUrl} 
            alt="Zoomed Review" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scale-up"
          />
        </div>
      )}
    </main>
  )
}
