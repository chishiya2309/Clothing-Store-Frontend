import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { staffService } from '../../services/staff.service';
import type { StaffCollectionResponse } from '../../services/staff.service';

export default function CollectionManagement() {
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
      alert(err.response?.data?.message || 'Không tải được danh sách bộ sưu tập.');
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
      } else {
        await staffService.createCollection(payload);
      }
      setShowModal(false);
      fetchCollections();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không lưu được bộ sưu tập.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bộ sưu tập này?')) return;
    try {
      await staffService.deleteCollection(id);
      fetchCollections();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không xóa được bộ sưu tập.');
    }
  };

  return (
    <div className="space-y-lg">
      <div className="flex items-center justify-between gap-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold">Quản lý bộ sưu tập</h1>
          <p className="text-text-muted text-sm">CRUD bộ sưu tập, banner và thời gian hiển thị.</p>
        </div>
        <button onClick={openCreate} className="px-lg py-sm bg-primary text-on-primary rounded-DEFAULT font-semibold">
          Thêm bộ sưu tập
        </button>
      </div>

      <div className="bg-surface-container-lowest border border-border-subtle rounded-lg p-md">
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Tìm theo tên bộ sưu tập"
          className="w-full md:w-96 border border-border-subtle rounded px-md py-sm"
        />
      </div>

      <div className="bg-surface-container-lowest border border-border-subtle rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-surface-alt border-b border-border-subtle">
            <tr>
              <th className="p-md">Tên</th>
              <th className="p-md">Sản phẩm</th>
              <th className="p-md">Trạng thái</th>
              <th className="p-md">Thời gian</th>
              <th className="p-md text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-lg text-center" colSpan={5}>Đang tải...</td></tr>
            ) : collections.length === 0 ? (
              <tr><td className="p-lg text-center text-text-muted" colSpan={5}>Chưa có bộ sưu tập.</td></tr>
            ) : collections.map((collection) => (
              <tr key={collection.id} className="border-b border-border-subtle last:border-0">
                <td className="p-md">
                  <p className="font-semibold">{collection.name}</p>
                  <p className="text-xs text-text-muted">{collection.slug}</p>
                </td>
                <td className="p-md">{collection.productCount || 0}</td>
                <td className="p-md">{collection.statusState || (collection.isActive ? 'ACTIVE' : 'INACTIVE')}</td>
                <td className="p-md text-sm text-text-muted">
                  {collection.startDate ? new Date(collection.startDate).toLocaleDateString('vi-VN') : 'Không đặt'} - {collection.endDate ? new Date(collection.endDate).toLocaleDateString('vi-VN') : 'Không đặt'}
                </td>
                <td className="p-md text-right space-x-sm">
                  <button onClick={() => openEdit(collection)} className="px-sm py-xs border border-border-subtle rounded">Sửa</button>
                  <button onClick={() => handleDelete(collection.id)} className="px-sm py-xs border border-error text-error rounded">Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-xl">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-xl space-y-md">
            <h2 className="font-headline-md text-headline-md font-bold">{editingId ? 'Cập nhật bộ sưu tập' : 'Thêm bộ sưu tập'}</h2>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tên bộ sưu tập" className="w-full border rounded px-md py-sm" />
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Slug" className="w-full border rounded px-md py-sm" />
            <input value={form.bannerUrl} onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })} placeholder="URL banner" className="w-full border rounded px-md py-sm" />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Mô tả" className="w-full border rounded px-md py-sm min-h-24" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="border rounded px-md py-sm" />
              <input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="border rounded px-md py-sm" />
            </div>
            <label className="flex items-center gap-sm">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Đang hiển thị
            </label>
            <div className="flex justify-end gap-sm">
              <button type="button" onClick={() => setShowModal(false)} className="px-md py-sm border rounded">Hủy</button>
              <button type="submit" className="px-md py-sm bg-primary text-on-primary rounded">Lưu</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
