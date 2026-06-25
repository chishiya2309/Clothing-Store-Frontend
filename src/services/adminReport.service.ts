import api from './api';

export interface RevenueReportResponse {
  date: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  totalDiscounts: number;
  netRevenue: number;
}

export interface BestsellerReportResponse {
  productId: number;
  productName: string;
  categoryName: string;
  totalQuantitySold: number;
  totalRevenue: number;
}

export interface LoyaltyCustomerReportResponse {
  userId: number;
  fullName: string;
  email: string;
  membershipTier: string;
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
}

export const adminReportService = {
  getRevenueReport: async (startDate: string, endDate: string): Promise<RevenueReportResponse[]> => {
    const response = await api.get<{ data: RevenueReportResponse[] }>('/admin/reports/revenue', {
      params: { startDate, endDate }
    });
    return response.data.data;
  },

  getBestsellerReport: async (startDate: string, endDate: string): Promise<BestsellerReportResponse[]> => {
    const response = await api.get<{ data: BestsellerReportResponse[] }>('/admin/reports/bestsellers', {
      params: { startDate, endDate }
    });
    return response.data.data;
  },

  getLoyaltyReport: async (startDate: string, endDate: string): Promise<LoyaltyCustomerReportResponse[]> => {
    const response = await api.get<{ data: LoyaltyCustomerReportResponse[] }>('/admin/reports/loyalty', {
      params: { startDate, endDate }
    });
    return response.data.data;
  },

  exportRevenueReport: async (startDate: string, endDate: string): Promise<Blob> => {
    const response = await api.get('/admin/reports/revenue/export', {
      params: { startDate, endDate },
      responseType: 'blob'
    });
    return response.data;
  },

  exportBestsellerReport: async (startDate: string, endDate: string): Promise<Blob> => {
    const response = await api.get('/admin/reports/bestsellers/export', {
      params: { startDate, endDate },
      responseType: 'blob'
    });
    return response.data;
  },

  exportLoyaltyReport: async (startDate: string, endDate: string): Promise<Blob> => {
    const response = await api.get('/admin/reports/loyalty/export', {
      params: { startDate, endDate },
      responseType: 'blob'
    });
    return response.data;
  }
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
};
