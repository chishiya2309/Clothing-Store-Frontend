import { useEffect, useState, useCallback } from 'react';
import { adminUserService } from '../../services/adminUser.service';
import type { AdminUserResponse } from '../../services/adminUser.service';

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<AdminUserResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filters
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string>(''); // 'true' | 'false' | ''
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const size = 10;

  // Details modal
  const [selectedCustomer, setSelectedCustomer] = useState<AdminUserResponse | null>(null);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const isActiveParam = status === '' ? undefined : status === 'true';
      
      const data = await adminUserService.getUsers(
        page,
        size,
        keyword || undefined,
        'customer', // filter only users with customer role
        isActiveParam
      );
      
      setCustomers(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi khi tải danh sách khách hàng.');
    } finally {
      setLoading(false);
    }
  }, [keyword, status, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 450);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  const handleStatusChange = async (id: number, currentStatus: boolean) => {
    const actionText = currentStatus ? 'khóa' : 'mở khóa';
    if (!window.confirm(`Bạn có chắc muốn ${actionText} tài khoản này?`)) return;
    try {
      await adminUserService.updateUserStatus(id, !currentStatus);
      setCustomers(prev => prev.map(u => u.id === id ? { ...u, isActive: !currentStatus } : u));
      if (selectedCustomer && selectedCustomer.id === id) {
        setSelectedCustomer(prev => prev ? { ...prev, isActive: !currentStatus } : null);
      }
      alert(`Đã ${actionText} tài khoản khách hàng thành công.`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái.');
    }
  };

  const getMembershipTierBadge = (tier: string | null) => {
    if (!tier) return <span className="text-text-muted">-</span>;
    switch (tier.toLowerCase()) {
      case 'đồng':
      case 'bronze':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FAFAF8] text-[#8C8C8C] border border-border-subtle">Hạng Đồng</span>;
      case 'bạc':
      case 'silver':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EBF3FC] text-[#1B72E8] border border-[#cbe1fb]">Hạng Bạc</span>;
      case 'vàng':
      case 'gold':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FFF9E6] text-warning border border-[#ffeebf]">Hạng Vàng</span>;
      case 'kim cương':
      case 'diamond':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F3EBF9] text-[#8E24AA] border border-[#ebd2f7]">Hạng Kim Cương</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary-container text-on-secondary-container">{tier}</span>;
    }
  };

  return (
    <div className="bg-[#FAFAF8] min-h-full font-body-sm text-body-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-md">
        <h2 className="font-headline-lg text-headline-lg font-bold">Quản lý khách hàng</h2>
      </div>

      {/* Filters */}
      <div className="bg-surface-container-lowest p-md rounded-lg border border-border-subtle mb-md flex flex-wrap gap-md">
        <div className="flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder="Tìm theo tên, email, số điện thoại..."
            className="w-full px-md py-sm border border-border-subtle rounded-DEFAULT focus:outline-none focus:border-primary transition-colors text-xs"
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
          />
        </div>
        <select
          className="px-md py-sm border border-border-subtle rounded-DEFAULT focus:outline-none focus:border-primary transition-colors text-xs"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(0); }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="true">Đang hoạt động</option>
          <option value="false">Đã khóa</option>
        </select>
      </div>

      {error && (
        <div className="mb-lg p-md bg-error-container text-on-error-container rounded-lg border border-[#ed4848]/30 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#ed4848]">error</span>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-lg border border-border-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-alt border-b border-border-subtle">
              <tr>
                <th className="py-md px-lg font-label-caps text-label-caps text-text-muted">Khách hàng</th>
                <th className="py-md px-lg font-label-caps text-label-caps text-text-muted">Liên hệ</th>
                <th className="py-md px-lg font-label-caps text-label-caps text-text-muted">Hạng / Điểm</th>
                <th className="py-md px-lg font-label-caps text-label-caps text-text-muted text-center whitespace-nowrap">Trạng thái</th>
                <th className="py-md px-lg font-label-caps text-label-caps text-text-muted text-center whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-xl text-center text-text-muted">
                    <span className="material-symbols-outlined animate-spin mb-2 text-primary">progress_activity</span>
                    <p>Đang tải dữ liệu khách hàng...</p>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-xl text-center text-text-muted">Không tìm thấy khách hàng nào.</td>
                </tr>
              ) : (
                customers.map((cust) => (
                  <tr key={cust.id} className="border-b border-surface-container hover:bg-surface-alt transition-colors">
                    <td className="py-md px-lg whitespace-nowrap">
                      <div className="flex items-center gap-sm">
                        <img
                          src={cust.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(cust.fullName || 'C')}&background=random`}
                          className="w-10 h-10 rounded-full object-cover border border-border-subtle"
                          alt=""
                        />
                        <div>
                          <p className="font-medium text-text-primary">{cust.fullName}</p>
                          <p className="text-text-muted text-[10px] font-mono">
                            ID: {cust.id} · {cust.createdAt ? new Date(cust.createdAt).toLocaleDateString('vi-VN') : '-'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-md px-lg">
                      <p className="font-medium">{cust.email}</p>
                      {cust.phone && <p className="text-text-muted text-xs font-mono">{cust.phone}</p>}
                    </td>
                    <td className="py-md px-lg">
                      <div className="flex flex-col gap-[3px]">
                        {getMembershipTierBadge(cust.membershipTierName)}
                        <span className="font-mono font-semibold text-primary text-xs">{cust.loyaltyPoints?.toLocaleString('vi-VN') ?? 0} điểm</span>
                      </div>
                    </td>
                    <td className="py-md px-lg text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium border whitespace-nowrap ${
                        cust.isActive
                          ? 'bg-[#E6F4EA] text-success border-[#bce4c6]'
                          : 'bg-error-container text-on-error-container border-[#fcd8d8]'
                      }`}>
                        {cust.isActive ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="py-md px-lg text-center whitespace-nowrap">
                      <div className="flex justify-center gap-sm whitespace-nowrap">
                        <button
                          onClick={() => setSelectedCustomer(cust)}
                          className="px-2 py-1 border border-primary text-primary hover:bg-[#1A1A2E] hover:text-white hover:border-[#1A1A2E] transition-colors text-xs font-semibold whitespace-nowrap"
                        >
                          Chi tiết
                        </button>
                        <button
                          onClick={() => handleStatusChange(cust.id, cust.isActive)}
                          className={`px-2 py-1 border text-xs font-semibold transition-colors whitespace-nowrap ${
                            cust.isActive
                              ? 'border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ba1a1a] hover:text-white'
                              : 'border-success text-success hover:bg-success hover:text-white'
                          }`}
                        >
                          {cust.isActive ? 'Khóa' : 'Mở khóa'}
                        </button>
                      </div>
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
              Hiển thị <span className="font-medium text-text-primary">{page * size + 1}</span> - <span className="font-medium text-text-primary">{Math.min((page + 1) * size, totalElements)}</span> trong <span className="font-medium text-text-primary">{totalElements}</span> khách hàng
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

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs">
          <div className="bg-white rounded-lg border border-border-subtle w-full max-w-lg p-lg shadow-2xl flex flex-col max-h-[90vh]">
            {/* Title */}
            <div className="flex justify-between items-center border-b border-border-subtle pb-sm mb-md">
              <h3 className="font-headline-md text-headline-md font-bold text-[#1A1A2E]">Hồ sơ khách hàng</h3>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex-1 overflow-y-auto space-y-md pr-xs">
              <div className="flex items-center gap-md bg-[#FAFAF8] p-sm border border-border-subtle rounded-lg mb-sm">
                <img
                  src={selectedCustomer.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCustomer.fullName || 'C')}&background=random`}
                  className="w-16 h-16 rounded-full object-cover border border-primary"
                  alt=""
                />
                <div>
                  <h4 className="font-bold text-text-primary text-base">{selectedCustomer.fullName}</h4>
                  <div className="flex gap-sm items-center mt-xs">
                    {getMembershipTierBadge(selectedCustomer.membershipTierName)}
                    <span className="text-xs font-mono font-medium text-text-muted">ID: {selectedCustomer.id}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-sm">
                <div>
                  <p className="text-xs text-text-muted uppercase font-label-caps">Email</p>
                  <p className="font-medium text-text-primary truncate">{selectedCustomer.email}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase font-label-caps">Số điện thoại</p>
                  <p className="font-medium text-text-primary font-mono">{selectedCustomer.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase font-label-caps">Giới tính</p>
                  <p className="font-medium text-text-primary capitalize">{selectedCustomer.gender === 'male' ? 'Nam' : selectedCustomer.gender === 'female' ? 'Nữ' : 'Khác'}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase font-label-caps">Ngày sinh</p>
                  <p className="font-medium text-text-primary font-mono">{selectedCustomer.dateOfBirth ? new Date(selectedCustomer.dateOfBirth).toLocaleDateString('vi-VN') : '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase font-label-caps">Điểm tích lũy</p>
                  <p className="font-medium text-primary font-mono font-bold">{selectedCustomer.loyaltyPoints?.toLocaleString('vi-VN') ?? 0} điểm</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase font-label-caps">Ngày tham gia</p>
                  <p className="font-medium text-text-primary font-mono">{selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString('vi-VN') : '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase font-label-caps">Xác thực email</p>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    selectedCustomer.emailVerified ? 'bg-success/15 text-success' : 'bg-error-container text-on-error-container'
                  }`}>
                    {selectedCustomer.emailVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase font-label-caps">Cổng đăng nhập</p>
                  <span className="text-xs font-semibold capitalize bg-[#F0EDE8] px-sm py-[2px] rounded-DEFAULT">
                    {selectedCustomer.authProvider}
                  </span>
                </div>
              </div>

              {/* Status Section */}
              <div className="border-t border-border-subtle pt-sm mt-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-muted uppercase font-label-caps mb-[2px]">Trạng thái tài khóa</p>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                    selectedCustomer.isActive ? 'bg-[#E6F4EA] text-success border-[#bce4c6]' : 'bg-error-container text-on-error-container border-[#fcd8d8]'
                  }`}>
                    {selectedCustomer.isActive ? 'Hoạt động' : 'Tài khoản đã khóa'}
                  </span>
                </div>
                <button
                  onClick={() => handleStatusChange(selectedCustomer.id, selectedCustomer.isActive)}
                  className={`px-md py-xs border text-xs font-semibold transition-colors ${
                    selectedCustomer.isActive
                      ? 'border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ba1a1a] hover:text-white'
                      : 'border-success text-success hover:bg-success hover:text-white'
                  }`}
                >
                  {selectedCustomer.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                </button>
              </div>

              {selectedCustomer.lastLoginAt && (
                <div className="text-right text-[10px] text-text-muted pt-xs">
                  Đăng nhập gần nhất: {new Date(selectedCustomer.lastLoginAt).toLocaleString('vi-VN')}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border-subtle pt-sm mt-md flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-xl py-sm bg-[#e2e3e1] text-text-primary hover:bg-[#d5d6d4] transition-colors font-semibold text-xs"
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
