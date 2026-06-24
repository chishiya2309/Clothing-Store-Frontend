
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

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export interface ProductGridResponse {
    id: number;
    name: string;
    slug: string;
    thumbnailUrl: string | null;
    basePrice: number;
    salePrice: number | null;
    colors: string[];
}

export interface PageResponse<T> {
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    content: T[];
}

export interface ProductSearchParams {
    keyword?: string;
    categorySlug?: string;
    colors?: string[];
    sizes?: string[];
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    page?: number;
    size?: number;
}

export const productService = {
    getProductsByCategory: async (slug: string, page: number = 0, size: number = 12): Promise<PageResponse<ProductGridResponse>> => {
        const response = await axios.get(`${API_URL}/guest/categories/${slug}/products`, {
            params: { page, size }
        });
        return response.data.data;
    },

    searchProducts: async (params: ProductSearchParams): Promise<PageResponse<ProductGridResponse>> => {
        const response = await axios.get(`${API_URL}/guest/products/search`, {
            params: {
                keyword: params.keyword || undefined,
                categorySlug: params.categorySlug || undefined,
                colors: params.colors?.length ? params.colors : undefined,
                sizes: params.sizes?.length ? params.sizes : undefined,
                minPrice: params.minPrice ?? undefined,
                maxPrice: params.maxPrice ?? undefined,
                sortBy: params.sortBy || 'latest',
                page: params.page ?? 0,
                size: params.size ?? 12,
            },
            paramsSerializer: {
                indexes: null, // colors=black&colors=white instead of colors[0]=black
            }
        });
        return response.data.data;
    },

    getAutocomplete: async (keyword: string, limit: number = 5): Promise<ProductGridResponse[]> => {
        const response = await axios.get(`${API_URL}/guest/products/autocomplete`, {
            params: { keyword, limit }
        });
        return response.data.data;
    },

    getProductBySlug: async (slug: string): Promise<ProductDetailResponse> => {
        const response = await axios.get(`${API_URL}/products/${slug}`)
        return response.data.data
    },

    getRecommendedProducts: async (productId: number, limit: number = 4): Promise<ProductGridResponse[]> => {
        const response = await axios.get(`${API_URL}/guest/recommendations/product/${productId}`, {
            params: { limit }
        });
        return response.data.data;
    },

    getNewArrivals: async (): Promise<ProductGridResponse[]> => {
        const response = await axios.get(`${API_URL}/products/new-arrivals`);
        return response.data.data;
    },

    getBestSellers: async (limit: number = 4): Promise<ProductGridResponse[]> => {
        const response = await axios.get(`${API_URL}/guest/products/best-sellers`, {
            params: { limit }
        });
        return response.data.data;
    }
};
