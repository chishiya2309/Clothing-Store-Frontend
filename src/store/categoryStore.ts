import { create } from 'zustand';
import { categoryService, type CategoryResponse } from '../services/category.service';

interface CategoryState {
    categories: CategoryResponse[];
    isLoading: boolean;
    error: string | null;
    fetchCategories: () => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
    categories: [],
    isLoading: false,
    error: null,
    fetchCategories: async () => {
        // Only fetch if empty to act as a simple frontend cache
        if (get().categories.length > 0) return;
        
        set({ isLoading: true, error: null });
        try {
            const data = await categoryService.getCategoryHierarchy();
            set({ categories: data, isLoading: false });
        } catch (error: any) {
            set({ error: error.message || 'Failed to fetch categories', isLoading: false });
        }
    }
}));
