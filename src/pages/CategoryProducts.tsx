import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { productService, type ProductGridResponse, type PageResponse } from '@/services/product.service';
import { useCategoryStore } from '@/store/categoryStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import ProductFilterSidebar, { type FilterState } from '@/components/ProductFilterSidebar';

const colorMap: Record<string, string> = {
  'trắng': '#ffffff',
  'đen': '#1a1c1b',
  'xanh navy': '#1a1a2e',
  'be': '#d6c4a7',
  'xám': '#78767d',
  'đỏ': '#ba1a1a',
  'xanh rêu': '#6a5d45',
  'nâu': '#6f6149',
  'vàng': '#e8a317',
  'hồng': '#ffb3ae',
  'xanh dương': '#1a73e8',
  'xanh lá': '#2d8f4e',
  'kem': '#f0ede8',
  'tím': '#c6c4df'
};

const getHexColor = (colorName: string) => {
  const normalized = colorName.toLowerCase().trim();
  return colorMap[normalized] || normalized;
};

const sortOptions = [
  { value: 'latest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'best_selling', label: 'Bán chạy' },
];

export default function CategoryProducts() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pageData, setPageData] = useState<PageResponse<ProductGridResponse> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const { categories } = useCategoryStore();
  const { wishlistProductIds, toggleWishlist } = useWishlistStore();
  const { token } = useAuthStore();

  // Determine if this is a search page
  const isSearchPage = !slug;
  const searchKeyword = searchParams.get('q') || '';

  // Read filter state from URL search params
  const currentPage = parseInt(searchParams.get('page') || '0', 10);
  const currentSort = searchParams.get('sort') || 'latest';
  const filterState: FilterState = {
    colors: searchParams.getAll('colors'),
    sizes: searchParams.getAll('sizes'),
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
  };

  // Find current category name for title/breadcrumb
  const findCategoryName = (cats: any[], targetSlug: string): string | null => {
    for (const cat of cats) {
      if (cat.slug === targetSlug) return cat.name;
      if (cat.children && cat.children.length > 0) {
        const found = findCategoryName(cat.children, targetSlug);
        if (found) return found;
      }
    }
    return null;
  };

  const currentCategoryName = slug
    ? findCategoryName(categories, slug) || 'Tất cả sản phẩm'
    : `Kết quả tìm kiếm "${searchKeyword}"`;

  // Sync URL params helper
  const updateParams = useCallback((updates: Record<string, string | string[] | undefined>) => {
    const newParams = new URLSearchParams();

    // Keep q param for search page
    if (searchKeyword) newParams.set('q', searchKeyword);

    // Apply updates
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') return;
      if (Array.isArray(value)) {
        value.forEach((v) => newParams.append(key, v));
      } else {
        newParams.set(key, value);
      }
    });

    setSearchParams(newParams, { replace: true });
  }, [searchKeyword, setSearchParams]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const data = await productService.searchProducts({
          keyword: searchKeyword || undefined,
          categorySlug: slug || undefined,
          colors: filterState.colors.length > 0 ? filterState.colors : undefined,
          sizes: filterState.sizes.length > 0 ? filterState.sizes : undefined,
          minPrice: filterState.minPrice,
          maxPrice: filterState.maxPrice,
          sortBy: currentSort,
          page: currentPage,
          size: 12,
        });
        setPageData(data);
      } catch (error) {
        console.error('Failed to fetch products', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, searchParams.toString()]);

  const handleFilterChange = (newFilters: FilterState) => {
    updateParams({
      colors: newFilters.colors.length > 0 ? newFilters.colors : undefined,
      sizes: newFilters.sizes.length > 0 ? newFilters.sizes : undefined,
      minPrice: newFilters.minPrice !== undefined ? String(newFilters.minPrice) : undefined,
      maxPrice: newFilters.maxPrice !== undefined ? String(newFilters.maxPrice) : undefined,
      sort: currentSort !== 'latest' ? currentSort : undefined,
      page: '0', // Reset to first page on filter change
    });
  };

  const handleSortChange = (sortBy: string) => {
    setSortOpen(false);
    updateParams({
      colors: filterState.colors.length > 0 ? filterState.colors : undefined,
      sizes: filterState.sizes.length > 0 ? filterState.sizes : undefined,
      minPrice: filterState.minPrice !== undefined ? String(filterState.minPrice) : undefined,
      maxPrice: filterState.maxPrice !== undefined ? String(filterState.maxPrice) : undefined,
      sort: sortBy !== 'latest' ? sortBy : undefined,
      page: '0',
    });
  };

  const handlePageChange = (newPage: number) => {
    if (pageData && newPage >= 0 && newPage < pageData.totalPages) {
      updateParams({
        colors: filterState.colors.length > 0 ? filterState.colors : undefined,
        sizes: filterState.sizes.length > 0 ? filterState.sizes : undefined,
        minPrice: filterState.minPrice !== undefined ? String(filterState.minPrice) : undefined,
        maxPrice: filterState.maxPrice !== undefined ? String(filterState.maxPrice) : undefined,
        sort: currentSort !== 'latest' ? currentSort : undefined,
        page: String(newPage),
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Active filter tags
  const activeFilterTags: { label: string; onRemove: () => void }[] = [];
  filterState.colors.forEach((c) =>
    activeFilterTags.push({
      label: `Màu: ${c}`,
      onRemove: () => handleFilterChange({ ...filterState, colors: filterState.colors.filter((x) => x !== c) }),
    })
  );
  filterState.sizes.forEach((s) =>
    activeFilterTags.push({
      label: `Size: ${s}`,
      onRemove: () => handleFilterChange({ ...filterState, sizes: filterState.sizes.filter((x) => x !== s) }),
    })
  );
  if (filterState.minPrice !== undefined || filterState.maxPrice !== undefined) {
    const label =
      filterState.maxPrice !== undefined
        ? `${(filterState.minPrice ?? 0).toLocaleString('vi-VN')}₫ - ${filterState.maxPrice.toLocaleString('vi-VN')}₫`
        : `Trên ${(filterState.minPrice ?? 0).toLocaleString('vi-VN')}₫`;
    activeFilterTags.push({
      label: `Giá: ${label}`,
      onRemove: () => handleFilterChange({ ...filterState, minPrice: undefined, maxPrice: undefined }),
    });
  }

  const handleWishlistClick = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    if (!token) {
      alert('Vui lòng đăng nhập để lưu sản phẩm yêu thích.');
      return;
    }
    await toggleWishlist(productId);
  };

  const currentSortLabel = sortOptions.find((o) => o.value === currentSort)?.label || 'Mới nhất';

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-lg min-h-[60vh]">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex text-on-surface-variant mb-gutter font-body-sm text-body-sm">
        <ol className="inline-flex items-center space-x-1 md:space-x-2">
          <li className="inline-flex items-center">
            <Link className="inline-flex items-center hover:text-primary transition-colors" to="/">
              Trang chủ
            </Link>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <span className="material-symbols-outlined text-[16px] mx-1">chevron_right</span>
              <span className="text-primary font-medium ml-1 md:ml-2">
                {isSearchPage ? 'Tìm kiếm' : currentCategoryName}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Page Header & Sort */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-md">
        <div>
          <h1 className="font-headline-xl text-headline-xl text-primary mb-sm md:mb-0">
            {isSearchPage ? 'Tìm kiếm' : currentCategoryName}
          </h1>
          {isSearchPage && searchKeyword && (
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Kết quả cho "{searchKeyword}"
              {pageData && <span className="ml-1">({pageData.totalElements} sản phẩm)</span>}
            </p>
          )}
          {!isSearchPage && pageData && (
            <p className="font-body-sm text-body-sm text-text-muted mt-1">
              {pageData.totalElements} sản phẩm
            </p>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="relative mt-sm md:mt-0">
          <button
            onClick={() => setSortOpen(!sortOpen)}
            className="flex items-center justify-between w-48 px-sm py-2 border border-border-subtle rounded text-on-surface bg-surface font-body-sm text-body-sm hover:border-primary transition-colors"
          >
            <span>Sắp xếp: {currentSortLabel}</span>
            <span className="material-symbols-outlined text-[18px]">
              {sortOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>
          {sortOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border-subtle shadow-sm z-20 rounded">
                <ul className="py-1 font-body-sm text-body-sm text-on-surface">
                  {sortOptions.map((option) => (
                    <li key={option.value}>
                      <button
                        onClick={() => handleSortChange(option.value)}
                        className={`block w-full text-left px-sm py-2 hover:bg-surface-alt transition-colors ${
                          currentSort === option.value ? 'bg-surface-alt font-medium' : ''
                        }`}
                      >
                        {option.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Active Filter Tags */}
      {activeFilterTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-md">
          {activeFilterTags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-sm py-1 bg-surface-alt border border-border-subtle rounded-full font-body-sm text-body-sm text-primary"
            >
              {tag.label}
              <button
                onClick={tag.onRemove}
                className="hover:text-on-tertiary-container transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-xl">
        {/* Sidebar Filter */}
        <ProductFilterSidebar filters={filterState} onFilterChange={handleFilterChange} />

        {/* Main Product Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
            </div>
          ) : pageData?.content && pageData.content.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-x-gutter gap-y-lg">
                {pageData.content.map((product) => (
                  <Link key={product.id} to={`/product/${product.slug}`} className="group relative flex flex-col cursor-pointer">
                    <div className="relative w-full aspect-[3/4] bg-surface-alt rounded-lg overflow-hidden mb-sm">
                      <img
                        alt={product.name}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                        src={product.thumbnailUrl || 'https://via.placeholder.com/400x533?text=No+Image'}
                      />
                      {product.salePrice && (
                        <div className="absolute top-sm left-sm bg-[#C1272D] text-white font-label-caps text-[10px] tracking-wider px-2 py-1 rounded-sm z-10">
                          SALE
                        </div>
                      )}
                      <button 
                        onClick={(e) => handleWishlistClick(e, product.id)} 
                        className={`absolute top-sm right-sm transition-colors z-10 flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm ${wishlistProductIds.includes(product.id) ? 'text-error' : 'text-surface hover:text-error'}`}
                      >
                        <span 
                          className="material-symbols-outlined text-[20px]" 
                          data-weight={wishlistProductIds.includes(product.id) ? 'fill' : undefined}
                        >
                          favorite
                        </span>
                      </button>

                      {/* Hover Quick Add overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-sm translate-y-full group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100 bg-gradient-to-t from-black/50 to-transparent">
                        <button onClick={(e) => e.preventDefault()} className="w-full bg-surface text-primary font-label-caps text-label-caps py-2 rounded">
                          QUICK ADD
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <h3 className="font-body-md text-body-md text-primary truncate" title={product.name}>
                        {product.name}
                      </h3>
                      <div className="flex items-center space-x-2 font-price-display text-price-display">
                        {product.salePrice ? (
                          <>
                            <span className="text-[#C1272D]">
                              {product.salePrice.toLocaleString('vi-VN')}₫
                            </span>
                            <span className="text-text-muted text-[14px] line-through">
                              {product.basePrice.toLocaleString('vi-VN')}₫
                            </span>
                          </>
                        ) : (
                          <span className="text-primary">
                            {product.basePrice.toLocaleString('vi-VN')}₫
                          </span>
                        )}
                      </div>

                      {/* Color dots */}
                      {product.colors && product.colors.length > 0 && (
                        <div className="flex space-x-1 pt-1">
                          {product.colors.slice(0, 4).map((color, idx) => (
                            <div
                              key={idx}
                              className="w-3 h-3 rounded-full border border-border-subtle"
                              title={color}
                              style={{ backgroundColor: getHexColor(color) }}
                            ></div>
                          ))}
                          {product.colors.length > 4 && (
                            <span className="text-[10px] text-text-muted flex items-center">+{product.colors.length - 4}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {pageData.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-sm mt-xl pt-lg border-t border-border-subtle">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="w-10 h-10 flex items-center justify-center rounded border border-border-subtle text-on-surface-variant hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>

                  <div className="flex space-x-2 font-body-md text-body-md">
                    {Array.from({ length: pageData.totalPages }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => handlePageChange(idx)}
                        className={`w-10 h-10 flex items-center justify-center rounded transition-colors ${
                          currentPage === idx
                            ? 'bg-primary text-white font-medium border border-primary'
                            : 'border border-transparent hover:bg-surface-alt text-on-surface-variant'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pageData.totalPages - 1}
                    className="w-10 h-10 flex items-center justify-center rounded border border-border-subtle text-on-surface-variant hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-6xl text-border-subtle mb-4">inventory_2</span>
              <p className="text-on-surface-variant font-body-lg">
                {isSearchPage
                  ? 'Không tìm thấy sản phẩm phù hợp với từ khóa của bạn.'
                  : 'Không có sản phẩm nào trong danh mục này.'}
              </p>
              <Link to="/" className="inline-block mt-4 text-primary font-medium hover:underline">
                Quay lại trang chủ
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
