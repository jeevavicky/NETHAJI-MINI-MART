import React, { useState } from 'react';
import { StoreSettings } from '../types';
import { ShoppingBag, PhoneCall, Mail, MapPin, Clock, ShieldCheck, Heart, Bell, BellRing, Check, Sparkles, Lightbulb } from 'lucide-react';

interface FooterProps {
  settings: StoreSettings;
  onSelectCategory: (categoryName: string) => void;
  onOpenOrders: () => void;
  onOpenRiderPortal?: () => void;
  onOpenSuggestion?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  onSelectCategory,
  onOpenOrders,
  onOpenRiderPortal,
  onOpenSuggestion
}) => {
  const [isSubscribed, setIsSubscribed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('push_notifications_enabled') === 'true';
    } catch {
      return false;
    }
  });
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  const handleToggleNotifications = () => {
    const nextState = !isSubscribed;
    setIsSubscribed(nextState);
    try {
      localStorage.setItem('push_notifications_enabled', String(nextState));
    } catch {
      // Ignore storage errors
    }

    if (nextState) {
      setNotificationToast("🔔 Push notifications enabled! You'll receive live order updates & ₹1 flash deal alerts.");
    } else {
      setNotificationToast("🔕 Notifications disabled.");
    }

    setTimeout(() => {
      setNotificationToast(null);
    }, 4000);
  };

  return (
    <footer className="bg-slate-900 text-slate-300 pt-10 pb-6 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs">
        
        {/* Col 1: Store Branding */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {settings.logoUrl ? (
              <img 
                src={settings.logoUrl} 
                alt={settings.storeName || "Store Logo"} 
                className="w-9 h-9 object-contain rounded-xl bg-[#0F5328] p-0.5 border border-emerald-600/50 shrink-0"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-700 to-emerald-600 flex items-center justify-center text-white shrink-0">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-1 font-extrabold text-lg text-white uppercase">
                <span>{settings.storeName || "NETHAJI MINI MART"}</span>
              </div>
            </div>
          </div>

          <p className="text-slate-400 leading-relaxed text-[11px]">
            {settings.tagline}. Sourced fresh daily with 30-minute local home delivery.
          </p>

          <div className="pt-1 flex items-center gap-2 text-emerald-400 font-bold text-[11px]">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>GSTIN: {settings.gstin}</span>
          </div>
        </div>

        {/* Col 2: Quick Links */}
        <div className="space-y-2">
          <h4 className="font-extrabold text-white text-xs uppercase tracking-wider mb-2">Popular Categories</h4>
          <ul className="space-y-1.5 text-slate-400 font-medium">
            <li><button onClick={() => onSelectCategory("Grocery & Staples")} className="hover:text-amber-400 cursor-pointer">Grocery & Cooking Oils</button></li>
            <li><button onClick={() => onSelectCategory("Fresh Vegetables")} className="hover:text-amber-400 cursor-pointer">Fresh Vegetables & Fruits</button></li>
            <li><button onClick={() => onSelectCategory("Dairy & Breakfast")} className="hover:text-amber-400 cursor-pointer">Milk, Paneer & Butter</button></li>
            <li><button onClick={() => onSelectCategory("Snacks & Munchies")} className="hover:text-amber-400 cursor-pointer">Biscuits, Chips & Chocolates</button></li>
            <li><button onClick={() => onSelectCategory("Household & Cleaning")} className="hover:text-amber-400 cursor-pointer">Detergents & Cleaners</button></li>
          </ul>
        </div>

        {/* Col 3: Customer Care & Delivery Partners */}
        <div className="space-y-2">
          <h4 className="font-extrabold text-white text-xs uppercase tracking-wider mb-2">Customer Care & Fleet</h4>
          <ul className="space-y-1.5 text-slate-400 font-medium">
            {onOpenSuggestion && (
              <li>
                <button
                  onClick={onOpenSuggestion}
                  className="text-amber-400 hover:text-amber-300 font-extrabold cursor-pointer flex items-center gap-1.5"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Request Product or Suggest Feature</span>
                </button>
              </li>
            )}
            <li><button onClick={onOpenOrders} className="hover:text-amber-400 cursor-pointer">Track Order Status</button></li>
            {onOpenRiderPortal && (
              <li>
                <button 
                  onClick={onOpenRiderPortal} 
                  className="text-amber-400 hover:text-amber-300 font-extrabold cursor-pointer flex items-center gap-1"
                >
                  <span>🛵 Delivery Partner / Rider Portal</span>
                </button>
              </li>
            )}
            <li><span className="hover:text-amber-400 cursor-pointer">Free Delivery Terms (Above ₹{settings.freeDeliveryThreshold})</span></li>
            <li><span className="hover:text-amber-400 cursor-pointer">Return & Refund Policy</span></li>
            <li><span className="hover:text-amber-400 cursor-pointer">Privacy & Terms</span></li>
          </ul>
        </div>

        {/* Col 4: Store Location, Contact & Push Notification Subscription */}
        <div className="space-y-2.5">
          <h4 className="font-extrabold text-white text-xs uppercase tracking-wider mb-2">Visit Store & Alerts</h4>
          
          <div className="flex items-start gap-2 text-slate-300">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{settings.address}, {settings.city} - {settings.pincode}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <PhoneCall className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{settings.phone}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <Mail className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{settings.email}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-[11px] bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Hours: {settings.storeOpeningHours}</span>
          </div>

          {/* Push Notification Toggle Box */}
          <div className="pt-2">
            <div className={`p-3 rounded-xl border transition-all ${
              isSubscribed 
                ? 'bg-emerald-950/60 border-emerald-700/70 text-emerald-200' 
                : 'bg-slate-800/90 border-slate-700/80 text-slate-300'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {isSubscribed ? (
                    <BellRing className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
                  ) : (
                    <Bell className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <div className="truncate">
                    <p className="font-extrabold text-xs text-white leading-tight flex items-center gap-1">
                      <span>Order & Deal Alerts</span>
                      {isSubscribed && <Sparkles className="w-3 h-3 text-amber-400" />}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {isSubscribed ? "Push notifications active" : "Get ₹1 deal & order updates"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleNotifications}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    isSubscribed ? 'bg-emerald-500' : 'bg-slate-600'
                  }`}
                  role="switch"
                  aria-checked={isSubscribed}
                  title="Toggle Push Notifications"
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isSubscribed ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {notificationToast && (
                <div className="mt-2 text-[11px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800/80 p-1.5 rounded-lg text-center animate-in fade-in slide-in-from-top-1">
                  {notificationToast}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 pt-6 border-t border-slate-800 text-center text-slate-400 text-[11px] flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© {new Date().getFullYear()} {settings.storeName}. All rights reserved.</p>
        <div className="flex items-center gap-1.5 font-bold text-slate-300">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">POWERED BY</span>
          <span className="text-white font-black tracking-wider bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">VICKY</span>
        </div>
        <p className="flex items-center justify-center gap-1 text-slate-500">
          Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for local grocery shoppers
        </p>
      </div>
    </footer>
  );
};

