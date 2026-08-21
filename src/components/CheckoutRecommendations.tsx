import React, { useState } from 'react';
import { Product, CartItem } from '../types';
import { Zap, Sparkles, Plus, Minus, Tag, TrendingUp, Check } from 'lucide-react';

interface CheckoutRecommendationsProps {
  products: Product[];
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  className?: string;
  variant?: 'cart' | 'checkout';
}

export const CheckoutRecommendations: React.FC<CheckoutRecommendationsProps> = ({
  products,
  cart,
  onAddToCart,
  onUpdateQuantity,
  className = '',
  variant = 'cart'
}) => {
  const [activeTab, setActiveTab] = useState<'offers' | 'related'>('offers');

  if (!products || products.length === 0) return null;

  const cartProductIds = new Set(cart.map(item => item.product.id));
  const cartQuantities: { [id: string]: number } = {};
  cart.forEach(item => {
    cartQuantities[item.product.id] = item.quantity;
  });

  // 1. Get Special Offer / ₹1 Products
  const offerProducts = products.filter(p => 
    !cartProductIds.has(p.id) && (
      p.price <= 25 || 
      p.isOneRupeeZone || 
      p.isOffer || 
      (p.mrp > p.price && ((p.mrp - p.price) / p.mrp) >= 0.15)
    )
  ).slice(0, 10);

  // 2. Get Smart Related / Frequently Bought Together Products
  const getRelatedProducts = (): Product[] => {
    const available = products.filter(p => !cartProductIds.has(p.id));
    if (cart.length === 0) {
      return available.filter(p => p.isPopular || p.rating >= 4.5).slice(0, 10);
    }

    const cartCategories = cart.map(item => item.product.category.toLowerCase());
    const cartNames = cart.map(item => item.product.name.toLowerCase()).join(' ');

    const complementaryKeywords: string[] = [];
    if (cartNames.includes('milk') || cartNames.includes('curd') || cartNames.includes('paneer') || cartNames.includes('dairy')) {
      complementaryKeywords.push('bread', 'tea', 'coffee', 'biscuit', 'butter', 'egg', 'rusk');
    }
    if (cartNames.includes('onion') || cartNames.includes('potato') || cartNames.includes('veg') || cartNames.includes('fruit')) {
      complementaryKeywords.push('oil', 'chilli', 'salt', 'turmeric', 'coriander', 'lemon', 'ginger', 'tomato');
    }
    if (cartNames.includes('chip') || cartNames.includes('snack') || cartNames.includes('biscuit') || cartNames.includes('munch')) {
      complementaryKeywords.push('drink', 'cola', 'soda', 'juice', 'chocolate', 'water', 'dip');
    }
    if (cartNames.includes('rice') || cartNames.includes('atta') || cartNames.includes('dal') || cartNames.includes('flour')) {
      complementaryKeywords.push('ghee', 'oil', 'salt', 'spice', 'mustard', 'jeeer');
    }

    const scored = available.map(p => {
      let score = 0;
      const cat = p.category.toLowerCase();
      const name = p.name.toLowerCase();

      // Category match or complement
      if (cartCategories.some(c => c.includes(cat) || cat.includes(c))) score += 6;

      complementaryKeywords.forEach(kw => {
        if (name.includes(kw)) score += 9;
      });

      if (p.isPopular) score += 3;
      if (p.isOffer) score += 2;

      return { product: p, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map(s => s.product).slice(0, 10);
  };

  const relatedProducts = getRelatedProducts();
  const displayedProducts = activeTab === 'offers' 
    ? (offerProducts.length > 0 ? offerProducts : relatedProducts)
    : (relatedProducts.length > 0 ? relatedProducts : offerProducts);

  if (displayedProducts.length === 0) return null;

  return (
    <div className={`bg-gradient-to-br from-amber-50/70 via-rose-50/40 to-slate-50 border border-amber-200/80 rounded-2xl p-3 shadow-2xs ${className}`}>
      
      {/* Header with Zepto style badge */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="p-1 bg-gradient-to-r from-amber-500 to-rose-600 text-white rounded-lg shadow-2xs">
            <Zap className="w-3.5 h-3.5 fill-amber-200 text-amber-100" />
          </span>
          <div>
            <h3 className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1">
              <span>{variant === 'checkout' ? 'Last Minute Add-ons' : 'Before You Checkout'}</span>
              <span className="bg-rose-100 text-rose-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border border-rose-200">
                Zepto Offers
              </span>
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold">
              Handpicked deals & pairs well with your cart
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white/90 p-0.5 rounded-xl border border-slate-200 shadow-2xs text-[10px] font-black shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('offers')}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'offers' 
                ? 'bg-rose-600 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ₹1 & Deals ({offerProducts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('related')}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'related' 
                ? 'bg-rose-600 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pairs Well ({relatedProducts.length})
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Product List */}
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
        {displayedProducts.map((p) => {
          const qty = cartQuantities[p.id] || 0;
          const savings = p.mrp > p.price ? p.mrp - p.price : 0;

          return (
            <div
              key={p.id}
              className="bg-white rounded-xl p-2 border border-slate-200/90 shadow-2xs min-w-[130px] max-w-[140px] shrink-0 flex flex-col justify-between hover:border-rose-300 transition-all group"
            >
              <div>
                {/* Image & Discount Badge */}
                <div className="relative w-full aspect-square bg-slate-50 rounded-lg p-1 flex items-center justify-center overflow-hidden mb-1.5">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                  />
                  {p.isOneRupeeZone || p.price <= 10 ? (
                    <span className="absolute top-1 left-1 bg-amber-500 text-slate-950 font-black text-[8px] px-1 py-0.2 rounded shadow-2xs uppercase">
                      ₹1 Deal
                    </span>
                  ) : savings > 0 ? (
                    <span className="absolute top-1 left-1 bg-emerald-700 text-white font-black text-[8px] px-1 py-0.2 rounded shadow-2xs">
                      Save ₹{savings}
                    </span>
                  ) : null}
                </div>

                {/* Name & Unit */}
                <h4 className="text-[11px] font-extrabold text-slate-900 line-clamp-1 leading-snug">
                  {p.name}
                </h4>
                <p className="text-[9px] font-bold text-slate-400">
                  {p.unit}
                </p>
              </div>

              {/* Unit & Stock */}
              <div className="flex items-center justify-between text-[10px] mt-0.5">
                <span className="text-slate-400 font-semibold">{p.unit}</span>
                {p.stock <= 0 ? (
                  <span className="text-rose-600 font-black text-[9px] uppercase">OUT OF STOCK</span>
                ) : (
                  <span className="text-emerald-700 font-bold text-[9px]">Stock: {p.stock}</span>
                )}
              </div>

              {/* Price & ADD Button */}
              <div className="mt-2 flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-black text-emerald-800">₹{p.price}</span>
                    {p.mrp > p.price && (
                      <span className="text-[9px] text-slate-400 line-through font-bold">₹{p.mrp}</span>
                    )}
                  </div>
                </div>

                {/* Add or Stepper */}
                {p.stock <= 0 ? (
                  <span className="bg-rose-100 text-rose-700 font-black text-[9px] px-1.5 py-0.5 rounded border border-rose-300 uppercase">
                    OUT OF STOCK
                  </span>
                ) : qty === 0 ? (
                  <button
                    type="button"
                    onClick={() => onAddToCart(p)}
                    className="bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-300 font-black text-[10px] px-2 py-0.5 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-0.5"
                  >
                    <Plus className="w-2.5 h-2.5 stroke-[3]" />
                    <span>ADD</span>
                  </button>
                ) : (
                  <div className="bg-rose-600 text-white font-black text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded-lg shadow-2xs">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity && onUpdateQuantity(p.id, qty - 1)}
                      className="hover:text-amber-200 cursor-pointer"
                    >
                      <Minus className="w-2.5 h-2.5 stroke-[3]" />
                    </button>
                    <span>{qty}</span>
                    <button
                      type="button"
                      disabled={qty >= p.stock}
                      onClick={() => {
                        if (qty < p.stock) {
                          onAddToCart(p);
                        }
                      }}
                      className={`${qty >= p.stock ? 'opacity-50 cursor-not-allowed' : 'hover:text-amber-200 cursor-pointer'}`}
                    >
                      <Plus className="w-2.5 h-2.5 stroke-[3]" />
                    </button>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
