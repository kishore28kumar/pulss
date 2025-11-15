'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  ShoppingCart, 
  User, 
  Search, 
  Menu, 
  Heart, 
  Store, 
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/hooks/useWishlist';
import { useCartStore } from '@/stores/cartStore';
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions';
import { formatCurrency } from '@/lib/utils';
import CartDrawer from '@/components/cart/CartDrawer';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  
  const { customer, isAuthenticated, logout } = useAuth();
  const { wishlistCount } = useWishlist();
  const { itemCount, subtotal, openCart } = useCartStore();
  
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { data: suggestions = [], isLoading: isLoadingSuggestions } = useSearchSuggestions(
    debouncedSearch,
    selectedCategory,
    showSuggestions && debouncedSearch.length >= 2
  );

  // Fetch categories for dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data.data || [];
    },
  });

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setFocusedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && suggestions[focusedIndex]) {
          handleSuggestionClick(suggestions[focusedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setFocusedIndex(-1);
        break;
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setShowSuggestions(false);
    router.push(`/products?search=${encodeURIComponent(searchQuery)}${selectedCategory ? `&categoryId=${selectedCategory}` : ''}`);
  };

  const handleSuggestionClick = (suggestion: any) => {
    setShowSuggestions(false);
    setSearchQuery('');
    router.push(`/products/${suggestion.slug}`);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(value.length >= 2);
    setFocusedIndex(-1);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto">
          {/* Top Bar */}
          <div className="py-2 px-4 bg-blue-600 text-white text-sm text-center">
            🎉 Free shipping on orders over ₹200!
          </div>

          {/* Main Header */}
          <div className="py-4 px-4 md:px-6">
            <div className="flex items-center justify-between gap-4 md:gap-6">
              {/* Logo - Left */}
              <Link href="/" className="flex items-center gap-2 flex-shrink-0">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center transition hover:bg-blue-700">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-gray-900">Pulss Store</h1>
                  <p className="text-xs text-gray-500">Quality Products</p>
                </div>
              </Link>

              {/* Search Bar - Center */}
              <div className="hidden md:flex flex-1 max-w-2xl mx-4 lg:mx-8">
                <div ref={searchRef} className="relative w-full">
                  <div className="flex rounded-lg border-2 border-gray-300 focus-within:border-blue-600 focus-within:shadow-md transition-all duration-200 shadow-sm">
                    {/* Category Filter */}
                    <div className="relative">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="appearance-none pl-4 pr-8 py-2.5 bg-gray-50 border-r border-gray-300 text-sm font-medium text-gray-700 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer hover:bg-gray-100 transition"
                        aria-label="Filter by category"
                      >
                        <option value="">All Categories</option>
                        {categoriesData?.map((cat: any) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>

                    {/* Search Input */}
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                        className="w-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400 bg-white"
                        aria-autocomplete="list"
                        aria-expanded={showSuggestions}
                        aria-controls="search-suggestions"
                      />
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Search Button */}
                    <button
                      onClick={handleSearch}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      aria-label="Search"
                    >
                      Search
                    </button>
                  </div>

                  {/* Search Suggestions Dropdown */}
                  {showSuggestions && (debouncedSearch.length >= 2 || isLoadingSuggestions) && (
                    <div
                      id="search-suggestions"
                      role="listbox"
                      className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50"
                    >
                      {isLoadingSuggestions ? (
                        <div className="p-4 text-center text-gray-500">Searching...</div>
                      ) : suggestions.length > 0 ? (
                        <ul className="py-2">
                          {suggestions.map((suggestion, index) => (
                            <li key={suggestion.id}>
                              <button
                                onClick={() => handleSuggestionClick(suggestion)}
                                onMouseEnter={() => setFocusedIndex(index)}
                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition ${
                                  focusedIndex === index ? 'bg-gray-50' : ''
                                }`}
                                role="option"
                                aria-selected={focusedIndex === index}
                              >
                                {suggestion.thumbnail && (
                                  <img
                                    src={suggestion.thumbnail}
                                    alt=""
                                    className="w-12 h-12 object-cover rounded-md"
                                  />
                                )}
                                <div className="flex-1 text-left">
                                  <div className="font-medium text-gray-900">{suggestion.name}</div>
                                  {suggestion.category && (
                                    <div className="text-xs text-gray-500">{suggestion.category}</div>
                                  )}
                                </div>
                                <div className="font-semibold text-gray-900">
                                  {formatCurrency(suggestion.price)}
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="p-4 text-center text-gray-500">No products found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions - Right */}
              <div className="flex items-center gap-3 md:gap-4">
                {/* Wishlist */}
                <Link
                  href="/wishlist"
                  className="hidden md:flex items-center relative text-gray-700 hover:text-pink-600 transition p-2 rounded-md hover:bg-gray-100"
                  aria-label={`Wishlist (${wishlistCount} items)`}
                >
                  <Heart className="w-6 h-6" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                {/* Cart */}
                <button
                  onClick={openCart}
                  className="relative flex items-center gap-2 text-gray-700 hover:text-blue-600 transition p-2 rounded-md hover:bg-gray-100"
                  aria-label={`Cart (${itemCount} items)`}
                >
                  <ShoppingCart className="w-6 h-6" />
                  {itemCount > 0 && (
                    <>
                      <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {itemCount}
                      </span>
                      <span className="hidden lg:inline text-sm font-semibold">
                        {formatCurrency(subtotal)}
                      </span>
                    </>
                  )}
                </button>

                {/* User Menu */}
                {isAuthenticated ? (
                  <div className="hidden md:flex items-center gap-2">
                    <Link
                      href="/account"
                      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition p-2 rounded-md hover:bg-gray-100"
                    >
                      <User className="w-6 h-6" />
                      <span className="text-sm font-medium">{customer?.firstName}</span>
                    </Link>
                    <button
                      onClick={logout}
                      className="text-gray-500 hover:text-red-600 transition p-2 rounded-md hover:bg-gray-100"
                      title="Logout"
                      aria-label="Logout"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="hidden md:flex items-center gap-1 text-gray-700 hover:text-blue-600 transition p-2 rounded-md hover:bg-gray-100"
                  >
                    <User className="w-6 h-6" />
                    <span className="text-sm font-medium">Sign In</span>
                  </Link>
                )}

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="md:hidden p-2 rounded-md hover:bg-gray-100 transition"
                  aria-label="Toggle menu"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center justify-center gap-6 lg:gap-8 py-3 px-4 md:px-6 border-t border-gray-100">
            <Link 
              href="/" 
              className={`text-sm font-medium transition ${
                pathname === '/' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Home
            </Link>
            <Link 
              href="/products" 
              className={`text-sm font-medium transition ${
                pathname === '/products' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Shop
            </Link>
            <Link 
              href="/categories" 
              className={`text-sm font-medium transition ${
                pathname === '/categories' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Categories
            </Link>
            <Link 
              href="/about" 
              className={`text-sm font-medium transition ${
                pathname === '/about' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              About
            </Link>
            <Link 
              href="/contact" 
              className={`text-sm font-medium transition ${
                pathname === '/contact' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Contact
            </Link>
          </nav>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="p-4 space-y-4">
              {/* Mobile Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

              <nav className="space-y-2">
                <Link 
                  href="/" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block py-2 text-gray-700 hover:text-blue-600 transition"
                >
                  Home
                </Link>
                <Link 
                  href="/products" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block py-2 text-gray-700 hover:text-blue-600 transition"
                >
                  Shop
                </Link>
                <Link 
                  href="/categories" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block py-2 text-gray-700 hover:text-blue-600 transition"
                >
                  Categories
                </Link>
                <Link 
                  href="/wishlist" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between py-2 text-gray-700 hover:text-blue-600 transition"
                >
                  <span>Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="bg-pink-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
                {isAuthenticated ? (
                  <>
                    <Link 
                      href="/account" 
                      onClick={() => setIsMenuOpen(false)}
                      className="block py-2 text-gray-700 hover:text-blue-600 transition"
                    >
                      Account
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left py-2 text-red-600 hover:text-red-700 transition"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link 
                    href="/login" 
                    onClick={() => setIsMenuOpen(false)}
                    className="block py-2 text-gray-700 hover:text-blue-600 transition"
                  >
                    Login
                  </Link>
                )}
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* Cart Drawer */}
      <CartDrawer />
    </>
  );
}
