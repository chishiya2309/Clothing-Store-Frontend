import { useState } from 'react';

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
}

interface ProductFilterSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export default function ProductFilterSidebar({ filters, onFilterChange }: ProductFilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    size: true,
    color: true,
    price: true,
  });

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
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined;

  const clearAll = () => {
    onFilterChange({ colors: [], sizes: [], minPrice: undefined, maxPrice: undefined });
  };

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
                  title={color}
                  className="relative"
                  style={{ width: 28, height: 28 }}
                >
                  <span
                    className="block w-6 h-6 rounded-full border border-border-subtle absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{ backgroundColor: hex }}
                  />
                  {isActive && (
                    <span
                      className="absolute inset-0 rounded-full border-2 border-primary-container"
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Price Filter */}
      <div className="mb-lg">
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
          <div className="space-y-sm font-body-md text-body-md text-on-surface-variant">
            {priceRanges.map((range) => {
              const isActive =
                filters.minPrice === range.min && filters.maxPrice === range.max;
              return (
                <label
                  key={range.label}
                  className="flex items-center cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => togglePriceRange(range.min, range.max)}
                    className="custom-checkbox mr-sm"
                  />
                  <span
                    className={`transition-colors ${
                      isActive
                        ? 'text-primary font-medium'
                        : 'group-hover:text-primary'
                    }`}
                  >
                    {range.label}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
