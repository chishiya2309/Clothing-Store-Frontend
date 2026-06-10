import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="bg-surface dark:bg-on-background font-label-caps text-label-caps text-primary dark:text-on-primary docked full-width top-0 sticky border-b border-border-subtle dark:border-outline-variant flat no shadows z-50">
      <div className="flex justify-between items-center px-margin-desktop py-4 w-full max-w-container-max mx-auto md:flex hidden relative">
        {/* Navigation Links */}
        <nav className="flex items-center gap-6">
          <Link className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-on-primary transition-colors duration-200" to="#">NAM</Link>
          <Link className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-on-primary transition-colors duration-200" to="#">NỮ</Link>
          <Link className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-on-primary transition-colors duration-200" to="#">TRẺ EM</Link>
          <Link className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-on-primary transition-colors duration-200" to="#">BỘ SƯU TẬP</Link>
          <Link className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-on-primary transition-colors duration-200" to="#">SALE</Link>
        </nav>
        {/* Brand Logo */}
        <Link className="font-display-hero text-headline-md tracking-tighter text-primary dark:text-on-primary absolute left-1/2 transform -translate-x-1/2" to="/">
          CLOTHY
        </Link>
        {/* Trailing Icons */}
        <div className="flex items-center gap-4">
          <button className="hover:text-primary dark:hover:text-on-primary transition-colors duration-200 opacity-80 hover:opacity-100 hover:scale-95 transition-all">
            <span className="material-symbols-outlined" data-icon="search">search</span>
          </button>
          <button className="hover:text-primary dark:hover:text-on-primary transition-colors duration-200 opacity-80 hover:opacity-100 hover:scale-95 transition-all">
            <span className="material-symbols-outlined" data-icon="person">person</span>
          </button>
          <button className="hover:text-primary dark:hover:text-on-primary transition-colors duration-200 opacity-80 hover:opacity-100 hover:scale-95 transition-all">
            <span className="material-symbols-outlined" data-icon="favorite">favorite</span>
          </button>
          <button className="hover:text-primary dark:hover:text-on-primary transition-colors duration-200 opacity-80 hover:opacity-100 hover:scale-95 transition-all">
            <span className="material-symbols-outlined" data-icon="shopping_cart">shopping_cart</span>
          </button>
        </div>
      </div>
      {/* Mobile Header */}
      <div className="flex justify-between items-center px-margin-mobile py-4 w-full md:hidden">
        <button className="text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <Link className="font-display-hero text-headline-md tracking-tighter text-primary" to="/">
          CLOTHY
        </Link>
        <button className="text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">shopping_cart</span>
        </button>
      </div>
    </header>
  );
}
