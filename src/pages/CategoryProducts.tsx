import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productService, type ProductGridResponse, type PageResponse } from '@/services/product.service';
import { useCategoryStore } from '@/store/categoryStore';

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
  return colorMap[normalized] || normalized; // fallback
};

export default function CategoryProducts() {
  const { slug } = useParams<{ slug: string }>();
  const [pageData, setPageData] = useState<PageResponse<ProductGridResponse> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { categories } = useCategoryStore();

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

  const currentCategoryName = findCategoryName(categories, slug || '') || 'Tất cả sản phẩm';

  useEffect(() => {
    const fetchProducts = async () => {
      if (!slug) return;
      setIsLoading(true);
      try {
        const data = await productService.getProductsByCategory(slug, currentPage, 12);
        setPageData(data);
      } catch (error) {
        console.error('Failed to fetch products', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [slug, currentPage]);

  // Reset page when slug changes
  useEffect(() => {
    setCurrentPage(0);
  }, [slug]);

  const handlePageChange = (newPage: number) => {
    if (pageData && newPage >= 0 && newPage < pageData.totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
              <span className="text-primary font-medium ml-1 md:ml-2">{currentCategoryName}</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Page Header & Sort */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-lg">
        <h1 className="font-headline-xl text-headline-xl text-primary mb-sm md:mb-0">
          {currentCategoryName}
        </h1>
        <div className="relative group">
          <button className="flex items-center justify-between w-48 px-sm py-2 border border-border-subtle rounded text-on-surface bg-surface font-body-sm text-body-sm hover:border-primary transition-colors">
            <span>Sắp xếp: Mới nhất</span>
            <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-xl">
        {/* Main Product Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
            </div>
          ) : pageData?.content && pageData.content.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-gutter gap-y-lg">
                {pageData.content.map((product) => (
                  <div key={product.id} className="group relative flex flex-col cursor-pointer">
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
                      <button className="absolute top-sm right-sm text-surface bg-transparent hover:text-primary transition-colors z-10 flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm">
                        <span className="material-symbols-outlined text-[20px]">favorite</span>
                      </button>
                      
                      {/* Hover Quick Add overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-sm translate-y-full group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100 bg-gradient-to-t from-black/50 to-transparent">
                        <button className="w-full bg-surface text-primary font-label-caps text-label-caps py-2 rounded">
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
                  </div>
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
              <p className="text-on-surface-variant font-body-lg">Không có sản phẩm nào trong danh mục này.</p>
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
