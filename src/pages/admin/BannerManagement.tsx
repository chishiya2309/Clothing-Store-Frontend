import { useEffect, useState, useRef } from 'react'
import { bannerService, type BannerResponse } from '@/services/banner.service'

export default function BannerManagement() {
  const [banners, setBanners] = useState<BannerResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editBanner, setEditBanner] = useState<BannerResponse | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: '',
    linkUrl: '',
    displayOrder: 0,
    isActive: true,
    startDate: '',
    endDate: ''
  })

  const fetchBanners = async () => {
    try {
      const data = await bannerService.getAll()
      setBanners(data)
    } catch {
      setError('Không thể tải danh sách banner')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBanners() }, [])

  const openCreateModal = () => {
    setEditBanner(null)
    setForm({ title: '', linkUrl: '', displayOrder: 0, isActive: true, startDate: '', endDate: '' })
    setPreviewUrl('')
    setShowModal(true)
    setError('')
  }

  const openEditModal = (banner: BannerResponse) => {
    setEditBanner(banner)
    setForm({
      title: banner.title,
      linkUrl: banner.linkUrl || '',
      displayOrder: banner.displayOrder,
      isActive: banner.isActive,
      startDate: banner.startDate ? banner.startDate.slice(0, 16) : '',
      endDate: banner.endDate ? banner.endDate.slice(0, 16) : ''
    })
    setPreviewUrl(banner.imageUrl)
    setShowModal(true)
    setError('')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('title', form.title)
      if (form.linkUrl) formData.append('linkUrl', form.linkUrl)
      formData.append('displayOrder', String(form.displayOrder))
      formData.append('isActive', String(form.isActive))
      if (form.startDate) formData.append('startDate', new Date(form.startDate).toISOString())
      if (form.endDate) formData.append('endDate', new Date(form.endDate).toISOString())

      const file = fileInputRef.current?.files?.[0]
      if (file) {
        formData.append('image', file)
      } else if (!editBanner) {
        setError('Vui lòng chọn hình ảnh banner')
        setSaving(false)
        return
      }

      if (editBanner) {
        await bannerService.update(editBanner.id, formData)
      } else {
        await bannerService.create(formData)
      }

      setShowModal(false)
      await fetchBanners()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa banner này?')) return
    try {
      await bannerService.delete(id)
      await fetchBanners()
    } catch {
      setError('Xóa banner thất bại')
    }
  }

  const toggleActive = async (banner: BannerResponse) => {
    const formData = new FormData()
    formData.append('isActive', String(!banner.isActive))
    try {
      await bannerService.update(banner.id, formData)
      await fetchBanners()
    } catch {
      setError('Cập nhật trạng thái thất bại')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#1A1A2E] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-headline-xl text-headline-xl text-text-primary">Quản lý Banner</h1>
          <p className="text-text-muted font-body-md mt-1">Quản lý banner hiển thị trên trang chủ</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-[#1A1A2E] text-white px-5 py-2.5 rounded-lg hover:bg-[#2A2A4A] transition-colors font-label-caps text-label-caps"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Thêm banner
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {/* Banners Table */}
      <div className="bg-surface rounded-xl border border-border-subtle overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#F5F5F0] border-b border-border-subtle">
              <th className="text-left px-4 py-3 font-label-caps text-label-caps text-text-muted">Hình ảnh</th>
              <th className="text-left px-4 py-3 font-label-caps text-label-caps text-text-muted">Tiêu đề</th>
              <th className="text-left px-4 py-3 font-label-caps text-label-caps text-text-muted">Thứ tự</th>
              <th className="text-left px-4 py-3 font-label-caps text-label-caps text-text-muted">Trạng thái</th>
              <th className="text-left px-4 py-3 font-label-caps text-label-caps text-text-muted">Thời gian</th>
              <th className="text-right px-4 py-3 font-label-caps text-label-caps text-text-muted">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {banners.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-text-muted">
                  <span className="material-symbols-outlined text-4xl block mb-2">image</span>
                  Chưa có banner nào
                </td>
              </tr>
            ) : (
              banners.map((banner) => (
                <tr key={banner.id} className="border-b border-border-subtle hover:bg-[#FAFAF8] transition-colors">
                  <td className="px-4 py-3">
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="w-32 h-16 object-cover rounded-lg border border-border-subtle"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-body-md text-text-primary font-medium">{banner.title}</p>
                    {banner.linkUrl && (
                      <p className="font-body-sm text-text-muted text-xs mt-0.5 truncate max-w-[200px]">{banner.linkUrl}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-[#F5F5F0] text-text-primary px-3 py-1 rounded-full text-sm font-medium">
                      #{banner.displayOrder}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(banner)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-label-caps transition-colors ${
                        banner.isActive
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${banner.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {banner.isActive ? 'Đang hiển thị' : 'Đã ẩn'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">
                    {banner.startDate && <div>Từ: {new Date(banner.startDate).toLocaleDateString('vi-VN')}</div>}
                    {banner.endDate && <div>Đến: {new Date(banner.endDate).toLocaleDateString('vi-VN')}</div>}
                    {!banner.startDate && !banner.endDate && <span>Không giới hạn</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(banner)}
                        className="p-2 text-text-muted hover:text-[#1A1A2E] hover:bg-[#F5F5F0] rounded-lg transition-colors"
                        title="Sửa"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="p-2 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
              <h2 className="font-headline-md text-headline-md text-text-primary">
                {editBanner ? 'Chỉnh sửa banner' : 'Thêm banner mới'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-[#F5F5F0] rounded-lg transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
              )}

              {/* Image Upload */}
              <div>
                <label className="block font-label-caps text-label-caps text-text-muted mb-2">
                  Hình ảnh banner {!editBanner && <span className="text-red-500">*</span>}
                </label>
                <div
                  className="relative border-2 border-dashed border-border-subtle rounded-xl overflow-hidden cursor-pointer hover:border-[#1A1A2E] transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
                  ) : (
                    <div className="h-48 flex flex-col items-center justify-center text-text-muted">
                      <span className="material-symbols-outlined text-4xl mb-2">cloud_upload</span>
                      <span className="font-body-md">Nhấn để chọn hình ảnh</span>
                      <span className="font-body-sm text-xs mt-1">PNG, JPG, WebP (tối đa 10MB)</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Title */}
              <div>
                <label className="block font-label-caps text-label-caps text-text-muted mb-2">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full h-11 px-4 rounded-lg border border-border-subtle bg-transparent text-text-primary focus:border-[#1A1A2E] focus:ring-1 focus:ring-[#1A1A2E] outline-none transition-all"
                  required
                />
              </div>

              {/* Link URL */}
              <div>
                <label className="block font-label-caps text-label-caps text-text-muted mb-2">Link điều hướng</label>
                <input
                  type="text"
                  value={form.linkUrl}
                  onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                  placeholder="/products hoặc https://..."
                  className="w-full h-11 px-4 rounded-lg border border-border-subtle bg-transparent text-text-primary focus:border-[#1A1A2E] focus:ring-1 focus:ring-[#1A1A2E] outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Display Order */}
                <div>
                  <label className="block font-label-caps text-label-caps text-text-muted mb-2">Thứ tự</label>
                  <input
                    type="number"
                    value={form.displayOrder}
                    onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })}
                    className="w-full h-11 px-4 rounded-lg border border-border-subtle bg-transparent text-text-primary focus:border-[#1A1A2E] focus:ring-1 focus:ring-[#1A1A2E] outline-none transition-all"
                    min={0}
                  />
                </div>

                {/* Active Toggle */}
                <div>
                  <label className="block font-label-caps text-label-caps text-text-muted mb-2">Trạng thái</label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isActive: !form.isActive })}
                    className={`h-11 w-full rounded-lg border font-label-caps text-label-caps transition-colors ${
                      form.isActive
                        ? 'bg-green-100 border-green-300 text-green-700'
                        : 'bg-gray-100 border-gray-300 text-gray-500'
                    }`}
                  >
                    {form.isActive ? 'Đang hiển thị' : 'Đã ẩn'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Start Date */}
                <div>
                  <label className="block font-label-caps text-label-caps text-text-muted mb-2">Ngày bắt đầu</label>
                  <input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full h-11 px-4 rounded-lg border border-border-subtle bg-transparent text-text-primary focus:border-[#1A1A2E] focus:ring-1 focus:ring-[#1A1A2E] outline-none transition-all text-sm"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block font-label-caps text-label-caps text-text-muted mb-2">Ngày kết thúc</label>
                  <input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full h-11 px-4 rounded-lg border border-border-subtle bg-transparent text-text-primary focus:border-[#1A1A2E] focus:ring-1 focus:ring-[#1A1A2E] outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-border-subtle rounded-lg text-text-muted hover:bg-[#F5F5F0] transition-colors font-label-caps text-label-caps"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#1A1A2E] text-white rounded-lg hover:bg-[#2A2A4A] transition-colors font-label-caps text-label-caps disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : (editBanner ? 'Cập nhật' : 'Tạo banner')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
