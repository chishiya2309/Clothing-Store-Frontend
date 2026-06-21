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
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    content: T[];
}

export const productService = {
    getProductsByCategory: async (slug: string, page: number = 0, size: number = 12): Promise<PageResponse<ProductGridResponse>> => {
        const response = await axios.get(`${API_URL}/guest/categories/${slug}/products`, {
            params: { page, size }
        });
        return response.data.data;
    }
};
