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
        confirmationSource: 'internal_shipper',
        note: completeNote.trim() || 'Nhân viên xác nhận đơn hàng đã giao thành công.'
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'processing':
        return 'Đã xác nhận';
      case 'shipping':
        return 'Đang giao';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getStatusTextClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-warning';
      case 'processing':
        return 'text-[#1B72E8]';
      case 'shipping':
        return 'text-[#8E24AA]';
      case 'completed':
        return 'text-success';
      case 'cancelled':
        return 'text-error';
      default:
        return 'text-text-muted';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const normalized = method?.toLowerCase();
    switch (normalized) {
      case 'cod':
        return 'COD';
      case 'vnpay':
        return 'VNPay';
      case 'momo':
        return 'MoMo';
      case 'bank_transfer':
        return 'Chuyển khoản';
      default:
        return method || '-';
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    const normalized = status?.toLowerCase();
    switch (normalized) {
      case 'paid':
      case 'completed':
        return 'Đã thanh toán';
      case 'pending':
        return 'Chưa thanh toán';
      case 'failed':
        return 'Thanh toán lỗi';
      case 'refunded':
        return 'Đã hoàn tiền';
      default:
        return status || '-';
    }
  };

  const getPaymentStatusTextClass = (status: string) => {
    const normalized = status?.toLowerCase();
    if (normalized === 'paid' || normalized === 'completed' || normalized === 'refunded') {
      return 'text-success';
    }
    if (normalized === 'failed') {
      return 'text-error';
    }
    return 'text-warning';
  };

  const formatMetadataValue = (value: unknown) => {
    if (value == null || value === '') return '-';
    if (typeof value === 'boolean') return value ? 'Có' : 'Không';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const formatOrderDate = (date: string) => {
    if (!date) return '-';
    const parsedDate = new Date(date);
    return `${parsedDate.toLocaleDateString('vi-VN')} · ${parsedDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="bg-[#FAFAF8] min-h-full font-body-sm text-body-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-md">
        <h2 className="font-headline-lg text-headline-lg font-bold">Quản lý đơn hàng</h2>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-border-subtle mb-md gap-sm">
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
            placeholder="Tên khách hàng..."
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
        <table className="w-full table-fixed text-left">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[20%]" />
            <col className="w-[18%]" />
            <col className="w-[19%]" />
            <col className="w-[21%]" />
          </colgroup>
          <thead className="bg-surface-alt border-b border-border-subtle">
            <tr>
              <th className="py-md px-lg font-label-caps text-label-caps text-text-muted">Khách hàng</th>
              <th className="py-md px-lg font-label-caps text-label-caps text-text-muted">Ngày đặt</th>
              <th className="py-md px-lg font-label-caps text-label-caps text-text-muted whitespace-nowrap">Số tiền thanh toán</th>
              <th className="py-md px-lg font-label-caps text-label-caps text-text-muted whitespace-nowrap">Phương thức thanh toán</th>
              <th className="py-md px-lg font-label-caps text-label-caps text-text-muted whitespace-nowrap">Trạng thái đơn hàng</th>
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
                <tr
                  key={order.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleFetchDetail(order.orderCode)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleFetchDetail(order.orderCode);
                    }
                  }}
                  aria-label={`Xem chi tiết đơn hàng của ${order.customerName || 'khách vãng lai'}`}
                  className="border-b border-surface-container cursor-pointer hover:bg-surface-alt focus:bg-surface-alt focus:outline-none transition-colors"
                >
                  <td className="py-md px-lg align-middle">
                    <p className="font-medium text-text-primary break-words">{order.customerName || 'Khách vãng lai'}</p>
                    <p className="mt-1 font-mono text-[11px] text-text-muted whitespace-nowrap overflow-hidden text-ellipsis" title={order.orderCode}>
                      {order.orderCode}
                    </p>
                  </td>
                  <td className="py-md px-lg align-middle text-xs text-text-muted break-words">
                    {formatOrderDate(order.createdAt)}
                  </td>
                  <td className="py-md px-lg align-middle font-semibold text-primary font-mono whitespace-nowrap">
                    {order.totalAmount?.toLocaleString('vi-VN') ?? 0}đ
                  </td>
                  <td className="py-md px-lg align-middle text-xs font-semibold uppercase text-text-primary whitespace-nowrap">
                    {getPaymentMethodLabel(order.paymentMethod)}
                  </td>
                  <td className="py-md px-lg align-middle">
                    <span className={`text-xs font-semibold whitespace-nowrap ${getStatusTextClass(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

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
            <div className="px-lg py-md border-b border-border-subtle flex justify-between items-center bg-[#1A1A2E] text-white">
              <div>
                <p className="text-xs uppercase text-white/60 font-semibold font-label-caps animate-pulse">Chi tiết đơn hàng</p>
                <h3 className="font-mono text-lg font-semibold mt-[2px] text-white">{orderDetail.orderCode}</h3>
              </div>
              <button 
                onClick={() => { setSelectedOrderCode(null); setOrderDetail(null); }}
                className="text-white/60 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-md space-y-md">
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm border border-border-subtle p-sm rounded-lg bg-white">
                <div>
                  <p className="text-xs text-text-muted uppercase font-label-caps mb-1">Trạng thái đơn</p>
                  <span className={`text-xs font-semibold ${getStatusTextClass(orderDetail.status)}`}>
                    {getStatusLabel(orderDetail.status)}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase font-label-caps mb-1">Phương thức thanh toán</p>
                  <span className="text-xs font-semibold uppercase text-text-primary">
                    {getPaymentMethodLabel(orderDetail.payment?.method || '')}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase font-label-caps mb-1">Trạng thái thanh toán</p>
                  <span className={`text-xs font-semibold ${getPaymentStatusTextClass(orderDetail.payment?.status || '')}`}>
                    {getPaymentStatusLabel(orderDetail.payment?.status || '')}
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
                      {orderDetail.items.map((item, index) => (
                        <tr key={`${item.productVariantId ?? item.sku ?? item.productName}-${index}`} className="border-b border-surface-container last:border-0 hover:bg-surface-container-low transition-colors">
                          <td className="py-sm px-md flex items-center gap-sm">
                            <img
                              src="https://placehold.co/100x130?text=Clothy"
                              className="w-10 h-12 object-cover border border-border-subtle rounded"
                              alt=""
                            />
                            <p className="font-medium text-xs line-clamp-2">{item.productName}</p>
                          </td>
                          <td className="py-sm px-md text-xs text-center text-text-muted font-medium">
                            {item.variantInfo || item.sku || '-'}
                          </td>
                          <td className="py-sm px-md text-xs text-center font-mono font-semibold">{item.quantity}</td>
                          <td className="py-sm px-md text-xs text-right font-mono font-medium">{item.unitPrice?.toLocaleString('vi-VN') ?? 0}đ</td>
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
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed text-left">
                    <colgroup>
                      <col className="w-[34%]" />
                      <col className="w-[26%]" />
                      <col className="w-[20%]" />
                      <col className="w-[20%]" />
                    </colgroup>
                    <thead>
                      <tr className="text-[10px] uppercase font-label-caps text-text-muted">
                        <th className="py-xs pr-sm font-semibold">Trạng thái</th>
                        <th className="py-xs px-sm font-semibold">Thời gian</th>
                        <th className="py-xs px-sm font-semibold">Thao tác bởi</th>
                        <th className="py-xs pl-sm font-semibold">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderDetail.timeline?.map((history) => (
                        <tr key={history.id} className="align-top hover:bg-surface-alt/60">
                          <td className="py-xs pr-sm">
                            <div className="flex items-center gap-xs whitespace-nowrap">
                              {history.fromStatus && (
                                <>
                                  <span className={`text-xs font-semibold ${getStatusTextClass(history.fromStatus)}`}>
                                    {getStatusLabel(history.fromStatus)}
                                  </span>
                                  <span className="text-[10px] text-text-muted">→</span>
                                </>
                              )}
                              <span className={`text-xs font-semibold ${getStatusTextClass(history.toStatus)}`}>
                                {getStatusLabel(history.toStatus)}
                              </span>
                            </div>
                          </td>
                          <td className="py-xs px-sm text-[11px] text-text-muted whitespace-nowrap">
                            {history.createdAt ? new Date(history.createdAt).toLocaleString('vi-VN') : '-'}
                          </td>
                          <td className="py-xs px-sm text-[11px] text-text-muted truncate">
                            {history.actorLabel || '-'}
                          </td>
                          <td className="py-xs pl-sm text-[11px] text-text-muted">
                            <span className="line-clamp-1">
                              {history.reason || (
                                history.metadata && Object.keys(history.metadata).length > 0
                                  ? Object.entries(history.metadata).map(([key, value]) => `${key}: ${formatMetadataValue(value)}`).join(', ')
                                  : '-'
                              )}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="px-lg py-md border-t border-border-subtle bg-[#FAFAF8] flex justify-between gap-md">
              {(orderDetail.status === 'pending' || orderDetail.status === 'processing') && (
                <button
                  disabled={submittingAction}
                  onClick={() => setIsCancelModalOpen(true)}
                  className="px-md py-xs bg-white border border-[#ba1a1a] text-[#ba1a1a] hover:bg-error-container/20 transition-colors font-semibold disabled:opacity-50 text-xs"
                >
                  Hủy đơn hàng
                </button>
              )}

              <div className="flex gap-md ml-auto">
                {orderDetail.status === 'pending' && (
                  <button
                    disabled={submittingAction}
                    onClick={() => handleConfirm(orderDetail.orderCode)}
                    className="px-md py-xs bg-[#1A1A2E] text-white hover:bg-black transition-colors font-semibold disabled:opacity-50 text-xs"
                  >
                    {submittingAction ? 'Đang xử lý...' : 'Xác nhận đơn'}
                  </button>
                )}
                {orderDetail.status === 'processing' && (
                  <button
                    disabled={submittingAction}
                    onClick={() => handleShip(orderDetail.orderCode)}
                    className="px-md py-xs bg-[#1A1A2E] text-white hover:bg-black transition-colors font-semibold disabled:opacity-50 text-xs"
                  >
                    {submittingAction ? 'Đang xử lý...' : 'Giao hàng'}
                  </button>
                )}
                {orderDetail.status === 'shipping' && (
                  <button
                    disabled={submittingAction}
                    onClick={() => setIsCompleteModalOpen(true)}
                    className="px-md py-xs bg-success text-white hover:bg-[#206938] transition-colors font-semibold disabled:opacity-50 text-xs"
                  >
                    Giao thành công
                  </button>
                )}
                <button
                  onClick={() => { setSelectedOrderCode(null); setOrderDetail(null); }}
                  className="px-md py-xs bg-[#e2e3e1] text-text-primary hover:bg-[#d5d6d4] transition-colors font-semibold text-xs"
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
                <label className="block text-xs font-semibold text-text-muted mb-1 font-label-caps">Ghi chú giao nhận</label>
                <textarea
                  rows={3}
                  className="w-full border border-border-subtle p-md rounded-DEFAULT focus:outline-none focus:border-primary transition-colors text-xs"
                  placeholder="Để trống sẽ dùng ghi chú xác nhận giao thành công mặc định."
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
