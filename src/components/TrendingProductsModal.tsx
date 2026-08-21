import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Flame, Search, X, Sparkles, Filter, 
  ArrowLeft, ShoppingCart, Tag, Zap, Star
} from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

interface TrendingProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  featuredProductIds?: string[];
  cart: { [productId: string]: number };
  wishlistIds: string[];
  onAddToCart: (product: Product) => void;
  onUpdateCartQuantity: (productId: string, quantity: number) => void;
  onToggleWishlist: (product: Product) => void;
  onQuickView: (product: Product) => void;
}

export const TrendingProductsModal: React.FC<TrendingProductsModalProps> = ({
  isOpen,
  onClose,
  products,
  featuredProductIds = [],
  cart,
  wishlistIds,
  onAddToCart,
  onUpdateCartQuantity,
  onToggleWishlist,
  onQuickView,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'popular' | 'discount' | 'under99'>('all');

  const wishlistSet = useMemo(() => new Set(wishlistIds), [wishlistIds]);

  // Filter trending products (Memoized)
  const baseTrendingProducts = useMemo(() => {
    let base: Product[] = [];
    if (featuredProductIds && featuredProductIds.length > 0) {
      const featSet = new Set(featuredProductIds);
      base = products.filter(p => featSet.has(p.id));
    }
    if (base.length === 0) {
      base = products.filter(
        p => p.isPopular || p.isOffer || (p.mrp > p.price) || (p.rating && p.rating >= 4.2)
      );
    }
    if (base.length === 0) {
      base = products;
    }
    return base;
  }, [products, featuredProductIds]);

  // Apply search & sub-filters (Memoized)
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return baseTrendingProducts.filter(product => {
      if (q) {
        const matchesSearch = 
          product.name.toLowerCase().includes(q) ||
          product.category.toLowerCase().includes(q) ||
          product.brand.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      if (activeFilter === 'popular') {
        return product.isPopular || (product.rating && product.rating >= 4.5);
      }
      if (activeFilter === 'discount') {
        const discountPercent = ((product.mrp - product.price) / product.mrp) * 100;
        return discountPercent >= 15 || product.isOffer;
      }
      if (activeFilter === 'under99') {
        return product.price <= 99;
      }

      return true;
    });
  }, [baseTrendingProducts, searchQuery, activeFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-slate-50 w-full max-w-5xl h-[92vh] sm:h-[88vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 mx-auto animate-in slide-in-from-bottom-6 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-4 sm:p-6 relative shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
                title="Back to Home"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-amber-400 text-slate-950 font-black text-[10px] sm:text-xs px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider">
                    <Flame className="w-3.5 h-3.5 fill-slate-950" />
                    Most Popular Today
                  </span>
                  <span className="text-blue-200 text-xs font-bold hidden sm:inline">
                    • {filteredProducts.length} Items
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
                  <span>Trending Products</span>
                  <TrendingUp className="w-6 h-6 text-amber-300 stroke-[2.5]" />
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search Bar & Quick Filters inside Header */}
          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search trending products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 focus:bg-white text-white focus:text-slate-900 placeholder-white/70 focus:placeholder-slate-400 text-xs sm:text-sm pl-9 pr-8 py-2 rounded-xl border border-white/20 focus:outline-none transition-all"
              />
              <Search className="w-4 h-4 text-white/70 focus:text-slate-400 absolute left-3 top-2.5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-white/80 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                All Trending ({baseTrendingProducts.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('popular')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  activeFilter === 'popular'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Top Rated ★
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('discount')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  activeFilter === 'discount'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                High Offers %
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('under99')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  activeFilter === 'under99'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Under ₹99
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Products Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {filteredProducts.map((product) => {
                const qty = cart[product.id] || 0;
                const isWishlisted = wishlistSet.has(product.id);

                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    cartQuantity={qty}
                    isWishlisted={isWishlisted}
                    onAddToCart={onAddToCart}
                    onUpdateCartQuantity={onUpdateCartQuantity}
                    onToggleWishlist={onToggleWishlist}
                    onQuickView={onQuickView}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-base">No trending products match your filter</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Try clearing your search or switching to "All Trending" to see more top products.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Modal Bottom Sticky Bar */}
        <div className="bg-white border-t border-slate-200 p-3 sm:p-4 shrink-0 flex items-center justify-between">
          <div className="text-xs font-medium text-slate-500">
            Showing <strong className="text-slate-900">{filteredProducts.length}</strong> trending products
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Back to Main Shop
          </button>
        </div>
      </div>
    </div>
  );
};
