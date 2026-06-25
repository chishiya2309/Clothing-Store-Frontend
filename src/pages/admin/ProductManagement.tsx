import { useEffect, useState, useCallback } from 'react';
import { staffService } from '../../services/staff.service';
import type { StaffProductListItem, StaffCreateProductRequest, StaffVariantDto, StaffImageDto } from '../../services/staff.service';
import { categoryService } from '../../services/category.service';
import type { CategoryResponse } from '../../services/category.service';

export default function ProductManagement() {
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  
  // Products states
  const [products, setProducts] = useState<StaffProductListItem[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [error, setError] = useState('');

  // Category hierarchy list for dropdown
  const [flatCategories, setFlatCategories] = useState<Array<{ id: number; name: string }>>([]);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  
  // Product Form states
  const [pName, setPName] = useState('');
  const [pDescription, setPDescription] = useState('');
  const [pMaterial, setPMaterial] = useState('');
  const [pCare, setPCare] = useState('');
  const [pBasePrice, setPBasePrice] = useState(0);
  const [pSalePrice, setPSalePrice] = useState<string>('');
  const [pCategoryId, setPCategoryId] = useState<number>(0);
  const [pIsFeatured, setPIsFeatured] = useState(false);
  const [pIsActive, setPIsActive] = useState(true);
  const [pVariants, setPVariants] = useState<StaffVariantDto[]>([]);
  const [pImages, setPImages] = useState<StaffImageDto[]>([]);
  
  // Helper for adding variants/images
  const [varSize, setVarSize] = useState('M');
  const [varColor, setVarColor] = useState('');
  const [varStock, setVarStock] = useState(0);
  const [varPrice, setVarPrice] = useState(0);
  const [imgUrl, setImgUrl] = useState('');
  const [imgType, setImgType] = useState<'main' | 'gallery'>('gallery');

  // Category CRUD states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catParentId, setCatParentId] = useState<string>('');
  const [catOrder, setCatOrder] = useState(1);

  // Flatten categories hierarchy for selectors
  const flatten = (nodes: any[], prefix = ''): any[] => {
    let result: any[] = [];
    nodes.forEach(node => {
      result.push({ id: node.id, name: prefix + node.name });
      if (node.children && node.children.length > 0) {
        result = result.concat(flatten(node.children, prefix + '— '));
      }
    });
    return result;
  };

  const fetchCategories = useCallback(async () => {
    try {
      const data = await categoryService.getCategoryHierarchy();
      setCategories(data);
      setFlatCategories(flatten(data));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      setError('');
      const data = await staffService.getProducts({
        keyword: keyword || undefined,
        categoryId: filterCategory ? Number(filterCategory) : undefined,
        status: filterStatus || undefined,
        page,
        size: 10,
        sortBy: 'id',
        sortDir: 'desc'
      });
      setProducts(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi khi tải danh sách sản phẩm.');
    } finally {
      setLoadingProducts(false);
    }
  }, [page, keyword, filterCategory, filterStatus]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 400);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const handleToggleActive = async (id: number, current: boolean) => {
    try {
      await staffService.updateVisibility(id, !current);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, isActive: !current } : p));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi cập nhật trạng thái hiển thị');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn ẩn/xóa sản phẩm này?')) return;
    try {
      await staffService.deleteProduct(id);
      alert('Xóa sản phẩm thành công');
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi xóa sản phẩm');
    }
  };

  // Open Add Product
  const handleOpenAddProduct = () => {
    setSelectedProductId(null);
    setPName('');
    setPDescription('');
    setPMaterial('');
    setPCare('');
    setPBasePrice(0);
    setPSalePrice('');
    setPIsFeatured(false);
    setPIsActive(true);
    setPCategoryId(flatCategories[0]?.id || 0);
    setPVariants([]);
    setPImages([]);
    setIsProductModalOpen(true);
  };

  // Open Edit Product
  const handleOpenEditProduct = async (id: number) => {
    try {
      const detail = await staffService.getProduct(id);
      setSelectedProductId(id);
      setPName(detail.name);
      setPDescription(detail.description);
      setPMaterial(detail.material);
      setPCare(detail.careInstructions);
      setPBasePrice(detail.basePrice);
      setPSalePrice(detail.salePrice ? String(detail.salePrice) : '');
      setPIsFeatured(detail.isFeatured);
      setPIsActive(detail.isActive);
      setPCategoryId(detail.categoryId);
      setPVariants(detail.variants);
      setPImages(detail.images);
      setIsProductModalOpen(true);
    } catch (err: any) {
      alert('Lỗi tải chi tiết sản phẩm: ' + (err.response?.data?.message || err.message));
    }
  };

  // Add variant locally
  const addVariantLocally = () => {
    if (!varColor) {
      alert('Vui lòng nhập màu sắc');
      return;
    }
    const sku = `${pName.substring(0, 3).toUpperCase()}-${varColor.substring(0, 2).toUpperCase()}-${varSize}-${Date.now().toString().slice(-4)}`;
    const newVariant: StaffVariantDto = {
      sku,
      size: varSize,
      color: varColor,
      stockQuantity: varStock,
      additionalPrice: varPrice
    };
    setPVariants([...pVariants, newVariant]);
    setVarColor('');
    setVarStock(0);
    setVarPrice(0);
  };

  // Add image locally
  const addImageLocally = () => {
    if (!imgUrl) return;
    const newImg: StaffImageDto = {
      imageUrl: imgUrl,
      imageType: imgType,
      displayOrder: pImages.length + 1,
      altText: pName
    };
    setPImages([...pImages, newImg]);
    setImgUrl('');
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pCategoryId) {
      alert('Vui lòng chọn danh mục');
      return;
    }
    if (pVariants.length === 0) {
      alert('Vui lòng thêm ít nhất 1 biến thể (Size/Màu)');
      return;
    }
    if (pImages.length === 0) {
      alert('Vui lòng thêm ít nhất 1 hình ảnh');
      return;
    }

    const payload: StaffCreateProductRequest = {
      name: pName,
      description: pDescription,
      material: pMaterial,
      careInstructions: pCare,
      basePrice: pBasePrice,
      salePrice: pSalePrice ? Number(pSalePrice) : null,
      categoryId: pCategoryId,
      isFeatured: pIsFeatured,
      isActive: pIsActive,
      variants: pVariants,
      images: pImages
    };

    try {
      if (selectedProductId) {
        await staffService.updateProduct(selectedProductId, payload);
        alert('Cập nhật sản phẩm thành công');
      } else {
        await staffService.createProduct(payload);
        alert('Tạo sản phẩm thành công');
      }
      setIsProductModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu sản phẩm');
    }
  };

  // Category Actions
  const handleOpenAddCategory = () => {
    setSelectedCategoryId(null);
    setCatName('');
    setCatDescription('');
    setCatParentId('');
    setCatOrder(1);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (node: CategoryResponse, parentId: number | null) => {
    setSelectedCategoryId(node.id);
    setCatName(node.name);
    setCatDescription(node.description || '');
    setCatParentId(parentId ? String(parentId) : '');
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;

    const payload = {
      name: catName,
      description: catDescription,
      parentId: catParentId ? Number(catParentId) : null,
      displayOrder: catOrder
    };

    try {
      if (selectedCategoryId) {
        await staffService.updateCategory(selectedCategoryId, payload);
        alert('Cập nhật danh mục thành công');
      } else {
        await staffService.createCategory(payload);
        alert('Tạo danh mục thành công');
      }
      setIsCategoryModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi lưu danh mục');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    try {
      await staffService.deleteCategory(id);
      alert('Xóa danh mục thành công');
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi xóa danh mục');
    }
  };

  // Recursive Category List Renderer
  const renderCategoryTree = (nodes: CategoryResponse[], parentId: number | null = null) => {
    return (
      <ul className="pl-lg border-l border-border-subtle flex flex-col gap-sm">
        {nodes.map(node => (
          <li key={node.id} className="py-xs">
            <div className="flex items-center justify-between p-sm bg-surface-alt rounded border border-border-subtle hover:bg-surface-container-low transition-colors">
              <div>
                <span className="font-semibold text-text-primary">{node.name}</span>
                <span className="text-[10px] text-text-muted ml-sm">Slug: {node.slug}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenEditCategory(node, parentId)}
                  className="px-2 py-1 text-xs text-primary hover:bg-primary-container rounded transition-colors"
                >
                  Sửa
                </button>
                <button
                  onClick={() => handleDeleteCategory(node.id)}
                  className="px-2 py-1 text-xs text-error hover:bg-error-container rounded transition-colors"
                >
                  Xóa
                </button>
              </div>
            </div>
            {node.children && node.children.length > 0 && (
              <div className="mt-xs">
                {renderCategoryTree(node.children, node.id)}
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="bg-[#FAFAF8] min-h-full">
      {/* Tab Header */}
      <div className="flex justify-between items-center mb-xl">
        <div className="flex border-b border-border-subtle">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-lg py-sm font-semibold text-headline-sm transition-all border-b-2 ${
              activeTab === 'products' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            Quản lý sản phẩm
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-lg py-sm font-semibold text-headline-sm transition-all border-b-2 ${
              activeTab === 'categories' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            Danh mục sản phẩm
          </button>
        </div>
        
        {activeTab === 'products' ? (
          <button
            onClick={handleOpenAddProduct}
            className="flex items-center gap-sm bg-primary hover:bg-primary-hover text-on-primary px-lg py-sm rounded-DEFAULT transition-all font-semibold font-label-caps text-label-caps"
          >
            <span className="material-symbols-outlined">add</span>
            Thêm sản phẩm
          </button>
        ) : (
          <button
            onClick={handleOpenAddCategory}
            className="flex items-center gap-sm bg-primary hover:bg-primary-hover text-on-primary px-lg py-sm rounded-DEFAULT transition-all font-semibold font-label-caps text-label-caps"
          >
            <span className="material-symbols-outlined">add</span>
            Thêm danh mục
          </button>
        )}
      </div>

      {activeTab === 'products' ? (
        <>
          {/* Filters */}
          <div className="bg-surface-container-lowest p-lg rounded-lg border border-border-subtle mb-xl flex flex-wrap gap-md">
            <div className="flex-1 min-w-[240px]">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm theo tên, SKU..."
                className="w-full px-md py-sm border border-border-subtle rounded-DEFAULT focus:outline-none focus:border-primary transition-colors"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <select
              className="px-md py-sm border border-border-subtle rounded-DEFAULT focus:outline-none focus:border-primary transition-colors"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">Tất cả danh mục</option>
              {flatCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              className="px-md py-sm border border-border-subtle rounded-DEFAULT focus:outline-none focus:border-primary transition-colors"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Hiển thị</option>
              <option value="DRAFT">Ẩn</option>
            </select>
          </div>

          {error && (
            <div className="mb-lg p-md bg-error-container text-on-error-container rounded-lg border border-[#ed4848]/30">
              {error}
            </div>
          )}

          {/* Table */}
          <div className="bg-surface-container-lowest rounded-lg border border-border-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-alt border-b border-border-subtle">
                  <tr>
                    <th className="py-md px-lg font-label-caps text-label-caps text-text-muted">Sản phẩm</th>
                    <th className="py-md px-lg font-label-caps text-label-caps text-text-muted whitespace-nowrap">Giá bán</th>
                    <th className="py-md px-lg font-label-caps text-label-caps text-text-muted whitespace-nowrap">Tồn kho</th>
                    <th className="py-md px-lg font-label-caps text-label-caps text-text-muted text-center whitespace-nowrap">Trạng thái</th>
                    <th className="py-md px-lg font-label-caps text-label-caps text-text-muted text-right whitespace-nowrap">Hành động</th>
                  </tr>
                </thead>
                <tbody className="font-body-sm text-body-sm">
                  {loadingProducts ? (
                    <tr>
                      <td colSpan={5} className="py-xl text-center text-text-muted">
                        <span className="material-symbols-outlined animate-spin mb-2">progress_activity</span>
                        <p>Đang tải danh sách sản phẩm...</p>
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-xl text-center text-text-muted">Không tìm thấy sản phẩm nào.</td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id} className="border-b border-surface-container hover:bg-surface-alt transition-colors">
                        <td className="py-md px-lg">
                          <div className="flex items-center gap-sm">
                            <div className="w-12 h-16 bg-surface rounded overflow-hidden border border-border-subtle flex-shrink-0">
                              <img 
                                src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=100&q=80" 
                                alt="thumb"
                                className="w-full h-full object-cover" 
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-xs flex-wrap">
                                <p className="font-medium text-text-primary line-clamp-1">{product.name}</p>
                                {product.isFeatured && (
                                  <span className="text-amber-500 text-sm" title="Sản phẩm nổi bật">★</span>
                                )}
                              </div>
                              <p className="text-[10px] text-text-muted font-mono mt-[1px]">ID: {product.id} · {product.categoryName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-md px-lg whitespace-nowrap">
                          <p className="font-semibold text-text-primary">{(product.salePrice || product.basePrice).toLocaleString('vi-VN')} đ</p>
                          {product.salePrice && <p className="text-text-muted line-through text-xs">{product.basePrice.toLocaleString('vi-VN')} đ</p>}
                        </td>
                        <td className="py-md px-lg whitespace-nowrap">
                          <span className={`font-semibold ${(product.totalStock ?? 0) < 10 ? 'text-error' : 'text-text-primary'}`}>
                            {product.totalStock ?? 0}
                          </span>
                        </td>
                        <td className="py-md px-lg text-center whitespace-nowrap">
                          <button
                            onClick={() => handleToggleActive(product.id, product.isActive)}
                            className={`px-3 py-1 rounded-full text-[11px] font-medium border whitespace-nowrap ${
                              product.isActive 
                                ? 'bg-[#E6F4EA] text-success border-[#bce4c6] hover:bg-[#d4ebd9]' 
                                : 'bg-error-container text-on-error-container border-[#fcd8d8] hover:bg-[#fbdada]'
                            }`}
                          >
                            {product.isActive ? 'Hiển thị' : 'Đã ẩn'}
                          </button>
                        </td>
                        <td className="py-md px-lg text-right whitespace-nowrap">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleOpenEditProduct(product.id)}
                              className="p-1 text-primary hover:bg-primary-container rounded transition-colors"
                              title="Chỉnh sửa sản phẩm"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-1 text-error hover:bg-error-container rounded transition-colors"
                              title="Xóa/Ẩn sản phẩm"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
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
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-lg py-md border-t border-border-subtle bg-surface-alt">
                <p className="text-sm text-text-muted">
                  Hiển thị <span className="font-medium text-text-primary">{page * 10 + 1}</span> - <span className="font-medium text-text-primary">{Math.min((page + 1) * 10, totalElements)}</span> trong <span className="font-medium text-text-primary">{totalElements}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1 border border-border-subtle bg-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-container transition-colors text-sm"
                  >
                    Trước
                  </button>
                  <button
                    disabled={page === totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1 border border-border-subtle bg-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-container transition-colors text-sm"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Categories Tab */
        <div className="bg-surface-container-lowest p-xl rounded-lg border border-border-subtle">
          <h3 className="font-headline-sm text-headline-sm mb-lg">Cây danh mục đa cấp</h3>
          {categories.length === 0 ? (
            <p className="text-text-muted">Chưa cấu hình danh mục nào.</p>
          ) : (
            renderCategoryTree(categories)
          )}
        </div>
      )}

      {/* Product Add/Edit Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-xl overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-border-subtle shadow-2xl">
            <header className="px-xl py-lg border-b border-border-subtle flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="font-headline-md text-headline-md font-bold">
                {selectedProductId ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </h3>
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="text-text-muted hover:text-text-primary"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <form onSubmit={handleSaveProduct} className="p-xl flex flex-col gap-lg">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-lg">
                <div className="flex flex-col gap-xs">
                  <label className="font-semibold text-xs text-text-secondary">Tên sản phẩm *</label>
                  <input
                    required
                    type="text"
                    className="px-md py-sm border border-border-subtle rounded focus:outline-none focus:border-primary"
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="font-semibold text-xs text-text-secondary">Danh mục *</label>
                  <select
                    required
                    className="px-md py-sm border border-border-subtle rounded focus:outline-none focus:border-primary"
                    value={pCategoryId}
                    onChange={(e) => setPCategoryId(Number(e.target.value))}
                  >
                    <option value="">Chọn danh mục</option>
                    {flatCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-lg">
                <div className="flex flex-col gap-xs">
                  <label className="font-semibold text-xs text-text-secondary">Giá gốc (đ) *</label>
                  <input
                    required
                    type="number"
                    min={0}
                    className="px-md py-sm border border-border-subtle rounded focus:outline-none focus:border-primary"
                    value={pBasePrice}
                    onChange={(e) => setPBasePrice(Number(e.target.value))}
                  />
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="font-semibold text-xs text-text-secondary">Giá khuyến mãi (đ)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Không áp dụng"
                    className="px-md py-sm border border-border-subtle rounded focus:outline-none focus:border-primary"
                    value={pSalePrice}
                    onChange={(e) => setPSalePrice(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-xl mt-lg">
                  <label className="flex items-center gap-sm cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-primary" 
                      checked={pIsFeatured}
                      onChange={(e) => setPIsFeatured(e.target.checked)}
                    />
                    <span className="text-sm font-semibold">Nổi bật</span>
                  </label>
                  <label className="flex items-center gap-sm cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-primary" 
                      checked={pIsActive}
                      onChange={(e) => setPIsActive(e.target.checked)}
                    />
                    <span className="text-sm font-semibold">Hiển thị ngay</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-lg">
                <div className="flex flex-col gap-xs">
                  <label className="font-semibold text-xs text-text-secondary">Chất liệu</label>
                  <input
                    type="text"
                    className="px-md py-sm border border-border-subtle rounded focus:outline-none focus:border-primary"
                    value={pMaterial}
                    onChange={(e) => setPMaterial(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="font-semibold text-xs text-text-secondary">Hướng dẫn bảo quản</label>
                  <input
                    type="text"
                    className="px-md py-sm border border-border-subtle rounded focus:outline-none focus:border-primary"
                    value={pCare}
                    onChange={(e) => setPCare(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-xs">
                <label className="font-semibold text-xs text-text-secondary">Mô tả sản phẩm</label>
                <textarea
                  rows={3}
                  className="px-md py-sm border border-border-subtle rounded focus:outline-none focus:border-primary"
                  value={pDescription}
                  onChange={(e) => setPDescription(e.target.value)}
                />
              </div>

              {/* Variants Configuration */}
              <div className="border border-border-subtle rounded-lg p-lg bg-surface-alt">
                <h4 className="font-bold text-sm text-text-primary mb-md">Cấu hình biến thể (Size / Màu / Tồn kho)</h4>
                
                <div className="grid grid-cols-5 gap-md items-end mb-md">
                  <div className="flex flex-col gap-xs">
                    <label className="text-xs text-text-secondary">Kích cỡ *</label>
                    <select
                      className="px-sm py-xs border border-border-subtle rounded bg-white"
                      value={varSize}
                      onChange={(e) => setVarSize(e.target.value)}
                    >
                      {['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-xs col-span-2">
                    <label className="text-xs text-text-secondary">Màu sắc *</label>
                    <input
                      type="text"
                      placeholder="vd: Đen, Trắng, Navy..."
                      className="px-sm py-xs border border-border-subtle rounded"
                      value={varColor}
                      onChange={(e) => setVarColor(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-xs">
                    <label className="text-xs text-text-secondary">Tồn kho *</label>
                    <input
                      type="number"
                      min={0}
                      className="px-sm py-xs border border-border-subtle rounded"
                      value={varStock}
                      onChange={(e) => setVarStock(Number(e.target.value))}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addVariantLocally}
                    className="bg-[#2A2A4A] text-white px-md py-sm rounded text-xs font-semibold"
                  >
                    Thêm biến thể
                  </button>
                </div>

                {/* Variants List */}
                <div className="overflow-y-auto max-h-[150px] border-t border-border-subtle pt-md">
                  {pVariants.length === 0 ? (
                    <p className="text-xs text-text-muted text-center">Chưa cấu hình biến thể nào cho sản phẩm.</p>
                  ) : (
                    <div className="flex flex-col gap-sm">
                      {pVariants.map((v, idx) => (
                        <div key={idx} className="flex justify-between items-center p-xs bg-white rounded border border-border-subtle text-xs">
                          <span className="font-mono">SKU: {v.sku}</span>
                          <span>Size: <strong className="text-primary">{v.size}</strong></span>
                          <span>Màu: <strong className="text-primary">{v.color}</strong></span>
                          <span>Tồn: <strong>{v.stockQuantity}</strong></span>
                          <button
                            type="button"
                            onClick={() => setPVariants(prev => prev.filter((_, i) => i !== idx))}
                            className="text-error font-semibold"
                          >
                            Xóa
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Images configuration */}
              <div className="border border-border-subtle rounded-lg p-lg bg-surface-alt">
                <h4 className="font-bold text-sm text-text-primary mb-md">Quản lý hình ảnh (Urls)</h4>
                
                <div className="grid grid-cols-4 gap-md items-end mb-md">
                  <div className="flex flex-col gap-xs col-span-2">
                    <label className="text-xs text-text-secondary">Đường dẫn hình ảnh *</label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      className="px-sm py-xs border border-border-subtle rounded"
                      value={imgUrl}
                      onChange={(e) => setImgUrl(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-xs">
                    <label className="text-xs text-text-secondary">Loại ảnh</label>
                    <select
                      className="px-sm py-xs border border-border-subtle rounded bg-white"
                      value={imgType}
                      onChange={(e) => setImgType(e.target.value as any)}
                    >
                      <option value="main">Ảnh chính</option>
                      <option value="gallery">Ảnh chi tiết</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={addImageLocally}
                    className="bg-[#2A2A4A] text-white px-md py-sm rounded text-xs font-semibold"
                  >
                    Thêm ảnh
                  </button>
                </div>

                <div className="overflow-x-auto max-h-[120px] flex gap-sm pt-md border-t border-border-subtle">
                  {pImages.length === 0 ? (
                    <p className="text-xs text-text-muted w-full text-center">Chưa thêm hình ảnh nào.</p>
                  ) : (
                    pImages.map((img, idx) => (
                      <div key={idx} className="relative w-16 h-20 rounded border border-border-subtle bg-white flex-shrink-0 overflow-hidden">
                        <img src={img.imageUrl} alt="preview" className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] text-center">{img.imageType}</span>
                        <button
                          type="button"
                          onClick={() => setPImages(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-0 right-0 bg-error text-white w-4 h-4 text-[9px] rounded-full flex items-center justify-center"
                        >
                          x
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="border-t border-border-subtle pt-lg flex justify-end gap-md">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-lg py-sm border border-border-subtle rounded font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-lg py-sm bg-primary hover:bg-primary-hover text-on-primary rounded font-semibold"
                >
                  {selectedProductId ? 'Lưu cập nhật' : 'Tạo mới sản phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Add/Edit Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-xl">
          <div className="bg-white rounded-lg w-full max-w-md border border-border-subtle shadow-xl">
            <header className="px-xl py-lg border-b border-border-subtle flex justify-between items-center">
              <h3 className="font-headline-sm text-headline-sm font-bold">
                {selectedCategoryId ? 'Cập nhật danh mục' : 'Tạo danh mục mới'}
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-text-muted hover:text-text-primary">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
            
            <form onSubmit={handleSaveCategory} className="p-xl flex flex-col gap-md">
              <div className="flex flex-col gap-xs">
                <label className="text-xs font-semibold text-text-secondary">Tên danh mục *</label>
                <input
                  required
                  type="text"
                  className="px-md py-sm border border-border-subtle rounded focus:outline-none focus:border-primary"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-xs font-semibold text-text-secondary">Danh mục cha (Tối đa 3 cấp)</label>
                <select
                  className="px-md py-sm border border-border-subtle rounded focus:outline-none focus:border-primary"
                  value={catParentId}
                  onChange={(e) => setCatParentId(e.target.value)}
                >
                  <option value="">Không có (Danh mục gốc)</option>
                  {flatCategories
                    .filter(c => selectedCategoryId ? c.id !== selectedCategoryId : true)
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-xs font-semibold text-text-secondary">Mô tả</label>
                <textarea
                  rows={2}
                  className="px-md py-sm border border-border-subtle rounded focus:outline-none focus:border-primary"
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-xs font-semibold text-text-secondary">Thứ tự hiển thị</label>
                <input
                  type="number"
                  min={1}
                  className="px-md py-sm border border-border-subtle rounded focus:outline-none focus:border-primary"
                  value={catOrder}
                  onChange={(e) => setCatOrder(Number(e.target.value))}
                />
              </div>

              <div className="flex justify-end gap-sm pt-md border-t border-border-subtle mt-md">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-md py-sm border border-border-subtle rounded"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-md py-sm bg-primary text-on-primary rounded font-semibold"
                >
                  Lưu lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
