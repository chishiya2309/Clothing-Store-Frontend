import api from './api';
import type { PageResponse } from './product.service';

export type OrderStatus = 'pending' | 'processing' | 'shipping' | 'completed' | 'cancelled';

export interface OrderProductImage {
    imageUrl: string | null;
    productName: string;
}

export interface OrderHistoryItem {
    id: number;
    orderCode: string;
    totalAmount: number;
    discountAmount: number;
    status: OrderStatus;
    createdAt: string;
    itemCount: number;
    productImages: OrderProductImage[];
}

export interface OrderDetailItem {
    id: number;
    productName: string;
    variantInfo: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    imageUrl: string | null;
    productSlug: string;
}

export interface OrderDetail {
    id: number;
    orderCode: string;
    subtotal: number;
    shippingFee: number;
    discountAmount: number;
    totalAmount: number;
    status: OrderStatus;
    createdAt: string;
    note: string | null;
    shippingName: string;
    shippingPhone: string;
    shippingProvince: string;
    shippingDistrict: string;
    shippingWard: string;
    shippingAddress: string;
    paymentMethod?: string;
    paymentStatus?: string;
    items: OrderDetailItem[];
}

export const orderService = {
    getOrders: async (
        page: number = 0,
        size: number = 10,
        status?: OrderStatus
    ): Promise<PageResponse<OrderHistoryItem>> => {
        const response = await api.get('/customer/orders', {
            params: { page, size, status: status || undefined },
        });
        return response.data.data;
    },

    getOrderDetail: async (orderCode: string): Promise<OrderDetail> => {
        const response = await api.get(`/customer/orders/${orderCode}`);
        return response.data.data;
    },

    cancelOrder: async (orderCode: string): Promise<void> => {
        await api.post(`/customer/orders/${orderCode}/cancel`);
    },
};
