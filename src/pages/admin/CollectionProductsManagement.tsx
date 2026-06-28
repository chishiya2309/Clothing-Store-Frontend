import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { staffService } from '../../services/staff.service';
import type { StaffCollectionResponse, StaffProductListItem } from '../../services/staff.service';
import { useToast } from '../../components/ui/ToastProvider';
import { useConfirm } from '../../components/ui/ConfirmProvider';

export default function CollectionProductsManagement() {
  const toast = useToast();
  const confirm = useConfirm();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<StaffCollectionResponse | null>(null);
  const [products, setProducts] = useState<any[]>([]); // Using any since ProductGridResponse is not exported in staff service, we will map it
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // States for Add Modal
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<StaffProductListItem[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchCollectionDetails();
  }, [id]);

  const fetchCollectionDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await staffService.getCollectionDetail(Number(id));
      setCollection(data.collection);
      setProducts(data.products || []);
    } catch (error) {
      console.error("Error fetching collection details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchProducts = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    try {
      const data = await staffService.getProducts({ keyword: searchKeyword, size: 50 });
      // Filter out products already in the collection
      const existingIds = products.map(p => p.id);
      const filtered = data.content.filter((p: any) => !existingIds.includes(p.id));
      setSearchResults(filtered);
    } catch (error) {
      console.error("Error searching products:", error);
    } finally {
      setSearching(false);
    }
  };

  const toggleSelectProduct = (productId: number) => {
    setSelectedProductIds(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const handleAddProducts = async () => {
    if (selectedProductIds.length === 0 || !id) return;
    try {
      await staffService.addProductsToCollection(Number(id), selectedProductIds);
      toast.success('Thêm sản phẩm vào bộ sưu tập thành công');
      setIsAddModalOpen(false);
      setSelectedProductIds([]);
      setSearchResults([]);
      setSearchKeyword('');
      fetchCollectionDetails(); // Refresh list
    } catch (error) {
      console.error("Error adding products:", error);
      toast.error('Lỗi khi thêm sản phẩm vào bộ sưu tập');
    }
  };

  const handleRemoveProduct = async (productId: number) => {
    if (!id) return;
    const confirmed = await confirm({
      title: 'Xác nhận xóa sản phẩm',
      message: 'Bạn có chắc muốn xóa sản phẩm này khỏi bộ sưu tập?',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger'
    });
    if (!confirmed) return;
    try {
      await staffService.removeProductsFromCollection(Number(id), [productId]);
      toast.success('Xóa sản phẩm khỏi bộ sưu tập thành công');
      fetchCollectionDetails(); // Refresh list
    } catch (error) {
      console.error("Error removing product:", error);
      toast.error('Lỗi khi xóa sản phẩm khỏi bộ sưu tập');
    }
  };

  if (loading) return <div className="p-8 text-center text-on-surface-variant">Đang tải...</div>;
  if (!collection) return <div className="p-8 text-center text-error">Không tìm thấy bộ sưu tập</div>;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <button 
            onClick={() => navigate('/admin/collections')}
            className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors text-sm font-medium mb-2"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Trở lại danh sách
          </button>
          <h1 className="text-display-sm font-bold text-on-surface">
            Sản phẩm trong: {collection.name}
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm">
            Quản lý các sản phẩm hiển thị trong bộ sưu tập này.
          </p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-sm font-medium hover:bg-primary-dark transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Thêm sản phẩm
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-sm shadow-sm border border-border-subtle overflow-hidden">
        {products.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[48px] opacity-50 mb-4">inventory_2</span>
            <p>Chưa có sản phẩm nào trong bộ sưu tập này.</p>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 text-primary font-medium hover:underline"
            >
              Thêm sản phẩm ngay
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-surface-alt border-b border-border-subtle">
                  <th className="p-4 font-semibold text-on-surface-variant text-sm w-16 text-center">TT</th>
                  <th className="p-4 font-semibold text-on-surface-variant text-sm">Sản phẩm</th>
                  <th className="p-4 font-semibold text-on-surface-variant text-sm w-32">Giá</th>
                  <th className="p-4 font-semibold text-on-surface-variant text-sm w-32">Trạng thái</th>
                  <th className="p-4 font-semibold text-on-surface-variant text-sm w-24 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {products.map((product, index) => (
                  <tr key={product.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="p-4 text-center text-on-surface-variant">{index + 1}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {product.thumbnailUrl ? (
                          <img src={product.thumbnailUrl} alt={product.name} className="w-12 h-16 object-cover rounded-sm border border-border-subtle" />
                        ) : (
                          <div className="w-12 h-16 bg-surface-alt rounded-sm flex items-center justify-center border border-border-subtle">
                            <span className="material-symbols-outlined text-on-surface-variant opacity-50">image</span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-on-surface line-clamp-1">{product.name}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">{product.categoryName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {product.salePrice ? (
                        <div>
                          <span className="text-error font-semibold">{product.salePrice.toLocaleString('vi-VN')}đ</span>
                          <span className="text-on-surface-variant text-xs line-through block">{product.basePrice.toLocaleString('vi-VN')}đ</span>
                        </div>
                      ) : (
                        <span className="font-semibold">{product.basePrice.toLocaleString('vi-VN')}đ</span>
                      )}
                    </td>
                    <td className="p-4">
                      {product.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                          <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                          Đang bán
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-error/10 text-error">
                          <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                          Ngừng bán
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleRemoveProduct(product.id)}
                        className="p-1.5 text-error hover:bg-error/10 rounded-sm transition-colors"
                        title="Xóa khỏi bộ sưu tập"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Products Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-sm shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border-subtle">
              <h2 className="text-title-lg font-semibold">Thêm sản phẩm vào Bộ sưu tập</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 border-b border-border-subtle">
              <form onSubmit={handleSearchProducts} className="flex gap-2">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Tìm kiếm theo tên sản phẩm..."
                    className="w-full pl-10 pr-4 py-2 border border-border-subtle rounded-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={searching}
                  className="bg-primary text-on-primary px-4 py-2 rounded-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {searching ? 'Đang tìm...' : 'Tìm kiếm'}
                </button>
              </form>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {searchResults.length === 0 ? (
                <div className="text-center text-on-surface-variant py-8">
                  {searchKeyword ? 'Không tìm thấy sản phẩm nào phù hợp.' : 'Nhập từ khóa và nhấn Tìm kiếm để hiển thị sản phẩm.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map(product => (
                    <div 
                      key={product.id}
                      onClick={() => toggleSelectProduct(product.id)}
                      className={`flex items-center gap-4 p-3 border rounded-sm cursor-pointer transition-colors ${
                        selectedProductIds.includes(product.id) 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border-subtle hover:border-border'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${
                        selectedProductIds.includes(product.id)
                          ? 'bg-primary border-primary text-on-primary'
                          : 'border-border-subtle'
                      }`}>
                        {selectedProductIds.includes(product.id) && <span className="material-symbols-outlined text-[16px]">check</span>}
                      </div>
                      
                      {product.thumbnailUrl ? (
                        <img src={product.thumbnailUrl} alt={product.name} className="w-10 h-12 object-cover rounded-sm border border-border-subtle shrink-0" />
                      ) : (
                        <div className="w-10 h-12 bg-surface-alt rounded-sm flex items-center justify-center border border-border-subtle shrink-0">
                          <span className="material-symbols-outlined text-[16px] text-on-surface-variant opacity-50">image</span>
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-on-surface truncate">{product.name}</p>
                        <p className="text-xs text-on-surface-variant">{product.categoryName}</p>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <span className="font-medium">{product.salePrice ? product.salePrice.toLocaleString('vi-VN') : product.basePrice.toLocaleString('vi-VN')}đ</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border-subtle flex items-center justify-between bg-surface-alt mt-auto">
              <div>
                Đã chọn: <span className="font-semibold text-primary">{selectedProductIds.length}</span> sản phẩm
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-border-subtle text-on-surface rounded-sm font-medium hover:bg-surface-container transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleAddProducts}
                  disabled={selectedProductIds.length === 0}
                  className="bg-primary text-on-primary px-6 py-2 rounded-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Thêm vào BST
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
