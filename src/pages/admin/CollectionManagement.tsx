import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffService } from '../../services/staff.service';
import type { StaffCollectionResponse } from '../../services/staff.service';
import { useToast } from '../../components/ui/ToastProvider';
import { useConfirm } from '../../components/ui/ConfirmProvider';

export default function CollectionManagement() {
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [collections, setCollections] = useState<StaffCollectionResponse[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    bannerUrl: '',
    startDate: '',
    endDate: '',
    isActive: true,
  });

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const data = await staffService.getCollections({ page: 0, size: 50, keyword: keyword || undefined });
      setCollections(data.content || data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không tải được danh sách bộ sưu tập.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchCollections, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', slug: '', description: '', bannerUrl: '', startDate: '', endDate: '', isActive: true });
    setShowModal(true);
  };

  const openEdit = (collection: StaffCollectionResponse) => {
    setEditingId(collection.id);
    setForm({
      name: collection.name || '',
      slug: collection.slug || '',
      description: collection.description || '',
      bannerUrl: collection.bannerUrl || '',
      startDate: collection.startDate ? collection.startDate.slice(0, 16) : '',
      endDate: collection.endDate ? collection.endDate.slice(0, 16) : '',
      isActive: collection.isActive,
    });
    setShowModal(true);
  };

  const toOffsetDate = (value: string) => value ? new Date(value).toISOString() : null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      ...form,
      slug: form.slug || undefined,
      startDate: toOffsetDate(form.startDate),
      endDate: toOffsetDate(form.endDate),
    };

    try {
      if (editingId) {
        await staffService.updateCollection(editingId, payload);
        toast.success('Cập nhật bộ sưu tập thành công');
      } else {
        await staffService.createCollection(payload);
        toast.success('Tạo bộ sưu tập thành công');
      }
      setShowModal(false);
      fetchCollections();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không lưu được bộ sưu tập.');
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: 'Xác nhận xóa bộ sưu tập',
      message: 'Bạn có chắc chắn muốn xóa bộ sưu tập này? Thao tác này không thể hoàn tác.',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger'
    });
    if (!confirmed) return;
    try {
      await staffService.deleteCollection(id);
      toast.success('Xóa bộ sưu tập thành công');
      fetchCollections();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không xóa được bộ sưu tập.');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1F2421]">Quản lý bộ sưu tập</h1>
          <p className="text-sm text-[#8A8A80] mt-1">Quản lý bộ sưu tập, banner và thời gian hiển thị</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F2421] text-white font-semibold rounded-lg hover:bg-[#2A2723] transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Thêm bộ sưu tập
        </button>
      </div>

      {/* Search */}
      <div className="bg-[#FBF7EF] border border-[#E2D9C8] rounded-lg p-4">
        <div className="relative max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A80] text-[20px]">search</span>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm theo tên bộ sưu tập"
            className="w-full pl-10 pr-4 py-2.5 border border-[#E2D9C8] rounded-lg bg-white text-[#1F2421] placeholder:text-[#8A8A80] focus:outline-none focus:ring-2 focus:ring-[#C8853F] focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E2D9C8] rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#F6F1E8] border-b border-[#E2D9C8]">
            <tr>
              <th className="px-4 md:px-6 py-3 text-sm font-semibold text-[#1F2421]">Bộ sưu tập</th>
              <th className="px-4 md:px-6 py-3 text-sm font-semibold text-[#1F2421] text-center">Sản phẩm</th>
              <th className="px-4 md:px-6 py-3 text-sm font-semibold text-[#1F2421] text-center">Trạng thái</th>
              <th className="px-4 md:px-6 py-3 text-sm font-semibold text-[#1F2421]">Thời gian</th>
              <th className="px-4 md:px-6 py-3 text-sm font-semibold text-[#1F2421] text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-6 py-12 text-center text-[#8A8A80]" colSpan={5}>
                <span className="material-symbols-outlined animate-spin inline-block text-2xl text-[#C8853F]">sync</span>
                <p className="mt-2">Đang tải...</p>
              </td></tr>
            ) : collections.length === 0 ? (
              <tr><td className="px-6 py-12 text-center text-[#8A8A80]" colSpan={5}>
                <span className="material-symbols-outlined text-5xl text-[#E2D9C8] mb-2">folder_off</span>
                <p>Chưa có bộ sưu tập nào.</p>
              </td></tr>
            ) : collections.map((collection) => (
              <tr key={collection.id} className="border-b border-[#E2D9C8] last:border-0 hover:bg-[#FBF7EF] transition-colors">
                <td className="px-4 md:px-6 py-4">
                  <div className="flex items-start gap-3">
                    {collection.bannerUrl && (
                      <div className="w-16 h-16 flex-shrink-0 rounded-lg border border-[#E2D9C8] overflow-hidden bg-[#F6F1E8]">
                        <img
                          src={collection.bannerUrl}
                          alt={collection.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#1F2421] truncate">{collection.name}</p>
                      <p className="text-xs text-[#8A8A80] mt-0.5 truncate">{collection.slug}</p>
                      {collection.description && (
                        <p className="text-xs text-[#8A8A80] mt-1 line-clamp-2">{collection.description}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 md:px-6 py-4 text-center">
                  <span className="inline-flex items-center justify-center min-w-[32px] h-8 px-2.5 bg-[#C8853F] text-white text-sm font-semibold rounded-full">
                    {collection.productCount || 0}
                  </span>
                </td>
                <td className="px-4 md:px-6 py-4 text-center">
                  {collection.isActive ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#E6F4EA] border border-[#A8DAB5] text-[#137333] text-xs font-semibold rounded-full">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#F4F4F4] border border-[#CCCCCC] text-[#666666] text-xs font-semibold rounded-full">
                      <span className="material-symbols-outlined text-sm">cancel</span>
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 md:px-6 py-4 text-sm text-[#8A8A80]">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-[#C8853F]">schedule</span>
                      <span className="text-xs">{collection.startDate ? new Date(collection.startDate).toLocaleDateString('vi-VN') : 'Không đặt'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-[#C8853F]">event</span>
                      <span className="text-xs">{collection.endDate ? new Date(collection.endDate).toLocaleDateString('vi-VN') : 'Không đặt'}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 md:px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 flex-wrap">
                    <button
                      onClick={() => navigate(`/admin/collections/${collection.id}/products`)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border-2 border-[#1F2421] text-[#1F2421] rounded-lg hover:bg-[#1F2421] hover:text-white transition-all shadow-sm"
                    >
                      <span className="material-symbols-outlined text-base">inventory_2</span>
                      Sản phẩm
                    </button>
                    <button
                      onClick={() => openEdit(collection)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border-2 border-[#1F2421] text-[#1F2421] rounded-lg hover:bg-[#1F2421] hover:text-white transition-all shadow-sm"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(collection.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#FEF2F2] border-2 border-[#FCA5A5] text-[#991B1B] rounded-lg hover:bg-[#FEE2E2] transition-all shadow-sm"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-br from-[#2A2723] to-[#1F2421] text-white px-6 py-5 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#C8853F] text-3xl">collections</span>
                  <h2 className="text-xl font-bold">{editingId ? 'Cập nhật bộ sưu tập' : 'Thêm bộ sưu tập mới'}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Tên bộ sưu tập */}
              <div>
                <label className="block text-sm font-semibold text-[#1F2421] mb-2">
                  Tên bộ sưu tập <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nhập tên bộ sưu tập"
                  className="w-full border-2 border-[#E2D9C8] rounded-lg px-4 py-2.5 text-[#1F2421] placeholder:text-[#8A8A80] focus:outline-none focus:ring-2 focus:ring-[#C8853F] focus:border-transparent transition-all"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-semibold text-[#1F2421] mb-2">
                  Slug (URL thân thiện)
                </label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="vd: summer-collection"
                  className="w-full border-2 border-[#E2D9C8] rounded-lg px-4 py-2.5 text-[#1F2421] placeholder:text-[#8A8A80] focus:outline-none focus:ring-2 focus:ring-[#C8853F] focus:border-transparent transition-all"
                />
              </div>

              {/* Banner URL */}
              <div>
                <label className="block text-sm font-semibold text-[#1F2421] mb-2">
                  URL Banner
                </label>
                <input
                  value={form.bannerUrl}
                  onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full border-2 border-[#E2D9C8] rounded-lg px-4 py-2.5 text-[#1F2421] placeholder:text-[#8A8A80] focus:outline-none focus:ring-2 focus:ring-[#C8853F] focus:border-transparent transition-all"
                />
                {form.bannerUrl && (
                  <div className="mt-3 rounded-lg overflow-hidden border-2 border-[#E2D9C8]">
                    <img src={form.bannerUrl} alt="Preview" className="w-full h-40 object-cover" />
                  </div>
                )}
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-sm font-semibold text-[#1F2421] mb-2">
                  Mô tả
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Nhập mô tả cho bộ sưu tập"
                  rows={3}
                  className="w-full border-2 border-[#E2D9C8] rounded-lg px-4 py-2.5 text-[#1F2421] placeholder:text-[#8A8A80] focus:outline-none focus:ring-2 focus:ring-[#C8853F] focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* Thời gian */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1F2421] mb-2">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full border-2 border-[#E2D9C8] rounded-lg px-4 py-2.5 text-[#1F2421] focus:outline-none focus:ring-2 focus:ring-[#C8853F] focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1F2421] mb-2">
                    Ngày kết thúc
                  </label>
                  <input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full border-2 border-[#E2D9C8] rounded-lg px-4 py-2.5 text-[#1F2421] focus:outline-none focus:ring-2 focus:ring-[#C8853F] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Trạng thái */}
              <div className="bg-[#F6F1E8] border border-[#E2D9C8] rounded-lg p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="w-5 h-5 text-[#C8853F] border-2 border-[#E2D9C8] rounded focus:ring-2 focus:ring-[#C8853F] cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-semibold text-[#1F2421]">Hiển thị ngay</span>
                    <p className="text-xs text-[#8A8A80] mt-0.5">Bộ sưu tập sẽ hiển thị trên trang chủ</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-[#FBF7EF] border-t border-[#E2D9C8] px-6 py-4 rounded-b-xl flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 border-2 border-[#E2D9C8] text-[#1F2421] font-semibold rounded-lg hover:bg-white transition-all"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F2421] text-white font-semibold rounded-lg hover:bg-[#2A2723] transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">{editingId ? 'check' : 'add'}</span>
                {editingId ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
