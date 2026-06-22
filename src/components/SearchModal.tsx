import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService, type ProductGridResponse } from '@/services/product.service';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const popularKeywords = ['Áo Polo', 'Quần Jeans', 'Áo Hoodie', 'Áo Khoác', 'Quần Short'];

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [keyword, setKeyword] = useState('');
  const [suggestions, setSuggestions] = useState<ProductGridResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const navigate = useNavigate();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setKeyword('');
      setSuggestions([]);
    }
  }, [isOpen]);

  // Debounced autocomplete fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!keyword.trim() || keyword.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await productService.getAutocomplete(keyword.trim(), 5);
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [keyword]);

  const handleSearch = (searchKeyword?: string) => {
    const q = (searchKeyword || keyword).trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-surface w-full max-w-2xl mt-20 mx-4 rounded-lg shadow-lg overflow-hidden animate-fade-in">
        {/* Search Input */}
        <div className="flex items-center border-b border-border-subtle px-md py-sm">
          <span className="material-symbols-outlined text-[24px] text-on-surface-variant mr-sm">search</span>
          <input
            ref={inputRef}
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tìm kiếm sản phẩm..."
            className="flex-1 bg-transparent border-none outline-none text-primary font-body-md text-body-md placeholder:text-text-muted"
          />
          {keyword && (
            <button
              onClick={() => setKeyword('')}
              className="text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-lg">
              <span className="material-symbols-outlined animate-spin text-2xl text-primary">sync</span>
            </div>
          )}

          {/* Autocomplete Suggestions */}
          {!isLoading && suggestions.length > 0 && (
            <div className="p-sm">
              <p className="text-text-muted font-label-caps text-label-caps mb-sm px-sm">GỢI Ý SẢN PHẨM</p>
              {suggestions.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSearch(product.name)}
                  className="flex items-center gap-sm w-full px-sm py-2 hover:bg-surface-alt rounded transition-colors text-left"
                >
                  {product.thumbnailUrl && (
                    <img
                      src={product.thumbnailUrl}
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded bg-surface-alt"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-body-md text-body-md text-primary truncate">{product.name}</p>
                    <p className="font-price-display text-[14px] text-on-surface-variant">
                      {(product.salePrice ?? product.basePrice).toLocaleString('vi-VN')}₫
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">north_west</span>
                </button>
              ))}
            </div>
          )}

          {/* Popular Keywords (shown when input is empty) */}
          {!isLoading && !keyword.trim() && (
            <div className="p-sm">
              <p className="text-text-muted font-label-caps text-label-caps mb-sm px-sm">TỪ KHÓA PHỔ BIẾN</p>
              <div className="flex flex-wrap gap-2 px-sm">
                {popularKeywords.map((kw) => (
                  <button
                    key={kw}
                    onClick={() => handleSearch(kw)}
                    className="px-sm py-1.5 border border-border-subtle rounded-full font-body-sm text-body-sm text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {!isLoading && keyword.trim().length >= 2 && suggestions.length === 0 && (
            <div className="text-center py-lg">
              <span className="material-symbols-outlined text-4xl text-border-subtle mb-2">search_off</span>
              <p className="text-on-surface-variant font-body-md">Không tìm thấy gợi ý phù hợp</p>
              <p className="text-text-muted font-body-sm mt-1">Nhấn Enter để tìm kiếm "{keyword}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
