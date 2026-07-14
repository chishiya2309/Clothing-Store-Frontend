import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  addressService,
  type AddressRequest,
  type AddressResponse,
  type District,
  type Province,
  type Ward,
} from '@/services/address.service'
import { checkoutService, type PaymentMethod } from '@/services/checkout.service'
import { profileService } from '@/services/profile.service'
import { voucherService, type AppliedVoucherResponse } from '@/services/voucher.service'
import { useCartStore } from '@/store/cartStore'
import { calculateShippingFee } from '@/utils/shipping'
import axios from 'axios'
import { flashSaleService, type FlashSaleCampaign, type FlashSaleProduct } from '@/services/flashSale.service'

type AddressMode = 'saved' | 'new'

interface AddressFormState {
  recipientName: string
  phone: string
  provinceCode: string
  districtCode: string
  wardCode: string
  streetAddress: string
  saveInfo: boolean
}

const EMPTY_ADDRESS_FORM: AddressFormState = {
  recipientName: '',
  phone: '',
  provinceCode: '',
  districtCode: '',
  wardCode: '',
  streetAddress: '',
  saveInfo: true,
}

const PAYMENT_OPTIONS: Array<{ value: PaymentMethod; label: string; description: string; icon: string; iconClass: string }> = [
  {
    value: 'cod',
    label: 'Thanh toán khi nhận hàng (COD)',
    description: 'Thanh toán bằng tiền mặt khi nhận được sản phẩm.',
    icon: 'local_shipping',
    iconClass: 'text-on-surface-variant',
  },
  {
    value: 'momo',
    label: 'Ví MoMo',
    description: 'Chuyển sang cổng MoMo để hoàn tất thanh toán.',
    icon: 'account_balance_wallet',
    iconClass: 'text-[#A50064]',
  },
  {
    value: 'vnpay',
    label: 'VNPay',
    description: 'Thanh toán bằng thẻ ATM, QR hoặc ngân hàng qua VNPay.',
    icon: 'qr_code_scanner',
    iconClass: 'text-[#005BAA]',
  },
]

const formatMoney = (value: number | string) => `${Number(value || 0).toLocaleString('vi-VN')}đ`

const getCheckoutErrorMessage = (error: unknown): string => {
  if (!axios.isAxiosError<{ message?: string }>(error)) {
    return 'Không thể đặt hàng. Vui lòng thử lại.'
  }

  const message = error.response?.data?.message || ''
  if (message.includes('Flash sale quota is insufficient')) {
    return 'Rất tiếc, suất Flash Sale của sản phẩm đã hết. Vui lòng quay lại giỏ hàng để kiểm tra sản phẩm.'
  }
  if (message.toLowerCase().includes('does not have enough stock')) {
    return 'Một sản phẩm trong giỏ hàng không còn đủ số lượng. Vui lòng kiểm tra lại giỏ hàng.'
  }
  return message || 'Không thể đặt hàng. Vui lòng kiểm tra lại thông tin.'
}

export default function Checkout() {
  const navigate = useNavigate()
  const { items, totalAmount, loading: cartLoading, fetchCart } = useCartStore()

  const [addresses, setAddresses] = useState<AddressResponse[]>([])
  const [addressesLoading, setAddressesLoading] = useState(true)
  const [addressMode, setAddressMode] = useState<AddressMode>('saved')
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [addressForm, setAddressForm] = useState<AddressFormState>(EMPTY_ADDRESS_FORM)
  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod')
  const [membershipDiscountPercent, setMembershipDiscountPercent] = useState<number>(0)
  const [voucherCode, setVoucherCode] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucherResponse | null>(null)
  const [voucherLoading, setVoucherLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [voucherMessage, setVoucherMessage] = useState<string | null>(null)
  const [flashSale, setFlashSale] = useState<FlashSaleCampaign | null>(null)

  const flashSaleByProductId = useMemo(
    () => new Map((flashSale?.items || []).map((item) => [item.productId, item])),
    [flashSale],
  )
  const resolveFlashUnitPrice = (unitPrice: number, sale: FlashSaleProduct) =>
    Number(sale.flashSalePrice) + Math.max(0, Number(unitPrice) - Number(sale.originalPrice))
  const canApplyFlashSale = (sale: FlashSaleProduct | undefined, quantity: number) =>
    Boolean(sale && !sale.soldOut && quantity <= sale.availableQuantity)
  const checkoutSubtotal = useMemo(
    () => items.reduce((sum, item) => {
      const sale = flashSaleByProductId.get(item.productId)
      return sum + (canApplyFlashSale(sale, item.quantity)
        ? resolveFlashUnitPrice(item.unitPrice, sale!) * item.quantity
        : Number(item.subtotal))
    }, 0),
    [items, flashSaleByProductId],
  )
  const shippingFee = calculateShippingFee(checkoutSubtotal)
  const membershipDiscountAmount = checkoutSubtotal ? (checkoutSubtotal * membershipDiscountPercent / 100) : 0
  const discountAmount = appliedVoucher ? Number(appliedVoucher.discountAmount || 0) : 0
  const shippingDiscountAmount = appliedVoucher ? Number(appliedVoucher.shippingDiscountAmount || 0) : 0
  const total = appliedVoucher
    ? Math.max(0, Number(appliedVoucher.totalAmount || 0) - membershipDiscountAmount)
    : Math.max(0, checkoutSubtotal + shippingFee - membershipDiscountAmount)

  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId) || null,
    [addresses, selectedAddressId],
  )

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  useEffect(() => {
    let mounted = true

    const loadAddresses = async () => {
      try {
        const data = await addressService.getAddresses()
        if (!mounted) return
        setAddresses(data)
        const defaultAddress = data.find((address) => address.isDefault) || data[0]
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id)
          setAddressMode('saved')
        } else {
          setAddressMode('new')
        }
      } catch {
        if (mounted) {
          setError('Không thể tải sổ địa chỉ. Vui lòng thử lại sau.')
          setAddressMode('new')
        }
      } finally {
        if (mounted) setAddressesLoading(false)
      }
    }

    const loadMembership = async () => {
      try {
        const info = await profileService.getMembershipInfo()
        if (mounted && info) {
          setMembershipDiscountPercent(info.currentTierDiscount || 0)
        }
      } catch (err) {
        console.error('Failed to load membership info', err)
      }
    }

    loadAddresses()
    loadMembership()
    flashSaleService.getCurrent().then(setFlashSale).catch(() => setFlashSale(null))
    addressService.getProvinces().then(setProvinces).catch(() => setProvinces([]))

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!addressForm.provinceCode) {
      setDistricts([])
      setWards([])
      return
    }

    addressService
      .getDistricts(Number(addressForm.provinceCode))
      .then(setDistricts)
      .catch(() => setDistricts([]))
    setAddressForm((current) => ({ ...current, districtCode: '', wardCode: '' }))
  }, [addressForm.provinceCode])

  useEffect(() => {
    if (!addressForm.districtCode) {
      setWards([])
      return
    }

    addressService.getWards(Number(addressForm.districtCode)).then(setWards).catch(() => setWards([]))
    setAddressForm((current) => ({ ...current, wardCode: '' }))
  }, [addressForm.districtCode])

  useEffect(() => {
    setAppliedVoucher(null)
    setVoucherMessage(null)
  }, [totalAmount])

  const updateAddressForm = <K extends keyof AddressFormState>(field: K, value: AddressFormState[K]) => {
    setAddressForm((current) => ({ ...current, [field]: value }))
  }

  const buildAddressRequest = (): AddressRequest | null => {
    const province = provinces.find((item) => String(item.code) === addressForm.provinceCode)
    const district = districts.find((item) => String(item.code) === addressForm.districtCode)
    const ward = wards.find((item) => String(item.code) === addressForm.wardCode)

    if (
      !addressForm.recipientName.trim() ||
      !addressForm.phone.trim() ||
      !province ||
      !district ||
      !ward ||
      !addressForm.streetAddress.trim()
    ) {
      setError('Vui lòng nhập đầy đủ thông tin giao hàng.')
      return null
    }

    return {
      recipientName: addressForm.recipientName.trim(),
      phone: addressForm.phone.trim(),
      province: province.name,
      district: district.name,
      ward: ward.name,
      streetAddress: addressForm.streetAddress.trim(),
      isDefault: addressForm.saveInfo || addresses.length === 0,
    }
  }

  const handleApplyVoucher = async () => {
    const code = voucherCode.trim()
    if (!code) {
      setVoucherMessage('Vui lòng nhập mã giảm giá.')
      return
    }

    setVoucherLoading(true)
    setVoucherMessage(null)
    setError(null)
    try {
      const data = await voucherService.apply({
        code,
        subtotal: checkoutSubtotal,
        shippingFee,
      })
      setAppliedVoucher(data)
      setVoucherCode(data.code)
      setVoucherMessage(data.message || 'Áp dụng mã giảm giá thành công.')
    } catch (err: any) {
      setAppliedVoucher(null)
      setVoucherMessage(err.response?.data?.message || 'Mã giảm giá không thể áp dụng.')
    } finally {
      setVoucherLoading(false)
    }
  }

  const resolveAddressId = async (): Promise<number | null> => {
    if (addressMode === 'saved') {
      if (!selectedAddressId) {
        setError('Vui lòng chọn địa chỉ giao hàng.')
        return null
      }
      return selectedAddressId
    }

    const request = buildAddressRequest()
    if (!request) return null

    const created = await addressService.createAddress(request)
    setAddresses((current) => [created, ...current])
    setSelectedAddressId(created.id)
    setAddressMode('saved')
    return created.id
  }

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      navigate('/cart')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const addressId = await resolveAddressId()
      if (!addressId) return

      const response = await checkoutService.confirm({
        addressId,
        voucherCode: appliedVoucher?.code || null,
        paymentMethod,
      })

      if (response.order) {
        await fetchCart()
        navigate('/checkout/result', {
          state: {
            status: 'success',
            orderCode: response.order.orderCode,
            checkoutCode: response.checkoutCode,
            paymentMethod: response.paymentMethod,
            message: 'Đơn hàng đã được tạo thành công. Bạn có thể theo dõi trạng thái trong mục đơn hàng.',
          },
        })
        return
      }

      if (response.onlinePayment?.paymentUrl) {
        window.location.href = response.onlinePayment.paymentUrl
        return
      }

      navigate('/checkout/result', {
        state: {
          status: 'pending',
          checkoutCode: response.checkoutCode,
          paymentMethod: response.paymentMethod,
          message: 'Checkout đã được ghi nhận và đang chờ thanh toán.',
        },
      })
    } catch (err: unknown) {
      setError(getCheckoutErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (cartLoading && items.length === 0) {
    return (
      <div className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-xl flex justify-center">
        <div className="flex flex-col items-center gap-sm text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-[40px]">sync</span>
          <span>Đang tải thông tin thanh toán...</span>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-xl text-center">
        <span className="material-symbols-outlined text-[64px] text-on-surface-variant mb-sm">shopping_cart</span>
        <h1 className="font-headline-lg text-headline-lg text-primary mb-sm">Giỏ hàng đang trống</h1>
        <p className="text-on-surface-variant mb-lg">Bạn cần có sản phẩm trong giỏ trước khi thanh toán.</p>
        <Link to="/cart" className="bg-primary text-on-primary px-lg py-sm rounded font-label-caps text-label-caps">
          Quay lại giỏ hàng
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-lg md:py-xl">
      <div className="flex flex-col lg:flex-row gap-xl">
        <div className="w-full lg:w-3/5 flex flex-col gap-lg">
          <div className="flex items-center justify-between border-b border-border-subtle pb-md">
            <div className="flex items-center gap-sm">
              <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-caps text-label-caps font-bold">
                1
              </div>
              <span className="font-label-caps text-label-caps text-primary font-bold">Thông tin giao hàng</span>
            </div>
            <div className="h-px bg-border-subtle flex-grow mx-md hidden sm:block" />
            <div className="flex items-center gap-sm opacity-70 hidden sm:flex">
              <div className="w-8 h-8 rounded-full border border-outline text-text-muted flex items-center justify-center font-label-caps text-label-caps">
                2
              </div>
              <span className="font-label-caps text-label-caps text-text-muted">Thanh toán</span>
            </div>
            <div className="h-px bg-border-subtle flex-grow mx-md hidden sm:block" />
            <div className="flex items-center gap-sm opacity-70 hidden sm:flex">
              <div className="w-8 h-8 rounded-full border border-outline text-text-muted flex items-center justify-center font-label-caps text-label-caps">
                3
              </div>
              <span className="font-label-caps text-label-caps text-text-muted">Hoàn tất</span>
            </div>
          </div>

          {error && (
            <div className="bg-error-container text-on-error-container border border-error/30 rounded-lg p-sm font-body-sm text-body-sm">
              {error}
            </div>
          )}

          <section className="flex flex-col gap-md">
            <div className="flex items-center justify-between gap-md">
              <h2 className="font-headline-md text-headline-md text-primary">Thông tin giao hàng</h2>
              {addresses.length > 0 && (
                <div className="flex rounded border border-border-subtle overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setAddressMode('saved')}
                    className={`px-sm py-xs font-label-caps text-label-caps ${
                      addressMode === 'saved' ? 'bg-primary text-on-primary' : 'bg-surface text-primary'
                    }`}
                  >
                    Đã lưu
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddressMode('new')}
                    className={`px-sm py-xs font-label-caps text-label-caps ${
                      addressMode === 'new' ? 'bg-primary text-on-primary' : 'bg-surface text-primary'
                    }`}
                  >
                    Thêm mới
                  </button>
                </div>
              )}
            </div>

            {addressMode === 'saved' && addresses.length > 0 ? (
              <div className="grid grid-cols-1 gap-sm">
                {addresses.map((address) => (
                  <label key={address.id} className="cursor-pointer">
                    <input
                      type="radio"
                      name="address"
                      className="sr-only"
                      checked={selectedAddressId === address.id}
                      onChange={() => setSelectedAddressId(address.id)}
                    />
                    <div
                      className={`border rounded-lg p-md transition-colors ${
                        selectedAddressId === address.id
                          ? 'border-primary bg-surface-alt'
                          : 'border-border-subtle bg-surface-container-lowest hover:border-outline'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-md">
                        <div>
                          <div className="font-body-md text-body-md text-primary font-medium">
                            {address.recipientName}
                            {address.isDefault && (
                              <span className="ml-sm text-[10px] font-label-caps text-success border border-success/30 px-xs py-[2px] rounded">
                                Mặc định
                              </span>
                            )}
                          </div>
                          <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">{address.phone}</p>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">
                            {address.streetAddress}, {address.ward}, {address.district}, {address.province}
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-primary">
                          {selectedAddressId === address.id ? 'radio_button_checked' : 'radio_button_unchecked'}
                        </span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
                <input
                  className="md:col-span-2 w-full border border-border-subtle rounded px-md py-sm bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md"
                  placeholder="Họ và tên"
                  value={addressForm.recipientName}
                  onChange={(event) => updateAddressForm('recipientName', event.target.value)}
                />
                <input
                  className="md:col-span-2 w-full border border-border-subtle rounded px-md py-sm bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md"
                  placeholder="Số điện thoại"
                  type="tel"
                  value={addressForm.phone}
                  onChange={(event) => updateAddressForm('phone', event.target.value)}
                />
                <select
                  className="w-full border border-border-subtle rounded px-md py-sm bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md"
                  value={addressForm.provinceCode}
                  onChange={(event) => updateAddressForm('provinceCode', event.target.value)}
                >
                  <option value="">Tỉnh / Thành phố</option>
                  {provinces.map((province) => (
                    <option key={province.code} value={province.code}>
                      {province.name}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full border border-border-subtle rounded px-md py-sm bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md"
                  value={addressForm.districtCode}
                  onChange={(event) => updateAddressForm('districtCode', event.target.value)}
                  disabled={!addressForm.provinceCode}
                >
                  <option value="">Quận / Huyện</option>
                  {districts.map((district) => (
                    <option key={district.code} value={district.code}>
                      {district.name}
                    </option>
                  ))}
                </select>
                <select
                  className="md:col-span-2 w-full border border-border-subtle rounded px-md py-sm bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md"
                  value={addressForm.wardCode}
                  onChange={(event) => updateAddressForm('wardCode', event.target.value)}
                  disabled={!addressForm.districtCode}
                >
                  <option value="">Phường / Xã</option>
                  {wards.map((ward) => (
                    <option key={ward.code} value={ward.code}>
                      {ward.name}
                    </option>
                  ))}
                </select>
                <input
                  className="md:col-span-2 w-full border border-border-subtle rounded px-md py-sm bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md"
                  placeholder="Địa chỉ cụ thể (Số nhà, tên đường...)"
                  value={addressForm.streetAddress}
                  onChange={(event) => updateAddressForm('streetAddress', event.target.value)}
                />
                <label className="md:col-span-2 flex items-center gap-sm mt-xs">
                  <input
                    className="w-5 h-5 rounded-sm border-border-subtle text-primary focus:ring-primary"
                    type="checkbox"
                    checked={addressForm.saveInfo}
                    onChange={(event) => updateAddressForm('saveInfo', event.target.checked)}
                  />
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Lưu làm địa chỉ mặc định</span>
                </label>
              </div>
            )}

            {addressesLoading && <p className="text-on-surface-variant text-body-sm">Đang tải sổ địa chỉ...</p>}
            {selectedAddress && addressMode === 'saved' && (
              <p className="text-body-sm text-on-surface-variant">
                Giao đến: {selectedAddress.streetAddress}, {selectedAddress.ward}, {selectedAddress.district},{' '}
                {selectedAddress.province}
              </p>
            )}
          </section>

          <section className="flex flex-col gap-md">
            <h3 className="font-headline-md text-headline-md text-primary">Phương thức vận chuyển</h3>
            <div className="flex flex-col gap-sm">
              <div className="border border-primary bg-surface-alt rounded-lg p-md flex items-center justify-between">
                <div className="flex items-center gap-md">
                  <span className="material-symbols-outlined text-primary">radio_button_checked</span>
                  <div>
                    <div className="font-body-md text-body-md text-primary font-medium">Giao hàng tiêu chuẩn</div>
                    <div className="font-body-sm text-body-sm text-text-muted">2-3 ngày làm việc</div>
                  </div>
                </div>
                <div className={`font-price-display text-price-display ${shippingFee === 0 ? 'text-success' : 'text-primary'}`}>
                  {shippingFee === 0 ? 'Miễn phí' : formatMoney(shippingFee)}
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-md mt-sm">
            <h3 className="font-headline-md text-headline-md text-primary">Phương thức thanh toán</h3>
            <div className="border border-border-subtle rounded-lg overflow-hidden bg-surface-container-lowest">
              {PAYMENT_OPTIONS.map((option) => (
                <label key={option.value} className="cursor-pointer block border-b border-border-subtle last:border-b-0">
                  <input
                    type="radio"
                    name="payment"
                    className="sr-only"
                    checked={paymentMethod === option.value}
                    onChange={() => setPaymentMethod(option.value)}
                  />
                  <div
                    className={`p-md flex items-center gap-md transition-colors ${
                      paymentMethod === option.value ? 'bg-surface-alt' : 'hover:bg-surface-alt/50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-primary">
                      {paymentMethod === option.value ? 'radio_button_checked' : 'radio_button_unchecked'}
                    </span>
                    <span className={`material-symbols-outlined ${option.iconClass}`}>{option.icon}</span>
                    <div className="flex-grow">
                      <div className="font-body-md text-body-md text-primary">{option.label}</div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant">{option.description}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </section>
        </div>

        <div className="w-full lg:w-2/5">
          <div className="sticky top-28 bg-surface-alt p-md md:p-lg rounded-xl flex flex-col gap-lg">
            <h3 className="font-headline-md text-headline-md text-primary">Đơn hàng của bạn</h3>

            <div className="flex flex-col gap-md max-h-[409px] overflow-y-auto pr-sm">
              {items.map((item) => (
                <div key={item.productVariantId} className="flex gap-md items-center">
                  <div className="relative w-20 h-24 shrink-0 bg-surface-container-highest rounded overflow-hidden">
                    <img
                      alt={item.productName}
                      className="w-full h-full object-cover"
                      src={item.imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=300'}
                    />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-on-primary rounded-full flex items-center justify-center font-label-caps text-[10px] z-10 border-2 border-surface-alt">
                      {item.quantity}
                    </div>
                  </div>
                  <div className="flex flex-col flex-grow min-w-0">
                    <span className="font-body-md text-body-md text-primary font-medium truncate">{item.productName}</span>
                    <span className="font-body-sm text-body-sm text-text-muted">
                      {item.color} / {item.size}
                    </span>
                    <span className="font-price-display text-price-display text-primary mt-xs">
                      {formatMoney((canApplyFlashSale(flashSaleByProductId.get(item.productId), item.quantity)
                        ? resolveFlashUnitPrice(item.unitPrice, flashSaleByProductId.get(item.productId)!)
                        : item.unitPrice) * item.quantity)}
                    </span>
                    {!canApplyFlashSale(flashSaleByProductId.get(item.productId), item.quantity) && flashSaleByProductId.has(item.productId) ? (
                      <span className="mt-1 text-xs font-semibold text-text-muted">Hết/thiếu suất Flash Sale · áp dụng giá thường</span>
                    ) : flashSaleByProductId.has(item.productId) ? (
                      <span className="mt-1 text-xs font-semibold text-red-600">Đang áp dụng Flash Sale</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-xs border-y border-border-subtle py-md">
              <div className="flex gap-sm">
                <input
                  className="flex-grow min-w-0 border border-border-subtle rounded px-md py-sm bg-surface-container-lowest focus:outline-none focus:border-primary font-body-md text-body-md uppercase placeholder-text-muted"
                  placeholder="Mã giảm giá"
                  value={voucherCode}
                  onChange={(event) => {
                    setVoucherCode(event.target.value.toUpperCase())
                    setAppliedVoucher(null)
                    setVoucherMessage(null)
                  }}
                />
                <button
                  type="button"
                  onClick={handleApplyVoucher}
                  disabled={voucherLoading}
                  className="bg-surface-container-high text-primary px-md py-sm rounded font-label-caps text-label-caps hover:bg-outline-variant transition-colors border border-border-subtle disabled:opacity-50"
                >
                  {voucherLoading ? 'ĐANG ÁP DỤNG' : 'ÁP DỤNG'}
                </button>
              </div>
              {voucherMessage && (
                <p className={`text-body-sm ${appliedVoucher ? 'text-success' : 'text-error'}`}>{voucherMessage}</p>
              )}
            </div>

            <div className="flex flex-col gap-sm">
              <div className="flex justify-between items-center font-body-md text-body-md text-on-surface-variant">
                <span>Tạm tính</span>
                <span className="font-price-display">{formatMoney(checkoutSubtotal)}</span>
              </div>
              <div className="flex justify-between items-center font-body-md text-body-md text-on-surface-variant">
                <span>Phí vận chuyển</span>
                <span className={`font-price-display ${shippingFee === 0 ? 'text-success' : ''}`}>
                  {shippingFee === 0 ? 'Miễn phí' : formatMoney(shippingFee)}
                </span>
              </div>
              {membershipDiscountAmount > 0 && (
                <div className="flex justify-between items-center font-body-md text-body-md text-success">
                  <span>Ưu đãi hạng thành viên (-{membershipDiscountPercent}%)</span>
                  <span className="font-price-display">-{formatMoney(membershipDiscountAmount)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between items-center font-body-md text-body-md text-success">
                  <span>Giảm giá voucher</span>
                  <span className="font-price-display">-{formatMoney(discountAmount)}</span>
                </div>
              )}
              {shippingDiscountAmount > 0 && (
                <div className="flex justify-between items-center font-body-md text-body-md text-success">
                  <span>Giảm phí vận chuyển</span>
                  <span className="font-price-display">-{formatMoney(shippingDiscountAmount)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-end border-t border-border-subtle pt-md">
              <span className="font-headline-md text-headline-md text-primary">Tổng cộng</span>
              <div className="flex flex-col items-end">
                <span className="font-label-caps text-[10px] text-text-muted">Đã bao gồm VAT</span>
                <span className="font-headline-lg text-headline-lg text-primary">{formatMoney(total)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={submitting || addressesLoading}
              className="w-full bg-[#C1272D] text-on-error py-md rounded font-label-caps text-label-caps font-bold hover:opacity-90 hover:scale-[1.02] transition-all shadow-[0_4px_14px_0_rgba(193,39,45,0.39)] disabled:opacity-50 disabled:scale-100"
            >
              {submitting ? 'ĐANG XỬ LÝ' : paymentMethod === 'cod' ? 'ĐẶT HÀNG' : 'THANH TOÁN'}
            </button>

            <div className="flex justify-center items-center gap-md pt-sm opacity-70">
              <div className="flex items-center gap-xs font-label-caps text-[10px] text-primary">
                <span className="material-symbols-outlined text-[16px]">lock</span>
                <span>SECURE SSL</span>
              </div>
              <div className="w-px h-3 bg-outline" />
              <div className="flex items-center gap-xs font-label-caps text-[10px] text-primary">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>GENUINE WARRANTY</span>
              </div>
            </div>

            <Link to="/cart" className="text-center text-on-surface-variant font-label-caps text-label-caps hover:text-primary">
              Quay lại giỏ hàng
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
