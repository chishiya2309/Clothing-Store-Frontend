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
    }
};
