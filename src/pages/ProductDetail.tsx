import { useParams, Link } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { useState, useEffect } from 'react'
import { productService } from '../services/product.service'
import type { ProductDetailResponse } from '../services/product.service'
import { useWishlistStore } from '../store/wishlistStore'
import { useAuthStore } from '../store/authStore'

interface ColorOption {
  name: string
  hex: string
}

interface ProductData {
  id: number
  name: string
  price: number
  originalPrice?: number
  description: string
  material: string
  care: string
  colors: ColorOption[]
  sizes: string[]
  images: string[]
  outOfStockSizes?: string[]
}

const PRODUCTS_REGISTRY: Record<string, ProductData> = {
  'ao-khoac-blazer-toi-gian-premium': {
    id: 1,
    name: 'Áo Khoác Blazer Tối Giản Premium',
    price: 890000,
    originalPrice: 1250000,
    description: 'Áo khoác blazer được thiết kế với phom dáng suông hiện đại, mang đậm tinh thần tối giản. Chất liệu vải premium giữ form tốt, ít nhăn và thoáng mát, phù hợp cho cả môi trường công sở và những buổi dạo phố.',
    material: '65% Polyester, 35% Viscose',
    care: 'Giặt khô hoặc giặt tay với nước lạnh. Tránh phơi trực tiếp dưới ánh nắng gắt.',
    colors: [
      { name: 'Xanh Navy', hex: '#1A1A2E' },
      { name: 'Đen', hex: '#222222' },
      { name: 'Trắng', hex: '#FFFFFF' }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBmfikCFCLeceG3Fu8Qt8Xw8R9lYE30urCn1IRKSpGEMpVen9kfWvBeUOg-bRB7ZnraX73VVGehQ9xVlVat7Uk-9rlgEOzVuvKJaJ-JkeACls_cJhqfkYWcxsFjGg0sMtrkKyMOeBK94OfzyZz4YI_AR4k6B12tqtuwHHUgXL2HAFO46eVdGdEWSJKkJd9o1hWO5nY6U_j9OEZ3gyCLLL1ya_FRz4gLo-jPkwDadaaAIsYO0fpbPM3KWpnj1h4MjfS1w-jX8CivDQ',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBPWbN5eGLemyV8CqJavIBh5SSm2zJZoGkB5mZ3dqybb90pOxFAJW5zh_pkmPSvm4KFxE5T42cx0CqBDTalk6hGXR0ySHE3Ofb0qWOpMwP1R9z7v9ehGpUMcWywWFf26JdyeJrXcXzwaH254jGSKT-ciSqONX8Pin5M1cLbMT_sGqhTy2_yOR0BIcPppIR5im2MXswbauVjRjfh2Mbag_A0LH_aHIzTIiWvY-tj9lGbtpRRVqZliZKvMbgv01Zsh5sKxzkcY2n1YQ',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuByMVAwr1uxAV92R2e-yjvlO-1IUFbZtsr0BuMJrygykkd3GH5GlXXo7GiR8Gg1x9ECHsue0Najn7h8QF13NvZwgF-rk7RrNEXS0M3h-aMaTSzEHzW1QaA2FrLs0hVvS5EP4ySO8j8Vch1BzuTnQxooW4lS8CmEJWGpX-owCdRSHRo-lGanz9q2qC3tWxh00QkDTlyMIOKPeBVSW1Qwi2FIKSD8wcGMPyEgdQXZ7yZ1z2i51kjbVN6moSy5B9vbgCHVgzi7qDhn-A',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCsnVyae3UYjPqIaZvGia10b4xuHnndl3KC9HdK1-AQrMfr5gQHXU9OQnQYwmnR135zgU37CcUnhvERBigXIR7Q5nrN46-mMJj4gDpztunRmeBt5tmrQM-lx-kvA8fRlMvsAXAj32r9yhi1LLD38n8uKjlbU3aHVjVcTMeFAMfRaVaXjGRaGTDzVGAQE3OFXr2EpR-_HUwlZpHmnUGUHW22x61Eu8GBVuoG8LeCDJlF0XNFPBg1UtIfOPpRvtZ3So7O60PzXPW_GQ'
    ]
  },
  'ao-thun-nam-basic-co-tron': {
    id: 4,
    name: 'Áo Thun Nam Basic Cổ Tròn',
    price: 169000,
    originalPrice: 199000,
    description: 'Áo thun nam basic cotton tự nhiên, form slim fit trẻ trung. Dễ phối đồ, phù hợp mọi dịp.',
    material: 'Cotton Compact 95%, Spandex 5%',
    care: 'Giặt máy ở 30°C, phơi trong bóng râm',
    colors: [
      { name: 'Trắng', hex: '#FFFFFF' },
      { name: 'Đen', hex: '#222222' },
      { name: 'Xám', hex: '#808080' }
    ],
    sizes: ['S', 'M', 'L'],
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDU1YD_jRWzG-eeFPY-iOWSeTYHRNZD7VTwB47HyCcL9Xu2J8xHzxGpI85YCKN3zv9go0cxe1pWNT28Ry7hkVKdtKhpr-b3Tkpb1iH5CkNYIdFJGjs_rHjKJ7yvd_Xaq8758Gg_v8P7DwgdUw7Kn2K7snZ8uoR-xrlMaJpsJ4KwbRHYCMtJld0FzY2LI_Dk2iRSbgBQBXgnS9JrbRPCVlFy8PPOWtN_opuVUK5NQlcpkihGgucW5DkfZYzWiLa0PuDKm4d1NtQZkw',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC4KayvDwNltCsEVtPK59-IOE348CPDXq7YAZsR44t9COGL34ZVEcL-_LDk1yZVqM9mMA67XTxY-AWet5mFXMfPFvtqPLqR4S0dI9Ju4cQ69Ky42XbwdfJhbHTMqdwRKI4HtNEtRbGbe_GyXvtKZP0AuDszvTPwHHxsOBV20Dtkr7B83jZANlb7UGv6ZVD1rvxFRcSnzeBSK9u4RYC2fXcwAK_x5SBHu2hfES_YfX8MKRcbYz4WvRR13l0oBzfPYhHy_O8ntB__Dw'
    ]
  },
  'quan-jeans-nam-slim-fit': {
    id: 9,
    name: 'Quần Jeans Nam Slim Fit',
    price: 480000,
    originalPrice: 550000,
    description: 'Quần jeans nam slim fit co giãn nhẹ, wash medium blue. Phom dáng chuẩn Hàn Quốc.',
    material: 'Cotton 98%, Elastane 2%',
    care: 'Giặt máy lộn trái, không tẩy, phơi trong bóng râm',
    colors: [
      { name: 'Xanh Medium', hex: '#4B6B94' }
    ],
    sizes: ['29', '30', '31', '32', '33'],
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC32V5AB3ro0thQgmNd4uaRL1kpC9n7-CgUqntAHAiR-Aub87r11XWasIH8yr_ncvTWMnaMsaN3cs-xujW0tSlEgJKrOlqrIsGOXKCH638_QaQH2bl-4UjNK86s7IflXpbOk_fAkbLleIit0Po7L0COdVnvOCFnfkB1j2Y3HlD9uqUqyWaot0y_-w1EEu52haCbM4tC77X0cL4slFo23pWI2RtHFHdoBmL_QjV5s-iSREqUezcX0yKC7iTTGLF7ApzGCLxWYreR2Q',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDn9JQl7cGWLkKkSKd966AF-Z7qN32dzbm1E__P2DPI7kO8rAI5_aE-kpwad3Q8WKzPTLZRecAQbTfqUBoS5jKlkroJ7ALFiTCP7NPFLPPtXKQfswQb4R6vACwstdIC9NbaX4TI-MNi1vHSsbuYJH0IHQocV9ucSIN7uXNJotpPOcuy0GtIvMbz9DYVXY2MRuArlxVWUDcYkUx1bDUTG77h9K01AlYkybYKHAdaPybBP1cPk6IS-t7Omb3bfngBK93pekILmcwAtA'
    ]
  },
  'ao-so-mi-nam-linen-casual': {
    id: 8,
    name: 'Áo Sơ Mi Nam Linen Casual',
    price: 520000,
    description: 'Áo sơ mi nam chất linen tự nhiên, thoáng mát cho mùa hè. Kiểu dáng regular fit thoải mái.',
    material: 'Linen 70%, Cotton 30%',
    care: 'Giặt tay nhẹ nhàng, phơi ngang',
    colors: [
      { name: 'Xanh Nhạt', hex: '#ADD8E6' },
      { name: 'Trắng', hex: '#FFFFFF' }
    ],
    sizes: ['M', 'L', 'XL'],
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBVbihwf9jARwC5ifZdwqzqAtNhntu3jQa5KHCTqW7pIWHf-pKW59h1mqr4YPXOm4G6KcStX0cpWjRGQ3oH_BRFdlj4BhjfLjL9HT6Psf2usVtCChhV735M-hOAIFIW0t7NmXP1vmiLrLHjFkfdc31pLP45_-OLOmY5j-6fCeAToi0HXjRo2XTZke_Dtz-Optmhrrfy8L0QzLfdjtnNnx5MupHRqWLcxaYYUlWbxFE-zfqKCD2wY9BNBEjk_75M5emIk_mQUwrihQ',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDytaKxiTWBlDvt6D-by9KItpeM5yii2ibEuUGNaUSBh4YsSasgb-l6UALUcbUysI6YP5KB9Z53ln6-FFGurBY6i9aG-9Huz-jJuH5n_0ANS6SRD75HniTRSJsPiNSxzEsjS7WtrNhshP3Oxe2vX75vxDK9wpx6YfF04tHsf0-Y0MVpNTDxaxwWhmjGGn0m_wcHbhJyrDHatMPPiOVDIjuiYasezqX1xwqW_NlAy3GT3i0uUd-2HCT899yUOIYlMVQRlm6oXhpYeQ'
    ]
  },
  'ao-thun-nu-baby-tee': {
    id: 14,
    name: 'Áo Thun Nữ Baby Tee',
    price: 149000,
    originalPrice: 180000,
    description: 'Áo thun nữ baby tee ôm form, chất cotton mềm mại. Hot trend 2026.',
    material: 'Cotton Combed 100%',
    care: 'Giặt máy ở 30°C, phơi trong bóng râm',
    colors: [
      { name: 'Hồng', hex: '#FFC0CB' },
      { name: 'Trắng', hex: '#FFFFFF' },
      { name: 'Đen', hex: '#222222' }
    ],
    sizes: ['S', 'M'],
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuClLtTuEKQvU9nHsESLZBty1dXE86Ss-enUG6TsBa5R7MF2E2bOU1ez73xzNSO1Rt_T-_G5qLvsVH7RlDMugH1b1ZeWJcmWLnfUJL_0R7QJQvgxbQymwLM57iLl0jeeWADEn5HyDF3_BWQ1AQ9c5dsJ0-U-ouXhXdE55ktDmaBMXXgkRaXk0FBjiHtQvXiipygkMkOLN70qLNZRwBBFwCmkHQPuts69wcqTjFpbV0oqJBux1hbXw7HjrnevqCNsG0qUcbz1AVOgkQ'
    ]
  },
  'ao-khoac-nu-denim': {
    id: 16,
    name: 'Áo Khoác Nữ Denim',
    price: 599000,
    originalPrice: 680000,
    description: 'Áo khoác jeans nữ classic, wash medium vintage. Oversize nhẹ thời trang.',
    material: 'Denim Cotton 100%',
    care: 'Giặt máy lộn trái, phơi trong bóng râm',
    colors: [
      { name: 'Xanh Medium', hex: '#4B6B94' }
    ],
    sizes: ['S', 'M', 'L'],
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDVOc7QIDQNuVr-3XppLOR1PT80ch_UCzXEbgbfcFq2y4ukWdhtk-B68oLTcaUd_cuMsMZdht8uv9o1YmJTkA5Ef9uaNyNwm9RI2tCV-Lrr8CY5IwiraFIa346yFEvLQLq3MeBgCRq3lBTKHPi_klf0se2aBviL18NIGczjsYh2VwKbMr-Fh7E67WDsOQIKgP3KS7eUeS_6JN7jAqr0l2x7sYFFYi5ul5oaw7EwixxoHOmHwUS0AM_xCeeQ8YsQ4nwUvqaS8W_hRg'
    ]
  },
  'ao-so-mi-nu-lua-co-v': {
    id: 17,
    name: 'Áo Sơ Mi Nữ Lụa Cổ V',
    price: 550000,
    originalPrice: 650000,
    description: 'Áo sơ mi nữ chất lụa cao cấp, cổ V thanh lịch. Phù hợp công sở và dạo phố.',
    material: 'Lụa tơ tằm pha 70%, Polyester 30%',
    care: 'Giặt tay nhẹ, ủi ở nhiệt độ thấp',
    colors: [
      { name: 'Kem', hex: '#FFFDD0' },
      { name: 'Đen', hex: '#222222' }
    ],
    sizes: ['S', 'M'],
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCVoG9XPJ0DN-eZyAGepAPaRykwpOxDIiPtKPc7CcDlcRWfvKFRYcBA7-EkrWMA0-CaXO_JPpwC3wLO32lGyqPmVf3PHg3C-nts5rm4DZ7LX1O1-2IALBlFDLngecgnWu3bQQpHUvCWkeQUHYbg1KalOI5U3y8k4wEfL6XSFTYdvIajtvx7l7dnHeTwr8SRkwpCmJplvlNoFYaGjKAU9NFaXujJi1midqzsJ5JAydPFLBe0FPxcSvK7vqgoiwFtFqnAxzOU7QOa7A'
    ]
  },
  'dam-lien-hoa-nhi-vintage': {
    id: 19,
    name: 'Đầm Liền Hoa Nhí Vintage',
    price: 499000,
    originalPrice: 580000,
    description: 'Đầm liền hoa nhí phong cách vintage, chất voan nhẹ nhàng nữ tính. Dáng xòe ngang gối.',
    material: 'Voan Chiffon 100%',
    care: 'Giặt tay, phơi trong bóng râm',
    colors: [
      { name: 'Hoa Nhí Xanh', hex: '#4682B4' },
      { name: 'Hoa Nhí Đỏ', hex: '#CD5C5C' }
    ],
    sizes: ['S', 'M', 'L'],
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBlKXVmOIon8rzTKdal-jG7UxJBzgPqEoDEaTP2ws3lGHP2doG3QgDEO3A9fK6Qjox6xEZJHvwIuQ9LhBnLoXtIhFs1L1m-mAO3mLs2ablPiT26ByY6BV27vrOc5tKJcfuhlBBQTFLpDwh8fWslDToFWMGQMBK0BdAOgqXeB-eD03VHJ06rFOkoZn9Yu4M_kakL-0xAXWsF85d2n2HKx_jpnWmMIv7igZ7BZXjZH0bu4Y764eM0NxBa74Vh6gJvdHs_HPr9mJ6rzw'
    ]
  }
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const addItem = useCartStore((state) => state.addItem)
  const cartLoading = useCartStore((state) => state.loading)

  // API State
  const [product, setProduct] = useState<ProductDetailResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

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
      <section className="mt-xl pt-lg border-t border-border-subtle">
        <h2 className="font-headline-md text-headline-md md:font-headline-lg md:text-headline-lg text-primary mb-lg text-center">
          SẢN PHẨM GỢI Ý
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
          {Object.keys(PRODUCTS_REGISTRY)
            .filter((k) => k !== slug)
            .slice(0, 4)
            .map((key) => {
              const item = PRODUCTS_REGISTRY[key]
              return (
                <Link key={key} to={`/product/${key}`} className="group cursor-pointer">
                  <div className="aspect-[3/4] bg-surface-alt rounded mb-sm overflow-hidden relative">
                    <img
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={item.images[0]}
                    />
                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-sm">
                      <button className="w-full bg-surface text-primary font-label-caps text-label-caps py-2 rounded shadow-sm opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-border-subtle">
                        MUA NGAY
                      </button>
                    </div>
                  </div>
                  <h3 className="font-body-md text-body-md text-primary mb-1 truncate">{item.name}</h3>
                  <p className="font-price-display text-price-display text-text-muted">{formatPrice(item.price)}</p>
                </Link>
              )
            })}
        </div>
      </section>

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
