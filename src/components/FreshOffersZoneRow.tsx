import React, { useState, useRef } from 'react';
import { Product } from '../types';
import { Sparkles, Tag, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from './ProductCard';

interface FreshOffersZoneRowProps {
  title?: string;
  highlightPrice?: string;
  subtitle?: string;
  products: Product[];
  cart: { [productId: string]: number };
  onAddToCart: (product: Product) => void;
  onUpdateCartQuantity: (productId: string, quantity: number) => void;
  onQuickView: (product: Product) => void;
  onSelectCategory?: (category: string) => void;
  onOpenOneRupeeModal?: () => void;
}

export const FreshOffersZoneRow: React.FC<FreshOffersZoneRowProps> = ({
  title = "FRESH",
  highlightPrice = "@ ₹1",
  subtitle = "Handpicked daily essentials",
  products,
  cart,
  onAddToCart,
  onUpdateCartQuantity,
  onQuickView,
  onSelectCategory,
  onOpenOneRupeeModal
}) => {
  const [selectedTab, setSelectedTab] = useState<string>("₹1 Zone");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Tabs list
  const tabs = [
    { id: '₹1 Zone', label: '₹1 Zone', isSpecial: true },
    { id: 'Veggies', label: 'Veggies' },
    { id: 'Fruits', label: 'Fruits' },
    { id: 'New Launches', label: 'New Launches' },
    { id: 'Daily Essentials', label: 'Daily Essentials' },
    { id: 'Snacks & Drinks', label: 'Snacks & Drinks' }
  ];

  // Filter products based on selected offer tab or fallback
  const offerProducts = products.filter(p => {
    // If product specifically belongs to offer zone or has price <= 10 or isOffer
    const isSpecialDeal = p.price <= 10 || p.isOneRupeeZone || p.isOffer || p.mrp - p.price >= 20;

    if (selectedTab === "₹1 Zone") {
      return p.price <= 10 || p.isOneRupeeZone || (p.mrp > p.price && p.price <= 20);
    } else if (selectedTab === "Veggies") {
      return p.category.toLowerCase().includes('veg') || p.category.toLowerCase().includes('staple');
    } else if (selectedTab === "Fruits") {
      return p.category.toLowerCase().includes('fruit');
    } else if (selectedTab === "New Launches") {
      return p.isPopular || p.isOrganic;
    } else {
      return isSpecialDeal;
    }
  });

  // Fallback if empty
  const displayProducts = offerProducts.length > 0 ? offerProducts : products.slice(0, 10);

  if (displayProducts.length === 0) {
    return null;
  }

  return (
    <section id="sec-fresh-offers" className="py-6 bg-gradient-to-b from-emerald-50/60 via-white to-slate-50 border-y border-emerald-100/80 my-4 relative">
      <div className="max-w-7xl mx-auto px-4 space-y-4">
        
        {/* Header Title Section with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-4xl font-black text-emerald-800 tracking-tight">
                {title}
              </span>
              <span className="bg-lime-400 text-emerald-950 font-black text-xl sm:text-3xl px-2.5 py-0.5 rounded-xl shadow-xs border border-lime-500/30 transform -rotate-1">
                {highlightPrice}
              </span>
            </div>
            <p className="text-slate-600 text-xs sm:text-sm font-extrabold mt-1">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto">
            <div className="flex flex-col items-start sm:items-end gap-1">
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-800 px-3 py-1 rounded-2xl text-xs font-black shadow-2xs">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-400 animate-pulse" />
                <span>FLASH OFFER • LIMITED STOCK DAILY</span>
              </div>
              <span className="bg-amber-100 text-amber-950 text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-lg border border-amber-300 flex items-center gap-1">
                <Tag className="w-3 h-3 text-amber-700" />
                <span>1 Item Limit per Order</span>
              </span>
            </div>

            {onOpenOneRupeeModal && (
              <button
                type="button"
                onClick={onOpenOneRupeeModal}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-rose-600 to-amber-600 hover:from-amber-600 hover:to-rose-700 text-white font-black text-xs transition-all shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0 border border-amber-300"
              >
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>View All ₹1 Offers</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Offer Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 no-scrollbar">
          {tabs.map((tab) => {
            const isSelected = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedTab(tab.id);
                  if (tab.id === '₹1 Zone' && onOpenOneRupeeModal) {
                    onOpenOneRupeeModal();
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-sm border-b-2 border-amber-400'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab.isSpecial && (
                  <span className="bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md flex items-center justify-center shadow-2xs">
                    ₹1
                  </span>
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Single-Line Right-to-Left Sliding Column Container */}
        <div className="relative group/freshslider">
          {/* Floating Left Arrow */}
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-slate-800 border border-slate-200/90 shadow-lg items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
            title="Slide Left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div
            ref={scrollContainerRef}
            className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory py-2 px-1 scroll-smooth"
          >
            {displayProducts.map((product) => {
              const qty = cart[product.id] || 0;

              return (
                <div
                  key={product.id}
                  className="shrink-0 w-44 sm:w-52 snap-start flex flex-col"
                >
                  <ProductCard
                    product={product}
                    cartQuantity={qty}
                    isWishlisted={false}
                    onAddToCart={onAddToCart}
                    onUpdateCartQuantity={onUpdateCartQuantity}
                    onToggleWishlist={() => {}}
                    onQuickView={onQuickView}
                  />
                </div>
              );
            })}
          </div>

          {/* Floating Right Arrow */}
          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
            title="Slide Right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

      </div>
    </section>
  );
};

