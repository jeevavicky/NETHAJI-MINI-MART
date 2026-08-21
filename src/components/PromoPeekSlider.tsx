import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, ShoppingBag, Flame, Tag, SlidersHorizontal, Store } from 'lucide-react';
import { BannerSlide, Category } from '../types';

interface PromoPeekSliderProps {
  slides?: BannerSlide[];
  categories?: Category[];
  onSelectCategory?: (categoryName: string) => void;
  onExploreOffers?: () => void;
  onOpenTrending?: () => void;
  onOpenOneRupeeZone?: () => void;
  onOpenAdminEditor?: () => void;
  isAdmin?: boolean;
}

export const PromoPeekSlider: React.FC<PromoPeekSliderProps> = ({
  slides = [],
  categories = [],
  onSelectCategory,
  onExploreOffers,
  onOpenTrending,
  onOpenOneRupeeZone,
  onOpenAdminEditor,
  isAdmin = false
}) => {
  const activeSlides = slides && slides.filter(s => s.isActive !== false).length > 0
    ? slides.filter(s => s.isActive !== false)
    : [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Keep index valid
  useEffect(() => {
    if (currentIndex >= activeSlides.length && activeSlides.length > 0) {
      setCurrentIndex(0);
    }
  }, [activeSlides.length, currentIndex]);

  // Autoplay slider
  useEffect(() => {
    if (activeSlides.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [activeSlides.length, isPaused]);

  const handlePrev = () => {
    if (activeSlides.length === 0) return;
    setCurrentIndex((prev) => (prev === 0 ? activeSlides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (activeSlides.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  };

  // Touch gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40;
    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleSlideClick = (slide: BannerSlide) => {
    if (slide.targetAction === 'offers') {
      if (onExploreOffers) onExploreOffers();
    } else if (slide.targetAction === 'trending') {
      if (onOpenTrending) onOpenTrending();
    } else if (slide.targetAction === 'oneRupee') {
      if (onOpenOneRupeeZone) onOpenOneRupeeZone();
    } else if (slide.targetCategory) {
      if (onSelectCategory) onSelectCategory(slide.targetCategory);
    } else {
      if (onSelectCategory) onSelectCategory("All");
    }
  };

  if (activeSlides.length === 0) return null;

  return (
    <div 
      className="relative w-full max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Admin quick bar if admin */}
      {isAdmin && onOpenAdminEditor && (
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[11px] font-extrabold text-emerald-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Interactive Banner Slider</span>
          </span>
          <button
            type="button"
            onClick={onOpenAdminEditor}
            className="text-[11px] font-bold bg-amber-100 hover:bg-amber-200 text-slate-900 border border-amber-300 px-3 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <SlidersHorizontal className="w-3 h-3 text-amber-800" />
            <span>Edit Banners in Admin</span>
          </button>
        </div>
      )}

      {/* Main Multi-Card Slider Stage with Horizontal Carousel */}
      <div 
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-sm"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides Track */}
        <div 
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {activeSlides.map((slide, idx) => {
            const isJKWash = slide.id === 'banner-video-1' || slide.title.includes('BUY 3KG GET 2KG');
            const isStockUp = slide.id === 'banner-video-2' || slide.title.includes('Stock up on savings');
            const isUnbeatable = slide.id === 'banner-video-3' || slide.title.includes('Unbeatable Quality');

            return (
              <div 
                key={slide.id || idx}
                className="w-full shrink-0 px-0.5"
                onClick={() => handleSlideClick(slide)}
              >
                {/* 1. Custom JK-Wash Card Design */}
                {isJKWash ? (
                  <div className="relative overflow-hidden cursor-pointer rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#e6f4fe] via-[#d6effe] to-[#bae6fd] border border-blue-100 min-h-[175px] sm:min-h-[220px] md:min-h-[250px] flex items-center p-4 sm:p-6 md:p-8">
                    {/* Top-left subtle grid dots pattern */}
                    <div className="absolute top-2 left-2 grid grid-cols-4 gap-1 opacity-25 pointer-events-none">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i} className="w-1 h-1 rounded-full bg-slate-700" />
                      ))}
                    </div>

                    <div className="grid grid-cols-12 gap-3 sm:gap-6 items-center w-full relative z-10">
                      {/* Left Promo Text & Logo Badge */}
                      <div className="col-span-7 sm:col-span-7 flex flex-col justify-center items-start space-y-2 sm:space-y-3">
                        {/* VMS Logo badge */}
                        <div className="flex items-center gap-1.5 bg-white/95 px-2.5 py-1 rounded-full border border-emerald-300 shadow-2xs">
                          <div className="w-5 h-5 rounded-full bg-emerald-700 text-amber-300 font-black text-[9px] flex items-center justify-center border border-amber-300">
                            VMS
                          </div>
                          <span className="text-[10px] sm:text-xs font-black text-emerald-950 uppercase tracking-tight">
                            Vadamalai Supermarket
                          </span>
                        </div>

                        {/* Title: BUY 3KG GET 2KG FREE */}
                        <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-[#0369a1] tracking-tight leading-tight">
                          *BUY 3KG GET 2KG FREE
                        </h2>

                        <p className="text-[10px] sm:text-xs text-slate-700 font-medium line-clamp-2 max-w-sm hidden sm:block">
                          {slide.subtitle || "JK-Wash Liquid Detergent with Deep Stain Lifting Action"}
                        </p>

                        {/* Shop Now CTA Button */}
                        <div className="pt-1">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white font-black text-xs sm:text-sm shadow-xs transition-transform active:scale-95 cursor-pointer"
                          >
                            <span>SHOP NOW</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Right Product Image & Price Tag */}
                      <div className="col-span-5 sm:col-span-5 relative flex items-center justify-center">
                        <div className="relative w-full max-w-[150px] sm:max-w-[200px] md:max-w-[240px] aspect-square flex items-center justify-center">
                          {/* Ambient Glow */}
                          <div className="absolute inset-0 bg-blue-300/30 rounded-full blur-xl" />

                          {/* JK Wash Detergent Bottle Graphic */}
                          <div className="relative z-10 flex flex-col items-center">
                            <div className="relative">
                              {/* Detergent Bottle representation */}
                              <div className="w-24 sm:w-32 md:w-40 h-32 sm:h-44 md:h-52 bg-gradient-to-b from-cyan-400 via-teal-500 to-emerald-600 rounded-3xl shadow-xl border-2 border-white/60 p-2 sm:p-3 flex flex-col justify-between items-center text-center relative overflow-hidden">
                                <div className="w-8 sm:w-10 h-3 sm:h-4 bg-white/90 rounded-t-lg -mt-3 shadow-xs" />
                                <div className="bg-white/90 rounded-xl p-1.5 sm:p-2 w-full shadow-xs">
                                  <span className="text-[9px] sm:text-[11px] font-black text-emerald-950 block">JK-Wash</span>
                                  <span className="text-[7px] sm:text-[8px] font-bold text-teal-800 block">Liquid Detergent</span>
                                </div>
                                <span className="text-[8px] sm:text-[10px] font-black text-amber-300 bg-slate-950/70 px-2 py-0.5 rounded-full">
                                  5 KG PACK
                                </span>
                              </div>

                              {/* Price Tag Bubble */}
                              <div className="absolute -bottom-2 -left-3 sm:-left-6 bg-white text-slate-900 border border-slate-200 px-2 sm:px-3 py-1 rounded-xl shadow-md flex flex-col leading-tight">
                                <span className="text-[8px] text-slate-500 font-bold">Now at</span>
                                <span className="text-xs sm:text-sm font-black text-emerald-800">Rs.368</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : isStockUp ? (
                  /* 2. Custom Stock Up on Savings Card Design */
                  <div className="relative overflow-hidden cursor-pointer rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#fff7ed] via-[#ffedd5] to-[#fed7aa] border border-amber-100 min-h-[175px] sm:min-h-[220px] md:min-h-[250px] flex items-center p-4 sm:p-6 md:p-8">
                    <div className="grid grid-cols-12 gap-3 sm:gap-6 items-center w-full relative z-10">
                      {/* Left Grocery Staples Assortment Representation */}
                      <div className="col-span-5 sm:col-span-5 relative flex items-center justify-center">
                        <div className="relative w-full max-w-[170px] sm:max-w-[220px] md:max-w-[260px] aspect-4/3 flex items-center justify-center">
                          {/* Assortment Graphics Grid */}
                          <div className="grid grid-cols-3 gap-1 sm:gap-1.5 w-full bg-white/80 p-2 sm:p-3 rounded-2xl shadow-md border border-amber-200/80">
                            <div className="bg-red-50 p-1 sm:p-1.5 rounded-lg text-center border border-red-100">
                              <span className="text-[8px] sm:text-[9px] font-black text-red-700 block">DAAWAT</span>
                              <span className="text-[7px] text-slate-600 block">Rice</span>
                            </div>
                            <div className="bg-amber-50 p-1 sm:p-1.5 rounded-lg text-center border border-amber-100">
                              <span className="text-[8px] sm:text-[9px] font-black text-amber-800 block">AASHIRVAAD</span>
                              <span className="text-[7px] text-slate-600 block">Atta</span>
                            </div>
                            <div className="bg-rose-50 p-1 sm:p-1.5 rounded-lg text-center border border-rose-100">
                              <span className="text-[8px] sm:text-[9px] font-black text-rose-800 block">RED LABEL</span>
                              <span className="text-[7px] text-slate-600 block">Tea</span>
                            </div>
                            <div className="bg-yellow-50 p-1 sm:p-1.5 rounded-lg text-center border border-yellow-100">
                              <span className="text-[8px] sm:text-[9px] font-black text-yellow-800 block">MARIE GOLD</span>
                              <span className="text-[7px] text-slate-600 block">Biscuits</span>
                            </div>
                            <div className="bg-blue-50 p-1 sm:p-1.5 rounded-lg text-center border border-blue-100">
                              <span className="text-[8px] sm:text-[9px] font-black text-blue-800 block">EASY COOK</span>
                              <span className="text-[7px] text-slate-600 block">Oil</span>
                            </div>
                            <div className="bg-emerald-50 p-1 sm:p-1.5 rounded-lg text-center border border-emerald-100">
                              <span className="text-[8px] sm:text-[9px] font-black text-emerald-800 block">AACHI</span>
                              <span className="text-[7px] text-slate-600 block">Masala</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Text & View More Button */}
                      <div className="col-span-7 sm:col-span-7 flex flex-col justify-center items-start space-y-1.5 sm:space-y-2.5 pl-2">
                        <div className="space-y-0.5 leading-tight">
                          <h2 className="text-base sm:text-2xl md:text-3xl font-black text-[#dc2626] tracking-tight">
                            Stock up on savings,
                          </h2>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-serif italic text-slate-700 text-xs sm:text-base md:text-lg">
                              without
                            </span>
                            <span className="font-black text-slate-950 text-base sm:text-2xl md:text-3xl tracking-tight">
                              Compromising on quality
                            </span>
                          </div>
                        </div>

                        <p className="text-[10px] sm:text-xs text-slate-600 font-medium line-clamp-2 hidden sm:block">
                          Top quality grocery staples, basmati rice, premium flour & tea from leading brands.
                        </p>

                        <div className="pt-1 sm:pt-2">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-transform active:scale-95 cursor-pointer"
                          >
                            <span>View more</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : isUnbeatable ? (
                  /* 3. Custom Unbeatable Quality & Prices Card Design */
                  <div className="relative overflow-hidden cursor-pointer rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#1c1917] via-[#292524] to-[#44403c] border border-stone-700 min-h-[175px] sm:min-h-[220px] md:min-h-[250px] flex items-center p-4 sm:p-6 md:p-8 text-white">
                    <div className="grid grid-cols-12 gap-3 sm:gap-6 items-center w-full relative z-10">
                      {/* Left Styled Text */}
                      <div className="col-span-7 sm:col-span-7 flex flex-col justify-center items-start space-y-2 sm:space-y-3">
                        <div className="space-y-1 leading-tight">
                          <h2 className="text-lg sm:text-2xl md:text-3xl font-bold font-serif italic text-emerald-400 drop-shadow-xs">
                            Unbeatable Quality,
                          </h2>
                          <h2 className="text-lg sm:text-2xl md:text-3xl font-bold font-serif italic text-rose-500 drop-shadow-xs">
                            Unbeatable Prices
                          </h2>
                        </div>

                        <p className="text-[10px] sm:text-xs text-stone-300 font-medium line-clamp-2 hidden sm:block">
                          Fortune Oil, Tata Salt, Anil Roasted Vermicelli & Aashirvaad Atta at everyday discount rates.
                        </p>

                        <div className="pt-1">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-xs transition-transform active:scale-95 cursor-pointer"
                          >
                            <span>Shop Daily Needs</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Right Grocery spread representation */}
                      <div className="col-span-5 sm:col-span-5 relative flex items-center justify-center">
                        <div className="relative w-full max-w-[170px] sm:max-w-[220px] md:max-w-[260px] aspect-4/3 flex items-center justify-center bg-stone-900/80 rounded-2xl p-2.5 sm:p-3 border border-stone-600 shadow-xl">
                          <div className="grid grid-cols-2 gap-1.5 w-full text-center">
                            <div className="bg-amber-950/80 border border-amber-700/60 p-1.5 rounded-xl">
                              <span className="text-[9px] sm:text-[10px] font-black text-amber-300 block">FORTUNE</span>
                              <span className="text-[7px] text-stone-300 block">Sunflower Oil</span>
                            </div>
                            <div className="bg-emerald-950/80 border border-emerald-700/60 p-1.5 rounded-xl">
                              <span className="text-[9px] sm:text-[10px] font-black text-emerald-300 block">ANIL</span>
                              <span className="text-[7px] text-stone-300 block">Vermicelli</span>
                            </div>
                            <div className="bg-blue-950/80 border border-blue-700/60 p-1.5 rounded-xl">
                              <span className="text-[9px] sm:text-[10px] font-black text-blue-300 block">TATA SALT</span>
                              <span className="text-[7px] text-stone-300 block">Vacuum Evaporated</span>
                            </div>
                            <div className="bg-rose-950/80 border border-rose-700/60 p-1.5 rounded-xl">
                              <span className="text-[9px] sm:text-[10px] font-black text-rose-300 block">AACHI</span>
                              <span className="text-[7px] text-stone-300 block">Pure Spices</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 4. Default / Custom Graphic Card Design */
                  <div 
                    className="relative overflow-hidden cursor-pointer rounded-2xl sm:rounded-3xl shadow-md min-h-[175px] sm:min-h-[220px] md:min-h-[250px] flex items-center p-4 sm:p-6 md:p-8"
                    style={{
                      backgroundColor: slide.bgColor || '#00B042',
                      backgroundImage: slide.bgGradient ? undefined : undefined
                    }}
                  >
                    {slide.bgGradient && (
                      <div className={`absolute inset-0 bg-gradient-to-r ${slide.bgGradient} opacity-95`} />
                    )}

                    <div className="grid grid-cols-12 gap-3 sm:gap-6 items-center w-full relative z-10">
                      <div className="col-span-7 sm:col-span-7 flex flex-col justify-center items-start space-y-2 sm:space-y-3">
                        {slide.badge && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase bg-white text-slate-900 shadow-2xs">
                            <Flame className="w-3 h-3 text-rose-600 fill-rose-600" />
                            <span>{slide.badge}</span>
                          </span>
                        )}

                        <h2 className="text-base sm:text-2xl md:text-3xl font-black text-white leading-tight">
                          {slide.title}
                        </h2>

                        {slide.subtitle && (
                          <p className="text-[10px] sm:text-xs text-white/90 font-medium line-clamp-2 max-w-sm hidden sm:block">
                            {slide.subtitle}
                          </p>
                        )}

                        <div className="pt-1">
                          <button
                            type="button"
                            className={`inline-flex items-center gap-1.5 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full font-black text-xs sm:text-sm shadow-xs transition-transform active:scale-95 cursor-pointer ${
                              slide.buttonBgColor || 'bg-white'
                            } ${slide.buttonTextColor || 'text-slate-900'}`}
                          >
                            <span>{slide.cta || 'Order Now'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="col-span-5 sm:col-span-5 relative flex items-center justify-center">
                        <div className="relative w-full max-w-[150px] sm:max-w-[200px] md:max-w-[240px] aspect-square flex items-center justify-center">
                          <img 
                            src={slide.image} 
                            alt={slide.title} 
                            className="relative z-10 w-full h-full object-contain filter drop-shadow-xl"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Carousel Prev & Next Controls */}
        {activeSlides.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-slate-900 flex items-center justify-center shadow-md backdrop-blur-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-slate-900 flex items-center justify-center shadow-md backdrop-blur-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </>
        )}
      </div>

      {/* Pagination Indicator Dots */}
      {activeSlides.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2.5 sm:mt-3">
          {activeSlides.map((slide, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={slide.id || idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  isActive 
                    ? 'w-6 sm:w-7 h-1.5 sm:h-2 bg-[#0c4025] shadow-xs' 
                    : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
