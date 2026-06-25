import { useEffect, useRef, useState, useCallback } from 'react';
import { Chart, registerables } from 'chart.js';
import { useAuthStore } from '../../store/authStore';
import { adminReportService, downloadBlob } from '../../services/adminReport.service';
import type { RevenueReportResponse, BestsellerReportResponse, LoyaltyCustomerReportResponse } from '../../services/adminReport.service';
import { adminUserService } from '../../services/adminUser.service';
import { productService } from '../../services/product.service';

Chart.register(...registerables);

export default function AdminDashboard() {
  const user = useAuthStore((state) => state.user);

  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  // Date states - default to last 30 days
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [preset, setPreset] = useState<string>('30days');

  // Reports data states
  const [revenueReport, setRevenueReport] = useState<RevenueReportResponse[]>([]);
  const [bestsellers, setBestsellers] = useState<BestsellerReportResponse[]>([]);
  const [loyaltyCustomers, setLoyaltyCustomers] = useState<LoyaltyCustomerReportResponse[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalProducts, setTotalProducts] = useState<number>(0);

  // UX states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [exportLoading, setExportLoading] = useState<Record<string, boolean>>({
    revenue: false,
    bestsellers: false,
    loyalty: false,
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Create start & end dates in local time zone bounds
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const startIso = start.toISOString();
      const endIso = end.toISOString();

      const [revData, bestData, loyaltyData, userPage, prodPage] = await Promise.all([
        adminReportService.getRevenueReport(startIso, endIso),
        adminReportService.getBestsellerReport(startIso, endIso),
        adminReportService.getLoyaltyReport(startIso, endIso),
        adminUserService.getUsers(0, 1),
        productService.searchProducts({ size: 1 })
      ]);

      setRevenueReport(revData);
      setBestsellers(bestData);
      setLoyaltyCustomers(loyaltyData);
      setTotalUsers(userPage.totalElements);
      setTotalProducts(prodPage.totalElements);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu báo cáo.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    // Only fetch if role is admin
    if (user?.role?.toLowerCase() === 'admin') {
      fetchDashboardData();
    }
  }, [fetchDashboardData, user]);

  // Handle preset buttons
  const handlePreset = (type: '7days' | '30days' | 'thismonth') => {
    setPreset(type);
    const end = new Date();
    const start = new Date();
    if (type === '7days') {
      start.setDate(end.getDate() - 7);
    } else if (type === '30days') {
      start.setDate(end.getDate() - 30);
    } else if (type === 'thismonth') {
      start.setDate(1);
    }
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // Re-draw chart on data updates
  useEffect(() => {
    if (chartRef.current && revenueReport.length > 0) {
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        Chart.defaults.font.family = 'Inter';
        Chart.defaults.color = '#8C8C8C';

        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
        }

        // Sort chronologically by date
        const sortedReport = [...revenueReport].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const labels = sortedReport.map(item => {
          const dateObj = new Date(item.date);
          return dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        });
        const dataValues = sortedReport.map(item => item.netRevenue);

        chartInstanceRef.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Doanh thu thực tế (VNĐ)',
              data: dataValues,
              borderColor: '#1A1A2E',
              backgroundColor: 'rgba(26, 26, 46, 0.05)',
              borderWidth: 2,
              pointBackgroundColor: '#ffffff',
              pointBorderColor: '#1A1A2E',
              pointBorderWidth: 2,
              pointRadius: sortedReport.length > 30 ? 1 : 4,
              pointHoverRadius: 6,
              fill: true,
              tension: 0.4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                backgroundColor: '#1A1A2E',
                titleFont: { size: 14, family: 'Outfit' },
                bodyFont: { size: 14, family: 'Space Mono' },
                padding: 12,
                callbacks: {
                  label: function(context) {
                    let label = context.dataset.label || '';
                    if (label) {
                      label += ': ';
                    }
                    if (context.parsed.y !== null) {
                      label += new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(context.parsed.y);
                    }
                    return label;
                  }
                }
              }
            },
            scales: {
              x: {
                grid: {
                  display: false
                }
              },
              y: {
                grid: {
                  color: '#e2e3e1',
                  drawOnChartArea: true
                },
                ticks: {
                  callback: function(value) {
                    const num = Number(value);
                    if (num >= 1000000) {
                      return (num / 1000000) + 'M';
                    }
                    if (num >= 1000) {
                      return (num / 1000) + 'k';
                    }
                    return num;
                  }
                }
              }
            },
            interaction: {
              intersect: false,
              mode: 'index',
            },
          }
        });
      }
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [revenueReport]);

  // Export CSV triggers
  const handleExport = async (type: 'revenue' | 'bestsellers' | 'loyalty') => {
    try {
      setExportLoading(prev => ({ ...prev, [type]: true }));

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const startIso = start.toISOString();
      const endIso = end.toISOString();

      let blob: Blob;
      let filename: string;
      const dateRangeStr = `${startDate}_to_${endDate}`;

      if (type === 'revenue') {
        blob = await adminReportService.exportRevenueReport(startIso, endIso);
        filename = `revenue_report_${dateRangeStr}.csv`;
      } else if (type === 'bestsellers') {
        blob = await adminReportService.exportBestsellerReport(startIso, endIso);
        filename = `bestselling_products_${dateRangeStr}.csv`;
      } else {
        blob = await adminReportService.exportLoyaltyReport(startIso, endIso);
        filename = `loyalty_customers_${dateRangeStr}.csv`;
      }

      downloadBlob(blob, filename);
    } catch (err: any) {
      console.error(`Error exporting ${type} CSV:`, err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi tải báo cáo CSV.');
    } finally {
      setExportLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  // 1. Role boundary checks: STAFF users do not see financial stats.
  if (user?.role?.toLowerCase() !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-[100px] bg-surface-container-lowest border border-border-subtle rounded-lg text-center p-lg">
        <span className="material-symbols-outlined text-[64px] text-text-muted mb-md">dashboard</span>
        <h3 className="font-headline-md text-headline-md mb-xs">Chào mừng bạn trở lại, {user?.name || 'Nhân viên'}</h3>
        <p className="text-body-sm text-body-sm text-text-muted max-w-md">
          Bạn đang đăng nhập với quyền <strong>Nhân viên</strong>. Vui lòng chọn các mục quản lý sản phẩm, đơn hàng hoặc banner ở thanh điều hướng bên trái để thực hiện nhiệm vụ.
        </p>
      </div>
    );
  }

  // Calculate aggregated stats
  const totalRevenueVal = revenueReport.reduce((sum, item) => sum + item.netRevenue, 0);
  const totalOrdersVal = revenueReport.reduce((sum, item) => sum + item.totalOrders, 0);
  const totalCompletedVal = revenueReport.reduce((sum, item) => sum + item.completedOrders, 0);
  const totalCancelledVal = revenueReport.reduce((sum, item) => sum + item.cancelledOrders, 0);

  return (
    <div>
      {/* Date Filter & Export Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md mb-xl bg-surface-container-lowest p-md rounded-lg border border-border-subtle">
        <div className="flex items-center gap-sm flex-wrap w-full md:w-auto">
          <div className="flex items-center gap-xs">
            <span className="text-body-sm text-text-muted font-medium">Từ ngày:</span>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => {
                setStartDate(e.target.value);
                setPreset('');
              }}
              className="px-sm py-xs border border-border-subtle rounded-DEFAULT text-body-sm focus:outline-none focus:border-primary bg-transparent"
            />
          </div>
          <div className="flex items-center gap-xs">
            <span className="text-body-sm text-text-muted font-medium">Đến ngày:</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => {
                setEndDate(e.target.value);
                setPreset('');
              }}
              className="px-sm py-xs border border-border-subtle rounded-DEFAULT text-body-sm focus:outline-none focus:border-primary bg-transparent"
            />
          </div>
          <div className="flex gap-xs">
            <button 
              onClick={() => handlePreset('7days')} 
              className={`px-sm py-xs text-[11px] font-medium rounded border transition-colors ${
                preset === '7days' 
                  ? 'bg-primary-container text-white border-primary-container' 
                  : 'bg-white text-text-muted border-border-subtle hover:bg-surface-alt'
              }`}
            >
              7 ngày qua
            </button>
            <button 
              onClick={() => handlePreset('30days')} 
              className={`px-sm py-xs text-[11px] font-medium rounded border transition-colors ${
                preset === '30days' 
                  ? 'bg-primary-container text-white border-primary-container' 
                  : 'bg-white text-text-muted border-border-subtle hover:bg-surface-alt'
              }`}
            >
              30 ngày qua
            </button>
            <button 
              onClick={() => handlePreset('thismonth')} 
              className={`px-sm py-xs text-[11px] font-medium rounded border transition-colors ${
                preset === 'thismonth' 
                  ? 'bg-primary-container text-white border-primary-container' 
                  : 'bg-white text-text-muted border-border-subtle hover:bg-surface-alt'
              }`}
            >
              Tháng này
            </button>
          </div>
        </div>
        
        <button 
          onClick={() => setShowReportModal(true)}
          className="w-full md:w-auto font-label-caps text-label-caps text-white bg-[#1A1A2E] px-lg py-sm rounded-DEFAULT hover:opacity-90 transition-opacity flex items-center justify-center gap-xs"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
          Báo cáo chi tiết
        </button>
      </div>

      {error && (
        <div className="mb-lg p-md bg-error-container text-on-error-container rounded-lg font-body-md border border-[#ed4848]/30">
          <div className="flex items-center gap-2">
             <span className="material-symbols-outlined text-[#ed4848]">error</span>
             {error}
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg mb-xl">
        <div className="bg-surface-container-lowest p-lg rounded-lg border border-border-subtle hover:shadow-sm transition-shadow">
          <div className="flex justify-between items-start mb-md">
            <p className="font-label-caps text-label-caps text-text-muted">Doanh thu thực tế</p>
            <span className="material-symbols-outlined text-primary-container">payments</span>
          </div>
          {loading ? (
            <p className="font-headline-md text-headline-md mb-xs text-text-muted animate-pulse">...</p>
          ) : (
            <p className="font-headline-md text-headline-md mb-xs font-bold text-text-primary">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRevenueVal)}
            </p>
          )}
          <p className="font-body-sm text-body-sm text-text-muted">
            Doanh thu thực tế nhận về
          </p>
        </div>
        
        <div className="bg-surface-container-lowest p-lg rounded-lg border border-border-subtle hover:shadow-sm transition-shadow">
          <div className="flex justify-between items-start mb-md">
            <p className="font-label-caps text-label-caps text-text-muted">Tổng số đơn hàng</p>
            <span className="material-symbols-outlined text-primary-container">local_shipping</span>
          </div>
          {loading ? (
            <p className="font-headline-md text-headline-md mb-xs text-text-muted animate-pulse">...</p>
          ) : (
            <p className="font-headline-md text-headline-md mb-xs font-bold text-text-primary">
              {totalOrdersVal} đơn
            </p>
          )}
          <p className="font-body-sm text-body-sm text-text-muted">
            {totalCompletedVal} hoàn thành | {totalCancelledVal} đã hủy
          </p>
        </div>

        <div className="bg-surface-container-lowest p-lg rounded-lg border border-border-subtle hover:shadow-sm transition-shadow">
          <div className="flex justify-between items-start mb-md">
            <p className="font-label-caps text-label-caps text-text-muted">Tổng thành viên</p>
            <span className="material-symbols-outlined text-primary-container">group</span>
          </div>
          <p className="font-headline-md text-headline-md mb-xs font-bold text-text-primary">{totalUsers}</p>
          <p className="font-body-sm text-body-sm text-text-muted">Tài khoản đã đăng ký</p>
        </div>

        <div className="bg-surface-container-lowest p-lg rounded-lg border border-border-subtle hover:shadow-sm transition-shadow">
          <div className="flex justify-between items-start mb-md">
            <p className="font-label-caps text-label-caps text-text-muted">Sản phẩm đang bán</p>
            <span className="material-symbols-outlined text-primary-container">inventory</span>
          </div>
          <p className="font-headline-md text-headline-md mb-xs font-bold text-text-primary">{totalProducts}</p>
          <p className="font-body-sm text-body-sm text-text-muted">SKU có sẵn trên hệ thống</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-surface-container-lowest p-lg rounded-lg border border-border-subtle mb-xl">
        <div className="flex justify-between items-center mb-lg">
          <h3 className="font-headline-md text-headline-md font-bold">Biểu đồ doanh thu</h3>
          <span className="text-body-sm text-text-muted">
            Từ {new Date(startDate).toLocaleDateString('vi-VN')} đến {new Date(endDate).toLocaleDateString('vi-VN')}
          </span>
        </div>
        <div className="h-[300px] w-full relative flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-text-muted">
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
              <span>Đang tải biểu đồ...</span>
            </div>
          ) : revenueReport.length === 0 ? (
            <div className="text-text-muted text-body-md text-center">Không có dữ liệu doanh thu trong khoảng thời gian này.</div>
          ) : (
            <canvas ref={chartRef}></canvas>
          )}
        </div>
      </div>

      {/* Lists / Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Loyalty Customers Table */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-lg rounded-lg border border-border-subtle">
          <div className="flex justify-between items-center mb-lg">
            <h3 className="font-headline-md text-headline-md font-bold">Khách hàng thân thiết</h3>
            <span className="font-label-caps text-label-caps text-text-muted">Xếp hạng chi tiêu</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="py-md font-label-caps text-label-caps text-text-muted">Khách hàng</th>
                  <th className="py-md font-label-caps text-label-caps text-text-muted">Email</th>
                  <th className="py-md font-label-caps text-label-caps text-text-muted">Hạng</th>
                  <th className="py-md font-label-caps text-label-caps text-text-muted">Số đơn</th>
                  <th className="py-md font-label-caps text-label-caps text-text-muted">Tổng chi</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-xl text-center text-text-muted">
                      <span className="material-symbols-outlined animate-spin mb-2">progress_activity</span>
                      <p>Đang tải dữ liệu khách hàng...</p>
                    </td>
                  </tr>
                ) : loyaltyCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-md text-center text-text-muted">Không có dữ liệu khách hàng thân thiết.</td>
                  </tr>
                ) : (
                  loyaltyCustomers.map((cust) => (
                    <tr key={cust.userId} className="border-b border-surface-container hover:bg-surface-alt transition-colors">
                      <td className="py-md pr-md">
                        <div className="flex items-center gap-sm">
                          <img 
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(cust.fullName || 'User')}&background=random`} 
                            alt="avatar" 
                            className="w-8 h-8 rounded-full object-cover border border-border-subtle"
                          />
                          <span className="font-semibold text-text-primary line-clamp-1">{cust.fullName}</span>
                        </div>
                      </td>
                      <td className="py-md pr-md text-text-muted line-clamp-1">{cust.email}</td>
                      <td className="py-md">
                        <span className="inline-flex items-center px-sm py-xs rounded-full bg-secondary-container text-on-secondary-container font-label-caps text-[10px]">
                          {cust.membershipTier}
                        </span>
                      </td>
                      <td className="py-md font-price-display text-price-display">{cust.totalOrders}</td>
                      <td className="py-md font-price-display text-price-display font-bold">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cust.totalSpent)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Bestsellers */}
        <div className="bg-surface-container-lowest p-lg rounded-lg border border-border-subtle">
          <div className="flex justify-between items-center mb-lg">
            <h3 className="font-headline-md text-headline-md font-bold">Sản phẩm bán chạy</h3>
            <span className="font-label-caps text-label-caps text-text-muted">Top bán ra</span>
          </div>
          <div className="flex flex-col gap-md">
            {loading ? (
              <div className="py-xl text-center text-text-muted">
                <span className="material-symbols-outlined animate-spin mb-2">progress_activity</span>
                <p>Đang tải sản phẩm...</p>
              </div>
            ) : bestsellers.length === 0 ? (
              <p className="text-text-muted text-body-sm text-center py-md">Không có dữ liệu sản phẩm bán chạy.</p>
            ) : (
              bestsellers.slice(0, 5).map((prod) => (
                <div key={prod.productId} className="flex items-center gap-md p-sm hover:bg-surface-alt rounded-lg transition-colors border border-transparent hover:border-border-subtle">
                  <img 
                    className="w-16 h-16 object-cover rounded-DEFAULT bg-surface-alt flex-shrink-0" 
                    alt="Product" 
                    src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=100&q=80"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-body-md text-body-md text-text-primary line-clamp-1 font-semibold">{prod.productName}</p>
                    <p className="text-xs text-text-muted mt-xs">{prod.categoryName}</p>
                    <div className="flex justify-between items-center mt-xs flex-wrap gap-xs">
                      <span className="font-label-caps text-label-caps text-text-muted">{prod.totalQuantitySold} đã bán</span>
                      <span className="font-price-display text-price-display text-xs text-text-primary font-bold">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(prod.totalRevenue)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* CSV Export Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container-lowest border border-border-subtle p-lg rounded-lg shadow-xl max-w-md w-full relative mx-4">
            <button 
              onClick={() => setShowReportModal(false)}
              className="absolute top-sm right-sm text-text-muted hover:text-text-primary transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <h3 className="font-headline-md text-headline-md mb-md flex items-center gap-xs font-bold">
              <span className="material-symbols-outlined">analytics</span>
              Xuất báo cáo CSV
            </h3>
            
            <p className="text-body-sm text-text-muted mb-lg">
              Tải xuống các tệp báo cáo chi tiết định dạng CSV cho khoảng thời gian từ{' '}
              <strong className="text-text-primary">
                {new Date(startDate).toLocaleDateString('vi-VN')}
              </strong>{' '}
              đến{' '}
              <strong className="text-text-primary">
                {new Date(endDate).toLocaleDateString('vi-VN')}
              </strong>.
            </p>
            
            <div className="flex flex-col gap-sm">
              <button
                disabled={exportLoading.revenue}
                onClick={() => handleExport('revenue')}
                className="w-full text-left p-md border border-border-subtle rounded-DEFAULT hover:bg-surface-alt transition-colors flex justify-between items-center disabled:opacity-50 disabled:cursor-not-allowed group bg-transparent animate-fade-in"
              >
                <div>
                  <p className="font-body-md text-body-md font-semibold text-text-primary">Báo cáo doanh thu theo ngày</p>
                  <p className="text-xs text-text-muted">Đơn đặt, hoàn thành, hủy, chiết khấu, thực thu</p>
                </div>
                {exportLoading.revenue ? (
                  <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-text-muted group-hover:text-primary transition-colors">download</span>
                )}
              </button>

              <button
                disabled={exportLoading.bestsellers}
                onClick={() => handleExport('bestsellers')}
                className="w-full text-left p-md border border-border-subtle rounded-DEFAULT hover:bg-surface-alt transition-colors flex justify-between items-center disabled:opacity-50 disabled:cursor-not-allowed group bg-transparent"
              >
                <div>
                  <p className="font-body-md text-body-md font-semibold text-text-primary">Báo cáo sản phẩm bán chạy nhất</p>
                  <p className="text-xs text-text-muted">Số lượng bán ra, doanh thu từng sản phẩm, danh mục</p>
                </div>
                {exportLoading.bestsellers ? (
                  <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-text-muted group-hover:text-primary transition-colors">download</span>
                )}
              </button>

              <button
                disabled={exportLoading.loyalty}
                onClick={() => handleExport('loyalty')}
                className="w-full text-left p-md border border-border-subtle rounded-DEFAULT hover:bg-surface-alt transition-colors flex justify-between items-center disabled:opacity-50 disabled:cursor-not-allowed group bg-transparent"
              >
                <div>
                  <p className="font-body-md text-body-md font-semibold text-text-primary">Khách hàng thân thiết</p>
                  <p className="text-xs text-text-muted">Tên thành viên, hạng loyalty, chi tiêu, điểm tích lũy</p>
                </div>
                {exportLoading.loyalty ? (
                  <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-text-muted group-hover:text-primary transition-colors">download</span>
                )}
              </button>
            </div>
            
            <div className="mt-lg flex justify-end">
              <button 
                onClick={() => setShowReportModal(false)}
                className="font-label-caps text-label-caps border border-border-subtle px-md py-sm rounded-DEFAULT hover:bg-surface-alt transition-colors text-text-muted hover:text-text-primary bg-transparent"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
