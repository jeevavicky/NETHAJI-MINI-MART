import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, Search, Heart, X, ShoppingBag, Plus, Minus, 
  Sparkles, Filter, SlidersHorizontal, ArrowUpDown, Zap, Check, Mic, MicOff
} from 'lucide-react';
import { Category, Product } from '../types';
import { useCartAnimation } from './CartAnimationProvider';

interface CategoryPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  categories: Category[];
  products: Product[];
  cart: { [productId: string]: number };
  wishlistIds: string[];
  onSelectCategory: (categoryName: string) => void;
  onAddToCart: (product: Product) => void;
  onUpdateCartQuantity: (productId: string, quantity: number) => void;
  onToggleWishlist: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  freeDeliveryThreshold?: number;
}

export const CategoryPageModal: React.FC<CategoryPageModalProps> = ({
  isOpen,
  onClose,
  categoryName,
  categories,
  products,
  cart,
  wishlistIds,
  onSelectCategory,
  onAddToCart,
  onUpdateCartQuantity,
  onToggleWishlist,
  onQuickView,
  onOpenCart,
  onOpenWishlist,
  freeDeliveryThreshold = 299
}) => {
  const { triggerFlyToCart } = useCartAnimation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [selectedSubFilter, setSelectedSubFilter] = useState<'all' | 'deals' | 'popular' | 'price_low' | 'price_high'>('all');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser. Try Google Chrome or Microsoft Edge.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { console.error(e); }
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setShowSearchInput(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setSearchQuery(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition", err);
      setIsListening(false);
    }
  };

  const [visibleCount, setVisibleCount] = useState(30);

  useEffect(() => {
    setVisibleCount(30);
  }, [categoryName, searchQuery, selectedSubFilter]);

  // Find products matching the current category (Memoized)
  const categoryProducts = useMemo(() => {
    let filtered = products;

    if (categoryName && categoryName !== "All") {
      const lowerCat = categoryName.toLowerCase().trim();
      const keywords = lowerCat.split(/[\s,&/]+/).filter(w => w.length > 2);

      filtered = products.filter(p => {
        const prodCat = (p.category || '').toLowerCase().trim();
        const prodTags = p.tags ? p.tags.map(t => t.toLowerCase()) : [];
        const prodName = (p.name || '').toLowerCase();

        // 1. Direct or substring match on category
        if (prodCat === lowerCat || prodCat.includes(lowerCat) || lowerCat.includes(prodCat)) {
          return true;
        }
        // 2. Exact or substring match in tags
        if (prodTags.some(t => t === lowerCat || t.includes(lowerCat) || lowerCat.includes(t))) {
          return true;
        }
        // 3. Keyword match across category, tags, and product name
        if (keywords.length > 0 && keywords.some(k => prodCat.includes(k) || prodTags.some(t => t.includes(k)) || prodName.includes(k))) {
          return true;
        }
        return false;
      });
    }

    // Apply internal search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    // Apply sub filter / sorting
    if (selectedSubFilter === 'deals') {
      filtered = filtered.filter(p => p.isOffer || p.isOneRupeeZone || (p.mrp > p.price));
    } else if (selectedSubFilter === 'popular') {
      filtered = filtered.filter(p => p.isPopular || p.rating >= 4.5);
    } else if (selectedSubFilter === 'price_low') {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (selectedSubFilter === 'price_high') {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    }

    return filtered;
  }, [products, categoryName, searchQuery, selectedSubFilter]);

  const displayedProducts = useMemo(() => {
    return categoryProducts.slice(0, visibleCount);
  }, [categoryProducts, visibleCount]);

  // Cart totals (Memoized)
  const totalCartItems = useMemo(() => {
    return Object.values(cart).reduce<number>((sum, qty) => sum + (Number(qty) || 0), 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return products.reduce((sum, p) => {
      const qty = cart[p.id] || 0;
      return sum + (p.price * qty);
    }, 0);
  }, [products, cart]);

  const remainingForFreeDelivery = Math.max(0, freeDeliveryThreshold - cartSubtotal);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-5xl h-[96vh] sm:h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 mx-auto animate-in slide-in-from-bottom-6 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Navigation Bar matching Zepto/Blinkit Category Page Header */}
        <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <div className="truncate">
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight truncate flex items-center gap-2">
                <span>{categoryName || "Category Products"}</span>
                <span className="text-xs font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  {categoryProducts.length} items
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Search Toggle */}
            <button
              type="button"
              onClick={() => setShowSearchInput(!showSearchInput)}
              className={`p-2 rounded-full border transition-all cursor-pointer ${
                showSearchInput ? 'bg-purple-900 text-white border-purple-900' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
              title="Search in category"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Wishlist Icon */}
            <button
              type="button"
              onClick={onOpenWishlist}
              className="p-2 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-100 transition-all cursor-pointer relative"
              title="Wishlist"
            >
              <Heart className="w-4 h-4 text-rose-600 fill-rose-500" />
              {wishlistIds.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {wishlistIds.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar Dropdown */}
        {showSearchInput && (
          <div className={`px-4 py-2 border-b flex items-center gap-2 animate-in slide-in-from-top-2 duration-150 ${
            isListening ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-slate-200'
          }`}>
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder={isListening ? "🎙️ Listening... Speak now..." : `Search products in ${categoryName}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-slate-900 text-xs font-bold focus:outline-none"
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={toggleVoiceSearch}
              className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                isListening ? 'bg-rose-600 text-white animate-pulse' : 'text-slate-500 hover:text-emerald-700 hover:bg-slate-200'
              }`}
              title={isListening ? "Stop listening" : "Voice Search"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* Horizontal Category Switcher Bar */}
        <div className="px-4 py-2.5 bg-purple-50/60 border-b border-purple-100/80 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => onSelectCategory("All")}
            className={`px-3 py-1.5 rounded-full text-xs font-black transition-all shrink-0 cursor-pointer border ${
              categoryName === "All"
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-white border-purple-200/80 text-purple-900 hover:bg-purple-100'
            }`}
          >
            All Items
          </button>

          {categories.map((cat) => {
            const isCurrent = cat.name === categoryName;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.name)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all shrink-0 cursor-pointer border flex items-center gap-1.5 ${
                  isCurrent
                    ? 'bg-purple-900 text-white border-purple-900 shadow-2xs ring-2 ring-purple-400/30'
                    : 'bg-white border-purple-200/80 text-purple-900 hover:bg-purple-100'
                }`}
              >
                <img src={cat.image} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Sub-Filters / Sort Chips Bar */}
        <div className="px-4 py-2 bg-white border-b border-slate-100 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0 text-xs font-bold text-slate-600">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" /> Filter:
            </span>
            <button
              onClick={() => setSelectedSubFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-colors ${
                selectedSubFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedSubFilter('deals')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-colors flex items-center gap-1 ${
                selectedSubFilter === 'deals' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <Zap className="w-3 h-3 fill-current" /> Deals
            </button>
            <button
              onClick={() => setSelectedSubFilter('popular')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-colors ${
                selectedSubFilter === 'popular' ? 'bg-purple-800 text-white' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
              }`}
            >
              Popular
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setSelectedSubFilter(selectedSubFilter === 'price_low' ? 'all' : 'price_low')}
              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold border transition-colors ${
                selectedSubFilter === 'price_low' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              Price: Low to High
            </button>
            <button
              onClick={() => setSelectedSubFilter(selectedSubFilter === 'price_high' ? 'all' : 'price_high')}
              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold border transition-colors ${
                selectedSubFilter === 'price_high' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              Price: High to Low
            </button>
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-[#f5f8f9] pb-24">
          {categoryProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 sm:gap-4">
                {displayedProducts.map((product) => {
                  const qty = cart[product.id] || 0;
                  const isWishlisted = wishlistIds.includes(product.id);
                  const savingsAmount = product.mrp > product.price ? product.mrp - product.price : 0;

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl p-2 sm:p-3 border border-slate-100 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative group"
                    >
                      {/* Top Image Box */}
                      <div className="relative w-full aspect-square bg-slate-50/60 rounded-xl overflow-hidden mb-2 p-1.5 flex items-center justify-center">
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=60';
                          }}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                          onClick={() => onQuickView(product)}
                        />

                        {/* Wishlist Heart */}
                        <button
                          type="button"
                          onClick={() => onToggleWishlist(product)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-white/80 backdrop-blur-xs text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Wishlist"
                        >
                          <Heart
                            className={`w-4 h-4 ${isWishlisted ? 'text-rose-600 fill-rose-600' : 'text-slate-400'}`}
                          />
                        </button>

                        {/* Offer tag */}
                        {product.tags?.includes('one_rupee_zone') || product.price <= 10 ? (
                          <span className="absolute bottom-1 left-1 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-2xs">
                            ₹1 DEAL
                          </span>
                        ) : product.isOffer ? (
                          <span className="absolute bottom-1 left-1 bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded shadow-2xs">
                            OFFER
                          </span>
                        ) : null}

                        {/* ADD Button overlay */}
                        <div className="absolute -bottom-1.5 right-1 z-10">
                          {product.stock <= 0 ? (
                            <span className="bg-rose-100 text-rose-700 font-black text-[9px] px-1.5 py-0.5 rounded-lg border border-rose-300 uppercase tracking-wider shadow-2xs">
                              OUT OF STOCK
                            </span>
                          ) : qty === 0 ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                triggerFlyToCart(product, e);
                                onAddToCart(product);
                              }}
                              className="bg-white hover:bg-rose-50 text-rose-600 border-2 border-rose-500 hover:border-rose-600 font-black text-xs px-3 py-0.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
                            >
                              ADD
                            </button>
                          ) : (
                            <div className="bg-rose-600 text-white font-black text-xs flex items-center gap-1.5 px-2 py-0.5 rounded-xl shadow-xs">
                              <button
                                type="button"
                                onClick={() => onUpdateCartQuantity(product.id, qty - 1)}
                                className="hover:text-amber-200 cursor-pointer"
                              >
                                <Minus className="w-3 h-3 stroke-[3]" />
                              </button>
                              <span className="text-xs font-black">{qty}</span>
                              <button
                                type="button"
                                disabled={qty >= product.stock}
                                onClick={(e) => {
                                 if (qty < product.stock) {
                                    triggerFlyToCart(product, e);
                                    onAddToCart(product);
                                  }
                                }}
                                className={`${qty >= product.stock ? 'opacity-50 cursor-not-allowed' : 'hover:text-amber-200 cursor-pointer'}`}
                              >
                                <Plus className="w-3 h-3 stroke-[3]" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pricing & Offer Label */}
                      <div className="mt-1 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="bg-emerald-700 text-white text-xs font-black px-1.5 py-0.5 rounded-md shadow-2xs">
                            ₹{product.price}
                          </span>
                          {product.mrp > product.price && (
                            <span className="text-[11px] font-bold text-slate-400 line-through">
                              ₹{product.mrp}
                            </span>
                          )}
                        </div>

                        {savingsAmount > 0 && (
                          <p className="text-[11px] font-black text-emerald-700">
                            ₹{savingsAmount} OFF
                          </p>
                        )}

                        {/* Title & Weight */}
                        <h3 
                          onClick={() => onQuickView(product)}
                          className="text-xs font-extrabold text-slate-900 leading-snug line-clamp-2 mt-1 cursor-pointer hover:text-purple-700 transition-colors"
                        >
                          {product.name}
                        </h3>

                        <div className="flex items-center justify-between gap-1 text-[10px] font-bold mt-0.5">
                          <span className="text-slate-400 truncate">{product.unit}</span>
                          {product.stock <= 0 ? (
                            <span className="text-rose-600 font-extrabold uppercase">OUT OF STOCK</span>
                          ) : (
                            <span className="text-emerald-800 font-extrabold">Stock: {product.stock}</span>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

              {categoryProducts.length > displayedProducts.length && (
                <div className="flex justify-center pt-5 pb-2">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 30)}
                    className="bg-white hover:bg-emerald-50 text-emerald-800 border-2 border-emerald-600 font-black text-xs px-5 py-2 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    Load More ({categoryProducts.length - displayedProducts.length} more)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-3">
                <Filter className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-base">No items found in this filter</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Try clearing search or switching categories above.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSubFilter('all');
                }}
                className="mt-4 px-4 py-2 bg-purple-900 text-white font-bold text-xs rounded-xl hover:bg-purple-800 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Floating Bottom Cart Bar */}
        <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center justify-between gap-2 pointer-events-auto">
          {/* Free Delivery Bar */}
          <div className="bg-slate-900/95 backdrop-blur-md text-white px-3 py-2 rounded-2xl flex items-center gap-2 shadow-xl border border-slate-800 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs shrink-0 border border-slate-700">
              🛵
            </div>
            <div className="truncate">
              {remainingForFreeDelivery > 0 ? (
                <>
                  <p className="font-extrabold text-[11px] text-white leading-tight truncate">
                    Unlock free delivery
                  </p>
                  <p className="text-[10px] text-slate-300 font-bold truncate">
                    Shop for <strong className="text-amber-400">₹{remainingForFreeDelivery} more</strong>
                  </p>
                </>
              ) : (
                <>
                  <p className="font-extrabold text-[11px] text-emerald-400 leading-tight truncate">
                    🎉 Free delivery unlocked!
                  </p>
                  <p className="text-[10px] text-slate-300 truncate">
                    Enjoy ₹0 delivery charge
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Cart Button */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCart();
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 shadow-2xl border border-rose-500 cursor-pointer active:scale-95 transition-all shrink-0"
          >
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-white">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
            <span>
              Cart • {totalCartItems} {totalCartItems === 1 ? 'item' : 'items'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
