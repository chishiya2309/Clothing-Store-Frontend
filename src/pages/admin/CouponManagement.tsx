import { useEffect, useState, useCallback } from 'react';
import { staffService } from '../../services/staff.service';
import type { StaffVoucherResponse } from '../../services/staff.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => n?.toLocaleString('vi-VN') + 'đ';
const fmtDate = (s: string) => new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

function getStatus(v: StaffVoucherResponse): 'active' | 'inactive' | 'expired' | 'upcoming' {
  const now = new Date();
  if (new Date(v.endDate) < now) return 'expired';
  if (new Date(v.startDate) > now) return 'upcoming';
  if (!v.isActive) return 'inactive';
  return 'active';
}

const STATUS_CONFIG = {
  active:   { label: 'Đang chạy',    dot: 'bg-emerald-500', text: 'text-emerald-700' },
  inactive: { label: 'Tạm dừng',     dot: 'bg-gray-400',    text: 'text-gray-500'    },
  expired:  { label: 'Hết hạn',      dot: 'bg-red-500',     text: 'text-red-600'     },
  upcoming: { label: 'Sắp diễn ra',  dot: 'bg-blue-500',    text: 'text-blue-600'    },
};

// ─── Form Modal ───────────────────────────────────────────────────────────────
interface FormState {
  code: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: string;
  startDate: string;
  endDate: string;
  usageLimit: number;
  isActive: boolean;
}

const defaultForm = (): FormState => {
  const today = new Date().toISOString().split('T')[0];
  const next = new Date(); next.setMonth(next.getMonth() + 1);
  return {
    code: '', discountType: 'fixed_amount', discountValue: 0,
    minOrderAmount: 0, maxDiscountAmount: '',
    startDate: today, endDate: next.toISOString().split('T')[0],
    usageLimit: 100, isActive: true,
  };
};

interface VoucherModalProps {
  editTarget: StaffVoucherResponse | null;
  onClose: () => void;
  onSaved: () => void;
}

function VoucherModal({ editTarget, onClose, onSaved }: VoucherModalProps) {
  const isEdit = !!editTarget;
  const [form, setForm] = useState<FormState>(() => {
    if (editTarget) return {
      code: editTarget.code,
      discountType: editTarget.discountType,
      discountValue: editTarget.discountValue,
      minOrderAmount: editTarget.minOrderAmount,
      maxDiscountAmount: editTarget.maxDiscountAmount ? String(editTarget.maxDiscountAmount) : '',
      startDate: editTarget.startDate?.split('T')[0] ?? '',
      endDate: editTarget.endDate?.split('T')[0] ?? '',
      usageLimit: editTarget.usageLimit,
      isActive: editTarget.isActive,
    };
    return defaultForm();
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const set = (key: keyof FormState, val: any) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!form.code.trim()) errs.code = 'Vui lòng nhập mã.';
    if (form.discountValue <= 0) errs.discountValue = 'Giá trị phải > 0.';
    if (form.discountType === 'percentage' && form.discountValue > 100) errs.discountValue = 'Không vượt quá 100%.';
    if (!form.startDate) errs.startDate = 'Chọn ngày bắt đầu.';
    if (!form.endDate) errs.endDate = 'Chọn ngày kết thúc.';
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) errs.endDate = 'Phải sau ngày bắt đầu.';
    if (form.usageLimit < 1) errs.usageLimit = 'Tối thiểu 1 lượt.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      discountValue: form.discountValue,
      minOrderAmount: form.minOrderAmount,
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      usageLimit: form.usageLimit,
      isActive: form.isActive,
    };
    try {
      setSubmitting(true); setServerError('');
      if (isEdit) await staffService.updateVoucher(editTarget!.id, payload);
      else await staffService.createVoucher(payload);
      onSaved(); onClose();
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Có lỗi xảy ra.');
    } finally { setSubmitting(false); }
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const inputCls = (err?: string) =>
    `w-full px-3 py-2 border text-sm outline-none transition-colors ${err
      ? 'border-red-400 bg-red-50 focus:border-red-500'
      : 'border-border-subtle focus:border-[#1A1A2E]'
    }`;

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">{children}</label>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={handleSubmit}
        className="bg-white w-full max-w-md flex flex-col max-h-[92vh] overflow-hidden shadow-2xl border border-border-subtle">

        {/* Header */}
        <div className="flex items-center justify-between px-lg py-md border-b border-border-subtle bg-[#1A1A2E]">
          <h2 className="text-white font-semibold text-sm">
            {isEdit ? `Cập nhật: ${editTarget?.code}` : 'Thêm mã giảm giá mới'}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-lg space-y-md">
          {serverError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2">{serverError}</p>
          )}

          {/* Code */}
          <div>
            <Label>Mã giảm giá (Code)</Label>
            <input value={form.code} onChange={e => set('code', e.target.value)}
              disabled={isEdit} placeholder="VD: SUMMER50"
              className={`${inputCls(errors.code)} font-mono font-bold uppercase tracking-widest ${isEdit ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`} />
            {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
          </div>

          {/* Type + Value */}
          <div className="grid grid-cols-2 gap-sm">
            <div>
              <Label>Loại giảm giá</Label>
              <select value={form.discountType} onChange={e => set('discountType', e.target.value as any)}
                className={inputCls()}>
                <option value="fixed_amount">Số tiền (đ)</option>
                <option value="percentage">Phần trăm (%)</option>
              </select>
            </div>
            <div>
              <Label>Giá trị {form.discountType === 'percentage' ? '(%)' : '(đ)'}</Label>
              <input type="number" min={1} value={form.discountValue}
                onChange={e => set('discountValue', Number(e.target.value))}
                className={`${inputCls(errors.discountValue)} font-mono`} />
              {errors.discountValue && <p className="text-red-500 text-xs mt-1">{errors.discountValue}</p>}
            </div>
          </div>

          {/* Min + Max */}
          <div className="grid grid-cols-2 gap-sm">
            <div>
              <Label>Đơn tối thiểu (đ)</Label>
              <input type="number" min={0} value={form.minOrderAmount}
                onChange={e => set('minOrderAmount', Number(e.target.value))}
                className={`${inputCls()} font-mono`} />
            </div>
            <div>
              <Label>Giảm tối đa (đ)</Label>
              <input type="number" placeholder="Không giới hạn" value={form.maxDiscountAmount}
                onChange={e => set('maxDiscountAmount', e.target.value)}
                className={`${inputCls()} font-mono`} />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-sm">
            <div>
              <Label>Ngày bắt đầu</Label>
              <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)}
                className={inputCls(errors.startDate)} />
              {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <Label>Ngày kết thúc</Label>
              <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)}
                className={inputCls(errors.endDate)} />
              {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* Usage + Active */}
          <div className="grid grid-cols-2 gap-sm items-end">
            <div>
              <Label>Số lượt dùng tối đa</Label>
              <input type="number" min={1} value={form.usageLimit}
                onChange={e => set('usageLimit', Number(e.target.value))}
                className={`${inputCls(errors.usageLimit)} font-mono`} />
              {errors.usageLimit && <p className="text-red-500 text-xs mt-1">{errors.usageLimit}</p>}
            </div>
            <div className="flex items-center gap-2 pb-[2px]">
              <input type="checkbox" id="chkActive" checked={form.isActive}
                onChange={e => set('isActive', e.target.checked)}
                className="w-4 h-4 cursor-pointer accent-[#1A1A2E]" />
              <label htmlFor="chkActive" className="text-sm text-text-primary cursor-pointer select-none font-medium">
                Kích hoạt
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-sm px-lg py-md border-t border-border-subtle">
          <button type="button" onClick={onClose}
            className="px-md py-sm text-sm font-medium text-text-primary bg-[#e2e3e1] hover:bg-[#d5d6d4] transition-colors">
            Hủy
          </button>
          <button type="submit" disabled={submitting}
            className="px-md py-sm text-sm font-semibold text-white bg-[#1A1A2E] hover:bg-black disabled:opacity-50 transition-colors flex items-center gap-2">
            {submitting
              ? <><svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Đang lưu...</>
              : isEdit ? 'Lưu thay đổi' : 'Tạo voucher'
            }
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Voucher Card ─────────────────────────────────────────────────────────────
function VoucherCard({ voucher, onEdit, onDelete }: { voucher: StaffVoucherResponse; onEdit: () => void; onDelete: () => void }) {
  const status = getStatus(voucher);
  const cfg = STATUS_CONFIG[status];
  const usagePct = voucher.usageLimit > 0 ? Math.min(Math.round((voucher.timesUsed / voucher.usageLimit) * 100), 100) : 0;
  const isPerc = voucher.discountType === 'percentage';

  return (
    <div className="bg-white border border-border-subtle hover:shadow-md transition-shadow relative overflow-hidden flex flex-col">
      {/* Dotted divider */}
      <div className="absolute top-0 bottom-0 left-[72px] border-r border-dashed border-border-subtle pointer-events-none" />

      <div className="flex flex-1 gap-0">
        {/* Left — discount value */}
        <div className="w-[72px] flex-shrink-0 flex flex-col items-center justify-center py-md px-xs text-center border-r-0">
          <span className="material-symbols-outlined text-[#1A1A2E] text-2xl mb-1">
            {isPerc ? 'percent' : 'payments'}
          </span>
          <p className="font-mono font-black text-[#1A1A2E] text-base leading-none">
            {isPerc ? `${voucher.discountValue}%` : `${(voucher.discountValue / 1000).toFixed(0)}k`}
          </p>
          <p className="text-[9px] uppercase font-semibold text-text-muted mt-1 tracking-wider">Giảm</p>
        </div>

        {/* Right — details */}
        <div className="flex-1 pl-sm pr-md py-md flex flex-col justify-between gap-sm">
          {/* Top row */}
          <div className="flex items-start justify-between gap-2">
            <span className="font-mono font-bold text-sm tracking-widest text-[#1A1A2E] bg-[#F4F4F2] px-2 py-0.5 border border-border-subtle">
              {voucher.code}
            </span>
            <span className={`flex items-center gap-1.5 text-[10px] font-semibold ${cfg.text} whitespace-nowrap`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>

          {/* Info */}
          <div className="space-y-[3px] text-xs text-text-muted">
            <p>Tối thiểu: <span className="font-mono font-semibold text-text-primary">{fmt(voucher.minOrderAmount)}</span></p>
            {voucher.maxDiscountAmount && (
              <p>Tối đa: <span className="font-mono font-semibold text-text-primary">{fmt(voucher.maxDiscountAmount)}</span></p>
            )}
            <p>HSD: <span className="text-text-primary">{fmtDate(voucher.startDate)} – {fmtDate(voucher.endDate)}</span></p>
          </div>

          {/* Usage progress */}
          <div>
            <div className="flex justify-between text-[10px] text-text-muted mb-1">
              <span>Đã dùng: {voucher.timesUsed}/{voucher.usageLimit}</span>
              <span className={usagePct >= 90 ? 'text-red-500 font-semibold' : ''}>{usagePct}%</span>
            </div>
            <div className="h-1.5 bg-[#EEEEEC] overflow-hidden">
              <div
                className={`h-full transition-all ${usagePct >= 90 ? 'bg-red-500' : 'bg-[#1A1A2E]'}`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-border-subtle flex justify-end gap-sm px-md py-xs">
        <button onClick={onEdit}
          className="text-xs font-semibold text-[#1A1A2E] hover:underline px-1 py-1 transition-colors">
          Sửa
        </button>
        <button onClick={onDelete}
          className="text-xs font-semibold text-red-600 hover:underline px-1 py-1 transition-colors">
          Xóa
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CouponManagement() {
  const [vouchers, setVouchers] = useState<StaffVoucherResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'expired' | 'upcoming'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffVoucherResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffVoucherResponse | null>(null);

  const fetchVouchers = useCallback(async () => {
    try { setLoading(true); setVouchers(await staffService.getVouchers() || []); }
    catch (err: any) { alert(err.response?.data?.message || 'Lỗi tải danh sách.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchVouchers(); }, [fetchVouchers]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await staffService.deleteVoucher(deleteTarget.id);
      setVouchers(prev => prev.filter(v => v.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa.');
    }
  };

  const openAdd = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (v: StaffVoucherResponse) => { setEditTarget(v); setModalOpen(true); };

  const filtered = vouchers.filter(v => {
    const matchSearch = v.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || getStatus(v) === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    all: vouchers.length,
    active: vouchers.filter(v => getStatus(v) === 'active').length,
    inactive: vouchers.filter(v => getStatus(v) === 'inactive').length,
    upcoming: vouchers.filter(v => getStatus(v) === 'upcoming').length,
    expired: vouchers.filter(v => getStatus(v) === 'expired').length,
  };

  const FILTER_TABS: { key: typeof filterStatus; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'active', label: 'Đang chạy' },
    { key: 'upcoming', label: 'Sắp diễn ra' },
    { key: 'inactive', label: 'Tạm dừng' },
    { key: 'expired', label: 'Hết hạn' },
  ];

  return (
    <div className="space-y-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold">Quản lý mã giảm giá</h1>
          <p className="text-sm text-text-muted">Tạo và quản lý voucher cho khách hàng.</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-xs px-md py-sm bg-[#1A1A2E] text-white hover:bg-black transition-colors font-semibold text-xs">
          <span className="material-symbols-outlined text-sm">add</span>Thêm mã mới
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-sm items-start sm:items-center border-b border-border-subtle pb-md">
        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted text-base">search</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm mã voucher..."
            className="pl-9 pr-4 py-[7px] border border-border-subtle text-sm outline-none focus:border-[#1A1A2E] transition-colors w-52" />
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 flex-wrap">
          {FILTER_TABS.map(t => (
            <button key={t.key} onClick={() => setFilterStatus(t.key)}
              className={`px-sm py-[5px] text-xs font-semibold border transition-colors ${
                filterStatus === t.key
                  ? 'bg-[#1A1A2E] text-white border-[#1A1A2E]'
                  : 'text-text-muted border-border-subtle hover:text-text-primary hover:border-[#1A1A2E]'
              }`}>
              {t.label}
              <span className="ml-1 opacity-60">({counts[t.key]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-xl text-center text-text-muted">
          <span className="material-symbols-outlined animate-spin text-primary block mb-2">progress_activity</span>
          Đang tải...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-border-subtle p-xl text-center text-text-muted">
          {search ? 'Không tìm thấy mã phù hợp.' : 'Chưa có mã giảm giá nào.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {filtered.map(v => (
            <VoucherCard key={v.id} voucher={v}
              onEdit={() => openEdit(v)}
              onDelete={() => setDeleteTarget(v)} />
          ))}
        </div>
      )}

      {/* Modals */}
      {modalOpen && (
        <VoucherModal editTarget={editTarget} onClose={() => setModalOpen(false)} onSaved={fetchVouchers} />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
          <div className="bg-white shadow-2xl border border-border-subtle w-full max-w-sm p-lg space-y-md">
            <h3 className="font-semibold text-text-primary">Xóa mã giảm giá?</h3>
            <p className="text-sm text-text-muted">
              Mã <span className="font-mono font-bold text-text-primary">{deleteTarget.code}</span> sẽ bị xóa vĩnh viễn.
            </p>
            <div className="flex justify-end gap-sm pt-xs border-t border-border-subtle">
              <button onClick={() => setDeleteTarget(null)}
                className="px-md py-sm text-sm font-medium bg-[#e2e3e1] hover:bg-[#d5d6d4] transition-colors">
                Hủy
              </button>
              <button onClick={handleDelete}
                className="px-md py-sm text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors">
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
