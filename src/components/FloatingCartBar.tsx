import React from 'react';
import { Truck, Check, ShoppingBag } from 'lucide-react';
import { CartItem } from '../types';
import { useCartAnimation } from './CartAnimationProvider';

interface FloatingCartBarProps {
  cart: CartItem[];
  freeDeliveryThreshold?: number;
  onOpenCart: () => void;
}

export const FloatingCartBar: React.FC<FloatingCartBarProps> = ({
  cart,
  freeDeliveryThreshold = 299,
  onOpenCart
}) => {
  const { isCartBouncing } = useCartAnimation();

  if (!cart || cart.length === 0) return null;

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const amountNeeded = Math.max(0, freeDeliveryThreshold - cartSubtotal);
  const isUnlocked = cartSubtotal >= freeDeliveryThreshold;
  
  // Calculate stroke progress for SVG circle (radius = 12, circumference = 2 * PI * 12 ≈ 75.39)
  const radius = 12;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = Math.min(100, Math.round((cartSubtotal / freeDeliveryThreshold) * 100));
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const lastAddedItem = cart[cart.length - 1];

  return (
    <div className="fixed bottom-16 left-3 right-3 sm:bottom-20 sm:left-auto sm:right-6 z-40 max-w-md mx-auto pointer-events-auto transition-all duration-300 animate-in slide-in-from-bottom-5">
      <div className="flex items-center justify-between gap-2">
        
        {/* Left Capsule: Unlock Free Delivery Progress Bar */}
        <div className="flex-1 bg-[#1e232a] text-white px-3.5 py-2 rounded-2xl border border-slate-700/80 shadow-2xl flex items-center gap-3 min-w-0">
          
          {/* Circular Progress Ring with Truck Icon */}
          <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
            <svg className="w-9 h-9 -rotate-90 transform" viewBox="0 0 32 32">
              {/* Background Track Circle */}
              <circle
                cx="16"
                cy="16"
                r={radius}
                className="text-slate-700"
                strokeWidth="3"
                stroke="currentColor"
                fill="transparent"
              />
              {/* Progress Circle Arc */}
              <circle
                cx="16"
                cy="16"
                r={radius}
                className={isUnlocked ? "text-emerald-400" : "text-amber-400"}
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                style={{ transition: 'stroke-dashoffset 0.4s ease' }}
              />
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
              {isUnlocked ? (
                <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
              ) : (
                <Truck className="w-4 h-4 text-white" />
              )}
            </div>
          </div>

          {/* Delivery Text Info */}
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-black text-white truncate tracking-tight leading-snug">
              {isUnlocked ? '🎉 Free delivery unlocked!' : 'Unlock free delivery'}
            </h4>
            <p className="text-[11px] font-extrabold text-slate-300 truncate leading-tight mt-0.5">
              {isUnlocked ? (
                <span className="text-emerald-300">₹0 Delivery Fee Applied</span>
              ) : (
                <span>Shop for <strong className="text-amber-300 font-black">₹{amountNeeded}</strong> more</span>
              )}
            </p>
          </div>
        </div>

        {/* Right Button: Cart Button with Product Image Preview */}
        <button
          id="floating-cart-btn"
          type="button"
          onClick={onOpenCart}
          className={`bg-rose-600 hover:bg-rose-700 active:scale-95 text-white px-3.5 py-2 rounded-2xl shadow-2xl flex items-center gap-2.5 shrink-0 transition-all cursor-pointer border border-rose-500/80 group relative ${
            isCartBouncing ? "scale-125 ring-4 ring-amber-400 bg-rose-500 duration-150 shadow-rose-500/50" : ""
          }`}
        >
          {/* Item Preview Image */}
          <div className="w-8 h-8 rounded-xl bg-white p-0.5 shrink-0 overflow-hidden shadow-xs flex items-center justify-center">
            {lastAddedItem?.product?.image ? (
              <img
                src={lastAddedItem.product.image}
                alt={lastAddedItem.product.name}
                className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform"
              />
            ) : (
              <ShoppingBag className="w-4 h-4 text-rose-600" />
            )}
          </div>

          {/* Cart Label & Items Counter */}
          <div className="text-left leading-none">
            <span className="text-xs font-black text-white block tracking-tight">Cart</span>
            <span className="text-[10px] font-extrabold text-rose-100 block mt-0.5">
              {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
            </span>
          </div>
        </button>

      </div>
    </div>
  );
};
