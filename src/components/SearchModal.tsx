import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService, type ProductSuggestionDto } from '@/services/product.service';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const popularKeywords = ['Áo Polo', 'Quần Jeans', 'Áo Hoodie', 'Áo Khoác', 'Quần Short'];

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [keyword, setKeyword] = useState('');
  const [suggestions, setSuggestions] = useState<ProductSuggestionDto[]>([]);
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
        const data = await productService.getSuggestions(keyword.trim());
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

  const handleSuggestionClick = (slug: string) => {
    navigate(`/product/${slug}`);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') onClose();
  };

  // Helper function to highlight matching search term
  const highlightKeyword = (text: string, query: string) => {
    if (!query.trim()) return <span>{text}</span>;
    
    // Normalize text and query to remove accents for regex matching
    const removeAccents = (str: string) => {
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
    };

    const normText = removeAccents(text.toLowerCase());
    const normQuery = removeAccents(query.toLowerCase().trim());
    const queryIdx = normText.indexOf(normQuery);

    if (queryIdx === -1) return <span>{text}</span>;

    const originalMatch = text.substring(queryIdx, queryIdx + query.length);
    const before = text.substring(0, queryIdx);
    const after = text.substring(queryIdx + query.length);

    return (
      <span>
        {before}
        <mark className="bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 font-semibold p-0.5 rounded-sm">
          {originalMatch}
        </mark>
        {after}
      </span>
    );
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
      <div className="relative bg-surface w-full max-w-2xl mt-20 mx-4 rounded-lg shadow-lg overflow-hidden animate-fade-in border border-border-subtle z-50">
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
                  key={product.slug}
                  onClick={() => handleSuggestionClick(product.slug)}
                  className="flex items-center justify-between w-full px-sm py-2 hover:bg-surface-alt rounded transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-body-md text-body-md text-primary truncate">
                      {highlightKeyword(product.name, keyword)}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant ml-sm">arrow_forward</span>
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
