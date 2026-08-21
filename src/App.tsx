import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Product, Category, CartItem, Order, StoreSettings, AdminUser, BannerSlide, QuadCardGroup, SliderConfig, HomepageSectionKey, DeliveryLocation } from './types';
import { api } from './services/api';

import { Header } from './components/Header';
import { CategoryGrid } from './components/CategoryGrid';
import { ProductCard } from './components/ProductCard';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { UserOrdersModal } from './components/UserOrdersModal';
import { WishlistModal } from './components/WishlistModal';
import { DeliveryLocationModal } from './components/DeliveryLocationModal';
import { DeliveryRiderPortal } from './components/DeliveryRiderPortal';
import { BottomNav } from './components/BottomNav';
import { MyProfileModal } from './components/MyProfileModal';
import { TrendingProductsModal } from './components/TrendingProductsModal';
import { AllCategoriesModal } from './components/AllCategoriesModal';
import { OneRupeeOfferModal } from './components/OneRupeeOfferModal';
import { CategoryPageModal } from './components/CategoryPageModal';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { CustomerSuggestionModal } from './components/CustomerSuggestionModal';
import { FloatingCartBar } from './components/FloatingCartBar';
import { PromoPeekSlider } from './components/PromoPeekSlider';
import { CartAnimationProvider } from './components/CartAnimationProvider';
import { SplashScreen } from './components/SplashScreen';
import { Footer } from './components/Footer';
import { AdminDashboard } from './admin/AdminDashboard';
import { AdminAuthModal } from './admin/AdminAuthModal';

import { 
  Filter, ArrowUpDown, Sparkles, ShoppingBag, CheckCircle2, 
  SearchX, RefreshCw, Store 
} from 'lucide-react';

export default function App() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem('nethaji_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [adminAuthModalOpen, setAdminAuthModalOpen] = useState(false);

  // Store States
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<BannerSlide[]>([]);
  const [quadGroups, setQuadGroups] = useState<QuadCardGroup[]>([]);
  const [sliderConfig, setSliderConfig] = useState<SliderConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  // Customer Interactivity States
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "price-low" | "price-high" | "rating" | "discount">("featured");
  const [filterOfferOnly, setFilterOfferOnly] = useState(false);

  // Cart & Wishlist with localStorage Persistence
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('nethaji_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const savedWish = localStorage.getItem('nethaji_wishlist');
      return savedWish ? JSON.parse(savedWish) : [];
    } catch {
      return [];
    }
  });
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; description?: string } | null>(null);

  // Sync Cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nethaji_cart', JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to persist cart to localStorage", e);
    }
  }, [cart]);

  // Sync Wishlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nethaji_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.error("Failed to persist wishlist to localStorage", e);
    }
  }, [wishlist]);

  // Delivery Location
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocation>(() => {
    try {
      const saved = localStorage.getItem('nethaji_delivery_location');
      return saved ? JSON.parse(saved) : { city: 'Lakkinayakanpatti', pincode: '635654', area: 'Lakkinayakanpatti Area' };
    } catch {
      return { city: 'Lakkinayakanpatti', pincode: '635654', area: 'Lakkinayakanpatti Area' };
    }
  });
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  const handleUpdateDeliveryLocation = (loc: DeliveryLocation) => {
    setDeliveryLocation(loc);
    try {
      localStorage.setItem('nethaji_delivery_location', JSON.stringify(loc));
    } catch (e) {
      console.error(e);
    }
    showToast(`Delivery location updated to ${loc.city} ${loc.pincode}`);
  };

  // Modals Visibility
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [wishlistModalOpen, setWishlistModalOpen] = useState(false);
  const [userOrdersModalOpen, setUserOrdersModalOpen] = useState(false);
  const [riderPortalOpen, setRiderPortalOpen] = useState(false);
  const [myProfileModalOpen, setMyProfileModalOpen] = useState(false);
  const [trendingModalOpen, setTrendingModalOpen] = useState(false);
  const [allCategoriesModalOpen, setAllCategoriesModalOpen] = useState(false);
  const [oneRupeeOfferModalOpen, setOneRupeeOfferModalOpen] = useState(false);
  const [categoryPageModalOpen, setCategoryPageModalOpen] = useState(false);
  const [customerAuthModalOpen, setCustomerAuthModalOpen] = useState(false);
  const [customerAuthBanner, setCustomerAuthBanner] = useState<string | null>(null);
  const [suggestionModalOpen, setSuggestionModalOpen] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<'home' | 'deals' | 'mylist' | 'info' | 'orders'>('home');

  const handleSelectCategoryAndOpenPage = (catName: string) => {
    setActiveCategory(catName);
    setCategoryPageModalOpen(true);
  };

  const handleBottomTabNavigate = (tab: 'home' | 'deals' | 'mylist' | 'info' | 'orders') => {
    setActiveBottomTab(tab);
    if (tab === 'home') {
      setActiveCategory("All");
      setSearchQuery("");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'deals') {
      setOneRupeeOfferModalOpen(true);
    } else if (tab === 'mylist') {
      setWishlistModalOpen(true);
    } else if (tab === 'info') {
      setSuggestionModalOpen(true);
    } else if (tab === 'orders') {
      if (currentUserPhone) handleSearchOrdersByPhone(currentUserPhone);
      setUserOrdersModalOpen(true);
    }
  };

  // User session
  const [currentUserPhone, setCurrentUserPhone] = useState<string | null>(() => {
    return localStorage.getItem('nethaji_user_phone') || null;
  });
  const [userOrders, setUserOrders] = useState<Order[]>([]);

  const handleOpenCustomerAuth = (bannerMsg?: string) => {
    setCustomerAuthBanner(bannerMsg || null);
    setCustomerAuthModalOpen(true);
  };

  const handleCustomerLoginSuccess = (phone: string, name?: string) => {
    setCurrentUserPhone(phone);
    localStorage.setItem('nethaji_user_phone', phone);
    if (name) localStorage.setItem('nethaji_user_name', name);
    showToast(`Logged in successfully! Welcome, ${phone}`);
    handleSearchOrdersByPhone(phone);
    setCustomerAuthModalOpen(false);

    // If cart has items, open checkout modal automatically!
    if (cart.length > 0) {
      setCheckoutModalOpen(true);
    }
  };

  const handleCustomerLogout = () => {
    setCurrentUserPhone(null);
    localStorage.removeItem('nethaji_user_phone');
    showToast("Logged out successfully. You are now browsing as guest.");
  };

  const handleProceedToCheckout = () => {
    if (!currentUserPhone) {
      setCartDrawerOpen(false);
      handleOpenCustomerAuth("Login or Signup required to proceed with order checkout!");
      return;
    }
    setCartDrawerOpen(false);
    setCheckoutModalOpen(true);
  };

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const fetchStoreData = async () => {
    setLoading(true);
    try {
      const [stData, catData, prodData, bannerData, quadData, sliderData] = await Promise.all([
        api.getSettings(),
        api.getCategories(),
        api.getProducts(),
        api.getBanners().catch(() => []),
        api.getQuadGroups().catch(() => []),
        api.getSliderConfig().catch(() => null)
      ]);
      setSettings(stData);
      setCategories(catData);
      setProducts(prodData);
      setBanners(bannerData);
      setQuadGroups(quadData);
      if (sliderData) setSliderConfig(sliderData);
    } catch (e) {
      console.error("Error fetching store data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreData();
  }, []);

  // Real-time Global EventSource SSE connection to sync Delivery Partner updates
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/orders/live-stream');
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ORDER_UPDATED' && data.order) {
            const updatedOrder: Order = data.order;
            
            // If current customer phone matches, refresh customer orders
            if (currentUserPhone && updatedOrder.customerPhone?.includes(currentUserPhone.replace(/[^0-9]/g, ''))) {
              handleSearchOrdersByPhone(currentUserPhone);
            }

            // If active order confirmation modal is open, update confirmed order
            setConfirmedOrder((prev) => (prev && prev.id === updatedOrder.id ? updatedOrder : prev));

            // Show real-time popup toast for status milestones
            if (updatedOrder.orderStatus === 'Out for Delivery') {
              showToast(`🚚 Order #${updatedOrder.orderNumber} is OUT FOR DELIVERY by ${updatedOrder.assignedRiderName || 'Nethaji Express Rider'}!`);
            } else if (updatedOrder.orderStatus === 'Delivered') {
              showToast(`🎉 Order #${updatedOrder.orderNumber} has been DELIVERED! Thank you for shopping.`);
            } else if (updatedOrder.orderStatus === 'Packed') {
              showToast(`📦 Order #${updatedOrder.orderNumber} is Packed & ready for pickup!`);
            }
          }
        } catch (e) {
          console.error("Error handling SSE live event", e);
        }
      };
    } catch (e) {
      console.warn("Global SSE listener setup warning", e);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [currentUserPhone]);

  // Cart Actions
  const isOneRupeeOffer = (p: Product) => Boolean(p?.isOneRupeeZone) || (typeof p?.price === 'number' && p.price <= 1 && p.price > 0);

  const handleAddToCart = (product: Product, quantity = 1) => {
    if (!product || !product.id) return;

    if (product.stock <= 0) {
      showToast(`⚠️ ${product.name} is OUT OF STOCK!`);
      return;
    }

    const qtyToAdd = typeof quantity === 'number' && quantity > 0 ? quantity : 1;
    const isOfferItem = isOneRupeeOffer(product);

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => String(item.product.id) === String(product.id)
      );

      // Special ₹1 Offer logic
      if (isOfferItem) {
        const existingOfferItem = prevCart.find(
          (item) => isOneRupeeOffer(item.product) && item.quantity > 0
        );

        if (existingOfferItem && String(existingOfferItem.product.id) !== String(product.id)) {
          showToast(`⚠️ Limit 1 item at ₹1 per order! Complete this order to claim on your next order.`);
          return prevCart;
        }

        if (existingIndex >= 0) {
          if (prevCart[existingIndex].quantity >= 1) {
            showToast(`⚠️ Max 1 unit for ₹1 offer items per order!`);
            return prevCart;
          }
        }

        showToast(`Added ${product.name} to your cart`);
        if (existingIndex >= 0) {
          return prevCart.map((item, idx) =>
            idx === existingIndex ? { ...item, quantity: 1 } : item
          );
        } else {
          return [...prevCart, { product, quantity: 1 }];
        }
      }

      // Standard Product logic
      const maxStock = typeof product.stock === 'number' && product.stock > 0 ? product.stock : 0;
      if (maxStock <= 0) {
        showToast(`⚠️ ${product.name} is OUT OF STOCK!`);
        return prevCart;
      }

      if (existingIndex >= 0) {
        const currentQty = prevCart[existingIndex].quantity;

        if (currentQty >= maxStock) {
          showToast(`⚠️ Stock limit of ${maxStock} units reached for ${product.name}`);
          return prevCart;
        }

        const newQty = Math.min(currentQty + qtyToAdd, maxStock);
        showToast(`Added ${product.name} to your cart (${newQty} in cart)`);

        return prevCart.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: newQty } : item
        );
      } else {
        const initialQty = Math.min(qtyToAdd, maxStock);
        showToast(`Added ${product.name} to your cart`);
        return [...prevCart, { product, quantity: initialQty }];
      }
    });
  };

  const handleUpdateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCart((prevCart) => {
      const itemToUpdate = prevCart.find((item) => String(item.product.id) === String(productId));
      if (itemToUpdate) {
        if (isOneRupeeOffer(itemToUpdate.product) && newQuantity > 1) {
          showToast(`⚠️ Max 1 unit for ₹1 offer items per order!`);
          return prevCart;
        }
        const maxStock = typeof itemToUpdate.product.stock === 'number' ? itemToUpdate.product.stock : 99;
        if (newQuantity > maxStock) {
          showToast(`⚠️ Stock limit of ${maxStock} units reached for ${itemToUpdate.product.name}`);
          return prevCart.map((item) =>
            String(item.product.id) === String(productId) ? { ...item, quantity: maxStock } : item
          );
        }
      }
      return prevCart.map((item) =>
        String(item.product.id) === String(productId) ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => String(item.product.id) !== String(productId)));
  };

  const handleClearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  // Wishlist Actions
  const handleToggleWishlist = (product: Product) => {
    const isPresent = wishlist.some((p) => p.id === product.id);
    if (isPresent) {
      setWishlist((prev) => prev.filter((p) => p.id !== product.id));
      showToast(`Removed from Wishlist`);
    } else {
      setWishlist((prev) => [...prev, product]);
      showToast(`Saved ${product.name} to Wishlist`);
    }
  };

  // Coupon
  const handleApplyCoupon = async (code: string) => {
    const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const result = await api.validateCoupon(code, subtotal);
    if (result.valid) {
      setAppliedCoupon({
        code: result.code!,
        discount: result.discount!,
        description: result.description
      });
    }
    return result;
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
  };

  // Place Order
  const handlePlaceOrder = async (orderPayload: any) => {
    const newOrder = await api.placeOrder(orderPayload);
    setConfirmedOrder(newOrder);
    setCheckoutModalOpen(false);
    setCartDrawerOpen(false);
    handleClearCart();
    // Refresh products list to update stocks
    fetchStoreData();
  };

  // Search User Orders
  const handleSearchOrdersByPhone = async (phone: string) => {
    const ordersList = await api.getOrders({ phone });
    setUserOrders(ordersList);
  };

  // Pagination for main Catalog section
  const [visibleCatalogCount, setVisibleCatalogCount] = useState(36);

  useEffect(() => {
    setVisibleCatalogCount(36);
  }, [activeCategory, searchQuery, sortBy, filterOfferOnly]);

  const cartMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of cart) {
      map.set(String(item.product.id), item.quantity);
    }
    return map;
  }, [cart]);

  const wishlistSet = useMemo(() => {
    const set = new Set<string>();
    for (const item of wishlist) {
      set.add(String(item.id));
    }
    return set;
  }, [wishlist]);

  // Filter & Sort Products (Memoized)
  const filteredProducts = useMemo(() => {
    const isAll = activeCategory === "All";
    const activeCatLower = isAll ? "" : activeCategory.toLowerCase().trim();
    const queryLower = searchQuery.toLowerCase().trim();

    return products.filter((p) => {
      if (filterOfferOnly && !p.isOffer && p.mrp <= p.price) return false;

      if (!isAll) {
        const productCatLower = (p.category || '').toLowerCase().trim();
        const matchesCat =
          productCatLower === activeCatLower ||
          productCatLower.includes(activeCatLower) ||
          activeCatLower.includes(productCatLower) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().trim() === activeCatLower || t.toLowerCase().trim().includes(activeCatLower) || activeCatLower.includes(t.toLowerCase().trim())));

        if (!matchesCat) return false;
      }

      if (queryLower) {
        const nameLower = p.name.toLowerCase();
        const brandLower = p.brand.toLowerCase();
        const catLower = p.category.toLowerCase();
        if (
          !nameLower.includes(queryLower) &&
          !brandLower.includes(queryLower) &&
          !catLower.includes(queryLower) &&
          !p.description.toLowerCase().includes(queryLower)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [products, activeCategory, searchQuery, filterOfferOnly]);

  // Sort (Memoized)
  const sortedProducts = useMemo(() => {
    if (sortBy === "price-low") return [...filteredProducts].sort((a, b) => a.price - b.price);
    if (sortBy === "price-high") return [...filteredProducts].sort((a, b) => b.price - a.price);
    if (sortBy === "rating") return [...filteredProducts].sort((a, b) => b.rating - a.rating);
    if (sortBy === "discount") {
      return [...filteredProducts].sort((a, b) => {
        const discA = (a.mrp - a.price) / (a.mrp || 1);
        const discB = (b.mrp - b.price) / (b.mrp || 1);
        return discB - discA;
      });
    }
    return filteredProducts;
  }, [filteredProducts, sortBy]);

  const displayedCatalogProducts = useMemo(() => {
    return sortedProducts.slice(0, visibleCatalogCount);
  }, [sortedProducts, visibleCatalogCount]);

  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleAdminAuthSuccess = (user: AdminUser) => {
    setAdminUser(user);
    try {
      localStorage.setItem('nethaji_admin_user', JSON.stringify(user));
    } catch (e) {
      console.warn('Failed to save admin user in localStorage', e);
    }
    setAdminAuthModalOpen(false);
    setIsAdminMode(true);
    showToast(`Logged in as Admin: ${user.name}`);
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    try {
      localStorage.removeItem('nethaji_admin_user');
    } catch (e) {
      console.warn('Failed to remove admin user from localStorage', e);
    }
    setIsAdminMode(false);
    showToast('Admin session logged out');
  };

  const handleToggleAdminMode = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
    } else {
      if (adminUser) {
        setIsAdminMode(true);
      } else {
        setAdminAuthModalOpen(true);
      }
    }
  };

  // Render Admin Dashboard if Admin Mode active
  if (isAdminMode) {
    return (
      <>
        <AdminDashboard
          currentAdmin={adminUser}
          onLogoutAdmin={handleAdminLogout}
          onExitAdmin={() => setIsAdminMode(false)}
          onRefreshCustomerStore={fetchStoreData}
        />
        <AdminAuthModal
          isOpen={adminAuthModalOpen}
          onClose={() => setAdminAuthModalOpen(false)}
          onSuccess={handleAdminAuthSuccess}
        />
      </>
    );
  }

  if ((loading || !settings) && showSplash) {
    return (
      <SplashScreen 
        onComplete={() => setShowSplash(false)} 
        storeName={settings?.storeName || "NETHAJI superm@rt"} 
      />
    );
  }

  if (loading || !settings) {
    return (
      <SplashScreen 
        onComplete={() => {}} 
        storeName="NETHAJI superm@rt" 
      />
    );
  }

  return (
    <CartAnimationProvider>
      {/* Opening Splash Screen Overlay */}
      {showSplash && (
        <SplashScreen 
          onComplete={() => setShowSplash(false)} 
          storeName={settings?.storeName || "NETHAJI superm@rt"} 
        />
      )}
      <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col antialiased selection:bg-amber-400 selection:text-slate-950">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Store Header */}
      <Header
        settings={settings}
        categories={categories}
        products={products}
        cartCount={cartCount}
        cartSubtotal={cartSubtotal}
        wishlistCount={wishlist.length}
        cartItems={cart}
        onUpdateCartQuantity={handleUpdateCartQuantity}
        onAddToCart={handleAddToCart}
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategoryAndOpenPage}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectProduct={(p) => setSelectedProductDetails(p)}
        onOpenCart={() => setCartDrawerOpen(true)}
        onOpenWishlist={() => setWishlistModalOpen(true)}
        onOpenOrders={() => {
          if (currentUserPhone) handleSearchOrdersByPhone(currentUserPhone);
          setUserOrdersModalOpen(true);
        }}
        onOpenAuth={() => {
          if (currentUserPhone) {
            setMyProfileModalOpen(true);
          } else {
            handleOpenCustomerAuth();
          }
        }}
        isAdminMode={isAdminMode}
        onToggleAdminMode={handleToggleAdminMode}
        currentUserPhone={currentUserPhone}
        deliveryLocation={deliveryLocation}
        onOpenLocationModal={() => setLocationModalOpen(true)}
        onOpenRiderPortal={() => setRiderPortalOpen(true)}
        onOpenOneRupeeOffers={() => setOneRupeeOfferModalOpen(true)}
        onOpenSuggestion={() => setSuggestionModalOpen(true)}
      />

      {/* Main Store Layout */}
      <main className="flex-1 pb-20">
        {/* Promotional Video-Inspired Carousel Banner Slider */}
        <PromoPeekSlider
          slides={banners}
          categories={categories}
          onSelectCategory={handleSelectCategoryAndOpenPage}
          onExploreOffers={() => setFilterOfferOnly(true)}
          onOpenTrending={() => setTrendingModalOpen(true)}
          onOpenOneRupeeZone={() => setOneRupeeOfferModalOpen(true)}
          isAdmin={!!adminUser}
          onOpenAdminEditor={() => setIsAdminMode(true)}
        />

        {/* Category-First Showcase matching reference layout */}
        <CategoryGrid
          key="sec-categories"
          categories={categories}
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategoryAndOpenPage}
          onOpenAllCategories={() => setAllCategoriesModalOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={(q) => setSearchQuery(q)}
        />

        {/* Product Catalog Section */}
        <section key="sec-catalog" className="py-8" id="product-catalog-section">
                    <div className="max-w-7xl mx-auto px-4 space-y-6">
                      
                      {/* Catalog Filter Controls Bar */}
                      <motion.div
                        key={`catalog-filter-${activeCategory}-${searchQuery}`}
                        initial={{ opacity: 0.3, y: -2 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4"
                      >
                        
                        <div>
                          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <span>{activeCategory === "All" ? "All Grocery Products" : activeCategory}</span>
                            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              {sortedProducts.length} items
                            </span>
                          </h2>
                          {searchQuery && (
                            <p className="text-xs text-slate-500">
                              Showing results for: "<strong className="text-slate-800">{searchQuery}</strong>"
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                          
                          {/* Offer Toggle */}
                          <button
                            id="filter-offers-toggle-btn"
                            onClick={() => setFilterOfferOnly(!filterOfferOnly)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                              filterOfferOnly
                                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-2xs"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Offers & Savings Only</span>
                          </button>

                          {/* Sort Dropdown */}
                          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 text-xs font-bold text-slate-700">
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-slate-400 font-semibold hidden md:inline">Sort:</span>
                            <select
                              id="sort-by-select"
                              value={sortBy}
                              onChange={(e) => setSortBy(e.target.value as any)}
                              className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer"
                            >
                              <option value="featured">Featured First</option>
                              <option value="price-low">Price: Low to High</option>
                              <option value="price-high">Price: High to Low</option>
                              <option value="rating">Highest Rated</option>
                              <option value="discount">Biggest Savings</option>
                            </select>
                          </div>

                        </div>

                      </motion.div>

                      {/* Products Grid */}
                      {sortedProducts.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-2xs">
                          <SearchX className="w-12 h-12 text-slate-300 mx-auto" />
                          <h3 className="font-extrabold text-slate-800 text-base">
                            {products.length === 0 ? "Store Catalog is Empty" : "No grocery items found"}
                          </h3>
                          <p className="text-xs text-slate-500 max-w-md mx-auto">
                            {products.length === 0
                              ? "All previous products have been removed. You can now add your own products and categories via the Admin Dashboard."
                              : "We couldn't find any items matching your filters. Try clearing your search or switching categories."}
                          </p>
                          {products.length === 0 ? (
                            <button
                              onClick={() => {
                                if (adminUser) {
                                  setIsAdminMode(true);
                                } else {
                                  setAdminAuthModalOpen(true);
                                }
                              }}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
                            >
                              <Store className="w-4 h-4" />
                              <span>Open Admin Panel to Add Products</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setActiveCategory("All");
                                setSearchQuery("");
                                setFilterOfferOnly(false);
                              }}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                            >
                              Reset All Filters
                            </button>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
                            {displayedCatalogProducts.map((product) => {
                              const qty = cartMap.get(String(product.id)) || 0;
                              const isWishlisted = wishlistSet.has(String(product.id));
                              return (
                                <ProductCard
                                  key={product.id}
                                  product={product}
                                  cartQuantity={qty}
                                  isWishlisted={isWishlisted}
                                  onAddToCart={handleAddToCart}
                                  onUpdateCartQuantity={handleUpdateCartQuantity}
                                  onToggleWishlist={handleToggleWishlist}
                                  onQuickView={setSelectedProductDetails}
                                />
                              );
                            })}
                          </div>

                          {/* Progressive Load More Products */}
                          {sortedProducts.length > displayedCatalogProducts.length && (
                            <div className="flex flex-col items-center justify-center pt-6 pb-2 gap-2">
                              <p className="text-xs font-semibold text-slate-500">
                                Showing {displayedCatalogProducts.length} of {sortedProducts.length} items
                              </p>
                              <button
                                onClick={() => setVisibleCatalogCount((prev) => prev + 36)}
                                className="bg-white hover:bg-emerald-50 text-emerald-800 border-2 border-emerald-600 font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Load More Products ({sortedProducts.length - displayedCatalogProducts.length} remaining)</span>
                              </button>
                            </div>
                          )}
                        </>
                      )}

                    </div>
        </section>
      </main>

      {/* Store Footer */}
      <Footer
        settings={settings}
        onSelectCategory={setActiveCategory}
        onOpenOrders={() => setUserOrdersModalOpen(true)}
        onOpenRiderPortal={() => setRiderPortalOpen(true)}
        onOpenSuggestion={() => setSuggestionModalOpen(true)}
      />

      {/* Floating Bottom Cart Bar (Theme Matching Screenshot) */}
      {cart.reduce((sum, item) => sum + item.quantity, 0) > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-xl mx-auto flex items-center justify-between gap-2.5 pointer-events-auto animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Dark Free Delivery Progress Pill */}
          <div className="bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-2xl flex items-center gap-2.5 shadow-2xl border border-slate-800 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 text-xs shrink-0 border border-slate-700">
              🚚
            </div>
            <div className="truncate">
              {(() => {
                const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
                const threshold = settings?.freeDeliveryThreshold || 299;
                const remaining = Math.max(0, threshold - subtotal);
                return remaining > 0 ? (
                  <>
                    <p className="font-extrabold text-[11px] text-white leading-tight truncate">
                      Unlock free delivery
                    </p>
                    <p className="text-[10px] text-amber-400 font-bold truncate">
                      Shop for ₹{remaining} more
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-extrabold text-[11px] text-emerald-400 leading-tight truncate">
                      🎉 Free Delivery Unlocked!
                    </p>
                    <p className="text-[10px] text-slate-300 truncate">
                      Enjoy 0 delivery fee on this order
                    </p>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Bright Pink Cart Button */}
          <button
            onClick={() => setCartDrawerOpen(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-2xl border border-rose-500 cursor-pointer active:scale-95 transition-all shrink-0 hover:scale-[1.02]"
          >
            <div className="w-7 h-7 rounded-lg bg-white/20 overflow-hidden flex items-center justify-center border border-white/20">
              {cart[0]?.product?.image ? (
                <img src={cart[0].product.image} alt="Cart item" className="w-full h-full object-cover" />
              ) : (
                <ShoppingBag className="w-4 h-4 text-white" />
              )}
            </div>
            <span>
              Cart • {cart.reduce((sum, item) => sum + item.quantity, 0)} {cart.reduce((sum, item) => sum + item.quantity, 0) === 1 ? 'item' : 'items'}
            </span>
          </button>

        </div>
      )}

      {/* Modals & Slide-overs */}
      
      {/* Product Details Modal */}
      <ProductDetailsModal
        product={selectedProductDetails}
        allProducts={products}
        onSelectProduct={(p) => setSelectedProductDetails(p)}
        onClose={() => setSelectedProductDetails(null)}
        cartQuantity={
          selectedProductDetails
            ? cart.find((i) => i.product.id === selectedProductDetails.id)?.quantity || 0
            : 0
        }
        cartItemsMap={cart.reduce((acc, item) => ({ ...acc, [item.product.id]: item.quantity }), {})}
        isWishlisted={
          selectedProductDetails
            ? wishlist.some((p) => p.id === selectedProductDetails.id)
            : false
        }
        onAddToCart={handleAddToCart}
        onUpdateCartQuantity={handleUpdateCartQuantity}
        onToggleWishlist={handleToggleWishlist}
        onTrackShare={(productId) => {
          setProducts(prev => prev.map(p => p.id === productId ? { ...p, shareCount: (p.shareCount || 0) + 1 } : p));
        }}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        cart={cart}
        settings={settings}
        products={products}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        appliedCoupon={appliedCoupon}
        onApplyCoupon={handleApplyCoupon}
        onRemoveCoupon={handleRemoveCoupon}
        onProceedToCheckout={handleProceedToCheckout}
        onAddToCart={handleAddToCart}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        cart={cart}
        settings={settings}
        products={products}
        appliedCoupon={appliedCoupon}
        onPlaceOrder={handlePlaceOrder}
        onAddToCart={handleAddToCart}
        onUpdateQuantity={handleUpdateCartQuantity}
        currentUserPhone={currentUserPhone}
      />

      {/* Customer Login / Signup / Forgot Password Auth Modal (Zepto Style) */}
      <CustomerAuthModal
        isOpen={customerAuthModalOpen}
        onClose={() => setCustomerAuthModalOpen(false)}
        onLoginSuccess={handleCustomerLoginSuccess}
        messageBanner={customerAuthBanner}
      />

      {/* Order Confirmation Modal */}
      <OrderConfirmationModal
        order={confirmedOrder}
        settings={settings}
        onClose={() => setConfirmedOrder(null)}
        onViewOrderTracker={() => {
          if (confirmedOrder) {
            setCurrentUserPhone(confirmedOrder.customerPhone);
            handleSearchOrdersByPhone(confirmedOrder.customerPhone);
          }
          setConfirmedOrder(null);
          setUserOrdersModalOpen(true);
        }}
      />

      {/* Wishlist Modal */}
      <WishlistModal
        isOpen={wishlistModalOpen}
        onClose={() => setWishlistModalOpen(false)}
        wishlist={wishlist}
        onRemoveFromWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
      />

      {/* User Orders Tracker Modal */}
      <UserOrdersModal
        isOpen={userOrdersModalOpen}
        onClose={() => setUserOrdersModalOpen(false)}
        orders={userOrders}
        onSearchOrdersByPhone={handleSearchOrdersByPhone}
        currentUserPhone={currentUserPhone}
        setCurrentUserPhone={setCurrentUserPhone}
        onRefreshOrders={() => {
          if (currentUserPhone) handleSearchOrdersByPhone(currentUserPhone);
          fetchStoreData();
        }}
      />

      {/* Admin Authentication Login & Register Modal */}
      <AdminAuthModal
        isOpen={adminAuthModalOpen}
        onClose={() => setAdminAuthModalOpen(false)}
        onSuccess={handleAdminAuthSuccess}
      />

      {/* Delivery Location Selector & Auto GPS Modal */}
      <DeliveryLocationModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        currentLocation={deliveryLocation}
        onSelectLocation={handleUpdateDeliveryLocation}
        settings={settings}
      />

      {/* Delivery Partner / Rider Fleet Portal Modal */}
      <DeliveryRiderPortal
        isOpen={riderPortalOpen}
        onClose={() => setRiderPortalOpen(false)}
        settings={settings!}
        onOrderUpdated={fetchStoreData}
      />

      {/* My Profile Page Modal */}
      <MyProfileModal
        isOpen={myProfileModalOpen}
        onClose={() => setMyProfileModalOpen(false)}
        currentUserPhone={currentUserPhone}
        deliveryLocation={deliveryLocation}
        onOpenLocationModal={() => setLocationModalOpen(true)}
        onOpenOrders={() => setUserOrdersModalOpen(true)}
        onOpenWishlist={() => setWishlistModalOpen(true)}
        wishlistCount={wishlist.length}
        ordersCount={userOrders.length}
        isAdminMode={isAdminMode}
        onToggleAdminMode={() => {
          setIsAdminMode(!isAdminMode);
          if (!isAdminMode) showToast("Switched to Store Admin Mode");
        }}
        onOpenAdminAuth={() => setAdminAuthModalOpen(true)}
        onLogout={handleCustomerLogout}
        onOpenAuth={() => handleOpenCustomerAuth()}
      />

      {/* Dedicated Trending Products View Modal */}
      <TrendingProductsModal
        isOpen={trendingModalOpen}
        onClose={() => setTrendingModalOpen(false)}
        products={products}
        featuredProductIds={sliderConfig?.featuredProductIds}
        cart={cart.reduce((acc, item) => ({ ...acc, [item.product.id]: item.quantity }), {})}
        wishlistIds={wishlist.map((p) => p.id)}
        onAddToCart={handleAddToCart}
        onUpdateCartQuantity={handleUpdateCartQuantity}
        onToggleWishlist={handleToggleWishlist}
        onQuickView={(p) => setSelectedProductDetails(p)}
      />

      {/* Dedicated All Categories View Modal (Matches Screenshot) */}
      <AllCategoriesModal
        isOpen={allCategoriesModalOpen}
        onClose={() => setAllCategoriesModalOpen(false)}
        categories={categories}
        products={products}
        onSelectCategory={(catName) => {
          setAllCategoriesModalOpen(false);
          handleSelectCategoryAndOpenPage(catName);
        }}
        onOpenWishlist={() => setWishlistModalOpen(true)}
        wishlistCount={wishlist.length}
      />

      {/* Dedicated Category Products Page View */}
      <CategoryPageModal
        isOpen={categoryPageModalOpen}
        onClose={() => setCategoryPageModalOpen(false)}
        categoryName={activeCategory}
        categories={categories}
        products={products}
        cart={cart.reduce((acc, item) => ({ ...acc, [item.product.id]: item.quantity }), {})}
        wishlistIds={wishlist.map((p) => p.id)}
        onSelectCategory={(catName) => {
          setActiveCategory(catName);
        }}
        onAddToCart={handleAddToCart}
        onUpdateCartQuantity={handleUpdateCartQuantity}
        onToggleWishlist={handleToggleWishlist}
        onQuickView={(p) => setSelectedProductDetails(p)}
        onOpenCart={() => setCartDrawerOpen(true)}
        onOpenWishlist={() => setWishlistModalOpen(true)}
        freeDeliveryThreshold={settings?.freeDeliveryThreshold || 299}
      />

      {/* Dedicated 1 Rs Offer Store View Modal (Matches User Screenshot) */}
      <OneRupeeOfferModal
        isOpen={oneRupeeOfferModalOpen}
        onClose={() => setOneRupeeOfferModalOpen(false)}
        products={products}
        cart={cart.reduce((acc, item) => ({ ...acc, [item.product.id]: item.quantity }), {})}
        wishlistIds={wishlist.map((p) => p.id)}
        onAddToCart={handleAddToCart}
        onUpdateCartQuantity={handleUpdateCartQuantity}
        onToggleWishlist={handleToggleWishlist}
        onQuickView={(p) => setSelectedProductDetails(p)}
        onOpenCart={() => setCartDrawerOpen(true)}
        onOpenWishlist={() => setWishlistModalOpen(true)}
        freeDeliveryThreshold={settings?.freeDeliveryThreshold || 299}
        currentUserPhone={currentUserPhone}
        userOrdersCount={userOrders.length}
      />

      {/* Customer Suggestion & Product/Feature Request Modal */}
      <CustomerSuggestionModal
        isOpen={suggestionModalOpen}
        onClose={() => setSuggestionModalOpen(false)}
        categories={categories}
        settings={settings}
        currentUserPhone={currentUserPhone}
        onSelectCategory={handleSelectCategoryAndOpenPage}
      />

      {/* Floating Free Delivery Unlock & Cart Preview Bar (Matches User Screenshot) */}
      <FloatingCartBar
        cart={cart}
        freeDeliveryThreshold={settings?.freeDeliveryThreshold || 299}
        onOpenCart={() => setCartDrawerOpen(true)}
      />

      {/* Persistent Bottom Column Navigation Bar (Matches Screenshot) */}
      <BottomNav
        activeTab={activeBottomTab}
        onNavigateTab={handleBottomTabNavigate}
        wishlistCount={wishlist.length}
        ordersCount={userOrders.length}
        storePhone={settings?.phone || '9842112345'}
        onOpenBuyAgain={() => {
          if (currentUserPhone) handleSearchOrdersByPhone(currentUserPhone);
          setUserOrdersModalOpen(true);
        }}
      />

    </div>
    </CartAnimationProvider>
  );
}
