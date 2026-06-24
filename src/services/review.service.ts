import api from './api';
import type { PageResponse } from './product.service';

export interface ReviewResponse {
  id: number;
  reviewerName: string;
  rating: number;
  content: string;
  variantInfo: string;
  adminReply?: string;
  repliedAt?: string;
  createdAt: string;
  imageUrls: string[];
}

export interface ProductReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  reviews: PageResponse<ReviewResponse>;
}

export interface CreateReviewRequest {
  productId: number;
  orderId: number;
  rating: number;
  content: string;
  imageUrls?: string[];
}

export interface EligibleOrderResponse {
  id: number;
  orderCode: string;
  createdAt: string;
}

export const reviewService = {
  getProductReviews: async (
    productId: number,
    params?: { rating?: number; withImages?: boolean; page?: number; size?: number }
  ): Promise<ProductReviewSummary> => {
    const response = await api.get(`/products/${productId}/reviews`, { params });
    return response.data.data;
  },

  canReview: async (productId: number): Promise<boolean> => {
    const response = await api.get('/customer/reviews/can-review', { params: { productId } });
    return response.data.data;
  },

  getEligibleOrders: async (productId: number): Promise<EligibleOrderResponse[]> => {
    const response = await api.get('/customer/reviews/eligible-orders', { params: { productId } });
    return response.data.data;
  },

  createReview: async (data: CreateReviewRequest): Promise<void> => {
    await api.post('/customer/reviews', data);
  },

  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/customer/reviews/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
};
