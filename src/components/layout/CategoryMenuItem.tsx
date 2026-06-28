import { Link } from 'react-router-dom';
import type { CategoryResponse } from '../../services/category.service';

interface CategoryMenuItemProps {
  category: CategoryResponse;
  isRoot?: boolean;
}

export default function CategoryMenuItem({ category, isRoot = false }: CategoryMenuItemProps) {
  const hasChildren = category.children && category.children.length > 0;

  if (isRoot) {
    return (
      <div className="relative group/nav">
        <Link
          className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-on-primary transition-colors duration-200 py-2 inline-flex items-center"
          to={`/category/${category.slug}`}
        >
          {category.name.toUpperCase()}
          {hasChildren && (
            <span className="material-symbols-outlined text-[14px] ml-1 opacity-70">expand_more</span>
          )}
        </Link>
        
        {/* Dropdown for Sub-categories (Root level) */}
        {hasChildren && (
          <div className="absolute left-0 top-full pt-2 opacity-0 group-hover/nav:opacity-100 transition-opacity duration-200 pointer-events-none group-hover/nav:pointer-events-auto z-50">
            <div className="bg-surface-container-lowest border border-border-subtle shadow-sm py-2 min-w-[200px] rounded-sm flex flex-col">
              {category.children.map((child: CategoryResponse) => (
                <CategoryMenuItem key={child.id} category={child} isRoot={false} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Nested levels
  return (
    <div className="relative group/subnav">
      <Link
        className="px-4 py-3 text-[14px] font-body-md text-primary hover:bg-surface-alt transition-colors whitespace-nowrap flex justify-between items-center"
        to={`/category/${category.slug}`}
      >
        <span>{category.name}</span>
        {hasChildren && (
          <span className="material-symbols-outlined text-[14px] opacity-50">chevron_right</span>
        )}
      </Link>
      
      {/* Flyout for nested Sub-categories */}
      {hasChildren && (
        <div className="absolute left-full top-0 pl-1 opacity-0 group-hover/subnav:opacity-100 transition-opacity duration-200 pointer-events-none group-hover/subnav:pointer-events-auto z-50">
          <div className="bg-surface-container-lowest border border-border-subtle shadow-sm py-2 min-w-[200px] rounded-sm flex flex-col">
            {category.children.map((child: CategoryResponse) => (
              <CategoryMenuItem key={child.id} category={child} isRoot={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
