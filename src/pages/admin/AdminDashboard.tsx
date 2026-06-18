import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export default function AdminDashboard() {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        // Modern Minimal Chart Styling
        Chart.defaults.font.family = 'Inter';
        Chart.defaults.color = '#8C8C8C';

        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        chartInstanceRef.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
            datasets: [{
              label: 'Doanh thu (VNĐ)',
              data: [45000000, 52000000, 48000000, 61000000, 59000000, 85000000, 72000000],
              borderColor: '#1A1A2E',
              backgroundColor: 'rgba(26, 26, 46, 0.05)',
              borderWidth: 2,
              pointBackgroundColor: '#ffffff',
              pointBorderColor: '#1A1A2E',
              pointBorderWidth: 2,
              pointRadius: 4,
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
                  display: false,
                  drawOnChartArea: false
                }
              },
              y: {
                grid: {
                  color: '#E5E5E0',
                  drawOnChartArea: true,
                  borderDash: [5, 5]
                },
                ticks: {
                  callback: function(value) {
                    return (Number(value) / 1000000) + 'M';
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
  }, []);

  return (
    <div>
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg mb-xl">
        <div className="bg-surface-container-lowest p-lg rounded-lg border border-border-subtle hover:shadow-sm transition-shadow">
          <div className="flex justify-between items-start mb-md">
            <p className="font-label-caps text-label-caps text-text-muted">Doanh thu tháng này</p>
            <span className="material-symbols-outlined text-primary-container">payments</span>
          </div>
          <p className="font-headline-md text-headline-md mb-xs">1.250.000.000₫</p>
          <p className="font-body-sm text-body-sm text-success flex items-center gap-xs">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>trending_up</span>
            +12% so với tháng trước
          </p>
        </div>
        <div className="bg-surface-container-lowest p-lg rounded-lg border border-border-subtle hover:shadow-sm transition-shadow">
          <div className="flex justify-between items-start mb-md">
            <p className="font-label-caps text-label-caps text-text-muted">Đơn hàng mới</p>
            <span className="material-symbols-outlined text-primary-container">local_shipping</span>
          </div>
          <p className="font-headline-md text-headline-md mb-xs">450 đơn</p>
          <p className="font-body-sm text-body-sm text-success flex items-center gap-xs">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>trending_up</span>
            +5%
          </p>
        </div>
        <div className="bg-surface-container-lowest p-lg rounded-lg border border-border-subtle hover:shadow-sm transition-shadow">
          <div className="flex justify-between items-start mb-md">
            <p className="font-label-caps text-label-caps text-text-muted">Khách hàng mới</p>
            <span className="material-symbols-outlined text-primary-container">person_add</span>
          </div>
          <p className="font-headline-md text-headline-md mb-xs">120</p>
          <p className="font-body-sm text-body-sm text-text-muted">thành viên</p>
        </div>
        <div className="bg-surface-container-lowest p-lg rounded-lg border border-border-subtle hover:shadow-sm transition-shadow">
          <div className="flex justify-between items-start mb-md">
            <p className="font-label-caps text-label-caps text-text-muted">Sản phẩm đang bán</p>
            <span className="material-symbols-outlined text-primary-container">inventory</span>
          </div>
          <p className="font-headline-md text-headline-md mb-xs">1.050</p>
          <p className="font-body-sm text-body-sm text-text-muted">SKU</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-surface-container-lowest p-lg rounded-lg border border-border-subtle mb-xl">
        <div className="flex justify-between items-center mb-lg">
          <h3 className="font-headline-md text-headline-md">Biểu đồ doanh thu (7 ngày qua)</h3>
          <button className="font-label-caps text-label-caps text-primary border border-primary px-md py-sm rounded-DEFAULT hover:bg-surface-alt transition-colors">Báo cáo chi tiết</button>
        </div>
        <div className="h-[300px] w-full">
          <canvas ref={chartRef}></canvas>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Orders Table */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-lg rounded-lg border border-border-subtle">
          <div className="flex justify-between items-center mb-lg">
            <h3 className="font-headline-md text-headline-md">Đơn hàng gần đây</h3>
            <a className="font-label-caps text-label-caps text-text-muted hover:text-primary transition-colors" href="#">Xem tất cả</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="py-md font-label-caps text-label-caps text-text-muted">Mã đơn</th>
                  <th className="py-md font-label-caps text-label-caps text-text-muted">Khách hàng</th>
                  <th className="py-md font-label-caps text-label-caps text-text-muted">Ngày đặt</th>
                  <th className="py-md font-label-caps text-label-caps text-text-muted">Tổng tiền</th>
                  <th className="py-md font-label-caps text-label-caps text-text-muted">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm">
                <tr className="border-b border-surface-container hover:bg-surface-alt transition-colors">
                  <td className="py-md font-price-display text-price-display">#ORD-1024</td>
                  <td className="py-md">Trần Thị B</td>
                  <td className="py-md text-text-muted">12/10/2024</td>
                  <td className="py-md font-price-display text-price-display">1.250.000₫</td>
                  <td className="py-md">
                    <span className="inline-flex items-center px-sm py-xs rounded-full bg-secondary-container text-on-secondary-container font-label-caps text-[10px]">Đang xử lý</span>
                  </td>
                </tr>
                <tr className="border-b border-surface-container hover:bg-surface-alt transition-colors">
                  <td className="py-md font-price-display text-price-display">#ORD-1023</td>
                  <td className="py-md">Lê Văn C</td>
                  <td className="py-md text-text-muted">11/10/2024</td>
                  <td className="py-md font-price-display text-price-display">3.400.000₫</td>
                  <td className="py-md">
                    <span className="inline-flex items-center px-sm py-xs rounded-full bg-[#E6F4EA] text-success font-label-caps text-[10px]">Hoàn thành</span>
                  </td>
                </tr>
                <tr className="border-b border-surface-container hover:bg-surface-alt transition-colors">
                  <td className="py-md font-price-display text-price-display">#ORD-1022</td>
                  <td className="py-md">Phạm Thị D</td>
                  <td className="py-md text-text-muted">10/10/2024</td>
                  <td className="py-md font-price-display text-price-display">850.000₫</td>
                  <td className="py-md">
                    <span className="inline-flex items-center px-sm py-xs rounded-full bg-error-container text-on-error-container font-label-caps text-[10px]">Đã hủy</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-surface-container-lowest p-lg rounded-lg border border-border-subtle">
          <div className="flex justify-between items-center mb-lg">
            <h3 className="font-headline-md text-headline-md">Sản phẩm bán chạy</h3>
          </div>
          <div className="flex flex-col gap-md">
            <div className="flex items-center gap-md p-sm hover:bg-surface-alt rounded-lg transition-colors cursor-pointer border border-transparent hover:border-border-subtle">
              <img className="w-16 h-16 object-cover rounded-DEFAULT bg-surface-alt" alt="Product" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAraF7IOEiynbja2X-EYU93Bb6kj2sHjzWitpr_nMyJTtMcmz1jdkH1w0Nic7UX9KFm5cdd87VNopIs0RIqJmwf6Q8QEnahg11AccGC_MR99uQjsXf8bozTIYKpWZSIaqvskQ1EA35n016lqJwywokQ_yO3j8FoAhmvWMTciGJnCSCptEtCkBUaG6os5EYRbCbOp4pcu0bJP5cLmj5shgLOI9OidM0Sr6xobN4RoHfjlyyRqp8ozvE9GzZqkcEfGdYqVUUPVSRXTw"/>
              <div className="flex-1">
                <p className="font-body-md text-body-md text-text-primary line-clamp-1">Áo Thun Basic Trắng</p>
                <p className="font-label-caps text-label-caps text-text-muted mt-xs">245 đã bán</p>
              </div>
            </div>
            <div className="flex items-center gap-md p-sm hover:bg-surface-alt rounded-lg transition-colors cursor-pointer border border-transparent hover:border-border-subtle">
              <img className="w-16 h-16 object-cover rounded-DEFAULT bg-surface-alt" alt="Product" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAIC56mVkNVo3HHRTHBG_DCDwEazuGCiTb-xpka2aKYkmdeezPuvbEWGDXHPwF0eLQvWsnG1x9rpJMVMeH-mcW9q6l9qyeIyfBKDclOIJ9pAFOUsb_IsKUHEoVChplmdkZ4bY5e2Rdnc8SxEgwbSsYwxOJ33e9Z3svszpN_VjFF4Iggu8i8IjAN3rFDDnOow3VWR3sr6m97_7n4rrqWFtf4F6DpKxNlswoESg_kgJjxd7nqciWflIDFA_VHMuWIDEvH9Lg0-0L5uA"/>
              <div className="flex-1">
                <p className="font-body-md text-body-md text-text-primary line-clamp-1">Quần Tây Nam Xanh Navy</p>
                <p className="font-label-caps text-label-caps text-text-muted mt-xs">180 đã bán</p>
              </div>
            </div>
            <div className="flex items-center gap-md p-sm hover:bg-surface-alt rounded-lg transition-colors cursor-pointer border border-transparent hover:border-border-subtle">
              <img className="w-16 h-16 object-cover rounded-DEFAULT bg-surface-alt" alt="Product" src="https://lh3.googleusercontent.com/aida-public/AB6AXuANgjXK7ysxRQQa3mzuSA1JDldDYvIsXLGLoT764rfSt4Nl-uoQQrt5oguqj5wVcoLvqVoM0RNzL6oW8iB1etijcnLbBdxPUGbEPcCX2yLr2nHvYL4jml13F7nKXOjYvjaMHD0vVdbeWW0hGZvqpSThaRDv9fcSFxozA6Jf6JR7-rfqF-zXHHhttCErbS_fTEmETexKkx3w-U69sB0bqu4mTlFHanwGEwytKKLF5AKgsmqx5XSNGM4XB5MvVpzkCOdEvMsHTaBH5g"/>
              <div className="flex-1">
                <p className="font-body-md text-body-md text-text-primary line-clamp-1">Thắt Lưng Da Minimal</p>
                <p className="font-label-caps text-label-caps text-text-muted mt-xs">120 đã bán</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
