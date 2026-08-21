import React from 'react';
import { Truck, CheckCircle2, Sparkles, ShoppingBag, ArrowRight } from 'lucide-react';

interface FreeDeliveryBannerProps {
  threshold: number;
  cartSubtotal: number;
  cartCount: number;
  onOpenCart: () => void;
  onSelectCategory?: (cat: string) => void;
}

export const FreeDeliveryBanner: React.FC<FreeDeliveryBannerProps> = ({
  threshold = 499,
  cartSubtotal,
  cartCount,
  onOpenCart,
  onSelectCategory
}) => {
  const amountNeeded = Math.max(0, threshold - cartSubtotal);
  const progressPercent = Math.min(100, Math.round((cartSubtotal / threshold) * 100));
  const isUnlocked = cartSubtotal >= threshold;

  return (
    <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-950 text-white border-b border-emerald-700/60 shadow-md sticky top-[61px] sm:top-[73px] z-30 transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2.5">
          
          {/* Main Status Text & Icon */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-xs transition-all ${
              isUnlocked 
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 animate-bounce' 
                : 'bg-amber-500/20 border-amber-400/60 text-amber-300'
            }`}>
              {isUnlocked ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <Truck className="w-5 h-5 text-amber-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-amber-400 text-amber-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider flex items-center gap-1 shadow-xs">
                  <Sparkles className="w-3 h-3 text-amber-800" />
                  <span>FREE DELIVERY OFFER</span>
                </span>
                {isUnlocked ? (
                  <span className="text-emerald-300 font-extrabold text-xs sm:text-sm animate-pulse">
                    🎉 You Unlocked FREE Express Delivery!
                  </span>
                ) : cartSubtotal > 0 ? (
                  <span className="text-white font-extrabold text-xs sm:text-sm">
                    Add <strong className="text-amber-300 text-sm sm:text-base font-black">₹{amountNeeded}</strong> more to unlock FREE Delivery!
                  </span>
                ) : (
                  <span className="text-white font-extrabold text-xs sm:text-sm">
                    Shop for <strong className="text-amber-300 font-black">₹{threshold}</strong> & get <span className="text-emerald-300 underline underline-offset-2">100% FREE Express Delivery</span>
                  </span>
                )}
              </div>

              <p className="text-[11px] text-emerald-100/90 truncate mt-0.5 font-medium">
                {isUnlocked 
                  ? "Zero delivery charges applied to your order at checkout!" 
                  : cartSubtotal > 0 
                  ? `Current cart: ₹${cartSubtotal} / ₹${threshold} goal (${progressPercent}% completed)` 
                  : `Add daily groceries, vegetables or staples worth ₹${threshold} to save on shipping!`}
              </p>
            </div>
          </div>

          {/* Progress Bar & Quick Action */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            
            {/* Visual Progress Bar Widget */}
            <div className="flex-1 md:w-56 bg-emerald-950/80 border border-emerald-700/80 p-1.5 rounded-xl text-xs shadow-inner">
              <div className="flex justify-between items-center text-[10px] text-emerald-200 font-bold mb-1 px-1">
                <span>₹0</span>
                <span className="text-amber-300 font-black">{progressPercent}% Unlocked</span>
                <span>₹{threshold}</span>
              </div>
              <div className="w-full bg-slate-900/90 rounded-full h-2.5 overflow-hidden border border-emerald-800/80 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 shadow-xs ${
                    isUnlocked
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-300'
                      : 'bg-gradient-to-r from-amber-400 to-amber-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Action CTA Button */}
            <button
              type="button"
              onClick={onOpenCart}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl border border-amber-300 shadow-md transition-all active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-slate-950" />
              <span className="hidden sm:inline">
                {cartCount > 0 ? `Cart (₹${cartSubtotal})` : "View Offer"}
              </span>
              <span className="sm:hidden">
                {cartCount > 0 ? `₹${cartSubtotal}` : "Cart"}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

          </div>

        </div>
      </div>
    </div>
  );
};
