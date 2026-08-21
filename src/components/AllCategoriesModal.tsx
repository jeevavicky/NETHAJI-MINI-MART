import React, { useState } from 'react';
import { 
  ArrowLeft, Search, Heart, X, ChevronRight, Sparkles, 
  ShoppingBag, Flame, Tag, ChevronDown, Filter
} from 'lucide-react';
import { Category, Product } from '../types';

interface AllCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  products: Product[];
  onSelectCategory: (categoryName: string) => void;
  onOpenWishlist: () => void;
  wishlistCount: number;
}

interface CategoryGroup {
  groupTitle: string;
  items: {
    name: string;
    image: string;
    itemCount?: number;
    badge?: string;
  }[];
}

export const AllCategoriesModal: React.FC<AllCategoriesModalProps> = ({
  isOpen,
  onClose,
  categories,
  products,
  onSelectCategory,
  onOpenWishlist,
  wishlistCount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);

  if (!isOpen) return null;

  // Department groupings inspired by modern quick-commerce & user screenshot
  const categoryGroups: CategoryGroup[] = [
    {
      groupTitle: "Grocery & Kitchen",
      items: [
        {
          name: "Fruits & Vegetables",
          image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80",
          badge: "Fresh"
        },
        {
          name: "Dairy, Bread & Eggs",
          image: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=500&auto=format&fit=crop&q=80"
        },
        {
          name: "Atta, Rice, Oil & Dals",
          image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80",
          badge: "Best Value"
        },
        {
          name: "Meat, Fish & Eggs",
          image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500&auto=format&fit=crop&q=80"
        },
        {
          name: "Masala & Dry Fruits",
          image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&auto=format&fit=crop&q=80"
        },
        {
          name: "Breakfast & Sauces",
          image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&auto=format&fit=crop&q=80"
        },
        {
          name: "Packaged Food",
          image: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=500&auto=format&fit=crop&q=80"
        }
      ]
    },
    {
      groupTitle: "Snacks & Drinks",
      items: [
        {
          name: "Tea, Coffee & More",
          image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80"
        },
        {
          name: "Ice Creams & Desserts",
          image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&auto=format&fit=crop&q=80",
          badge: "Cool"
        },
        {
          name: "Frozen Food & Snacks",
          image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=80"
        },
        {
          name: "Cold Drinks & Juices",
          image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80"
        },
        {
          name: "Biscuits & Cookies",
          image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80"
        },
        {
          name: "Munchies & Chips",
          image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=80"
        }
      ]
    },
    {
      groupTitle: "Beauty & Personal Care",
      items: [
        {
          name: "Bath & Body",
          image: "https://images.unsplash.com/photo-1608248597261-19d288d662e7?w=500&auto=format&fit=crop&q=80"
        },
        {
          name: "Hair Care",
          image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80"
        },
        {
          name: "Skin Care & Cosmetics",
          image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&auto=format&fit=crop&q=80"
        },
        {
          name: "Hygiene & Wellness",
          image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80"
        }
      ]
    },
    {
      groupTitle: "Household & Cleaning Essentials",
      items: [
        {
          name: "Cleaning Essentials",
          image: "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=500&auto=format&fit=crop&q=80"
        },
        {
          name: "Kitchen & Dining Needs",
          image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&auto=format&fit=crop&q=80"
        },
        {
          name: "Home Care & Pooja Essentials",
          image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&auto=format&fit=crop&q=80"
        }
      ]
    }
  ];

  // Helper to calculate items count per category or group item
  const getItemCount = (name: string) => {
    // Try finding exact category from database categories
    const foundCat = categories.find(c => c.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(c.name.toLowerCase()));
    if (foundCat && foundCat.itemCount) return foundCat.itemCount;

    // Count products matching keyword
    const matchedProds = products.filter(p => 
      p.category.toLowerCase().includes(name.toLowerCase()) ||
      p.name.toLowerCase().includes(name.toLowerCase()) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(name.toLowerCase())))
    );
    return matchedProds.length > 0 ? matchedProds.length : 8;
  };

  const handleCategoryClick = (catName: string) => {
    // Match best store category name or pass as is
    const matchedStoreCategory = categories.find(
      c => c.name.toLowerCase().includes(catName.toLowerCase()) || catName.toLowerCase().includes(c.name.toLowerCase())
    );
    
    if (matchedStoreCategory) {
      onSelectCategory(matchedStoreCategory.name);
    } else {
      onSelectCategory(catName);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-slate-50 w-full max-w-4xl h-[94vh] sm:h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80 mx-auto animate-in slide-in-from-bottom-6 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header matching screenshot */}
        <div className="bg-white px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 shrink-0 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              All Categories
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSearchInput(!showSearchInput)}
              className="p-2.5 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-full transition-colors cursor-pointer relative"
              title="Search categories"
            >
              <Search className="w-5 h-5 stroke-[2.2]" />
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenWishlist();
              }}
              className="p-2.5 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-full transition-colors cursor-pointer relative"
              title="Wishlist"
            >
              <Heart className="w-5 h-5 stroke-[2.2]" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Collapsible Search Bar inside Modal */}
        {showSearchInput && (
          <div className="bg-white px-4 py-2 border-b border-slate-200 animate-in slide-in-from-top-2 duration-150">
            <div className="relative">
              <input
                type="text"
                placeholder="Search category or item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 text-slate-900 placeholder-slate-400 text-xs sm:text-sm pl-9 pr-8 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50">

          {/* Feature Promo Banner matching the screenshot */}
          {!searchQuery && (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 text-white p-5 sm:p-6 shadow-md border border-indigo-400/30">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-slate-950 rounded-full text-[10px] font-black uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 fill-slate-950" />
                    Special Category Offer
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                    Find Your Perfect Daily Essentials
                  </h3>
                  <p className="text-xs text-indigo-100 font-medium">
                    Flat ₹100 Instant Discount on First Grocery Order • Code: <strong className="text-amber-300">NETHAJI100</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCategoryClick("Grocery & Staples")}
                  className="bg-white text-indigo-900 hover:bg-amber-300 hover:text-slate-950 px-5 py-2.5 rounded-2xl font-extrabold text-xs transition-all shadow-md flex items-center gap-2 group cursor-pointer shrink-0"
                >
                  <span>Explore Now</span>
                  <div className="w-6 h-6 rounded-full bg-indigo-100 group-hover:bg-slate-950 group-hover:text-amber-300 flex items-center justify-center transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              </div>

              {/* Background Accent Graphics */}
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute top-0 right-1/3 w-32 h-32 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />
            </div>
          )}

          {/* Render Department Groups */}
          {categoryGroups.map((group, groupIdx) => {
            // Filter group items if search query is active
            const filteredItems = group.items.filter(item => 
              !searchQuery || 
              item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              group.groupTitle.toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (filteredItems.length === 0) return null;

            return (
              <div key={groupIdx} className="space-y-3">
                {/* Group Title Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span>{group.groupTitle}</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-semibold">
                    {filteredItems.length} Categories
                  </span>
                </div>

                {/* Grid of Category Cards (Matching screenshot 3 to 4 per row layout) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  {filteredItems.map((cat, idx) => {
                    const count = getItemCount(cat.name);
                    return (
                      <div
                        key={idx}
                        onClick={() => handleCategoryClick(cat.name)}
                        className="group bg-white rounded-2xl p-3 border border-slate-200/90 hover:border-emerald-500 hover:shadow-md transition-all duration-200 flex flex-col items-center text-center cursor-pointer relative overflow-hidden active:scale-98"
                      >
                        {/* Optional badge */}
                        {cat.badge && (
                          <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-10 shadow-2xs">
                            {cat.badge}
                          </span>
                        )}

                        {/* Visual Image Container */}
                        <div className="w-full aspect-4/3 rounded-xl overflow-hidden mb-2.5 bg-slate-50 relative group-hover:scale-102 transition-transform">
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-slate-900/5 group-hover:bg-transparent transition-colors" />
                        </div>

                        {/* Title & Item Count */}
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 group-hover:text-emerald-700 leading-snug transition-colors line-clamp-2">
                          {cat.name}
                        </h4>
                        
                        <span className="text-[10px] text-slate-600 font-medium mt-1">
                          {count}+ Items
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Additional Dynamic Store Database Categories */}
          {categories.length > 0 && !searchQuery && (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                All Store Departments
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.name)}
                    className="bg-white rounded-2xl p-3 border border-slate-200 hover:border-emerald-500 hover:shadow-sm transition-all flex items-center gap-3 cursor-pointer group"
                  >
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-100"
                    />
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 truncate">
                        {cat.name}
                      </h4>
                      <p className="text-[10px] text-slate-600 font-medium">
                        {cat.itemCount} items
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Sticky Actions */}
        <div className="bg-white border-t border-slate-200 p-3 sm:p-4 shrink-0 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-500">
            Select any department to view products
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close Categories
          </button>
        </div>
      </div>
    </div>
  );
};
