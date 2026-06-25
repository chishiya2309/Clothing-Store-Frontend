import { useEffect, useState, useCallback } from 'react';
import { staffService } from '../../services/staff.service';
import type { StaffOrderListItem, StaffOrderDetail } from '../../services/staff.service';

type OrderTabStatus = 'all' | 'pending' | 'processing' | 'shipping' | 'completed' | 'cancelled';

export default function OrderManagement() {
  const [activeTab, setActiveTab] = useState<OrderTabStatus>('all');
  const [orders, setOrders] = useState<StaffOrderListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Search & Filters
  const [keyword, setKeyword] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const size = 10;

  // Detail Modal
  const [selectedOrderCode, setSelectedOrderCode] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<StaffOrderDetail | null>(null);
  
  // Action Modals
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [completePaymentMethod, setCompletePaymentMethod] = useState('cod');
  const [completeNote, setCompleteNote] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const statusParam = activeTab === 'all' ? undefined : activeTab;
      
      const data = await staffService.getOrders({
        status: statusParam,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        keyword: keyword || undefined,
        page,
        size,
        sortBy: 'createdAt',
        sortDir: 'desc'
      });
      
      setOrders(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách đơn hàng.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, fromDate, toDate, keyword, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 450);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  const handleTabChange = (tab: OrderTabStatus) => {
    setActiveTab(tab);
    setPage(0);
  };

  const handleFetchDetail = async (code: string) => {
    try {
      const detail = await staffService.getOrderDetail(code);
      setOrderDetail(detail);
      setSelectedOrderCode(code);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi tải chi tiết đơn hàng');
    }
  };

  const handleConfirm = async (code: string) => {
    if (!window.confirm(`Xác nhận đơn hàng ${code}?`)) return;
    try {
      setSubmittingAction(true);
      const updated = await staffService.confirmOrder(code);
      setOrderDetail(updated);
      setOrders(prev => prev.map(o => o.orderCode === code ? { ...o, status: 'processing' } : o));
      alert('Xác nhận đơn hàng thành công.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleShip = async (code: string) => {
    if (!window.confirm(`Xác nhận bắt đầu giao hàng cho đơn ${code}?`)) return;
    try {
      setSubmittingAction(true);
      const updated = await staffService.shipOrder(code);
      setOrderDetail(updated);
      setOrders(prev => prev.map(o => o.orderCode === code ? { ...o, status: 'shipping' } : o));
      alert('Đang giao hàng.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleComplete = async () => {
    if (!orderDetail) return;
    try {
      setSubmittingAction(true);
      const updated = await staffService.completeOrder(orderDetail.orderCode, {
        paymentMethod: completePaymentMethod,
        note: completeNote || undefined
      });
      setOrderDetail(updated);
      setOrders(prev => prev.map(o => o.orderCode === orderDetail.orderCode ? { ...o, status: 'completed' } : o));
      setIsCompleteModalOpen(false);
      setCompleteNote('');
      alert('Đơn hàng đã hoàn thành thành công.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCancel = async () => {
    if (!orderDetail || !cancelReason.trim()) {
      alert('Vui lòng nhập lý do hủy đơn.');
      return;
    }
    try {
      setSubmittingAction(true);
      const updated = await staffService.cancelOrder(orderDetail.orderCode, {
        reason: cancelReason
      });
      setOrderDetail(updated);
      setOrders(prev => prev.map(o => o.orderCode === orderDetail.orderCode ? { ...o, status: 'cancelled' } : o));
      setIsCancelModalOpen(false);
      setCancelReason('');
      alert('Đơn hàng đã được hủy.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-[#FFF9E6] text-warning border border-[#ffeebf] whitespace-nowrap">Chờ xác nhận</span>;
      case 'processing':
        return <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-[#EBF3FC] text-[#1B72E8] border border-[#cbe1fb] whitespace-nowrap">Đã xác nhận</span>;
      case 'shipping':
        return <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-[#F3EBF9] text-[#8E24AA] border border-[#ebd2f7] whitespace-nowrap">Đang giao</span>;
      case 'completed':
        return <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-[#E6F4EA] text-success border border-[#bce4c6] whitespace-nowrap">Hoàn thành</span>;
      case 'cancelled':
        return <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-error-container text-on-error-container border border-[#fcd8d8] whitespace-nowrap">Đã hủy</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-surface-container text-text-muted border border-border-subtle whitespace-nowrap">{status}</span>;
    }
  };

  return (
    <div className="bg-[#FAFAF8] min-h-full font-body-sm text-body-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-md">
        <h2 className="font-headline-lg text-headline-lg font-bold">Quản lý đơn hàng</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-subtle mb-md overflow-x-auto gap-sm">
        {(['all', 'pending', 'processing', 'shipping', 'completed', 'cancelled'] as OrderTabStatus[]).map((tab) => {
          const labels: Record<string, string> = {
            all: 'Tất cả đơn',
            pending: 'Chờ xác nhận',
            processing: 'Đã xác nhận',
            shipping: 'Đang giao',
            completed: 'Hoàn thành',
            cancelled: 'Đã hủy'
          };
          return (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`py-sm px-md font-label-caps text-label-caps border-b-2 font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-surface-container-lowest p-md rounded-lg border border-border-subtle mb-md flex flex-wrap gap-md items-end">
        <div className="flex-1 min-w-[240px]">
          <label className="block text-xs font-semibold text-text-muted mb-1 font-label-caps">Tìm kiếm</label>
          <input
            type="text"
            placeholder="Mã đơn hàng, tên khách hàng..."
            className="w-full px-md py-sm border border-border-subtle rounded-DEFAULT focus:outline-none focus:border-primary transition-colors text-xs"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <div className="w-[180px]">
          <label className="block text-xs font-semibold text-text-muted mb-1 font-label-caps">Từ ngày</label>
          <input
            type="date"
            className="w-full px-md py-sm border border-border-subtle rounded-DEFAULT focus:outline-none focus:border-primary transition-colors text-xs"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(0); }}
          />
        </div>
        <div className="w-[180px]">
          <label className="block text-xs font-semibold text-text-muted mb-1 font-label-caps">Đến ngày</label>
          <input
            type="date"
            className="w-full px-md py-sm border border-border-subtle rounded-DEFAULT focus:outline-none focus:border-primary transition-colors text-xs"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(0); }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-lg p-md bg-error-container text-on-error-container rounded-lg border border-[#ed4848]/30 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#ed4848]">error</span>
          {error}
        </div>
      )}

      {/* List Table */}
      <div className="bg-surface-container-lowest rounded-lg border border-border-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-alt border-b border-border-subtle">
              <tr>
                <th className="py-md px-lg font-label-caps text-label-caps text-text-muted">Mã đơn / Ngày</th>
                <th className="py-md px-lg font-label-caps text-label-caps text-text-muted">Khách hàng / PT thanh toán</th>
                <th className="py-md px-lg font-label-caps text-label-caps text-text-muted whitespace-nowrap">Tổng tiền</th>
                <th className="py-md px-lg font-label-caps text-label-caps text-text-muted whitespace-nowrap">Trạng thái</th>
                <th className="py-md px-lg font-label-caps text-label-caps text-text-muted text-center whitespace-nowrap">Hành động</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-xl text-center text-text-muted">
                    <span className="material-symbols-outlined animate-spin mb-2 text-primary">progress_activity</span>
                    <p>Đang tải danh sách đơn hàng...</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-xl text-center text-text-muted">Không tìm thấy đơn hàng nào.</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-surface-container hover:bg-surface-alt transition-colors">
                    <td className="py-md px-lg">
                      <p className="font-mono font-semibold text-primary text-sm">{order.orderCode}</p>
                      <p className="text-[10px] text-text-muted mt-[2px]">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') + ' · ' + new Date(order.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : '-'}
                      </p>
                    </td>
                    <td className="py-md px-lg">
                      <p className="font-medium text-text-primary">{order.customerName || 'Khách vãng lai'}</p>
                      <span className="text-[10px] uppercase font-medium bg-[#F0EDE8] px-sm py-[2px] rounded-DEFAULT whitespace-nowrap mt-1 inline-block">
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="py-md px-lg font-semibold text-primary font-mono whitespace-nowrap">
                      {order.totalAmount?.toLocaleString('vi-VN') ?? 0}đ
                    </td>
                    <td className="py-md px-lg whitespace-nowrap">{getStatusBadge(order.status)}</td>
                    <td className="py-md px-lg text-center whitespace-nowrap">
                      <button
                        onClick={() => handleFetchDetail(order.orderCode)}
                        className="px-3 py-1 border border-primary text-primary hover:bg-primary hover:text-white transition-colors text-xs font-semibold whitespace-nowrap"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalElements > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between px-lg py-md border-t border-border-subtle bg-surface-alt">
            <p className="text-sm text-text-muted">
              Hiển thị <span className="font-medium text-text-primary">{page * size + 1}</span> - <span className="font-medium text-text-primary">{Math.min((page + 1) * size, totalElements)}</span> trong <span className="font-medium text-text-primary">{totalElements}</span> đơn hàng
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 border border-border-subtle bg-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-container transition-colors text-sm font-medium"
              >
                Trước
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 border border-border-subtle bg-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-container transition-colors text-sm font-medium"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Drawer / Modal */}
      {selectedOrderCode && orderDetail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-300">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-lg border-b border-border-subtle flex justify-between items-center bg-[#1A1A2E] text-white">
              <div>
                <p className="text-xs uppercase text-white/60 font-semibold font-label-caps animate-pulse">Chi tiết đơn hàng</p>
                <h3 className="font-headline-md text-headline-md font-mono mt-xs text-white">{orderDetail.orderCode}</h3>
              </div>
              <button 
                onClick={() => { setSelectedOrderCode(null); setOrderDetail(null); }}
                className="text-white/60 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-lg space-y-md">
              {/* Customer and Shipping Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-sm bg-[#FAFAF8] p-sm border border-border-subtle rounded-lg">
                <div>
                  <h4 className="font-semibold mb-sm text-[#1A1A2E] uppercase font-label-caps border-b pb-[4px]">Khách hàng</h4>
                  <p className="font-medium text-text-primary">{orderDetail.customerName || 'N/A'}</p>
                  <p className="text-xs text-text-muted mt-xs">{orderDetail.customerEmail || 'Không có email'}</p>
                  <p className="text-xs text-text-muted">{orderDetail.customerPhone || 'Không có SĐT'}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-sm text-[#1A1A2E] uppercase font-label-caps border-b pb-[4px]">Địa chỉ giao nhận</h4>
                  <p className="font-medium text-text-primary">{orderDetail.shippingName}</p>
                  <p className="text-xs text-text-primary mt-xs">{orderDetail.shippingPhone}</p>
                  <p className="text-xs text-text-muted mt-[2px]">
                    {orderDetail.shippingAddress}, {orderDetail.shippingWard}, {orderDetail.shippingDistrict}, {orderDetail.shippingProvince}
                  </p>
                </div>
              </div>

              {/* Order Status & Payments */}
              <div className="flex items-center justify-between border border-border-subtle p-sm rounded-lg bg-white">
                <div>
                  <p className="text-xs text-text-muted uppercase font-label-caps mb-1">Trạng thái đơn</p>
                  {getStatusBadge(orderDetail.status)}
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase font-label-caps mb-1">Thanh toán</p>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    orderDetail.paymentStatus === 'PAID' || orderDetail.paymentStatus === 'completed'
                      ? 'bg-success/10 text-success border border-[#cbe1fb]' 
                      : 'bg-[#FFF9E6] text-warning border border-[#ffeebf]'
                  }`}>
                    {orderDetail.paymentStatus === 'PAID' || orderDetail.paymentStatus === 'completed' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="font-semibold mb-sm text-[#1A1A2E] uppercase font-label-caps">Sản phẩm đã đặt</h4>
                <div className="border border-border-subtle rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-[#FAFAF8] border-b border-border-subtle">
                      <tr>
                        <th className="py-sm px-md text-xs font-semibold text-text-muted">Sản phẩm</th>
                        <th className="py-sm px-md text-xs font-semibold text-text-muted text-center">Phân loại</th>
                        <th className="py-sm px-md text-xs font-semibold text-text-muted text-center">SL</th>
                        <th className="py-sm px-md text-xs font-semibold text-text-muted text-right">Đơn giá</th>
                        <th className="py-sm px-md text-xs font-semibold text-text-muted text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderDetail.items.map((item) => (
                        <tr key={item.id} className="border-b border-surface-container last:border-0 hover:bg-surface-container-low transition-colors">
                          <td className="py-sm px-md flex items-center gap-sm">
                            <img
                              src={item.productImage || 'https://placehold.co/100x130?text=Clothy'}
                              className="w-10 h-12 object-cover border border-border-subtle rounded"
                              alt=""
                            />
                            <p className="font-medium text-xs line-clamp-2">{item.productName}</p>
                          </td>
                          <td className="py-sm px-md text-xs text-center text-text-muted font-medium">
                            {item.color} / {item.size}
                          </td>
                          <td className="py-sm px-md text-xs text-center font-mono font-semibold">{item.quantity}</td>
                          <td className="py-sm px-md text-xs text-right font-mono font-medium">{item.price?.toLocaleString('vi-VN') ?? 0}đ</td>
                          <td className="py-sm px-md text-xs text-right font-mono font-semibold">{item.subtotal?.toLocaleString('vi-VN') ?? 0}đ</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cost Calculation */}
              <div className="flex justify-end pt-xs">
                <div className="w-[280px] space-y-2 border-t border-border-subtle pt-sm">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Tạm tính:</span>
                    <span className="font-mono">{orderDetail.subtotal?.toLocaleString('vi-VN') ?? 0}đ</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Phí giao hàng:</span>
                    <span className="font-mono">+{orderDetail.shippingFee?.toLocaleString('vi-VN') ?? 0}đ</span>
                  </div>
                  {orderDetail.discountAmount > 0 && (
                    <div className="flex justify-between text-xs text-success">
                      <span>Giảm giá (Voucher):</span>
                      <span className="font-mono">-{orderDetail.discountAmount?.toLocaleString('vi-VN') ?? 0}đ</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border-subtle pt-2 text-sm font-bold text-primary">
                    <span>Tổng cộng:</span>
                    <span className="font-mono text-base">{orderDetail.totalAmount?.toLocaleString('vi-VN') ?? 0}đ</span>
                  </div>
                </div>
              </div>

              {/* Order Status History Timeline */}
              <div className="pt-xs">
                <h4 className="font-semibold mb-sm text-[#1A1A2E] uppercase font-label-caps">Lịch sử trạng thái</h4>
                <div className="space-y-sm pl-sm border-l border-border-subtle ml-xs">
                  {orderDetail.statusHistory?.map((history, idx) => (
                    <div key={idx} className="relative pl-md">
                      <div className="absolute top-[6px] -left-[14px] w-2.5 h-2.5 rounded-full bg-[#1A1A2E] border-2 border-white"></div>
                      <p className="text-xs font-semibold text-text-primary capitalize">
                        {history.status === 'pending' ? 'Chờ xác nhận' : 
                         history.status === 'processing' ? 'Đã xác nhận / Chuẩn bị hàng' : 
                         history.status === 'shipping' ? 'Đang bàn giao vận chuyển' : 
                         history.status === 'completed' ? 'Giao hàng thành công' : 
                         history.status === 'cancelled' ? 'Hủy đơn hàng' : history.status}
                      </p>
                      {history.note && <p className="text-[11px] text-[#ba1a1a] mt-xs bg-error-container/20 px-2 py-0.5 rounded inline-block">Lý do/Ghi chú: {history.note}</p>}
                      <p className="text-[10px] text-text-muted mt-[2px]">
                        {history.createdAt ? new Date(history.createdAt).toLocaleString('vi-VN') : '-'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="p-lg border-t border-border-subtle bg-[#FAFAF8] flex justify-between gap-md">
              {(orderDetail.status === 'pending' || orderDetail.status === 'processing' || orderDetail.status === 'shipping') && (
                <button
                  disabled={submittingAction}
                  onClick={() => setIsCancelModalOpen(true)}
                  className="px-md py-sm bg-white border border-[#ba1a1a] text-[#ba1a1a] hover:bg-error-container/20 transition-colors font-semibold disabled:opacity-50 text-xs"
                >
                  Hủy đơn hàng
                </button>
              )}

              <div className="flex gap-md ml-auto">
                {orderDetail.status === 'pending' && (
                  <button
                    disabled={submittingAction}
                    onClick={() => handleConfirm(orderDetail.orderCode)}
                    className="px-md py-sm bg-[#1A1A2E] text-white hover:bg-black transition-colors font-semibold disabled:opacity-50 text-xs"
                  >
                    {submittingAction ? 'Đang xử lý...' : 'Xác nhận đơn'}
                  </button>
                )}
                {orderDetail.status === 'processing' && (
                  <button
                    disabled={submittingAction}
                    onClick={() => handleShip(orderDetail.orderCode)}
                    className="px-md py-sm bg-[#1A1A2E] text-white hover:bg-black transition-colors font-semibold disabled:opacity-50 text-xs"
                  >
                    {submittingAction ? 'Đang xử lý...' : 'Giao hàng'}
                  </button>
                )}
                {orderDetail.status === 'shipping' && (
                  <button
                    disabled={submittingAction}
                    onClick={() => setIsCompleteModalOpen(true)}
                    className="px-md py-sm bg-success text-white hover:bg-[#206938] transition-colors font-semibold disabled:opacity-50 text-xs"
                  >
                    Giao thành công
                  </button>
                )}
                <button
                  onClick={() => { setSelectedOrderCode(null); setOrderDetail(null); }}
                  className="px-md py-sm bg-[#e2e3e1] text-text-primary hover:bg-[#d5d6d4] transition-colors font-semibold text-xs"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Reason Modal */}
      {isCancelModalOpen && orderDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-lg border border-border-subtle max-w-md w-full p-md shadow-2xl space-y-md">
            <h3 className="font-headline-md text-headline-md font-bold text-error border-b pb-xs">Lý do hủy đơn hàng</h3>
            <div>
              <p className="text-xs text-text-muted mb-2 font-semibold font-label-caps">Mã đơn hàng: {orderDetail.orderCode}</p>
              <textarea
                rows={4}
                className="w-full border border-border-subtle p-md rounded-DEFAULT focus:outline-none focus:border-primary transition-colors text-xs"
                placeholder="Nhập lý do hủy chi tiết..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-md">
              <button
                onClick={() => { setIsCancelModalOpen(false); setCancelReason(''); }}
                className="px-md py-xs bg-surface-container hover:bg-surface-container-high transition-colors font-semibold"
              >
                Bỏ qua
              </button>
              <button
                disabled={submittingAction || !cancelReason.trim()}
                onClick={handleCancel}
                className="px-md py-xs bg-error text-white hover:bg-error/95 transition-colors font-semibold disabled:opacity-50"
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Order Dialog */}
      {isCompleteModalOpen && orderDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-lg border border-border-subtle max-w-md w-full p-md shadow-2xl space-y-md">
            <h3 className="font-headline-md text-headline-md font-bold text-success border-b pb-xs">Hoàn thành đơn hàng</h3>
            <p className="text-xs text-text-muted font-semibold font-label-caps">Mã đơn hàng: {orderDetail.orderCode}</p>
            
            <div className="space-y-sm">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1 font-label-caps">Phương thức thanh toán thực tế</label>
                <select
                  className="w-full px-md py-sm border border-border-subtle rounded-DEFAULT focus:outline-none focus:border-primary transition-colors text-xs"
                  value={completePaymentMethod}
                  onChange={(e) => setCompletePaymentMethod(e.target.value)}
                >
                  <option value="cod">Tiền mặt khi giao hàng (COD)</option>
                  <option value="vnpay">Chuyển khoản VNPay</option>
                  <option value="momo">Ví điện tử MoMo</option>
                  <option value="bank_transfer">Chuyển khoản ngân hàng trực tiếp</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1 font-label-caps">Ghi chú giao nhận</label>
                <textarea
                  rows={3}
                  className="w-full border border-border-subtle p-md rounded-DEFAULT focus:outline-none focus:border-primary transition-colors text-xs"
                  placeholder="Ghi chú người nhận hàng, người giao,..."
                  value={completeNote}
                  onChange={(e) => setCompleteNote(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-md pt-sm">
              <button
                onClick={() => { setIsCompleteModalOpen(false); setCompleteNote(''); }}
                className="px-md py-xs bg-surface-container hover:bg-surface-container-high transition-colors font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                disabled={submittingAction}
                onClick={handleComplete}
                className="px-md py-xs bg-success text-white hover:bg-success/90 transition-colors font-semibold disabled:opacity-50"
              >
                Xác nhận hoàn thành
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
