import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export interface CategoryResponse {
    id: number;
    name: string;
    slug: string;
    description: string;
    displayOrder?: number;
    isActive?: boolean;
    children: CategoryResponse[];
}

export const categoryService = {
    getCategoryHierarchy: async (): Promise<CategoryResponse[]> => {
        const response = await axios.get(`${API_URL}/guest/categories`);
        return response.data.data;
    }
};
