import React, { useRef, useState, useEffect } from 'react';
import { Product, SliderBanner } from '../types';
import { ProductCard } from './ProductCard';
import { ChevronLeft, ChevronRight, Flame, Sparkles, Pause, Play, ArrowRightLeft } from 'lucide-react';

interface ProductSliderRowProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  featuredProductIds?: string[];
  sliderBanners?: SliderBanner[];
  products: Product[];
  cart: { [productId: string]: number };
  wishlistIds: string[];
  onAddToCart: (product: Product) => void;
  onUpdateCartQuantity: (productId: string, quantity: number) => void;
  onToggleWishlist: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onSelectCategory?: (category: string) => void;
  onOpenTrendingModal?: () => void;
}

export const ProductSliderRow: React.FC<ProductSliderRowProps> = ({
  title = "🔥 Flash Deals & Trending Essentials",
  subtitle = "Swipe or slide from right to left to explore daily fresh savings",
  badge = "SPECIAL OFFERS ROW",
  featuredProductIds = [],
  sliderBanners = [],
  products,
  cart,
  wishlistIds,
  onAddToCart,
  onUpdateCartQuantity,
  onToggleWishlist,
  onQuickView,
  onSelectCategory,
  onOpenTrendingModal
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // Active banners
  const activeBanners = (sliderBanners || []).filter(b => b.active !== false);

  // If specific product IDs selected in admin, filter them first
  let displayProducts: Product[] = [];
  if (featuredProductIds && featuredProductIds.length > 0) {
    displayProducts = products.filter(p => featuredProductIds.includes(p.id));
  }
  
  if (displayProducts.length === 0) {
    // Fallback: filter featured/offer products or all
    const offerProducts = products.filter(p => p.isPopular || p.isOffer || (p.mrp > p.price));
    displayProducts = offerProducts.length >= 2 ? offerProducts : products;
  }

  const updateScrollButtons = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollButtons);
    updateScrollButtons();
    return () => el.removeEventListener('scroll', updateScrollButtons);
  }, [displayProducts]);

  // Smooth scroll left or right
  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 320; // width of product card + gap
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  // Continuous auto-sliding from right to left
  useEffect(() => {
    if (!isAutoPlay || !scrollContainerRef.current) return;

    const interval = setInterval(() => {
      const el = scrollContainerRef.current;
      if (!el) return;

      const { scrollLeft, scrollWidth, clientWidth } = el;
      // If reached the end on the right, loop back to start
      if (scrollLeft + clientWidth >= scrollWidth - 20) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: 300, behavior: 'smooth' });
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isAutoPlay, displayProducts]);

  if (!displayProducts || displayProducts.length === 0) return null;

  if (displayProducts.length === 0 && activeBanners.length === 0) {
    return null;
  }

  return (
    <section id="sec-trending" className="py-6 bg-gradient-to-b from-amber-50/50 via-white to-slate-50 border-y border-amber-100/60 my-4 relative overflow-hidden">
      
      {/* Background Accent Decorative Blur */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      <div className="max-w-7xl mx-auto px-4 relative z-10 space-y-4">
        
        {/* Header Bar with Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-slate-200 shadow-2xs">
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/20 text-amber-900 font-black text-[10px] px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1 uppercase tracking-wider">
                <Flame className="w-3 h-3 text-amber-600 fill-amber-500" />
                {badge}
              </span>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <ArrowRightLeft className="w-3 h-3" /> Right-to-Left Slide
              </span>
            </div>

            <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>{title}</span>
            </h2>

            <p className="text-xs text-slate-500 font-medium">
              {subtitle}
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {/* Dedicated View All Trending Page Button */}
            {onOpenTrendingModal && (
              <button
                type="button"
                onClick={onOpenTrendingModal}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>View All Trending</span>
              </button>
            )}

            {/* Auto-Slide Toggle */}
            <button
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              className={`p-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                isAutoPlay
                  ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
              }`}
              title={isAutoPlay ? "Pause Auto-Slide" : "Play Auto-Slide"}
            >
              {isAutoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{isAutoPlay ? "Auto Sliding" : "Paused"}</span>
            </button>

            {/* Scroll Left Button */}
            <button
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-amber-500 hover:text-slate-950 text-slate-700 disabled:opacity-30 disabled:hover:bg-slate-100 disabled:hover:text-slate-700 transition-all border border-slate-200 shadow-xs"
              title="Slide Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Scroll Right Button */}
            <button
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-amber-500 hover:text-slate-950 text-slate-700 disabled:opacity-30 disabled:hover:bg-slate-100 disabled:hover:text-slate-700 transition-all border border-slate-200 shadow-xs"
              title="Slide Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Sliding Products & Banners Container */}
        <div
          ref={scrollContainerRef}
          onMouseEnter={() => setIsAutoPlay(false)}
          onMouseLeave={() => setIsAutoPlay(true)}
          className="flex items-stretch gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory py-2 px-1 scroll-smooth"
        >
          {/* Custom Right-to-Left Slider Banner Cards */}
          {activeBanners.map((banner) => {
            const theme = (() => {
              switch (banner.bgStyle) {
                case 'wood':
                  return {
                    cardBg: "bg-[#f7f3eb] border-[#e2d8c3] text-slate-900 shadow-md hover:border-amber-400",
                    titleColor: "text-slate-950 font-black tracking-tight text-base",
                    subtitleColor: "text-slate-700 font-bold text-xs",
                    badgeStyle: "bg-rose-600 text-white font-black shadow-2xs",
                    discountStyle: "bg-amber-400 text-slate-950 font-black",
                    dividerStyle: "border-[#e2d8c3]",
                    btnStyle: "bg-slate-950 hover:bg-slate-900 text-white font-black shadow-xs active:scale-95",
                    imgBorder: "border-amber-300 bg-white"
                  };
                case 'amber':
                  return {
                    cardBg: "bg-linear-to-r from-amber-600 via-amber-500 to-amber-700 border-amber-400 text-slate-950 shadow-md",
                    titleColor: "text-slate-950 font-black text-sm",
                    subtitleColor: "text-amber-950 font-bold text-xs",
                    badgeStyle: "bg-slate-950 text-amber-300 font-black shadow-2xs",
                    discountStyle: "bg-rose-600 text-white font-black",
                    dividerStyle: "border-amber-400/60",
                    btnStyle: "bg-slate-950 hover:bg-slate-900 text-amber-300 font-black shadow-xs active:scale-95",
                    imgBorder: "border-slate-950/20 bg-white/30"
                  };
                case 'rose':
                  return {
                    cardBg: "bg-linear-to-r from-rose-950 via-rose-900 to-pink-950 border-rose-700/60 text-white shadow-md",
                    titleColor: "text-white font-black text-sm",
                    subtitleColor: "text-rose-100/90 font-medium text-xs",
                    badgeStyle: "bg-amber-400 text-slate-950 font-black shadow-2xs",
                    discountStyle: "bg-white text-rose-900 font-black",
                    dividerStyle: "border-rose-700/50",
                    btnStyle: "bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-xs active:scale-95",
                    imgBorder: "border-white/20 bg-white/10"
                  };
                case 'slate':
                  return {
                    cardBg: "bg-linear-to-r from-slate-950 via-slate-900 to-zinc-950 border-slate-700/60 text-white shadow-md",
                    titleColor: "text-white font-black text-sm",
                    subtitleColor: "text-slate-300 font-medium text-xs",
                    badgeStyle: "bg-emerald-400 text-slate-950 font-black shadow-2xs",
                    discountStyle: "bg-amber-400 text-slate-950 font-black",
                    dividerStyle: "border-slate-700/50",
                    btnStyle: "bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black shadow-xs active:scale-95",
                    imgBorder: "border-white/20 bg-white/10"
                  };
                case 'emerald':
                default:
                  return {
                    cardBg: "bg-linear-to-r from-emerald-950 via-emerald-900 to-teal-950 border-emerald-700/50 text-white shadow-md",
                    titleColor: "text-white font-black text-sm",
                    subtitleColor: "text-emerald-100/90 font-medium text-xs",
                    badgeStyle: "bg-amber-400 text-slate-950 font-black shadow-2xs",
                    discountStyle: "bg-rose-500 text-white font-black",
                    dividerStyle: "border-emerald-700/50",
                    btnStyle: "bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-xs active:scale-95",
                    imgBorder: "border-white/20 bg-white/10"
                  };
              }
            })();

            return (
              <div
                key={banner.id}
                className={`shrink-0 w-80 sm:w-96 snap-start rounded-2xl p-4.5 border flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all ${theme.cardBg}`}
                onClick={() => banner.categoryName && onSelectCategory && onSelectCategory(banner.categoryName)}
              >
                <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl group-hover:scale-150 transition-transform pointer-events-none" />
                
                <div className="relative z-10 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full ${theme.badgeStyle}`}>
                      {banner.badge || "BEST DEALS"}
                    </span>
                    {banner.discountBadge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-md ${theme.discountStyle}`}>
                        {banner.discountBadge}
                      </span>
                    )}
                  </div>

                  <h4 className={`leading-tight line-clamp-2 ${theme.titleColor}`}>
                    {banner.title}
                  </h4>

                  {banner.subtitle && (
                    <p className={`line-clamp-2 ${theme.subtitleColor}`}>
                      {banner.subtitle}
                    </p>
                  )}
                </div>

                <div className={`relative z-10 pt-3 mt-2 border-t flex items-center justify-between gap-2 ${theme.dividerStyle}`}>
                  <div className={`w-12 h-12 rounded-xl overflow-hidden border shrink-0 ${theme.imgBorder}`}>
                    <img src={banner.image} alt={banner.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <button
                    type="button"
                    className={`text-[11px] px-4 py-2 rounded-xl transition-all flex items-center gap-1 shrink-0 cursor-pointer ${theme.btnStyle}`}
                  >
                    <span>{banner.buttonText || "ORDER NOW"}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Featured Products */}
          {displayProducts.map((product) => {
            const quantity = cart[product.id] || 0;
            const isWishlisted = wishlistIds.includes(product.id);

            return (
              <div
                key={product.id}
                className="shrink-0 w-64 sm:w-72 snap-start"
              >
                <ProductCard
                  product={product}
                  cartQuantity={quantity}
                  isWishlisted={isWishlisted}
                  onAddToCart={onAddToCart}
                  onUpdateCartQuantity={onUpdateCartQuantity}
                  onToggleWishlist={onToggleWishlist}
                  onQuickView={onQuickView}
                />
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
