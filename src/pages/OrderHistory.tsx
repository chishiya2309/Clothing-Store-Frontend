import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { orderService, type OrderHistoryItem, type OrderStatus } from '@/services/order.service';
import type { PageResponse } from '@/services/product.service';

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

const FILTER_TABS: { label: string; value: OrderStatus | 'all' }[] = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Chờ xác nhận', value: 'pending' },
    { label: 'Đang xử lý', value: 'processing' },
    { label: 'Đang giao hàng', value: 'shipping' },
    { label: 'Hoàn thành', value: 'completed' },
    { label: 'Đã hủy', value: 'cancelled' },
];

function formatPrice(amount: number): string {
    return amount.toLocaleString('vi-VN') + '₫';
}

function formatDate(isoString: string): string {
    const d = new Date(isoString);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' });
}

/** Skeleton card for loading state */
function OrderCardSkeleton() {
    return (
        <div className="bg-surface-container-lowest border border-border-subtle rounded-lg p-md animate-pulse">
            <div className="flex justify-between items-center mb-md pb-md border-b border-border-subtle">
                <div>
                    <div className="h-3 bg-surface-container rounded w-16 mb-2" />
                    <div className="h-5 bg-surface-container rounded w-32" />
                </div>
                <div>
                    <div className="h-3 bg-surface-container rounded w-16 mb-2" />
                    <div className="h-5 bg-surface-container rounded w-28" />
                </div>
                <div className="h-6 bg-surface-container rounded-full w-24" />
            </div>
            <div className="flex justify-between items-end">
                <div className="flex gap-sm">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="w-16 h-20 bg-surface-container rounded" />
                    ))}
                </div>
                <div className="text-right">
                    <div className="h-5 bg-surface-container rounded w-28 mb-2 ml-auto" />
                    <div className="h-4 bg-surface-container rounded w-20 ml-auto" />
                </div>
            </div>
        </div>
    );
}

export default function OrderHistory() {
    const [pageData, setPageData] = useState<PageResponse<OrderHistoryItem> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all');

    const fetchOrders = useCallback(async (page: number, filter: OrderStatus | 'all') => {
        setIsLoading(true);
        try {
            const data = await orderService.getOrders(page, 10, filter === 'all' ? undefined : filter);
            setPageData(data);
        } catch {
            setPageData(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders(currentPage, activeFilter);
    }, [currentPage, activeFilter, fetchOrders]);

    const handleFilterChange = (filter: OrderStatus | 'all') => {
        setActiveFilter(filter);
        setCurrentPage(0);
    };

    const handlePageChange = (newPage: number) => {
        if (pageData && newPage >= 0 && newPage < pageData.totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <>
            <style>{`
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .order-card {
                    animation: fadeSlideUp 0.3s ease-out both;
                }
                .order-card:nth-child(1) { animation-delay: 0ms; }
                .order-card:nth-child(2) { animation-delay: 60ms; }
                .order-card:nth-child(3) { animation-delay: 120ms; }
                .order-card:nth-child(4) { animation-delay: 180ms; }
                .order-card:nth-child(5) { animation-delay: 240ms; }
            `}</style>

            <div className="bg-surface rounded-xl p-md border border-border-subtle shadow-sm min-h-[60vh]">
                <h1 className="font-headline-md text-headline-md text-primary mb-lg border-b border-border-subtle pb-4">
                    Đơn hàng của tôi
                </h1>

                {/* Status filter tabs */}
                <div className="flex gap-2 mb-lg overflow-x-auto pb-2 scrollbar-hide">
                    {FILTER_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => handleFilterChange(tab.value)}
                            className={`flex-shrink-0 px-4 py-1.5 rounded-full font-label-caps text-label-caps transition-all duration-200 border ${
                                activeFilter === tab.value
                                    ? 'bg-primary text-on-primary border-primary'
                                    : 'bg-surface text-on-surface-variant border-border-subtle hover:border-primary hover:text-primary'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Order list */}
                {isLoading ? (
                    <div className="flex flex-col gap-md">
                        {[0, 1, 2].map((i) => <OrderCardSkeleton key={i} />)}
                    </div>
                ) : !pageData || pageData.content.length === 0 ? (
                    <div className="text-center py-20">
                        <span className="material-symbols-outlined text-6xl text-border-subtle mb-4 block">package_2</span>
                        <p className="text-on-surface-variant font-body-lg">
                            {activeFilter === 'all' ? 'Bạn chưa có đơn hàng nào.' : 'Không có đơn hàng nào trong trạng thái này.'}
                        </p>
                        <Link to="/" className="inline-block mt-4 text-primary font-medium hover:underline">
                            Tiếp tục mua sắm
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-md">
                        {pageData.content.map((order) => {
                            const statusCfg = STATUS_CONFIG[order.status];
                            const isCancelled = order.status === 'cancelled';
                            const extraCount = order.itemCount - order.productImages.length;

                            return (
                                <article
                                    key={order.id}
                                    className={`order-card bg-surface-container-lowest border border-border-subtle rounded-lg p-md hover:shadow-md transition-all duration-300 ${
                                        isCancelled ? 'opacity-70' : ''
                                    }`}
                                >
                                    {/* Header row */}
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-md pb-md border-b border-border-subtle gap-sm">
                                        <div>
                                            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                                                Mã Đơn
                                            </span>
                                            <h3 className="font-price-display text-price-display text-primary mt-xs">
                                                #{order.orderCode}
                                            </h3>
                                        </div>
                                        <div className="text-left md:text-right">
                                            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider block mb-xs">
                                                Ngày đặt
                                            </span>
                                            <span className="font-body-md text-body-md text-primary">
                                                {formatDate(order.createdAt)}
                                            </span>
                                        </div>
                                        <span
                                            className={`inline-flex items-center px-sm py-xs rounded-full font-label-caps text-[10px] ${statusCfg.className}`}
                                        >
                                            {statusCfg.label}
                                        </span>
                                    </div>

                                    {/* Products row */}
                                    <div className="flex justify-between items-end">
                                        <div className="flex gap-sm">
                                            {order.productImages.map((img, idx) => (
                                                <div key={idx} className="w-16 h-20 bg-surface-alt rounded overflow-hidden flex-shrink-0">
                                                    {img.imageUrl ? (
                                                        <img
                                                            alt={img.productName}
                                                            className={`w-full h-full object-cover ${isCancelled ? 'grayscale' : ''}`}
                                                            src={img.imageUrl}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-surface-container">
                                                            <span className="material-symbols-outlined text-on-surface-variant text-xl">image_not_supported</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {extraCount > 0 && (
                                                <div className="w-16 h-20 bg-surface-variant rounded flex items-center justify-center font-body-sm text-body-sm text-on-surface-variant flex-shrink-0">
                                                    +{extraCount}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-sm">
                                            <span
                                                className={`font-price-display text-price-display ${
                                                    isCancelled ? 'text-on-surface-variant line-through' : 'text-primary'
                                                }`}
                                            >
                                                {formatPrice(order.totalAmount)}
                                            </span>
                                            <Link
                                                to={`/account/orders/${order.orderCode}`}
                                                className={`font-body-sm text-body-sm underline transition-colors ${
                                                    isCancelled
                                                        ? 'text-on-surface-variant hover:text-primary'
                                                        : 'text-primary hover:text-on-surface-variant'
                                                }`}
                                            >
                                                Xem chi tiết
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {pageData && pageData.totalPages > 1 && (
                    <div className="mt-xl flex justify-center items-center gap-sm">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 0}
                            className="w-8 h-8 flex items-center justify-center border border-border-subtle rounded text-on-surface-variant hover:border-primary hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                        </button>
                        {Array.from({ length: pageData.totalPages }).map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => handlePageChange(idx)}
                                className={`w-8 h-8 flex items-center justify-center rounded border font-body-sm text-body-sm transition-colors ${
                                    currentPage === idx
                                        ? 'bg-primary text-on-primary border-primary'
                                        : 'border-border-subtle text-on-surface-variant hover:border-primary hover:text-primary'
                                  }`}
                            >
                                {idx + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === pageData.totalPages - 1}
                            className="w-8 h-8 flex items-center justify-center border border-border-subtle rounded text-on-surface-variant hover:border-primary hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
