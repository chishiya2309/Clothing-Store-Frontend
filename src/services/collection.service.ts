import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export interface CollectionResponse {
    id: number;
    name: string;
    slug: string;
    description: string;
    bannerUrl: string;
}

export const collectionService = {
    getCollectionBySlug: async (slug: string): Promise<CollectionResponse> => {
        const response = await axios.get(`${API_URL}/guest/collections/${slug}`);
        return response.data.data;
    },
    getActiveCollections: async (): Promise<CollectionResponse[]> => {
        const response = await axios.get(`${API_URL}/guest/collections`);
        return response.data.data;
    }
};
