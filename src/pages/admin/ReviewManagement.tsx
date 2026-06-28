import { useEffect, useState, useRef } from 'react';
import { staffService } from '../../services/staff.service';
import type { StaffReviewResponse } from '../../services/staff.service';
import { useToast } from '../../components/ui/ToastProvider';

type ReviewTab = 'PENDING' | 'APPROVED' | 'FLAGGED' | 'DELETED';

// ─── Reply Modal Component ──────────────────────────────────────────────────
interface ReplyModalProps {
  review: StaffReviewResponse;
  onClose: () => void;
  onSubmit: (replyText: string) => Promise<void>;
}

function ReplyModal({ review, onClose, onSubmit }: ReplyModalProps) {
  const [replyText, setReplyText] = useState(review.adminReply || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    // Close on Escape
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = async () => {
    const trimmed = replyText.trim();
    if (!trimmed) { setError('Vui lòng nhập nội dung phản hồi.'); return; }
    if (trimmed.length < 5) { setError('Phản hồi phải có ít nhất 5 ký tự.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(trimmed);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const stars = Array.from({ length: 5 }, (_, i) => i < review.rating);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-[fadeInUp_0.25s_ease]"
        style={{ animation: 'fadeInUp 0.22s cubic-bezier(0.16,1,0.3,1)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#111122] to-[#1D1D3D]">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-400 text-xl">rate_review</span>
            <div>
              <h2 className="text-white font-semibold text-base">Phản hồi đánh giá</h2>
              <p className="text-gray-400 text-xs mt-0.5">Phản hồi sẽ được hiển thị công khai cho khách hàng</p>
            </div>
          </div>
          <button onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Review Card */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {review.reviewerName?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{review.reviewerName}</p>
                  <p className="text-gray-400 text-xs">{review.reviewerEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                {stars.map((filled, i) => (
                  <span key={i} className={`material-symbols-outlined text-base fill-1 ${filled ? 'text-amber-400' : 'text-gray-200'}`}
                    style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}>
                    star
                  </span>
                ))}
                <span className="text-xs text-gray-500 ml-1">{review.rating}/5</span>
              </div>
            </div>

            <div className="mt-3 pl-12">
              <p className="text-sm text-gray-500 font-medium mb-0.5">{review.productName}</p>
              <p className="text-gray-700 text-sm leading-relaxed">"{review.content}"</p>
              {review.isFlagged && (
                <div className="mt-2 flex items-center gap-1.5 text-amber-600 text-xs font-medium">
                  <span className="material-symbols-outlined text-base">flag</span>
                  {review.flagReason}
                </div>
              )}
            </div>
          </div>

          {/* Existing reply notice */}
          {review.adminReply && (
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
              <span className="material-symbols-outlined text-blue-500 text-base mt-0.5 flex-shrink-0">info</span>
              <p className="text-blue-700 text-xs leading-relaxed">
                Đánh giá này đã có phản hồi trước đó. Nội dung mới sẽ <strong>ghi đè</strong> phản hồi cũ.
              </p>
            </div>
          )}

          {/* Textarea */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nội dung phản hồi <span className="text-red-500">*</span>
            </label>
            <textarea
              ref={textareaRef}
              value={replyText}
              onChange={(e) => { setReplyText(e.target.value); setError(''); }}
              rows={4}
              placeholder="Ví dụ: Cảm ơn bạn đã tin tưởng và để lại đánh giá. Chúng tôi rất vui khi sản phẩm đáp ứng được kỳ vọng của bạn..."
              className={`w-full border rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 resize-none outline-none transition-all duration-200 leading-relaxed
                ${error ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-gray-200 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`}
            />
            <div className="flex items-center justify-between mt-1.5">
              {error
                ? <p className="text-red-500 text-xs flex items-center gap-1"><span className="material-symbols-outlined text-sm">error</span>{error}</p>
                : <p className="text-gray-400 text-xs">Lịch sự, chuyên nghiệp và đúng trọng tâm</p>
              }
              <span className={`text-xs ${replyText.length > 500 ? 'text-red-500' : 'text-gray-400'}`}>{replyText.length}/500</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200">
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || replyText.trim().length === 0 || replyText.length > 500}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-md shadow-indigo-200"
          >
            {submitting ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Đang gửi...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">send</span>
                Gửi phản hồi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Modal Component ─────────────────────────────────────────────────
interface DeleteModalProps {
  review: StaffReviewResponse;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

function DeleteModal({ review, onClose, onSubmit }: DeleteModalProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const QUICK_REASONS = ['Nội dung vi phạm cộng đồng', 'Spam / quảng cáo', 'Ngôn từ thô tục', 'Thông tin sai lệch'];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = async () => {
    const trimmed = reason.trim();
    if (!trimmed) { setError('Vui lòng nhập lý do xóa.'); return; }
    setSubmitting(true);
    try { await onSubmit(trimmed); onClose(); }
    catch (err: any) { setError(err.response?.data?.message || 'Có lỗi xảy ra.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-red-600 to-rose-600">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-white text-xl">delete</span>
            <div>
              <h2 className="text-white font-semibold text-base">Xóa đánh giá</h2>
              <p className="text-red-200 text-xs mt-0.5">Đánh giá sẽ bị ẩn khỏi cửa hàng</p>
            </div>
          </div>
          <button onClick={onClose} className="text-red-200 hover:text-white transition-colors w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-sm">
            <p className="font-semibold text-gray-800">{review.reviewerName}</p>
            <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">"{review.content}"</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Lý do nhanh</label>
            <div className="flex flex-wrap gap-2">
              {QUICK_REASONS.map(r => (
                <button key={r} onClick={() => { setReason(r); setError(''); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${reason === r ? 'bg-red-50 border-red-400 text-red-600' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Lý do chi tiết <span className="text-red-500">*</span></label>
            <textarea value={reason} onChange={(e) => { setReason(e.target.value); setError(''); }} rows={3}
              placeholder="Nhập lý do xóa đánh giá..."
              className={`w-full border rounded-xl px-4 py-3 text-sm resize-none outline-none transition-all ${error ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-100'}`} />
            {error && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-sm">error</span>{error}</p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">Hủy</button>
          <button onClick={handleSubmit} disabled={submitting || !reason.trim()}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 rounded-xl hover:from-red-700 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md shadow-red-200 transition-all">
            {submitting ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Đang xóa...</>
              : <><span className="material-symbols-outlined text-base">delete</span>Xác nhận xóa</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function ReviewManagement() {
  const toast = useToast();

  const [tab, setTab] = useState<ReviewTab>('PENDING');
  const [reviews, setReviews] = useState<StaffReviewResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [replyTarget, setReplyTarget] = useState<StaffReviewResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffReviewResponse | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const apiTab = tab === 'FLAGGED' ? 'PENDING' : tab;
      const data = await staffService.getReviews({ tab: apiTab, page: 0, size: 200 });
      const all: StaffReviewResponse[] = data.content || [];
      setReviews(tab === 'FLAGGED' ? all.filter(r => r.isFlagged) : all);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không tải được đánh giá.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, [tab]);

  const approve = async (id: number) => {
    try {
      await staffService.approveReview(id);
      toast.success('Đã duyệt đánh giá');
      fetchReviews();
    }
    catch (err: any) { toast.error(err.response?.data?.message || 'Không duyệt được.'); }
  };

  const submitReply = async (replyText: string) => {
    await staffService.replyReview(replyTarget!.id, replyText);
    fetchReviews();
  };

  const submitDelete = async (reason: string) => {
    await staffService.deleteReview(deleteTarget!.id, reason);
    fetchReviews();
  };

  const TAB_LABELS: Record<ReviewTab, string> = {
    PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', FLAGGED: 'Bị báo cáo', DELETED: 'Đã xóa',
  };

  const stars = (rating: number) => Array.from({ length: 5 }, (_, i) => i < rating);

  return (
    <div className="bg-[#FAFAF8] min-h-full p-4 md:p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="font-headline-lg text-headline-lg font-bold text-[#1F2421]">Quản lý đánh giá</h1>
        <p className="text-sm text-[#8A8A80] mt-1">Duyệt, phản hồi hoặc xóa đánh giá sản phẩm từ khách hàng</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b-2 border-[#E2D9C8] mb-6 overflow-x-auto">
        {(['PENDING', 'APPROVED', 'FLAGGED', 'DELETED'] as ReviewTab[]).map((item) => (
          <button key={item} onClick={() => setTab(item)}
            className={`px-5 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
              tab === item
                ? 'border-[#1F2421] text-[#1F2421] bg-[#F6F1E8]'
                : 'border-transparent text-[#8A8A80] hover:text-[#1F2421] hover:bg-[#FBF7EF]'
            }`}>
            {TAB_LABELS[item]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E2D9C8] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F6F1E8] border-b border-[#E2D9C8]">
              <tr>
                <th className="px-4 md:px-6 py-4 text-xs font-semibold text-[#8A8A80] uppercase tracking-wider">Khách hàng</th>
                <th className="px-4 md:px-6 py-4 text-xs font-semibold text-[#8A8A80] uppercase tracking-wider">Sản phẩm</th>
                <th className="px-4 md:px-6 py-4 text-xs font-semibold text-[#8A8A80] uppercase tracking-wider">Đánh giá</th>
                <th className="px-4 md:px-6 py-4 text-xs font-semibold text-[#8A8A80] uppercase tracking-wider">Phản hồi</th>
                <th className="px-4 md:px-6 py-4 text-xs font-semibold text-[#8A8A80] uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2D9C8]">
              {loading ? (
                <tr><td className="p-16 text-center text-[#8A8A80]" colSpan={5}>
                  <div className="flex flex-col items-center justify-center gap-3">
                    <span className="material-symbols-outlined animate-spin text-[#C8853F] text-4xl">progress_activity</span>
                    <p>Đang tải đánh giá...</p>
                  </div>
                </td></tr>
              ) : reviews.length === 0 ? (
                <tr><td className="p-16 text-center text-[#8A8A80]" colSpan={5}>
                  <span className="material-symbols-outlined text-6xl block mb-3 opacity-30">rate_review</span>
                  <p className="text-lg">Không có đánh giá nào</p>
                </td></tr>
              ) : reviews.map((review) => (
              <tr key={review.id} className="align-top hover:bg-[#FBF7EF] transition-colors">
                {/* Customer */}
                <td className="px-4 md:px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1F2421] to-[#2A2723] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                      {review.reviewerName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-[#1F2421] truncate">{review.reviewerName}</p>
                      <p className="text-xs text-[#8A8A80] truncate">{review.reviewerEmail}</p>
                    </div>
                  </div>
                </td>

                {/* Product */}
                <td className="px-4 md:px-6 py-4">
                  <p className="text-sm font-semibold text-[#1F2421] line-clamp-2">{review.productName}</p>
                  <p className="text-xs text-[#8A8A80] mt-1">SKU: {review.productSku}</p>
                </td>

                {/* Review content */}
                <td className="px-4 md:px-6 py-4 max-w-xs">
                  <div className="flex items-center gap-1 mb-2">
                    {stars(review.rating).map((filled, i) => (
                      <span key={i} className={`material-symbols-outlined text-base ${filled ? 'text-[#F59E0B]' : 'text-[#E2D9C8]'}`}
                        style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                    ))}
                    <span className="text-xs text-[#8A8A80] ml-1 font-semibold">{review.rating}/5</span>
                  </div>
                  <p className="text-sm text-[#1F2421] leading-relaxed line-clamp-3 mb-2">{review.content}</p>
                  {review.isFlagged && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-xs rounded-full font-semibold">
                      <span className="material-symbols-outlined text-sm">flag</span>
                      {review.flagReason?.split('|')[0]?.trim()}
                    </span>
                  )}
                  {review.deleteReason && (
                    <p className="text-xs text-[#991B1B] mt-2 bg-[#FEF2F2] px-2 py-1 rounded border border-[#FCA5A5]">
                      <span className="font-semibold">Lý do xóa:</span> {review.deleteReason}
                    </p>
                  )}
                </td>

                {/* Admin reply */}
                <td className="px-4 md:px-6 py-4 max-w-xs">
                  {review.adminReply ? (
                    <div className="bg-[#F0E3D0] border border-[#E2D9C8] rounded-lg p-3">
                      <p className="text-sm text-[#1F2421] italic line-clamp-3">"{review.adminReply}"</p>
                    </div>
                  ) : (
                    <span className="text-xs text-[#8A8A80] italic">Chưa phản hồi</span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 md:px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 flex-wrap">
                    {/* Duyệt — chỉ hiện khi chưa duyệt và còn active */}
                    {!review.isApproved && review.isActive && (
                      <button onClick={() => approve(review.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#E6F4EA] border-2 border-[#A8DAB5] text-[#137333] rounded-lg hover:bg-[#CEEAD6] transition-all shadow-sm">
                        <span className="material-symbols-outlined text-base">check_circle</span>Duyệt
                      </button>
                    )}

                    {/* Phản hồi — CHỈ hiện khi đã được duyệt */}
                    {review.isApproved && review.isActive && (
                      <button onClick={() => setReplyTarget(review)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#EFF6FF] border-2 border-[#BFDBFE] text-[#1E40AF] rounded-lg hover:bg-[#DBEAFE] transition-all shadow-sm">
                        <span className="material-symbols-outlined text-base">reply</span>Phản hồi
                      </button>
                    )}

                    {/* Xóa — hiện khi còn active */}
                    {review.isActive && (
                      <button onClick={() => setDeleteTarget(review)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#FEF2F2] border-2 border-[#FCA5A5] text-[#991B1B] rounded-lg hover:bg-[#FEE2E2] transition-all shadow-sm">
                        <span className="material-symbols-outlined text-base">delete</span>Xóa
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Modals */}
      {replyTarget && (
        <ReplyModal review={replyTarget} onClose={() => setReplyTarget(null)} onSubmit={submitReply} />
      )}
      {deleteTarget && (
        <DeleteModal review={deleteTarget} onClose={() => setDeleteTarget(null)} onSubmit={submitDelete} />
      )}
    </div>
  );
}
