import api from './api'

export interface ProductVariantResponse {
  id: number
  sku: string
  size: string
  color: string
  stockQuantity: number
  additionalPrice: number
}

export interface ProductImageResponse {
  imageUrl: string
  imageType: string
  displayOrder: number
  altText: string
}

export interface ProductDetailResponse {
  id: number
  name: string
  slug: string
  description: string
  material: string
  careInstructions: string
  price: number
  originalPrice: number | null
  averageRating: number
  totalSold: number
  categoryName: string
  categorySlug: string
  images: ProductImageResponse[]
  variants: ProductVariantResponse[]
}

export const productService = {
  getProductBySlug: async (slug: string): Promise<ProductDetailResponse> => {
    const response = await api.get(`/products/${slug}`)
    return response.data.data
  }
}
