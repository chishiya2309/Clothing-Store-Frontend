import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { wishlistService } from '@/services/wishlist.service';
import { type PageResponse, type ProductGridResponse } from '@/services/product.service';
import { useWishlistStore } from '@/store/wishlistStore';

export default function Wishlist() {
  const [pageData, setPageData] = useState<PageResponse<ProductGridResponse> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const { toggleWishlist } = useWishlistStore();

  const fetchWishlist = async (page: number) => {
    setIsLoading(true);
    try {
      const data = await wishlistService.getWishlist(page, 12);
      setPageData(data);
    } catch (error) {
      alert('Lỗi khi tải danh sách yêu thích');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist(currentPage);
  }, [currentPage]);

  const handleRemove = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    await toggleWishlist(productId);
    // Refresh page data
    fetchWishlist(currentPage);
  };

  const handlePageChange = (newPage: number) => {
    if (pageData && newPage >= 0 && newPage < pageData.totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl p-md border border-border-subtle shadow-sm min-h-[60vh]">
      <h1 className="font-headline-md text-headline-md text-primary mb-lg border-b border-border-subtle pb-4">
        Sản phẩm yêu thích của bạn
      </h1>

      {pageData?.content && pageData.content.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-gutter gap-y-lg">
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
                    onClick={(e) => handleRemove(e, product.id)} 
                    className="absolute top-sm right-sm text-error hover:text-error/80 transition-colors z-10 flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm"
                    title="Bỏ yêu thích"
                  >
                    <span className="material-symbols-outlined text-[20px]" data-weight="fill">
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
          <span className="material-symbols-outlined text-6xl text-border-subtle mb-4">favorite_border</span>
          <p className="text-on-surface-variant font-body-lg">
            Bạn chưa lưu sản phẩm nào.
          </p>
          <Link to="/" className="inline-block mt-4 text-primary font-medium hover:underline">
            Tiếp tục mua sắm
          </Link>
        </div>
      )}
    </div>
  );
}
