import { useEffect, useState, useCallback } from 'react';
import { staffService } from '../../services/staff.service';
import type { StaffVoucherResponse } from '../../services/staff.service';

export default function CouponManagement() {
  const [vouchers, setVouchers] = useState<StaffVoucherResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Voucher modal CRUD states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVoucherId, setSelectedVoucherId] = useState<number | null>(null);
  
  // Form states
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_amount'>('fixed_amount');
  const [discountValue, setDiscountValue] = useState(0);
  const [minOrderValue, setMinOrderValue] = useState(0);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [usageLimit, setUsageLimit] = useState(1);
  const [isActive, setIsActive] = useState(true);
  
  const [submitting, setSubmitting] = useState(false);

  const fetchVouchers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await staffService.getVouchers();
      setVouchers(data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi khi tải danh sách mã giảm giá.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const handleOpenAdd = () => {
    setSelectedVoucherId(null);
    setCode('');
    setDiscountType('fixed_amount');
    setDiscountValue(0);
    setMinOrderValue(0);
    setMaxDiscountAmount('');
    
    // Set default dates: start is today, end is next month
    const today = new Date().toISOString().split('T')[0];
    const nextMonthDate = new Date();
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    const nextMonth = nextMonthDate.toISOString().split('T')[0];
    
    setStartDate(today);
    setEndDate(nextMonth);
    setUsageLimit(100);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (voucher: StaffVoucherResponse) => {
    setSelectedVoucherId(voucher.id);
    setCode(voucher.code);
    setDiscountType(voucher.discountType);
    setDiscountValue(voucher.discountValue);
    setMinOrderValue(voucher.minOrderAmount);
    setMaxDiscountAmount(voucher.maxDiscountAmount ? String(voucher.maxDiscountAmount) : '');
    
    // Format dates to YYYY-MM-DD
    setStartDate(voucher.startDate ? voucher.startDate.split('T')[0] : '');
    setEndDate(voucher.endDate ? voucher.endDate.split('T')[0] : '');
    setUsageLimit(voucher.usageLimit);
    setIsActive(voucher.isActive);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number, voucherCode: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mã giảm giá "${voucherCode}"?`)) return;
    try {
      await staffService.deleteVoucher(id);
      setVouchers(prev => prev.filter(v => v.id !== id));
      alert('Xóa mã giảm giá thành công.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa mã giảm giá này.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      alert('Vui lòng nhập mã giảm giá.');
      return;
    }
    if (discountValue <= 0) {
      alert('Giá trị giảm phải lớn hơn 0.');
      return;
    }
    if (discountType === 'percentage' && discountValue > 100) {
      alert('Giá trị phần trăm giảm không thể vượt quá 100%.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      alert('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.');
      return;
    }

    const payload = {
      code: code.trim().toUpperCase(),
      discountType,
      discountValue,
      minOrderAmount: minOrderValue,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      usageLimit,
      isActive
    };

    try {
      setSubmitting(true);
      if (selectedVoucherId) {
        await staffService.updateVoucher(selectedVoucherId, payload);
        alert('Cập nhật mã giảm giá thành công.');
      } else {
        await staffService.createVoucher(payload);
        alert('Tạo mã giảm giá thành công.');
      }
      setIsModalOpen(false);
      fetchVouchers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu mã giảm giá.');
    } finally {
      setSubmitting(false);
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit <= 0) return 0;
    return Math.min(Math.round((used / limit) * 100), 100);
  };

  return (
    <div className="bg-[#FAFAF8] min-h-full font-body-sm text-body-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-md">
        <h2 className="font-headline-lg text-headline-lg font-bold">Quản lý mã giảm giá</h2>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-xs px-md py-sm bg-[#1A1A2E] text-white hover:bg-black transition-colors font-semibold text-xs rounded-DEFAULT"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Thêm mã mới
        </button>
      </div>

      {error && (
        <div className="mb-lg p-md bg-error-container text-on-error-container rounded-lg border border-[#ed4848]/30 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#ed4848]">error</span>
          {error}
        </div>
      )}

      {/* Grid List */}
      {loading ? (
        <div className="py-xl text-center text-text-muted">
          <span className="material-symbols-outlined animate-spin mb-2 text-primary">progress_activity</span>
          <p>Đang tải danh sách mã giảm giá...</p>
        </div>
      ) : vouchers.length === 0 ? (
        <div className="bg-surface-container-lowest border border-border-subtle p-xl text-center text-text-muted rounded-lg">
          Không có mã giảm giá nào tồn tại trong hệ thống.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {vouchers.map((voucher) => {
            const usagePercent = getUsagePercentage(voucher.timesUsed, voucher.usageLimit);
            const isExpired = new Date(voucher.endDate) < new Date();
            
            return (
              <div 
                key={voucher.id} 
                className="bg-white border border-border-subtle rounded-lg p-md relative overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow"
              >
                {/* Visual Dotted Border Line */}
                <div className="absolute top-0 bottom-0 left-[75px] border-r border-dashed border-border-subtle"></div>
                
                <div className="flex gap-md items-stretch h-full">
                  {/* Left Column (Discount Value & Type Visual Card) */}
                  <div className="w-[60px] flex-shrink-0 flex flex-col justify-center items-center text-center">
                    <span className="material-symbols-outlined text-primary text-3xl mb-1">
                      {voucher.discountType === 'percentage' ? 'percent' : 'payments'}
                    </span>
                    <p className="font-mono font-bold text-base text-primary leading-tight">
                      {voucher.discountType === 'percentage' 
                        ? `${voucher.discountValue}%` 
                        : `${(voucher.discountValue / 1000).toFixed(0)}k`}
                    </p>
                    <p className="text-[9px] uppercase font-semibold text-text-muted mt-xs leading-none">GIẢM</p>
                  </div>

                  {/* Right Column (Details) */}
                  <div className="flex-1 pl-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-xs">
                        <span className="font-mono font-bold text-sm tracking-wide text-[#1A1A2E] bg-[#FAFAF8] px-sm py-[2px] border border-border-subtle inline-block rounded">
                          {voucher.code}
                        </span>
                        <div className="flex items-center gap-xs">
                          <span className={`w-2 h-2 rounded-full ${
                            voucher.isActive && !isExpired ? 'bg-success' : 'bg-[#ba1a1a]'
                          }`}></span>
                          <span className="text-[10px] text-text-muted font-medium">
                            {isExpired ? 'Hết hạn' : voucher.isActive ? 'Bật' : 'Tắt'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-sm space-y-[2px] text-xs">
                        <p className="text-text-primary">
                          Tối thiểu: <span className="font-semibold font-mono">{voucher.minOrderAmount?.toLocaleString('vi-VN') ?? 0}đ</span>
                        </p>
                        {voucher.maxDiscountAmount && (
                          <p className="text-text-muted">
                            Giảm tối đa: <span className="font-semibold font-mono">{voucher.maxDiscountAmount?.toLocaleString('vi-VN') ?? 0}đ</span>
                          </p>
                        )}
                        <p className="text-[10px] text-text-muted">
                          HSD: {new Date(voucher.startDate).toLocaleDateString('vi-VN')} - {new Date(voucher.endDate).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar & Actions */}
                    <div className="mt-md pt-sm border-t border-surface-container">
                      <div className="mb-sm">
                        <div className="flex justify-between text-[10px] text-text-muted mb-1">
                          <span>Đã dùng: {voucher.timesUsed}/{voucher.usageLimit}</span>
                          <span>{usagePercent}%</span>
                        </div>
                        <div className="w-full bg-[#eeeeec] h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${usagePercent >= 90 ? 'bg-[#ba1a1a]' : 'bg-[#1A1A2E]'}`}
                            style={{ width: `${usagePercent}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-sm pt-xs">
                        <button
                          onClick={() => handleOpenEdit(voucher)}
                          className="px-2 py-1 text-xs font-semibold text-[#1A1A2E] hover:underline"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(voucher.id, voucher.code)}
                          className="px-2 py-1 text-xs font-semibold text-[#ba1a1a] hover:underline"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs">
          <form 
            onSubmit={handleSubmit} 
            className="bg-white rounded-lg border border-border-subtle w-full max-w-md p-lg shadow-2xl space-y-md max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-border-subtle pb-xs">
              <h3 className="font-headline-md text-headline-md font-bold text-[#1A1A2E]">
                {selectedVoucherId ? 'Cập nhật mã giảm giá' : 'Thêm mã giảm giá mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto space-y-sm pr-xs">
              {/* Code */}
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1 font-label-caps">Mã giảm giá (Code)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: SUMMER50, CLOTHY100"
                  className="w-full px-md py-sm border border-border-subtle rounded-DEFAULT focus:outline-none focus:border-primary transition-colors text-xs font-mono font-bold uppercase"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={!!selectedVoucherId}
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-sm">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1 font-label-caps">Loại giảm giá</label>
                  <select
                    className="w-full px-md py-sm border border-border-subtle rounded-DEFAULT focus:outline-none focus:border-primary transition-colors text-xs"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                  >
                    <option value="fixed_amount">Số tiền cố định (đ)</option>
                    <option value="percentage">Theo phần trăm (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1 font-label-caps">Giá trị giảm</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full px-md py-sm border border-border-subtle rounded-DEFAULT focus:outline-none focus:border-primary transition-colors text-xs font-mono"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Limit & Order Value */}
              <div className="grid grid-cols-2 gap-sm">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1 font-label-caps">Đơn tối thiểu (đ)</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-md py-sm border border-border-subtle rounded-DEFAULT focus:outline-none focus:border-primary transition-colors text-xs font-mono"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1 font-label-caps">Giảm tối đa (đ)</label>
                  <input
                    type="number"
                    placeholder="Không giới hạn"
                    className="w-full px-md py-sm border border-border-subtle rounded-DEFAULT focus:outline-none focus:border-primary transition-colors text-xs font-mono"
                    value={maxDiscountAmount}
                    onChange={(e) => setMaxDiscountAmount(e.target.value)}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-sm">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1 font-label-caps">Ngày bắt đầu</label>
                  <input
                    type="date"
                    className="w-full px-md py-sm border border-border-subtle rounded-DEFAULT focus:outline-none focus:border-primary transition-colors text-xs"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1 font-label-caps">Ngày kết thúc</label>
                  <input
                    type="date"
                    className="w-full px-md py-sm border border-border-subtle rounded-DEFAULT focus:outline-none focus:border-primary transition-colors text-xs"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Usage Limit & Status */}
              <div className="grid grid-cols-2 gap-sm items-end">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1 font-label-caps">Số lượt dùng tối đa</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full px-md py-sm border border-border-subtle rounded-DEFAULT focus:outline-none focus:border-primary transition-colors text-xs font-mono"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(Number(e.target.value))}
                  />
                </div>
                <div className="flex items-center gap-xs pb-sm pl-sm">
                  <input
                    type="checkbox"
                    id="chkActive"
                    className="rounded-sm border-border-subtle focus:ring-0 focus:ring-offset-0 text-primary cursor-pointer w-4 h-4"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <label htmlFor="chkActive" className="text-xs font-semibold text-text-primary cursor-pointer select-none">
                    Kích hoạt sử dụng
                  </label>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="border-t border-border-subtle pt-sm flex justify-end gap-md">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-xl py-sm bg-[#e2e3e1] text-text-primary hover:bg-[#d5d6d4] transition-colors font-semibold text-xs"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-xl py-sm bg-[#1A1A2E] text-white hover:bg-black transition-colors font-semibold text-xs disabled:opacity-50"
              >
                {submitting ? 'Đang lưu...' : 'Lưu lại'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
