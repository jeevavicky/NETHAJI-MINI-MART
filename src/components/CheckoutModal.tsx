import React, { useState, useEffect } from 'react';
import { CartItem, StoreSettings, Product } from '../types';
import { api } from '../services/api';
import { X, CheckCircle2, QrCode, CreditCard, Banknote, Building, Truck, ShieldCheck, MapPin, Phone, User, Mail, Clock, BookmarkCheck, ArrowRight, Sparkles, AlertCircle, Gift } from 'lucide-react';
import { CheckoutRecommendations } from './CheckoutRecommendations';
import { PaymentMethodSelector } from './PaymentMethodSelector';

const GPayLogo: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z" fill="#F8FAFC"/>
    <path d="M16.71 11.23C16.71 10.61 16.65 10.03 16.55 9.47H11.82V11.4H14.57C14.45 12.04 14.08 12.59 13.52 12.96V14.26H15.22C16.21 13.35 16.71 12.41 16.71 11.23Z" fill="#4285F4"/>
    <path d="M11.82 16.23C13.15 16.23 14.26 15.79 15.06 15.06L13.52 13.76C13.09 14.05 12.52 14.23 11.82 14.23C10.53 14.23 9.44 13.36 9.05 12.19H7.29V13.55C8.08 15.13 9.8 16.23 11.82 16.23Z" fill="#34A853"/>
    <path d="M9.05 12.19C8.95 11.89 8.89 11.57 8.89 11.23C8.89 10.89 8.95 10.57 9.05 10.27V8.91H7.29C6.96 9.57 6.77 10.38 6.77 11.23C6.77 12.08 6.96 12.89 7.29 13.55L9.05 12.19Z" fill="#FBBC05"/>
    <path d="M11.82 8.23C12.54 8.23 13.19 8.48 13.7 8.96L15.12 7.54C14.26 6.74 13.14 6.23 11.82 6.23C9.8 6.23 8.08 7.33 7.29 8.91L9.05 10.27C9.44 9.1 10.53 8.23 11.82 8.23Z" fill="#EA4335"/>
  </svg>
);

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  settings: StoreSettings;
  products?: Product[];
  appliedCoupon: { code: string; discount: number } | null;
  onPlaceOrder: (orderPayload: any) => Promise<any>;
  onAddToCart?: (product: Product) => void;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  currentUserPhone?: string | null;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  settings,
  products = [],
  appliedCoupon,
  onPlaceOrder,
  onAddToCart,
  onUpdateQuantity,
  currentUserPhone
}) => {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [area, setArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pincode, setPincode] = useState("");
  const [deliverySlot, setDeliverySlot] = useState("Express 30-Minute Delivery");
  const [paymentMethod, setPaymentMethod] = useState<'GPay' | 'COD' | 'UPI' | 'Card' | 'NetBanking'>('GPay');
  const [autoRedirectGPay, setAutoRedirectGPay] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addressAutoLoaded, setAddressAutoLoaded] = useState(false);
  const [saveAsDefault, setSaveAsDefault] = useState(true);
  const [oneRupeeEligibility, setOneRupeeEligibility] = useState<{
    eligible: boolean;
    reason?: string;
    pastOrdersCount: number;
    alreadyClaimed: boolean;
  }>({ eligible: true, pastOrdersCount: 0, alreadyClaimed: false });

  // Auto-populate default address for login phone or saved phone
  useEffect(() => {
    if (!isOpen) return;

    const targetPhone = currentUserPhone || localStorage.getItem('nethaji_user_phone') || "";
    const targetName = localStorage.getItem('nethaji_user_name') || "";

    if (targetPhone && !customerPhone) {
      setCustomerPhone(targetPhone);
    }
    if (targetName && !customerName) {
      setCustomerName(targetName);
    }

    const cleanPhone = (targetPhone || customerPhone).replace(/[^0-9]/g, '');
    if (cleanPhone) {
      // Check ₹1 offer eligibility
      api.checkOneRupeeEligibility(cleanPhone).then((res) => {
        setOneRupeeEligibility(res);
      }).catch(() => {});

      const savedData = localStorage.getItem(`nethaji_saved_address_${cleanPhone}`);
      if (savedData) {
        try {
          const addr = JSON.parse(savedData);
          if (addr.streetAddress) setStreetAddress(addr.streetAddress);
          if (addr.area) setArea(addr.area);
          if (addr.landmark) setLandmark(addr.landmark);
          if (addr.pincode) setPincode(addr.pincode);
          if (addr.customerName) setCustomerName(addr.customerName);
          if (addr.customerEmail) setCustomerEmail(addr.customerEmail);
          setAddressAutoLoaded(true);
        } catch (e) {
          console.error("Error parsing saved address", e);
        }
      } else {
        const savedLoc = localStorage.getItem('nethaji_delivery_location');
        if (savedLoc) {
          try {
            const loc = JSON.parse(savedLoc);
            if (loc.pincode) setPincode(loc.pincode);
            if (loc.area) setArea(loc.area);
          } catch (e) {}
        }
      }
    }
  }, [isOpen, currentUserPhone]);

  if (!isOpen) return null;

  // Handle phone number input change & auto lookup address
  const handlePhoneInputChange = (val: string) => {
    setCustomerPhone(val);
    const clean = val.replace(/[^0-9]/g, '');
    if (clean.length >= 10) {
      api.checkOneRupeeEligibility(clean).then((res) => {
        setOneRupeeEligibility(res);
      }).catch(() => {});

      const saved = localStorage.getItem(`nethaji_saved_address_${clean}`);
      if (saved) {
        try {
          const addr = JSON.parse(saved);
          if (addr.streetAddress) setStreetAddress(addr.streetAddress);
          if (addr.area) setArea(addr.area);
          if (addr.landmark) setLandmark(addr.landmark);
          if (addr.pincode) setPincode(addr.pincode);
          if (addr.customerName) setCustomerName(addr.customerName);
          if (addr.customerEmail) setCustomerEmail(addr.customerEmail);
          setAddressAutoLoaded(true);
        } catch (e) {}
      }
    } else {
      setOneRupeeEligibility({ eligible: true, pastOrdersCount: 0, alreadyClaimed: false });
    }
  };

  // Approved Pincodes Check
  const activeApprovedPincodes = settings.approvedPincodes?.filter(p => p.active) || [];
  const trimmedPincode = pincode.trim();
  const matchedApprovedPin = activeApprovedPincodes.find(p => p.pincode.trim() === trimmedPincode);
  const isPincodeEnforced = settings.enforceApprovedPincodes ?? false;
  const isPincodeApproved = !isPincodeEnforced || (trimmedPincode.length >= 6 && Boolean(matchedApprovedPin));

  // ₹1 Offer First-Time Order calculation (1 unit per first-time mobile number only)
  const hasRupeeItemsInCart = cart.some(
    (item) => item.product.price <= 1 || item.product.isOneRupeeZone || item.product.tags?.includes('one_rupee_zone')
  );

  let oneRupeeUsedInCalc = false;
  const itemCalculations = cart.map((item) => {
    const isRupeeItem = item.product.price <= 1 || item.product.isOneRupeeZone || item.product.tags?.includes('one_rupee_zone');
    if (isRupeeItem) {
      if (oneRupeeEligibility.eligible && !oneRupeeUsedInCalc) {
        oneRupeeUsedInCalc = true;
        const oneRupeeCount = 1;
        const regularCount = Math.max(0, item.quantity - 1);
        const regularPrice = item.product.mrp > 1 ? item.product.mrp : 20;
        const total = (1 * oneRupeeCount) + (regularPrice * regularCount);
        return { item, total, unitPrice: item.quantity === 1 ? 1 : Math.round(total / item.quantity), isOneRupeeApplied: true };
      } else {
        const regularPrice = item.product.mrp > 1 ? item.product.mrp : 20;
        const total = regularPrice * item.quantity;
        return { item, total, unitPrice: regularPrice, isOneRupeeApplied: false };
      }
    }
    return { item, total: item.product.price * item.quantity, unitPrice: item.product.price, isOneRupeeApplied: false };
  });

  const subtotal = itemCalculations.reduce((sum, c) => sum + c.total, 0);
  const activeGstRate = settings.gstPercentage ?? 5;
  const gstAmount = Math.round((subtotal * activeGstRate) / 100);
  const deliveryFee = matchedApprovedPin?.customDeliveryFee !== undefined
    ? matchedApprovedPin.customDeliveryFee
    : (subtotal >= settings.freeDeliveryThreshold ? 0 : settings.defaultDeliveryFee);
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const grandTotal = Math.max(0, subtotal + gstAmount + deliveryFee - discount);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !streetAddress) return;

    if (!isPincodeApproved) {
      alert(`Delivery unavailable: PIN code "${pincode}" is not on our store's approved delivery list.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
      if (saveAsDefault && cleanPhone) {
        const savedAddressObj = {
          customerName,
          customerPhone,
          customerEmail,
          streetAddress,
          area,
          landmark,
          pincode,
          city: settings.city
        };
        localStorage.setItem(`nethaji_saved_address_${cleanPhone}`, JSON.stringify(savedAddressObj));
        localStorage.setItem('nethaji_user_phone', customerPhone);
        localStorage.setItem('nethaji_user_name', customerName);
        localStorage.setItem('nethaji_delivery_location', JSON.stringify({
          city: settings.city,
          pincode: pincode,
          area: area || streetAddress
        }));
      }

      const payload = {
        customerName,
        customerPhone,
        customerEmail,
        address: {
          street: streetAddress,
          area,
          city: settings.city,
          pincode,
          landmark
        },
        items: cart.map(i => ({
          productId: i.product.id,
          quantity: i.quantity
        })),
        paymentMethod,
        deliverySlot,
        couponCode: appliedCoupon?.code
      };

      // Automatic Redirect to Google Pay App if GPay is selected
      if (paymentMethod === 'GPay' && autoRedirectGPay) {
        const activeUpiId = settings.paymentUpiId || 'nethaji.mart@upi';
        const activeMerchantName = settings.paymentMerchantName || 'Nethaji Mini Mart & Fresh';
        const orderRefNum = Date.now().toString().slice(-6);
        const upiLink = `upi://pay?pa=${encodeURIComponent(activeUpiId)}&pn=${encodeURIComponent(activeMerchantName)}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent(`Order #${orderRefNum} Payment`)}`;
        const gpayTezUrl = `tez://upi/pay?pa=${encodeURIComponent(activeUpiId)}&pn=${encodeURIComponent(activeMerchantName)}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent(`Order #${orderRefNum} Payment`)}`;
        
        try {
          window.location.href = gpayTezUrl;
          setTimeout(() => {
            window.location.href = upiLink;
          }, 350);
        } catch (err) {
          window.location.href = upiLink;
        }
      }

      await onPlaceOrder(payload);
    } catch (err) {
      console.error("Order placement error", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-4 bg-emerald-800 text-white flex items-center justify-between sticky top-0 z-20 border-b border-emerald-700">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h2 className="font-extrabold text-base">Nethaji Mini Mart – Secure Checkout</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-emerald-200 hover:text-white hover:bg-emerald-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmitOrder} className="p-6 space-y-6">
          
          {/* Customer Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-700" />
                <span>1. Customer Delivery Information</span>
              </h3>
              {addressAutoLoaded && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <BookmarkCheck className="w-3 h-3 text-emerald-600" />
                  Default Address Loaded
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Mobile Number (For Order Status & Saved Address) *</label>
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={(e) => handlePhoneInputChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  placeholder="Enter 10-digit login mobile number"
                />
              </div>
            </div>

            {/* ₹1 Offer Realtime Verification Banner */}
            {hasRupeeItemsInCart && customerPhone.replace(/\D/g, '').length >= 10 && (
              <div className={`p-3 rounded-xl border text-xs font-semibold flex items-start gap-2.5 animate-in fade-in duration-200 ${
                oneRupeeEligibility.eligible
                  ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                  : "bg-amber-50 border-amber-300 text-amber-900"
              }`}>
                {oneRupeeEligibility.eligible ? (
                  <>
                    <Gift className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-emerald-800">🎉 1st-Time Welcome Deal Applied:</span>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Your mobile number qualifies for the ₹1 introductory deal (1 unit per mobile number).
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-amber-800">ℹ️ ₹1 Offer Policy (1st Order Only):</span>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Mobile number <strong>{customerPhone}</strong> has already placed previous orders. The ₹1 welcome offer is exclusively valid on 1st-time orders (1 time per mobile number). This item is charged at regular supermarket price.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Door No., Street Address *</label>
              <input
                type="text"
                required
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Area / Locality</label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Landmark</label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center justify-between">
                  <span>PIN Code *</span>
                  {isPincodeApproved ? (
                    <span className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Approved
                    </span>
                  ) : (
                    <span className="text-[10px] text-rose-700 font-extrabold flex items-center gap-1 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200">
                      <X className="w-3 h-3 text-rose-600" />
                      Not Approved
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  className={`w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:outline-none ${
                    isPincodeApproved
                      ? "border-emerald-500 focus:ring-emerald-600"
                      : "border-rose-400 focus:ring-rose-500 bg-rose-50/50"
                  }`}
                />
              </div>
            </div>

            {/* Pincode Unapproved Alert Banner */}
            {!isPincodeApproved && (
              <div className="bg-rose-50 border border-rose-300 text-rose-900 text-xs rounded-xl p-3.5 space-y-2 font-medium">
                <div className="flex items-center gap-2 font-black text-rose-800 text-xs">
                  <X className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Delivery Unavailable to PIN Code {pincode || 'entered'}</span>
                </div>
                <p className="text-[11px] text-rose-700 font-medium">
                  Store Pincode Delivery Enforcement is active. Please choose one of our verified express delivery pincodes:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {activeApprovedPincodes.length > 0 ? (
                    activeApprovedPincodes.map(p => (
                      <button
                        key={p.id || p.pincode}
                        type="button"
                        onClick={() => setPincode(p.pincode)}
                        className="bg-white hover:bg-rose-100 border border-rose-300 text-rose-950 font-extrabold text-[10px] px-2.5 py-1 rounded-lg cursor-pointer transition-colors shadow-2xs"
                      >
                        {p.pincode} ({p.city}{p.area ? ` - ${p.area}` : ''})
                      </button>
                    ))
                  ) : (
                    <span className="text-[10px] text-rose-600 italic">No approved pincodes currently active in settings.</span>
                  )}
                </div>
              </div>
            )}

            {/* Save address as default toggle */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 font-bold text-emerald-950 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAsDefault}
                  onChange={(e) => setSaveAsDefault(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span>Save this address as default for mobile ({customerPhone || 'login number'})</span>
              </label>
              <span className="text-[10px] text-emerald-700 font-extrabold uppercase bg-emerald-100 px-2 py-0.5 rounded-md">
                Auto-Saved
              </span>
            </div>

            {!isPincodeApproved && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3 flex flex-col gap-1">
                <div className="flex items-center gap-2 font-extrabold">
                  <X className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Delivery Unapproved for PIN code {pincode}</span>
                </div>
                <p className="text-[11px] text-rose-700 font-medium pl-6">
                  Our store currently delivers to approved locations: {activeApprovedPincodes.slice(0, 5).map(p => p.pincode).join(', ')}...
                </p>
              </div>
            )}
          </div>

          {/* Delivery Slot Picker */}
          <div className="space-y-2 border-t border-slate-200 pt-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-700" />
              <span>2. Choose Delivery Slot</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                "Express 30-Minute Delivery",
                "Today Evening (5:00 PM - 7:00 PM)",
                "Tomorrow Morning (8:00 AM - 10:00 AM)"
              ].map((slot) => (
                <button
                  type="button"
                  key={slot}
                  onClick={() => setDeliverySlot(slot)}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                    deliverySlot === slot
                      ? "border-emerald-700 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600/30"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <p>{slot}</p>
                </button>
              ))}
            </div>
          </div>          {/* Payment Method Selector */}
          <PaymentMethodSelector
            paymentMethod={paymentMethod}
            onChangePaymentMethod={setPaymentMethod}
            grandTotal={grandTotal}
            settings={settings}
            autoRedirectGPay={autoRedirectGPay}
            onChangeAutoRedirectGPay={setAutoRedirectGPay}
          />

          {/* Zepto Style Checkout Offer & Related Product Add-ons */}
          {products.length > 0 && (
            <div className="border-t border-slate-200 pt-4">
              <CheckoutRecommendations
                products={products}
                cart={cart}
                onAddToCart={onAddToCart || (() => {})}
                onUpdateQuantity={onUpdateQuantity}
                variant="checkout"
              />
            </div>
          )}

          {/* Order Summary Box */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Final Price Breakdown</h4>
            <div className="text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Items Subtotal ({cart.length} items)</span>
                <span className="font-bold text-slate-900">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span className="font-bold text-slate-900">₹{gstAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                {deliveryFee === 0 ? (
                  <span className="font-bold text-emerald-700">FREE</span>
                ) : (
                  <span className="font-bold text-slate-900">₹{deliveryFee}</span>
                )}
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-amber-800 font-bold">
                  <span>Coupon Discount ({appliedCoupon.code})</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-2">
                <span>Grand Total Amount</span>
                <span className="text-base text-emerald-800">₹{grandTotal}</span>
              </div>
            </div>
          </div>

          {/* Submit Order Button */}
          <button
            type="submit"
            disabled={isSubmitting || !isPincodeApproved}
            className={`w-full font-black text-sm py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60 cursor-pointer ${
              !isPincodeApproved
                ? "bg-slate-300 text-slate-600 cursor-not-allowed border border-slate-300"
                : paymentMethod === "GPay"
                ? "bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-blue-500/20"
                : "bg-amber-500 hover:bg-amber-400 text-slate-950"
            }`}
          >
            {isSubmitting ? (
              <span>Placing Your Grocery Order...</span>
            ) : !isPincodeApproved ? (
              <span>❌ Delivery Not Approved for PIN {pincode}</span>
            ) : paymentMethod === "GPay" ? (
              <>
                <GPayLogo className="w-5 h-5 bg-white rounded-full p-0.5" />
                <span>⚡ Confirm & Auto-Redirect to Google Pay (₹{grandTotal})</span>
              </>
            ) : paymentMethod === "COD" ? (
              <>
                <Banknote className="w-5 h-5" />
                <span>📦 Confirm Cash on Delivery Order (₹{grandTotal})</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirm & Place Order (₹{grandTotal})</span>
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
};
