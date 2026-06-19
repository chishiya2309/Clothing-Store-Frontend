import React, { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { profileService, type UserProfileResponse } from '@/services/profile.service'

type ContextType = {
  profile: UserProfileResponse | null
  setProfile: (profile: UserProfileResponse) => void
}

export default function Profile() {
  const { profile, setProfile } = useOutletContext<ContextType>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    gender: 'male',
    dateOfBirth: ''
  })

  // Update local form state when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        email: profile.email || '',
        gender: profile.gender || 'male',
        dateOfBirth: profile.dateOfBirth || ''
      })
    }
  }, [profile])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const updatedProfile = await profileService.updateProfile({
        fullName: formData.fullName,
        phone: formData.phone,
        gender: formData.gender as 'male' | 'female' | 'other',
        dateOfBirth: formData.dateOfBirth
      })
      setProfile(updatedProfile)
      setSuccess('Cập nhật thông tin thành công')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1 className="font-headline-lg text-headline-lg md:font-headline-xl md:text-headline-xl text-primary mb-xl">
        Thông tin tài khoản
      </h1>
      <div className="space-y-xl">
        {/* Loyalty Points */}
        <div className="flex items-center gap-6 pb-lg border-b border-border-subtle">
          <div className="flex flex-col">
            <span className="text-on-surface-variant font-label-caps text-label-caps mb-2">Điểm tích lũy</span>
            <div className="flex items-end gap-2">
              <span className="font-headline-xl text-headline-xl text-primary">{profile?.loyaltyPoints || 0}</span>
              <span className="text-on-surface-variant font-body-sm text-body-sm mb-1">điểm</span>
            </div>
          </div>
        </div>

        {/* Personal Info Form */}
        <form className="space-y-lg" onSubmit={handleSubmit}>
          {error && <div className="text-error mb-4">{error}</div>}
          {success && <div className="text-success mb-4">{success}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
            <div className="space-y-2">
              <label className="block font-label-caps text-label-caps text-on-surface-variant" htmlFor="fullName">Họ và tên</label>
              <input
                className="w-full h-[44px] px-4 rounded-lg border border-border-subtle bg-transparent text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block font-label-caps text-label-caps text-on-surface-variant" htmlFor="phone">Số điện thoại</label>
              <input
                className="w-full h-[44px] px-4 rounded-lg border border-border-subtle bg-transparent text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block font-label-caps text-label-caps text-on-surface-variant" htmlFor="email">Email</label>
              <input
                className="w-full h-[44px] px-4 rounded-lg border border-border-subtle bg-surface-alt text-on-surface-variant outline-none cursor-not-allowed"
                id="email"
                type="email"
                value={formData.email}
                readOnly
                disabled
              />
            </div>
            <div className="space-y-2">
              <label className="block font-label-caps text-label-caps text-on-surface-variant" htmlFor="gender">Giới tính</label>
              <div className="relative">
                <select
                  className="w-full h-[44px] px-4 rounded-lg border border-border-subtle bg-transparent text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
                  id="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block font-label-caps text-label-caps text-on-surface-variant" htmlFor="dateOfBirth">Ngày sinh</label>
              <input
                className="w-full h-[44px] px-4 rounded-lg border border-border-subtle bg-transparent text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
            </div>
          </div>
          <button
            className="px-8 py-3 bg-primary text-on-primary font-label-caps text-label-caps rounded-lg hover:scale-102 transition-transform duration-200 disabled:opacity-50"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>

        {/* Password Management */}
        <div className="pt-xl border-t border-border-subtle">
          <h3 className="font-headline-md text-headline-md text-primary mb-lg">
            Đổi mật khẩu
          </h3>
          <form className="space-y-6 max-w-md">
            <div className="space-y-2">
              <label className="block font-label-caps text-label-caps text-on-surface-variant" htmlFor="current-password">Mật khẩu hiện tại</label>
              <input
                className="w-full h-[44px] px-4 rounded-lg border border-border-subtle bg-transparent text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                id="current-password"
                type="password"
              />
            </div>
            <div className="space-y-2">
              <label className="block font-label-caps text-label-caps text-on-surface-variant" htmlFor="new-password">Mật khẩu mới</label>
              <input
                className="w-full h-[44px] px-4 rounded-lg border border-border-subtle bg-transparent text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                id="new-password"
                type="password"
              />
            </div>
            <div className="space-y-2">
              <label className="block font-label-caps text-label-caps text-on-surface-variant" htmlFor="confirm-password">Xác nhận mật khẩu mới</label>
              <input
                className="w-full h-[44px] px-4 rounded-lg border border-border-subtle bg-transparent text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                id="confirm-password"
                type="password"
              />
            </div>
            <button
              className="px-8 py-3 bg-transparent border-[1.5px] border-primary text-primary font-label-caps text-label-caps rounded-lg hover:bg-surface-alt transition-colors"
              type="button"
            >
              Cập nhật mật khẩu
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
