import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useToast } from '../../components/ui/ToastProvider'
import { useConfirm } from '../../components/ui/ConfirmProvider'
import { flashSaleService } from '../../services/flashSale.service'
import type {
  StaffFlashSaleCampaign,
  StaffFlashSaleCampaignRequest,
  StaffFlashSaleItem,
} from '../../services/flashSale.service'
import { staffService } from '../../services/staff.service'
import type { StaffProductListItem } from '../../services/staff.service'

type CampaignForm = {
  name: string
  description: string
  startAt: string
  endAt: string
  isActive: boolean
}

type ItemForm = {
  productId: string
  flashSalePrice: string
  quota: string
}

const EMPTY_CAMPAIGN: CampaignForm = {
  name: '',
  description: '',
  startAt: '',
  endAt: '',
  isActive: true,
}

const EMPTY_ITEM: ItemForm = { productId: '', flashSalePrice: '', quota: '' }

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response
    return response?.data?.message || fallback
  }
  return fallback
}

const toLocalInput = (value: string) => {
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

const formatMoney = (value: number) => `${Number(value).toLocaleString('vi-VN')}đ`
const formatDateTime = (value: string) => new Date(value).toLocaleString('vi-VN')

const statusStyle: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  UPCOMING: 'bg-blue-100 text-blue-700',
  ENDED: 'bg-slate-100 text-slate-600',
  DISABLED: 'bg-amber-100 text-amber-700',
}

const statusLabel: Record<string, string> = {
  ACTIVE: 'Đang diễn ra',
  UPCOMING: 'Sắp diễn ra',
  ENDED: 'Đã kết thúc',
  DISABLED: 'Đã tắt',
}

export default function FlashSaleManagement() {
  const toast = useToast()
  const confirm = useConfirm()
  const [campaigns, setCampaigns] = useState<StaffFlashSaleCampaign[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCampaignForm, setShowCampaignForm] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState(false)
  const [campaignForm, setCampaignForm] = useState<CampaignForm>(EMPTY_CAMPAIGN)
  const [showItemForm, setShowItemForm] = useState(false)
  const [editingItem, setEditingItem] = useState<StaffFlashSaleItem | null>(null)
  const [itemForm, setItemForm] = useState<ItemForm>(EMPTY_ITEM)
  const [products, setProducts] = useState<StaffProductListItem[]>([])
  const [productKeyword, setProductKeyword] = useState('')
  const [showProductOptions, setShowProductOptions] = useState(false)

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.id === selectedId) || null,
    [campaigns, selectedId],
  )
  const isSelectedCampaignEnded = selectedCampaign?.status === 'ENDED'

  const fetchCampaigns = async (preferredId?: number) => {
    try {
      setLoading(true)
      const data = await flashSaleService.getStaffCampaigns()
      setCampaigns(data)
      setSelectedId((current) => preferredId ?? current ?? data[0]?.id ?? null)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không tải được danh sách Flash Sale.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial remote data synchronization for this management screen.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCampaigns()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!showItemForm) return
    const timer = window.setTimeout(async () => {
      try {
        const data = await staffService.getProducts({
          keyword: productKeyword || undefined,
          status: 'ACTIVE',
          page: 0,
          size: 50,
        })
        setProducts(data.content || data || [])
      } catch (error) {
        toast.error(getErrorMessage(error, 'Không tải được danh sách sản phẩm.'))
      }
    }, 250)
    return () => window.clearTimeout(timer)
  }, [showItemForm, productKeyword, toast])

  const openCreateCampaign = () => {
    setEditingCampaign(false)
    setCampaignForm(EMPTY_CAMPAIGN)
    setShowCampaignForm(true)
  }

  const openEditCampaign = () => {
    if (!selectedCampaign || selectedCampaign.status === 'ENDED') return
    setEditingCampaign(true)
    setCampaignForm({
      name: selectedCampaign.name,
      description: selectedCampaign.description || '',
      startAt: toLocalInput(selectedCampaign.startAt),
      endAt: toLocalInput(selectedCampaign.endAt),
      isActive: selectedCampaign.isActive,
    })
    setShowCampaignForm(true)
  }

  const saveCampaign = async (event: FormEvent) => {
    event.preventDefault()
    const start = new Date(campaignForm.startAt)
    const end = new Date(campaignForm.endAt)
    if (!campaignForm.name.trim() || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast.error('Vui lòng nhập đầy đủ tên và thời gian chiến dịch.')
      return
    }
    if (end <= start) {
      toast.error('Thời gian kết thúc phải sau thời gian bắt đầu.')
      return
    }
    const request: StaffFlashSaleCampaignRequest = {
      name: campaignForm.name.trim(),
      description: campaignForm.description.trim(),
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      isActive: campaignForm.isActive,
    }
    try {
      setSaving(true)
      const saved = editingCampaign && selectedCampaign
        ? await flashSaleService.updateStaffCampaign(selectedCampaign.id, request)
        : await flashSaleService.createStaffCampaign(request)
      toast.success(editingCampaign ? 'Đã cập nhật chiến dịch.' : 'Đã tạo chiến dịch Flash Sale.')
      setShowCampaignForm(false)
      await fetchCampaigns(saved.id)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không lưu được chiến dịch.'))
    } finally {
      setSaving(false)
    }
  }

  const toggleActivation = async () => {
    if (!selectedCampaign || selectedCampaign.status === 'ENDED') return
    try {
      await flashSaleService.updateStaffActivation(selectedCampaign.id, !selectedCampaign.isActive)
      toast.success(selectedCampaign.isActive ? 'Đã tắt chiến dịch.' : 'Đã bật chiến dịch.')
      await fetchCampaigns(selectedCampaign.id)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không cập nhật được trạng thái chiến dịch.'))
    }
  }

  const openAddItem = () => {
    if (selectedCampaign?.status === 'ENDED') return
    setEditingItem(null)
    setItemForm(EMPTY_ITEM)
    setProductKeyword('')
    setShowProductOptions(false)
    setShowItemForm(true)
  }

  const openEditItem = (item: StaffFlashSaleItem) => {
    if (selectedCampaign?.status === 'ENDED') return
    setEditingItem(item)
    setItemForm({
      productId: String(item.productId),
      flashSalePrice: String(item.flashSalePrice),
      quota: String(item.quota),
    })
    setProductKeyword(item.productName)
    setShowProductOptions(false)
    setShowItemForm(true)
  }

  const saveItem = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedCampaign) return
    const productId = Number(itemForm.productId)
    const flashSalePrice = Number(itemForm.flashSalePrice)
    const quota = Number(itemForm.quota)
    if (!productId || flashSalePrice < 0 || !Number.isInteger(quota) || quota < 1) {
      toast.error('Vui lòng chọn sản phẩm, nhập giá hợp lệ và quota tối thiểu là 1.')
      return
    }
    const product = products.find((candidate) => candidate.id === productId)
    const regularPrice = product?.salePrice ?? product?.basePrice
    if (!editingItem && regularPrice != null && flashSalePrice >= regularPrice) {
      toast.error('Giá Flash Sale phải thấp hơn giá bán hiện tại.')
      return
    }
    try {
      setSaving(true)
      const request = { productId, flashSalePrice, quota }
      if (editingItem) {
        await flashSaleService.updateStaffItem(selectedCampaign.id, editingItem.id, request)
      } else {
        await flashSaleService.addStaffItem(selectedCampaign.id, request)
      }
      toast.success(editingItem ? 'Đã cập nhật sản phẩm Flash Sale.' : 'Đã thêm sản phẩm vào Flash Sale.')
      setShowItemForm(false)
      await fetchCampaigns(selectedCampaign.id)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không lưu được sản phẩm Flash Sale.'))
    } finally {
      setSaving(false)
    }
  }

  const removeItem = async (item: StaffFlashSaleItem) => {
    if (!selectedCampaign || selectedCampaign.status === 'ENDED') return
    const accepted = await confirm({
      title: 'Xóa sản phẩm Flash Sale',
      message: `Bạn có chắc muốn xóa “${item.productName}” khỏi chiến dịch?`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger',
    })
    if (!accepted) return
    try {
      await flashSaleService.removeStaffItem(selectedCampaign.id, item.id)
      toast.success('Đã xóa sản phẩm khỏi chiến dịch.')
      await fetchCampaigns(selectedCampaign.id)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể xóa sản phẩm đã phát sinh lượt giữ chỗ hoặc bán.'))
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2421] md:text-3xl">Quản lý Flash Sale</h1>
          <p className="mt-1 text-sm text-[#8A8A80]">Thiết lập thời gian, sản phẩm, giá ưu đãi và quota bán.</p>
        </div>
        <button onClick={openCreateCampaign} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#C1272D] px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-[#A91F25]">
          <span className="material-symbols-outlined text-[20px]">add</span>
          Tạo chiến dịch
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-xl border border-[#E2D9C8] bg-white">
          <div className="border-b border-[#E2D9C8] bg-[#FBF7EF] px-4 py-3 font-semibold">Chiến dịch ({campaigns.length})</div>
          <div className="max-h-[680px] space-y-2 overflow-y-auto p-3">
            {loading && <p className="p-4 text-center text-sm text-[#8A8A80]">Đang tải...</p>}
            {!loading && campaigns.length === 0 && <p className="p-6 text-center text-sm text-[#8A8A80]">Chưa có chiến dịch Flash Sale.</p>}
            {campaigns.map((campaign) => (
              <button key={campaign.id} onClick={() => setSelectedId(campaign.id)} className={`w-full rounded-lg border p-3 text-left transition ${selectedId === campaign.id ? 'border-[#C1272D] bg-red-50' : 'border-[#E2D9C8] hover:bg-[#FBF7EF]'}`}>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-[#1F2421]">{campaign.name}</span>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${statusStyle[campaign.status] || statusStyle.DISABLED}`}>{statusLabel[campaign.status] || campaign.status}</span>
                </div>
                <p className="mt-2 text-xs text-[#8A8A80]">{formatDateTime(campaign.startAt)}</p>
                <p className="text-xs text-[#8A8A80]">đến {formatDateTime(campaign.endAt)}</p>
                <p className="mt-2 text-xs font-medium text-[#5F5F57]">{campaign.items.length} sản phẩm</p>
              </button>
            ))}
          </div>
        </section>

        <section className="min-w-0 rounded-xl border border-[#E2D9C8] bg-white p-4 md:p-6">
          {!selectedCampaign ? (
            <div className="flex min-h-80 flex-col items-center justify-center text-[#8A8A80]">
              <span className="material-symbols-outlined text-5xl">bolt</span>
              <p className="mt-2">Chọn hoặc tạo một chiến dịch để quản lý.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 border-b border-[#E2D9C8] pb-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-bold text-[#1F2421]">{selectedCampaign.name}</h2>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle[selectedCampaign.status]}`}>{statusLabel[selectedCampaign.status]}</span>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm text-[#5F5F57]">{selectedCampaign.description || 'Không có mô tả.'}</p>
                  <p className="mt-2 text-xs text-[#8A8A80]">{formatDateTime(selectedCampaign.startAt)} — {formatDateTime(selectedCampaign.endAt)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button disabled={isSelectedCampaignEnded} onClick={openEditCampaign} title={isSelectedCampaignEnded ? 'Chiến dịch đã kết thúc chỉ được xem lịch sử' : 'Chỉnh sửa chiến dịch'} className="rounded-lg border border-[#D8D1C4] px-3 py-2 text-sm font-semibold hover:bg-[#FBF7EF] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400">Chỉnh sửa</button>
                  <button disabled={isSelectedCampaignEnded} onClick={toggleActivation} title={isSelectedCampaignEnded ? 'Không thể bật lại chiến dịch đã kết thúc' : undefined} className={`rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300 ${selectedCampaign.isActive ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'}`}>{selectedCampaign.isActive ? 'Tắt' : 'Bật'}</button>
                </div>
              </div>

              {isSelectedCampaignEnded && (
                <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <span className="material-symbols-outlined text-slate-500">history</span>
                  <div><p className="font-semibold">Chiến dịch đã được lưu vào lịch sử</p><p className="mt-1 text-xs text-slate-500">Dữ liệu thời gian, sản phẩm, giá và quota được khóa để bảo toàn báo cáo bán hàng. Hãy tạo chiến dịch mới nếu muốn tổ chức lại chương trình.</p></div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#1F2421]">Sản phẩm và quota</h3>
                  <p className="text-xs text-[#8A8A80]">Số còn lại = quota − đang giữ − đã bán.</p>
                </div>
                <button disabled={isSelectedCampaignEnded} onClick={openAddItem} title={isSelectedCampaignEnded ? 'Không thể thêm sản phẩm vào chiến dịch đã kết thúc' : undefined} className="inline-flex items-center gap-1 rounded-lg bg-[#1F2421] px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:bg-slate-300">
                  <span className="material-symbols-outlined text-lg">add</span> Thêm sản phẩm
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-[#E2D9C8]">
                <table className="min-w-[850px] w-full text-sm">
                  <thead className="bg-[#FBF7EF] text-left text-xs uppercase text-[#6F6F66]">
                    <tr><th className="p-3">Sản phẩm</th><th className="p-3">Giá thường</th><th className="p-3">Giá Flash Sale</th><th className="p-3 text-center">Quota</th><th className="p-3 text-center">Đang chờ thanh toán</th><th className="p-3 text-center">Đã bán</th><th className="p-3 text-center">Còn lại</th><th className="p-3 text-right">Thao tác</th></tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEE7DA]">
                    {selectedCampaign.items.map((item) => {
                      const percent = item.quota > 0 ? Math.min(100, (item.soldQuantity / item.quota) * 100) : 0
                      return (
                        <tr key={item.id} className="hover:bg-[#FFFCF7]">
                          <td className="p-3"><p className="max-w-[220px] font-semibold text-[#1F2421]">{item.productName}</p><div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-red-100"><div className="h-full bg-red-600" style={{ width: `${percent}%` }} /></div></td>
                          <td className="p-3 text-[#6F6F66] line-through">{formatMoney(item.originalPrice)}</td>
                          <td className="p-3 font-bold text-[#C1272D]">{formatMoney(item.flashSalePrice)}</td>
                          <td className="p-3 text-center font-semibold">{item.quota}</td><td className="p-3 text-center text-amber-700">{item.reservedQuantity}</td><td className="p-3 text-center text-blue-700">{item.soldQuantity}</td><td className="p-3 text-center font-bold text-green-700">{item.availableQuantity}</td>
                          <td className="p-3"><div className="flex justify-end gap-1"><button disabled={isSelectedCampaignEnded} onClick={() => openEditItem(item)} className="rounded p-2 text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-300" title={isSelectedCampaignEnded ? 'Dữ liệu lịch sử chỉ được xem' : 'Sửa'}><span className="material-symbols-outlined text-lg">edit</span></button><button disabled={isSelectedCampaignEnded} onClick={() => removeItem(item)} className="rounded p-2 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-300" title={isSelectedCampaignEnded ? 'Dữ liệu lịch sử chỉ được xem' : 'Xóa'}><span className="material-symbols-outlined text-lg">delete</span></button></div></td>
                        </tr>
                      )
                    })}
                    {selectedCampaign.items.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-[#8A8A80]">Chưa có sản phẩm trong chiến dịch.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      {showCampaignForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={saveCampaign} className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold">{editingCampaign ? 'Chỉnh sửa chiến dịch' : 'Tạo chiến dịch Flash Sale'}</h2><button type="button" onClick={() => setShowCampaignForm(false)}><span className="material-symbols-outlined">close</span></button></div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2 text-sm font-semibold">Tên chiến dịch<input required maxLength={150} value={campaignForm.name} onChange={(event) => setCampaignForm({ ...campaignForm, name: event.target.value })} className="mt-1 w-full rounded-lg border border-[#D8D1C4] px-3 py-2 font-normal" /></label>
              <label className="md:col-span-2 text-sm font-semibold">Mô tả<textarea rows={3} value={campaignForm.description} onChange={(event) => setCampaignForm({ ...campaignForm, description: event.target.value })} className="mt-1 w-full rounded-lg border border-[#D8D1C4] px-3 py-2 font-normal" /></label>
              <label className="text-sm font-semibold">Bắt đầu<input required type="datetime-local" value={campaignForm.startAt} onChange={(event) => setCampaignForm({ ...campaignForm, startAt: event.target.value })} className="mt-1 w-full rounded-lg border border-[#D8D1C4] px-3 py-2 font-normal" /></label>
              <label className="text-sm font-semibold">Kết thúc<input required type="datetime-local" value={campaignForm.endAt} onChange={(event) => setCampaignForm({ ...campaignForm, endAt: event.target.value })} className="mt-1 w-full rounded-lg border border-[#D8D1C4] px-3 py-2 font-normal" /></label>
              <label className="md:col-span-2 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={campaignForm.isActive} onChange={(event) => setCampaignForm({ ...campaignForm, isActive: event.target.checked })} className="rounded" /> Kích hoạt chiến dịch</label>
            </div>
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setShowCampaignForm(false)} className="rounded-lg border px-4 py-2">Hủy</button><button disabled={saving} className="rounded-lg bg-[#C1272D] px-5 py-2 font-semibold text-white disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu chiến dịch'}</button></div>
          </form>
        </div>
      )}

      {showItemForm && selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={saveItem} className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold">{editingItem ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm Flash Sale'}</h2><button type="button" onClick={() => setShowItemForm(false)}><span className="material-symbols-outlined">close</span></button></div>
            <div className="space-y-4">
              <label className="block text-sm font-semibold">Sản phẩm
                <div className="relative mt-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-xl text-[#8A8A80]">search</span>
                  <input
                    required
                    disabled={Boolean(editingItem)}
                    value={productKeyword}
                    onFocus={() => !editingItem && setShowProductOptions(true)}
                    onChange={(event) => {
                      setProductKeyword(event.target.value)
                      setItemForm({ ...itemForm, productId: '' })
                      setShowProductOptions(true)
                    }}
                    placeholder="Nhập tên để tìm và chọn sản phẩm..."
                    className="w-full rounded-lg border border-[#D8D1C4] py-2 pl-10 pr-10 font-normal disabled:bg-slate-100"
                  />
                  {productKeyword && !editingItem && (
                    <button type="button" onClick={() => { setProductKeyword(''); setItemForm({ ...itemForm, productId: '' }); setShowProductOptions(true) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A80]">
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  )}
                  {showProductOptions && !editingItem && (
                    <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-[#D8D1C4] bg-white p-1 shadow-xl">
                      {products.filter((product) => !selectedCampaign.items.some((item) => item.productId === product.id)).map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => {
                            setItemForm({ ...itemForm, productId: String(product.id) })
                            setProductKeyword(product.name)
                            setShowProductOptions(false)
                          }}
                          className="flex w-full items-center justify-between gap-4 rounded-md px-3 py-2.5 text-left hover:bg-[#FBF7EF]"
                        >
                          <span className="min-w-0"><span className="block truncate font-medium text-[#1F2421]">{product.name}</span><span className="text-xs text-[#8A8A80]">Tồn kho: {product.totalStock}</span></span>
                          <span className="shrink-0 font-semibold text-[#C1272D]">{formatMoney(product.salePrice ?? product.basePrice)}</span>
                        </button>
                      ))}
                      {products.filter((product) => !selectedCampaign.items.some((item) => item.productId === product.id)).length === 0 && (
                        <p className="px-3 py-5 text-center text-sm font-normal text-[#8A8A80]">Không tìm thấy sản phẩm phù hợp.</p>
                      )}
                    </div>
                  )}
                </div>
                {!editingItem && productKeyword && !itemForm.productId && <span className="mt-1 block text-xs font-normal text-amber-700">Hãy chọn một sản phẩm trong danh sách kết quả.</span>}
              </label>
              <div className="grid grid-cols-2 gap-4"><label className="text-sm font-semibold">Giá Flash Sale<input required type="number" min="0" step="1000" value={itemForm.flashSalePrice} onChange={(event) => setItemForm({ ...itemForm, flashSalePrice: event.target.value })} className="mt-1 w-full rounded-lg border border-[#D8D1C4] px-3 py-2 font-normal" /></label><label className="text-sm font-semibold">Quota<input required type="number" min={editingItem ? editingItem.reservedQuantity + editingItem.soldQuantity : 1} step="1" value={itemForm.quota} onChange={(event) => setItemForm({ ...itemForm, quota: event.target.value })} className="mt-1 w-full rounded-lg border border-[#D8D1C4] px-3 py-2 font-normal" /></label></div>
              {editingItem && <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Quota không được thấp hơn tổng đang giữ và đã bán: {editingItem.reservedQuantity + editingItem.soldQuantity}.</p>}
            </div>
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setShowItemForm(false)} className="rounded-lg border px-4 py-2">Hủy</button><button disabled={saving} className="rounded-lg bg-[#1F2421] px-5 py-2 font-semibold text-white disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu sản phẩm'}</button></div>
          </form>
        </div>
      )}
    </div>
  )
}
