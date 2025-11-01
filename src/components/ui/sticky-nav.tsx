/**
 * Sticky Navigation Bar with animations and mobile menu
 * Provides smooth navigation experience across the app
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { Button } from './button'
import { Input } from './input'
import { NotificationBadge } from './enhanced-badge'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { useKV } from '@github/spark/hooks'
import {
  MagnifyingGlass,
  ShoppingCart,
  User,
  Heart,
  List,
  X,
  House,
  Tag,
  Package,
  Bell,
  Moon,
  Sun,
} from '@phosphor-icons/react'
import { fadeInDown, slideInFromLeft, navSlide } from '@/lib/animations'
import { cn } from '@/lib/utils'

interface StickyNavProps {
  storeName?: string
  logo?: string
  onSearch?: (query: string) => void
  onCartClick?: () => void
  onProfileClick?: () => void
  userName?: string
  userAvatar?: string
  className?: string
}

export const StickyNav = ({
  storeName = 'Pulss Store',
  logo,
  onSearch,
  onCartClick,
  onProfileClick,
  userName,
  userAvatar,
  className,
}: StickyNavProps) => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDark, setIsDark] = useState(false)
  const [cart] = useKV<Array<{ id: string; quantity: number }>>('cart', [])
  const [favorites] = useKV<string[]>('favorites', [])
  const location = useLocation()

  const totalCartItems = cart?.reduce((sum, item) => sum + item.quantity, 0) || 0
  const totalFavorites = favorites?.length || 0

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // Close mobile menu when route changes
    setIsMobileMenuOpen(false)
  }, [location])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery)
    }
  }

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  const navLinks = [
    { to: '/', label: 'Home', icon: House },
    { to: '/products', label: 'Products', icon: Package },
    { to: '/offers', label: 'Offers', icon: Tag },
  ]

  return (
    <>
      <motion.header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled
            ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg'
            : 'bg-white dark:bg-gray-900',
          className
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        {/* Top Bar */}
        <div className="border-b border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16 md:h-20">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-3 group">
                {logo ? (
                  <img src={logo} alt={storeName} className="h-8 md:h-10 w-auto" />
                ) : (
                  <div className="h-8 md:h-10 w-8 md:w-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {storeName[0]}
                  </div>
                )}
                <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
                  {storeName}
                </span>
              </Link>

              {/* Desktop Search Bar */}
              <form
                onSubmit={handleSearchSubmit}
                className="hidden md:flex items-center flex-1 max-w-xl mx-8"
              >
                <div className="relative w-full">
                  <Input
                    type="text"
                    placeholder="Search for medicines, health products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-11 pl-12 pr-4 rounded-full border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 transition-colors"
                  />
                  <MagnifyingGlass
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                    weight="bold"
                  />
                </div>
              </form>

              {/* Desktop Actions */}
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="rounded-full"
                >
                  {isDark ? (
                    <Sun className="h-5 w-5" weight="bold" />
                  ) : (
                    <Moon className="h-5 w-5" weight="bold" />
                  )}
                </Button>

                <Link to="/wishlist">
                  <Button variant="ghost" size="icon" className="relative rounded-full">
                    <Heart className="h-5 w-5" weight="bold" />
                    {totalFavorites > 0 && <NotificationBadge count={totalFavorites} />}
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onCartClick}
                  className="relative rounded-full"
                >
                  <ShoppingCart className="h-5 w-5" weight="bold" />
                  {totalCartItems > 0 && <NotificationBadge count={totalCartItems} />}
                </Button>

                {userName ? (
                  <Button
                    variant="ghost"
                    onClick={onProfileClick}
                    className="flex items-center gap-2 rounded-full pl-2 pr-4"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userAvatar} alt={userName} />
                      <AvatarFallback>{userName[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{userName.split(' ')[0]}</span>
                  </Button>
                ) : (
                  <Link to="/signin">
                    <Button className="rounded-full">
                      <User className="h-4 w-4 mr-2" weight="bold" />
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden rounded-full"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" weight="bold" />
                ) : (
                  <List className="h-6 w-6" weight="bold" />
                )}
              </Button>
            </div>

            {/* Mobile Search Bar */}
            <div className="md:hidden pb-4">
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 rounded-full border-2 border-gray-200 dark:border-gray-700"
                  />
                  <MagnifyingGlass
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                    weight="bold"
                  />
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:block border-b border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4">
            <nav className="flex items-center gap-1 h-12">
              {navLinks.map((link) => {
                const Icon = link.icon
                const isActive = location.pathname === link.to
                return (
                  <Link key={link.to} to={link.to}>
                    <Button
                      variant="ghost"
                      className={cn(
                        'flex items-center gap-2 rounded-lg',
                        isActive && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      )}
                    >
                      <Icon className="h-4 w-4" weight="bold" />
                      {link.label}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            <motion.div
              variants={navSlide}
              initial="initial"
              animate="animate"
              exit="exit"
              className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-gray-900 z-50 md:hidden shadow-2xl"
            >
              <div className="flex flex-col h-full">
                {/* Menu Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Menu</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="rounded-full"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  {userName ? (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={userAvatar} alt={userName} />
                        <AvatarFallback>{userName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{userName}</div>
                        <Link
                          to="/profile"
                          className="text-sm text-blue-600 dark:text-blue-400"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          View Profile
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <Link to="/signin" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full">
                        <User className="h-4 w-4 mr-2" weight="bold" />
                        Sign In
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Menu Items */}
                <nav className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-1">
                    {navLinks.map((link) => {
                      const Icon = link.icon
                      const isActive = location.pathname === link.to
                      return (
                        <Link
                          key={link.to}
                          to={link.to}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Button
                            variant="ghost"
                            className={cn(
                              'w-full justify-start gap-3 h-12',
                              isActive && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            )}
                          >
                            <Icon className="h-5 w-5" weight="bold" />
                            {link.label}
                          </Button>
                        </Link>
                      )
                    })}

                    <Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-3 h-12 relative">
                        <Heart className="h-5 w-5" weight="bold" />
                        Wishlist
                        {totalFavorites > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {totalFavorites}
                          </span>
                        )}
                      </Button>
                    </Link>

                    <Button
                      variant="ghost"
                      onClick={() => {
                        onCartClick?.()
                        setIsMobileMenuOpen(false)
                      }}
                      className="w-full justify-start gap-3 h-12 relative"
                    >
                      <ShoppingCart className="h-5 w-5" weight="bold" />
                      Cart
                      {totalCartItems > 0 && (
                        <span className="ml-auto bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {totalCartItems}
                        </span>
                      )}
                    </Button>
                  </div>
                </nav>

                {/* Menu Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                  <Button
                    variant="outline"
                    onClick={toggleTheme}
                    className="w-full justify-start gap-3"
                  >
                    {isDark ? (
                      <>
                        <Sun className="h-5 w-5" weight="bold" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="h-5 w-5" weight="bold" />
                        Dark Mode
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer to prevent content from being hidden under fixed nav */}
      <div className="h-28 md:h-36" />
    </>
  )
}
