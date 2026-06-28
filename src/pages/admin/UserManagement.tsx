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
  const [selectedUser, setSelectedUser] = useState<AdminUserResponse | null>(null);

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
    <div className="bg-[#FAFAF8] min-h-full p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-[#1F2421]">Quản lý người dùng</h2>
          <p className="text-sm text-[#8A8A80] mt-1">Quản lý thông tin và quyền hạn người dùng hệ thống</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 md:p-6 rounded-xl border border-[#E2D9C8] shadow-sm mb-6 flex flex-col md:flex-row flex-wrap gap-3 md:gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-[#8A8A80] mb-1.5">Tìm kiếm</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A80] text-[20px]">search</span>
            <input
              type="text"
              placeholder="Tên, email, số điện thoại..."
              className="w-full pl-10 pr-4 py-2.5 border border-[#E2D9C8] rounded-lg focus:outline-none focus:border-[#1F2421] focus:ring-2 focus:ring-[#E2D9C8] transition-all text-sm"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full md:w-auto min-w-[160px]">
          <label className="block text-xs font-medium text-[#8A8A80] mb-1.5">Vai trò</label>
          <select
            className="w-full px-4 py-2.5 border border-[#E2D9C8] rounded-lg focus:outline-none focus:border-[#1F2421] focus:ring-2 focus:ring-[#E2D9C8] transition-all text-sm bg-white"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">Tất cả vai trò</option>
            <option value="customer">Khách hàng</option>
            <option value="staff">Nhân viên</option>
            <option value="admin">Quản trị viên</option>
          </select>
        </div>
        <div className="w-full md:w-auto min-w-[160px]">
          <label className="block text-xs font-medium text-[#8A8A80] mb-1.5">Trạng thái</label>
          <select
            className="w-full px-4 py-2.5 border border-[#E2D9C8] rounded-lg focus:outline-none focus:border-[#1F2421] focus:ring-2 focus:ring-[#E2D9C8] transition-all text-sm bg-white"
            value={isActive}
            onChange={(e) => setIsActive(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Hoạt động</option>
            <option value="false">Đã khóa</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-[#FEF2F2] text-[#991B1B] rounded-xl font-body-md border border-[#FCA5A5]">
          <div className="flex items-center gap-2">
             <span className="material-symbols-outlined text-[20px]">error</span>
             {error}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E2D9C8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F6F1E8] border-b border-[#E2D9C8]">
              <tr>
                <th className="py-4 px-4 md:px-6 font-semibold text-xs uppercase tracking-wider text-[#8A8A80]">Người dùng</th>
                <th className="py-4 px-4 md:px-6 font-semibold text-xs uppercase tracking-wider text-[#8A8A80]">Liên hệ</th>
                <th className="py-4 px-4 md:px-6 font-semibold text-xs uppercase tracking-wider text-[#8A8A80]">Hạng / Vai trò</th>
                <th className="py-4 px-4 md:px-6 font-semibold text-xs uppercase tracking-wider text-[#8A8A80] text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2D9C8]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                     <span className="material-symbols-outlined animate-spin text-[#C8853F] text-4xl mb-3 inline-block">progress_activity</span>
                     <p className="text-[#8A8A80]">Đang tải dữ liệu...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-[#8A8A80]">Không tìm thấy người dùng nào.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-[#FBF7EF] transition-colors cursor-pointer"
                    onClick={() => setSelectedUser(user)}
                  >
                    <td className="py-4 px-4 md:px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.fullName || 'User') + '&background=C8853F&color=fff'}
                          alt="avatar"
                          className="w-11 h-11 rounded-full object-cover border-2 border-[#E2D9C8] shadow-sm"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1F2421] truncate">{user.fullName}</p>
                          <p className="text-[#8A8A80] text-xs mt-0.5">
                            ID: {user.id} · {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '-'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 md:px-6">
                      <p className="text-sm text-[#1F2421] truncate max-w-[200px]">{user.email}</p>
                      {user.phone && <p className="text-[#8A8A80] text-xs mt-1">{user.phone}</p>}
                    </td>
                    <td className="py-4 px-4 md:px-6">
                      <div className="flex flex-col gap-2">
                        {user.membershipTierName ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#C8853F] text-white text-[10px] font-semibold uppercase tracking-wide w-fit">
                            {user.membershipTierName}
                          </span>
                        ) : <span className="text-[#8A8A80] text-xs">-</span>}
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <select
                            disabled={user.id === currentUser?.id}
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                            className="appearance-none bg-white border border-[#E2D9C8] rounded-lg pl-3 pr-8 py-1.5 text-xs font-medium focus:outline-none focus:border-[#1F2421] focus:ring-2 focus:ring-[#E2D9C8] cursor-pointer hover:bg-[#FBF7EF] disabled:opacity-50 disabled:cursor-not-allowed w-full transition-all"
                          >
                            <option value="customer">Customer</option>
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                          </select>
                          <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[#8A8A80] text-[16px] pointer-events-none">
                            expand_more
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 md:px-6 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        disabled={user.id === currentUser?.id}
                        onClick={() => handleStatusChange(user.id, user.isActive)}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all border-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-sm hover:shadow-md ${
                          user.isActive
                            ? 'bg-[#E6F4EA] text-[#137333] border-[#A8DAB5] hover:bg-[#CEEAD6]'
                            : 'bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5] hover:bg-[#FEE2E2]'
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
          <div className="flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-4 border-t border-[#E2D9C8] bg-[#F6F1E8] gap-3">
            <p className="text-sm text-[#8A8A80]">
              Hiển thị <span className="font-semibold text-[#1F2421]">{page * size + 1}</span> - <span className="font-semibold text-[#1F2421]">{Math.min((page + 1) * size, pagination.totalElements)}</span> trong <span className="font-semibold text-[#1F2421]">{pagination.totalElements}</span> người dùng
            </p>
            <div className="flex gap-2">
              <button
                disabled={pagination.first}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 border-2 border-[#E2D9C8] bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FBF7EF] hover:border-[#C8853F] transition-all text-sm font-semibold text-[#1F2421] shadow-sm"
              >
                ← Trước
              </button>
              <button
                disabled={pagination.last}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 border-2 border-[#E2D9C8] bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FBF7EF] hover:border-[#C8853F] transition-all text-sm font-semibold text-[#1F2421] shadow-sm"
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#2A2723] to-[#1F2421] px-6 py-5 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#C8853F] text-2xl">person</span>
                <h3 className="text-xl font-bold text-white">Thông tin người dùng</h3>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Avatar & Basic Info */}
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pb-6 border-b border-[#E2D9C8]">
                <img
                  src={selectedUser.avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(selectedUser.fullName || 'User') + '&background=C8853F&color=fff&size=200'}
                  alt="avatar"
                  className="w-24 h-24 rounded-full object-cover border-4 border-[#E2D9C8] shadow-lg"
                />
                <div className="flex-1 text-center md:text-left">
                  <h4 className="text-2xl font-bold text-[#1F2421] mb-2">{selectedUser.fullName}</h4>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-3">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      selectedUser.isActive
                        ? 'bg-[#E6F4EA] text-[#137333]'
                        : 'bg-[#FEF2F2] text-[#991B1B]'
                    }`}>
                      {selectedUser.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                    </span>
                    <span className="px-3 py-1.5 rounded-lg bg-[#F0E3D0] text-[#A86B2C] text-xs font-semibold uppercase">
                      {selectedUser.role}
                    </span>
                    {selectedUser.membershipTierName && (
                      <span className="px-3 py-1.5 rounded-lg bg-[#FBF7EF] border border-[#E2D9C8] text-[#1F2421] text-xs font-semibold">
                        {selectedUser.membershipTierName}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#8A8A80]">ID: {selectedUser.id}</p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h5 className="text-lg font-bold text-[#1F2421] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#C8853F]">contact_mail</span>
                  Thông tin liên hệ
                </h5>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-[#FBF7EF] p-4 rounded-xl border border-[#E2D9C8]">
                    <p className="text-xs text-[#8A8A80] mb-1 font-medium uppercase tracking-wide">Email</p>
                    <p className="text-sm text-[#1F2421] font-semibold break-all">{selectedUser.email}</p>
                  </div>
                  <div className="bg-[#FBF7EF] p-4 rounded-xl border border-[#E2D9C8]">
                    <p className="text-xs text-[#8A8A80] mb-1 font-medium uppercase tracking-wide">Số điện thoại</p>
                    <p className="text-sm text-[#1F2421] font-semibold">{selectedUser.phone || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Account Details */}
              <div className="space-y-4">
                <h5 className="text-lg font-bold text-[#1F2421] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#C8853F]">info</span>
                  Chi tiết tài khoản
                </h5>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-[#FBF7EF] p-4 rounded-xl border border-[#E2D9C8]">
                    <p className="text-xs text-[#8A8A80] mb-1 font-medium uppercase tracking-wide">Ngày tạo</p>
                    <p className="text-sm text-[#1F2421] font-semibold">
                      {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString('vi-VN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '-'}
                    </p>
                  </div>
                  <div className="bg-[#FBF7EF] p-4 rounded-xl border border-[#E2D9C8]">
                    <p className="text-xs text-[#8A8A80] mb-1 font-medium uppercase tracking-wide">Cập nhật lần cuối</p>
                    <p className="text-sm text-[#1F2421] font-semibold">
                      {selectedUser.updatedAt ? new Date(selectedUser.updatedAt).toLocaleString('vi-VN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-[#F6F1E8] px-6 py-4 flex justify-end gap-3 rounded-b-2xl border-t border-[#E2D9C8]">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-5 py-2.5 bg-white border-2 border-[#E2D9C8] text-[#1F2421] rounded-lg font-semibold hover:bg-[#FBF7EF] transition-all shadow-sm"
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
