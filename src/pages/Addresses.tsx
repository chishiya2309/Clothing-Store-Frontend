import React, { useEffect, useState, useCallback } from 'react'
import {
  addressService,
  type AddressResponse,
  type AddressRequest,
  type Province,
  type District,
  type Ward,
} from '@/services/address.service'

// ─────────────────────── Address Form Modal ───────────────────────
interface AddressFormProps {
  address?: AddressResponse | null
  onSave: (data: AddressRequest) => Promise<void>
  onClose: () => void
}

function AddressFormModal({ address, onSave, onClose }: AddressFormProps) {
  const isEdit = !!address

  const [recipientName, setRecipientName] = useState(address?.recipientName || '')
  const [phone, setPhone] = useState(address?.phone || '')
  const [streetAddress, setStreetAddress] = useState(address?.streetAddress || '')
  const [isDefault, setIsDefault] = useState(address?.isDefault || false)

  // Province / District / Ward state
  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [wards, setWards] = useState<Ward[]>([])

  const [selectedProvince, setSelectedProvince] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedWard, setSelectedWard] = useState('')

  // For edit mode, store the text names from the existing address
  const [provinceName, setProvinceName] = useState(address?.province || '')
  const [districtName, setDistrictName] = useState(address?.district || '')
  const [wardName, setWardName] = useState(address?.ward || '')

  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load provinces on mount
  useEffect(() => {
    addressService.getProvinces().then(setProvinces).catch(console.error)
  }, [])

  // Load districts when province changes
  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([])
      setSelectedDistrict('')
      setWards([])
      setSelectedWard('')
      return
    }
    addressService
      .getDistricts(Number(selectedProvince))
      .then((d) => {
        setDistricts(d)
        setSelectedDistrict('')
        setWards([])
        setSelectedWard('')
      })
      .catch(console.error)
  }, [selectedProvince])

  // Load wards when district changes
  useEffect(() => {
    if (!selectedDistrict) {
      setWards([])
      setSelectedWard('')
      return
    }
    addressService
      .getWards(Number(selectedDistrict))
      .then((w) => {
        setWards(w)
        setSelectedWard('')
      })
      .catch(console.error)
  }, [selectedDistrict])

  // Sync name from dropdown selection
  useEffect(() => {
    const p = provinces.find((x) => String(x.code) === selectedProvince)
    if (p) setProvinceName(p.name)
  }, [selectedProvince, provinces])

  useEffect(() => {
    const d = districts.find((x) => String(x.code) === selectedDistrict)
    if (d) setDistrictName(d.name)
  }, [selectedDistrict, districts])

  useEffect(() => {
    const w = wards.find((x) => String(x.code) === selectedWard)
    if (w) setWardName(w.name)
  }, [selectedWard, wards])

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!recipientName.trim()) e.recipientName = 'Tên người nhận không được để trống'
    if (!phone.trim()) e.phone = 'Số điện thoại không được để trống'
    else if (!/^(0[1-9])[0-9]{8}$/.test(phone.trim()))
      e.phone = 'Số điện thoại không hợp lệ'
    if (!provinceName) e.province = 'Vui lòng chọn Tỉnh/Thành phố'
    if (!districtName) e.district = 'Vui lòng chọn Quận/Huyện'
    if (!wardName) e.ward = 'Vui lòng chọn Phường/Xã'
    if (!streetAddress.trim()) e.streetAddress = 'Địa chỉ chi tiết không được để trống'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      await onSave({
        recipientName: recipientName.trim(),
        phone: phone.trim(),
        province: provinceName,
        district: districtName,
        ward: wardName,
        streetAddress: streetAddress.trim(),
        isDefault,
      })
    } catch {
      // handled upstream
    } finally {
      setSaving(false)
    }
  }

  const inputClass = (field: string) =>
    `w-full h-[44px] px-4 rounded-lg border ${
      errors[field]
        ? 'border-error focus:ring-error'
        : 'border-border-subtle focus:border-primary focus:ring-primary'
    } bg-transparent text-primary focus:ring-1 outline-none transition-all font-body-md text-body-md`

  const selectClass = (field: string) =>
    `w-full h-[44px] px-4 rounded-lg border ${
      errors[field]
        ? 'border-error focus:ring-error'
        : 'border-border-subtle focus:border-primary focus:ring-primary'
    } bg-surface text-primary focus:ring-1 outline-none transition-all font-body-md text-body-md appearance-none cursor-pointer`

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <h2 className="font-headline-md text-headline-md text-primary">
            {isEdit ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
          </h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary transition-colors p-1"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form */}
        <form className="p-6 space-y-5" onSubmit={handleSubmit}>
          {/* Recipient Name */}
          <div className="space-y-1.5">
            <label
              className="block font-label-caps text-label-caps text-on-surface-variant"
              htmlFor="recipientName"
            >
              Tên người nhận
            </label>
            <input
              id="recipientName"
              className={inputClass('recipientName')}
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Nguyễn Văn A"
            />
            {errors.recipientName && (
              <p className="text-error font-body-sm text-sm">{errors.recipientName}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label
              className="block font-label-caps text-label-caps text-on-surface-variant"
              htmlFor="phone"
            >
              Số điện thoại
            </label>
            <input
              id="phone"
              className={inputClass('phone')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0901234567"
            />
            {errors.phone && (
              <p className="text-error font-body-sm text-sm">{errors.phone}</p>
            )}
          </div>

          {/* Province */}
          <div className="space-y-1.5">
            <label
              className="block font-label-caps text-label-caps text-on-surface-variant"
              htmlFor="province"
            >
              Tỉnh / Thành phố
            </label>
            <select
              id="province"
              className={selectClass('province')}
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
            >
              <option value="">
                {isEdit && provinceName && !selectedProvince
                  ? provinceName
                  : '-- Chọn Tỉnh/Thành phố --'}
              </option>
              {provinces.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
            {errors.province && (
              <p className="text-error font-body-sm text-sm">{errors.province}</p>
            )}
          </div>

          {/* District */}
          <div className="space-y-1.5">
            <label
              className="block font-label-caps text-label-caps text-on-surface-variant"
              htmlFor="district"
            >
              Quận / Huyện
            </label>
            <select
              id="district"
              className={selectClass('district')}
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={!selectedProvince && !districtName}
            >
              <option value="">
                {isEdit && districtName && !selectedDistrict
                  ? districtName
                  : '-- Chọn Quận/Huyện --'}
              </option>
              {districts.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name}
                </option>
              ))}
            </select>
            {errors.district && (
              <p className="text-error font-body-sm text-sm">{errors.district}</p>
            )}
          </div>

          {/* Ward */}
          <div className="space-y-1.5">
            <label
              className="block font-label-caps text-label-caps text-on-surface-variant"
              htmlFor="ward"
            >
              Phường / Xã
            </label>
            <select
              id="ward"
              className={selectClass('ward')}
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              disabled={!selectedDistrict && !wardName}
            >
              <option value="">
                {isEdit && wardName && !selectedWard ? wardName : '-- Chọn Phường/Xã --'}
              </option>
              {wards.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.name}
                </option>
              ))}
            </select>
            {errors.ward && (
              <p className="text-error font-body-sm text-sm">{errors.ward}</p>
            )}
          </div>

          {/* Street Address */}
          <div className="space-y-1.5">
            <label
              className="block font-label-caps text-label-caps text-on-surface-variant"
              htmlFor="streetAddress"
            >
              Địa chỉ chi tiết
            </label>
            <input
              id="streetAddress"
              className={inputClass('streetAddress')}
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              placeholder="Số nhà, tên đường..."
            />
            {errors.streetAddress && (
              <p className="text-error font-body-sm text-sm">{errors.streetAddress}</p>
            )}
          </div>

          {/* Default checkbox */}
          <label className="flex items-center gap-3 cursor-pointer select-none group">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-5 h-5 rounded border-border-subtle text-primary-container focus:ring-primary accent-primary-container"
            />
            <span className="font-body-md text-body-md text-primary group-hover:text-primary-container transition-colors">
              Đặt làm địa chỉ mặc định
            </span>
          </label>

          {/* Actions */}
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-[44px] rounded-lg border border-border-subtle text-on-surface-variant font-label-caps text-label-caps hover:bg-surface-alt transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-[44px] rounded-lg bg-primary-container text-on-primary font-label-caps text-label-caps hover:bg-primary transition-colors disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm địa chỉ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────── Delete Confirm Modal ───────────────────────
interface DeleteConfirmProps {
  address: AddressResponse
  onConfirm: () => void
  onClose: () => void
  loading: boolean
}

function DeleteConfirmModal({ address, onConfirm, onClose, loading }: DeleteConfirmProps) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <h3 className="font-headline-md text-headline-md text-primary">Xác nhận xóa</h3>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Bạn có chắc muốn xóa địa chỉ của <strong>{address.recipientName}</strong>?
        </p>
        <div className="flex gap-4 pt-2">
          <button
            onClick={onClose}
            className="flex-1 h-[44px] rounded-lg border border-border-subtle text-on-surface-variant font-label-caps text-label-caps hover:bg-surface-alt transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-[44px] rounded-lg bg-error text-on-error font-label-caps text-label-caps hover:bg-on-tertiary-container transition-colors disabled:opacity-50"
          >
            {loading ? 'Đang xóa...' : 'Xóa'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────── Main Addresses Page ───────────────────────
export default function Addresses() {
  const [addresses, setAddresses] = useState<AddressResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal state
  const [showForm, setShowForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<AddressResponse | null>(null)
  const [deletingAddress, setDeletingAddress] = useState<AddressResponse | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true)
      const data = await addressService.getAddresses()
      setAddresses(data)
      setError('')
    } catch {
      setError('Không thể tải danh sách địa chỉ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAddresses()
  }, [fetchAddresses])

  const handleCreate = () => {
    setEditingAddress(null)
    setShowForm(true)
  }

  const handleEdit = (addr: AddressResponse) => {
    setEditingAddress(addr)
    setShowForm(true)
  }

  const handleSave = async (data: AddressRequest) => {
    try {
      if (editingAddress) {
        await addressService.updateAddress(editingAddress.id, data)
      } else {
        await addressService.createAddress(data)
      }
      setShowForm(false)
      setEditingAddress(null)
      await fetchAddresses()
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra'
      setError(msg)
      throw err // re-throw so the modal knows the save failed
    }
  }

  const handleDelete = async () => {
    if (!deletingAddress) return
    setDeleteLoading(true)
    try {
      await addressService.deleteAddress(deletingAddress.id)
      setDeletingAddress(null)
      await fetchAddresses()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể xóa địa chỉ')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleSetDefault = async (id: number) => {
    try {
      await addressService.setDefault(id)
      await fetchAddresses()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border-subtle pb-sm mb-lg gap-sm">
        <div>
          <h1 className="font-headline-lg text-headline-lg md:font-headline-xl md:text-headline-xl text-primary">
            Sổ địa chỉ
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Quản lý địa chỉ giao hàng của bạn.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-primary-container text-on-primary font-label-caps text-label-caps px-md py-[10px] rounded flex items-center justify-center gap-xs hover:scale-[1.02] hover:bg-primary transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Thêm địa chỉ mới
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-md p-3 bg-error-container text-on-error-container text-sm font-body-md rounded border border-error bg-opacity-20 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-2 hover:text-error transition-colors">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-xl">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}

      {/* Empty state */}
      {!loading && addresses.length === 0 && (
        <div className="text-center py-xl space-y-4">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant opacity-40">
            location_off
          </span>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Bạn chưa có địa chỉ giao hàng nào.
          </p>
          <button
            onClick={handleCreate}
            className="bg-primary-container text-on-primary font-label-caps text-label-caps px-md py-[10px] rounded inline-flex items-center gap-xs hover:bg-primary transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Thêm địa chỉ đầu tiên
          </button>
        </div>
      )}

      {/* Address Grid */}
      {!loading && addresses.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-md">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="bg-surface-alt p-md rounded-lg flex flex-col relative group border border-transparent hover:border-border-subtle transition-colors"
            >
              {/* Name + Badge */}
              <div className="flex justify-between items-start mb-sm">
                <div className="flex items-center gap-sm">
                  <h3 className="font-headline-md text-headline-md text-primary-container">
                    {addr.recipientName}
                  </h3>
                  {addr.isDefault && (
                    <span className="bg-primary-container text-on-primary font-label-caps text-[10px] uppercase tracking-wider px-2 py-1 rounded-sm leading-none">
                      Mặc định
                    </span>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant mb-xs">
                <span className="material-symbols-outlined text-[16px]">call</span>
                {addr.phone}
              </div>

              {/* Full address */}
              <div className="flex items-start gap-2 font-body-md text-body-md text-primary-container mb-md leading-relaxed">
                <span className="material-symbols-outlined text-[16px] mt-1 shrink-0 text-on-surface-variant">
                  home_pin
                </span>
                {addr.streetAddress}, {addr.ward}, {addr.district}, {addr.province}
              </div>

              {/* Actions */}
              <div className="mt-auto pt-sm border-t border-border-subtle flex gap-md justify-end items-center">
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary uppercase tracking-widest transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">star</span>
                    Mặc định
                  </button>
                )}
                <button
                  onClick={() => handleEdit(addr)}
                  className="font-label-caps text-label-caps text-primary-container hover:text-primary uppercase tracking-widest transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  Chỉnh sửa
                </button>
                {!addr.isDefault && (
                  <button
                    onClick={() => setDeletingAddress(addr)}
                    className="font-label-caps text-label-caps text-on-tertiary-container hover:text-error uppercase tracking-widest transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Xóa
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <AddressFormModal
          address={editingAddress}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false)
            setEditingAddress(null)
          }}
        />
      )}
      {deletingAddress && (
        <DeleteConfirmModal
          address={deletingAddress}
          onConfirm={handleDelete}
          onClose={() => setDeletingAddress(null)}
          loading={deleteLoading}
        />
      )}
    </>
  )
}
