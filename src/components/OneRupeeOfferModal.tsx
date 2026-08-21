import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Heart, Search, X, ShoppingBag, Plus, Minus, Zap, Tag, Sparkles, AlertCircle, Gift, CheckCircle2, ShieldCheck
} from 'lucide-react';
import { Product } from '../types';
import { useCartAnimation } from './CartAnimationProvider';
import { api } from '../services/api';

interface OneRupeeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  cart: { [productId: string]: number };
  wishlistIds: string[];
  onAddToCart: (product: Product) => void;
  onUpdateCartQuantity: (productId: string, quantity: number) => void;
  onToggleWishlist: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  freeDeliveryThreshold?: number;
  currentUserPhone?: string | null;
  userOrdersCount?: number;
}

export const OneRupeeOfferModal: React.FC<OneRupeeOfferModalProps> = ({
  isOpen,
  onClose,
  products,
  cart,
  wishlistIds,
  onAddToCart,
  onUpdateCartQuantity,
  onToggleWishlist,
  onQuickView,
  onOpenCart,
  onOpenWishlist,
  freeDeliveryThreshold = 299,
  currentUserPhone,
  userOrdersCount = 0
}) => {
  const { triggerFlyToCart } = useCartAnimation();
  const [selectedFilter, setSelectedFilter] = useState<string>("Pure & Light");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSearchInput, setShowSearchInput] = useState<boolean>(false);
  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    reason?: string;
    pastOrdersCount: number;
    alreadyClaimed: boolean;
  }>({ eligible: true, pastOrdersCount: 0, alreadyClaimed: false });

  useEffect(() => {
    if (!isOpen) return;
    const phoneToTest = currentUserPhone || localStorage.getItem('nethaji_user_phone') || '';
    if (phoneToTest && phoneToTest.replace(/\D/g, '').length >= 10) {
      api.checkOneRupeeEligibility(phoneToTest).then(setEligibility).catch(() => {});
    } else {
      setEligibility({ eligible: true, pastOrdersCount: userOrdersCount, alreadyClaimed: userOrdersCount > 0 });
    }
  }, [isOpen, currentUserPhone, userOrdersCount]);

  if (!isOpen) return null;

  // Filter tabs matching screenshot
  const filterTabs = [
    "Pure & Light",
    "₹1 Hot Deals",
    "Veggies & Fruits",
    "Daily Essentials",
    "Snacks & Drinks",
    "High Discount %"
  ];

  // Base 1 Rs & Special Offer products
  const offerProducts = products.filter(p => {
    const isRupeeDeal = p.price <= 10 || p.isOneRupeeZone;
    const isHighOffer = p.isOffer || (p.mrp > p.price && ((p.mrp - p.price) / p.mrp) >= 0.2);

    if (selectedFilter === "₹1 Hot Deals") {
      return isRupeeDeal;
    } else if (selectedFilter === "Veggies & Fruits") {
      return (p.category.toLowerCase().includes('veg') || p.category.toLowerCase().includes('fruit')) && (isRupeeDeal || isHighOffer);
    } else if (selectedFilter === "Daily Essentials") {
      return (p.category.toLowerCase().includes('grocer') || p.category.toLowerCase().includes('dairy') || p.category.toLowerCase().includes('staple')) && (isRupeeDeal || isHighOffer);
    } else if (selectedFilter === "Snacks & Drinks") {
      return (p.category.toLowerCase().includes('snack') || p.category.toLowerCase().includes('beverag')) && (isRupeeDeal || isHighOffer);
    } else if (selectedFilter === "High Discount %") {
      return isHighOffer;
    } else {
      // "Pure & Light" or default
      return isRupeeDeal || isHighOffer || p.isPopular;
    }
  });

  // Apply search query
  const displayedProducts = offerProducts.filter(p => 
    !searchQuery || 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Cart calculation
  const totalCartItems = Object.values(cart).reduce<number>((sum, qty) => sum + (Number(qty) || 0), 0);
  const cartSubtotal = products.reduce((sum, p) => {
    const qty = cart[p.id] || 0;
    return sum + (p.price * qty);
  }, 0);

  const remainingForFreeDelivery = Math.max(0, freeDeliveryThreshold - cartSubtotal);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-5xl h-[96vh] sm:h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 mx-auto animate-in slide-in-from-bottom-6 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header matching screenshot */}
        <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Products For You</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Toggle Icon */}
            <button
              type="button"
              onClick={() => setShowSearchInput(!showSearchInput)}
              className={`p-2 rounded-full border transition-all cursor-pointer ${
                showSearchInput ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
              title="Search Products"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist Icon */}
            <button
              type="button"
              onClick={onOpenWishlist}
              className="p-2 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-100 transition-all cursor-pointer relative"
              title="Wishlist"
            >
              <Heart className="w-5 h-5 text-rose-600 fill-rose-500" />
              {wishlistIds.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                  {wishlistIds.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Toggleable Search Bar */}
        {showSearchInput && (
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2 animate-in slide-in-from-top-2 duration-150">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search 1 Rs offer items..."
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
          </div>
        )}

        {/* Filter Tabs Bar matching screenshot */}
        <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          {filterTabs.map((tab) => {
            const isSelected = selectedFilter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedFilter(tab)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'bg-teal-50 border-teal-300 text-teal-800 shadow-2xs ring-1 ring-teal-400/30'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* 1 Rs First Time Order Policy Notice Banner */}
        <div className="px-4 py-2 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border-b border-amber-200/60 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-2xs">
              <Gift className="w-3 h-3 text-slate-950" />
              1st Order Deal
            </span>
            <span className="font-extrabold text-slate-800 hidden sm:inline">
              ₹1 Offer is valid for 1st-time orders only (1 unit per mobile number).
            </span>
            <span className="font-extrabold text-slate-800 sm:hidden">
              ₹1 Offer valid 1-time on 1st order only.
            </span>
          </div>

          {currentUserPhone && (
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
              eligibility.eligible
                ? "text-emerald-700 bg-emerald-100/70 border border-emerald-200"
                : "text-amber-800 bg-amber-100/70 border border-amber-200"
            }`}>
              {eligibility.eligible ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Eligible Welcome User</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  <span>Welcome deal redeemed</span>
                </>
              )}
            </span>
          )}
        </div>

        {/* Product Grid Content Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-[#f5f8f9] pb-24">
          {displayedProducts.length > 0 ? (
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
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        onClick={() => onQuickView(product)}
                      />

                      {/* Wishlist Heart Icon Top Right */}
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

                      {/* Ad Tag or Offer Tag bottom left of image */}
                      {product.tags?.includes('one_rupee_zone') ? (
                        <span className="absolute bottom-1 left-1 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-2xs">
                          ₹1 DEAL
                        </span>
                      ) : product.isOffer ? (
                        <span className="absolute bottom-1 left-1 bg-slate-200/90 text-slate-600 text-[9px] font-extrabold px-1 py-0.5 rounded">
                          Ad
                        </span>
                      ) : null}

                      {/* ADD Button overlay matching screenshot */}
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

                    {/* Pricing Row matching screenshot */}
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
                        className="text-xs font-extrabold text-slate-900 leading-snug line-clamp-2 mt-1 cursor-pointer hover:text-rose-600 transition-colors"
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
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                <Zap className="w-8 h-8 fill-amber-500" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-base">No offer items in this filter</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Try switching filters above to explore all ₹1 deals and fresh offers.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedFilter("Pure & Light");
                  setSearchQuery("");
                }}
                className="mt-4 px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Show All Offers
              </button>
            </div>
          )}
        </div>

        {/* Floating Bottom Cart & Free Delivery Pill matching screenshot */}
        <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center justify-between gap-2 pointer-events-auto">
          {/* Left Pill: Free Delivery Status */}
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

          {/* Right Pill: Pink Cart Button */}
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
