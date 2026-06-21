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

export interface ChangePasswordRequest {
  oldPassword?: string
  newPassword?: string
  confirmNewPassword?: string
}

export interface MembershipTierDto {
  name: string
  minPoints: number
  discountPercent: number
  description: string | null
}

export interface MembershipInfoResponse {
  loyaltyPoints: number
  currentTierName: string | null
  currentTierDiscount: number
  currentTierDescription: string | null
  nextTierName: string | null
  pointsNeededForNextTier: number | null
  allTiers: MembershipTierDto[]
}

export const profileService = {
  getProfile: async (): Promise<UserProfileResponse> => {
    const response = await api.get('/customer/profile')
    return response.data.data
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfileResponse> => {
    const response = await api.put('/customer/profile', data)
    return response.data.data
  },

  changePassword: async (data: ChangePasswordRequest) => {
    const response = await api.put<{ message: string }>('/customer/profile/password', data)
    return response.data
  },

  getMembershipInfo: async (): Promise<MembershipInfoResponse> => {
    const response = await api.get('/customer/profile/membership')
    return response.data.data
  }
}
