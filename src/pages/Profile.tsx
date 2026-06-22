import React, { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { profileService, type UserProfileResponse } from '@/services/profile.service'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Mật khẩu hiện tại không được để trống'),
  newPassword: z.string()
    .min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự')
    .regex(/^(?=.*[A-Z])(?=.*\d).{8,}$/, 'Mật khẩu mới phải có ít nhất 1 chữ hoa và 1 chữ số'),
  confirmNewPassword: z.string().min(1, 'Xác nhận mật khẩu không được để trống')
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Xác nhận mật khẩu không khớp',
  path: ['confirmNewPassword']
}).refine((data) => data.newPassword !== data.oldPassword, {
  message: 'Mật khẩu mới không được trùng mật khẩu hiện tại',
  path: ['newPassword']
})

type ChangePasswordForm = z.infer<typeof changePasswordSchema>

type ContextType = {
  profile: UserProfileResponse | null
  setProfile: (profile: UserProfileResponse) => void
}

export default function Profile() {
  const { profile, setProfile } = useOutletContext<ContextType>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdError, setPwdError] = useState('')
  const [pwdSuccess, setPwdSuccess] = useState('')

  const {
    register: registerPwd,
    handleSubmit: handlePwdSubmit,
    reset: resetPwdForm,
    formState: { errors: pwdErrors }
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema)
  })

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

  const onChangePasswordSubmit = async (data: ChangePasswordForm) => {
    setPwdLoading(true)
    setPwdError('')
    setPwdSuccess('')
    try {
      await profileService.changePassword(data)
      setPwdSuccess('Đổi mật khẩu thành công')
      resetPwdForm()
    } catch (err: any) {
      setPwdError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật mật khẩu')
    } finally {
      setPwdLoading(false)
    }
  }

  return (
    <>
      <h1 className="font-headline-lg text-headline-lg md:font-headline-xl md:text-headline-xl text-primary mb-xl">
        Thông tin tài khoản
      </h1>
      <div className="space-y-xl">
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
          <form className="space-y-6 max-w-md" onSubmit={handlePwdSubmit(onChangePasswordSubmit)}>
            {pwdError && <div className="p-3 bg-error-container text-on-error-container text-sm font-body-md rounded border border-error bg-opacity-20">{pwdError}</div>}
            {pwdSuccess && <div className="p-3 bg-success-container text-success text-sm font-body-md rounded border border-success bg-opacity-20">{pwdSuccess}</div>}

            <div className="space-y-2">
              <label className="block font-label-caps text-label-caps text-on-surface-variant" htmlFor="oldPassword">Mật khẩu hiện tại</label>
              <input
                className={`w-full h-[44px] px-4 rounded-lg border ${pwdErrors.oldPassword ? 'border-error focus:ring-error' : 'border-border-subtle focus:border-primary focus:ring-primary'} bg-transparent text-primary focus:ring-1 outline-none transition-all`}
                id="oldPassword"
                type="password"
                {...registerPwd('oldPassword')}
              />
              {pwdErrors.oldPassword && <p className="text-error font-body-sm text-sm">{pwdErrors.oldPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="block font-label-caps text-label-caps text-on-surface-variant" htmlFor="newPassword">Mật khẩu mới</label>
              <input
                className={`w-full h-[44px] px-4 rounded-lg border ${pwdErrors.newPassword ? 'border-error focus:ring-error' : 'border-border-subtle focus:border-primary focus:ring-primary'} bg-transparent text-primary focus:ring-1 outline-none transition-all`}
                id="newPassword"
                type="password"
                {...registerPwd('newPassword')}
              />
              {pwdErrors.newPassword && <p className="text-error font-body-sm text-sm">{pwdErrors.newPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="block font-label-caps text-label-caps text-on-surface-variant" htmlFor="confirmNewPassword">Xác nhận mật khẩu mới</label>
              <input
                className={`w-full h-[44px] px-4 rounded-lg border ${pwdErrors.confirmNewPassword ? 'border-error focus:ring-error' : 'border-border-subtle focus:border-primary focus:ring-primary'} bg-transparent text-primary focus:ring-1 outline-none transition-all`}
                id="confirmNewPassword"
                type="password"
                {...registerPwd('confirmNewPassword')}
              />
              {pwdErrors.confirmNewPassword && <p className="text-error font-body-sm text-sm">{pwdErrors.confirmNewPassword.message}</p>}
            </div>
            <button
              className="px-8 py-3 bg-transparent border-[1.5px] border-primary text-primary font-label-caps text-label-caps rounded-lg hover:bg-surface-alt transition-colors disabled:opacity-50"
              type="submit"
              disabled={pwdLoading}
            >
              {pwdLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
