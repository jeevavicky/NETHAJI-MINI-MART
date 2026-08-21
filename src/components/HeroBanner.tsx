import React, { useState, useEffect } from 'react';
import { Truck, ShieldCheck, Clock, Tag, ChevronRight, Zap, Sparkles, LayoutGrid, Layers, ArrowRight } from 'lucide-react';
import { Category, BannerSlide } from '../types';

interface HeroBannerProps {
  categories?: Category[];
  activeCategory?: string;
  bannerSlides?: BannerSlide[];
  onSelectCategory?: (categoryName: string) => void;
  onExploreOffers: () => void;
}

const DEFAULT_SLIDES: BannerSlide[] = [
  {
    id: "default-1",
    title: "Fresh Harvest Vegetables & Daily Staples",
    subtitle: "Directly from local farms to your kitchen counter with 100% freshness guarantee.",
    badge: "30-MIN EXPRESS LOCAL DELIVERY",
    cta: "Shop Daily Veggies",
    bgGradient: "from-emerald-900 via-emerald-800 to-teal-950",
    accentColor: "text-amber-400",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80",
    isActive: true
  },
  {
    id: "default-2",
    title: "Weekly Grocery Savings – Up to 30% OFF",
    subtitle: "Get unbeatable prices on Fortune Oil, Aashirvaad Atta, Rice, Ghee & Spices.",
    badge: "SUPER SAVER COUPON: NETHAJI100",
    cta: "Explore Offers",
    bgGradient: "from-slate-900 via-emerald-900 to-emerald-950",
    accentColor: "text-amber-400",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80",
    isActive: true
  },
  {
    id: "default-3",
    title: "Dairy, Breakfast & Evening Snacks",
    subtitle: "Fresh Aavin Milk, Amul Butter, Milky Mist Paneer & Crisp Biscuits.",
    badge: "FRESH STOCK EVERY MORNING",
    cta: "Order Dairy Essentials",
    bgGradient: "from-teal-900 via-emerald-900 to-emerald-800",
    accentColor: "text-amber-300",
    image: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&auto=format&fit=crop&q=80",
    isActive: true
  }
];

export const HeroBanner: React.FC<HeroBannerProps> = ({
  categories = [],
  activeCategory = "All",
  bannerSlides,
  onSelectCategory,
  onExploreOffers
}) => {
  const activeSlides = (bannerSlides && bannerSlides.filter(s => s.isActive !== false).length > 0)
    ? bannerSlides.filter(s => s.isActive !== false)
    : DEFAULT_SLIDES;

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (currentSlide >= activeSlides.length) {
      setCurrentSlide(0);
    }
  }, [activeSlides.length, currentSlide]);

  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeSlides.length]);

  const slide = activeSlides[currentSlide] || activeSlides[0] || DEFAULT_SLIDES[0];

  return (
    <div className="relative bg-slate-900 text-white shadow-md">
      <div className={`bg-gradient-to-r ${slide.bgGradient} py-6 md:py-8 transition-all duration-700`}>
        <div className="max-w-7xl mx-auto px-4">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Desktop Categories List Sidebar On Banner */}
            <div className="hidden lg:block lg:col-span-3 bg-slate-950/70 backdrop-blur-md rounded-2xl border border-white/15 p-4 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between border-b border-white/15 pb-3 mb-3">
                  <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm tracking-wide">
                    <LayoutGrid className="w-4 h-4 text-amber-400" />
                    <span>All Categories</span>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                    {categories.length} Departments
                  </span>
                </div>

                <div className="space-y-1.5 max-h-[310px] overflow-y-auto pr-1 custom-scrollbar">
                  {/* All Products Option */}
                  <button
                    type="button"
                    onClick={() => onSelectCategory && onSelectCategory("All")}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all text-left ${
                      activeCategory === "All"
                        ? "bg-amber-500 text-slate-950 shadow-sm"
                        : "text-emerald-100 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                        activeCategory === "All" ? "bg-slate-950 text-amber-400" : "bg-emerald-800 text-emerald-200"
                      }`}>
                        <Layers className="w-3.5 h-3.5" />
                      </div>
                      <span>All Products & Deals</span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 ${activeCategory === "All" ? "text-slate-950" : "text-emerald-300"}`} />
                  </button>

                  {/* Dynamic Categories List */}
                  {categories.map((cat) => {
                    const isSelected = activeCategory === cat.name;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => onSelectCategory && onSelectCategory(cat.name)}
                        className={`w-full flex items-center justify-between p-1.5 px-2 rounded-xl text-xs font-bold transition-all text-left group ${
                          isSelected
                            ? "bg-amber-500 text-slate-950 shadow-sm"
                            : "text-emerald-100 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-7 h-7 rounded-lg object-cover border border-white/20 shrink-0"
                          />
                          <span className="truncate">{cat.name}</span>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold shrink-0 ml-1 ${
                          isSelected ? "bg-slate-950 text-amber-400" : "bg-emerald-900/80 text-emerald-300 group-hover:bg-emerald-800"
                        }`}>
                          {cat.itemCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/10 text-[11px] text-emerald-200 flex items-center justify-between">
                <span>Fast local home delivery</span>
                <span className="font-extrabold text-amber-400">₹0 Delivery &gt; ₹499</span>
              </div>
            </div>

            {/* Banner Main Hero Content */}
            <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Banner Text Content */}
              <div className="md:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                  <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{slide.badge}</span>
                </div>

                <h1 className="text-2xl sm:text-4xl lg:text-4xl font-black tracking-tight text-white leading-tight">
                  {slide.title.split("&")[0]}
                  {slide.title.includes("&") && (
                    <span className={`block ${slide.accentColor}`}>& {slide.title.split("&")[1]}</span>
                  )}
                </h1>

                <p className="text-xs sm:text-sm md:text-base text-emerald-100 max-w-xl font-normal leading-relaxed">
                  {slide.subtitle}
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    id="hero-cta-btn"
                    onClick={onExploreOffers}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs md:text-sm px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 hover:scale-105 active:scale-95"
                  >
                    <span>{slide.cta}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs px-3 py-2 rounded-xl text-xs font-medium text-emerald-100">
                    <Tag className="w-4 h-4 text-amber-400" />
                    <span>Use Code: <strong className="text-white font-bold">NETHAJI100</strong> (₹100 OFF)</span>
                  </div>
                </div>
              </div>

              {/* Banner Featured Image */}
              <div className="md:col-span-5 relative hidden sm:block">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 aspect-16/10">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>
                  
                  <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-700/60 text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Nethaji Fresh Local Guarantee</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Carousel Indicators */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {activeSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all ${
                  currentSlide === idx ? "w-8 bg-amber-400" : "w-2 bg-white/40 hover:bg-white/70"
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>

        </div>
      </div>

      {/* Banner Category Bar - Shows all categories right on the banner */}
      <div className="bg-slate-950/90 border-t border-emerald-900/80 py-3.5 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-amber-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
              <span>Explore All Categories</span>
            </span>
            <span className="text-[11px] text-emerald-300 font-medium">
              Click any category to browse
            </span>
          </div>

          {/* Horizontal Category Cards Strip */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-0.5 custom-scrollbar">
            {/* All Category Pill */}
            <button
              type="button"
              onClick={() => onSelectCategory && onSelectCategory("All")}
              className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                activeCategory === "All"
                  ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-2 ring-amber-400/30"
                  : "bg-emerald-950/80 text-emerald-100 border-emerald-800/80 hover:bg-emerald-900 hover:border-emerald-700"
              }`}
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-800 text-amber-300 flex items-center justify-center text-[10px]">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <span>All Items</span>
            </button>

            {/* List of All Categories */}
            {categories.map((cat) => {
              const isSelected = activeCategory === cat.name;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory && onSelectCategory(cat.name)}
                  className={`shrink-0 flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border group ${
                    isSelected
                      ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-2 ring-amber-400/30"
                      : "bg-slate-900 text-emerald-100 border-slate-800 hover:bg-slate-800 hover:border-emerald-700/80 hover:text-white"
                  }`}
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-6 h-6 rounded-lg object-cover border border-white/20 shrink-0"
                  />
                  <span className="whitespace-nowrap">{cat.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isSelected ? "bg-slate-950 text-amber-400" : "bg-emerald-950 text-emerald-300"
                  }`}>
                    {cat.itemCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feature Value Badges Bar */}
      <div className="bg-emerald-950 border-t border-emerald-800/60 py-3 px-4 text-emerald-100 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center md:text-left">
          
          <div className="flex items-center justify-center md:justify-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-800/80 flex items-center justify-center text-amber-400 shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white leading-tight text-[11px] sm:text-xs">Express 30-Min Delivery</p>
              <p className="text-[10px] text-emerald-300">Fast local door delivery</p>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-800/80 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white leading-tight text-[11px] sm:text-xs">100% Quality & Freshness</p>
              <p className="text-[10px] text-emerald-300">Handpicked farm produce</p>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-800/80 flex items-center justify-center text-amber-400 shrink-0">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white leading-tight text-[11px] sm:text-xs">Lowest Local Prices</p>
              <p className="text-[10px] text-emerald-300">Daily offers & MRP discounts</p>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-800/80 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white leading-tight text-[11px] sm:text-xs">7 AM - 10 PM Open</p>
              <p className="text-[10px] text-emerald-300">Order anytime, delivery daily</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

