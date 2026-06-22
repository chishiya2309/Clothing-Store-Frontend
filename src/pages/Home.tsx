import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bannerService, type BannerResponse } from '@/services/banner.service';

export default function Home() {
  const [banners, setBanners] = useState<BannerResponse[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const data = await bannerService.getActiveBanners();
        setBanners(data);
      } catch (error) {
        console.error('Failed to fetch banners', error);
      }
    };
    fetchBanners();
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
          <Link className="font-label-caps text-label-caps text-primary hover:text-on-surface-variant transition-colors border-b border-primary pb-1 hidden sm:inline-block" to="#">XEM TẤT CẢ</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-gutter">
          {/* Product Card 1 */}
          <Link to="/product/ao-khoac-blazer-toi-gian-premium" className="group cursor-pointer flex flex-col gap-3 relative">
            <div className="relative aspect-[3/4] overflow-hidden bg-surface-container-low rounded-DEFAULT">
              <div className="absolute top-2 left-2 z-10 bg-on-tertiary-container text-white font-label-caps text-[10px] px-2 py-1 rounded-sm">
                MỚI
              </div>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="absolute top-2 right-2 z-10 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-on-surface-variant hover:text-on-tertiary-container transition-colors">
                <span className="material-symbols-outlined text-[18px]">favorite</span>
              </button>
              <img alt="Áo khoác blazer tối giản" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRJlN4FLfPBoTEmZS-iRzQN4VCg-7z0p9TVlTtkw1Ud3LngFPhL5fKocyZDwHstH_LcTKVUGtlVGGQZNjE078tRyK0nXeOko8wsIuQl7MsAJfsloTRLuvdAfKH6w7ADUF3JEz1M4Bqq583eL61CKiENzfBzO_8hHNyixrnSDdnfchs0tWxN6OviOyrljag1BsrJ-tA9cJYf48v3jqdYqB3_WRPOqSgnQ82zOOnKcSE4Khp7ZY6zYX-j5kP75UDFRLuQWAh3AmRYw" />
              {/* Quick Add Overlay on Hover */}
              <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/50 to-transparent flex justify-center items-end hidden lg:flex">
                <span className="w-full text-center bg-surface/90 backdrop-blur-md text-primary font-label-caps text-label-caps py-2 rounded hover:bg-primary hover:text-on-primary transition-colors shadow-sm">
                  MUA NGAY
                </span>
              </div>
            </div>
            <div>
              <h3 className="font-body-md text-body-md text-primary truncate">Áo Khoác Blazer Tối Giản</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-price-display text-price-display text-primary">890.000₫</span>
              </div>
            </div>
          </Link>
          {/* Product Card 2 */}
          <Link to="/product/ao-thun-nam-basic-co-tron" className="group cursor-pointer flex flex-col gap-3 relative">
            <div className="relative aspect-[3/4] overflow-hidden bg-surface-container-low rounded-DEFAULT">
              <div className="absolute top-2 left-2 z-10 bg-error text-white font-label-caps text-[10px] px-2 py-1 rounded-sm">
                -30%
              </div>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="absolute top-2 right-2 z-10 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-on-surface-variant hover:text-on-tertiary-container transition-colors">
                <span className="material-symbols-outlined text-[18px]">favorite</span>
              </button>
              <img alt="Áo thun cotton cơ bản" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDU1YD_jRWzG-eeFPY-iOWSeTYHRNZD7VTwB47HyCcL9Xu2J8xHzxGpI85YCKN3zv9go0cxe1pWNT28Ry7hkVKdtKhpr-b3Tkpb1iH5CkNYIdFJGjs_rHjKJ7yvd_Xaq8758Gg_v8P7DwgdUw7Kn2K7snZ8uoR-xrlMaJpsJ4KwbRHYCMtJld0FzY2LI_Dk2iRSbgBQBXgnS9JrbRPCVlFy8PPOWtN_opuVUK5NQlcpkihGgucW5DkfZYzWiLa0PuDKm4d1NtQZkw" />
              <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/50 to-transparent flex justify-center items-end hidden lg:flex">
                <span className="w-full text-center bg-surface/90 backdrop-blur-md text-primary font-label-caps text-label-caps py-2 rounded hover:bg-primary hover:text-on-primary transition-colors shadow-sm">
                  MUA NGAY
                </span>
              </div>
            </div>
            <div>
              <h3 className="font-body-md text-body-md text-primary truncate">Áo Thun Cotton Cổ Tròn</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-price-display text-price-display text-on-tertiary-container">169.000₫</span>
                <span className="font-price-display text-price-display text-on-surface-variant line-through text-[14px]">199.000₫</span>
              </div>
            </div>
          </Link>
          {/* Product Card 3 */}
          <Link to="/product/quan-jeans-nam-slim-fit" className="group cursor-pointer flex flex-col gap-3 relative">
            <div className="relative aspect-[3/4] overflow-hidden bg-surface-container-low rounded-DEFAULT">
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="absolute top-2 right-2 z-10 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-on-surface-variant hover:text-on-tertiary-container transition-colors">
                <span className="material-symbols-outlined text-[18px]">favorite</span>
              </button>
              <img alt="Quần jeans ống rộng" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC32V5AB3ro0thQgmNd4uaRL1kpC9n7-CgUqntAHAiR-Aub87r11XWasIH8yr_ncvTWMnaMsaN3cs-xujW0tSlEgJKrOlqrIsGOXKCH638_QaQH2bl-4UjNK86s7IflXpbOk_fAkbLleIit0Po7L0COdVnvOCFnfkB1j2Y3HlD9uqUqyWaot0y_-w1EEu52haCbM4tC77X0cL4slFo23pWI2RtHFHdoBmL_QjV5s-iSREqUezcX0yKC7iTTGLF7ApzGCLxWYreR2Q" />
              <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/50 to-transparent flex justify-center items-end hidden lg:flex">
                <span className="w-full text-center bg-surface/90 backdrop-blur-md text-primary font-label-caps text-label-caps py-2 rounded hover:bg-primary hover:text-on-primary transition-colors shadow-sm">
                  MUA NGAY
                </span>
              </div>
            </div>
            <div className="">
              <h3 className="font-body-md text-body-md text-primary truncate">Quần Jeans Slim Fit</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-price-display text-price-display text-primary">480.000₫</span>
              </div>
            </div>
          </Link>
          {/* Product Card 4 */}
          <Link to="/product/ao-so-mi-nam-linen-casual" className="group cursor-pointer flex flex-col gap-3 relative">
            <div className="relative aspect-[3/4] overflow-hidden bg-surface-container-low rounded-DEFAULT">
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="absolute top-2 right-2 z-10 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-on-surface-variant hover:text-on-tertiary-container transition-colors">
                <span className="material-symbols-outlined text-[18px]">favorite</span>
              </button>
              <img alt="Áo sơ mi linen" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBVbihwf9jARwC5ifZdwqzqAtNhntu3jQa5KHCTqW7pIWHf-pKW59h1mqr4YPXOm4G6KcStX0cpWjRGQ3oH_BRFdlj4BhjfLjL9HT6Psf2usVtCChhV735M-hOAIFIW0t7NmXP1vmiLrLHjFkfdc31pLP45_-OLOmY5j-6fCeAToi0HXjRo2XTZke_Dtz-Optmhrrfy8L0QzLfdjtnNnx5MupHRqWLcxaYYUlWbxFE-zfqKCD2wY9BNBEjk_75M5emIk_mQUwrihQ" />
              <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/50 to-transparent flex justify-center items-end hidden lg:flex">
                <span className="w-full text-center bg-surface/90 backdrop-blur-md text-primary font-label-caps text-label-caps py-2 rounded hover:bg-primary hover:text-on-primary transition-colors shadow-sm">
                  MUA NGAY
                </span>
              </div>
            </div>
            <div>
              <h3 className="font-body-md text-body-md text-primary truncate">Áo Sơ Mi Linen Nam</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-price-display text-price-display text-primary">520.000₫</span>
              </div>
            </div>
          </Link>
        </div>
        <div className="mt-8 flex justify-center sm:hidden">
          <button className="bg-transparent border-[1.5px] border-primary text-primary px-6 py-2 rounded font-label-caps text-label-caps w-full">
            XEM TẤT CẢ HÀNG MỚI
          </button>
        </div>
      </section>

      {/* Bán Chạy Nhất (Bento Grid Style) */}
      <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-xl">
        <div className="flex justify-between items-end mb-8">
          <h2 className="font-headline-xl text-headline-xl text-primary">Bán Chạy Nhất</h2>
          <Link className="font-label-caps text-label-caps text-primary hover:text-on-surface-variant transition-colors border-b border-primary pb-1 hidden sm:inline-block" to="#">XEM TẤT CẢ</Link>
        </div>
        {/* Asymmetric Bento Layout for Desktop, Standard Grid for Mobile */}
        <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-4 md:gap-gutter h-auto md:h-[800px]">
          {/* Large Feature (Spans 2 cols, 2 rows on desktop) */}
          <div className="col-span-2 row-span-2 group cursor-pointer relative overflow-hidden rounded-DEFAULT bg-surface-container-low hidden md:block">
            <img alt="Bộ sưu tập best seller" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8mrv46vmqbkFDxQ6h7gshYGb6KK8UxI8FsdU323R3Bjn0xYnbXrg4g7F7-SL_zdmUDbX19XgxJdxg_EJ6H1ZNYiO3MQJB7JtuxnK_l_sKEb3pj9oi7eQcq3ttHxT_fKSR3xd9SVarhnIYiCObMcA0inYEYxfRXAUzIo5dw1WljtuzGf8oIfdzeMze0BtEVJ30cegfCBcx1AcHRZHJeiOq2rhT-I5_3jL7P_G1xgPRHuz-pbq_S6gkt4ypy93zMWzlX-EbVmJBww" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-8">
              <span className="bg-on-tertiary-container text-white font-label-caps text-[12px] px-3 py-1 rounded-sm w-max mb-3">BEST SELLER</span>
              <h3 className="font-headline-lg text-headline-lg text-white mb-2">Signature Collection</h3>
              <p className="font-body-md text-white/80 mb-4 max-w-sm">Khám phá những thiết kế được yêu thích nhất, định hình phong cách hàng ngày của bạn.</p>
              <button className="bg-white text-primary px-6 py-2 rounded w-max hover:bg-surface-alt transition-colors font-label-caps text-label-caps">
                MUA NGAY
              </button>
            </div>
          </div>
          {/* Standard Product Cards (Fill remaining grid) */}
          <Link to="/product/ao-thun-nam-basic-co-tron" className="col-span-1 row-span-1 group cursor-pointer flex flex-col gap-3 relative h-full">
            <div className="relative flex-grow overflow-hidden bg-surface-container-low rounded-DEFAULT">
              <div className="absolute top-2 left-2 z-10 bg-error text-white font-label-caps text-[10px] px-2 py-1 rounded-sm">
                -15%
              </div>
              <img alt="Áo thun đen basic" className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9tVftXa80eWkvcEkP9dX5UkHeKkh5TbV-HiYmOid4VWzIm2MUgLvygFFnIoNdJyuqrBUUC33pCNfr5wO59aDRC8KvrLVGoIKa5irrRE87EybRMcC7m6SV_frBP_P-k6yaZEmE36389hZ3MCQ_zQr0QXCqD5_RoDBaPp_BClCPO-UDXEyg8b-5JUDyXfMbrlp12aq6kbENNfQ2e1pk-vv3hV4y9S5qzF0BKbr2BjeA__AjvrSImLRqJ1QyPR4IQ2KDvzHm8RsDuA" />
            </div>
            <div className="mt-auto pt-2">
              <h3 className="font-body-md text-body-md text-primary truncate">Áo Thun Đen Basic</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-price-display text-price-display text-on-tertiary-container">169.000₫</span>
                <span className="font-price-display text-price-display text-on-surface-variant line-through text-[14px]">199.000₫</span>
              </div>
            </div>
          </Link>
          <Link to="/product/dam-lien-hoa-nhi-vintage" className="col-span-1 row-span-1 group cursor-pointer flex flex-col gap-3 relative h-full">
            <div className="relative flex-grow overflow-hidden bg-surface-container-low rounded-DEFAULT">
              <img alt="Áo khoác da nữ" className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlKXVmOIon8rzTKdal-jG7UxJBzgPqEoDEaTP2ws3lGHP2doG3QgDEO3A9fK6Qjox6xEZJHvwIuQ9LhBnLoXtIhFs1L1m-mAO3mLs2ablPiT26ByY6BV27vrOc5tKJcfuhlBBQTFLpDwh8fWslDToFWMGQMBK0BdAOgqXeB-eD03VHJ06rFOkoZn9Yu4M_kakL-0xAXWsF85d2n2HKx_jpnWmMIv7igZ7BZXjZH0bu4Y764eM0NxBa74Vh6gJvdHs_HPr9mJ6rzw" />
            </div>
            <div className="mt-auto pt-2">
              <h3 className="font-body-md text-body-md text-primary truncate">Đầm Liền Hoa Nhí</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-price-display text-price-display text-primary">499.000₫</span>
              </div>
            </div>
          </Link>
          <Link to="/product/ao-so-mi-nu-lua-co-v" className="col-span-1 row-span-1 group cursor-pointer flex flex-col gap-3 relative h-full">
            <div className="relative flex-grow overflow-hidden bg-surface-container-low rounded-DEFAULT">
              <img alt="Váy lụa midi" className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVoG9XPJ0DN-eZyAGepAPaRykwpOxDIiPtKPc7CcDlcRWfvKFRYcBA7-EkrWMA0-CaXO_JPpwC3wLO32lGyqPmVf3PHg3C-nts5rm4DZ7LX1O1-2IALBlFDLngecgnWu3bQQpHUvCWkeQUHYbg1KalOI5U3y8k4wEfL6XSFTYdvIajtvx7l7dnHeTwr8SRkwpCmJplvlNoFYaGjKAU9NFaXujJi1midqzsJ5JAydPFLBe0FPxcSvK7vqgoiwFtFqnAxzOU7QOa7A" />
            </div>
            <div className="mt-auto pt-2">
              <h3 className="font-body-md text-body-md text-primary truncate">Áo Sơ Mi Nữ Lụa Cổ V</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-price-display text-price-display text-primary">550.000₫</span>
              </div>
            </div>
          </Link>
          <Link to="/product/ao-thun-nu-baby-tee" className="col-span-1 row-span-1 group cursor-pointer flex flex-col gap-3 relative h-full">
            <div className="relative flex-grow overflow-hidden bg-surface-container-low rounded-DEFAULT">
              <div className="absolute top-2 left-2 z-10 bg-error text-white font-label-caps text-[10px] px-2 py-1 rounded-sm">
                -50%
              </div>
              <img alt="Phụ kiện túi xách" className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuClLtTuEKQvU9nHsESLZBty1dXE86Ss-enUG6TsBa5R7MF2E2bOU1ez73xzNSO1Rt_T-_G5qLvsVH7RlDMugH1b1ZeWJcmWLnfUJL_0R7QJQvgxbQymwLM57iLl0jeeWADEn5HyDF3_BWQ1AQ9c5dsJ0-U-ouXhXdE55ktDmaBMXXgkRaXk0FBjiHtQvXiipygkMkOLN70qLNZRwBBFwCmkHQPuts69wcqTjFpbV0oqJBux1hbXw7HjrnevqCNsG0qUcbz1AVOgkQ" />
            </div>
            <div className="mt-auto pt-2">
              <h3 className="font-body-md text-body-md text-primary truncate">Áo Thun Nữ Baby Tee</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-price-display text-price-display text-on-tertiary-container">149.000₫</span>
                <span className="font-price-display text-price-display text-on-surface-variant line-through text-[14px]">180.000₫</span>
              </div>
            </div>
          </Link>
        </div>
        <div className="mt-8 flex justify-center sm:hidden">
          <button className="bg-transparent border-[1.5px] border-primary text-primary px-6 py-2 rounded font-label-caps text-label-caps w-full">
            XEM TẤT CẢ BÁN CHẠY
          </button>
        </div>
      </section>
    </>
  );
}
