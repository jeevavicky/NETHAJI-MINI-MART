import React from 'react';
import { Category, Product, QuadCardGroup, QuadTile } from '../types';
import { ChevronRight, Sparkles } from 'lucide-react';
import { INITIAL_QUAD_GROUPS } from '../data/initialData';

interface FeaturedQuadColumnsProps {
  categories: Category[];
  products: Product[];
  quadGroups?: QuadCardGroup[];
  onSelectCategory: (categoryName: string) => void;
  onQuickViewProduct?: (product: Product) => void;
}

export const FeaturedQuadColumns: React.FC<FeaturedQuadColumnsProps> = ({
  categories,
  products,
  quadGroups = INITIAL_QUAD_GROUPS,
  onSelectCategory,
  onQuickViewProduct
}) => {
  const displayGroups = quadGroups && quadGroups.length > 0 ? quadGroups : INITIAL_QUAD_GROUPS;

  const handleTileClick = (tile: QuadTile) => {
    // If tile has a category, switch active category
    if (tile.categoryName) {
      onSelectCategory(tile.categoryName);
    } else {
      onSelectCategory('All');
    }

    // Scroll smoothly to product list section
    const productCatalogSection = document.getElementById('product-catalog-section');
    if (productCatalogSection) {
      productCatalogSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSeeMoreClick = (categoryFilter?: string) => {
    if (categoryFilter) {
      onSelectCategory(categoryFilter);
    } else {
      onSelectCategory('All');
    }

    const productCatalogSection = document.getElementById('product-catalog-section');
    if (productCatalogSection) {
      productCatalogSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-8 bg-slate-100/70 border-y border-slate-200/80 my-6">
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        
        {/* Section Title */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-emerald-800 bg-emerald-50 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1 uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3 text-emerald-800" /> Amazon-Style Quad Showcase
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Curated Collections & Category Quad Cards
            </h2>
          </div>
        </div>

        {/* 4 Quad Cards Grid (Responsive 1 to 4 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {displayGroups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Quad Card Heading */}
                <h3 className="text-base font-extrabold text-slate-900 leading-snug tracking-tight mb-3">
                  {group.heading}
                </h3>

                {/* 2x2 Image Tile Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {group.tiles.map((tile) => (
                    <button
                      key={tile.id}
                      onClick={() => handleTileClick(tile)}
                      className="group/tile text-left flex flex-col focus:outline-none"
                    >
                      {/* Image Container */}
                      <div className="w-full aspect-square bg-slate-50 rounded-xl overflow-hidden border border-slate-100 group-hover/tile:border-emerald-600 transition-all relative">
                        <img
                          src={tile.image}
                          alt={tile.title}
                          className="w-full h-full object-cover group-hover/tile:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>

                      {/* Label under image */}
                      <span className="text-[11px] font-bold text-slate-800 mt-1.5 line-clamp-1 group-hover/tile:text-emerald-900 leading-tight">
                        {tile.title}
                      </span>
                      {tile.subtitle && (
                        <span className="text-[10px] font-semibold text-emerald-800">
                          {tile.subtitle}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom "See more" link */}
              <div className="pt-2 border-t border-slate-100 mt-auto">
                <button
                  onClick={() => handleSeeMoreClick(group.categoryFilter)}
                  className="text-xs font-extrabold text-emerald-900 hover:text-emerald-950 flex items-center gap-1 hover:underline transition-all"
                >
                  <span>{group.seeMoreText || 'See more'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
