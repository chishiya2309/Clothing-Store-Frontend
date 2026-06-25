import { useEffect, useState } from 'react';
import { staffService } from '../../services/staff.service';
import type { StaffReviewResponse } from '../../services/staff.service';

type ReviewTab = 'PENDING' | 'APPROVED' | 'DELETED' | 'FLAGGED';

export default function ReviewManagement() {
  const [tab, setTab] = useState<ReviewTab>('PENDING');
  const [reviews, setReviews] = useState<StaffReviewResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await staffService.getReviews({ tab, page: 0, size: 50 });
      setReviews(data.content || []);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không tải được đánh giá.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [tab]);

  const approve = async (id: number) => {
    try {
      await staffService.approveReview(id);
      fetchReviews();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không duyệt được đánh giá.');
    }
  };

  const reply = async (id: number) => {
    const content = window.prompt('Nhập nội dung phản hồi');
    if (!content) return;
    try {
      await staffService.replyReview(id, content);
      fetchReviews();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không phản hồi được đánh giá.');
    }
  };

  const remove = async (id: number) => {
    const reason = window.prompt('Nhập lý do xóa đánh giá');
    if (!reason) return;
    try {
      await staffService.deleteReview(id, reason);
      fetchReviews();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không xóa được đánh giá.');
    }
  };

  return (
    <div className="space-y-lg">
      <div>
        <h1 className="font-headline-lg text-headline-lg font-bold">Quản lý đánh giá</h1>
        <p className="text-sm text-text-muted">Duyệt, phản hồi hoặc xóa mềm đánh giá sản phẩm theo QĐ9.</p>
      </div>

      <div className="flex gap-sm border-b border-border-subtle">
        {(['PENDING', 'APPROVED', 'FLAGGED', 'DELETED'] as ReviewTab[]).map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`px-md py-sm border-b-2 font-semibold ${tab === item ? 'border-primary text-primary' : 'border-transparent text-text-muted'}`}
          >
            {item === 'PENDING' ? 'Chờ duyệt' : item === 'APPROVED' ? 'Đã duyệt' : item === 'FLAGGED' ? 'Bị báo cáo' : 'Đã xóa'}
          </button>
        ))}
      </div>

      <div className="bg-surface-container-lowest border border-border-subtle rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-surface-alt border-b border-border-subtle">
            <tr>
              <th className="p-md">Khách hàng</th>
              <th className="p-md">Sản phẩm</th>
              <th className="p-md">Đánh giá</th>
              <th className="p-md">Phản hồi</th>
              <th className="p-md text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-lg text-center" colSpan={5}>Đang tải...</td></tr>
            ) : reviews.length === 0 ? (
              <tr><td className="p-lg text-center text-text-muted" colSpan={5}>Không có đánh giá.</td></tr>
            ) : reviews.map((review) => (
              <tr key={review.id} className="border-b border-border-subtle last:border-0 align-top">
                <td className="p-md">
                  <p className="font-semibold">{review.reviewerName}</p>
                  <p className="text-xs text-text-muted">{review.reviewerEmail}</p>
                </td>
                <td className="p-md">
                  <p>{review.productName}</p>
                  <p className="text-xs text-text-muted">{review.productSku}</p>
                </td>
                <td className="p-md max-w-md">
                  <p className="font-semibold">{review.rating}/5 sao</p>
                  <p className="text-sm">{review.content}</p>
                  {review.deleteReason && <p className="text-xs text-error mt-xs">Lý do xóa: {review.deleteReason}</p>}
                </td>
                <td className="p-md text-sm">{review.adminReply || 'Chưa phản hồi'}</td>
                <td className="p-md text-right space-x-sm whitespace-nowrap">
                  {!review.isApproved && review.isActive && <button onClick={() => approve(review.id)} className="px-sm py-xs border border-success text-success rounded">Duyệt</button>}
                  {review.isActive && <button onClick={() => reply(review.id)} className="px-sm py-xs border border-primary text-primary rounded">Phản hồi</button>}
                  {review.isActive && <button onClick={() => remove(review.id)} className="px-sm py-xs border border-error text-error rounded">Xóa</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
