import React, { memo } from 'react';
import { Product } from '../types';
import { Heart, Plus, Minus, Eye, Sparkles } from 'lucide-react';
import { useCartAnimation } from './CartAnimationProvider';

interface ProductCardProps {
  product: Product;
  cartQuantity: number;
  isWishlisted: boolean;
  onAddToCart: (product: Product) => void;
  onUpdateCartQuantity: (productId: string, quantity: number) => void;
  onToggleWishlist: (product: Product) => void;
  onQuickView: (product: Product) => void;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80';

export const ProductCard: React.FC<ProductCardProps> = memo(({
  product,
  cartQuantity,
  isWishlisted,
  onAddToCart,
  onUpdateCartQuantity,
  onToggleWishlist,
  onQuickView
}) => {
  const { triggerFlyToCart } = useCartAnimation();
  const savings = Math.max(0, product.mrp - product.price);
  const isOutOfStock = product.stock <= 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerFlyToCart(product, e);
    onAddToCart(product);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerFlyToCart(product, e);
    onUpdateCartQuantity(product.id, cartQuantity + 1);
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all p-2 sm:p-3 flex flex-col justify-between group overflow-hidden relative h-full">
      
      {/* Image Box Container */}
      <div className="relative aspect-square bg-slate-50/80 rounded-lg sm:rounded-xl overflow-hidden mb-2 border border-slate-100/90 flex items-center justify-center p-1 sm:p-2">
        
        {/* Wishlist Heart Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product);
          }}
          className={`absolute top-1 right-1 sm:top-1.5 sm:right-1.5 z-10 p-1 sm:p-1.5 rounded-full transition-all shadow-2xs ${
            isWishlisted 
              ? "bg-rose-50 text-rose-600 border border-rose-200 scale-105" 
              : "bg-white/90 text-slate-400 hover:text-rose-500 hover:bg-white"
          }`}
          title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isWishlisted ? "fill-rose-600" : ""}`} />
        </button>

        {/* Organic Tag */}
        {product.isOrganic && (
          <span className="absolute top-1 left-1 bg-emerald-700 text-white font-extrabold text-[8px] sm:text-[9px] px-1 py-0.5 rounded z-10 uppercase tracking-wider flex items-center gap-0.5">
            <Sparkles className="w-2 h-2" /> Organic
          </span>
        )}

        {/* Product Image */}
        <img
          src={product.image || FALLBACK_IMAGE}
          alt={product.name}
          onClick={() => onQuickView(product)}
          className="w-full h-full object-contain max-h-28 sm:max-h-36 group-hover:scale-105 transition-transform duration-300 cursor-pointer"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== FALLBACK_IMAGE) {
              target.src = FALLBACK_IMAGE;
            }
          }}
        />

        {/* Quick View Button */}
        <button
          onClick={() => onQuickView(product)}
          className="absolute top-1 left-1 bg-slate-900/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center gap-1 z-10"
        >
          <Eye className="w-2.5 h-2.5" /> View
        </button>

        {/* Floating Pink "ADD" / Stepper Button */}
        <div className="absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 z-10">
          {isOutOfStock ? (
            <span className="bg-rose-100 text-rose-700 font-black text-[9px] sm:text-[10px] px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg border border-rose-300 shadow-2xs uppercase tracking-wider">
              OUT OF STOCK
            </span>
          ) : cartQuantity === 0 ? (
            <button
              onClick={handleAdd}
              className="w-7 h-7 sm:w-8 sm:h-8 bg-white hover:bg-rose-500 text-rose-600 hover:text-white border-2 border-rose-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-2xs transition-all active:scale-90 hover:scale-105 cursor-pointer"
              title="Add to Cart"
            >
              <Plus className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[3]" />
            </button>
          ) : (
            <div className="flex items-center gap-0.5 sm:gap-1 bg-rose-600 text-white rounded-lg p-0.5 sm:p-1 shadow-md border border-rose-700">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateCartQuantity(product.id, cartQuantity - 1);
                }}
                className="p-0.5 hover:bg-rose-700 rounded transition-colors cursor-pointer"
              >
                <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
              </button>
              <span className="font-black text-[10px] sm:text-xs px-0.5">{cartQuantity}</span>
              <button
                onClick={handleIncrement}
                disabled={cartQuantity >= product.stock}
                className={`p-0.5 rounded transition-colors ${
                  cartQuantity >= product.stock ? 'opacity-50 cursor-not-allowed' : 'hover:bg-rose-700 cursor-pointer'
                }`}
                title={cartQuantity >= product.stock ? 'Max stock reached' : 'Add more'}
              >
                <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Product Details */}
      <div className="flex flex-col flex-1 justify-between">
        <div>
          {/* Price & MRP Row */}
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className="bg-emerald-700 text-white font-black text-[11px] sm:text-xs px-1.5 py-0.5 rounded shadow-2xs">
              ₹{product.price}
            </span>
            {product.mrp > product.price && (
              <span className="text-slate-400 font-bold text-[10px] sm:text-xs line-through">
                ₹{product.mrp}
              </span>
            )}
          </div>

          {/* Discount Savings Tag */}
          {savings > 0 && (
            <p className="text-emerald-700 font-extrabold text-[10px] sm:text-xs mb-0.5">
              ₹{savings} OFF
            </p>
          )}

          {/* Product Title */}
          <h3
            onClick={() => onQuickView(product)}
            className="font-extrabold text-slate-900 text-[11px] sm:text-xs leading-snug line-clamp-2 hover:text-emerald-800 transition-colors cursor-pointer"
          >
            {product.name}
          </h3>
        </div>

        {/* Unit & Available Stock Row */}
        <div className="flex items-center justify-between gap-1 mt-1 pt-1 border-t border-slate-100">
          <p className="text-slate-500 text-[10px] sm:text-[11px] font-semibold truncate">
            {product.unit}
          </p>
          {isOutOfStock ? (
            <span className="text-[9px] font-black text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-300 shrink-0 uppercase tracking-wide">
              OUT OF STOCK
            </span>
          ) : (
            <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
              Stock: {product.stock}
            </span>
          )}
        </div>
      </div>

    </div>
  );
}, (prev, next) => {
  return (
    prev.product.id === next.product.id &&
    prev.cartQuantity === next.cartQuantity &&
    prev.isWishlisted === next.isWishlisted &&
    prev.product.stock === next.product.stock &&
    prev.product.price === next.product.price &&
    prev.product.mrp === next.product.mrp
  );
});

