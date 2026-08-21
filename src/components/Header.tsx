import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, Search, Heart, ShoppingCart, User, ShieldCheck, 
  Store, ChevronDown, PhoneCall, Sparkles, X, Menu, Truck, MapPin, Bike, ChevronLeft, ChevronRight,
  Mic, MicOff, Volume2, CheckCircle2, Lightbulb, Home, LayoutGrid, BadgePercent, Headphones,
  FileText, ExternalLink, ArrowRight, Phone, MessageCircle, Clock, ShieldAlert, Check
} from 'lucide-react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
import { Category, StoreSettings, DeliveryLocation, Product, CartItem } from '../types';
import { useCartAnimation } from './CartAnimationProvider';
import { AnimatedSearchBar } from './AnimatedSearchBar';

interface HeaderProps {
  settings: StoreSettings;
  categories: Category[];
  products?: Product[];
  cartCount: number;
  cartSubtotal: number;
  wishlistCount: number;
  cartItems?: CartItem[];
  onUpdateCartQuantity?: (productId: string, quantity: number) => void;
  onAddToCart?: (product: Product, quantity?: number) => void;
  activeCategory: string;
  onSelectCategory: (categoryName: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectProduct?: (product: Product) => void;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenOrders: () => void;
  onOpenAuth: () => void;
  isAdminMode: boolean;
  onToggleAdminMode: () => void;
  currentUserPhone: string | null;
  deliveryLocation: DeliveryLocation;
  onOpenLocationModal: () => void;
  onOpenRiderPortal?: () => void;
  onOpenOneRupeeOffers?: () => void;
  onOpenSuggestion?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  categories,
  products = [],
  cartCount,
  cartSubtotal,
  wishlistCount,
  cartItems = [],
  onUpdateCartQuantity,
  onAddToCart,
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onSelectProduct,
  onOpenCart,
  onOpenWishlist,
  onOpenOrders,
  onOpenAuth,
  isAdminMode,
  onToggleAdminMode,
  currentUserPhone,
  deliveryLocation,
  onOpenLocationModal,
  onOpenRiderPortal,
  onOpenOneRupeeOffers,
  onOpenSuggestion
}) => {
  const { isCartBouncing } = useCartAnimation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [drawerCategoriesOpen, setDrawerCategoriesOpen] = useState(false);
  const [contactShopModalOpen, setContactShopModalOpen] = useState(false);
  const [policiesModalOpen, setPoliciesModalOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);

  // Zepto Cart Popover State & Refs
  const [isCartPopoverOpen, setIsCartPopoverOpen] = useState(false);
  const cartPopoverRef = useRef<HTMLDivElement>(null);
  const prevCartCountRef = useRef(cartCount);

  // Auto-open popover when items are added to cart
  useEffect(() => {
    if (cartCount > prevCartCountRef.current) {
      setIsCartPopoverOpen(true);
      const timer = setTimeout(() => {
        setIsCartPopoverOpen(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
    prevCartCountRef.current = cartCount;
  }, [cartCount]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleCartClickOutside = (event: MouseEvent | TouchEvent) => {
      if (cartPopoverRef.current && !cartPopoverRef.current.contains(event.target as Node)) {
        setIsCartPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleCartClickOutside);
    document.addEventListener('touchstart', handleCartClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleCartClickOutside);
      document.removeEventListener('touchstart', handleCartClickOutside);
    };
  }, []);

  // Helper to select product and open modal
  const handleProductSelect = (prod: Product) => {
    setIsSearchFocused(false);
    onSearchChange(prod.name);
    if (onSelectProduct) {
      onSelectProduct(prod);
    }
  };

  // Form submit handler when pressing Enter or 'Search/Go' on mobile keyboard
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (matchingProducts.length > 0) {
      handleProductSelect(matchingProducts[0]);
    }
  };

  // Handle Enter key in search input to open top product page like Zepto
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (matchingProducts.length > 0) {
        handleProductSelect(matchingProducts[0]);
      }
    }
  };

  // Close search suggestions overlay when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      const isInsideDesktop = searchContainerRef.current && searchContainerRef.current.contains(target);
      const isInsideMobile = mobileSearchContainerRef.current && mobileSearchContainerRef.current.contains(target);
      if (!isInsideDesktop && !isInsideMobile) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Web Speech API Voice Search State
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [listeningError, setListeningError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  const toggleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setListeningError("Voice search is not supported in this browser. Try Chrome or Edge.");
      setTimeout(() => setListeningError(null), 4000);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error(e);
        }
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Optimized for Indian English grocery queries

      recognition.onstart = () => {
        setIsListening(true);
        setListeningError(null);
        setIsSearchFocused(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          onSearchChange(transcript);
          setIsSearchFocused(true);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setListeningError("Microphone permission denied. Please allow mic access.");
        } else if (event.error === 'no-speech') {
          setListeningError("No voice detected. Speak closer to your microphone.");
        } else {
          setListeningError("Speech not recognized. Please try again.");
        }
        setTimeout(() => setListeningError(null), 4000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition", err);
      setIsListening(false);
      setListeningError("Could not activate microphone.");
      setTimeout(() => setListeningError(null), 4000);
    }
  };



  // Matching search suggestions (Memoized for high typing performance)
  const matchingProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results: Product[] = [];
    for (const p of products) {
      if (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      ) {
        results.push(p);
        if (results.length >= 10) break;
      }
    }
    return results;
  }, [products, searchQuery]);

  // Scroll detection for auto-hiding header on scroll down and revealing on scroll up
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const prevScrollY = useRef(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Always show when near the top
          if (currentScrollY <= 40) {
            setIsHeaderVisible(true);
          } else if (currentScrollY > prevScrollY.current + 8) {
            // Scrolling down -> smoothly hide header
            setIsHeaderVisible(false);
            setCategoryDropdownOpen(false);
            setIsCartPopoverOpen(false);
          } else if (currentScrollY < prevScrollY.current - 8) {
            // Scrolling up -> automatically reveal and enable header
            setIsHeaderVisible(true);
          }

          prevScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Trending search keywords for Zepto overlay
  const trendingKeywords = [
    "Atta 10kg", "Amul Milk", "Fortune Oil", "Tata Salt", "Paneer", "Rin Soap", "Biscuits", "Ghee"
  ];

  // Top recommended products for empty search focus (Memoized)
  const featuredSearchProducts = useMemo(() => {
    return products.slice(0, 5);
  }, [products]);

  const shouldShowHeader = isHeaderVisible || isSearchFocused || mobileMenuOpen;

  return (
    <header 
      id="main-store-header" 
      className={`sticky top-0 z-40 bg-[#1c5d39] text-white border-b border-emerald-900 shadow-md transition-all duration-300 ease-in-out ${
        shouldShowHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3 md:gap-6">
          
          {/* Mobile Menu Button, Brand Logo & Desktop Location Widget */}
          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            <button 
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="p-1.5 text-white hover:bg-emerald-800/80 rounded-xl transition-colors cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 stroke-[2.5]" />}
            </button>

            <div 
              onClick={() => onSelectCategory("All")}
              className="flex items-center gap-2 cursor-pointer group"
            >
              {settings.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt={settings.storeName || "Store Logo"} 
                  className="w-10 h-10 object-contain rounded-xl shadow-xs group-hover:scale-105 transition-transform bg-[#0F5328] border border-emerald-600/50 p-0.5 shrink-0"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback if image fails to load
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform shrink-0">
                  <ShoppingBag className="w-6 h-6 text-amber-300" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-black text-xl tracking-tight text-white uppercase">
                    {settings.storeName || "NETHAJI MINI MART"}
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-emerald-200 tracking-wider uppercase hidden sm:block">
                  {settings.tagline || "Fresh Groceries & Daily Essentials"}
                </p>
              </div>
            </div>

            {/* Desktop Prominent Live Location Widget */}
            <button
              type="button"
              id="header-location-widget-btn"
              onClick={onOpenLocationModal}
              className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 text-white hover:bg-emerald-950 border border-emerald-700/60 transition-all cursor-pointer group shrink-0 text-left shadow-xs ml-2"
              title="Click to update delivery location"
            >
              <div className="w-7 h-7 rounded-full border border-amber-400/80 bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <MapPin className="w-4 h-4 fill-amber-400/20" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[11px] text-emerald-200 font-medium tracking-tight">
                  Delivering to <strong className="text-white font-extrabold">{deliveryLocation.city} {deliveryLocation.pincode}</strong>
                </span>
                <span className="text-xs font-black text-amber-400 group-hover:underline flex items-center gap-1">
                  Update location
                </span>
              </div>
            </button>
          </div>

          {/* Search Bar & Action Buttons Container with Reel-inspired Animated Search */}
          <div className="flex-1 max-w-2xl hidden md:flex flex-col gap-2 items-end">
            <AnimatedSearchBar
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              isListening={isListening}
              toggleVoiceSearch={toggleVoiceSearch}
              speechSupported={speechSupported}
              isSearchFocused={isSearchFocused}
              setIsSearchFocused={setIsSearchFocused}
              matchingProducts={matchingProducts}
              handleProductSelect={handleProductSelect}
              handleSearchSubmit={handleSearchSubmit}
              handleSearchKeyDown={handleSearchKeyDown}
              searchContainerRef={searchContainerRef}
              onAddToCart={onAddToCart}
            />

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {/* 1 Rs Offer Pill Button */}
              {onOpenOneRupeeOffers && (
                <button
                  type="button"
                  onClick={onOpenOneRupeeOffers}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-600 to-amber-600 hover:from-amber-600 hover:to-rose-700 text-white font-black text-xs shadow-2xs border border-amber-300 transition-all cursor-pointer active:scale-95 shrink-0"
                  title="1 Rs Offer Store Page"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>₹1 Offers</span>
                </button>
              )}

              {/* Suggestion / Request Item Button */}
              {onOpenSuggestion && (
                <button
                  id="suggest-product-btn"
                  onClick={onOpenSuggestion}
                  className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 font-bold text-xs shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0"
                  title="Request a Product or Suggest a Feature"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600 fill-amber-500 animate-pulse" />
                  <span>Suggest Item</span>
                </button>
              )}

              {/* 1. Wishlist Icon Button */}
              <button
                id="wishlist-btn"
                onClick={onOpenWishlist}
                className="relative p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200/90 rounded-xl transition-all shadow-2xs active:scale-95 flex items-center justify-center cursor-pointer"
                title="Wishlist"
                aria-label="Wishlist"
              >
                <Heart className="w-4.5 h-4.5 text-rose-600 fill-rose-500" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs border border-white">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* 2. Track Orders Icon Button */}
              <button
                id="my-orders-btn"
                onClick={onOpenOrders}
                className="relative p-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl transition-all shadow-2xs active:scale-95 flex items-center justify-center cursor-pointer"
                title="Track Orders"
                aria-label="Track Orders"
              >
                <Truck className="w-4.5 h-4.5 text-slate-950" />
              </button>

              {/* 3. Customer Auth / Profile Button */}
              {currentUserPhone ? (
                <button
                  id="user-profile-btn"
                  onClick={onOpenAuth}
                  className="p-2 bg-purple-100 hover:bg-purple-200 border border-purple-200 text-purple-900 rounded-xl transition-all shadow-2xs active:scale-95 flex items-center justify-center cursor-pointer"
                  title={`Logged in as ${currentUserPhone}`}
                  aria-label="User Profile"
                >
                  <User className="w-4.5 h-4.5 text-purple-900 fill-purple-900" />
                </button>
              ) : (
                <button
                  id="login-btn"
                  onClick={onOpenAuth}
                  className="px-3 py-1.5 bg-gradient-to-r from-purple-900 to-rose-900 hover:from-purple-950 hover:to-rose-950 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 flex items-center gap-1 shrink-0"
                  title="Login or Create Account"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Login</span>
                </button>
              )}

              {/* 4. Grocery Cart Icon Button & Instant Popover */}
              <div ref={cartPopoverRef} className="relative">
                <button
                  id="header-cart-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (cartCount > 0) {
                      setIsCartPopoverOpen((prev) => !prev);
                    } else {
                      onOpenCart();
                    }
                  }}
                  className={`flex flex-col items-center justify-center p-1 hover:bg-slate-100 rounded-xl transition-all active:scale-95 cursor-pointer relative group ${
                    isCartBouncing ? "scale-125 duration-150" : ""
                  }`}
                  title={`Grocery Cart (${cartCount} items - ₹${cartSubtotal})`}
                  aria-label="Grocery Cart"
                >
                  <div className={`relative p-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs transition-all flex items-center justify-center ${
                    isCartBouncing ? "ring-4 ring-amber-400 bg-amber-500 text-slate-950 scale-110 shadow-lg shadow-amber-500/50" : ""
                  }`}>
                    <ShoppingCart className={`w-4.5 h-4.5 ${isCartBouncing ? "text-slate-950 stroke-[3]" : "text-amber-300"}`} />
                    {cartCount > 0 && (
                      <span className={`absolute -top-1.5 -right-1.5 bg-rose-600 text-white font-black text-[10px] min-w-[18px] h-4.5 px-1 rounded-full flex items-center justify-center shadow-xs border-2 border-white ${
                        isCartBouncing ? "scale-125 bg-amber-600 text-slate-950" : ""
                      }`}>
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-700 mt-0.5 tracking-tight group-hover:text-emerald-700">
                    Cart
                  </span>
                </button>

                {/* Zepto Style Instant Cart Dropdown Popover */}
                {isCartPopoverOpen && cartCount > 0 && (
                  <div className="absolute top-full right-0 mt-2 z-50 w-76 sm:w-84 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-3.5 text-left animate-in fade-in zoom-in-95 duration-150">
                    
                    {/* Top Pointer Beak pointing to Cart icon */}
                    <div className="absolute -top-2 right-4 w-3.5 h-3.5 bg-white border-t border-l border-slate-200/90 rotate-45 z-10" />

                    {/* Popover Header */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 relative z-20">
                      <div className="flex items-center gap-1.5 text-emerald-600 font-extrabold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100 shrink-0" />
                        <span>Added to Cart</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCartPopoverOpen(false);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer transition-colors"
                        title="Close preview"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Cart Items List matching screenshot */}
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 my-2 pr-1 space-y-2.5 custom-scrollbar relative z-20">
                      {cartItems.map((item) => {
                        const itemTotal = item.product.price * item.quantity;
                        const itemMrpTotal = item.product.mrp * item.quantity;

                        return (
                          <div key={item.product.id} className="pt-2.5 first:pt-1 flex items-start gap-2.5 group">
                            {/* Product Thumbnail */}
                            <div 
                              className="w-14 h-14 bg-slate-50 rounded-xl p-1 border border-slate-200/90 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer group-hover:border-emerald-500 transition-colors"
                              onClick={() => handleProductSelect(item.product)}
                            >
                              <img
                                src={item.product.image}
                                alt={item.product.name}
                                className="w-full h-full object-contain"
                              />
                            </div>

                            {/* Product Title & Weight/Qty */}
                            <div className="flex-1 min-w-0">
                              <h4 
                                className="font-bold text-slate-900 text-xs line-clamp-2 cursor-pointer hover:text-emerald-700 leading-snug"
                                onClick={() => handleProductSelect(item.product)}
                              >
                                {item.product.name}
                              </h4>

                              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                {item.product.unit} ×{item.quantity}
                              </p>

                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="bg-emerald-600 text-white font-extrabold text-xs px-2 py-0.5 rounded-md shadow-2xs">
                                  ₹{itemTotal}
                                </span>
                                {itemMrpTotal > itemTotal && (
                                  <span className="line-through text-slate-400 text-[11px] font-normal">
                                    ₹{itemMrpTotal}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Quantity Controls */}
                            {onUpdateCartQuantity && (
                              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 shrink-0 self-center border border-slate-200">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateCartQuantity(item.product.id, item.quantity - 1);
                                  }}
                                  className="w-5 h-5 bg-white text-slate-800 rounded font-black text-xs flex items-center justify-center hover:bg-rose-600 hover:text-white transition-colors cursor-pointer shadow-2xs"
                                >
                                  -
                                </button>
                                <span className="font-extrabold text-xs text-slate-900 px-1">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateCartQuantity(item.product.id, item.quantity + 1);
                                  }}
                                  className="w-5 h-5 bg-white text-slate-800 rounded font-black text-xs flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer shadow-2xs"
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Bottom Action Footer Button */}
                    <div className="pt-2 border-t border-slate-100 relative z-20">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCartPopoverOpen(false);
                          onOpenCart();
                        }}
                        className="w-full border border-pink-200 hover:border-pink-300 bg-pink-50/50 hover:bg-pink-100/90 text-rose-600 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
                      >
                        <span>Go to Cart</span>
                        <ChevronRight className="w-3.5 h-3.5 text-rose-600" />
                      </button>
                    </div>

                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search Input & Instant Suggestion List */}
        <div className="mt-2 md:hidden flex flex-col gap-2 relative">
          <AnimatedSearchBar
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            isListening={isListening}
            toggleVoiceSearch={toggleVoiceSearch}
            speechSupported={speechSupported}
            isSearchFocused={isSearchFocused}
            setIsSearchFocused={setIsSearchFocused}
            matchingProducts={matchingProducts}
            handleProductSelect={handleProductSelect}
            handleSearchSubmit={handleSearchSubmit}
            handleSearchKeyDown={handleSearchKeyDown}
            searchContainerRef={mobileSearchContainerRef}
            isMobile={true}
            onAddToCart={onAddToCart}
          />

          <div className="flex items-center justify-end gap-2.5 pt-0.5">
            {/* 1. Pink Wishlist Button */}
            <button
              id="mobile-header-wishlist-btn"
              onClick={onOpenWishlist}
              className="relative w-10 h-10 bg-[#feeef1] hover:bg-[#fed7df] border border-rose-200/80 rounded-2xl flex items-center justify-center cursor-pointer shadow-2xs active:scale-95 transition-all shrink-0"
              title="Wishlist"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5 text-[#f8526a] fill-[#f8526a]" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center shadow-xs border border-white">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* 2. Orange Delivery / Track Orders Button */}
            <button
              id="mobile-header-orders-btn"
              onClick={onOpenOrders}
              className="relative w-10 h-10 bg-[#ff9f1c] hover:bg-[#f79310] text-slate-950 rounded-2xl flex items-center justify-center cursor-pointer shadow-2xs active:scale-95 transition-all shrink-0"
              title="Track Orders"
              aria-label="Track Orders"
            >
              <Truck className="w-5 h-5 text-slate-950 stroke-[2.2]" />
            </button>

            {/* 3. Deep Green Cart Button */}
            <button
              id="mobile-header-cart-btn"
              onClick={onOpenCart}
              className="relative w-10 h-10 bg-[#0c6b41] hover:bg-[#095734] text-white rounded-2xl flex items-center justify-center cursor-pointer shadow-2xs active:scale-95 transition-all shrink-0"
              title="Grocery Cart"
              aria-label="Grocery Cart"
            >
              <ShoppingCart className="w-5 h-5 text-[#facc15] stroke-[2.2]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 font-black text-[9px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center shadow-xs border border-emerald-900">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills Navigation Bar */}
      <div className="bg-white border-t border-slate-200/90 overflow-x-auto no-scrollbar shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center gap-2 text-xs font-semibold">
          
          {/* Categories Dropdown Button */}
          <div className="relative shrink-0">
            <button
              id="all-categories-dropdown-btn"
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className="flex items-center gap-1.5 bg-[#0c4025] text-white px-3.5 py-2 rounded-xl font-bold shadow-xs hover:bg-[#09321d] transition-all cursor-pointer"
            >
              <span>All Categories</span>
              <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>

            {categoryDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-60 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={() => {
                    onSelectCategory("All");
                    setCategoryDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-emerald-50 hover:text-emerald-800 ${
                    activeCategory === "All" ? "bg-emerald-50 text-emerald-800 font-bold" : "text-slate-700"
                  }`}
                >
                  All Grocery Items
                </button>
                <div className="border-t border-slate-100 my-1"></div>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      onSelectCategory(cat.name);
                      setCategoryDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-emerald-50 hover:text-emerald-800 flex items-center justify-between ${
                      activeCategory === cat.name ? "bg-emerald-50 text-emerald-800 font-bold" : "text-slate-700"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                      {cat.itemCount}
                    </span>
                  </button>
                ))}

                {onOpenRiderPortal && (
                  <>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button
                      id="menu-rider-portal-btn"
                      onClick={() => {
                        onOpenRiderPortal();
                        setCategoryDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-extrabold text-amber-950 hover:bg-amber-50 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Bike className="w-4 h-4 text-amber-600" />
                        <span>Rider Partner Portal</span>
                      </span>
                      <span className="text-[9px] bg-amber-200 text-amber-950 font-black px-1.5 py-0.5 rounded uppercase">RIDER</span>
                    </button>
                  </>
                )}

                <div className="border-t border-slate-100 my-1"></div>
                <button
                  id="admin-mode-toggle-btn"
                  onClick={() => {
                    onToggleAdminMode();
                    setCategoryDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-extrabold text-slate-800 hover:bg-slate-100 flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {isAdminMode ? (
                      <>
                        <Store className="w-4 h-4 text-amber-600" />
                        <span>Switch to Customer Store</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                        <span>Admin Panel / Store Dashboard</span>
                      </>
                    )}
                  </span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${isAdminMode ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'}`}>
                    {isAdminMode ? 'STORE' : 'ADMIN'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Category Pills */}
          <button
            onClick={() => onSelectCategory("All")}
            className={`shrink-0 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeCategory === "All"
                ? "bg-[#0c4025] text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            All Items
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.name)}
              className={`shrink-0 px-3.5 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeCategory === cat.name
                  ? "bg-[#0c4025] text-white font-bold shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>{cat.name}</span>
            </button>
          ))}

        </div>
      </div>

      {/* 3-Line Options Slide-out Drawer (off-page style matching screenshot) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop Overlay with slight translucency so background page peeks through */}
          <div 
            className="fixed inset-0 bg-black/55 backdrop-blur-[2px] transition-opacity duration-300 animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Off-page Drawer Content Panel with rounded right border */}
          <div className="fixed inset-y-0 left-0 w-[78vw] sm:w-[320px] max-w-[340px] bg-white rounded-r-3xl shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-300 text-slate-900 overflow-hidden">
            
            {/* 1. Header Section: Store Name & Location */}
            <div className="p-5 pb-3 bg-white">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-tight">
                    {settings.storeName || "NETHAJI MINI MART"}
                  </h2>

                  {/* Delivery Location Row */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenLocationModal();
                    }}
                    className="flex items-center gap-1 text-xs text-slate-900 font-bold mt-1 text-left hover:text-emerald-700 transition-colors group cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-slate-950 fill-slate-950 shrink-0" />
                    <span className="truncate max-w-[190px]">
                      Delivery to {deliveryLocation.city || "Tirupathur"}, {deliveryLocation.city || "Tirupathur"}, Ti...
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-900 group-hover:translate-y-0.5 transition-transform shrink-0" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 2. Red Banner: Login / Register */}
            <div 
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuth();
              }}
              className="bg-[#ea1d24] hover:bg-[#d01319] text-white px-5 py-3 flex items-center justify-between font-bold text-sm sm:text-base cursor-pointer transition-colors shadow-xs"
            >
              <span>{currentUserPhone ? `My Account (${currentUserPhone})` : "Login / Register"}</span>
              <ArrowRight className="w-4.5 h-4.5 text-white stroke-[2.5]" />
            </div>

            {/* 3. Navigation Menu Items List */}
            <div className="flex-1 overflow-y-auto py-2 divide-y divide-slate-100/50">
              
              {/* Browse */}
              <button
                type="button"
                onClick={() => {
                  onSelectCategory("All");
                  setMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full flex items-center gap-3.5 px-5 py-3 hover:bg-slate-50 transition-colors text-left text-slate-900 cursor-pointer"
              >
                <Home className="w-5 h-5 text-slate-900 stroke-[2.2]" />
                <span className="font-bold text-[15px] text-slate-900">Browse</span>
              </button>

              {/* Shop by Category */}
              <div>
                <button
                  type="button"
                  onClick={() => setDrawerCategoriesOpen(!drawerCategoriesOpen)}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors text-left text-slate-900 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <LayoutGrid className="w-5 h-5 text-slate-900 stroke-[2.2]" />
                    <span className="font-bold text-[15px] text-slate-900">Shop by Category</span>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-slate-900 stroke-[2.2] transition-transform duration-200 ${drawerCategoriesOpen ? 'rotate-90' : ''}`} />
                </button>

                {/* Expanded Categories Submenu */}
                {drawerCategoriesOpen && (
                  <div className="bg-slate-50/90 px-5 py-2 space-y-1 animate-in fade-in duration-150 border-y border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectCategory("All");
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left py-1.5 px-2.5 text-xs font-bold text-slate-800 hover:bg-emerald-100/60 rounded-md transition-colors"
                    >
                      🌟 All Categories
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          onSelectCategory(cat.name);
                          setMobileMenuOpen(false);
                        }}
                        className="w-full text-left py-1.5 px-2.5 text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-200/60 rounded-md transition-colors flex items-center justify-between"
                      >
                        <span className="truncate">{cat.name}</span>
                        {cat.itemCount ? (
                          <span className="text-[10px] text-slate-400 font-normal">{cat.itemCount} items</span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Deals */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenOneRupeeOffers) {
                    onOpenOneRupeeOffers();
                  } else {
                    onSelectCategory("Offers");
                  }
                }}
                className="w-full flex items-center gap-3.5 px-5 py-3 hover:bg-slate-50 transition-colors text-left text-slate-900 cursor-pointer"
              >
                <BadgePercent className="w-5 h-5 text-slate-900 stroke-[2.2]" />
                <span className="font-bold text-[15px] text-slate-900">Deals</span>
              </button>

              {/* Customer Service */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenSuggestion) {
                    onOpenSuggestion();
                  } else {
                    setContactShopModalOpen(true);
                  }
                }}
                className="w-full flex items-center gap-3.5 px-5 py-3 hover:bg-slate-50 transition-colors text-left text-slate-900 cursor-pointer"
              >
                <Headphones className="w-5 h-5 text-slate-900 stroke-[2.2]" />
                <span className="font-bold text-[15px] text-slate-900">Customer Service</span>
              </button>

              {/* Contact Shop */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setContactShopModalOpen(true);
                }}
                className="w-full flex items-center gap-3.5 px-5 py-3 hover:bg-slate-50 transition-colors text-left text-slate-900 cursor-pointer"
              >
                <Store className="w-5 h-5 text-slate-900 stroke-[2.2]" />
                <span className="font-bold text-[15px] text-slate-900">Contact Shop</span>
              </button>

              {/* Policies */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setPoliciesModalOpen(true);
                }}
                className="w-full flex items-center gap-3.5 px-5 py-3 hover:bg-slate-50 transition-colors text-left text-slate-900 cursor-pointer"
              >
                <FileText className="w-5 h-5 text-slate-900 stroke-[2.2]" />
                <span className="font-bold text-[15px] text-slate-900">Policies</span>
              </button>

              {/* Search */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  // Scroll to top & focus search
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                  if (searchInput) {
                    setTimeout(() => searchInput.focus(), 300);
                  }
                }}
                className="w-full flex items-center gap-3.5 px-5 py-3 hover:bg-slate-50 transition-colors text-left text-slate-900 cursor-pointer"
              >
                <Search className="w-5 h-5 text-slate-900 stroke-[2.2]" />
                <span className="font-bold text-[15px] text-slate-900">Search</span>
              </button>

              {/* Additional Options */}
              <div className="pt-2 pb-1 space-y-1">
                {onOpenOrders && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenOrders();
                    }}
                    className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-slate-50 transition-colors text-left text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Truck className="w-4 h-4 text-slate-600" />
                      <span>Track Orders</span>
                    </div>
                  </button>
                )}

                {onOpenRiderPortal && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenRiderPortal();
                    }}
                    className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-slate-50 transition-colors text-left text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Bike className="w-4 h-4 text-emerald-600" />
                      <span>Rider Partner Portal</span>
                    </div>
                    <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded">Rider</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onToggleAdminMode();
                  }}
                  className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-emerald-50 transition-colors text-left text-xs font-bold text-emerald-800 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>{isAdminMode ? "Exit Admin Mode" : "Admin Panel"}</span>
                  </div>
                </button>
              </div>

            </div>

            {/* 4. Footer: Powered by VICKY & Version number */}
            <div className="border-t border-slate-200 px-5 py-3.5 flex items-center justify-between bg-white mt-auto">
              <div className="flex flex-col">
                <span className="text-[8.5px] font-extrabold text-slate-400 tracking-wider uppercase">
                  POWERED BY
                </span>
                <div className="flex items-center gap-1">
                  <span className="font-black text-slate-900 tracking-wider text-sm">
                    VICKY
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                </div>
              </div>

              <div className="text-xs font-bold text-slate-900 font-mono tracking-tight">
                v5.04.08
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Contact Shop Modal */}
      {contactShopModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150 relative">
            <button
              type="button"
              onClick={() => setContactShopModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {settings.storeName || "Vadamalai Supermarket"}
                </h3>
                <p className="text-xs text-slate-500 font-medium">Customer Support & Store Details</p>
              </div>
            </div>

            <div className="space-y-3.5 my-4">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Store Address</span>
                  <span className="text-xs text-slate-600">{settings.address || "Main Bazaar Road, Tirupathur - 635601"}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Store Working Hours</span>
                  <span className="text-xs text-slate-600">Mon - Sun: 7:00 AM – 10:30 PM (Daily Delivery)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <a
                  href={`tel:${settings.phone || '+919876543210'}`}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Store</span>
                </a>
                <a
                  href={`https://wa.me/${(settings.whatsapp || settings.phone || '919876543210').replace(/[^0-9]/g, '')}?text=Hello%20Vadamalai%20Supermarket`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl font-bold text-xs shadow-xs transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Policies Modal */}
      {policiesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-emerald-700" />
                <h3 className="text-lg font-black text-slate-900">Store Policies & Terms</h3>
              </div>
              <button
                type="button"
                onClick={() => setPoliciesModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="bg-emerald-50 border border-emerald-200/80 p-3.5 rounded-xl">
                <h4 className="font-extrabold text-emerald-950 text-sm mb-1">⚡ Superfast Delivery SLA</h4>
                <p className="text-emerald-900">
                  We guarantee same-day doorstep grocery delivery across all service zones within Tirupathur. Fresh vegetables and dairy are handpicked right before dispatch.
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-sm mb-1">🔄 Return & Refund Policy</h4>
                <p>
                  If any fresh produce or grocery item does not meet your quality expectations, you may return it immediately at the time of delivery or report within 24 hours for a full replacement or refund.
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-sm mb-1">💳 Transparent Pricing & Billing</h4>
                <p>
                  All displayed prices include applicable taxes. We accept Cash on Delivery (COD), UPI (GPay/PhonePe/Paytm), and online debit/credit cards with zero surcharge fees.
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-sm mb-1">🔒 Privacy & Data Protection</h4>
                <p>
                  Your delivery address and phone number are securely handled strictly for delivering your orders and tracking status. We never share your personal information with third parties.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setPoliciesModalOpen(false)}
                className="px-5 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
