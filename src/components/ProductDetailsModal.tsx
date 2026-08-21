import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { api } from '../services/api';
import { X, Star, Heart, ShoppingBag, Truck, ShieldCheck, Plus, Minus, Tag, CheckCircle2, Share2, Copy, Check, MessageCircle, ArrowRight, Sparkles, ChevronLeft } from 'lucide-react';
import { useCartAnimation } from './CartAnimationProvider';

interface ProductDetailsModalProps {
  product: Product | null;
  allProducts?: Product[];
  onSelectProduct?: (product: Product) => void;
  onClose: () => void;
  cartQuantity: number;
  cartItemsMap?: Record<string, number>;
  isWishlisted: boolean;
  onAddToCart: (product: Product, quantity?: number) => void;
  onUpdateCartQuantity: (productId: string, quantity: number) => void;
  onToggleWishlist: (product: Product) => void;
  onTrackShare?: (productId: string) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  allProducts = [],
  onSelectProduct,
  onClose,
  cartQuantity,
  cartItemsMap = {},
  isWishlisted,
  onAddToCart,
  onUpdateCartQuantity,
  onToggleWishlist,
  onTrackShare
}) => {
  const { triggerFlyToCart } = useCartAnimation();
  const [newReviewName, setNewReviewName] = useState("");
  const [newReviewComment, setNewReviewComment] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [localShareCount, setLocalShareCount] = useState<number>(product?.shareCount || 0);

  const modalContainerRef = useRef<HTMLDivElement>(null);

  const [addedToast, setAddedToast] = useState(false);

  useEffect(() => {
    if (product) {
      setLocalShareCount(product.shareCount || 0);
      setAddedToast(false);
      if (modalContainerRef.current) {
        modalContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [product?.id]);

  if (!product) return null;

  // Filter "Similar Products" based on the category of the currently viewed item
  const sameCategoryProducts = allProducts.filter(
    (p) => p.id !== product.id && p.category?.toLowerCase() === product.category?.toLowerCase()
  );
  const otherCategoryProducts = allProducts.filter(
    (p) => p.id !== product.id && p.category?.toLowerCase() !== product.category?.toLowerCase()
  );

  const isSameCategoryAvailable = sameCategoryProducts.length > 0;
  const similarProducts = (
    isSameCategoryAvailable ? sameCategoryProducts : otherCategoryProducts
  ).slice(0, 8);

  const discountPercent = product.mrp > product.price 
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100) 
    : 0;

  const handleTriggerShare = async () => {
    try {
      setLocalShareCount(prev => prev + 1);
      await api.trackProductShare(product.id);
      if (onTrackShare) {
        onTrackShare(product.id);
      }
    } catch (e) {
      console.error('Error tracking share', e);
    }
  };

  const handleShareWhatsApp = () => {
    handleTriggerShare();
    const shareUrl = window.location.href;
    const text = `Check out ${product.name} (${product.unit}) for ₹${product.price} at Nethaji Mini Mart!\n${shareUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewName || !newReviewComment) return;
    setReviewSubmitted(true);
    setTimeout(() => {
      setNewReviewName("");
      setNewReviewComment("");
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div 
        ref={modalContainerRef}
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in duration-200"
      >
        
        {/* Sticky Header with Back Button and Close Button */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 py-3 border-b border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-black text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-3 py-1.5 rounded-xl border border-slate-200 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-emerald-600" />
            <span>Back to Store</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Close product details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left Column: Image & Badges */}
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 relative flex items-center justify-center aspect-square">
              {discountPercent > 0 && (
                <span className="absolute top-3 left-3 bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-md shadow-xs uppercase tracking-wider">
                  {discountPercent}% OFF
                </span>
              )}

              <img
                src={product.image}
                alt={product.name}
                className="max-h-64 object-contain"
              />
            </div>

            {/* Quick Benefits */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600">
              <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center gap-2 text-emerald-900">
                <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Express 30-Min Delivery</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center gap-2 text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Quality Inspected</span>
              </div>
            </div>
          </div>

          {/* Right Column: Product Information */}
          <div className="space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md uppercase tracking-wider text-[10px] font-bold">
                  {product.category}
                </span>
                <span>SKU: {product.sku}</span>
              </div>

              <h2 className="text-xl font-extrabold text-slate-900 leading-snug">
                {product.name}
              </h2>

              <p className="text-xs font-semibold text-slate-500 mt-1">
                Brand: <strong className="text-slate-800">{product.brand}</strong> | Pack Size: <strong className="text-slate-800">{product.unit}</strong>
              </p>

              {/* Stock Status Badge */}
              <div className="mt-2">
                {product.stock <= 0 ? (
                  <span className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-700 font-black text-xs px-3 py-1 rounded-lg border border-rose-300 uppercase tracking-wider">
                    OUT OF STOCK
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 font-extrabold text-xs px-3 py-1 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Available Stock: {product.stock} units</span>
                  </span>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(product.rating) ? "fill-amber-400" : "text-slate-200"}`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-800">{product.rating}</span>
                <span className="text-xs text-slate-400">({product.reviewsCount} customer reviews)</span>
              </div>

              {/* Price Block */}
              <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-baseline gap-3">
                <span className="text-2xl font-black text-emerald-800">₹{product.price}</span>
                {product.mrp > product.price && (
                  <span className="text-sm text-slate-400 line-through">₹{product.mrp}</span>
                )}
                {discountPercent > 0 && (
                  <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full ml-auto">
                    You Save ₹{product.mrp - product.price}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Product Description</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            </div>

            {/* Quantity Stepper & Actions */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              
              {/* If item already in cart, show current cart quantity stepper */}
              {cartQuantity > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>In Cart: {cartQuantity} unit{cartQuantity > 1 ? 's' : ''}</span>
                  </span>
                  <div className="flex items-center gap-2 bg-emerald-700 text-white rounded-lg p-1 shadow-xs">
                    <button
                      type="button"
                      onClick={() => onUpdateCartQuantity(product.id, cartQuantity - 1)}
                      className="p-1 hover:bg-emerald-800 rounded transition-colors cursor-pointer"
                      title="Reduce quantity"
                    >
                      <Minus className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                    <span className="font-black text-xs px-2">{cartQuantity}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        triggerFlyToCart(product, e);
                        onUpdateCartQuantity(product.id, cartQuantity + 1);
                      }}
                      className="p-1 hover:bg-emerald-800 rounded transition-colors cursor-pointer"
                      title="Add one more"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>
                </div>
              )}

              {/* Success Toast when item added */}
              {addedToast && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-2.5 flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Added 1 item to your cart!</span>
                  </div>
                  <span className="text-[10px] bg-emerald-700 text-white font-black px-2 py-0.5 rounded-md">
                    Total in Cart: {cartQuantity}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  id="modal-add-to-cart-btn"
                  onClick={(e) => {
                    triggerFlyToCart(product, e);
                    onAddToCart(product, 1);
                    setAddedToast(true);
                    setTimeout(() => setAddedToast(false), 3500);
                  }}
                  disabled={product.stock <= 0 || cartQuantity >= product.stock}
                  className={`flex-1 font-extrabold text-sm py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${
                    product.stock <= 0
                      ? "bg-rose-100 text-rose-700 border border-rose-300 opacity-90 cursor-not-allowed uppercase tracking-wider font-black"
                      : cartQuantity >= product.stock
                      ? "bg-amber-100 text-amber-900 border border-amber-300 opacity-90 cursor-not-allowed"
                      : "bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white cursor-pointer"
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {product.stock <= 0
                      ? "OUT OF STOCK"
                      : cartQuantity >= product.stock
                      ? `Max Stock Reached (${product.stock} units)`
                      : cartQuantity > 0 
                      ? `Add 1 More to Cart • ₹${product.price}` 
                      : `ADD TO CART • ₹${product.price}`}
                  </span>
                </button>

                <button
                  onClick={() => onToggleWishlist(product)}
                  className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                    isWishlisted 
                      ? "bg-rose-50 text-rose-600 border-rose-300" 
                      : "bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100"
                  }`}
                  title={isWishlisted ? "In Wishlist" : "Add to Wishlist"}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? "fill-rose-600" : ""}`} />
                </button>
              </div>

              {/* Prominent Social Share Section */}
              <div className="pt-3 border-t border-slate-200">
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <Share2 className="w-4 h-4 text-emerald-600" />
                      <span>Share Product Deal</span>
                    </div>
                    {localShareCount > 0 && (
                      <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full text-[10px] border border-emerald-300">
                        {localShareCount} {localShareCount === 1 ? 'Share' : 'Shares'}
                      </span>
                    )}
                  </div>

                  <div>
                    {/* WhatsApp Button */}
                    <button
                      type="button"
                      id="share-whatsapp-btn"
                      onClick={handleShareWhatsApp}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 px-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                      title="Share item on WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4 text-amber-300 fill-amber-300" />
                      <span>Share on WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Reviews Section */}
        <div className="border-t border-slate-200 p-6 bg-slate-50/50">
          <h3 className="font-bold text-sm text-slate-900 mb-4">Customer Reviews & Feedback</h3>
          
          {reviewSubmitted ? (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Thank you! Your review has been submitted for Nethaji Mini Mart.</span>
            </div>
          ) : (
            <form onSubmit={handleAddReview} className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-xs font-semibold text-slate-700">Write a Review for this product:</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Your Name"
                  required
                  value={newReviewName}
                  onChange={(e) => setNewReviewName(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-medium">Rating:</span>
                  <select
                    value={newReviewRating}
                    onChange={(e) => setNewReviewRating(Number(e.target.value))}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-amber-700"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5/5 Excellent)</option>
                    <option value={4}>⭐⭐⭐⭐ (4/5 Very Good)</option>
                    <option value={3}>⭐⭐⭐ (3/5 Average)</option>
                  </select>
                </div>
              </div>

              <textarea
                placeholder="Share your feedback regarding freshness, quality or delivery..."
                required
                rows={2}
                value={newReviewComment}
                onChange={(e) => setNewReviewComment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              ></textarea>

              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Submit Review
              </button>
            </form>
          )}
        </div>

        {/* Zepto-Style "More Products Like This" Section */}
        {similarProducts.length > 0 && (
          <div className="border-t-2 border-slate-100 p-6 bg-slate-50/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                  <span className="text-amber-500">🛍️</span> More Products You Might Like
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Frequently bought together in {product.category}
                </p>
              </div>
              <span className="bg-emerald-100 text-emerald-900 font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-emerald-300">
                Zepto Recommendations
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {similarProducts.map((item) => {
                const itemQty = cartItemsMap[item.id] || 0;
                const itemDiscount = item.mrp > item.price
                  ? Math.round(((item.mrp - item.price) / item.mrp) * 100)
                  : 0;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-3 border border-slate-200/90 hover:border-emerald-500 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer relative"
                    onClick={() => {
                      if (onSelectProduct) {
                        onSelectProduct(item);
                      }
                    }}
                  >
                    {itemDiscount > 0 && (
                      <span className="absolute top-2 left-2 z-10 bg-rose-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded-md uppercase">
                        {itemDiscount}% OFF
                      </span>
                    )}

                    <div className="space-y-2">
                      <div className="w-full aspect-square bg-slate-50 rounded-xl p-2 flex items-center justify-center overflow-hidden border border-slate-100 group-hover:border-emerald-200 transition-colors">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block truncate uppercase">
                          {item.unit}
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-xs leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">
                          {item.name}
                        </h4>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                      <div>
                        <span className="font-black text-slate-900 text-xs block">₹{item.price}</span>
                        {item.mrp > item.price && (
                          <span className="line-through text-slate-400 text-[10px] block">₹{item.mrp}</span>
                        )}
                      </div>

                      {itemQty > 0 ? (
                        <div 
                          className="flex items-center bg-emerald-700 text-white rounded-xl p-0.5 shadow-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => onUpdateCartQuantity(item.id, itemQty - 1)}
                            className="w-5 h-5 flex items-center justify-center font-bold text-xs hover:bg-emerald-800 rounded-lg"
                          >
                            -
                          </button>
                          <span className="px-1.5 font-black text-xs">{itemQty}</span>
                          <button
                            type="button"
                            onClick={() => onUpdateCartQuantity(item.id, itemQty + 1)}
                            className="w-5 h-5 flex items-center justify-center font-bold text-xs hover:bg-emerald-800 rounded-lg"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart(item, 1);
                          }}
                          className="bg-emerald-50 hover:bg-emerald-700 text-emerald-800 hover:text-white font-black text-xs px-2.5 py-1 rounded-xl border border-emerald-300 transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>ADD</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
