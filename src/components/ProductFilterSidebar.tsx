import { useState, useEffect } from 'react';
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

const availableSizes = ['S', 'M', 'L', 'XL', '2XL'];
const availableColors = Object.keys(colorMap);
const availableBrands = ['Clothy', 'Coolmate', 'Levis', 'Lacoste', 'Uniqlo'];

const priceRanges = [
  { label: 'Dưới 500.000₫', min: 0, max: 500000 },
  { label: '500.000₫ - 1.000.000₫', min: 500000, max: 1000000 },
  { label: '1.000.000₫ - 2.000.000₫', min: 1000000, max: 2000000 },
  { label: 'Trên 2.000.000₫', min: 2000000, max: undefined },
];

export interface FilterState {
  colors: string[];
  sizes: string[];
  minPrice?: number;
  maxPrice?: number;
  brands: string[];
  categorySlug?: string;
}

interface ProductFilterSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  isSearchPage?: boolean;
}

export default function ProductFilterSidebar({ filters, onFilterChange, isSearchPage = false }: ProductFilterSidebarProps) {
  const { categories, fetchCategories } = useCategoryStore();
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    brand: true,
    size: true,
    color: true,
    price: true,
  });

  useEffect(() => {
    if (isSearchPage) {
      fetchCategories();
    }
  }, [isSearchPage, fetchCategories]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleColor = (color: string) => {
    const next = filters.colors.includes(color)
      ? filters.colors.filter((c) => c !== color)
      : [...filters.colors, color];
    onFilterChange({ ...filters, colors: next });
  };

  const toggleSize = (size: string) => {
    const next = filters.sizes.includes(size)
      ? filters.sizes.filter((s) => s !== size)
      : [...filters.sizes, size];
    onFilterChange({ ...filters, sizes: next });
  };

  const toggleBrand = (brand: string) => {
    const next = filters.brands.includes(brand)
      ? filters.brands.filter((b) => b !== brand)
      : [...filters.brands, brand];
    onFilterChange({ ...filters, brands: next });
  };

  const toggleCategory = (slug: string) => {
    const next = filters.categorySlug === slug ? undefined : slug;
    onFilterChange({ ...filters, categorySlug: next });
  };

  const togglePriceRange = (min: number, max?: number) => {
    const isActive = filters.minPrice === min && filters.maxPrice === max;
    if (isActive) {
      onFilterChange({ ...filters, minPrice: undefined, maxPrice: undefined });
    } else {
      onFilterChange({ ...filters, minPrice: min, maxPrice: max });
    }
  };

  const hasActiveFilters =
    filters.colors.length > 0 ||
    filters.sizes.length > 0 ||
    filters.brands.length > 0 ||
    filters.categorySlug !== undefined ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined;

  const clearAll = () => {
    onFilterChange({ colors: [], sizes: [], brands: [], categorySlug: undefined, minPrice: undefined, maxPrice: undefined });
  };

  // Helper to flat hierarchical categories
  const getFlatCategories = (cats: any[]): any[] => {
    const flat: any[] = [];
    cats.forEach(c => {
      flat.push(c);
      if (c.children && c.children.length > 0) {
        flat.push(...getFlatCategories(c.children));
      }
    });
    return flat;
  };

  const allCategories = getFlatCategories(categories);

  return (
    <aside className="w-full md:w-[250px] shrink-0">
      {/* Clear All Button */}
      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1 text-on-tertiary-container font-body-sm text-body-sm mb-md hover:underline transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
          Xóa tất cả bộ lọc
        </button>
      )}

      {/* Category Filter (only on search page) */}
      {isSearchPage && allCategories.length > 0 && (
        <div className="mb-lg border-b border-border-subtle pb-md">
          <h3
            className="font-headline-md text-[18px] leading-[24px] font-semibold text-primary mb-md flex justify-between items-center cursor-pointer select-none"
            onClick={() => toggleSection('category')}
          >
            Danh mục
            <span className="material-symbols-outlined">
              {expandedSections.category ? 'expand_less' : 'expand_more'}
            </span>
          </h3>
          {expandedSections.category && (
            <div className="flex flex-col gap-sm max-h-48 overflow-y-auto pr-2">
              {allCategories.map((cat) => {
                const isActive = filters.categorySlug === cat.slug;
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.slug)}
                    className={`flex items-center text-left font-body-sm text-body-sm py-1 transition-all ${
                      isActive
                        ? 'text-primary font-semibold'
                        : 'text-on-surface hover:text-primary'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full mr-2 border border-border-subtle ${isActive ? 'bg-primary' : 'bg-transparent'}`} />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Brand Filter */}
      <div className="mb-lg border-b border-border-subtle pb-md">
        <h3
          className="font-headline-md text-[18px] leading-[24px] font-semibold text-primary mb-md flex justify-between items-center cursor-pointer select-none"
          onClick={() => toggleSection('brand')}
        >
          Thương hiệu
          <span className="material-symbols-outlined">
            {expandedSections.brand ? 'expand_less' : 'expand_more'}
          </span>
        </h3>
        {expandedSections.brand && (
          <div className="flex flex-col gap-sm">
            {availableBrands.map((brand) => {
              const isActive = filters.brands.includes(brand);
              return (
                <button
                  key={brand}
                  onClick={() => toggleBrand(brand)}
                  className={`flex items-center text-left font-body-sm text-body-sm py-1 transition-all ${
                    isActive
                      ? 'text-primary font-semibold'
                      : 'text-on-surface hover:text-primary'
                  }`}
                >
                  <span className={`w-4 h-4 border border-border-subtle rounded-sm mr-2 flex items-center justify-center ${isActive ? 'bg-primary border-primary text-white' : 'bg-transparent'}`}>
                    {isActive && <span className="material-symbols-outlined text-[12px] font-bold">check</span>}
                  </span>
                  {brand}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Size Filter */}
      <div className="mb-lg border-b border-border-subtle pb-md">
        <h3
          className="font-headline-md text-[18px] leading-[24px] font-semibold text-primary mb-md flex justify-between items-center cursor-pointer select-none"
          onClick={() => toggleSection('size')}
        >
          Kích cỡ
          <span className="material-symbols-outlined">
            {expandedSections.size ? 'expand_less' : 'expand_more'}
          </span>
        </h3>
        {expandedSections.size && (
          <div className="flex flex-wrap gap-sm">
            {availableSizes.map((size) => {
              const isActive = filters.sizes.includes(size);
              return (
                <button
                  key={size}
                  onClick={() => toggleSize(size)}
                  className={`w-10 h-10 flex items-center justify-center border font-body-sm text-body-sm transition-all ${
                    isActive
                      ? 'bg-primary-container text-on-primary border-primary-container'
                      : 'border-border-subtle text-on-surface hover:border-primary'
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Color Filter */}
      <div className="mb-lg border-b border-border-subtle pb-md">
        <h3
          className="font-headline-md text-[18px] leading-[24px] font-semibold text-primary mb-md flex justify-between items-center cursor-pointer select-none"
          onClick={() => toggleSection('color')}
        >
          Màu sắc
          <span className="material-symbols-outlined">
            {expandedSections.color ? 'expand_less' : 'expand_more'}
          </span>
        </h3>
        {expandedSections.color && (
          <div className="flex flex-wrap gap-sm">
            {availableColors.map((color) => {
              const hex = colorMap[color];
              const isActive = filters.colors.includes(color);
              return (
                <button
                  key={color}
                  onClick={() => toggleColor(color)}
                  className={`w-8 h-8 rounded-full border relative flex items-center justify-center hover:scale-105 transition-transform ${
                    isActive ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-border-subtle'
                  }`}
                  style={{ backgroundColor: hex }}
                  title={color}
                >
                  {isActive && (
                    <span
                      className="material-symbols-outlined text-[16px] font-bold mix-blend-difference"
                      style={{ color: '#fff' }}
                    >
                      check
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Price Filter */}
      <div>
        <h3
          className="font-headline-md text-[18px] leading-[24px] font-semibold text-primary mb-md flex justify-between items-center cursor-pointer select-none"
          onClick={() => toggleSection('price')}
        >
          Khoảng giá
          <span className="material-symbols-outlined">
            {expandedSections.price ? 'expand_less' : 'expand_more'}
          </span>
        </h3>
        {expandedSections.price && (
          <div className="flex flex-col gap-sm">
            {priceRanges.map((range, idx) => {
              const isActive = filters.minPrice === range.min && filters.maxPrice === range.max;
              return (
                <button
                  key={idx}
                  onClick={() => togglePriceRange(range.min, range.max)}
                  className={`flex items-center text-left font-body-sm text-body-sm py-1 transition-all ${
                    isActive
                      ? 'text-primary font-semibold'
                      : 'text-on-surface hover:text-primary'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border border-border-subtle mr-2 flex items-center justify-center ${isActive ? 'bg-primary border-primary' : 'bg-transparent'}`} />
                  {range.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
