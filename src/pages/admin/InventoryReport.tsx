import { useCallback, useEffect, useMemo, useState } from "react";
import { downloadBlob } from "../../services/adminReport.service";
import { staffService } from "../../services/staff.service";
import type {
  StaffCategoryNode,
  StaffInventoryReportItem,
  StaffInventoryReportSortBy,
  StaffInventoryReportStatus,
} from "../../services/staff.service";

export default function InventoryReport() {
  const [items, setItems] = useState<StaffInventoryReportItem[]>([]);
  const [status, setStatus] = useState<StaffInventoryReportStatus | "">("");
  const [categoryId, setCategoryId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortBy, setSortBy] = useState<StaffInventoryReportSortBy>("stockAsc");
  const [categories, setCategories] = useState<
    Array<{ id: number; name: string; selectable: boolean }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const size = 10;

  const flattenCategories = useCallback(
    (
      nodes: StaffCategoryNode[],
      prefix = "",
    ): Array<{ id: number; name: string; selectable: boolean }> => {
      return nodes.flatMap((node) => {
        const hasChildren = Boolean(node.children?.length);
        return [
          {
            id: node.id,
            name: `${prefix}${node.name}`,
            selectable: !hasChildren,
          },
          ...flattenCategories(node.children || [], `${prefix}-- `),
        ];
      });
    },
    [],
  );

  const params = useMemo(
    () => ({
      status: status || undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      keyword: keyword.trim() || undefined,
      page,
      size,
      sortBy,
    }),
    [categoryId, keyword, page, sortBy, status],
  );

  const fetchCategories = useCallback(async () => {
    try {
      const data = await staffService.getCategoryHierarchy();
      setCategories(flattenCategories(data));
    } catch (err) {
      console.error("Failed to load inventory report categories:", err);
    }
  }, [flattenCategories]);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await staffService.getInventoryReport(params);
      setItems(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Không tải được báo cáo tồn kho.",
      );
      setItems([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const timer = window.setTimeout(fetchReport, 300);
    return () => window.clearTimeout(timer);
  }, [fetchReport]);

  const resetPage = () => setPage(0);

  const statusLabel = (value: StaffInventoryReportStatus) => {
    if (value === "LOW_STOCK") return "Sắp hết hàng";
    if (value === "OUT_OF_STOCK") return "Hết hàng";
    return "Còn hàng";
  };

  const statusBadgeClass = (value: StaffInventoryReportStatus) => {
    if (value === "LOW_STOCK") return "bg-warning-container text-warning";
    if (value === "OUT_OF_STOCK") return "bg-error-container text-error";
    return "bg-success-container text-success";
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await staffService.exportInventoryReport({
        status: status || undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        keyword: keyword.trim() || undefined,
        sortBy,
      });
      downloadBlob(blob, "inventory_report.csv");
    } catch (err: any) {
      alert(err.response?.data?.message || "Không xuất được báo cáo tồn kho.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-lg">
      <div className="flex flex-col gap-md lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold">
            BM3 - Báo cáo tồn kho
          </h1>
          <p className="text-sm text-text-muted">
            Theo dõi tồn kho từng biến thể, lọc nhanh sản phẩm sắp hết hoặc hết
            hàng.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center justify-center gap-sm px-lg py-sm bg-primary text-on-primary rounded-DEFAULT font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[18px]">
            download
          </span>
          {exporting ? "Đang xuất..." : "Xuất CSV"}
        </button>
      </div>

      <div className="bg-surface-container-lowest border border-border-subtle rounded-lg p-md flex flex-col gap-md">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-md">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px] pointer-events-none">
              search
            </span>
            <input
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                resetPage();
              }}
              placeholder="Tìm SKU hoặc sản phẩm"
              className="w-full border border-border-subtle rounded-DEFAULT pl-[36px] pr-md py-sm focus:outline-none focus:border-primary"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as StaffInventoryReportStatus | "");
              resetPage();
            }}
            className="border border-border-subtle rounded-DEFAULT px-md py-sm bg-white focus:outline-none focus:border-primary"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="IN_STOCK">Còn hàng</option>
            <option value="LOW_STOCK">Sắp hết hàng</option>
            <option value="OUT_OF_STOCK">Hết hàng</option>
          </select>

          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              resetPage();
            }}
            className="border border-border-subtle rounded-DEFAULT px-md py-sm bg-white focus:outline-none focus:border-primary"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
                disabled={!category.selectable}
              >
                {category.selectable
                  ? category.name
                  : `${category.name} (chọn danh mục con)`}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as StaffInventoryReportSortBy);
              resetPage();
            }}
            className="border border-border-subtle rounded-DEFAULT px-md py-sm bg-white focus:outline-none focus:border-primary"
          >
            <option value="stockAsc">Tồn kho tăng dần</option>
            <option value="stockDesc">Tồn kho giảm dần</option>
            <option value="skuAsc">SKU A-Z</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="border border-error/30 bg-error-container text-error rounded-lg px-md py-sm text-sm">
          {error}
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-lg border border-border-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[860px]">
            <thead className="bg-surface-alt border-b border-border-subtle">
              <tr>
                <th className="p-md">Mã SP</th>
                <th className="p-md">Tên sản phẩm</th>
                <th className="p-md">Danh mục</th>
                <th className="p-md">Biến thể</th>
                <th className="p-md text-right">Tồn kho</th>
                <th className="p-md">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-lg text-center" colSpan={6}>
                    Đang tải...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="p-lg text-center text-text-muted" colSpan={6}>
                    Không có dữ liệu.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.variantId}
                    className={`border-b border-border-subtle last:border-0 ${
                      item.status === "LOW_STOCK"
                        ? "bg-warning-container/20"
                        : item.status === "OUT_OF_STOCK"
                          ? "bg-error-container/20"
                          : ""
                    }`}
                  >
                    <td className="p-md font-mono">{item.productCode}</td>
                    <td className="p-md">
                      <p className="font-semibold">{item.productName}</p>
                      <p className="text-xs text-text-muted">{item.sku}</p>
                    </td>
                    <td className="p-md text-sm text-text-muted">
                      {item.categoryName || "-"}
                    </td>
                    <td className="p-md">{item.variantInfo || "-"}</td>
                    <td className="p-md text-right font-bold">
                      {item.stockQuantity}
                    </td>
                    <td className="p-md">
                      <span
                        className={`inline-flex items-center px-sm py-xs rounded-DEFAULT text-xs font-semibold ${statusBadgeClass(item.status)}`}
                      >
                        {statusLabel(item.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalElements > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between px-lg py-md border-t border-border-subtle bg-surface-alt">
            <p className="text-sm text-text-muted">
              Hiển thị{" "}
              <span className="font-medium text-text-primary">
                {page * size + 1}
              </span>{" "}
              -{" "}
              <span className="font-medium text-text-primary">
                {Math.min((page + 1) * size, totalElements)}
              </span>{" "}
              trong{" "}
              <span className="font-medium text-text-primary">
                {totalElements}
              </span>{" "}
              biến thể
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 border border-border-subtle bg-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-container transition-colors text-sm font-medium"
              >
                Trước
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border border-border-subtle bg-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-container transition-colors text-sm font-medium"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
