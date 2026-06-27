import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { voucherService } from '@/services/voucher.service'
import type { DiscountType, StaffVoucherRequest, VoucherResponse } from '@/services/voucher.service'

type VoucherStatus = 'active' | 'upcoming' | 'expired' | 'exhausted' | 'inactive'
type StatusFilter = VoucherStatus | ''

interface VoucherFormState {
  code: string
  discountType: DiscountType
  discountValue: string
  maxDiscountAmount: string
  minOrderAmount: string
  startDate: string
  endDate: string
  usageLimit: string
  isActive: boolean
}

const emptyForm = (): VoucherFormState => ({
  code: '',
  discountType: 'percentage',
  discountValue: '',
  maxDiscountAmount: '',
  minOrderAmount: '',
  startDate: '',
  endDate: '',
  usageLimit: '',
  isActive: true,
})

const moneyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

const formatMoney = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '-'
  return moneyFormatter.format(value)
}

const toDateTimeLocal = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

const toIsoString = (value: string) => new Date(value).toISOString()

const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('vi-VN')
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response
    return response?.data?.message || fallback
  }
  return fallback
}

const getVoucherStatus = (voucher: VoucherResponse): { value: VoucherStatus; label: string; className: string } => {
  const now = new Date()
  const startDate = new Date(voucher.startDate)
  const endDate = new Date(voucher.endDate)

  if (!voucher.isActive) {
    return { value: 'inactive', label: 'Đã tắt', className: 'bg-red-50 text-red-700 border-red-200' }
  }

  if (!Number.isNaN(startDate.getTime()) && now < startDate) {
    return { value: 'upcoming', label: 'Sắp diễn ra', className: 'bg-blue-50 text-blue-700 border-blue-200' }
  }

  if (!Number.isNaN(endDate.getTime()) && now > endDate) {
    return { value: 'expired', label: 'Hết hạn', className: 'bg-gray-100 text-gray-600 border-gray-200' }
  }

  if (voucher.usageLimit > 0 && voucher.timesUsed >= voucher.usageLimit) {
    return { value: 'exhausted', label: 'Hết lượt', className: 'bg-amber-50 text-amber-700 border-amber-200' }
  }

  return { value: 'active', label: 'Đang hiệu lực', className: 'bg-green-50 text-green-700 border-green-200' }
}

const getVoucherStatusTextClass = (status: VoucherStatus) => {
  if (status === 'active') return 'text-success'
  if (status === 'upcoming') return 'text-primary'
  if (status === 'expired') return 'text-text-muted'
  if (status === 'exhausted') return 'text-warning'
  return 'text-warning'
}

const getDiscountLabel = (type: DiscountType) => {
  return type === 'percentage' ? 'Giảm theo %' : 'Giảm tiền'
}

const getDiscountValueLabel = (voucher: VoucherResponse) => {
  return voucher.discountType === 'percentage'
    ? `${voucher.discountValue}%`
    : formatMoney(voucher.discountValue)
}

const getUsagePercent = (voucher: VoucherResponse) => {
  if (voucher.usageLimit <= 0) return 0
  return Math.min((voucher.timesUsed / voucher.usageLimit) * 100, 100)
}

const buildRequestFromVoucher = (voucher: VoucherResponse, isActive: boolean): StaffVoucherRequest => ({
  code: voucher.code,
  discountType: voucher.discountType,
  discountValue: voucher.discountValue,
  maxDiscountAmount: voucher.maxDiscountAmount,
  minOrderAmount: voucher.minOrderAmount,
  startDate: voucher.startDate,
  endDate: voucher.endDate,
  usageLimit: voucher.usageLimit,
  isActive,
})

export default function VoucherManagement() {
  const [vouchers, setVouchers] = useState<VoucherResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherResponse | null>(null)
  const [editingVoucher, setEditingVoucher] = useState<VoucherResponse | null>(null)
  const [form, setForm] = useState<VoucherFormState>(emptyForm)
  const [keyword, setKeyword] = useState('')
  const [discountTypeFilter, setDiscountTypeFilter] = useState<DiscountType | ''>('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')

  const fetchVouchers = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await voucherService.getStaffVouchers()
      setVouchers(data)
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Không thể tải danh sách mã giảm giá.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchVouchers()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [fetchVouchers])

  const stats = useMemo(() => {
    return vouchers.reduce(
      (result, voucher) => {
        const status = getVoucherStatus(voucher).value
        result.total += 1
        result[status] += 1
        return result
      },
      { total: 0, active: 0, upcoming: 0, expired: 0, exhausted: 0, inactive: 0 }
    )
  }, [vouchers])

  const filteredVouchers = useMemo(() => {
    const searchText = keyword.trim().toLowerCase()

    return vouchers.filter((voucher) => {
      const status = getVoucherStatus(voucher).value
      const matchesKeyword = !searchText || voucher.code.toLowerCase().includes(searchText)
      const matchesType = !discountTypeFilter || voucher.discountType === discountTypeFilter
      const matchesStatus = !statusFilter || status === statusFilter

      return matchesKeyword && matchesType && matchesStatus
    })
  }, [discountTypeFilter, keyword, statusFilter, vouchers])

  const hasActiveFilters = Boolean(keyword || discountTypeFilter || statusFilter)

  const clearFilters = () => {
    setKeyword('')
    setDiscountTypeFilter('')
    setStatusFilter('')
  }

  const openCreateModal = () => {
    setEditingVoucher(null)
    setForm(emptyForm())
    setError('')
    setSuccess('')
    setShowModal(true)
  }

  const openEditModal = (voucher: VoucherResponse) => {
    setEditingVoucher(voucher)
    setForm({
      code: voucher.code,
      discountType: voucher.discountType,
      discountValue: String(voucher.discountValue),
      maxDiscountAmount: voucher.maxDiscountAmount === null ? '' : String(voucher.maxDiscountAmount),
      minOrderAmount: String(voucher.minOrderAmount),
      startDate: toDateTimeLocal(voucher.startDate),
      endDate: toDateTimeLocal(voucher.endDate),
      usageLimit: String(voucher.usageLimit),
      isActive: voucher.isActive,
    })
    setError('')
    setSuccess('')
    setShowModal(true)
  }

  const openDetailModal = (voucher: VoucherResponse) => {
    setSelectedVoucher(voucher)
    setError('')
    setSuccess('')
  }

  const openEditFromDetail = () => {
    if (!selectedVoucher) return
    const voucher = selectedVoucher
    setSelectedVoucher(null)
    openEditModal(voucher)
  }

  const validateForm = () => {
    const discountValue = Number(form.discountValue)
    const maxDiscountAmount = form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null
    const minOrderAmount = Number(form.minOrderAmount)
    const usageLimit = Number(form.usageLimit)
    const startDate = new Date(form.startDate)
    const endDate = new Date(form.endDate)

    if (!form.code.trim()) return 'Vui lòng nhập mã voucher.'
    if (discountValue <= 0) return 'Giá trị giảm phải lớn hơn 0.'
    if (form.discountType === 'percentage' && discountValue > 100) return 'Phần trăm giảm không được vượt quá 100%.'
    if (maxDiscountAmount !== null && maxDiscountAmount < 0) return 'Mức giảm tối đa không hợp lệ.'
    if (minOrderAmount < 0) return 'Giá trị đơn tối thiểu không hợp lệ.'
    if (!form.startDate || !form.endDate) return 'Vui lòng chọn thời gian hiệu lực.'
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      return 'Ngày kết thúc phải lớn hơn ngày bắt đầu.'
    }
    if (!Number.isInteger(usageLimit) || usageLimit <= 0) return 'Giới hạn lượt dùng phải là số nguyên lớn hơn 0.'
    if (editingVoucher && usageLimit < editingVoucher.timesUsed) {
      return 'Giới hạn lượt dùng không được nhỏ hơn số lượt đã sử dụng.'
    }

    return ''
  }

  const buildRequestFromForm = (): StaffVoucherRequest => ({
    code: form.code.trim().toUpperCase(),
    discountType: form.discountType,
    discountValue: Number(form.discountValue),
    maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
    minOrderAmount: Number(form.minOrderAmount),
    startDate: toIsoString(form.startDate),
    endDate: toIsoString(form.endDate),
    usageLimit: Number(form.usageLimit),
    isActive: form.isActive,
  })

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    const validationMessage = validateForm()
    if (validationMessage) {
      setError(validationMessage)
      return
    }

    try {
      setSaving(true)
      const request = buildRequestFromForm()

      if (editingVoucher) {
        await voucherService.updateStaffVoucher(editingVoucher.id, request)
        setSuccess('Cập nhật mã giảm giá thành công.')
      } else {
        await voucherService.createStaffVoucher(request)
        setSuccess('Tạo mã giảm giá thành công.')
      }

      setShowModal(false)
      await fetchVouchers()
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Không thể lưu mã giảm giá.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (voucher: VoucherResponse) => {
    if (!confirm(`Bạn có chắc muốn xóa hoặc vô hiệu hóa mã ${voucher.code}?`)) return false

    try {
      setError('')
      setSuccess('')
      await voucherService.deleteStaffVoucher(voucher.id)
      setSuccess('Đã xử lý mã giảm giá.')
      await fetchVouchers()
      return true
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'Xóa mã giảm giá thất bại.'))
      return false
    }
  }

  const handleToggleActive = async (voucher: VoucherResponse) => {
    try {
      setError('')
      setSuccess('')
      await voucherService.updateStaffVoucher(voucher.id, buildRequestFromVoucher(voucher, !voucher.isActive))
      setSuccess(voucher.isActive ? 'Đã tắt mã giảm giá.' : 'Đã bật mã giảm giá.')
      await fetchVouchers()
    } catch (toggleError) {
      setError(getErrorMessage(toggleError, 'Cập nhật trạng thái mã giảm giá thất bại.'))
    }
  }

  return (
    <div className="bg-[#FAFAF8] min-h-full">
      <div className="flex flex-col gap-lg">
        <div className="flex flex-col gap-md lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="font-headline-xl text-headline-xl text-text-primary">Quản lý mã giảm giá</h1>
            <p className="font-body-md text-body-md text-text-muted mt-1">
              Tạo, theo dõi và điều chỉnh voucher khuyến mãi cho khách hàng.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 bg-[#1A1A2E] text-white px-5 py-2.5 rounded-lg hover:bg-[#2A2A4A] transition-colors font-label-caps text-label-caps"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Tạo voucher
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-sm">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-lg px-md py-sm min-h-[68px] flex flex-col justify-center">
            <p className="font-label-caps text-label-caps text-text-muted">Tổng voucher</p>
            <p className="font-headline-md text-headline-md text-text-primary leading-none mt-1">{stats.total}</p>
          </div>
          <div className="bg-surface-container-lowest border border-border-subtle rounded-lg px-md py-sm min-h-[68px] flex flex-col justify-center">
            <p className="font-label-caps text-label-caps text-text-muted">Đang hiệu lực</p>
            <p className="font-headline-md text-headline-md text-success leading-none mt-1">{stats.active}</p>
          </div>
          <div className="bg-surface-container-lowest border border-border-subtle rounded-lg px-md py-sm min-h-[68px] flex flex-col justify-center">
            <p className="font-label-caps text-label-caps text-text-muted">Sắp diễn ra</p>
            <p className="font-headline-md text-headline-md text-primary leading-none mt-1">{stats.upcoming}</p>
          </div>
          <div className="bg-surface-container-lowest border border-border-subtle rounded-lg px-md py-sm min-h-[68px] flex flex-col justify-center">
            <p className="font-label-caps text-label-caps text-text-muted">Ngừng hoạt động</p>
            <p className="font-headline-md text-headline-md text-warning leading-none mt-1">
              {stats.inactive}
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest px-md py-sm rounded-lg border border-border-subtle flex flex-wrap items-center gap-sm">
          <div className="relative flex-1 min-w-[220px] max-w-[360px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm theo mã voucher..."
              className="w-full h-10 pl-10 pr-3 border border-border-subtle rounded-lg bg-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors uppercase placeholder:normal-case"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value.toUpperCase())}
            />
          </div>
          <select
            className="h-10 min-w-[170px] px-3 border border-border-subtle rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-surface text-sm text-text-primary"
            value={discountTypeFilter}
            onChange={(event) => setDiscountTypeFilter(event.target.value as DiscountType | '')}
          >
            <option value="">Tất cả loại giảm</option>
            <option value="percentage">Giảm theo phần trăm</option>
            <option value="fixed_amount">Giảm số tiền</option>
          </select>
          <select
            className="h-10 min-w-[165px] px-3 border border-border-subtle rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-surface text-sm text-text-primary"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hiệu lực</option>
            <option value="upcoming">Sắp diễn ra</option>
            <option value="expired">Hết hạn</option>
            <option value="exhausted">Hết lượt</option>
            <option value="inactive">Đã tắt</option>
          </select>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="h-10 inline-flex items-center gap-1.5 px-3 rounded-lg border border-border-subtle text-text-muted hover:text-text-primary hover:bg-surface-alt transition-colors font-label-caps text-[10px]"
            >
              <span className="material-symbols-outlined text-base">close</span>
              Xóa lọc
            </button>
          )}
        </div>

        {error && (
          <div className="p-md bg-error-container text-on-error-container rounded-lg font-body-md border border-[#ed4848]/30">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ed4848]">error</span>
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="p-md bg-green-50 text-green-700 rounded-lg font-body-md border border-green-200">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-green-600">check_circle</span>
              {success}
            </div>
          </div>
        )}

        <div className="bg-surface-container-lowest rounded-lg border border-border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <colgroup>
                <col className="w-[24%]" />
                <col className="w-[18%]" />
                <col className="w-[24%]" />
                <col className="w-[22%]" />
                <col className="w-[12%]" />
              </colgroup>
              <thead className="bg-surface-alt border-b border-border-subtle">
                <tr>
                  <th className="py-sm px-lg font-label-caps text-label-caps text-text-muted">Mã voucher</th>
                  <th className="py-sm px-lg font-label-caps text-label-caps text-text-muted">Lượt dùng</th>
                  <th className="py-sm px-lg font-label-caps text-label-caps text-text-muted">Hiệu lực</th>
                  <th className="py-sm px-lg font-label-caps text-label-caps text-text-muted">Trạng thái</th>
                  <th className="py-sm px-lg font-label-caps text-label-caps text-text-muted text-right">Bật/tắt</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-xl text-center text-text-muted">
                      <span className="material-symbols-outlined animate-spin mb-2">progress_activity</span>
                      <p>Đang tải dữ liệu...</p>
                    </td>
                  </tr>
                ) : filteredVouchers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-xl text-center text-text-muted">
                      <span className="material-symbols-outlined text-4xl block mb-2">local_offer</span>
                      Không có mã giảm giá phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredVouchers.map((voucher) => {
                    const status = getVoucherStatus(voucher)

                    return (
                      <tr
                        key={voucher.id}
                        onClick={() => openDetailModal(voucher)}
                        className="border-b border-surface-container hover:bg-surface-alt transition-colors cursor-pointer"
                      >
                        <td className="py-sm px-lg">
                          <span className="font-label-caps text-label-caps text-text-primary">{voucher.code}</span>
                        </td>
                        <td className="py-sm px-lg">
                          <div className="max-w-[180px]">
                            <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                              <span>{voucher.timesUsed}</span>
                              <span>{voucher.usageLimit}</span>
                            </div>
                            <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#1A1A2E]"
                                style={{ width: `${getUsagePercent(voucher)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-sm px-lg text-text-muted">
                          <span className="inline-block max-w-[150px] leading-6">
                            {formatDate(voucher.startDate)} - {formatDate(voucher.endDate)}
                          </span>
                        </td>
                        <td className="py-sm px-lg">
                          <span className={`font-body-sm text-body-sm whitespace-nowrap ${getVoucherStatusTextClass(status.value)}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="py-sm px-lg text-right">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              void handleToggleActive(voucher)
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              voucher.isActive ? 'bg-success' : 'bg-surface-container-highest'
                            }`}
                            title={voucher.isActive ? 'Tắt mã' : 'Bật mã'}
                            aria-label={voucher.isActive ? 'Tắt mã' : 'Bật mã'}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                                voucher.isActive ? 'translate-x-5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedVoucher && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
              <div>
                <div className="flex flex-wrap items-center gap-sm">
                  <h2 className="font-headline-md text-headline-md text-text-primary">{selectedVoucher.code}</h2>
                  <span className={`font-body-md text-body-md ${getVoucherStatusTextClass(getVoucherStatus(selectedVoucher).value)}`}>
                    {getVoucherStatus(selectedVoucher).label}
                  </span>
                  <span className="text-text-muted">·</span>
                  <span className="font-body-md text-body-md text-text-muted">
                    {getDiscountLabel(selectedVoucher.discountType)}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-text-muted">Chi tiết mã giảm giá</p>
              </div>
              <button onClick={() => setSelectedVoucher(null)} className="p-1 hover:bg-[#F5F5F0] rounded-lg transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
                <div className="border border-border-subtle rounded-lg px-md py-sm">
                  <p className="font-label-caps text-label-caps text-text-muted">Giá trị giảm</p>
                  <p className="font-price-display text-price-display text-primary mt-1">
                    {getDiscountValueLabel(selectedVoucher)}
                  </p>
                </div>
                <div className="border border-border-subtle rounded-lg px-md py-sm">
                  <p className="font-label-caps text-label-caps text-text-muted">Giảm tối đa</p>
                  <p className="font-body-md text-body-md text-text-primary mt-1">
                    {formatMoney(selectedVoucher.maxDiscountAmount)}
                  </p>
                </div>
                <div className="border border-border-subtle rounded-lg px-md py-sm">
                  <p className="font-label-caps text-label-caps text-text-muted">Đơn tối thiểu</p>
                  <p className="font-body-md text-body-md text-text-primary mt-1">
                    {formatMoney(selectedVoucher.minOrderAmount)}
                  </p>
                </div>
                <div className="border border-border-subtle rounded-lg px-md py-sm">
                  <p className="font-label-caps text-label-caps text-text-muted">Lượt dùng</p>
                  <p className="font-body-md text-body-md text-text-primary mt-1">
                    {selectedVoucher.timesUsed}/{selectedVoucher.usageLimit}
                  </p>
                </div>
                <div className="border border-border-subtle rounded-lg px-md py-sm">
                  <p className="font-label-caps text-label-caps text-text-muted">Ngày bắt đầu</p>
                  <p className="font-body-md text-body-md text-text-primary mt-1">
                    {formatDate(selectedVoucher.startDate)}
                  </p>
                </div>
                <div className="border border-border-subtle rounded-lg px-md py-sm">
                  <p className="font-label-caps text-label-caps text-text-muted">Ngày kết thúc</p>
                  <p className="font-body-md text-body-md text-text-primary mt-1">
                    {formatDate(selectedVoucher.endDate)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    const voucher = selectedVoucher
                    setSelectedVoucher(null)
                    await handleToggleActive(voucher)
                  }}
                  className="px-5 py-2.5 border border-border-subtle rounded-lg text-text-muted hover:bg-[#F5F5F0] transition-colors font-label-caps text-label-caps"
                >
                  {selectedVoucher.isActive ? 'Tắt voucher' : 'Bật voucher'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const deleted = await handleDelete(selectedVoucher)
                    if (deleted) setSelectedVoucher(null)
                  }}
                  className="px-5 py-2.5 border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors font-label-caps text-label-caps"
                >
                  Xóa
                </button>
                <button
                  type="button"
                  onClick={openEditFromDetail}
                  className="px-5 py-2.5 bg-[#1A1A2E] text-white rounded-lg hover:bg-[#2A2A4A] transition-colors font-label-caps text-label-caps"
                >
                  Chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
              <div>
                <h2 className="font-headline-md text-headline-md text-text-primary">
                  {editingVoucher ? 'Chỉnh sửa voucher' : 'Tạo voucher mới'}
                </h2>
                {editingVoucher && (
                  <p className="font-body-sm text-body-sm text-text-muted">
                    Đã dùng {editingVoucher.timesUsed}/{editingVoucher.usageLimit} lượt
                  </p>
                )}
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-[#F5F5F0] rounded-lg transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-caps text-label-caps text-text-muted mb-2">
                    Mã voucher <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(event) => {
                      if (editingVoucher) return
                      setForm({ ...form, code: event.target.value.toUpperCase() })
                    }}
                    className={`w-full h-11 px-4 rounded-lg border border-border-subtle bg-transparent text-text-primary focus:border-[#1A1A2E] focus:ring-1 focus:ring-[#1A1A2E] outline-none transition-all uppercase ${
                      editingVoucher ? 'bg-surface-container text-text-muted cursor-not-allowed' : ''
                    }`}
                    placeholder="SALE10"
                    disabled={Boolean(editingVoucher)}
                  />
                  {editingVoucher && (
                    <p className="text-xs text-text-muted mt-1">Mã voucher không thể chỉnh sửa sau khi tạo.</p>
                  )}
                </div>

                <div>
                  <label className="block font-label-caps text-label-caps text-text-muted mb-2">
                    Loại giảm <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.discountType}
                    onChange={(event) => setForm({ ...form, discountType: event.target.value as DiscountType })}
                    className="w-full h-11 px-4 rounded-lg border border-border-subtle bg-transparent text-text-primary focus:border-[#1A1A2E] focus:ring-1 focus:ring-[#1A1A2E] outline-none transition-all"
                  >
                    <option value="percentage">Giảm theo phần trăm</option>
                    <option value="fixed_amount">Giảm số tiền cố định</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-label-caps text-label-caps text-text-muted mb-2">
                    {form.discountType === 'percentage' ? 'Phần trăm giảm' : 'Số tiền giảm'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step={form.discountType === 'percentage' ? '1' : '1000'}
                    value={form.discountValue}
                    onChange={(event) => setForm({ ...form, discountValue: event.target.value })}
                    className="w-full h-11 px-4 rounded-lg border border-border-subtle bg-transparent text-text-primary focus:border-[#1A1A2E] focus:ring-1 focus:ring-[#1A1A2E] outline-none transition-all"
                    placeholder={form.discountType === 'percentage' ? '10' : '30000'}
                  />
                </div>

                <div>
                  <label className="block font-label-caps text-label-caps text-text-muted mb-2">Giảm tối đa</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={form.maxDiscountAmount}
                    onChange={(event) => setForm({ ...form, maxDiscountAmount: event.target.value })}
                    className="w-full h-11 px-4 rounded-lg border border-border-subtle bg-transparent text-text-primary focus:border-[#1A1A2E] focus:ring-1 focus:ring-[#1A1A2E] outline-none transition-all"
                    placeholder="50000"
                  />
                </div>

                <div>
                  <label className="block font-label-caps text-label-caps text-text-muted mb-2">
                    Đơn tối thiểu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={form.minOrderAmount}
                    onChange={(event) => setForm({ ...form, minOrderAmount: event.target.value })}
                    className="w-full h-11 px-4 rounded-lg border border-border-subtle bg-transparent text-text-primary focus:border-[#1A1A2E] focus:ring-1 focus:ring-[#1A1A2E] outline-none transition-all"
                    placeholder="500000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-label-caps text-label-caps text-text-muted mb-2">
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(event) => setForm({ ...form, startDate: event.target.value })}
                    className="w-full h-11 px-4 rounded-lg border border-border-subtle bg-transparent text-text-primary focus:border-[#1A1A2E] focus:ring-1 focus:ring-[#1A1A2E] outline-none transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block font-label-caps text-label-caps text-text-muted mb-2">
                    Ngày kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(event) => setForm({ ...form, endDate: event.target.value })}
                    className="w-full h-11 px-4 rounded-lg border border-border-subtle bg-transparent text-text-primary focus:border-[#1A1A2E] focus:ring-1 focus:ring-[#1A1A2E] outline-none transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block font-label-caps text-label-caps text-text-muted mb-2">
                    Giới hạn lượt dùng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.usageLimit}
                    onChange={(event) => setForm({ ...form, usageLimit: event.target.value })}
                    className="w-full h-11 px-4 rounded-lg border border-border-subtle bg-transparent text-text-primary focus:border-[#1A1A2E] focus:ring-1 focus:ring-[#1A1A2E] outline-none transition-all"
                    placeholder="100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-label-caps text-label-caps text-text-muted mb-2">Trạng thái</label>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={`h-11 px-5 rounded-lg border font-label-caps text-label-caps transition-colors ${
                    form.isActive
                      ? 'bg-green-100 border-green-300 text-green-700'
                      : 'bg-gray-100 border-gray-300 text-gray-500'
                  }`}
                >
                  {form.isActive ? 'Đang bật' : 'Đã tắt'}
                </button>
              </div>

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
                  {saving ? 'Đang lưu...' : editingVoucher ? 'Cập nhật' : 'Tạo voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
