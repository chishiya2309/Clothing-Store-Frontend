import api from './api';

export interface StaffProductListItem {
  id: number;
  name: string;
  slug: string;
  basePrice: number;
  salePrice: number | null;
  isActive: boolean;
  isFeatured: boolean;
  categoryName: string;
  totalSold: number;
  totalStock: number;
  thumbnailUrl?: string;
}

export interface StaffVariantDto {
  id?: number;
  sku: string;
  size: string;
  color: string;
  stockQuantity: number;
  additionalPrice: number;
}

export interface StaffImageDto {
  imageUrl: string;
  imageType: 'main' | 'gallery';
  displayOrder: number;
  altText?: string;
}

export interface StaffProductDetail {
  id: number;
  name: string;
  slug: string;
  description: string;
  material: string;
  careInstructions: string;
  basePrice: number;
  salePrice: number | null;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: number;
  variants: StaffVariantDto[];
  images: StaffImageDto[];
}

export interface StaffCreateProductRequest {
  name: string;
  description: string;
  material: string;
  careInstructions: string;
  basePrice: number;
  salePrice: number | null;
  categoryId: number;
  isFeatured: boolean;
  isActive: boolean;
  variants: StaffVariantDto[];
  images: StaffImageDto[];
}

export interface StaffCategoryNode {
  id: number;
  name: string;
  slug: string;
  description: string;
  parentId: number | null;
  displayOrder: number;
  children: StaffCategoryNode[];
}

export interface StaffVoucherResponse {
  id: number;
  code: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  startDate: string;
  endDate: string;
  usageLimit: number;
  timesUsed: number;
  isActive: boolean;
}

export interface StaffOrderListItem {
  id: number;
  orderCode: string;
  customerName: string;
  createdAt: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
}

export interface StaffOrderDetail {
  id: number;
  orderCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingProvince: string;
  shippingDistrict: string;
  shippingWard: string;
  shippingFee: number;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: number;
    productName: string;
    productImage: string | null;
    size: string;
    color: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  statusHistory: Array<{
    id: number;
    status: string;
    note: string | null;
    createdAt: string;
  }>;
}

export interface StaffInventoryReportItem {
  productCode: string;
  productName: string;
  variantId: number;
  sku: string;
  variantInfo: string;
  stockQuantity: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface StaffCollectionResponse {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  bannerUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  statusState: string;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface StaffReviewResponse {
  id: number;
  reviewerName: string;
  reviewerEmail: string;
  productName: string;
  productSku: string;
  rating: number;
  content: string;
  imageUrls: string[];
  adminReply: string | null;
  repliedAt: string | null;
  isApproved: boolean;
  isActive: boolean;
  isFlagged: boolean;
  flagReason: string | null;
  deleteReason: string | null;
  createdAt: string;
}

export const staffService = {
  // PRODUCTS
  getProducts: async (params: {
    keyword?: string;
    categoryId?: number;
    status?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  }) => {
    const res = await api.get('/staff/products', { params });
    return res.data.data;
  },

  getProduct: async (id: number): Promise<StaffProductDetail> => {
    const res = await api.get(`/staff/products/${id}`);
    return res.data.data;
  },

  createProduct: async (data: StaffCreateProductRequest) => {
    const res = await api.post('/staff/products', data);
    return res.data.data;
  },

  updateProduct: async (id: number, data: Partial<StaffCreateProductRequest>) => {
    const res = await api.put(`/staff/products/${id}`, data);
    return res.data.data;
  },

  deleteProduct: async (id: number) => {
    const res = await api.delete(`/staff/products/${id}`);
    return res.data;
  },

  updateVisibility: async (id: number, isActive: boolean) => {
    const res = await api.patch(`/staff/products/${id}/visibility`, { isActive });
    return res.data.data;
  },

  updateStock: async (productId: number, variantId: number, stockQuantity: number) => {
    const res = await api.patch(`/staff/products/${productId}/variants/${variantId}/stock`, { stockQuantity });
    return res.data.data;
  },

  uploadProductImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/staff/products/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.data;
  },

  // CATEGORIES
  getCategoryHierarchy: async (): Promise<StaffCategoryNode[]> => {
    const res = await api.get('/staff/categories/hierarchy');
    return res.data.data;
  },

  createCategory: async (data: { name: string; description?: string; parentId?: number | null; displayOrder?: number }) => {
    const res = await api.post('/staff/categories', data);
    return res.data.data;
  },

  updateCategory: async (id: number, data: { name: string; description?: string; parentId?: number | null; displayOrder?: number }) => {
    const res = await api.put(`/staff/categories/${id}`, data);
    return res.data.data;
  },

  deleteCategory: async (id: number) => {
    const res = await api.delete(`/staff/categories/${id}`);
    return res.data;
  },

  // COLLECTIONS
  getCollections: async (params?: { page?: number; size?: number; keyword?: string }) => {
    const res = await api.get('/staff/collections', { params });
    return res.data.data;
  },

  createCollection: async (data: any) => {
    const res = await api.post('/staff/collections', data);
    return res.data.data;
  },

  updateCollection: async (id: number, data: any) => {
    const res = await api.put(`/staff/collections/${id}`, data);
    return res.data.data;
  },

  deleteCollection: async (id: number) => {
    const res = await api.delete(`/staff/collections/${id}`);
    return res.data;
  },

  // VOUCHERS
  getVouchers: async (): Promise<StaffVoucherResponse[]> => {
    const res = await api.get('/staff/vouchers');
    return res.data.data;
  },

  getVoucher: async (id: number): Promise<StaffVoucherResponse> => {
    const res = await api.get(`/staff/vouchers/${id}`);
    return res.data.data;
  },

  createVoucher: async (data: any) => {
    const res = await api.post('/staff/vouchers', data);
    return res.data.data;
  },

  updateVoucher: async (id: number, data: any) => {
    const res = await api.put(`/staff/vouchers/${id}`, data);
    return res.data.data;
  },

  deleteVoucher: async (id: number) => {
    const res = await api.delete(`/staff/vouchers/${id}`);
    return res.data;
  },

  // ORDERS
  getOrders: async (params: {
    status?: string;
    fromDate?: string;
    toDate?: string;
    keyword?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  }) => {
    const res = await api.get('/staff/orders', { params });
    return res.data.data;
  },

  getOrderDetail: async (orderCode: string): Promise<StaffOrderDetail> => {
    const res = await api.get(`/staff/orders/${orderCode}`);
    return res.data.data;
  },

  confirmOrder: async (orderCode: string): Promise<StaffOrderDetail> => {
    const res = await api.patch(`/staff/orders/${orderCode}/confirm`);
    return res.data.data;
  },

  shipOrder: async (orderCode: string): Promise<StaffOrderDetail> => {
    const res = await api.patch(`/staff/orders/${orderCode}/ship`);
    return res.data.data;
  },

  completeOrder: async (orderCode: string, data: { paymentMethod?: string; note?: string }): Promise<StaffOrderDetail> => {
    const res = await api.patch(`/staff/orders/${orderCode}/complete`, data);
    return res.data.data;
  },

  cancelOrder: async (orderCode: string, data: { reason: string }): Promise<StaffOrderDetail> => {
    const res = await api.patch(`/staff/orders/${orderCode}/cancel`, data);
    return res.data.data;
  },

  // INVENTORY REPORT
  getInventoryReport: async (params: {
    status?: string;
    categoryId?: number;
    keyword?: string;
    page?: number;
    size?: number;
    sortBy?: string;
  }) => {
    const res = await api.get('/staff/reports/inventory', { params });
    return res.data.data;
  },

  exportInventoryReportUrl: (params: {
    status?: string;
    categoryId?: number;
    keyword?: string;
    sortBy?: string;
  }) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.categoryId) query.append('categoryId', String(params.categoryId));
    if (params.keyword) query.append('keyword', params.keyword);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
    return `${baseURL}/staff/reports/inventory/export?${query.toString()}`;
  },

  // REVIEWS
  getReviews: async (params: { tab?: string; page?: number; size?: number }) => {
    const res = await api.get('/staff/reviews', { params });
    return res.data.data;
  },

  approveReview: async (id: number): Promise<StaffReviewResponse> => {
    const res = await api.put(`/staff/reviews/${id}/approve`);
    return res.data.data;
  },

  replyReview: async (id: number, replyContent: string): Promise<StaffReviewResponse> => {
    const res = await api.put(`/staff/reviews/${id}/reply`, { replyText: replyContent });
    return res.data.data;
  },

  deleteReview: async (id: number, reason: string): Promise<StaffReviewResponse> => {
    const res = await api.put(`/staff/reviews/${id}/delete`, { reason });
    return res.data.data;
  }
};
