import React, { useState } from 'react';
import { Home, Tag, Heart, Info, ClipboardList, Menu, X, Phone, Package } from 'lucide-react';

export type BottomNavTab = 'home' | 'deals' | 'mylist' | 'info' | 'orders';

interface BottomNavProps {
  activeTab: BottomNavTab;
  onNavigateTab: (tab: BottomNavTab) => void;
  wishlistCount?: number;
  ordersCount?: number;
  storePhone?: string;
  onOpenBuyAgain?: () => void;
  onOpenWhatsApp?: () => void;
  onCallStore?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onNavigateTab,
  wishlistCount = 0,
  ordersCount = 0,
  storePhone = '9842112345',
  onOpenBuyAgain,
  onOpenWhatsApp,
  onCallStore
}) => {
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

  const cleanPhone = storePhone.replace(/[^0-9]/g, '');

  const handleWhatsappClick = () => {
    setIsFabMenuOpen(false);
    if (onOpenWhatsApp) {
      onOpenWhatsApp();
    } else {
      const whatsappUrl = `https://wa.me/91${cleanPhone || '9842112345'}?text=${encodeURIComponent('Hello Vadamalai Supermarket, I would like to place an order / inquire about products.')}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleBuyAgainClick = () => {
    setIsFabMenuOpen(false);
    if (onOpenBuyAgain) {
      onOpenBuyAgain();
    } else {
      onNavigateTab('orders');
    }
  };

  const handleCallClick = () => {
    setIsFabMenuOpen(false);
    if (onCallStore) {
      onCallStore();
    } else {
      window.location.href = `tel:+91${cleanPhone || '9842112345'}`;
    }
  };

  return (
    <>
      {/* Backdrop when FAB Menu is open */}
      {isFabMenuOpen && (
        <div
          id="fab-menu-backdrop"
          onClick={() => setIsFabMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px] transition-opacity animate-fade-in"
        />
      )}

      {/* Floating Action Menu matching the exact 3-link stack in the screenshot */}
      <div className="fixed bottom-16 right-4 sm:right-6 z-50 flex flex-col items-center gap-3 select-none">
        
        {/* Expanded 3-Link Stack (Whatsapp, Buy Again, Call) */}
        {isFabMenuOpen && (
          <div className="flex flex-col items-center gap-3 mb-1 animate-in fade-in slide-in-from-bottom-5 duration-200">
            
            {/* 1. Whatsapp Link */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                id="fab-whatsapp-btn"
                onClick={handleWhatsappClick}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white shadow-xl hover:shadow-2xl border border-slate-100 flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 cursor-pointer group"
                title="Chat on WhatsApp"
                aria-label="Whatsapp"
              >
                {/* Official WhatsApp Logo SVG */}
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-5.805 1.554zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                </div>
              </button>
              <span className="text-xs font-black text-slate-900 mt-1 tracking-tight drop-shadow-xs">
                Whatsapp
              </span>
            </div>

            {/* 2. Buy Again Link */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                id="fab-buy-again-btn"
                onClick={handleBuyAgainClick}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white shadow-xl hover:shadow-2xl border border-slate-100 flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 cursor-pointer group"
                title="View past orders and buy again"
                aria-label="Buy Again"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-rose-50 flex items-center justify-center text-[#f8526a] group-hover:scale-110 transition-transform">
                  <Package className="w-6 h-6 stroke-[2] text-[#f8526a]" />
                </div>
              </button>
              <span className="text-xs font-black text-slate-900 mt-1 tracking-tight drop-shadow-xs">
                Buy Again
              </span>
            </div>

            {/* 3. Call Link */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                id="fab-call-btn"
                onClick={handleCallClick}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white shadow-xl hover:shadow-2xl border border-slate-100 flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 cursor-pointer group"
                title="Call Supermarket"
                aria-label="Call"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-rose-50 flex items-center justify-center text-[#f8526a] group-hover:scale-110 transition-transform">
                  <Phone className="w-5 h-5 fill-[#f8526a] text-[#f8526a]" />
                </div>
              </button>
              <span className="text-xs font-black text-slate-900 mt-1 tracking-tight drop-shadow-xs">
                Call
              </span>
            </div>

          </div>
        )}

        {/* Floating Action Button (FAB) matching the pink/coral round button */}
        <button
          type="button"
          id="fab-main-toggle-btn"
          onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
          className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#f8526a] hover:bg-[#eb3d56] text-white shadow-2xl flex items-center justify-center transition-all transform active:scale-90 hover:scale-105 cursor-pointer border-2 border-white/60"
          title="Quick Actions Menu"
          aria-label="Quick Actions Menu"
        >
          {isFabMenuOpen ? (
            <X className="w-6 h-6 stroke-[2.8] transition-transform duration-200 rotate-90" />
          ) : (
            <Menu className="w-6 h-6 stroke-[2.8]" />
          )}
        </button>
      </div>

      {/* Main White Bottom Navigation Bar matching the reference screenshot */}
      <nav
        id="store-bottom-navigation-bar"
        aria-label="Main navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 transition-all"
      >
        <div className="max-w-md mx-auto flex items-center justify-around">
          
          {/* 1. Home Tab */}
          <button
            type="button"
            onClick={() => onNavigateTab('home')}
            className="flex flex-col items-center justify-center py-1 px-2 min-w-[56px] group cursor-pointer transition-transform active:scale-95"
          >
            <div className={`transition-all flex items-center justify-center ${
              activeTab === 'home' 
                ? 'text-slate-900 scale-110' 
                : 'text-slate-400 group-hover:text-slate-700'
            }`}>
              <Home className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className={`text-[11px] font-bold mt-1 tracking-tight transition-colors ${
              activeTab === 'home' ? 'text-slate-900 font-extrabold' : 'text-slate-500 group-hover:text-slate-800'
            }`}>
              Home
            </span>
          </button>

          {/* 2. Deals Tab */}
          <button
            type="button"
            onClick={() => onNavigateTab('deals')}
            className="flex flex-col items-center justify-center py-1 px-2 min-w-[56px] group cursor-pointer transition-transform active:scale-95"
          >
            <div className={`transition-all flex items-center justify-center ${
              activeTab === 'deals' 
                ? 'text-[#f8526a] scale-110' 
                : 'text-slate-400 group-hover:text-slate-700'
            }`}>
              <Tag className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className={`text-[11px] font-bold mt-1 tracking-tight transition-colors ${
              activeTab === 'deals' ? 'text-[#f8526a] font-extrabold' : 'text-slate-500 group-hover:text-slate-800'
            }`}>
              Deals
            </span>
          </button>

          {/* 3. My list Tab */}
          <button
            type="button"
            onClick={() => onNavigateTab('mylist')}
            className="relative flex flex-col items-center justify-center py-1 px-2 min-w-[56px] group cursor-pointer transition-transform active:scale-95"
          >
            <div className={`transition-all flex items-center justify-center ${
              activeTab === 'mylist' 
                ? 'text-rose-600 scale-110' 
                : 'text-slate-400 group-hover:text-slate-700'
            }`}>
              <Heart className="w-5 h-5 stroke-[2.2]" />
            </div>
            {wishlistCount > 0 && (
              <span className="absolute top-0.5 right-2 bg-rose-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
            <span className={`text-[11px] font-bold mt-1 tracking-tight transition-colors ${
              activeTab === 'mylist' ? 'text-rose-600 font-extrabold' : 'text-slate-500 group-hover:text-slate-800'
            }`}>
              My list
            </span>
          </button>

          {/* 4. Info / Contact / Suggest Tab */}
          <button
            type="button"
            onClick={() => onNavigateTab('info')}
            className="flex flex-col items-center justify-center py-1 px-2 min-w-[56px] group cursor-pointer transition-transform active:scale-95"
          >
            <div className={`transition-all flex items-center justify-center ${
              activeTab === 'info' 
                ? 'text-emerald-700 scale-110' 
                : 'text-slate-400 group-hover:text-slate-700'
            }`}>
              <Info className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className={`text-[11px] font-bold mt-1 tracking-tight transition-colors ${
              activeTab === 'info' ? 'text-emerald-700 font-extrabold' : 'text-slate-500 group-hover:text-slate-800'
            }`}>
              Info
            </span>
          </button>

          {/* 5. Orders Tab */}
          <button
            type="button"
            onClick={() => onNavigateTab('orders')}
            className="relative flex flex-col items-center justify-center py-1 px-2 min-w-[56px] group cursor-pointer transition-transform active:scale-95"
          >
            <div className={`transition-all flex items-center justify-center ${
              activeTab === 'orders' 
                ? 'text-amber-600 scale-110' 
                : 'text-slate-400 group-hover:text-slate-700'
            }`}>
              <ClipboardList className="w-5 h-5 stroke-[2.2]" />
            </div>
            {ordersCount > 0 && (
              <span className="absolute top-0.5 right-2 bg-amber-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {ordersCount}
              </span>
            )}
            <span className={`text-[11px] font-bold mt-1 tracking-tight transition-colors ${
              activeTab === 'orders' ? 'text-amber-600 font-extrabold' : 'text-slate-500 group-hover:text-slate-800'
            }`}>
              Orders
            </span>
          </button>

        </div>
      </nav>
    </>
  );
};

