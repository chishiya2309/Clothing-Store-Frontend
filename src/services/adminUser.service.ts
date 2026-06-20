import api from './api';

export interface AdminUserResponse {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  avatarUrl: string;
  role: 'customer' | 'staff' | 'admin';
  loyaltyPoints: number;
  membershipTierId: number | null;
  membershipTierName: string | null;
  authProvider: string;
  emailVerified: boolean;
  isActive: boolean;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable: any;
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: any;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export const adminUserService = {
  getUsers: async (page: number = 0, size: number = 10, keyword?: string, role?: string, isActive?: boolean) => {
    const params: Record<string, any> = { page, size };
    if (keyword) params.keyword = keyword;
    if (role) params.role = role;
    if (isActive !== undefined) params.isActive = isActive;
    
    const response = await api.get<{ data: PaginatedResponse<AdminUserResponse> }>('/admin/users', { params });
    return response.data.data;
  },

  updateUserStatus: async (id: number, isActive: boolean) => {
    const response = await api.patch<{ data: AdminUserResponse }>(`/admin/users/${id}/status`, null, {
      params: { isActive }
    });
    return response.data.data;
  },

  updateUserRole: async (id: number, role: 'customer' | 'staff' | 'admin') => {
    const response = await api.patch<{ data: AdminUserResponse }>(`/admin/users/${id}/role`, { role });
    return response.data.data;
  }
};
