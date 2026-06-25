import { useEffect, useState, useCallback } from 'react';
import { adminUserService } from '../../services/adminUser.service';
import type { AdminUserResponse, PaginatedResponse } from '../../services/adminUser.service';
import { useAuthStore } from '../../store/authStore';

export default function UserManagement() {
  const currentUser = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<any> | null>(null);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Debounce search
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminUserService.getUsers(
        page, 
        size, 
        keyword || undefined, 
        role || undefined, 
        isActive === '' ? undefined : isActive === 'true'
      );
      setUsers(data.content);
      setPagination(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  }, [page, size, keyword, role, isActive]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleStatusChange = async (id: number, currentStatus: boolean) => {
    try {
      await adminUserService.updateUserStatus(id, !currentStatus);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: !currentStatus } : u));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái.');
    }
  };

  const handleRoleChange = async (id: number, newRole: 'customer' | 'staff' | 'admin') => {
    try {
      await adminUserService.updateUserRole(id, newRole);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi cập nhật quyền.');
    }
  };

  return (
    <div className="bg-[#FAFAF8] min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-xl">
        <h2 className="font-headline-lg text-headline-lg font-bold">Quản lý người dùng</h2>
      </div>

      {/* Filters */}
      <div className="bg-surface-container-lowest p-lg rounded-lg border border-border-subtle mb-xl flex flex-wrap gap-md">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Tìm theo tên, email, sđt..."
            className="w-full px-md py-sm border border-border-subtle rounded-DEFAULT focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <select
          className="px-md py-sm border border-border-subtle rounded-DEFAULT focus:outline-none focus:border-primary transition-colors"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">Tất cả vai trò</option>
          <option value="customer">Khách hàng (Customer)</option>
          <option value="staff">Nhân viên (Staff)</option>
          <option value="admin">Quản trị viên (Admin)</option>
        </select>
        <select
          className="px-md py-sm border border-border-subtle rounded-DEFAULT focus:outline-none focus:border-primary transition-colors"
          value={isActive}
          onChange={(e) => setIsActive(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="true">Hoạt động</option>
          <option value="false">Đã khóa</option>
        </select>
      </div>

      {error && (
        <div className="mb-lg p-md bg-error-container text-on-error-container rounded-lg font-body-md border border-[#ed4848]/30">
          <div className="flex items-center gap-2">
             <span className="material-symbols-outlined text-[#ed4848]">error</span>
             {error}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-lg border border-border-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-alt border-b border-border-subtle">
              <tr>
                <th className="py-md px-lg font-label-caps text-label-caps text-text-muted">Người dùng</th>
                <th className="py-md px-lg font-label-caps text-label-caps text-text-muted">Liên hệ</th>
                <th className="py-md px-lg font-label-caps text-label-caps text-text-muted">Hạng / Vai trò</th>
                <th className="py-md px-lg font-label-caps text-label-caps text-text-muted text-center whitespace-nowrap">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-xl text-center text-text-muted">
                     <span className="material-symbols-outlined animate-spin mb-2">progress_activity</span>
                     <p>Đang tải dữ liệu...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-xl text-center text-text-muted">Không tìm thấy người dùng nào.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-surface-container hover:bg-surface-alt transition-colors">
                    <td className="py-md px-lg">
                      <div className="flex items-center gap-sm">
                        <img 
                          src={user.avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.fullName || 'User') + '&background=random'} 
                          alt="avatar" 
                          className="w-10 h-10 rounded-full object-cover border border-border-subtle" 
                        />
                        <div>
                          <p className="font-medium text-text-primary line-clamp-1">{user.fullName}</p>
                          <p className="text-text-muted text-[10px]">
                            ID: {user.id} · {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '-'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-md px-lg">
                      <p className="line-clamp-1">{user.email}</p>
                      {user.phone && <p className="text-text-muted text-xs">{user.phone}</p>}
                    </td>
                    <td className="py-md px-lg">
                      <div className="flex flex-col gap-[3px]">
                        {user.membershipTierName ? (
                          <span className="inline-flex items-center px-sm py-xs rounded-full bg-secondary-container text-on-secondary-container font-label-caps text-[10px] whitespace-nowrap">
                            {user.membershipTierName}
                          </span>
                        ) : <span className="text-text-muted text-xs">-</span>}
                        <select
                          disabled={user.id === currentUser?.id}
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                          className="bg-transparent border border-border-subtle rounded px-2 py-1 text-xs focus:outline-none focus:border-primary cursor-pointer hover:bg-surface-alt disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap w-fit"
                        >
                          <option value="customer">Customer</option>
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </td>
                    <td className="py-md px-lg text-center whitespace-nowrap">
                      <button
                        disabled={user.id === currentUser?.id}
                        onClick={() => handleStatusChange(user.id, user.isActive)}
                        className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${
                          user.isActive 
                            ? 'bg-[#E6F4EA] text-success border-[#bce4c6] hover:bg-[#d4ebd9]' 
                            : 'bg-error-container text-on-error-container border-[#fcd8d8] hover:bg-[#fbdada]'
                        }`}
                      >
                        {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-lg py-md border-t border-border-subtle bg-surface-alt">
            <p className="text-sm text-text-muted">
              Hiển thị <span className="font-medium text-text-primary">{page * size + 1}</span> - <span className="font-medium text-text-primary">{Math.min((page + 1) * size, pagination.totalElements)}</span> trong <span className="font-medium text-text-primary">{pagination.totalElements}</span>
            </p>
            <div className="flex gap-2">
              <button
                disabled={pagination.first}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 border border-border-subtle bg-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-container transition-colors text-sm font-medium"
              >
                Trước
              </button>
              <button
                disabled={pagination.last}
                onClick={() => setPage(p => p + 1)}
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
