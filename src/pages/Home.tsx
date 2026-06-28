import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bannerService, type BannerResponse } from '@/services/banner.service';
import { productService, type ProductGridResponse } from '@/services/product.service';
import { collectionService, type CollectionResponse } from '@/services/collection.service';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const [banners, setBanners] = useState<BannerResponse[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [newArrivals, setNewArrivals] = useState<ProductGridResponse[]>([]);
  const [newArrivalsSlide, setNewArrivalsSlide] = useState(0);
  const [bestSellers, setBestSellers] = useState<ProductGridResponse[]>([]);
  const [bestSellerCollection, setBestSellerCollection] = useState<CollectionResponse | null>(null);
  const navigate = useNavigate();
  const { wishlistProductIds, toggleWishlist } = useWishlistStore();
  const { token } = useAuthStore();

  const handleWishlistClick = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) {
      alert('Vui lòng đăng nhập để lưu sản phẩm yêu thích.');
      return;
    }
    await toggleWishlist(productId);
  };

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const data = await bannerService.getActiveBanners();
        setBanners(data);
      } catch (error) {
        console.error('Failed to fetch banners', error);
      }
    };
    const fetchNewArrivals = async () => {
      try {
        const data = await productService.getNewArrivals();
        setNewArrivals(data);
      } catch (error) {
        console.error('Failed to fetch new arrivals', error);
      }
    };
    const fetchBestSellers = async () => {
      try {
        const data = await productService.getBestSellers();
        setBestSellers(data);
      } catch (error) {
        console.error('Failed to fetch best sellers', error);
      }
    };
    const fetchBestSellerCollection = async () => {
      try {
        const data = await collectionService.getCollectionBySlug('best-sellers');
        setBestSellerCollection(data);
      } catch (error) {
        console.error('Failed to fetch best seller collection', error);
      }
    };
    fetchBanners();
    fetchNewArrivals();
    fetchBestSellers();
    fetchBestSellerCollection();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const handleBannerClick = (url: string | null) => {
    if (!url) return;
    if (url.startsWith('http')) {
      window.open(url, '_blank');
    } else {
      navigate(url);
    }
  };

  return (
    <>
      {/* Hero Section / Banner Slider */}
      <section className={`w-full relative flex items-center justify-center max-w-container-max mx-auto overflow-hidden ${banners.length > 0 ? 'aspect-[4/3] md:aspect-[21/9] lg:aspect-[3/1] mt-4 mb-8 px-margin-mobile md:px-margin-desktop' : 'h-[819px] px-margin-mobile md:px-margin-desktop py-lg'}`}>
        {banners.length > 0 ? (
          <div className="relative w-full h-full rounded-2xl overflow-hidden">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentSlide ? 'opacity-100 pointer-events-auto cursor-pointer' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => handleBannerClick(banner.linkUrl)}
              >
                <img
                  alt={banner.title}
                  className="w-full h-full object-cover object-center"
                  src={banner.imageUrl}
                />
                <div className="absolute inset-0 bg-black/10"></div>
              </div>
            ))}
            
            {/* Slider Dots */}
            {banners.length > 1 && (
              <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-2">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentSlide(index);
                    }}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentSlide ? 'bg-primary scale-125' : 'bg-white/50 hover:bg-white/80'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          // Fallback Default Hero
          <>
            <div className="absolute inset-0 z-0 hidden md:block">
              <img alt="Fashion Lifestyle" className="w-full h-full object-cover object-right opacity-90" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5eyuvbKPl3iPD6MNXz1bsAk33lSzohI_u8pRgWyGX-U4stWMb9ivgvNwtqVtOw0sbXRR32GnC-B0EaRl0VURxQZxkj-cKGVebDdFLhL4nqI5rcvzjoiiAAFn4RihXxXvFMbs8--jINLzN4IQlDvdbkxIOQcvDG45rvrdgQeAgRJybWnNTUnly2Kmlw0mNDNtdbEy6vzGGPqFlBmBt-jM-5lG8glrYkEzmWKkO0SAy6yGKb00gvI9VF27VNHkGCl-5yo8BXgVtWQ" />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent"></div>
            </div>
            <div className="absolute inset-0 z-0 block md:hidden">
              <img alt="Fashion Lifestyle Mobile" className="w-full h-full object-cover object-top opacity-30" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBOFRqN_Gu6-I8O59dvfqdFtRSmWtsMgTonpea5Z2axxT1iHJE-6Cb7J8ynngoDlWSdZq84aMzViMf5YjkZ1ixcRyRguM5H1DZjhrPCyPbi66Rg7Dtuy6X4cfxAVM5uz9hcRa1CZwv8sVfxCzApWKaN3dpwIaFw0mQJtu8ekQ_jUJPn2tH-MM62_OFm-kwcalhuKF4r8-T-U3E_sruJ5Z6zNrn--hZ7ykS10plLmeGS2MVRSQax-w-9z6PNG51DzaJLHtSrEW_N8g" />
            </div>
            <div className="relative z-10 w-full flex flex-col md:flex-row items-center h-full pointer-events-none">
              <div className="w-full md:w-1/2 flex flex-col justify-center gap-6 h-full text-center md:text-left pt-20 md:pt-0 pointer-events-auto">
                <h1 className="font-display-hero text-headline-lg-mobile md:text-display-hero text-primary">
                  Phong cách của bạn,<br /> câu chuyện của bạn
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md mx-auto md:mx-0">
                  Khám phá bộ sưu tập mới nhất với thiết kế tối giản, tinh tế, mang đến sự tự tin cho mọi khoảnh khắc.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mt-4 justify-center md:justify-start">
                  <button className="bg-primary text-on-primary px-8 py-3 rounded hover:scale-[1.02] transition-transform font-label-caps text-label-caps shadow-sm">
                    Khám phá ngay
                  </button>
                  <button className="bg-transparent border-[1.5px] border-primary text-primary px-8 py-3 rounded hover:bg-surface-alt transition-colors font-label-caps text-label-caps">
                    Xem bộ sưu tập
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
      
      {/* Trust Badges Strip */}
      <section className="bg-surface-alt py-6 border-y border-border-subtle">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl">local_shipping</span>
              <span className="font-label-caps text-label-caps text-primary">Miễn phí giao hàng</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl">cached</span>
              <span className="font-label-caps text-label-caps text-primary">15 ngày đổi trả</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl">verified</span>
              <span className="font-label-caps text-label-caps text-primary">Hàng chính hãng</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl">lock</span>
              <span className="font-label-caps text-label-caps text-primary">Thanh toán bảo mật</span>
            </div>
          </div>
        </div>
      </section>

      {/* Hàng Mới Về */}
      <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-xl">
        <div className="flex justify-between items-end mb-8">
          <h2 className="font-headline-xl text-headline-xl text-primary">Hàng Mới Về</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setNewArrivalsSlide(prev => Math.max(0, prev - 1))}
              disabled={newArrivalsSlide === 0}
              className="w-10 h-10 rounded-full border border-border-subtle flex items-center justify-center hover:bg-surface-alt disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button 
              onClick={() => setNewArrivalsSlide(prev => Math.min(Math.ceil(newArrivals.length / 4) - 1, prev + 1))}
              disabled={newArrivalsSlide >= Math.ceil(newArrivals.length / 4) - 1 || newArrivals.length === 0}
              className="w-10 h-10 rounded-full border border-border-subtle flex items-center justify-center hover:bg-surface-alt disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
        <div className="overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-in-out" 
            style={{ transform: `translateX(-${newArrivalsSlide * 100}%)` }}
          >
            {newArrivals.map((product) => (
              <div key={product.id} className="w-full sm:w-1/2 lg:w-1/4 px-2 md:px-2 flex-shrink-0">
                <Link to={`/product/${product.slug}`} className="group cursor-pointer flex flex-col gap-3 relative h-full">
                  <div className="relative aspect-[3/4] overflow-hidden bg-surface-container-low rounded-DEFAULT">
                    <div className="absolute top-2 left-2 z-10 bg-on-tertiary-container text-white font-label-caps text-[10px] px-2 py-1 rounded-sm">
                      MỚI
                    </div>
                    {product.salePrice && (
                      <div className="absolute top-2 left-12 z-10 bg-error text-white font-label-caps text-[10px] px-2 py-1 rounded-sm">
                        -{Math.round((1 - product.salePrice / product.basePrice) * 100)}%
                      </div>
                    )}
                    <button onClick={(e) => handleWishlistClick(e, product.id)} className={`absolute top-2 right-2 z-10 p-1.5 bg-white/80 backdrop-blur-sm rounded-full transition-colors ${wishlistProductIds.includes(product.id) ? 'text-error' : 'text-on-surface-variant hover:text-error'}`}>
                      <span className="material-symbols-outlined text-[18px]" data-weight={wishlistProductIds.includes(product.id) ? 'fill' : undefined}>favorite</span>
                    </button>
                    <img alt={product.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src={product.thumbnailUrl || 'https://via.placeholder.com/300x400'} />
                    <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/50 to-transparent flex justify-center items-end hidden lg:flex">
                      <span className="w-full text-center bg-surface/90 backdrop-blur-md text-primary font-label-caps text-label-caps py-2 rounded hover:bg-primary hover:text-on-primary transition-colors shadow-sm">
                        MUA NGAY
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-body-md text-body-md text-primary truncate">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {product.salePrice ? (
                        <>
                          <span className="font-price-display text-price-display text-on-tertiary-container">{product.salePrice.toLocaleString('vi-VN')}₫</span>
                          <span className="font-price-display text-price-display text-on-surface-variant line-through text-[14px]">{product.basePrice.toLocaleString('vi-VN')}₫</span>
                        </>
                      ) : (
                        <span className="font-price-display text-price-display text-primary">{product.basePrice.toLocaleString('vi-VN')}₫</span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bán Chạy Nhất (Bento Grid Style) */}
      <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-xl">
        <div className="flex justify-between items-end mb-8">
          <h2 className="font-headline-xl text-headline-xl text-primary">Bán Chạy Nhất</h2>
        </div>
        {/* Asymmetric Bento Layout for Desktop, Standard Grid for Mobile */}
        <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-4 md:gap-gutter h-auto md:h-[800px]">
          {/* Large Feature Banner */}
          <div className="col-span-2 row-span-2 group cursor-pointer relative overflow-hidden rounded-DEFAULT bg-surface-container-low hidden md:block">
            <img alt={bestSellerCollection?.name || "Bộ sưu tập best seller"} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={bestSellerCollection?.bannerUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuB8mrv46vmqbkFDxQ6h7gshYGb6KK8UxI8FsdU323R3Bjn0xYnbXrg4g7F7-SL_zdmUDbX19XgxJdxg_EJ6H1ZNYiO3MQJB7JtuxnK_l_sKEb3pj9oi7eQcq3ttHxT_fKSR3xd9SVarhnIYiCObMcA0inYEYxfRXAUzIo5dw1WljtuzGf8oIfdzeMze0BtEVJ30cegfCBcx1AcHRZHJeiOq2rhT-I5_3jL7P_G1xgPRHuz-pbq_S6gkt4ypy93zMWzlX-EbVmJBww"} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col justify-end p-8">
              <h3 className="font-headline-md text-headline-md text-white mb-2">{bestSellerCollection?.name || "Bộ sưu tập Best Seller"}</h3>
              <p className="font-body-md text-body-md text-surface mb-6 max-w-sm">
                {bestSellerCollection?.description || "Những thiết kế được yêu thích nhất mùa này. Khám phá ngay để không bỏ lỡ."}
              </p>
              <button onClick={(e) => { e.preventDefault(); navigate('/collections/best-sellers'); }} className="bg-white text-primary px-6 py-3 rounded-DEFAULT font-label-caps text-label-caps hover:bg-surface-container transition-colors w-fit">
                KHÁM PHÁ NGAY
              </button>
            </div>
          </div>
          {/* Standard Product Cards (Fill remaining grid) */}
          {bestSellers.map((product) => (
            <Link key={product.id} to={`/product/${product.slug}`} className="col-span-1 row-span-1 group cursor-pointer flex flex-col gap-3 relative h-full">
              <div className="relative flex-grow overflow-hidden bg-surface-container-low rounded-DEFAULT">
                {product.salePrice && (
                  <div className="absolute top-2 left-2 z-10 bg-error text-white font-label-caps text-[10px] px-2 py-1 rounded-sm">
                    -{Math.round((1 - product.salePrice / product.basePrice) * 100)}%
                  </div>
                )}
                <button onClick={(e) => handleWishlistClick(e, product.id)} className={`absolute top-2 right-2 z-10 p-1.5 bg-white/80 backdrop-blur-sm rounded-full transition-colors ${wishlistProductIds.includes(product.id) ? 'text-error' : 'text-on-surface-variant hover:text-error'}`}>
                  <span className="material-symbols-outlined text-[18px]" data-weight={wishlistProductIds.includes(product.id) ? 'fill' : undefined}>favorite</span>
                </button>
                <img alt={product.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src={product.thumbnailUrl || 'https://via.placeholder.com/300x400'} />
              </div>
              <div className="mt-auto pt-2">
                <h3 className="font-body-md text-body-md text-primary truncate">{product.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {product.salePrice ? (
                    <>
                      <span className="font-price-display text-price-display text-on-tertiary-container">{product.salePrice.toLocaleString('vi-VN')}₫</span>
                      <span className="font-price-display text-price-display text-on-surface-variant line-through text-[14px]">{product.basePrice.toLocaleString('vi-VN')}₫</span>
                    </>
                  ) : (
                    <span className="font-price-display text-price-display text-primary">{product.basePrice.toLocaleString('vi-VN')}₫</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
