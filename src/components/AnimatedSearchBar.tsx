import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Mic, MicOff, X, ChevronLeft, Sparkles, TrendingUp, Zap, ArrowRight, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { useCartAnimation } from './CartAnimationProvider';

const ROTATING_SEARCH_PLACEHOLDERS = [
  "Search for 'banana'",
  "Search for 'carrot'",
  "Search for 'curd'",
  "Search for 'cheese'",
  "Search for 'fresh milk, butter & paneer'",
  "Search for 'Aashirvaad Atta, Rice & Dal'",
  "Search for 'Fortune Oil & Spices'"
];

const TRENDING_SEARCH_CHIPS = [
  { label: "🥛 Fresh Milk", query: "Milk" },
  { label: "🍌 Bananas", query: "Banana" },
  { label: "🍞 Whole Wheat Bread", query: "Bread" },
  { label: "🥚 Farm Eggs", query: "Egg" },
  { label: "🍅 Fresh Tomatoes", query: "Tomato" },
  { label: "🍫 Dairy Milk", query: "Chocolate" }
];

interface AnimatedSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isListening: boolean;
  toggleVoiceSearch: () => void;
  speechSupported: boolean;
  isSearchFocused: boolean;
  setIsSearchFocused: (focused: boolean) => void;
  matchingProducts: Product[];
  handleProductSelect: (product: Product) => void;
  handleSearchSubmit: (e: React.FormEvent) => void;
  handleSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  searchContainerRef: React.RefObject<HTMLDivElement>;
  isMobile?: boolean;
  onAddToCart?: (product: Product) => void;
}

export const AnimatedSearchBar: React.FC<AnimatedSearchBarProps> = ({
  searchQuery,
  onSearchChange,
  isListening,
  toggleVoiceSearch,
  speechSupported,
  isSearchFocused,
  setIsSearchFocused,
  matchingProducts,
  handleProductSelect,
  handleSearchSubmit,
  handleSearchKeyDown,
  searchContainerRef,
  isMobile = false,
  onAddToCart
}) => {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const { triggerFlyToCart } = useCartAnimation();

  // Cycle placeholder strings with animation
  useEffect(() => {
    if (searchQuery || isSearchFocused) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % ROTATING_SEARCH_PLACEHOLDERS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [searchQuery, isSearchFocused]);

  const handleChipClick = (query: string) => {
    onSearchChange(query);
    setIsSearchFocused(true);
  };

  return (
    <div className="relative w-full" ref={searchContainerRef}>
      {/* Outer Glow & Shimmer Container */}
      <div
        className={`relative flex items-center bg-slate-50 border rounded-2xl transition-all shadow-xs overflow-hidden ${
          isListening
            ? 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-400'
            : isSearchFocused
            ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/40 shadow-md'
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-100/80'
        } ${isMobile ? 'px-3 py-2' : 'px-3.5 py-2'}`}
      >
        {/* Animated Sweep Shimmer Highlight */}
        {!searchQuery && !isSearchFocused && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ repeat: Infinity, duration: 3.5, ease: 'linear' }}
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent pointer-events-none -skew-x-12"
          />
        )}

        {/* Search Icon with Bounce on Focus */}
        <div className="mr-2 shrink-0 flex items-center">
          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                onSearchChange('');
                setIsSearchFocused(false);
              }}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
              title="Clear search"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <motion.div
              animate={isSearchFocused ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              <Search className={`w-4 h-4 ${isSearchFocused ? 'text-emerald-600' : 'text-slate-400'}`} />
            </motion.div>
          )}
        </div>

        {/* Input & Animated Rotating Placeholder */}
        <div className="relative flex-1 flex items-center min-w-0">
          <form onSubmit={handleSearchSubmit} className="w-full flex items-center relative z-10">
            <input
              id={isMobile ? 'mobile-search-input' : 'header-search-input'}
              type="search"
              enterKeyHint="search"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setIsSearchFocused(true);
              }}
              onKeyDown={handleSearchKeyDown}
              className={`w-full bg-transparent text-slate-900 text-sm py-0.5 focus:outline-none font-medium ${
                searchQuery ? 'opacity-100' : 'opacity-0 focus:opacity-100'
              }`}
            />
          </form>

          {/* Dynamic Animated Placeholder Overlay when input is empty */}
          <AnimatePresence mode="wait">
            {!searchQuery && (
              <motion.div
                key={isListening ? 'listening' : placeholderIndex}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -12, opacity: 0 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                onClick={() => {
                  const input = document.getElementById(isMobile ? 'mobile-search-input' : 'header-search-input');
                  if (input) input.focus();
                }}
                className="absolute inset-0 flex items-center pointer-events-none text-slate-400 text-xs sm:text-sm font-medium truncate select-none"
              >
                {isListening ? (
                  <span className="text-rose-600 font-bold flex items-center gap-1.5 animate-pulse">
                    <span>🎙️ Listening... Speak grocery item name now</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{ROTATING_SEARCH_PLACEHOLDERS[placeholderIndex]}</span>
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Clear Button */}
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors ml-1 cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        )}

        {/* Voice Search Mic Button with Pulsing Wave Animation */}
        <button
          id={isMobile ? 'mobile-voice-search-btn' : 'desktop-voice-search-btn'}
          type="button"
          onClick={toggleVoiceSearch}
          className={`p-1.5 rounded-xl ml-1 transition-all cursor-pointer flex items-center justify-center shrink-0 relative ${
            isListening
              ? 'bg-rose-600 text-white animate-pulse shadow-md ring-2 ring-rose-400'
              : 'text-slate-500 hover:text-emerald-700 hover:bg-slate-200/80'
          }`}
          title={
            isListening
              ? 'Listening... Click to stop'
              : speechSupported
              ? 'Voice Search: Click & speak grocery item name'
              : 'Voice Search not supported in this browser'
          }
          aria-label="Voice Search"
        >
          {isListening ? (
            <MicOff className="w-4 h-4 text-white" />
          ) : (
            <Mic className="w-4 h-4 text-emerald-700" />
          )}
        </button>

        {/* Coral/Red Search Action Button (matching reference image) */}
        <button
          type="button"
          onClick={(e) => {
            if (handleSearchSubmit) {
              handleSearchSubmit(e);
            }
          }}
          className="ml-1.5 p-1.5 sm:p-2 rounded-xl bg-[#f04438] hover:bg-[#e03125] text-white shadow-xs flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-all"
          title="Search"
          aria-label="Search"
        >
          <Search className="w-4 h-4 text-white stroke-[2.5]" />
        </button>
      </div>

      {/* Animated Dropdown Suggestions Panel */}
      <AnimatePresence>
        {isSearchFocused && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-100 overflow-hidden text-left"
          >
            {/* 1. When Search Query is Empty -> Show Trending Searches & Express Deals */}
            {!searchQuery.trim() ? (
              <div className="p-3.5 space-y-3">
                {/* Header title */}
                <div className="flex items-center justify-between text-xs font-black text-slate-800 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    <span>Trending Search Queries</span>
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">
                    ⚡ 10 Min Delivery
                  </span>
                </div>

                {/* Trending Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {TRENDING_SEARCH_CHIPS.map((chip, idx) => (
                    <motion.button
                      key={chip.query}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.04 }}
                      type="button"
                      onClick={() => handleChipClick(chip.query)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200/80 text-slate-700 font-bold text-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                    >
                      <span>{chip.label}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Quick Hint */}
                <div className="bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200/80 p-2.5 rounded-xl text-[11px] text-slate-700 font-medium flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                    <span>Type any item, brand or category name above</span>
                  </span>
                  <span className="text-emerald-800 font-extrabold text-[10px]">Instant Search</span>
                </div>
              </div>
            ) : (
              /* 2. When Query exists -> Show Matching Results List with Direct Add */
              <div className="divide-y divide-slate-100">
                <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
                  <span>
                    Found <strong className="text-slate-900 font-extrabold">{matchingProducts.length}</strong> matching groceries
                  </span>
                  <span className="text-[10px] text-emerald-700 font-extrabold uppercase">
                    Press Enter to view top result
                  </span>
                </div>

                {matchingProducts.length === 0 ? (
                  <div className="p-6 text-center space-y-2">
                    <p className="text-sm font-bold text-slate-700">No matching items found for "{searchQuery}"</p>
                    <p className="text-xs text-slate-500">Try searching "Milk", "Rice", "Tomato", or "Atta"</p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                    {matchingProducts.slice(0, 8).map((prod, idx) => {
                      const savings = Math.max(0, prod.mrp - prod.price);

                      return (
                        <motion.div
                          key={prod.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          onClick={() => handleProductSelect(prod)}
                          className="p-2.5 hover:bg-emerald-50/70 transition-colors flex items-center gap-3 cursor-pointer group"
                        >
                          {/* Image */}
                          <div className="w-12 h-12 rounded-xl bg-slate-50 p-1 border border-slate-200/90 shrink-0 overflow-hidden group-hover:border-emerald-500 transition-colors flex items-center justify-center">
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-emerald-800 transition-colors truncate">
                              {prod.name}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                              <span>{prod.unit} • {prod.category}</span>
                              {prod.stock <= 0 ? (
                                <span className="text-rose-600 font-black uppercase text-[9px] bg-rose-50 px-1 rounded border border-rose-200">OUT OF STOCK</span>
                              ) : (
                                <span className="text-emerald-700 font-bold text-[9px] bg-emerald-50 px-1 rounded border border-emerald-200">Stock: {prod.stock}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs font-black text-emerald-700">₹{prod.price}</span>
                              {prod.mrp > prod.price && (
                                <span className="text-[10px] line-through text-slate-400">₹{prod.mrp}</span>
                              )}
                              {savings > 0 && (
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                                  Save ₹{savings}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Button: Quick Add or Arrow */}
                          <div className="shrink-0 flex items-center gap-2">
                            {onAddToCart && prod.stock > 0 ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  triggerFlyToCart(prod, e);
                                  onAddToCart(prod);
                                }}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] px-2.5 py-1 rounded-lg shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                              >
                                <span>ADD</span>
                                <ShoppingBag className="w-3 h-3 text-white" />
                              </button>
                            ) : prod.stock <= 0 ? (
                              <span className="text-[9px] font-black text-rose-700 bg-rose-100 px-2 py-1 rounded-md border border-rose-300 uppercase">
                                OUT OF STOCK
                              </span>
                            ) : null}
                            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
