import { useEffect, useState } from 'react';
import { staffService } from '../../services/staff.service';
import type { StaffInventoryReportItem } from '../../services/staff.service';

export default function InventoryReport() {
  const [items, setItems] = useState<StaffInventoryReportItem[]>([]);
  const [status, setStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await staffService.getInventoryReport({
        status: status || undefined,
        keyword: keyword || undefined,
        page: 0,
        size: 100,
        sortBy: 'stockQuantity',
      });
      setItems(data.content || []);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không tải được báo cáo tồn kho.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchReport, 300);
    return () => clearTimeout(timer);
  }, [status, keyword]);

  const statusLabel = (value: string) => {
    if (value === 'LOW_STOCK') return 'Sắp hết hàng';
    if (value === 'OUT_OF_STOCK') return 'Hết hàng';
    return 'Còn hàng';
  };

  const exportUrl = staffService.exportInventoryReportUrl({
    status: status || undefined,
    keyword: keyword || undefined,
    sortBy: 'stockQuantity',
  });

  return (
    <div className="space-y-lg">
      <div className="flex items-center justify-between gap-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold">BM3 - Báo cáo tồn kho</h1>
          <p className="text-sm text-text-muted">Cảnh báo biến thể có tồn kho dưới 10 hoặc hết hàng.</p>
        </div>
        <a href={exportUrl} className="px-lg py-sm bg-primary text-on-primary rounded-DEFAULT font-semibold">Xuất CSV</a>
      </div>

      <div className="bg-surface-container-lowest border border-border-subtle rounded-lg p-md flex flex-wrap gap-md">
        <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm mã SKU / sản phẩm" className="border rounded px-md py-sm min-w-72" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded px-md py-sm">
          <option value="">Tất cả trạng thái</option>
          <option value="IN_STOCK">Còn hàng</option>
          <option value="LOW_STOCK">Sắp hết hàng</option>
          <option value="OUT_OF_STOCK">Hết hàng</option>
        </select>
      </div>

      <div className="bg-surface-container-lowest border border-border-subtle rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-surface-alt border-b border-border-subtle">
            <tr>
              <th className="p-md">Mã SP</th>
              <th className="p-md">Tên sản phẩm</th>
              <th className="p-md">Biến thể</th>
              <th className="p-md">Tồn kho</th>
              <th className="p-md">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-lg text-center" colSpan={5}>Đang tải...</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="p-lg text-center text-text-muted" colSpan={5}>Không có dữ liệu.</td></tr>
            ) : items.map((item) => (
              <tr key={item.variantId} className={`border-b border-border-subtle last:border-0 ${item.status === 'LOW_STOCK' ? 'bg-warning-container/30' : item.status === 'OUT_OF_STOCK' ? 'bg-error-container/30' : ''}`}>
                <td className="p-md font-mono">{item.productId}</td>
                <td className="p-md">
                  <p className="font-semibold">{item.productName}</p>
                  <p className="text-xs text-text-muted">{item.sku}</p>
                </td>
                <td className="p-md">{item.size} / {item.color}</td>
                <td className="p-md font-bold">{item.stockQuantity}</td>
                <td className="p-md">{statusLabel(item.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
