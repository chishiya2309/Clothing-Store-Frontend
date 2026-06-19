import api from './api'

export interface UserProfileResponse {
  fullName: string
  email: string
  phone: string
  gender: 'male' | 'female' | 'other'
  dateOfBirth: string
  avatarUrl?: string
  loyaltyPoints?: number
  membershipTier?: string
}

export interface UpdateProfileRequest {
  fullName?: string
  phone?: string
  gender?: 'male' | 'female' | 'other'
  dateOfBirth?: string
}

export const profileService = {
  getProfile: async (): Promise<UserProfileResponse> => {
    const response = await api.get('/customer/profile')
    return response.data.data
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfileResponse> => {
    const response = await api.put('/customer/profile', data)
    return response.data.data
  }
}
