import { useEffect, useState, useCallback } from 'react';
import { adminReportService, downloadBlob } from '../../services/adminReport.service';
import type { BestsellerReportResponse } from '../../services/adminReport.service';

export default function BestsellersReport() {
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

  const [items, setItems] = useState<BestsellerReportResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      // Create start & end dates in local time bounds
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const data = await adminReportService.getBestsellerReport(start.toISOString(), end.toISOString());
      setItems(data || []);
    } catch (err: any) {
      console.error('Error fetching bestseller report:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

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

  const handleExport = async () => {
    try {
      setExportLoading(true);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const blob = await adminReportService.exportBestsellerReport(start.toISOString(), end.toISOString());
      downloadBlob(blob, `san_pham_ban_chay_${startDate}_den_${endDate}.csv`);
    } catch (err) {
      console.error('Failed to export bestseller report:', err);
      alert('Không xuất được báo cáo CSV.');
    } finally {
      setExportLoading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-400 text-white font-bold flex items-center justify-center text-xs shadow-sm">
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-700 font-bold flex items-center justify-center text-xs shadow-sm">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
          3
        </span>
      );
    }
    return <span className="w-6 h-6 text-text-muted font-medium flex items-center justify-center text-xs">{rank}</span>;
  };

  return (
    <div className="space-y-lg">
      <div className="flex items-center justify-between gap-md flex-wrap">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold">BM2 - Báo cáo sản phẩm bán chạy</h1>
          <p className="text-sm text-text-muted">Xem thống kê và xếp hạng sản phẩm bán chạy nhất trong khoảng thời gian xác định.</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exportLoading}
          className="px-lg py-sm bg-primary hover:bg-primary-hover disabled:opacity-50 text-on-primary rounded-DEFAULT font-semibold text-sm transition-colors flex items-center gap-xs cursor-pointer select-none"
        >
          {exportLoading ? (
            <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-sm">download</span>
          )}
          Xuất báo cáo CSV
        </button>
      </div>

      {/* Date Pickers and Presets */}
      <div className="bg-surface-container-lowest border border-border-subtle rounded-lg p-md flex flex-wrap items-center justify-between gap-md">
        <div className="flex flex-wrap items-center gap-sm">
          <button
            onClick={() => handlePreset('7days')}
            className={`px-md py-sm border text-xs font-semibold rounded-DEFAULT transition-all cursor-pointer ${
              preset === '7days' ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]' : 'bg-transparent text-text-primary border-border-subtle hover:bg-surface-alt'
            }`}
          >
            7 ngày gần đây
          </button>
          <button
            onClick={() => handlePreset('30days')}
            className={`px-md py-sm border text-xs font-semibold rounded-DEFAULT transition-all cursor-pointer ${
              preset === '30days' ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]' : 'bg-transparent text-text-primary border-border-subtle hover:bg-surface-alt'
            }`}
          >
            30 ngày gần đây
          </button>
          <button
            onClick={() => handlePreset('thismonth')}
            className={`px-md py-sm border text-xs font-semibold rounded-DEFAULT transition-all cursor-pointer ${
              preset === 'thismonth' ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]' : 'bg-transparent text-text-primary border-border-subtle hover:bg-surface-alt'
            }`}
          >
            Tháng này
          </button>
        </div>

        <div className="flex items-center gap-sm">
          <div className="flex items-center gap-xs">
            <span className="text-xs text-text-muted">Từ:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPreset('');
              }}
              className="border border-border-subtle rounded-DEFAULT px-sm py-[6px] text-xs focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-xs">
            <span className="text-xs text-text-muted">Đến:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPreset('');
              }}
              className="border border-border-subtle rounded-DEFAULT px-sm py-[6px] text-xs focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-surface-container-lowest border border-border-subtle rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-surface-alt border-b border-border-subtle">
            <tr>
              <th className="px-md py-sm text-xs font-semibold text-text-muted uppercase tracking-wide w-16 text-center">Hạng</th>
              <th className="px-md py-sm text-xs font-semibold text-text-muted uppercase tracking-wide">Sản phẩm</th>
              <th className="px-md py-sm text-xs font-semibold text-text-muted uppercase tracking-wide">Danh mục</th>
              <th className="px-md py-sm text-xs font-semibold text-text-muted uppercase tracking-wide text-right">Số lượng đã bán</th>
              <th className="px-md py-sm text-xs font-semibold text-text-muted uppercase tracking-wide text-right">Tổng doanh thu</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-xl text-center text-text-muted" colSpan={5}>
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Đang tải...
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="p-xl text-center text-text-muted" colSpan={5}>
                  <span className="material-symbols-outlined text-4xl block mb-2 opacity-40">trending_down</span>
                  Không có dữ liệu sản phẩm bán chạy.
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr
                  key={item.productId}
                  className="border-b border-border-subtle last:border-0 align-middle hover:bg-surface-alt/40 transition-colors"
                >
                  <td className="px-md py-sm text-center">
                    <div className="flex items-center justify-center">{getRankBadge(index + 1)}</div>
                  </td>
                  <td className="px-md py-sm">
                    <div className="flex items-center gap-md">
                      <img
                        className="w-10 h-10 object-cover rounded-DEFAULT bg-surface-alt flex-shrink-0 border border-border-subtle"
                        alt="Product"
                        src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=80&q=80"
                      />
                      <div>
                        <p className="font-semibold text-sm text-text-primary">{item.productName}</p>
                        <p className="text-xs text-text-muted">ID: #{item.productId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-md py-sm">
                    <span className="text-sm font-medium text-text-secondary">{item.categoryName}</span>
                  </td>
                  <td className="px-md py-sm text-right font-mono text-sm font-semibold text-text-primary">
                    {item.totalQuantitySold}
                  </td>
                  <td className="px-md py-sm text-right font-semibold font-mono text-sm text-text-primary">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.totalRevenue)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
