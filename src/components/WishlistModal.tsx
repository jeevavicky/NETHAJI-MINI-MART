import React from 'react';
import { Product } from '../types';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlist: Product[];
  onRemoveFromWishlist: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  wishlist,
  onRemoveFromWishlist,
  onAddToCart
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-4 bg-emerald-800 text-white flex items-center justify-between sticky top-0 z-10 border-b border-emerald-700">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
            <h2 className="font-extrabold text-base">Your Wishlist ({wishlist.length})</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-emerald-200 hover:text-white hover:bg-emerald-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {wishlist.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Heart className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700 text-xs">Your wishlist is empty</p>
              <p className="text-[11px] text-slate-500">
                Click the heart icon on any product to save items for quick reorder.
              </p>
            </div>
          ) : (
            wishlist.map((prod) => (
              <div
                key={prod.id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3 justify-between"
              >
                <img
                  src={prod.image}
                  alt={prod.name}
                  className="w-12 h-12 object-contain bg-white rounded-lg p-1 border border-slate-200"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{prod.name}</h4>
                  <p className="text-[10px] text-slate-500 font-semibold">{prod.brand} • {prod.unit}</p>
                  <p className="text-xs font-black text-emerald-800">₹{prod.price}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onAddToCart(prod);
                      onRemoveFromWishlist(prod);
                    }}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Move to Cart</span>
                  </button>

                  <button
                    onClick={() => onRemoveFromWishlist(prod)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
