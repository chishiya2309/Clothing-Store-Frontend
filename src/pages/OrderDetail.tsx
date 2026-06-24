import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService, type OrderDetail, type OrderStatus } from '@/services/order.service';

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
    pending: {
        label: 'Chờ xác nhận',
        className: 'bg-[#E8A317]/15 text-[#E8A317] border border-[#E8A317]/30',
    },
    processing: {
        label: 'Đang xử lý',
        className: 'bg-[#1A1A2E]/10 text-[#1A1A2E] border border-[#1A1A2E]/20',
    },
    shipping: {
        label: 'Đang giao hàng',
        className: 'bg-primary text-on-primary',
    },
    completed: {
        label: 'Hoàn thành',
        className: 'bg-success/15 text-success border border-success/30',
    },
    cancelled: {
        label: 'Đã hủy',
        className: 'bg-surface-dim text-on-surface-variant border border-border-subtle',
    },
};

const PAYMENT_METHOD_MAP: Record<string, string> = {
    COD: 'Thanh toán khi nhận hàng (COD)',
    MOMO: 'Thanh toán qua ví MoMo',
    VNPAY: 'Thanh toán qua cổng VNPay',
};

const PAYMENT_STATUS_MAP: Record<string, { label: string; className: string }> = {
    pending: { label: 'Chưa thanh toán', className: 'text-text-muted' },
    completed: { label: 'Đã thanh toán', className: 'text-success font-medium' },
    failed: { label: 'Thanh toán thất bại', className: 'text-error font-medium' },
    refunded: { label: 'Đã hoàn tiền', className: 'text-[#E8A317] font-medium' },
};

function formatPrice(amount: number): string {
    return amount.toLocaleString('vi-VN') + '₫';
}

function formatDate(isoString: string): string {
    const d = new Date(isoString);
    return d.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function OrderDetail() {
    const { orderCode } = useParams<{ orderCode: string }>();
    const [detail, setDetail] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [showConfirmCancel, setShowConfirmCancel] = useState(false);
    const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

    const fetchOrderDetail = async () => {
        if (!orderCode) return;
        try {
            setLoading(true);
            setError(null);
            const data = await orderService.getOrderDetail(orderCode);
            setDetail(data);
        } catch (err: any) {
            console.error('Error fetching order details:', err);
            setError('Không thể tải chi tiết đơn hàng. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrderDetail();
    }, [orderCode]);

    const handleCancelOrder = async () => {
        if (!orderCode) return;
        try {
            setIsCancelling(true);
            await orderService.cancelOrder(orderCode);
            setCancelSuccessMsg('Hủy đơn hàng thành công!');
            setShowConfirmCancel(false);
            // Refresh order info
            await fetchOrderDetail();
            // Automatically clear success message after 5 seconds
            setTimeout(() => setCancelSuccessMsg(null), 5000);
        } catch (err: any) {
            console.error('Error cancelling order:', err);
            alert(err?.response?.data?.message || 'Có lỗi xảy ra khi hủy đơn hàng. Vui lòng thử lại.');
        } finally {
            setIsCancelling(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-6 w-full animate-pulse">
                <div className="h-6 bg-surface-container rounded w-1/4 mb-4" />
                <div className="h-12 bg-surface-container rounded w-2/3" />
                <div className="h-40 bg-surface-container rounded-lg w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-32 bg-surface-container rounded-lg" />
                    <div className="h-32 bg-surface-container rounded-lg" />
                </div>
                <div className="h-48 bg-surface-container rounded-lg w-full" />
            </div>
        );
    }

    if (error || !detail) {
        return (
            <div className="bg-surface rounded-lg border border-border-subtle p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                <span className="material-symbols-outlined text-error text-5xl mb-4">error</span>
                <h3 className="font-headline-md text-headline-md text-primary mb-2">Đã xảy ra lỗi</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-6">{error || 'Không tìm thấy thông tin đơn hàng.'}</p>
                <Link
                    to="/account/orders"
                    className="px-6 py-3 bg-primary-container text-on-primary font-body-md text-body-md rounded hover:opacity-90 transition-all flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    Quay lại danh sách đơn hàng
                </Link>
            </div>
        );
    }

    // Determine Timeline Steps status
    // Steps: 1. Đặt hàng, 2. Xác nhận, 3. Đang giao, 4. Thành công
    const getStepStatus = (step: number) => {
        const status = detail.status;
        if (status === 'cancelled') return 'disabled';

        switch (step) {
            case 1:
                return 'completed'; // Order placement is always completed
            case 2:
                if (status === 'processing' || status === 'shipping' || status === 'completed') return 'completed';
                return 'pending';
            case 3:
                if (status === 'shipping') return 'active';
                if (status === 'completed') return 'completed';
                return 'pending';
            case 4:
                if (status === 'completed') return 'completed';
                return 'pending';
            default:
                return 'pending';
        }
    };

    // Calculate Active Line Width/Height percentages for timeline
    const getActiveProgressPercent = () => {
        const status = detail.status;
        if (status === 'pending') return '0%';
        if (status === 'processing') return '33.33%';
        if (status === 'shipping') return '66.66%';
        if (status === 'completed') return '100%';
        return '0%';
    };

    return (
        <section className="flex-grow flex flex-col gap-6 w-full relative">
            {/* Breadcrumb & Header */}
            <div>
                <nav aria-label="Breadcrumb" className="flex text-text-muted font-body-sm text-body-sm mb-4">
                    <ol className="inline-flex items-center space-x-1">
                        <li className="inline-flex items-center">
                            <Link className="hover:text-primary transition-colors" to="/account/profile">Tài khoản</Link>
                        </li>
                        <li className="flex items-center">
                            <span className="material-symbols-outlined text-sm mx-1">chevron_right</span>
                            <Link className="hover:text-primary transition-colors" to="/account/orders">Đơn hàng</Link>
                        </li>
                        <li aria-current="page" className="flex items-center">
                            <span className="material-symbols-outlined text-sm mx-1">chevron_right</span>
                            <span className="text-on-surface">Chi tiết</span>
                        </li>
                    </ol>
                </nav>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary flex items-center gap-2">
                        <Link to="/account/orders" className="hover:opacity-80 flex items-center justify-center w-8 h-8 rounded-full border border-border-subtle md:hidden">
                            <span className="material-symbols-outlined text-md">arrow_back</span>
                        </Link>
                        Đơn hàng #{detail.orderCode}
                    </h1>
                    <span
                        className={`inline-flex items-center px-4 py-1.5 rounded-full font-label-caps text-label-caps self-start sm:self-auto uppercase tracking-wider font-semibold ${
                            STATUS_CONFIG[detail.status].className
                        }`}
                    >
                        {STATUS_CONFIG[detail.status].label}
                    </span>
                </div>
                <p className="text-text-muted font-body-sm text-body-sm mt-2">Ngày đặt: {formatDate(detail.createdAt)}</p>
            </div>

            {/* Cancel Success Banner */}
            {cancelSuccessMsg && (
                <div className="bg-success/10 border border-success/30 text-success px-4 py-3 rounded-lg flex items-center gap-2 animate-[fadeIn_0.3s_ease-out]">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span className="font-body-md text-body-sm">{cancelSuccessMsg}</span>
                </div>
            )}

            {/* Order Timeline Tracker (Hidden if Cancelled) */}
            {detail.status !== 'cancelled' ? (
                <div className="bg-surface rounded-lg border border-border-subtle p-6 md:p-8">
                    <h3 className="font-headline-md text-body-lg font-semibold mb-8 text-primary">Trạng thái giao hàng</h3>
                    <div className="relative flex flex-col md:flex-row justify-between w-full min-h-[220px] md:min-h-0">
                        {/* Progress Line Background */}
                        <div
                            className="absolute left-[15px] top-0 bottom-0 w-0.5 md:w-full md:h-0.5 bg-border-subtle md:top-[15px] md:left-0 z-0"
                        />
                        {/* Active Progress Line */}
                        <div
                            className="absolute left-[15px] top-0 w-0.5 md:h-0.5 bg-primary md:top-[15px] md:left-0 z-0 transition-all duration-500"
                            style={{
                                height: window.innerWidth < 768 ? getActiveProgressPercent() : 'auto',
                                width: window.innerWidth >= 768 ? getActiveProgressPercent() : 'auto',
                            }}
                        />

                        {/* Stage 1 */}
                        <div className="flex flex-row md:flex-col items-start md:items-center relative z-10 gap-4 md:gap-2 mb-6 md:mb-0 w-full md:w-1/4">
                            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 border-4 border-surface">
                                <span className="material-symbols-outlined text-[16px]">check</span>
                            </div>
                            <div className="md:text-center mt-1 md:mt-2">
                                <p className="font-body-sm text-body-sm font-semibold text-on-surface">Đã đặt hàng</p>
                                <p className="font-body-sm text-body-sm text-text-muted text-[12px] mt-1">{formatDate(detail.createdAt)}</p>
                            </div>
                        </div>

                        {/* Stage 2 */}
                        <div className="flex flex-row md:flex-col items-start md:items-center relative z-10 gap-4 md:gap-2 mb-6 md:mb-0 w-full md:w-1/4">
                            {getStepStatus(2) === 'completed' ? (
                                <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 border-4 border-surface">
                                    <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                                </div>
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-surface border-2 border-border-subtle text-border-subtle flex items-center justify-center shrink-0 border-4 border-surface">
                                    <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                                </div>
                            )}
                            <div className={`md:text-center mt-1 md:mt-2 ${getStepStatus(2) === 'pending' ? 'opacity-50' : ''}`}>
                                <p className="font-body-sm text-body-sm font-semibold text-on-surface">Đã xác nhận</p>
                                <p className="font-body-sm text-body-sm text-text-muted text-[12px] mt-1">
                                    {getStepStatus(2) === 'completed' ? 'Đã xử lý' : 'Đang xử lý'}
                                </p>
                            </div>
                        </div>

                        {/* Stage 3 */}
                        <div className="flex flex-row md:flex-col items-start md:items-center relative z-10 gap-4 md:gap-2 mb-6 md:mb-0 w-full md:w-1/4">
                            {getStepStatus(3) === 'completed' ? (
                                <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 border-4 border-surface">
                                    <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                                </div>
                            ) : getStepStatus(3) === 'active' ? (
                                <div className="w-8 h-8 rounded-full bg-surface border-2 border-primary text-primary flex items-center justify-center shrink-0 ring-4 ring-surface shadow-[0_0_0_4px_rgba(0,0,0,0.05)]">
                                    <div className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
                                </div>
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-surface border-2 border-border-subtle text-border-subtle flex items-center justify-center shrink-0 border-4 border-surface">
                                    <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                                </div>
                            )}
                            <div className={`md:text-center mt-1 md:mt-2 ${getStepStatus(3) === 'pending' ? 'opacity-50' : ''}`}>
                                <p className="font-body-sm text-body-sm font-semibold text-on-surface">Đang giao hàng</p>
                                <p className="font-body-sm text-body-sm text-text-muted text-[12px] mt-1">
                                    {getStepStatus(3) === 'active' ? 'Đang vận chuyển' : getStepStatus(3) === 'completed' ? 'Đã giao' : 'Chờ vận chuyển'}
                                </p>
                            </div>
                        </div>

                        {/* Stage 4 */}
                        <div className="flex flex-row md:flex-col items-start md:items-center relative z-10 gap-4 md:gap-2 w-full md:w-1/4">
                            {getStepStatus(4) === 'completed' ? (
                                <div className="w-8 h-8 rounded-full bg-success text-on-primary flex items-center justify-center shrink-0 border-4 border-surface">
                                    <span className="material-symbols-outlined text-[16px]">home</span>
                                </div>
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-surface border-2 border-border-subtle text-border-subtle flex items-center justify-center shrink-0 border-4 border-surface">
                                    <span className="material-symbols-outlined text-[16px]">home</span>
                                </div>
                            )}
                            <div className={`md:text-center mt-1 md:mt-2 ${getStepStatus(4) === 'pending' ? 'opacity-50' : ''}`}>
                                <p className="font-body-sm text-body-sm font-semibold text-on-surface">Thành công</p>
                                <p className="font-body-sm text-body-sm text-text-muted text-[12px] mt-1">
                                    {getStepStatus(4) === 'completed' ? 'Đã giao thành công' : 'Chờ hoàn thành'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Cancelled Banner */
                <div className="bg-surface-dim rounded-lg border border-border-subtle p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                    <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center shrink-0 border border-border-subtle">
                        <span className="material-symbols-outlined text-on-surface-variant text-2xl">cancel</span>
                    </div>
                    <div>
                        <h3 className="font-headline-md text-body-lg font-semibold text-primary">Đơn hàng đã bị hủy</h3>
                        <p className="font-body-sm text-body-sm text-text-muted mt-1">
                            Mọi yêu cầu hoàn trả voucher và khôi phục số lượng tồn kho sản phẩm đã được hệ thống xử lý hoàn tất.
                        </p>
                    </div>
                </div>
            )}

            {/* Two Column Details: Shipping & Payment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Shipping Info */}
                <div className="bg-surface rounded-lg border border-border-subtle p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-primary">location_on</span>
                        <h3 className="font-headline-md text-body-lg font-semibold text-primary">Thông tin giao hàng</h3>
                    </div>
                    <div className="flex flex-col gap-2 font-body-sm text-body-sm text-on-surface-variant">
                        <p><strong className="text-on-surface font-semibold text-primary">{detail.shippingName}</strong></p>
                        <p>{detail.shippingPhone}</p>
                        <p className="leading-relaxed">
                            {detail.shippingAddress}
                            <br />
                            Phường/Xã: {detail.shippingWard}, Quận/Huyện: {detail.shippingDistrict}
                            <br />
                            Tỉnh/Thành phố: {detail.shippingProvince}
                            <br />
                            Việt Nam
                        </p>
                    </div>
                </div>

                {/* Payment Method & Status */}
                <div className="bg-surface rounded-lg border border-border-subtle p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-primary">payments</span>
                        <h3 className="font-headline-md text-body-lg font-semibold text-primary">Phương thức thanh toán</h3>
                    </div>
                    <div className="flex items-center gap-4 bg-surface-alt p-4 rounded border border-border-subtle">
                        <span className="material-symbols-outlined text-primary text-3xl">
                            {detail.paymentMethod === 'COD' ? 'local_atm' : 'credit_card'}
                        </span>
                        <div className="font-body-sm text-body-sm">
                            <p className="font-semibold text-on-surface text-primary">
                                {PAYMENT_METHOD_MAP[detail.paymentMethod || ''] || detail.paymentMethod || 'Chưa xác định'}
                            </p>
                            <p className={`text-[13px] mt-1 ${
                                PAYMENT_STATUS_MAP[detail.paymentStatus || '']?.className || 'text-text-muted'
                            }`}>
                                {PAYMENT_STATUS_MAP[detail.paymentStatus || '']?.label || detail.paymentStatus || 'Chờ thanh toán'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product List */}
            <div className="bg-surface rounded-lg border border-border-subtle overflow-hidden">
                <div className="p-4 border-b border-border-subtle bg-surface-alt/50">
                    <h3 className="font-headline-md text-body-lg font-semibold text-primary">
                        Sản phẩm ({detail.items.reduce((acc, curr) => acc + curr.quantity, 0)})
                    </h3>
                </div>
                <div className="flex flex-col divide-y divide-border-subtle">
                    {detail.items.map((item) => (
                        <div key={item.id} className="flex items-start gap-4 p-4 hover:bg-surface-alt/30 transition-colors">
                            <div className="w-20 h-24 bg-surface-container rounded overflow-hidden flex-shrink-0 border border-border-subtle">
                                {item.imageUrl ? (
                                    <img alt={item.productName} className="w-full h-full object-cover" src={item.imageUrl} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-surface-container-high text-on-surface-variant">
                                        <span className="material-symbols-outlined">image</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-grow flex flex-col md:flex-row justify-between gap-4">
                                <div className="flex flex-col">
                                    <Link to={`/product/${item.productSlug}`} className="font-body-md text-body-md font-medium text-primary hover:underline mb-1">
                                        {item.productName}
                                    </Link>
                                    <p className="font-body-sm text-body-sm text-text-muted">{item.variantInfo || 'Phân loại mặc định'}</p>
                                    <span className="md:hidden font-price-display text-price-display mt-auto text-primary">
                                        {formatPrice(item.unitPrice)}
                                        <span className="text-sm font-normal text-text-muted ml-1">x{item.quantity}</span>
                                    </span>
                                </div>
                                <div className="hidden md:flex flex-col items-end justify-between text-right">
                                    <p className="font-price-display text-price-display text-primary">{formatPrice(item.unitPrice)}</p>
                                    <p className="font-body-sm text-body-sm text-text-muted mt-2">SL: {item.quantity}</p>
                                    <p className="font-price-display text-price-display font-semibold mt-auto pt-4 text-primary">
                                        {formatPrice(item.subtotal)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Order Summary & Actions Container */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-end mt-4">
                {/* Actions */}
                <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3 order-2 md:order-1">
                    <Link
                        to="/account/orders"
                        className="px-6 py-3 border border-outline text-on-surface font-body-md text-body-md rounded hover:bg-surface-container transition-colors flex items-center justify-center gap-2 text-primary"
                    >
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        Quay lại đơn hàng
                    </Link>

                    {detail.status === 'pending' && (
                        <button
                            onClick={() => setShowConfirmCancel(true)}
                            className="px-6 py-3 border border-error text-error font-body-md text-body-md rounded hover:bg-error-container/10 transition-colors flex items-center justify-center gap-2"
                        >
                            Hủy đơn hàng
                        </button>
                    )}

                    <a
                        href="https://zalo.me"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-primary text-on-primary font-body-md text-body-md rounded hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">support_agent</span>
                        Liên hệ hỗ trợ
                    </a>
                </div>

                {/* Summary */}
                <div className="w-full md:w-80 bg-surface p-6 rounded-lg border border-border-subtle order-1 md:order-2">
                    <div className="flex flex-col gap-3 font-body-md text-body-md text-on-surface-variant border-b border-border-subtle pb-4 mb-4">
                        <div className="flex justify-between">
                            <span className="text-text-muted">Tạm tính</span>
                            <span className="font-price-display text-primary">{formatPrice(detail.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-muted">Phí vận chuyển</span>
                            <span className="font-price-display text-primary">
                                {detail.shippingFee === 0 ? 'Miễn phí' : formatPrice(detail.shippingFee)}
                            </span>
                        </div>
                        {detail.discountAmount > 0 && (
                            <div className="flex justify-between text-success">
                                <span>Giảm giá</span>
                                <span className="font-price-display">-{formatPrice(detail.discountAmount)}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-headline-md text-body-lg font-semibold text-primary">Tổng cộng</span>
                        <span className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-bold">
                            {formatPrice(detail.totalAmount)}
                        </span>
                    </div>
                    <p className="text-right text-[12px] text-text-muted mt-2 font-body-sm">(Đã bao gồm VAT nếu có)</p>
                </div>
            </div>

            {/* Confirmation Dialog/Modal for cancellation */}
            {showConfirmCancel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-2xl max-w-md w-full mx-4 animate-[fadeSlideUp_0.2s_ease-out]">
                        <h3 className="font-headline-md text-headline-md text-primary mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-error">warning</span>
                            Xác nhận hủy đơn hàng
                        </h3>
                        <p className="font-body-md text-body-md text-on-surface-variant mb-6 leading-relaxed">
                            Bạn có chắc chắn muốn hủy đơn hàng <strong>#{detail.orderCode}</strong>? Hành động này không thể hoàn tác và mọi voucher giảm giá áp dụng cho đơn hàng này sẽ được khôi phục.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfirmCancel(false)}
                                className="px-5 py-2.5 border border-outline text-primary font-medium rounded hover:bg-surface-container transition-colors"
                                disabled={isCancelling}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleCancelOrder}
                                className="px-5 py-2.5 bg-error text-on-error font-medium rounded hover:opacity-90 transition-all flex items-center gap-1.5"
                                disabled={isCancelling}
                            >
                                {isCancelling ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-on-error border-t-transparent rounded-full animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    'Xác nhận hủy'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
