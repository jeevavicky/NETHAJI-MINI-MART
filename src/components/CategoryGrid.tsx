import React, { useRef } from 'react';
import { Category } from '../types';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface CategoryGridProps {
  categories: Category[];
  activeCategory: string;
  onSelectCategory: (categoryName: string) => void;
  onOpenAllCategories?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
  onOpenAllCategories
}) => {
  const chipScrollRef = useRef<HTMLDivElement>(null);

  // Subtitle dictionary to provide fallback sub-item text if not present in custom category
  const getCategorySubtitle = (cat: Category): string => {
    if (cat.subtitle) return cat.subtitle;
    
    const nameLower = cat.name.toLowerCase();
    if (nameLower.includes('bakery')) return 'Bread & Jam, Cakes';
    if (nameLower.includes('snack')) return 'Cookies & Biscuits, Crunchy Snacks, Chocolates & Can...';
    if (nameLower.includes('beverage') || nameLower.includes('drink')) return 'Drinks, Health Drinks, Coffee, Tea';
    if (nameLower.includes('dairy') || nameLower.includes('milk') || nameLower.includes('egg')) return 'Milk & Curd, Ghee, Cheese & Butter, Paneer';
    if (nameLower.includes('baby')) return 'Baby Food, Baby Skin Care, Diapers & Wipes';
    if (nameLower.includes('cooking') || nameLower.includes('staple') || nameLower.includes('grocery')) return 'Atta, Rice, Dals, Spices & Edible Oil';
    if (nameLower.includes('ready to cook') || nameLower.includes('noodle')) return 'Noodles, Pasta, Instant Mixes, Ready Meals';
    if (nameLower.includes('dry fruit') || nameLower.includes('nut')) return 'Almonds, Cashews, Raisins, Pistachios, Dates';
    if (nameLower.includes('personal') || nameLower.includes('beauty')) return 'Soaps, Hair Care, Face Wash, Deodorants';
    if (nameLower.includes('household') || nameLower.includes('cleaning')) return 'Mops & Brooms, Cleaners, Disposables, Air Fresheners';
    if (nameLower.includes('detergent') || nameLower.includes('dishwash')) return 'Detergent Powders, Liquids, Dishwash Bars';
    if (nameLower.includes('oral') || nameLower.includes('dental')) return 'Toothpastes, Toothbrushes, Mouthwash';
    if (nameLower.includes('pooja')) return 'Agarbatti, Camphor, Pooja Oils, Diya';
    if (nameLower.includes('stationery') || nameLower.includes('book')) return 'Notebooks, Pens, Markers, Office Supplies';
    if (nameLower.includes('readymade') || nameLower.includes('sauce')) return 'Jams, Sauces, Spreads, Canned Foods';
    if (nameLower.includes('freshner') || nameLower.includes('repellent')) return 'Room Sprays, Bathroom Cleaners, Repellents';
    if (nameLower.includes('hygiene') || nameLower.includes('health')) return 'Handwash, Sanitizers, First Aid, Supplements';
    if (nameLower.includes('offer')) return 'Exclusive Super Deals, Buy 1 Get 1, ₹1 Specials';
    if (nameLower.includes('fruit') || nameLower.includes('veg')) return 'Fresh Fruits, Vegetables & Daily Greens';

    return 'Explore fresh items & daily essentials';
  };

  const scrollChips = (dir: 'left' | 'right') => {
    if (chipScrollRef.current) {
      const scrollAmount = dir === 'left' ? -200 : 200;
      chipScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section id="supermarket-category-showcase" className="w-full bg-[#1c5d39] text-slate-900 pb-12 pt-1 transition-colors">
      
      {/* 1. Top Quick Category Filter Chips / Sub-bar matching screenshot */}
      <div className="w-full px-2 sm:px-4 py-2 border-b border-emerald-800/60 bg-[#174e30]/80 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto flex items-center gap-1 relative">
          
          <button
            type="button"
            onClick={() => scrollChips('left')}
            className="hidden sm:flex w-6 h-6 rounded-full bg-emerald-950/60 text-emerald-200 hover:text-white items-center justify-center shrink-0 cursor-pointer"
            title="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={chipScrollRef}
            className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1 select-none flex-1"
          >
            {/* "All" chip */}
            <button
              type="button"
              onClick={() => onSelectCategory('All')}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === 'All'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'bg-emerald-900/60 text-emerald-100 hover:bg-emerald-800/80'
              }`}
            >
              All Categories
            </button>

            {/* Quick chips matching screenshot: Accessories, Mops, Bakery, etc. */}
            {categories.map((cat) => {
              const isSelected = activeCategory === cat.name;
              return (
                <button
                  key={`chip-${cat.id}`}
                  type="button"
                  onClick={() => onSelectCategory(cat.name)}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'bg-emerald-900/60 text-emerald-100 hover:bg-emerald-800/80'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => scrollChips('right')}
            className="hidden sm:flex w-6 h-6 rounded-full bg-emerald-950/60 text-emerald-200 hover:text-white items-center justify-center shrink-0 cursor-pointer"
            title="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Main 2-Column Category Grid matching reference screenshot */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4">
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {categories.map((cat) => {
            const subtitle = getCategorySubtitle(cat);

            return (
              <div
                key={cat.id}
                id={`category-card-${cat.id}`}
                onClick={() => onSelectCategory(cat.name)}
                className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group flex flex-col justify-between border border-emerald-900/20 active:scale-[0.98] select-none"
              >
                {/* Top Image Collage Container */}
                <div className="relative w-full h-44 sm:h-52 md:h-60 bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-2 sm:p-3 overflow-hidden">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 ease-out"
                    loading="lazy"
                    onError={(e) => {
                      // Fallback if image link fails
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80";
                    }}
                  />

                  {/* Special Offer Badge if Offers Zone */}
                  {cat.name.toLowerCase().includes('offer') && (
                    <div className="absolute top-2 right-2 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>HOT</span>
                    </div>
                  )}
                </div>

                {/* Bottom Card Area with Category Name & Sub-items list */}
                <div className="bg-white p-3 sm:p-4 text-center sm:text-left flex flex-col justify-center min-h-[72px] sm:min-h-[82px] border-t border-slate-100">
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight group-hover:text-emerald-800 transition-colors">
                    {cat.name}
                  </h3>
                  
                  <p className="text-[11px] sm:text-xs text-slate-500 font-semibold leading-snug line-clamp-2 mt-1">
                    {subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </section>
  );
};
