import React, { useState } from 'react';
import { CartItem, StoreSettings, Product } from '../types';
import { X, Trash2, Plus, Minus, Tag, ArrowRight, ShoppingBag, ShieldCheck, Truck, Check } from 'lucide-react';
import { CheckoutRecommendations } from './CheckoutRecommendations';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  settings: StoreSettings;
  products?: Product[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  appliedCoupon: { code: string; discount: number; description?: string } | null;
  onApplyCoupon: (code: string) => Promise<{ valid: boolean; discount: number; message?: string }>;
  onRemoveCoupon: () => void;
  onProceedToCheckout: () => void;
  onAddToCart?: (product: Product) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  settings,
  products = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  onProceedToCheckout,
  onAddToCart
}) => {
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const gstAmount = Math.round(subtotal * 0.05); // 5% estimated GST
  const freeThreshold = settings.freeDeliveryThreshold;
  const deliveryFee = subtotal >= freeThreshold || cart.length === 0 ? 0 : settings.defaultDeliveryFee;
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const grandTotal = Math.max(0, subtotal + gstAmount + deliveryFee - discount);

  const amountNeededForFreeDelivery = Math.max(0, freeThreshold - subtotal);
  const freeDeliveryProgress = Math.min(100, Math.round((subtotal / freeThreshold) * 100));

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponError("");
    setCouponSuccess("");

    const res = await onApplyCoupon(couponInput);
    if (res.valid) {
      setCouponSuccess(`Coupon ${couponInput.toUpperCase()} applied! Saved ₹${res.discount}`);
      setCouponInput("");
    } else {
      setCouponError(res.message || "Invalid coupon code");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        
        {/* Cart Header */}
        <div className="p-4 bg-emerald-800 text-white flex items-center justify-between border-b border-emerald-700">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-extrabold text-base leading-tight">Your Grocery Cart</h2>
              <p className="text-[11px] text-emerald-200">{cart.length} unique items</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-emerald-200 hover:text-white hover:bg-emerald-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        {cart.length > 0 && (
          <div className="bg-emerald-50 border-b border-emerald-100 p-3 text-xs">
            {amountNeededForFreeDelivery > 0 ? (
              <p className="font-semibold text-emerald-900 mb-1 flex items-center justify-between">
                <span>Add <strong>₹{amountNeededForFreeDelivery}</strong> more for FREE Express Delivery!</span>
                <Truck className="w-4 h-4 text-emerald-700" />
              </p>
            ) : (
              <p className="font-bold text-emerald-800 mb-1 flex items-center gap-1">
                <Check className="w-4 h-4 text-emerald-600" /> You unlocked FREE Express Local Delivery!
              </p>
            )}

            <div className="w-full bg-emerald-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${freeDeliveryProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-700">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Your shopping bag is empty</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Explore our fresh vegetables, fruits, staples and snacks at Nethaji Mini Mart!
              </p>
              <button
                onClick={onClose}
                className="mt-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs"
              >
                Start Shopping Now
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-center gap-3 relative group"
              >
                {/* Thumbnail */}
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-14 h-14 object-contain rounded-lg bg-white p-1 border border-slate-200 shrink-0"
                />

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {item.product.name}
                  </h4>
                  <p className="text-[10px] font-semibold text-slate-500">
                    ₹{item.product.price} / {item.product.unit}
                  </p>
                  
                  <div className="flex items-center justify-between pt-1">
                    {/* Quantity Stepper */}
                    <div className="flex items-center border border-slate-300 rounded-md bg-white">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 font-bold"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 font-extrabold text-xs text-slate-900">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 font-bold"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="text-xs font-black text-slate-900">
                      ₹{item.product.price * item.quantity}
                    </span>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => onRemoveItem(item.product.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}

          {/* Zepto Style Checkout Recommendations & Offer Add-ons */}
          {products.length > 0 && (
            <div className="pt-2">
              <CheckoutRecommendations
                products={products}
                cart={cart}
                onAddToCart={onAddToCart || ((p) => onUpdateQuantity(p.id, 1))}
                onUpdateQuantity={onUpdateQuantity}
                variant="cart"
              />
            </div>
          )}
        </div>

        {/* Cart Bottom Summary & Checkout */}
        {cart.length > 0 && (
          <div className="border-t border-slate-200 p-4 bg-white space-y-3 shadow-lg">
            
            {/* Promo Code Form */}
            {!appliedCoupon ? (
              <form onSubmit={handleApplyCoupon} className="space-y-1">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Coupon Code (e.g. NETHAJI100)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 uppercase rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                    <Tag className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl transition-all"
                  >
                    Apply
                  </button>
                </div>

                {couponError && <p className="text-[11px] font-bold text-rose-600">{couponError}</p>}
                
                <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-1">
                  <span>Available Coupons:</span>
                  <button
                    type="button"
                    onClick={() => setCouponInput("NETHAJI100")}
                    className="text-emerald-800 font-bold underline"
                  >
                    NETHAJI100
                  </button>
                  <span>|</span>
                  <button
                    type="button"
                    onClick={() => setCouponInput("FRESH20")}
                    className="text-emerald-800 font-bold underline"
                  >
                    FRESH20
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-700" />
                  <div>
                    <span className="font-extrabold text-amber-900">{appliedCoupon.code} Applied</span>
                    <p className="text-[10px] text-amber-800 font-medium">You saved ₹{appliedCoupon.discount}</p>
                  </div>
                </div>
                <button
                  onClick={onRemoveCoupon}
                  className="text-rose-600 font-bold text-[11px] hover:underline"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Price Calculations */}
            <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-900">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated GST (5%)</span>
                <span className="font-bold text-slate-900">₹{gstAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                {deliveryFee === 0 ? (
                  <span className="font-bold text-emerald-700">FREE</span>
                ) : (
                  <span className="font-bold text-slate-900">₹{deliveryFee}</span>
                )}
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-amber-700 font-bold">
                  <span>Coupon Discount</span>
                  <span>-₹{discount}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-2">
                <span>Grand Total</span>
                <span className="text-base text-emerald-800">₹{grandTotal}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              id="cart-checkout-btn"
              onClick={onProceedToCheckout}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>
        )}

      </div>
    </div>
  );
};
