import React, { useState, useEffect } from 'react';
import { 
  Product, Category, Coupon, Order, Customer, StoreSettings, AdminStats, OrderStatus, AdminUser, BannerSlide,
  QuadCardGroup, QuadTile, SliderConfig, SliderBanner, HomepageSectionKey, ApprovedDeliveryPincode, DeliveryRider,
  CustomerSuggestion, SuggestionType, SuggestionStatus
} from '../types';
import { api } from '../services/api';
import { calculateRiderEarningForOrder } from '../utils/riderEarning';
import { fileToBase64 } from '../utils/imageHelper';
import { SuggestionsManagementTab } from './SuggestionsManagementTab';
import { 
  BarChart3, Package, ShoppingCart, Users, Tag, Settings, Plus, Edit, Trash2, 
  Search, TrendingUp, AlertTriangle, Printer, CheckCircle2, XCircle, ArrowUpRight, 
  Store, RefreshCw, Layers, ShieldCheck, DollarSign, Clock, Download, Share2, LogOut, UserCheck, KeyRound,
  Tv, Image as ImageIcon, Sliders, MoveUp, MoveDown, Eye, EyeOff, Sparkles, ChevronRight,
  LayoutGrid, SlidersHorizontal, ArrowRightLeft, Check, MapPin, Building2, Navigation, Compass, AlertCircle,
  Bike, Truck, Phone, Mail, UserPlus, Star, Shield, Send, UserX, CheckCircle, Radio, RotateCcw, CreditCard,
  QrCode, Smartphone, Upload, Camera, FileImage, X, Palette, ShoppingBag, Lightbulb, MessageSquare, ThumbsUp
} from 'lucide-react';

interface AdminDashboardProps {
  currentAdmin?: AdminUser | null;
  onLogoutAdmin?: () => void;
  onExitAdmin: () => void;
  onRefreshCustomerStore: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentAdmin,
  onLogoutAdmin,
  onExitAdmin,
  onRefreshCustomerStore
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'categories' | 'banners' | 'showcase' | 'orders' | 'riders' | 'customers' | 'coupons' | 'pincodes' | 'suggestions' | 'reports' | 'settings' | 'superadmin'>('overview');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<BannerSlide[]>([]);
  const [quadGroups, setQuadGroups] = useState<QuadCardGroup[]>([]);
  const [sliderConfig, setSliderConfig] = useState<SliderConfig>({
    title: "⚡ Flash Deals & Daily Fresh Savings",
    subtitle: "Swipe or slide right-to-left for exclusive discounts on vegetables, staples & dairy",
    badge: "DAILY BESTSELLERS",
    autoPlaySpeedMs: 3500,
    featuredProductIds: [],
    freshOffersTitle: "FRESH",
    freshOffersHighlight: "@ ₹1",
    freshOffersSubtitle: "Handpicked daily essentials"
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [adminList, setAdminList] = useState<AdminUser[]>([]);
  const [riders, setRiders] = useState<DeliveryRider[]>([]);
  const [loading, setLoading] = useState(true);

  // Delivery Riders & Dispatch Dashboard State
  const [ridersSubTab, setRidersSubTab] = useState<'dispatch' | 'fleet' | 'verifications'>('dispatch');
  const [showRiderModal, setShowRiderModal] = useState(false);
  const [editingRider, setEditingRider] = useState<DeliveryRider | null>(null);
  const [riderForm, setRiderForm] = useState<{
    name: string;
    phone: string;
    email: string;
    vehicleType: 'Bike' | 'Scooter' | 'E-Bike' | 'Auto';
    vehicleNumber: string;
    assignedZone: string;
    status: 'Available' | 'On Delivery' | 'Off Duty';
  }>({
    name: '',
    phone: '',
    email: '',
    vehicleType: 'Bike',
    vehicleNumber: '',
    assignedZone: 'Erode Central (638001)',
    status: 'Available'
  });

  const [showAssignRiderModal, setShowAssignRiderModal] = useState(false);
  const [orderToAssignRider, setOrderToAssignRider] = useState<Order | null>(null);
  const [riderSearchQuery, setRiderSearchQuery] = useState('');
  const [riderFilterStatus, setRiderFilterStatus] = useState('All');

  // Showcase Sub-tab
  const [showcaseSubTab, setShowcaseSubTab] = useState<'quads' | 'slider' | 'trending' | 'location'>('quads');

  // Quad Modal & Form State
  const [showQuadModal, setShowQuadModal] = useState(false);
  const [editingQuadGroup, setEditingQuadGroup] = useState<QuadCardGroup | null>(null);
  const [quadForm, setQuadForm] = useState<{
    heading: string;
    subheading: string;
    categoryFilter: string;
    seeMoreText: string;
    tiles: QuadTile[];
  }>({
    heading: 'Fresh Organic Collection',
    subheading: 'Direct from verified farm partners',
    categoryFilter: 'Vegetables',
    seeMoreText: 'See more',
    tiles: [
      { id: 'tile-1', title: 'Fresh Tomatoes & Greens', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&auto=format&fit=crop&q=80', categoryName: 'Vegetables', subtitle: 'From ₹24/kg' },
      { id: 'tile-2', title: 'Farm Fresh Milk & Butter', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&auto=format&fit=crop&q=80', categoryName: 'Dairy & Eggs', subtitle: 'Pasteurized' },
      { id: 'tile-3', title: 'Crispy Snack Packs', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80', categoryName: 'Snacks', subtitle: 'Buy 1 Get 1' },
      { id: 'tile-4', title: 'Aromatic Basmati Rice', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80', categoryName: 'Atta, Rice & Dal', subtitle: '5kg Pack' }
    ]
  });

  // Search & Filter States
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [productTagFilter, setProductTagFilter] = useState<'All' | 'Trending' | 'Offer' | 'Organic'>('All');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');

  // Modals
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showAddCouponModal, setShowAddCouponModal] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);

  // Banner Modal & Form State
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerSlide | null>(null);
  const [previewBannerIndex, setPreviewBannerIndex] = useState(0);
  const [bannerForm, setBannerForm] = useState<{
    title: string;
    subtitle: string;
    badge: string;
    discountBadge: string;
    cta: string;
    bgGradient: string;
    bgColor: string;
    textColor: string;
    buttonBgColor: string;
    buttonTextColor: string;
    shapeStyle: 'organic-leaf' | 'modern-rounded' | 'pill-curve' | 'classic-card';
    targetCategory: string;
    targetAction: 'category' | 'offers' | 'trending' | 'oneRupee' | 'all';
    accentColor: string;
    image: string;
    isActive: boolean;
  }>({
    title: '',
    subtitle: '',
    badge: 'UP TO 50% OFF',
    discountBadge: '50% OFF',
    cta: 'Order Now',
    bgGradient: 'from-[#00A859] via-[#00B042] to-[#16A34A]',
    bgColor: '#00B042',
    textColor: 'text-white',
    buttonBgColor: 'bg-white',
    buttonTextColor: 'text-[#008A38]',
    shapeStyle: 'organic-leaf',
    targetCategory: 'Vegetables & Fruits',
    targetAction: 'category',
    accentColor: 'text-amber-300',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
    isActive: true
  });

  // Right-to-Left Slider Banner Modal & Form State
  const [isSliderBannerModalOpen, setIsSliderBannerModalOpen] = useState(false);
  const [editingSliderBanner, setEditingSliderBanner] = useState<SliderBanner | null>(null);
  const [sliderBannerForm, setSliderBannerForm] = useState<Partial<SliderBanner>>({
    title: '',
    subtitle: '',
    badge: 'FLASH DEAL',
    discountBadge: 'UP TO 50% OFF',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
    categoryName: '',
    buttonText: 'Shop Deal →',
    active: true
  });
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Grocery & Staples',
    brand: 'Nethaji Fresh',
    mrp: 100,
    price: 85,
    unit: '1 kg',
    stock: 25,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80',
    description: 'Fresh quality store item available at Nethaji Mini Mart.',
    isPopular: false,
    isOffer: false,
    isOrganic: false,
    sku: '',
    gstRate: 5,
    hsnCode: '0709'
  });

  const [categoryForm, setCategoryForm] = useState<{
    name: string;
    subtitle?: string;
    description: string;
    image: string;
    iconName: string;
  }>({
    name: '',
    subtitle: '',
    description: '',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
    iconName: 'ShoppingBag'
  });

  const [productImageUploading, setProductImageUploading] = useState(false);
  const [categoryImageUploading, setCategoryImageUploading] = useState(false);

  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'fixed' as 'fixed' | 'percentage',
    discountValue: 50,
    minOrderValue: 299,
    description: 'Store Promotional Coupon',
    expiryDate: '2026-12-31'
  });

  // Security Key States for Super Admin
  const [securityKeyInput, setSecurityKeyInput] = useState('nethajiminimart');
  const [securityKeyLoading, setSecurityKeyLoading] = useState(false);
  const [securityKeySuccess, setSecurityKeySuccess] = useState<string | null>(null);
  const [securityKeyError, setSecurityKeyError] = useState<string | null>(null);

  // Super Admin Payment QR Editing & Mobile OTP States
  const [paymentUpiInput, setPaymentUpiInput] = useState('nethaji.mart@upi');
  const [paymentMerchantInput, setPaymentMerchantInput] = useState('Nethaji Mini Mart & Fresh Grocery');
  const [paymentQrUrlInput, setPaymentQrUrlInput] = useState('https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi%3A%2F%2Fpay%3Fpa%3Dnethaji.mart%40upi%26pn%3DNethaji%2520Mini%2520Mart%26cu%3DINR');
  const [superAdminPhoneInput, setSuperAdminPhoneInput] = useState('9443312345');
  const [qrOtpInput, setQrOtpInput] = useState('');
  const [qrOtpSent, setQrOtpSent] = useState(false);
  const [qrOtpLoading, setQrOtpLoading] = useState(false);
  const [qrOtpSuccessMessage, setQrOtpSuccessMessage] = useState<string | null>(null);
  const [qrOtpErrorMessage, setQrOtpErrorMessage] = useState<string | null>(null);
  const [demoSentOtp, setDemoSentOtp] = useState<string | null>(null);

  const isSuperAdmin = !currentAdmin || currentAdmin.role === 'Super Admin' || currentAdmin.role?.toLowerCase().includes('super');

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, pData, cData, oData, custData, coupData, setts, secKeyRes, adminRes, bannerData, quadData, sliderData, riderData] = await Promise.all([
        api.getAdminStats(),
        api.getProducts(),
        api.getCategories(),
        api.getOrders(),
        api.getCustomers(),
        api.getCoupons(),
        api.getSettings(),
        api.getAdminSecurityKey().catch(() => ({ securityKey: 'nethajiminimart' })),
        api.getAdminUsers().catch(() => ({ admins: [] })),
        api.getBanners().catch(() => []),
        api.getQuadGroups().catch(() => []),
        api.getSliderConfig().catch(() => null),
        api.getRiders().catch(() => [])
      ]);

      setStats(sData);
      setProducts(pData);
      setCategories(cData);
      setOrders(oData);
      setCustomers(custData);
      setCoupons(coupData);
      setSettings(setts);
      setBanners(bannerData);
      setQuadGroups(quadData);
      setRiders(riderData || []);
      if (sliderData) setSliderConfig(sliderData);
      if (secKeyRes?.securityKey) {
        setSecurityKeyInput(secKeyRes.securityKey);
      }
      if (adminRes?.admins) {
        setAdminList(adminRes.admins);
      }

      if (setts) {
        if (setts.paymentUpiId) setPaymentUpiInput(setts.paymentUpiId);
        if (setts.paymentMerchantName) setPaymentMerchantInput(setts.paymentMerchantName);
        if (setts.paymentQrImageUrl) setPaymentQrUrlInput(setts.paymentQrImageUrl);
        if (setts.superAdminPhone) setSuperAdminPhoneInput(setts.superAdminPhone);
      }
    } catch (e) {
      console.error("Admin data loading error", e);
    } finally {
      setLoading(false);
    }
  };

  // Banner Management Handlers
  const handleEditBannerClick = (b: BannerSlide) => {
    setEditingBanner(b);
    setBannerForm({
      title: b.title,
      subtitle: b.subtitle || '',
      badge: b.badge || 'UP TO 50% OFF',
      discountBadge: b.discountBadge || '50% OFF',
      cta: b.cta || 'Order Now',
      bgGradient: b.bgGradient || 'from-[#00A859] via-[#00B042] to-[#16A34A]',
      bgColor: b.bgColor || '#00B042',
      textColor: b.textColor || 'text-white',
      buttonBgColor: b.buttonBgColor || 'bg-white',
      buttonTextColor: b.buttonTextColor || 'text-[#008A38]',
      shapeStyle: b.shapeStyle || 'organic-leaf',
      targetCategory: b.targetCategory || 'Vegetables & Fruits',
      targetAction: b.targetAction || 'category',
      accentColor: b.accentColor || 'text-amber-300',
      image: b.image,
      isActive: b.isActive !== false
    });
    setShowBannerModal(true);
  };

  const handleAddNewBannerClick = () => {
    setEditingBanner(null);
    setBannerForm({
      title: 'Party is where the Pringles & Munchies are',
      subtitle: 'Get your favourite crispy snacks, namkeens, chips & cool beverages delivered in 10 mins.',
      badge: 'PARTY CRUNCH',
      discountBadge: 'BUY 1 GET 1',
      cta: 'Order Now',
      bgGradient: 'from-[#E11D48] via-[#DC2626] to-[#BE123C]',
      bgColor: '#E11D48',
      textColor: 'text-white',
      buttonBgColor: 'bg-white',
      buttonTextColor: 'text-[#E11D48]',
      shapeStyle: 'pill-curve',
      targetCategory: 'Snacks & Munchies',
      targetAction: 'category',
      accentColor: 'text-yellow-300',
      image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800&auto=format&fit=crop&q=80',
      isActive: true
    });
    setShowBannerModal(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBanner) {
      await api.updateBanner(editingBanner.id, bannerForm);
    } else {
      await api.addBanner(bannerForm);
    }
    setShowBannerModal(false);
    setEditingBanner(null);
    loadData();
    onRefreshCustomerStore();
  };

  const handleToggleBannerActive = async (banner: BannerSlide) => {
    const updated = { ...banner, isActive: !banner.isActive };
    await api.updateBanner(banner.id, { isActive: !banner.isActive });
    setBanners(prev => prev.map(b => b.id === banner.id ? updated : b));
    onRefreshCustomerStore();
  };

  const handleMoveBanner = async (index: number, direction: 'up' | 'down') => {
    const newBanners = [...banners];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBanners.length) return;
    const temp = newBanners[index];
    newBanners[index] = newBanners[targetIndex];
    newBanners[targetIndex] = temp;
    setBanners(newBanners);
    await api.updateBanners(newBanners);
    onRefreshCustomerStore();
  };

  const handleDeleteBannerClick = async (id: string) => {
    if (confirm("Are you sure you want to delete this store banner slide?")) {
      await api.deleteBanner(id);
      loadData();
      onRefreshCustomerStore();
    }
  };

  // Quad Showcase Management Handlers
  const handleAddNewQuadGroupClick = () => {
    setEditingQuadGroup(null);
    setQuadForm({
      heading: 'Fresh Vegetables & Fruits | Up to 40% off',
      subheading: 'Direct from organic verified local farms',
      categoryFilter: 'Vegetables',
      seeMoreText: 'See more in Vegetables',
      tiles: [
        { id: `t-${Date.now()}-1`, title: 'Fresh Tomatoes & Peppers', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&auto=format&fit=crop&q=80', categoryName: 'Vegetables', subtitle: 'From ₹24/kg' },
        { id: `t-${Date.now()}-2`, title: 'Leafy Spinach & Greens', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&auto=format&fit=crop&q=80', categoryName: 'Vegetables', subtitle: 'Up to 30% off' },
        { id: `t-${Date.now()}-3`, title: 'Potatoes & Onions', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&auto=format&fit=crop&q=80', categoryName: 'Vegetables', subtitle: 'Daily essentials' },
        { id: `t-${Date.now()}-4`, title: 'Fresh Apples & Berries', image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&auto=format&fit=crop&q=80', categoryName: 'Fruits', subtitle: 'Min 20% off' }
      ]
    });
    setShowQuadModal(true);
  };

  const handleEditQuadGroupClick = (group: QuadCardGroup) => {
    setEditingQuadGroup(group);
    setQuadForm({
      heading: group.heading,
      subheading: group.subheading || '',
      categoryFilter: group.categoryFilter || 'All',
      seeMoreText: group.seeMoreText || 'See more',
      tiles: group.tiles && group.tiles.length === 4 ? group.tiles : [
        { id: 't1', title: 'Tile 1 Item', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&auto=format&fit=crop&q=80', categoryName: 'Vegetables', subtitle: 'Special Deal' },
        { id: 't2', title: 'Tile 2 Item', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&auto=format&fit=crop&q=80', categoryName: 'Vegetables', subtitle: 'Fresh Stock' },
        { id: 't3', title: 'Tile 3 Item', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&auto=format&fit=crop&q=80', categoryName: 'Vegetables', subtitle: 'Best Price' },
        { id: 't4', title: 'Tile 4 Item', image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&auto=format&fit=crop&q=80', categoryName: 'Fruits', subtitle: 'Min 20% off' }
      ]
    });
    setShowQuadModal(true);
  };

  const handleSaveQuadGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingQuadGroup) {
      await api.updateQuadGroup(editingQuadGroup.id, quadForm);
    } else {
      await api.addQuadGroup(quadForm);
    }
    setShowQuadModal(false);
    setEditingQuadGroup(null);
    loadData();
    onRefreshCustomerStore();
  };

  const handleDeleteQuadGroupClick = async (id: string) => {
    if (confirm('Are you sure you want to delete this Quad Category Showcase card?')) {
      await api.deleteQuadGroup(id);
      loadData();
      onRefreshCustomerStore();
    }
  };

  const handleMoveQuadGroup = async (index: number, direction: 'up' | 'down') => {
    const newGroups = [...quadGroups];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newGroups.length) return;
    const temp = newGroups[index];
    newGroups[index] = newGroups[targetIndex];
    newGroups[targetIndex] = temp;
    setQuadGroups(newGroups);
    await api.updateQuadGroups(newGroups);
    onRefreshCustomerStore();
  };

  // Slider Config & Offer Management Handlers
  const handleSaveSliderConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await api.updateSliderConfig(sliderConfig);
    alert('Homepage layout, section locations & offer configuration updated successfully!');
    onRefreshCustomerStore();
  };

  const handleMoveHomepageSection = (index: number, direction: 'up' | 'down') => {
    const defaultOrder: HomepageSectionKey[] = ['promoPeekSlider', 'hero', 'categories', 'freshOffers', 'slider', 'quads', 'catalog'];
    const rawOrder = sliderConfig.sectionOrder && sliderConfig.sectionOrder.length > 0
      ? sliderConfig.sectionOrder
      : defaultOrder;
    const currentOrder = Array.from(new Set([...rawOrder, ...defaultOrder]));

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentOrder.length) return;

    const temp = currentOrder[index];
    currentOrder[index] = currentOrder[targetIndex];
    currentOrder[targetIndex] = temp;

    setSliderConfig(prev => ({ ...prev, sectionOrder: currentOrder }));
  };

  const handleToggleHomepageSectionVisibility = (sectionKey: HomepageSectionKey) => {
    const currentHidden = sliderConfig.hiddenSections || [];
    let updatedHidden: HomepageSectionKey[];
    if (currentHidden.includes(sectionKey)) {
      updatedHidden = currentHidden.filter(k => k !== sectionKey);
    } else {
      updatedHidden = [...currentHidden, sectionKey];
    }
    setSliderConfig(prev => ({ ...prev, hiddenSections: updatedHidden }));
  };

  const handleApplyHomepageLayoutPreset = (presetKey: 'default' | 'promo_top' | 'quads_top' | 'slider_top' | 'categories_top') => {
    let newOrder: HomepageSectionKey[];
    switch (presetKey) {
      case 'promo_top':
        newOrder = ['promoPeekSlider', 'categories', 'freshOffers', 'slider', 'quads', 'catalog', 'hero'];
        break;
      case 'quads_top':
        newOrder = ['promoPeekSlider', 'quads', 'freshOffers', 'slider', 'categories', 'catalog', 'hero'];
        break;
      case 'slider_top':
        newOrder = ['promoPeekSlider', 'freshOffers', 'slider', 'quads', 'categories', 'catalog', 'hero'];
        break;
      case 'categories_top':
        newOrder = ['categories', 'promoPeekSlider', 'freshOffers', 'slider', 'quads', 'catalog', 'hero'];
        break;
      case 'default':
      default:
        newOrder = ['promoPeekSlider', 'hero', 'categories', 'freshOffers', 'slider', 'quads', 'catalog'];
        break;
    }
    setSliderConfig(prev => ({ ...prev, sectionOrder: newOrder }));
  };

  const handleToggleSliderProduct = (productId: string) => {
    const current = sliderConfig.featuredProductIds || [];
    let updated: string[];
    if (current.includes(productId)) {
      updated = current.filter(id => id !== productId);
    } else {
      updated = [...current, productId];
    }
    setSliderConfig(prev => ({ ...prev, featuredProductIds: updated }));
  };

  // Right-to-Left Slider Banner Handlers
  const handleOpenCreateSliderBannerModal = () => {
    setEditingSliderBanner(null);
    setSliderBannerForm({
      title: 'Easy. Creamy. Cheesy!',
      subtitle: 'Delicious processed cheese slices, spreads & triangles for daily snacks',
      badge: 'BEST DEALS',
      discountBadge: 'UP TO 35% OFF',
      image: 'https://images.unsplash.com/photo-1552767059-ce182ead8c1b?w=600&auto=format&fit=crop&q=80',
      categoryName: categories.length > 0 ? categories[0].name : 'Dairy & Breakfast',
      buttonText: 'ORDER NOW',
      bgStyle: 'wood',
      active: true
    });
    setIsSliderBannerModalOpen(true);
  };

  const handleOpenEditSliderBannerModal = (banner: SliderBanner) => {
    setEditingSliderBanner(banner);
    setSliderBannerForm({
      ...banner,
      bgStyle: banner.bgStyle || 'wood',
      buttonText: banner.buttonText || 'ORDER NOW'
    });
    setIsSliderBannerModalOpen(true);
  };

  const handleSaveSliderBannerForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sliderBannerForm.title?.trim() || !sliderBannerForm.image?.trim()) {
      alert('Please enter a Banner Title and Image URL.');
      return;
    }

    const existingBanners = sliderConfig.sliderBanners || [];
    let updatedBanners: SliderBanner[] = [];

    if (editingSliderBanner) {
      updatedBanners = existingBanners.map(b => 
        b.id === editingSliderBanner.id ? ({ ...b, ...sliderBannerForm } as SliderBanner) : b
      );
    } else {
      const newBanner: SliderBanner = {
        id: `sb-${Date.now()}`,
        title: sliderBannerForm.title.trim(),
        subtitle: sliderBannerForm.subtitle?.trim() || '',
        badge: sliderBannerForm.badge?.trim() || 'BEST DEALS',
        discountBadge: sliderBannerForm.discountBadge?.trim() || '',
        image: sliderBannerForm.image.trim(),
        categoryName: sliderBannerForm.categoryName || '',
        buttonText: sliderBannerForm.buttonText?.trim() || 'ORDER NOW',
        bgStyle: sliderBannerForm.bgStyle || 'wood',
        active: sliderBannerForm.active !== false
      };
      updatedBanners = [...existingBanners, newBanner];
    }

    const updatedConfig = { ...sliderConfig, sliderBanners: updatedBanners };
    setSliderConfig(updatedConfig);
    setIsSliderBannerModalOpen(false);
    await api.updateSliderConfig(updatedConfig);
    onRefreshCustomerStore();
  };

  const handleDeleteSliderBanner = async (bannerId: string) => {
    if (confirm('Are you sure you want to delete this Right-to-Left Slider Banner?')) {
      const existing = sliderConfig.sliderBanners || [];
      const updated = existing.filter(b => b.id !== bannerId);
      const updatedConfig = { ...sliderConfig, sliderBanners: updated };
      setSliderConfig(updatedConfig);
      await api.updateSliderConfig(updatedConfig);
      onRefreshCustomerStore();
    }
  };

  const handleToggleSliderBannerActive = async (bannerId: string) => {
    const existing = sliderConfig.sliderBanners || [];
    const updated = existing.map(b => b.id === bannerId ? { ...b, active: !b.active } : b);
    const updatedConfig = { ...sliderConfig, sliderBanners: updated };
    setSliderConfig(updatedConfig);
    await api.updateSliderConfig(updatedConfig);
    onRefreshCustomerStore();
  };

  const handleMoveSliderBanner = async (index: number, direction: 'up' | 'down') => {
    const existing = [...(sliderConfig.sliderBanners || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= existing.length) return;

    const temp = existing[index];
    existing[index] = existing[targetIndex];
    existing[targetIndex] = temp;

    const updatedConfig = { ...sliderConfig, sliderBanners: existing };
    setSliderConfig(updatedConfig);
    await api.updateSliderConfig(updatedConfig);
    onRefreshCustomerStore();
  };

  const handleToggleProductOfferFlag = async (product: Product, field: 'isOffer' | 'isPopular') => {
    const updated = { ...product, [field]: !product[field] };
    await api.updateProduct(product.id, updated);
    setProducts(prev => prev.map(p => p.id === product.id ? updated : p));
    onRefreshCustomerStore();
  };

  const handleResetDefaultBanners = async () => {
    if (confirm("Reset store banners to original demo defaults?")) {
      const { INITIAL_BANNERS } = await import('../data/initialData');
      await api.updateBanners(INITIAL_BANNERS);
      loadData();
      onRefreshCustomerStore();
    }
  };

  const handleUpdateSecurityKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityKeyError(null);
    setSecurityKeySuccess(null);
    if (!securityKeyInput.trim()) {
      setSecurityKeyError("Store Admin Authorization Key cannot be empty.");
      return;
    }
    setSecurityKeyLoading(true);
    try {
      const res = await api.updateAdminSecurityKey(securityKeyInput.trim());
      setSecurityKeySuccess(`Store Admin Authorization Key successfully updated to "${res.securityKey}"`);
    } catch (err: any) {
      setSecurityKeyError(err.message || "Failed to update authorization key.");
    } finally {
      setSecurityKeyLoading(false);
    }
  };

  // Super Admin Payment QR Code & Mobile OTP Handlers
  const handleSendQrOtp = async () => {
    setQrOtpErrorMessage(null);
    setQrOtpSuccessMessage(null);
    if (!superAdminPhoneInput || superAdminPhoneInput.trim().length < 10) {
      setQrOtpErrorMessage("Please enter a valid 10-digit Super Admin mobile number.");
      return;
    }
    setQrOtpLoading(true);
    try {
      const res = await api.adminSendQrOtp(superAdminPhoneInput);
      setQrOtpSent(true);
      if (res.otp) setDemoSentOtp(res.otp);
      setQrOtpSuccessMessage(res.message);
    } catch (err: any) {
      setQrOtpErrorMessage(err.message || "Failed to send OTP to Super Admin mobile number.");
    } finally {
      setQrOtpLoading(false);
    }
  };

  const handleVerifyQrOtpAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setQrOtpErrorMessage(null);
    setQrOtpSuccessMessage(null);

    if (!qrOtpInput || qrOtpInput.trim().length < 4) {
      setQrOtpErrorMessage("Please enter the 6-digit OTP received on your mobile number.");
      return;
    }

    setQrOtpLoading(true);
    try {
      const res = await api.adminVerifyQrOtp({
        phone: superAdminPhoneInput,
        otp: qrOtpInput,
        paymentUpiId: paymentUpiInput,
        paymentMerchantName: paymentMerchantInput,
        paymentQrImageUrl: paymentQrUrlInput,
        superAdminPhone: superAdminPhoneInput
      });

      setSettings(res.settings);
      setQrOtpSuccessMessage(res.message);
      setQrOtpSent(false);
      setQrOtpInput('');
      setDemoSentOtp(null);
      onRefreshCustomerStore();
    } catch (err: any) {
      setQrOtpErrorMessage(err.message || "OTP verification failed. Please check the OTP code and try again.");
    } finally {
      setQrOtpLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      await api.updateProduct(editingProduct.id, productForm);
    } else {
      await api.addProduct(productForm);
    }
    setShowAddProductModal(false);
    setEditingProduct(null);
    loadData();
    onRefreshCustomerStore();
  };

  const handleEditProductClick = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      category: prod.category,
      brand: prod.brand,
      mrp: prod.mrp,
      price: prod.price,
      unit: prod.unit,
      stock: prod.stock,
      image: prod.image,
      description: prod.description,
      isPopular: !!prod.isPopular,
      isOffer: !!prod.isOffer,
      isOrganic: !!prod.isOrganic,
      sku: prod.sku,
      gstRate: prod.gstRate !== undefined ? prod.gstRate : 5,
      hsnCode: prod.hsnCode || ''
    });
    setShowAddProductModal(true);
  };

  const handleDeleteProductClick = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      await api.deleteProduct(id);
      loadData();
      onRefreshCustomerStore();
    }
  };

  const handleClearAllProducts = async () => {
    if (confirm("⚠️ Are you sure you want to delete ALL products from your store? Your catalog will become empty.")) {
      try {
        await api.clearAllProducts();
        await loadData();
        onRefreshCustomerStore();
        alert("All products have been deleted successfully. The store is now empty.");
      } catch (err) {
        console.error("Failed to clear products", err);
        alert("Failed to clear products. Please try again.");
      }
    }
  };

  const handleResetProducts = async () => {
    if (confirm("Restore standard catalog sample products?")) {
      try {
        await api.resetProducts();
        await loadData();
        onRefreshCustomerStore();
        alert("Products restored to default catalog.");
      } catch (err) {
        console.error("Failed to reset products", err);
      }
    }
  };

  const handleProductPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setProductImageUploading(true);
      const base64 = await fileToBase64(file, 800, 800, 0.85);
      setProductForm(prev => ({ ...prev, image: base64 }));
    } catch (err: any) {
      alert(err?.message || "Failed to process photo.");
    } finally {
      setProductImageUploading(false);
      // Reset input value so re-selecting same file triggers change
      e.target.value = '';
    }
  };

  const handleCategoryPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setCategoryImageUploading(true);
      const base64 = await fileToBase64(file, 600, 600, 0.85);
      setCategoryForm(prev => ({ ...prev, image: base64 }));
    } catch (err: any) {
      alert(err?.message || "Failed to process photo.");
    } finally {
      setCategoryImageUploading(false);
      e.target.value = '';
    }
  };

  const handleUpdateStock = async (id: string, newStock: number) => {
    await api.updateStock(id, undefined, newStock);
    loadData();
    onRefreshCustomerStore();
  };

  const handleAddNewCategoryClick = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      subtitle: '',
      description: '',
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
      iconName: 'ShoppingBag'
    });
    setShowAddCategoryModal(true);
  };

  const handleEditCategoryClick = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name,
      subtitle: cat.subtitle || '',
      description: cat.description || '',
      image: cat.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
      iconName: cat.iconName || 'ShoppingBag'
    });
    setShowAddCategoryModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      await api.updateCategory(editingCategory.id, categoryForm);
    } else {
      await api.addCategory(categoryForm);
    }
    setShowAddCategoryModal(false);
    setEditingCategory(null);
    loadData();
    onRefreshCustomerStore();
  };

  const handleDeleteCategoryClick = async (id: string) => {
    if (confirm("Are you sure you want to delete this category? Products in this category will remain available.")) {
      await api.deleteCategory(id);
      loadData();
      onRefreshCustomerStore();
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createCoupon(couponForm);
    setShowAddCouponModal(false);
    loadData();
  };

  // Delivery Rider Management Handlers
  const handleOpenAddRiderModal = () => {
    setEditingRider(null);
    setRiderForm({
      name: '',
      phone: '',
      email: '',
      vehicleType: 'Bike',
      vehicleNumber: '',
      assignedZone: 'Erode Central (638001)',
      status: 'Available'
    });
    setShowRiderModal(true);
  };

  const handleOpenEditRiderModal = (rider: DeliveryRider) => {
    setEditingRider(rider);
    setRiderForm({
      name: rider.name,
      phone: rider.phone,
      email: rider.email || '',
      vehicleType: rider.vehicleType,
      vehicleNumber: rider.vehicleNumber,
      assignedZone: rider.assignedZone,
      status: rider.status
    });
    setShowRiderModal(true);
  };

  const handleSaveRiderModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!riderForm.name.trim() || !riderForm.phone.trim() || !riderForm.vehicleNumber.trim()) {
      alert("Name, phone number, and vehicle registration number are required.");
      return;
    }

    if (editingRider) {
      await api.updateRider(editingRider.id, riderForm);
    } else {
      await api.addRider(riderForm);
    }

    setShowRiderModal(false);
    setEditingRider(null);
    loadData();
  };

  const handleDeleteRiderClick = async (riderId: string) => {
    if (confirm("Are you sure you want to remove this delivery rider from your fleet?")) {
      await api.deleteRider(riderId);
      loadData();
    }
  };

  const handleApproveRider = async (riderId: string, isApproved: boolean, rejectionReason?: string) => {
    try {
      await api.approveRider(riderId, isApproved, rejectionReason);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update rider approval status');
    }
  };

  const handleUpdateRiderDutyStatus = async (riderId: string, status: 'Available' | 'On Delivery' | 'Off Duty') => {
    await api.updateRiderStatus(riderId, status);
    loadData();
  };

  // Order Rider Assignment Handlers
  const handleOpenAssignRiderModal = (order: Order) => {
    setOrderToAssignRider(order);
    setShowAssignRiderModal(true);
  };

  const handleConfirmAssignRider = async (riderId: string, autoUpdateStatus: boolean = true) => {
    if (!orderToAssignRider) return;
    await api.assignRiderToOrder(
      orderToAssignRider.id,
      riderId,
      autoUpdateStatus ? 'Out for Delivery' : undefined
    );
    setShowAssignRiderModal(false);
    setOrderToAssignRider(null);
    loadData();
    onRefreshCustomerStore();
  };

  const handleUnassignRider = async (orderId: string) => {
    if (confirm("Unassign delivery rider from this order?")) {
      await api.unassignRiderFromOrder(orderId);
      loadData();
      onRefreshCustomerStore();
    }
  };

  const handleOrderStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    await api.updateOrderStatus(orderId, newStatus);
    loadData();
    onRefreshCustomerStore();
  };

  const handleUpdateReturnStatus = async (orderId: string, returnStatus: 'Approved' | 'Refunded' | 'Rejected', adminNote?: string) => {
    await api.updateReturnStatus(orderId, returnStatus, adminNote);
    loadData();
    onRefreshCustomerStore();
  };

  // Approved Pincodes & Locations Management State
  const [pincodeSearchTerm, setPincodeSearchTerm] = useState('');
  const [showPincodeModal, setShowPincodeModal] = useState(false);
  const [editingPincode, setEditingPincode] = useState<ApprovedDeliveryPincode | null>(null);
  const [pincodeForm, setPincodeForm] = useState<{
    pincode: string;
    city: string;
    area: string;
    active: boolean;
    estimatedDeliveryTime: string;
    minimumOrderValue: number;
    customDeliveryFee: number;
  }>({
    pincode: '',
    city: '',
    area: '',
    active: true,
    estimatedDeliveryTime: '15-20 Mins Express',
    minimumOrderValue: 0,
    customDeliveryFee: 0
  });

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    await api.updateSettings(settings);
    alert("Store Settings Saved Successfully!");
    loadData();
    onRefreshCustomerStore();
  };

  // Pincode Management Handlers
  const handleToggleEnforcePincode = async () => {
    if (!settings) return;
    const updated = { ...settings, enforceApprovedPincodes: !settings.enforceApprovedPincodes };
    setSettings(updated);
    await api.updateSettings(updated);
    onRefreshCustomerStore();
  };

  const handleTogglePincodeActive = async (pincodeId: string) => {
    if (!settings) return;
    const list = settings.approvedPincodes || [];
    const updatedList = list.map(p => p.id === pincodeId ? { ...p, active: !p.active } : p);
    const updated = { ...settings, approvedPincodes: updatedList };
    setSettings(updated);
    await api.updateSettings(updated);
    onRefreshCustomerStore();
  };

  const handleOpenAddPincodeModal = () => {
    setEditingPincode(null);
    setPincodeForm({
      pincode: '',
      city: '',
      area: '',
      active: true,
      estimatedDeliveryTime: '15-20 Mins Express',
      minimumOrderValue: 0,
      customDeliveryFee: 0
    });
    setShowPincodeModal(true);
  };

  const handleOpenEditPincodeModal = (pin: ApprovedDeliveryPincode) => {
    setEditingPincode(pin);
    setPincodeForm({
      pincode: pin.pincode,
      city: pin.city,
      area: pin.area,
      active: pin.active,
      estimatedDeliveryTime: pin.estimatedDeliveryTime || '15-20 Mins Express',
      minimumOrderValue: pin.minimumOrderValue || 0,
      customDeliveryFee: pin.customDeliveryFee || 0
    });
    setShowPincodeModal(true);
  };

  const handleSavePincodeModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    if (!pincodeForm.pincode.trim() || !pincodeForm.city.trim()) {
      alert("Please enter both valid Pincode and City.");
      return;
    }

    const currentList = settings.approvedPincodes || [];
    let updatedList: ApprovedDeliveryPincode[];

    if (editingPincode) {
      updatedList = currentList.map(p => p.id === editingPincode.id ? {
        ...p,
        pincode: pincodeForm.pincode.trim(),
        city: pincodeForm.city.trim(),
        area: pincodeForm.area.trim(),
        active: pincodeForm.active,
        estimatedDeliveryTime: pincodeForm.estimatedDeliveryTime.trim(),
        minimumOrderValue: Number(pincodeForm.minimumOrderValue),
        customDeliveryFee: Number(pincodeForm.customDeliveryFee)
      } : p);
    } else {
      const newPin: ApprovedDeliveryPincode = {
        id: `pin-${Date.now()}`,
        pincode: pincodeForm.pincode.trim(),
        city: pincodeForm.city.trim(),
        area: pincodeForm.area.trim(),
        active: pincodeForm.active,
        estimatedDeliveryTime: pincodeForm.estimatedDeliveryTime.trim(),
        minimumOrderValue: Number(pincodeForm.minimumOrderValue),
        customDeliveryFee: Number(pincodeForm.customDeliveryFee)
      };
      updatedList = [newPin, ...currentList];
    }

    const updatedSettings = { ...settings, approvedPincodes: updatedList };
    setSettings(updatedSettings);
    await api.updateSettings(updatedSettings);
    setShowPincodeModal(false);
    onRefreshCustomerStore();
  };

  const handleDeletePincode = async (pincodeId: string) => {
    if (!settings) return;
    if (!confirm("Are you sure you want to remove this approved delivery pincode?")) return;
    const currentList = settings.approvedPincodes || [];
    const updatedList = currentList.filter(p => p.id !== pincodeId);
    const updatedSettings = { ...settings, approvedPincodes: updatedList };
    setSettings(updatedSettings);
    await api.updateSettings(updatedSettings);
    onRefreshCustomerStore();
  };

  const handleClearAllPincodes = async () => {
    if (!settings) return;
    if (!confirm("Are you sure you want to remove ALL demo/approved locations from the pincode approval list?")) return;
    const updatedSettings = { ...settings, approvedPincodes: [] };
    setSettings(updatedSettings);
    await api.updateSettings(updatedSettings);
    onRefreshCustomerStore();
  };

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesCat = productCategoryFilter === "All" || p.category === productCategoryFilter;
    const matchesTag = productTagFilter === "All" ||
      (productTagFilter === "Trending" && p.isPopular) ||
      (productTagFilter === "Offer" && p.isOffer) ||
      (productTagFilter === "Organic" && p.isOrganic);
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.brand.toLowerCase().includes(productSearch.toLowerCase());
    return matchesCat && matchesTag && matchesSearch;
  });

  // Filtered Orders
  const filteredOrders = orders.filter(o => {
    if (orderStatusFilter === "All") return true;
    if (orderStatusFilter === "Return Requests") return !!o.returnRequest;
    if (orderStatusFilter === "Return Requested") return o.returnRequest?.status === "Requested";
    if (orderStatusFilter === "Return Approved") return o.returnRequest?.status === "Approved";
    if (orderStatusFilter === "Return Refunded") return o.returnRequest?.status === "Refunded";
    if (orderStatusFilter === "Return Rejected") return o.returnRequest?.status === "Rejected";
    return o.orderStatus === orderStatusFilter;
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      
      {/* Top Admin Navigation Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-lg">
              N
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">Nethaji Mini Mart</span>
                <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30">
                  ADMIN DASHBOARD
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Store Operations & Order Fulfillment</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Logged in Admin Profile Badge */}
            {currentAdmin && (
              <div className="hidden md:flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="font-bold text-white text-[11px] leading-tight">{currentAdmin.name}</p>
                  <p className="text-[9px] text-amber-400 font-medium leading-tight">{currentAdmin.role || "Store Admin"}</p>
                </div>
              </div>
            )}

            <button
              onClick={loadData}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Refresh Dashboard Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {onLogoutAdmin && (
              <button
                onClick={onLogoutAdmin}
                className="bg-rose-900/40 hover:bg-rose-800/60 text-rose-200 hover:text-white border border-rose-700/50 font-bold text-xs px-3 py-2 rounded-xl transition-all flex items-center gap-1.5"
                title="Log Out Admin Session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            )}

            <button
              onClick={onExitAdmin}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <Store className="w-4 h-4 text-amber-400" />
              <span>Back to Customer Store</span>
            </button>
          </div>

        </div>

        {/* Admin Navigation Tabs */}
        <div className="bg-slate-950 px-4 border-t border-slate-800/80 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto flex items-center gap-1 py-1 text-xs font-bold text-slate-400">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'products', label: 'Products', icon: Package },
              { id: 'categories', label: 'Categories', icon: Layers },
              { id: 'banners', label: 'Hero Banners', icon: Tv },
              { id: 'showcase', label: 'Quad & Slider Showcase', icon: LayoutGrid },
              { id: 'orders', label: 'Orders', icon: ShoppingCart },
              { id: 'riders', label: 'Delivery & Riders', icon: Bike },
              { id: 'customers', label: 'Customers', icon: Users },
              { id: 'suggestions', label: 'Customer Requests', icon: Lightbulb },
              { id: 'coupons', label: 'Coupons', icon: Tag },
              { id: 'pincodes', label: 'Pincode Approval', icon: MapPin },
              { id: 'reports', label: 'Reports', icon: TrendingUp },
              { id: 'settings', label: 'Store Settings', icon: Settings },
              ...(isSuperAdmin ? [{ id: 'superadmin', label: 'Super Admin', icon: KeyRound }] : [])
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-colors shrink-0 ${
                    isActive
                      ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                      : "hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full space-y-6">

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>Today's Sales</span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-black text-slate-900">₹{stats?.todaySales || 0}</p>
                <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> Updated live
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>Monthly Revenue</span>
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-2xl font-black text-slate-900">₹{stats?.monthlyRevenue || 0}</p>
                <p className="text-[10px] text-slate-500 font-semibold">Overall Store Volume</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>Total Orders</span>
                  <ShoppingCart className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-2xl font-black text-slate-900">{stats?.totalOrdersCount || 0}</p>
                <p className="text-[10px] text-amber-700 font-bold">{stats?.pendingOrdersCount || 0} Pending dispatch</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>Low Stock Alert</span>
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                </div>
                <p className="text-2xl font-black text-slate-900">{stats?.lowStockCount || 0}</p>
                <p className="text-[10px] text-rose-600 font-bold">Products ≤ 10 stock</p>
              </div>

            </div>

            {/* Sales Graph & Top Products */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Sales SVG Bar Chart */}
              <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-slate-900">Daily Sales Trend (Last 7 Days)</h3>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">Nethaji Mini Mart Analytics</span>
                </div>

                <div className="h-52 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-200">
                  {stats?.salesGraph?.map((point, idx) => {
                    const maxSale = Math.max(...(stats.salesGraph.map(s => s.sales) || [1000]));
                    const heightPercent = Math.max(15, Math.round((point.sales / maxSale) * 100));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                        {/* Tooltip */}
                        <div className="absolute -top-8 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          ₹{point.sales} ({point.orders} orders)
                        </div>
                        
                        <div
                          className="w-full bg-emerald-700 group-hover:bg-amber-500 rounded-t-lg transition-all duration-300"
                          style={{ height: `${heightPercent}%` }}
                        ></div>
                        <span className="text-[10px] font-bold text-slate-500 truncate w-full text-center">{point.date}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Low Stock Warning Box */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Low Stock Items</span>
                  </h3>
                  <span className="text-xs text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">Re-stock needed</span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {stats?.lowStockProducts?.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">All inventory stock levels are healthy!</p>
                  ) : (
                    stats?.lowStockProducts?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="truncate max-w-[140px]">
                          <p className="font-bold text-slate-900 truncate">{item.name}</p>
                          <p className="text-[10px] text-slate-500">{item.unit}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-rose-600">{item.stock} left</span>
                          <button
                            onClick={() => handleUpdateStock(item.id, item.stock + 20)}
                            className="bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 rounded hover:bg-emerald-800"
                          >
                            +20 Stock
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Recent Orders Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900">Recent Customer Orders</h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-emerald-800 hover:underline"
                >
                  View All Orders →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="p-3">Order #</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Items</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Payment</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {orders.slice(0, 5).map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50">
                        <td className="p-3 font-extrabold text-emerald-800">{ord.orderNumber}</td>
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{ord.customerName}</p>
                          <p className="text-[10px] text-slate-400">{ord.customerPhone}</p>
                        </td>
                        <td className="p-3 font-semibold">{ord.items.length} items</td>
                        <td className="p-3 font-black text-slate-900">₹{ord.totalAmount}</td>
                        <td className="p-3">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-800">
                            {ord.paymentMethod} ({ord.paymentStatus})
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded text-[10px]">
                            {ord.orderStatus}
                          </span>
                        </td>
                        <td className="p-3">
                          <select
                            value={ord.orderStatus}
                            onChange={(e) => handleOrderStatusChange(ord.id, e.target.value as OrderStatus)}
                            className="bg-white border border-slate-300 rounded text-[11px] font-bold p-1 text-slate-800"
                          >
                            <option value="Placed">Placed</option>
                            <option value="Approved">Approved</option>
                            <option value="Packed">Packed</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 2. PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products by name or brand..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />

                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="All">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>

                <select
                  value={productTagFilter}
                  onChange={(e) => setProductTagFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="All">All Item Tags</option>
                  <option value="Trending">🔥 Trending Products Only</option>
                  <option value="Offer">🏷️ Special Offers Only</option>
                  <option value="Organic">🌿 Organic Items Only</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearAllProducts}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 shrink-0"
                  title="Remove all products from store catalog"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Clear All Products</span>
                </button>

                {products.length === 0 && (
                  <button
                    onClick={handleResetProducts}
                    className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
                    <span>Restore Sample Items</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setProductForm({
                      name: '',
                      category: categories[0]?.name || 'Grocery & Staples',
                      brand: 'Nethaji Fresh',
                      mrp: 100,
                      price: 85,
                      unit: '1 kg',
                      stock: 25,
                      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80',
                      description: 'Quality item at Nethaji Mini Mart.',
                      isPopular: false,
                      isOffer: false,
                      isOrganic: false,
                      sku: `NMM-${Math.floor(1000 + Math.random() * 9000)}`,
                      gstRate: 5,
                      hsnCode: '0709'
                    });
                    setShowAddProductModal(true);
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Grocery Item</span>
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="p-3">Product Item</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Price / MRP</th>
                      <th className="p-3">GST Tax</th>
                      <th className="p-3">Stock Quantity</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3">Shares</th>
                      <th className="p-3">Tags</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="p-3 flex items-center gap-3">
                          <img src={p.image} alt={p.name} className="w-10 h-10 object-contain rounded-lg border border-slate-200 bg-white p-1" />
                          <div>
                            <p className="font-bold text-slate-900 leading-snug">{p.name}</p>
                            <p className="text-[10px] text-slate-500">{p.brand} • {p.unit}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded text-[10px] font-bold">
                            {p.category}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-black text-slate-900">₹{p.price}</span>
                          <span className="text-[10px] text-slate-400 line-through ml-1">₹{p.mrp}</span>
                        </td>
                        <td className="p-3">
                          <span className="bg-amber-50 text-amber-900 border border-amber-200/80 px-2 py-0.5 rounded text-[10px] font-extrabold inline-flex items-center gap-1">
                            🏷️ {p.gstRate !== undefined ? `${p.gstRate}%` : '5%'} GST
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <span className={`font-bold ${p.stock <= 10 ? "text-rose-600" : "text-emerald-800"}`}>
                              {p.stock}
                            </span>
                            <button
                              onClick={() => handleUpdateStock(p.id, p.stock + 10)}
                              className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded"
                              title="Add 10 to stock"
                            >
                              +10
                            </button>
                          </div>
                        </td>
                        <td className="p-3 font-mono text-[10px] text-slate-500">{p.sku}</td>
                        <td className="p-3">
                          <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-extrabold inline-flex items-center gap-1 border border-emerald-200/60">
                            <Share2 className="w-3 h-3 text-emerald-600" />
                            {p.shareCount || 0}
                          </span>
                        </td>
                        <td className="p-3">
                          {p.isPopular && <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded text-[9px] font-bold mr-1">🔥 Trending</span>}
                          {p.isOffer && <span className="bg-rose-100 text-rose-900 px-1.5 py-0.5 rounded text-[9px] font-bold mr-1">Offer</span>}
                          {p.isOrganic && <span className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded text-[9px] font-bold">Organic</span>}
                        </td>
                        <td className="p-3 text-right space-x-1 flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggleProductOfferFlag(p, 'isPopular')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all border ${
                              p.isPopular
                                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-2xs'
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            }`}
                            title={p.isPopular ? "Remove from Trending" : "Set as Trending Item"}
                          >
                            🔥 {p.isPopular ? "Trending" : "+ Trending"}
                          </button>
                          <button
                            onClick={() => handleEditProductClick(p)}
                            className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-slate-100 rounded-lg"
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProductClick(p.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 3. CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-800" />
                  <h3 className="font-extrabold text-base text-slate-900">Manage Store Categories</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Organize your store inventory into clean categories. Create new categories or update existing ones.
                </p>
              </div>

              <button
                onClick={handleAddNewCategoryClick}
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0 hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div key={cat.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between gap-3 group hover:border-emerald-500/50 transition-all">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img src={cat.image} alt={cat.name} className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0 shadow-2xs bg-slate-50" />
                    <div className="min-w-0 space-y-0.5">
                      <h4 className="font-extrabold text-xs text-slate-900 truncate">{cat.name}</h4>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{cat.description || "Fresh store department"}</p>
                      <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded-md border border-emerald-200/60 inline-block mt-1">
                        {cat.itemCount || 0} products listed
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEditCategoryClick(cat)}
                      className="p-2 text-slate-600 hover:text-emerald-900 hover:bg-emerald-50 rounded-xl transition-colors border border-transparent hover:border-emerald-200"
                      title="Edit Category"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategoryClick(cat.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-200"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HERO BANNERS MANAGEMENT TAB */}
        {activeTab === 'banners' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <div className="flex items-center gap-2">
                  <Tv className="w-5 h-5 text-amber-500" />
                  <h3 className="font-extrabold text-base text-slate-900">Hero Carousel & Banner Manager</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customize hero slides, promotional titles, badges, colors, and imagery on the main store landing page.
                </p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={handleResetDefaultBanners}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all border border-slate-200 flex items-center gap-1.5"
                  title="Reset to original demo banners"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset Defaults</span>
                </button>

                <button
                  onClick={handleAddNewBannerClick}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 hover:scale-105 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Banner</span>
                </button>
              </div>
            </div>

            {/* Live Preview Box */}
            {banners.length > 0 && (
              <div className="bg-slate-900 rounded-2xl p-4 md:p-6 text-white border border-slate-800 shadow-md space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Sparkles className="w-4 h-4" />
                    <span>STOREFRONT LIVE PREVIEW — Slide #{previewBannerIndex + 1} of {banners.length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {banners.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPreviewBannerIndex(idx)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          idx === previewBannerIndex ? 'bg-amber-400 w-6' : 'bg-slate-700 hover:bg-slate-500'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {banners[previewBannerIndex] && (
                  <div className={`rounded-xl bg-gradient-to-r ${banners[previewBannerIndex].bgGradient || 'from-emerald-900 via-emerald-800 to-teal-950'} p-5 md:p-6 transition-all`}>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      <div className="md:col-span-7 space-y-3">
                        <span className={`inline-flex items-center gap-1 bg-amber-400/20 text-amber-300 font-extrabold text-[10px] px-2.5 py-1 rounded-md border border-amber-400/30 uppercase tracking-wider`}>
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          {banners[previewBannerIndex].badge || "SPECIAL STORE OFFER"}
                        </span>
                        <h2 className="text-lg md:text-2xl font-black text-white leading-tight">
                          {banners[previewBannerIndex].title}
                        </h2>
                        <p className="text-xs text-slate-200 leading-relaxed max-w-xl">
                          {banners[previewBannerIndex].subtitle}
                        </p>
                        <div className="pt-1 flex items-center gap-3">
                          <span className="bg-amber-500 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm">
                            <span>{banners[previewBannerIndex].cta || "Shop Now"}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                          <span className={`text-xs font-bold ${banners[previewBannerIndex].isActive !== false ? 'text-emerald-400' : 'text-slate-400'}`}>
                            Status: {banners[previewBannerIndex].isActive !== false ? 'Active on Storefront' : 'Inactive (Hidden)'}
                          </span>
                        </div>
                      </div>

                      <div className="md:col-span-5 relative hidden sm:block">
                        <div className="rounded-xl overflow-hidden border border-white/20 aspect-16/10 shadow-lg">
                          <img
                            src={banners[previewBannerIndex].image}
                            alt="Banner Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Banners List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <span className="font-extrabold text-xs text-slate-800">
                  All Configured Banner Slides ({banners.length})
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Use arrows to re-order carousel items
                </span>
              </div>

              {banners.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Tv className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-600">No Hero Banners Found</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Click "Add New Banner" to create custom promotional slides for your storefront.
                  </p>
                  <button
                    onClick={handleAddNewBannerClick}
                    className="bg-amber-500 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl inline-flex items-center gap-1.5 mt-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create First Banner</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {banners.map((banner, index) => (
                    <div
                      key={banner.id}
                      onClick={() => setPreviewBannerIndex(index)}
                      className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors cursor-pointer hover:bg-slate-50/80 ${
                        previewBannerIndex === index ? 'bg-amber-50/50 border-l-4 border-amber-500' : ''
                      }`}
                    >
                      <div className="flex items-start md:items-center gap-3 flex-1 min-w-0">
                        {/* Slide Position & Reorder Buttons */}
                        <div className="flex flex-col items-center justify-center gap-1 shrink-0 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveBanner(index, 'up');
                            }}
                            disabled={index === 0}
                            className="text-slate-500 hover:text-amber-600 disabled:opacity-30 disabled:hover:text-slate-500 p-0.5"
                            title="Move Up"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[11px] font-black text-slate-700">#{index + 1}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveBanner(index, 'down');
                            }}
                            disabled={index === banners.length - 1}
                            className="text-slate-500 hover:text-amber-600 disabled:opacity-30 disabled:hover:text-slate-500 p-0.5"
                            title="Move Down"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Banner Image Thumbnail */}
                        <img
                          src={banner.image}
                          alt={banner.title}
                          className="w-20 h-14 object-cover rounded-xl border border-slate-200 shrink-0 shadow-xs"
                        />

                        {/* Banner Details */}
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-extrabold text-xs text-slate-900 truncate">
                              {banner.title}
                            </h4>
                            <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded border border-amber-200 shrink-0">
                              {banner.badge}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                              banner.isActive !== false
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {banner.isActive !== false ? 'Active' : 'Hidden'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {banner.subtitle}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                            <span>Button: <strong className="text-slate-700">{banner.cta}</strong></span>
                            <span>•</span>
                            <span className="font-mono text-[9px] bg-slate-100 px-1.5 py-0.5 rounded">Gradient: {banner.bgGradient?.split(' ')[0] || 'emerald'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Controls */}
                      <div className="flex items-center gap-2 self-end md:self-auto shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleToggleBannerActive(banner)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all border flex items-center gap-1 ${
                            banner.isActive !== false
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                          }`}
                          title={banner.isActive !== false ? 'Hide Banner' : 'Show Banner'}
                        >
                          {banner.isActive !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span>{banner.isActive !== false ? 'Active' : 'Inactive'}</span>
                        </button>

                        <button
                          onClick={() => handleEditBannerClick(banner)}
                          className="bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-700 font-bold text-xs p-2 rounded-lg border border-slate-200 transition-colors"
                          title="Edit Banner"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteBannerClick(banner.id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs p-2 rounded-lg border border-rose-200 transition-colors"
                          title="Delete Banner"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3.5 QUAD & SLIDER SHOWCASE TAB */}
        {activeTab === 'showcase' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Header & Sub-tabs bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-emerald-50 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-800" /> Store Showcase & Offers Manager
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Quad Category Cards & Right-to-Left Slider Editor
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Customize the Amazon-style 2x2 Category Quad Cards and Right-to-Left Flash Offer Slider products on your store homepage.
                </p>
              </div>

              {/* Sub-tab toggle buttons */}
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-stretch md:self-auto justify-stretch flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={() => setShowcaseSubTab('quads')}
                  className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    showcaseSubTab === 'quads'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Category Quad Cards ({quadGroups.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowcaseSubTab('slider')}
                  className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    showcaseSubTab === 'slider'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Right-to-Left Slider Deals</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowcaseSubTab('trending')}
                  className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    showcaseSubTab === 'trending'
                      ? 'bg-amber-500 text-slate-950 font-extrabold shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 text-amber-900" />
                  <span>🔥 Trending Products ({products.filter(p => p.isPopular).length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowcaseSubTab('location')}
                  className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    showcaseSubTab === 'location'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>Section Location & Order</span>
                </button>
              </div>
            </div>

            {/* SUB-TAB 1: QUAD CATEGORY CARDS */}
            {showcaseSubTab === 'quads' && (
              <div className="space-y-5">
                
                {/* Actions bar */}
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Amazon-Style 2x2 Category Quad Collections
                    </h3>
                    <p className="text-xs text-slate-500">
                      Cards feature 4 product tiles each with custom titles, images, and quick category filtering links.
                    </p>
                  </div>

                  <button
                    onClick={handleAddNewQuadGroupClick}
                    className="bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Quad Card</span>
                  </button>
                </div>

                {/* Quad Groups List / Grid */}
                {quadGroups.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                    <LayoutGrid className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="text-base font-bold text-slate-800">No Quad Category Cards Created</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Click the button above to create your first Amazon-style 2x2 category quad showcase card.
                    </p>
                    <button
                      onClick={handleAddNewQuadGroupClick}
                      className="bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-xl"
                    >
                      Create First Quad Card
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {quadGroups.map((group, groupIdx) => (
                      <div
                        key={group.id}
                        className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div>
                          {/* Card Header & Controls */}
                          <div className="flex items-start justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
                            <div>
                              <span className="text-[10px] font-extrabold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200 uppercase tracking-wider">
                                Quad Card #{groupIdx + 1}
                              </span>
                              <h3 className="text-base font-extrabold text-slate-900 mt-1 leading-snug">
                                {group.heading}
                              </h3>
                              {group.subheading && (
                                <p className="text-xs text-slate-500 font-medium">
                                  {group.subheading}
                                </p>
                              )}
                            </div>

                            {/* Reorder / Edit / Delete buttons */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleMoveQuadGroup(groupIdx, 'up')}
                                disabled={groupIdx === 0}
                                className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg"
                                title="Move Up"
                              >
                                <MoveUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleMoveQuadGroup(groupIdx, 'down')}
                                disabled={groupIdx === quadGroups.length - 1}
                                className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg"
                                title="Move Down"
                              >
                                <MoveDown className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleEditQuadGroupClick(group)}
                                className="p-1.5 text-amber-800 hover:bg-amber-50 bg-amber-50/50 border border-amber-200 rounded-lg font-bold text-xs"
                                title="Edit Quad Group"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteQuadGroupClick(group.id)}
                                className="p-1.5 text-rose-700 hover:bg-rose-50 bg-rose-50/50 border border-rose-200 rounded-lg font-bold text-xs"
                                title="Delete Quad Group"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* 2x2 Tiles Preview */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            {group.tiles.map((tile) => (
                              <div
                                key={tile.id}
                                className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex flex-col"
                              >
                                <div className="w-full aspect-square rounded-lg overflow-hidden bg-white border border-slate-200 mb-1.5 relative">
                                  <img
                                    src={tile.image}
                                    alt={tile.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <span className="text-[11px] font-bold text-slate-800 line-clamp-1">
                                  {tile.title}
                                </span>
                                {tile.subtitle && (
                                  <span className="text-[10px] font-bold text-emerald-800">
                                    {tile.subtitle}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <span>Link: <strong className="text-slate-800">{group.categoryFilter || 'All'}</strong></span>
                          <span className="text-emerald-800 font-bold">{group.seeMoreText || 'See more'} →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 2: RIGHT-TO-LEFT SLIDER & FLASH DEALS */}
            {showcaseSubTab === 'slider' && (
              <form onSubmit={handleSaveSliderConfig} className="space-y-6">
                
                {/* 1. RIGHT-TO-LEFT SLIDER BANNER CARDS CREATION & MANAGEMENT */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-amber-300">
                        ⚡ SLIDER BANNER CARDS ({sliderConfig.sliderBanners?.length || 0})
                      </span>
                      <h3 className="text-sm font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Right-to-Left Slider Banners Manager</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Create & manage promotional cards that slide from right-to-left alongside featured products on your live storefront.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenCreateSliderBannerModal}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Create Right-to-Left Slider Banner</span>
                    </button>
                  </div>

                  {/* Banner Cards List */}
                  {!sliderConfig.sliderBanners || sliderConfig.sliderBanners.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                      <SlidersHorizontal className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-600">No Custom Right-to-Left Slider Banners Created</p>
                      <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                        Click the button above to create custom promo banner slides with deal badges, images, and category links.
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenCreateSliderBannerModal}
                        className="bg-amber-500 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl inline-flex items-center gap-1 mt-2 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Slider Banner Now</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sliderConfig.sliderBanners.map((sb, idx) => (
                        <div
                          key={sb.id}
                          className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                            sb.active !== false
                              ? 'bg-gradient-to-r from-slate-900 via-slate-950 to-emerald-950 text-white border-slate-700 shadow-md'
                              : 'bg-slate-100 text-slate-500 border-slate-200 opacity-60'
                          }`}
                        >
                          {/* Header */}
                          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase shadow-2xs">
                                POS #{idx + 1}
                              </span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                sb.active !== false ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}>
                                {sb.active !== false ? '🟢 ENABLED' : '🔴 DISABLED'}
                              </span>
                              <span className="bg-slate-800 text-slate-300 font-bold text-[10px] px-2 py-0.5 rounded-md border border-slate-700">
                                {sb.bgStyle === 'wood' ? '🪵 Wood Dairy' : sb.bgStyle === 'amber' ? '🧀 Amber Gold' : sb.bgStyle === 'rose' ? '🌹 Rose Special' : sb.bgStyle === 'slate' ? '🌙 Dark Slate' : '🥦 Emerald Fresh'}
                              </span>
                            </div>

                            {/* Enable & Edit & Relocate Action Bar */}
                            <div className="flex items-center gap-1 shrink-0">
                              {/* Relocate Position Up/Left */}
                              <button
                                type="button"
                                onClick={() => handleMoveSliderBanner(idx, 'up')}
                                disabled={idx === 0}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 font-extrabold text-[10px] rounded-lg border border-slate-700 disabled:opacity-30 transition-all flex items-center gap-0.5 cursor-pointer"
                                title="Relocate Position Left / Up"
                              >
                                <MoveUp className="w-3 h-3" />
                                <span>Relocate Up</span>
                              </button>

                              {/* Relocate Position Down/Right */}
                              <button
                                type="button"
                                onClick={() => handleMoveSliderBanner(idx, 'down')}
                                disabled={idx === (sliderConfig.sliderBanners?.length || 0) - 1}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 font-extrabold text-[10px] rounded-lg border border-slate-700 disabled:opacity-30 transition-all flex items-center gap-0.5 cursor-pointer"
                                title="Relocate Position Right / Down"
                              >
                                <MoveDown className="w-3 h-3" />
                                <span>Down</span>
                              </button>

                              {/* Enable / Disable Toggle Button */}
                              <button
                                type="button"
                                onClick={() => handleToggleSliderBannerActive(sb.id)}
                                className={`p-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer ${
                                  sb.active !== false
                                    ? 'bg-emerald-500/30 text-emerald-300 hover:bg-emerald-500/50'
                                    : 'bg-rose-500/30 text-rose-300 hover:bg-rose-500/50'
                                }`}
                                title={sb.active !== false ? 'Disable / Hide Banner' : 'Enable / Show Banner'}
                              >
                                {sb.active !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              </button>

                              {/* Edit Option Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditSliderBannerModal(sb)}
                                className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                                title="Edit Banner Option"
                              >
                                <Edit className="w-3 h-3" />
                                <span>Edit</span>
                              </button>

                              {/* Delete Option */}
                              <button
                                type="button"
                                onClick={() => handleDeleteSliderBanner(sb.id)}
                                className="p-1 bg-rose-500/30 hover:bg-rose-500/50 text-rose-300 rounded-lg transition-all cursor-pointer"
                                title="Delete Banner"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Banner Details */}
                          <div className="flex items-center gap-3">
                            <img
                              src={sb.image}
                              alt={sb.title}
                              className="w-16 h-16 rounded-xl object-cover border border-amber-400/40 shrink-0 bg-white"
                            />
                            <div className="space-y-0.5 min-w-0">
                              <h4 className="text-xs font-black truncate text-white">{sb.title}</h4>
                              <p className="text-[11px] text-slate-300 line-clamp-1">{sb.subtitle}</p>
                              <div className="flex items-center gap-2 pt-1 flex-wrap">
                                {sb.badge && (
                                  <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded shadow-2xs">
                                    {sb.badge}
                                  </span>
                                )}
                                {sb.discountBadge && (
                                  <span className="text-[10px] font-bold bg-rose-500/90 text-white px-2 py-0.5 rounded">
                                    {sb.discountBadge}
                                  </span>
                                )}
                                {sb.buttonText && (
                                  <span className="text-[10px] font-bold bg-slate-800 text-amber-300 px-2 py-0.5 rounded border border-slate-700">
                                    Button: {sb.buttonText}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Header Text Settings */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-emerald-800" />
                      <span>Right-to-Left Slider Banner & Header Customization</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Configure the main title, subtitle badge, and speed of the right-to-left sliding product row.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">
                        Badge Text (e.g. DAILY BESTSELLERS)
                      </label>
                      <input
                        type="text"
                        value={sliderConfig.badge}
                        onChange={(e) => setSliderConfig({ ...sliderConfig, badge: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        placeholder="DAILY BESTSELLERS"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">
                        Slider Main Title
                      </label>
                      <input
                        type="text"
                        value={sliderConfig.title}
                        onChange={(e) => setSliderConfig({ ...sliderConfig, title: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        placeholder="⚡ Flash Deals & Daily Fresh Savings"
                        required
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">
                        Slider Subtitle / Description
                      </label>
                      <input
                        type="text"
                        value={sliderConfig.subtitle}
                        onChange={(e) => setSliderConfig({ ...sliderConfig, subtitle: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        placeholder="Swipe or slide right-to-left for exclusive discounts on vegetables, staples & dairy"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* "FRESH @ ₹1" OFFER ZONE HEADER CUSTOMIZATION */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <span className="bg-rose-100 text-rose-900 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-rose-300">
                        🔥 OFFER ZONE HEADER CUSTOMIZATION
                      </span>
                      <h3 className="text-sm font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-rose-600" />
                        <span>"FRESH @ ₹1" Offer Header Title & Tagline Editor</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Customize the header title, highlight price badge, and description displayed above the Offer Zone Row on your customer homepage.
                      </p>
                    </div>

                    {/* Live Store Preview Badge */}
                    <div className="bg-slate-900 text-white p-2.5 rounded-xl border border-slate-800 shrink-0 shadow-sm">
                      <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Storefront Live Preview:</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-black text-xs text-white">{sliderConfig.freshOffersTitle || "FRESH"}</span>
                        <span className="bg-rose-600 text-white font-black text-[10px] px-2 py-0.5 rounded-md shadow-xs">
                          {sliderConfig.freshOffersHighlight || "@ ₹1"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5">
                        {sliderConfig.freshOffersSubtitle || "Handpicked daily essentials"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Header Title (e.g. FRESH)
                      </label>
                      <input
                        type="text"
                        value={sliderConfig.freshOffersTitle || ''}
                        onChange={(e) => setSliderConfig({ ...sliderConfig, freshOffersTitle: e.target.value })}
                        placeholder="FRESH"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Highlight Price Badge (e.g. @ ₹1)
                      </label>
                      <input
                        type="text"
                        value={sliderConfig.freshOffersHighlight || ''}
                        onChange={(e) => setSliderConfig({ ...sliderConfig, freshOffersHighlight: e.target.value })}
                        placeholder="@ ₹1"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Subtitle / Tagline
                      </label>
                      <input
                        type="text"
                        value={sliderConfig.freshOffersSubtitle || ''}
                        onChange={(e) => setSliderConfig({ ...sliderConfig, freshOffersSubtitle: e.target.value })}
                        placeholder="Handpicked daily essentials"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  {/* Quick Presets */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-500 mr-1">Quick Presets:</span>
                      <button
                        type="button"
                        onClick={() => setSliderConfig({ ...sliderConfig, freshOffersTitle: "FRESH", freshOffersHighlight: "@ ₹1", freshOffersSubtitle: "Handpicked daily essentials" })}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[10px] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        FRESH @ ₹1
                      </button>
                      <button
                        type="button"
                        onClick={() => setSliderConfig({ ...sliderConfig, freshOffersTitle: "SUPER SAVER", freshOffersHighlight: "@ ₹9", freshOffersSubtitle: "Unbeatable discounts on grocery & staples" })}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-[10px] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        SUPER SAVER @ ₹9
                      </button>
                      <button
                        type="button"
                        onClick={() => setSliderConfig({ ...sliderConfig, freshOffersTitle: "MEGA DEALS", freshOffersHighlight: "UNDER ₹19", freshOffersSubtitle: "Limited period flash offer deals" })}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-[10px] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        MEGA DEALS UNDER ₹19
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveSliderConfig()}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Offer Header</span>
                    </button>
                  </div>
                </div>

                {/* Offer Products Selection for Right-to-Left Slider */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <ArrowRightLeft className="w-4 h-4 text-amber-800" />
                        <span>Select Products for Right-to-Left Slider Showcase</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Check the boxes next to products you want featured in the Right-to-Left slider, or toggle Special Offer badges.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-600">
                        Selected: <strong className="text-emerald-800">{sliderConfig.featuredProductIds?.length || 0} Products</strong>
                      </span>
                    </div>
                  </div>

                  {/* Product List Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                        <tr>
                          <th className="p-3 text-center">In Slider?</th>
                          <th className="p-3">Product Name & Category</th>
                          <th className="p-3">Price / MRP</th>
                          <th className="p-3 text-center">Special Offer Tag</th>
                          <th className="p-3 text-center">Popular Badge</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {products.map((prod) => {
                          const isFeaturedInSlider = sliderConfig.featuredProductIds?.includes(prod.id);
                          const discountPercent = prod.mrp > prod.price 
                            ? Math.round(((prod.mrp - prod.price) / prod.mrp) * 100) 
                            : 0;

                          return (
                            <tr key={prod.id} className={`hover:bg-slate-50/80 transition-colors ${isFeaturedInSlider ? 'bg-amber-50/30' : ''}`}>
                              {/* Checkbox */}
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={!!isFeaturedInSlider}
                                  onChange={() => handleToggleSliderProduct(prod.id)}
                                  className="w-4 h-4 text-emerald-800 rounded border-slate-300 focus:ring-emerald-600 cursor-pointer"
                                />
                              </td>

                              {/* Product details */}
                              <td className="p-3">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={prod.image}
                                    alt={prod.name}
                                    className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                                  />
                                  <div>
                                    <p className="font-extrabold text-slate-900 leading-tight">{prod.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400">{prod.category} • {prod.unit}</p>
                                  </div>
                                </div>
                              </td>

                              {/* Price & MRP */}
                              <td className="p-3">
                                <div className="flex items-baseline gap-1.5">
                                  <span className="font-black text-slate-900">₹{prod.price}</span>
                                  {prod.mrp > prod.price && (
                                    <>
                                      <span className="text-[10px] text-slate-400 line-through">₹{prod.mrp}</span>
                                      <span className="text-[10px] font-extrabold text-emerald-800">
                                        ({discountPercent}% OFF)
                                      </span>
                                    </>
                                  )}
                                </div>
                              </td>

                              {/* Offer Tag Toggle */}
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleProductOfferFlag(prod, 'isOffer')}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border transition-all ${
                                    prod.isOffer
                                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                                  }`}
                                >
                                  {prod.isOffer ? '🔥 Offer Active' : '+ Set Offer'}
                                </button>
                              </td>

                              {/* Popular Tag Toggle */}
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleProductOfferFlag(prod, 'isPopular')}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border transition-all ${
                                    prod.isPopular
                                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                                  }`}
                                >
                                  {prod.isPopular ? '⭐ Popular' : 'Normal'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      className="bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save Slider Settings & Selected Offer Products</span>
                    </button>
                  </div>

                </div>

              </form>
            )}

            {/* SUB-TAB 2.5: TRENDING PRODUCTS EDITOR */}
            {showcaseSubTab === 'trending' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 p-6 rounded-3xl text-slate-950 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <span className="bg-slate-950 text-amber-400 font-extrabold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
                      🔥 Live Storefront Trending Section
                    </span>
                    <h3 className="text-xl font-black text-slate-950 tracking-tight mt-1">
                      Trending Products Management Panel
                    </h3>
                    <p className="text-xs text-slate-950/80 font-semibold max-w-xl mt-0.5">
                      Items marked as Trending appear in the Trending Products section on the homepage and in the full Trending view modal when customers click "View All Trending".
                    </p>
                  </div>

                  <div className="bg-slate-950 text-white p-3 rounded-2xl border border-slate-800 shadow-sm flex items-center gap-3">
                    <div className="text-center border-r border-slate-800 pr-3">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Trending Items</p>
                      <p className="text-lg font-black text-amber-400">{products.filter(p => p.isPopular).length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Total Store Items</p>
                      <p className="text-lg font-black text-white">{products.length}</p>
                    </div>
                  </div>
                </div>

                {/* Trending Products Table & Quick Toggle */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Search className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search product by name or category..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 w-full sm:w-64"
                      />
                    </div>

                    <p className="text-xs font-bold text-slate-500">
                      Click the toggle button to instantly mark or unmark products as <strong className="text-amber-700">🔥 Trending</strong>.
                    </p>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                        <tr>
                          <th className="p-3">Product Item</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Price / MRP</th>
                          <th className="p-3 text-center">Trending Status</th>
                          <th className="p-3 text-right">Quick Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {products
                          .filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.category.toLowerCase().includes(productSearch.toLowerCase()))
                          .map((p) => (
                            <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${p.isPopular ? 'bg-amber-50/40' : ''}`}>
                              <td className="p-3 flex items-center gap-3">
                                <img src={p.image} alt={p.name} className="w-10 h-10 object-contain rounded-lg border border-slate-200 bg-white p-1" />
                                <div>
                                  <p className="font-bold text-slate-900 leading-snug">{p.name}</p>
                                  <p className="text-[10px] text-slate-500">{p.brand} • {p.unit}</p>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold">
                                  {p.category}
                                </span>
                              </td>
                              <td className="p-3 font-black text-slate-900">
                                ₹{p.price} <span className="text-[10px] text-slate-400 line-through font-normal">₹{p.mrp}</span>
                              </td>
                              <td className="p-3 text-center">
                                {p.isPopular ? (
                                  <span className="bg-amber-100 text-amber-900 border border-amber-300 font-black text-[10px] px-2.5 py-1 rounded-full inline-flex items-center gap-1 shadow-2xs">
                                    🔥 TRENDING ACTIVE
                                  </span>
                                ) : (
                                  <span className="bg-slate-100 text-slate-500 text-[10px] font-semibold px-2.5 py-1 rounded-full">
                                    Standard Item
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleToggleProductOfferFlag(p, 'isPopular')}
                                  className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all shadow-xs cursor-pointer ${
                                    p.isPopular
                                      ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300'
                                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                                  }`}
                                >
                                  {p.isPopular ? 'Remove Trending' : '+ Set as Trending'}
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 3: HOMEPAGE SECTION LOCATION & REORDERING EDITOR */}
            {showcaseSubTab === 'location' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                
                {/* Intro Banner */}
                <div className="bg-linear-to-r from-emerald-950 via-slate-900 to-emerald-900 p-6 rounded-3xl text-white shadow-xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-500/30">
                        ⚡ Live Storefront Layout Control
                      </span>
                      <h3 className="text-xl font-black tracking-tight text-white">
                        Homepage Section Location & Display Order Editor
                      </h3>
                      <p className="text-xs text-slate-300 max-w-2xl font-medium">
                        Change where the <strong>Quad Category Cards Showcase</strong>, <strong>Right-to-Left Product Slider</strong>, and other sections appear on your live homepage. Reorder or hide any section with a single click.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveSliderConfig()}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-5 py-3 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shrink-0 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save Location & Section Order</span>
                    </button>
                  </div>

                  {/* Preset Shortcuts */}
                  <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-200">
                    <span className="text-slate-400 text-[11px] font-bold">Quick Layout Presets:</span>
                    <button
                      type="button"
                      onClick={() => handleApplyHomepageLayoutPreset('promo_top')}
                      className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-1 rounded-xl text-xs font-black transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>✨ Promo Peek Slider Top</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyHomepageLayoutPreset('default')}
                      className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-xl text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
                    >
                      ⚡ Standard Default
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyHomepageLayoutPreset('quads_top')}
                      className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 px-3 py-1 rounded-xl text-xs font-bold border border-emerald-500/30 transition-colors cursor-pointer"
                    >
                      🧱 Quads First (Amazon Style)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyHomepageLayoutPreset('slider_top')}
                      className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 px-3 py-1 rounded-xl text-xs font-bold border border-amber-500/30 transition-colors cursor-pointer"
                    >
                      🔥 Right-to-Left Slider First
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyHomepageLayoutPreset('categories_top')}
                      className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 px-3 py-1 rounded-xl text-xs font-bold border border-blue-500/30 transition-colors cursor-pointer"
                    >
                      🛍️ Categories Top
                    </button>
                  </div>
                </div>

                {/* Interactive Section Ordering List */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">
                        Current Homepage Section Positions & Order
                      </h4>
                      <p className="text-xs text-slate-500">
                        Use the <strong>Up</strong> and <strong>Down</strong> buttons to shift section positions. Toggle the eye icon to show or hide sections.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {(() => {
                      const defaultOrder: HomepageSectionKey[] = ['promoPeekSlider', 'hero', 'categories', 'freshOffers', 'slider', 'quads', 'catalog'];
                      const rawOrder = sliderConfig.sectionOrder && sliderConfig.sectionOrder.length > 0
                        ? sliderConfig.sectionOrder
                        : defaultOrder;
                      const currentOrder = Array.from(new Set([...rawOrder, ...defaultOrder]));
                      const hidden = sliderConfig.hiddenSections || [];

                      const getSectionMeta = (key: HomepageSectionKey) => {
                        switch (key) {
                          case 'promoPeekSlider':
                            return {
                              title: 'Promo Peek Offer Slider (Zepto/Blinkit Style)',
                              desc: 'Interactive touch & swipe organic leaf/pill shape promo cards with next-slide peek and category relocation',
                              icon: Sparkles,
                              highlight: true,
                              tag: '⚡ PROMO PEEK SLIDER'
                            };
                          case 'hero':
                            return {
                              title: 'Hero Promotional Banner Carousel',
                              desc: 'Main sliding promotional banners & quick category offer links at the top of homepage',
                              icon: Tv,
                              highlight: false
                            };
                          case 'categories':
                            return {
                              title: 'Category Quick Grid',
                              desc: 'Circular & grid category shortcuts with item counts and quick selection buttons',
                              icon: LayoutGrid,
                              highlight: false
                            };
                          case 'freshOffers':
                            return {
                              title: `"${sliderConfig.freshOffersTitle || 'FRESH'} ${sliderConfig.freshOffersHighlight || '@ ₹1'}" Offer Zone Row`,
                              desc: 'Special ₹1 Offer Zone & Flash Deals Row with tabbed category filters',
                              icon: Sparkles,
                              highlight: true,
                              tag: '🔥 OFFER ROW'
                            };
                          case 'slider':
                            return {
                              title: 'Right-to-Left Sliding Product Row',
                              desc: 'Horizontal right-to-left scrolling offer cards for daily bestsellers & flash deals',
                              icon: ArrowRightLeft,
                              highlight: true,
                              tag: '⚡ SLIDER'
                            };
                          case 'quads':
                            return {
                              title: 'Amazon-Style 2x2 Category Quad Cards Showcase',
                              desc: 'Featured 2x2 grid cards grouping 4 category items with custom images and titles',
                              icon: SlidersHorizontal,
                              highlight: true,
                              tag: '🧱 QUAD CARDS'
                            };
                          case 'catalog':
                            return {
                              title: 'Main Grocery Product Catalog',
                              desc: 'Full searchable product catalog grid with filters, sorting, search, and pagination',
                              icon: Package,
                              highlight: false
                            };
                          default:
                            return {
                              title: key,
                              desc: '',
                              icon: Layers,
                              highlight: false
                            };
                        }
                      };

                      return currentOrder.map((secKey, index) => {
                        const meta = getSectionMeta(secKey);
                        const isHidden = hidden.includes(secKey);
                        const Icon = meta.icon;

                        return (
                          <div
                            key={secKey}
                            className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                              isHidden
                                ? 'bg-slate-50 border-slate-200 opacity-60'
                                : meta.highlight
                                ? 'bg-emerald-50/40 border-emerald-300 shadow-2xs ring-1 ring-emerald-500/20'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {/* Left Info */}
                            <div className="flex items-center gap-3.5">
                              {/* Position Badge */}
                              <div className="flex flex-col items-center justify-center bg-slate-900 text-white w-10 h-10 rounded-xl font-black text-xs shrink-0 shadow-xs">
                                <span className="text-[9px] text-emerald-400 uppercase font-black tracking-tighter">POS</span>
                                <span>#{index + 1}</span>
                              </div>

                              <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs text-slate-700 shrink-0">
                                <Icon className="w-5 h-5 text-emerald-800" />
                              </div>

                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="text-xs font-extrabold text-slate-900">
                                    {meta.title}
                                  </h5>
                                  {meta.tag && (
                                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-800 text-white shadow-2xs">
                                      {meta.tag}
                                    </span>
                                  )}
                                  {isHidden && (
                                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                                      Hidden on Homepage
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                  {meta.desc}
                                </p>
                              </div>
                            </div>

                            {/* Right Controls */}
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              {/* Visibility Toggle */}
                              <button
                                type="button"
                                onClick={() => handleToggleHomepageSectionVisibility(secKey)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                  isHidden
                                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                }`}
                                title={isHidden ? "Click to Show Section" : "Click to Hide Section"}
                              >
                                {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                <span>{isHidden ? "Hidden" : "Visible"}</span>
                              </button>

                              {/* Up Button */}
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => handleMoveHomepageSection(index, 'up')}
                                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-30 disabled:hover:bg-white transition-all cursor-pointer disabled:cursor-not-allowed"
                                title="Move Up"
                              >
                                <MoveUp className="w-4 h-4" />
                              </button>

                              {/* Down Button */}
                              <button
                                type="button"
                                disabled={index === currentOrder.length - 1}
                                onClick={() => handleMoveHomepageSection(index, 'down')}
                                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-30 disabled:hover:bg-white transition-all cursor-pointer disabled:cursor-not-allowed"
                                title="Move Down"
                              >
                                <MoveDown className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Bottom Save Action */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500 font-medium">
                      Changes are stored instantly in server config. Click Save to publish to live store!
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSaveSliderConfig()}
                      className="bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save Location & Section Order</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* 4. ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            {/* Return Request Notification Banner */}
            {orders.some(o => o.returnRequest?.status === 'Requested') && (
              <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs font-extrabold shadow-md border border-amber-300">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 animate-spin text-slate-950 shrink-0" />
                  <span>
                    ⚡ Action Required: {orders.filter(o => o.returnRequest?.status === 'Requested').length} Return Request(s) Received from Customers!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOrderStatusFilter('Return Requested')}
                  className="bg-slate-950 hover:bg-slate-900 text-white font-black px-4 py-1.5 rounded-xl text-xs transition-all cursor-pointer shadow-2xs"
                >
                  Review Return Requests →
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Filter Status:</span>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="All">All Order Statuses</option>
                  <option value="Return Requests">↩️ All Return Requests ({orders.filter(o => o.returnRequest).length})</option>
                  <option value="Return Requested">🟡 Pending Returns ({orders.filter(o => o.returnRequest?.status === 'Requested').length})</option>
                  <option value="Return Approved">🔵 Approved Returns ({orders.filter(o => o.returnRequest?.status === 'Approved').length})</option>
                  <option value="Return Refunded">🟢 Refunded via UPI ({orders.filter(o => o.returnRequest?.status === 'Refunded').length})</option>
                  <option value="Return Rejected">🔴 Declined Returns ({orders.filter(o => o.returnRequest?.status === 'Rejected').length})</option>
                  <option value="Placed">Placed Orders</option>
                  <option value="Approved">Approved Orders</option>
                  <option value="Packed">Packed Orders</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered Orders</option>
                  <option value="Cancelled">Cancelled Orders</option>
                </select>
              </div>

              <span className="text-xs font-bold text-slate-500">Showing {filteredOrders.length} orders</span>
            </div>

            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
                  <Package className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No orders match the selected filter</p>
                </div>
              ) : (
                filteredOrders.map((ord) => (
                  <div key={ord.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
                    
                    {/* Header Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 text-xs">
                      <div>
                        <span className="font-black text-emerald-800 text-sm">{ord.orderNumber}</span>
                        <span className="text-slate-400 mx-2">•</span>
                        <span className="text-slate-500">{new Date(ord.createdAt).toLocaleString()}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded text-[10px] font-bold">
                          {ord.paymentMethod} ({ord.paymentStatus})
                        </span>
                        
                        <select
                          value={ord.orderStatus}
                          onChange={(e) => handleOrderStatusChange(ord.id, e.target.value as OrderStatus)}
                          className="bg-emerald-50 border border-emerald-300 text-emerald-900 font-extrabold text-xs rounded-lg px-2 py-1"
                        >
                          <option value="Placed">Placed</option>
                          <option value="Approved">Approved</option>
                          <option value="Packed">Packed</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    {/* RETURN REQUEST SECTION & UPI REFUND GATEWAY ACTIONS (If Present) */}
                    {ord.returnRequest && (
                      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-4 rounded-2xl border border-purple-800/40 space-y-3 shadow-sm">
                        
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                          <div className="flex items-center gap-2">
                            <RotateCcw className="w-4 h-4 text-amber-400" />
                            <span className="font-black text-xs text-amber-300 uppercase tracking-wider">
                              Customer Return Request Received
                            </span>
                          </div>
                          
                          <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                            ord.returnRequest.status === 'Requested' ? 'bg-amber-400 text-slate-950' :
                            ord.returnRequest.status === 'Approved' ? 'bg-blue-400 text-slate-950' :
                            ord.returnRequest.status === 'Refunded' ? 'bg-emerald-400 text-slate-950' :
                            'bg-rose-400 text-slate-950'
                          }`}>
                            Status: {ord.returnRequest.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {/* Reason & Info */}
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Return Reason</p>
                            <p className="font-extrabold text-amber-300">{ord.returnRequest.reason}</p>
                            {ord.returnRequest.comments && (
                              <p className="text-[11px] text-slate-300 italic">"{ord.returnRequest.comments}"</p>
                            )}
                            <p className="text-[10px] text-slate-400">Requested on: {new Date(ord.returnRequest.requestedAt).toLocaleString()}</p>
                          </div>

                          {/* MANDATORY UPI PAYMENT GATEWAY DETAILS */}
                          <div className="bg-slate-950/80 p-3 rounded-xl border border-amber-400/40 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold text-amber-400 uppercase flex items-center gap-1">
                                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                                UPI Payment Gateway Refund Details
                              </span>
                              <span className="text-[10px] bg-purple-900 text-purple-200 font-bold px-1.5 py-0.2 rounded">
                                {ord.returnRequest.refundUpiProvider || 'UPI App'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
                              <div>
                                <p className="text-[10px] text-slate-400 font-bold">UPI ID (Refund Target)</p>
                                <p className="font-black text-amber-300 text-xs font-mono">{ord.returnRequest.refundUpiId}</p>
                                <p className="text-[10px] text-slate-400">Holder: {ord.returnRequest.refundUpiName}</p>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(ord.returnRequest!.refundUpiId);
                                  alert(`UPI ID (${ord.returnRequest!.refundUpiId}) copied to clipboard! Open your UPI App to transfer ₹${ord.returnRequest!.refundAmount}`);
                                }}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] rounded-lg transition-all cursor-pointer"
                              >
                                Copy UPI ID
                              </button>
                            </div>

                            <div className="flex justify-between items-center text-[11px] font-black text-slate-200">
                              <span>Refund Amount:</span>
                              <span className="text-emerald-400 text-xs">₹{ord.returnRequest.refundAmount}</span>
                            </div>
                          </div>
                        </div>

                        {/* Admin Action Buttons for Returns */}
                        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-white/10">
                          {ord.returnRequest.status === 'Requested' && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  const note = prompt("Enter reason for declining this return request (Optional):");
                                  if (note !== null) {
                                    handleUpdateReturnStatus(ord.id, 'Rejected', note || 'Return request not eligible as per store return policy.');
                                  }
                                }}
                                className="px-3 py-1.5 bg-rose-900 hover:bg-rose-800 text-rose-100 font-bold text-xs rounded-xl cursor-pointer"
                              >
                                Reject Return
                              </button>

                              <button
                                type="button"
                                onClick={() => handleUpdateReturnStatus(ord.id, 'Approved', 'Return request approved by admin. Transfer refund via UPI.')}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                              >
                                Approve Return Request
                              </button>
                            </>
                          )}

                          {ord.returnRequest.status === 'Approved' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateReturnStatus(ord.id, 'Refunded', 'Refund transferred via UPI Payment Gateway.')}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                            >
                              <ShieldCheck className="w-4 h-4 text-amber-300" />
                              <span>Mark Refund Paid via UPI Gateway (₹{ord.returnRequest.refundAmount})</span>
                            </button>
                          )}

                          {ord.returnRequest.status === 'Refunded' && (
                            <span className="text-emerald-400 text-xs font-black flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span>Refund Completed via UPI Gateway</span>
                            </span>
                          )}

                          {ord.returnRequest.status === 'Rejected' && (
                            <span className="text-rose-400 text-xs font-bold">
                              Return Declined {ord.returnRequest.adminNote ? `(${ord.returnRequest.adminNote})` : ''}
                            </span>
                          )}
                        </div>

                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Customer Information</p>
                        <p className="font-bold text-slate-900">{ord.customerName}</p>
                        <p className="text-slate-600">{ord.customerPhone}</p>
                        <p className="text-slate-500 text-[11px] truncate">{ord.address.street}, {ord.address.pincode}</p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Delivery Slot & Executive</p>
                        <p className="font-bold text-slate-800">{ord.deliverySlot}</p>
                        {ord.assignedRiderName ? (
                          <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] space-y-1">
                            <div className="flex items-center justify-between font-bold text-emerald-950">
                              <span className="flex items-center gap-1">
                                <Bike className="w-3.5 h-3.5 text-emerald-700" />
                                {ord.assignedRiderName}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUnassignRider(ord.id)}
                                className="text-[10px] text-rose-700 hover:underline font-extrabold cursor-pointer"
                              >
                                Unassign
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-600 font-medium">📞 {ord.assignedRiderPhone} • {ord.assignedRiderVehicle}</p>
                            <button
                              type="button"
                              onClick={() => handleOpenAssignRiderModal(ord)}
                              className="text-[10px] text-emerald-800 hover:underline font-bold cursor-pointer"
                            >
                              Change Rider →
                            </button>
                          </div>
                        ) : (
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={() => handleOpenAssignRiderModal(ord)}
                              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Assign Rider</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Grand Total</p>
                        <p className="text-base font-black text-emerald-800">₹{ord.totalAmount}</p>
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForInvoice(ord)}
                          className="mt-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3 h-3" /> Print Invoice
                        </button>
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* 4.5. DELIVERY RIDERS & DISPATCH DASHBOARD TAB */}
        {activeTab === 'riders' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Top Control Bar & Header */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-100 text-emerald-900 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full border border-emerald-300">
                      DELIVERY FLEET & DISPATCH CONTROL
                    </span>
                    <span className="bg-amber-100 text-amber-900 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                      {riders.filter(r => r.status === 'Available').length} Available Riders
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                    <Bike className="w-5 h-5 text-emerald-700" />
                    <span>Delivery Rider Management & Order Assignment Dashboard</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Assign delivery riders to pending orders, track active dispatches, and manage your delivery executive fleet.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0">
                  <button
                    onClick={handleOpenAddRiderModal}
                    className="bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 hover:scale-105 active:scale-95 cursor-pointer w-full md:w-auto"
                  >
                    <UserPlus className="w-4 h-4 text-amber-400" />
                    <span>+ Add New Delivery Rider</span>
                  </button>
                </div>
              </div>

              {/* Sub-tab Navigation */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-slate-100 pb-2">
                <button
                  onClick={() => setRidersSubTab('dispatch')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    ridersSubTab === 'dispatch'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5 text-amber-400" />
                  <span>Live Dispatch & Assignment Board</span>
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.2 rounded-full">
                    {orders.filter(o => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled').length}
                  </span>
                </button>

                <button
                  onClick={() => setRidersSubTab('fleet')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    ridersSubTab === 'fleet'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Rider Fleet Directory</span>
                  <span className="bg-emerald-200 text-emerald-900 text-[10px] font-black px-2 py-0.2 rounded-full">
                    {riders.length}
                  </span>
                </button>

                <button
                  onClick={() => setRidersSubTab('verifications')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    ridersSubTab === 'verifications'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Rider KYC & Document Approvals</span>
                  <span className={`text-[10px] font-black px-2 py-0.2 rounded-full ${
                    riders.filter(r => r.isApproved === false || r.approvalStatus === 'Pending').length > 0
                      ? 'bg-amber-400 text-slate-950 animate-pulse'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {riders.filter(r => r.isApproved === false || r.approvalStatus === 'Pending').length} Pending
                  </span>
                </button>
              </div>

              {/* KPI Metrics Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-amber-900 uppercase">Unassigned Orders</span>
                  <p className="text-xl font-black text-amber-950">
                    {orders.filter(o => !o.assignedRiderId && o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled').length}
                  </p>
                  <span className="text-[10px] text-amber-800 font-semibold">Needs Rider Dispatch</span>
                </div>

                <div className="bg-amber-500/10 border border-amber-400/40 p-3 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-amber-900 uppercase">Pending KYC Approvals</span>
                  <p className="text-xl font-black text-amber-900">
                    {riders.filter(r => r.isApproved === false || r.approvalStatus === 'Pending').length}
                  </p>
                  <span className="text-[10px] text-amber-800 font-bold">New Partner Submissions</span>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-emerald-900 uppercase">Verified Active Fleet</span>
                  <p className="text-xl font-black text-emerald-950">
                    {riders.filter(r => r.isApproved !== false && r.approvalStatus !== 'Pending').length} / {riders.length}
                  </p>
                  <span className="text-[10px] text-emerald-800 font-semibold">Allowed to Login & Deliver</span>
                </div>

                <div className="bg-purple-50/70 border border-purple-200 p-3 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-purple-900 uppercase">Completed Deliveries</span>
                  <p className="text-xl font-black text-purple-950">
                    {riders.reduce((acc, r) => acc + (r.completedDeliveriesCount || 0), 0)}
                  </p>
                  <span className="text-[10px] text-purple-800 font-semibold">All-Time Fulfilled</span>
                </div>
              </div>
            </div>

            {/* SUB-TAB 1: LIVE DISPATCH BOARD */}
            {ridersSubTab === 'dispatch' && (
              <div className="space-y-4">
                {/* Rider Per KM Rate Info Banner */}
                <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm border border-emerald-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0">
                      <Bike className="w-6 h-6 text-slate-950" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-xs text-white flex items-center gap-2">
                        <span>Rider Distance Earning Rate:</span>
                        <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.2 rounded-full uppercase">
                          ₹{settings.riderPerKmRate ?? 15} / KM
                        </span>
                      </h5>
                      <p className="text-[11px] text-emerald-200 mt-0.5">
                        Distance Pay: ₹{settings.riderPerKmRate ?? 15}/KM + Base Pay: ₹{settings.riderBasePay ?? 25} (Min. ₹{settings.riderMinPayPerOrder ?? 35}/trip)
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Edit Rider Rate (₹/KM)</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Filter Orders:</span>
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800"
                    >
                      <option value="All">All Active Orders</option>
                      <option value="Unassigned">Unassigned Orders Only</option>
                      <option value="Assigned">Rider Assigned</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>

                  <span className="text-xs font-bold text-slate-500">
                    Showing {
                      orders.filter(o => {
                        if (orderStatusFilter === 'Unassigned') return !o.assignedRiderId && o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled';
                        if (orderStatusFilter === 'Assigned') return !!o.assignedRiderId;
                        if (orderStatusFilter === 'Out for Delivery') return o.orderStatus === 'Out for Delivery';
                        if (orderStatusFilter === 'Delivered') return o.orderStatus === 'Delivered';
                        return o.orderStatus !== 'Cancelled';
                      }).length
                    } orders
                  </span>
                </div>

                {/* Orders Dispatch Queue List */}
                <div className="space-y-3">
                  {orders
                    .filter(o => {
                      if (orderStatusFilter === 'Unassigned') return !o.assignedRiderId && o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled';
                      if (orderStatusFilter === 'Assigned') return !!o.assignedRiderId;
                      if (orderStatusFilter === 'Out for Delivery') return o.orderStatus === 'Out for Delivery';
                      if (orderStatusFilter === 'Delivered') return o.orderStatus === 'Delivered';
                      return o.orderStatus !== 'Cancelled';
                    })
                    .map((ord) => {
                      const earningInfo = calculateRiderEarningForOrder(ord, settings);
                      return (
                      <div
                        key={ord.id}
                        className={`bg-white rounded-2xl border p-4 shadow-2xs space-y-3 transition-all ${
                          !ord.assignedRiderId && ord.orderStatus !== 'Delivered'
                            ? 'border-amber-300 ring-2 ring-amber-400/20 bg-amber-50/10'
                            : 'border-slate-200'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 text-sm">{ord.orderNumber}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500 font-medium">{new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              ord.orderStatus === 'Out for Delivery' ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                              ord.orderStatus === 'Delivered' ? 'bg-emerald-100 text-emerald-900' :
                              'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}>
                              {ord.orderStatus}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 font-extrabold text-[11px] px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                              <Navigation className="w-3 h-3 text-emerald-700" />
                              {earningInfo.distanceKm} KM
                            </span>
                            <span className="bg-amber-100 text-amber-950 border border-amber-300 font-black text-[11px] px-2.5 py-0.5 rounded-lg">
                              💰 Rider Pay: ₹{earningInfo.totalEarning}
                            </span>
                            <span className="text-slate-300">|</span>
                            <span className="font-extrabold text-emerald-800">₹{ord.totalAmount} ({ord.paymentMethod})</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs items-center">
                          {/* Customer & Address */}
                          <div className="md:col-span-5 space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Customer & Delivery Address</p>
                            <p className="font-bold text-slate-900 text-sm">{ord.customerName} <span className="text-slate-500 text-xs font-normal">({ord.customerPhone})</span></p>
                            <p className="text-slate-600 font-medium flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span>{ord.address.street}, {ord.address.area}, {ord.address.city} - {ord.address.pincode}</span>
                            </p>
                          </div>

                          {/* Items Summary */}
                          <div className="md:col-span-3 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ordered Items ({ord.items.length})</p>
                            <p className="text-[11px] font-medium text-slate-700 line-clamp-2">
                              {ord.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                            </p>
                          </div>

                          {/* Rider Dispatch Control Panel */}
                          <div className="md:col-span-4 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center justify-between">
                              <span>Delivery Executive Assignment</span>
                              {ord.assignedRiderName && (
                                <span className="text-emerald-700 font-bold text-[10px] bg-emerald-100 px-2 py-0.2 rounded-full">
                                  ✓ Assigned
                                </span>
                              )}
                            </p>

                            {ord.assignedRiderName ? (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-extrabold text-slate-900 text-xs flex items-center gap-1">
                                      <Bike className="w-3.5 h-3.5 text-emerald-600" />
                                      {ord.assignedRiderName}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-medium">
                                      📞 {ord.assignedRiderPhone} • {ord.assignedRiderVehicle}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handleUnassignRider(ord.id)}
                                    className="text-[10px] text-rose-700 hover:text-rose-900 font-extrabold hover:underline"
                                  >
                                    Unassign
                                  </button>
                                </div>

                                <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                                  <button
                                    onClick={() => handleOpenAssignRiderModal(ord)}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all"
                                  >
                                    Re-assign Rider
                                  </button>

                                  {ord.orderStatus !== 'Delivered' && (
                                    <button
                                      onClick={() => handleOrderStatusChange(ord.id, 'Delivered')}
                                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-black px-3 py-1 rounded-lg transition-all flex items-center gap-1 shadow-2xs"
                                    >
                                      <CheckCircle className="w-3 h-3 text-amber-400" />
                                      <span>Mark Delivered</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-[11px] font-semibold text-amber-900 bg-amber-100/70 p-1.5 rounded-lg border border-amber-200/80">
                                  ⚠️ No rider assigned yet. Select available rider from fleet:
                                </p>
                                <button
                                  onClick={() => handleOpenAssignRiderModal(ord)}
                                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-2 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <UserPlus className="w-4 h-4" />
                                  <span>Assign Rider to Order #{ord.orderNumber}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SUB-TAB 2: RIDER FLEET DIRECTORY */}
            {ridersSubTab === 'fleet' && (
              <div className="space-y-4">
                {/* Search & Duty Filter Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search rider name, phone, zone..."
                      value={riderSearchQuery}
                      onChange={(e) => setRiderSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <span className="text-xs font-bold text-slate-500 shrink-0">Duty Status:</span>
                    <select
                      value={riderFilterStatus}
                      onChange={(e) => setRiderFilterStatus(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800"
                    >
                      <option value="All">All Duty Statuses</option>
                      <option value="Available">Available Only</option>
                      <option value="On Delivery">On Delivery</option>
                      <option value="Off Duty">Off Duty</option>
                    </select>
                  </div>
                </div>

                {/* Rider Fleet Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {riders
                    .filter(r => {
                      const matchesStatus = riderFilterStatus === 'All' || r.status === riderFilterStatus;
                      const matchesSearch = !riderSearchQuery.trim() ||
                        r.name.toLowerCase().includes(riderSearchQuery.toLowerCase()) ||
                        r.phone.includes(riderSearchQuery) ||
                        r.vehicleNumber.toLowerCase().includes(riderSearchQuery.toLowerCase()) ||
                        r.assignedZone.toLowerCase().includes(riderSearchQuery.toLowerCase());
                      return matchesStatus && matchesSearch;
                    })
                    .map((rider) => (
                      <div key={rider.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 relative hover:border-slate-300 transition-all">
                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-900 text-amber-400 flex items-center justify-center font-black text-lg shrink-0 shadow-xs">
                              {rider.vehicleType === 'Bike' ? <Bike className="w-6 h-6" /> : <Truck className="w-6 h-6" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-slate-900 text-sm">{rider.name}</h4>
                                <span className="flex items-center gap-0.5 text-amber-600 font-extrabold text-[11px] bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  {rider.rating}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 font-medium">📞 {rider.phone} {rider.email ? `• ${rider.email}` : ''}</p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <select
                              value={rider.status}
                              onChange={(e) => handleUpdateRiderDutyStatus(rider.id, e.target.value as any)}
                              className={`text-[10px] font-black px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                rider.status === 'Available' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                                rider.status === 'On Delivery' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                                'bg-slate-100 text-slate-600 border-slate-300'
                              }`}
                            >
                              <option value="Available">🟢 Available</option>
                              <option value="On Delivery">🟡 On Delivery</option>
                              <option value="Off Duty">⚪ Off Duty</option>
                            </select>
                            <span className="text-[10px] text-slate-400 font-medium">Joined {rider.joinedDate}</span>
                          </div>
                        </div>

                        {/* Vehicle & Zone Info */}
                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Vehicle Details</span>
                            <p className="font-bold text-slate-800">{rider.vehicleType} — <span className="font-mono text-emerald-800">{rider.vehicleNumber}</span></p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Zone</span>
                            <p className="font-bold text-slate-800 truncate">{rider.assignedZone}</p>
                          </div>
                        </div>

                        {/* Deliveries Performance Bar */}
                        <div className="flex items-center justify-between text-xs pt-1">
                          <div className="flex items-center gap-4">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">Active Jobs</span>
                              <span className="font-black text-amber-700 text-sm">{rider.assignedOrdersCount || 0}</span>
                            </div>
                            <div className="border-l border-slate-200 pl-4">
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">Completed</span>
                              <span className="font-black text-emerald-800 text-sm">{rider.completedDeliveriesCount || 0} Jobs</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenEditRiderModal(rider)}
                              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all font-bold text-xs flex items-center gap-1 cursor-pointer"
                              title="Edit Rider Details"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => handleDeleteRiderClick(rider.id)}
                              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition-all font-bold text-xs cursor-pointer"
                              title="Delete Rider"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* SUB-TAB 3: RIDER KYC & DOCUMENT APPROVALS */}
            {ridersSubTab === 'verifications' && (
              <div className="space-y-4">
                <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-sm space-y-2 border border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-6 h-6 text-amber-400" />
                      <div>
                        <h4 className="font-black text-sm text-amber-400">Rider Onboarding & Verification Management</h4>
                        <p className="text-xs text-slate-300">Verify driving licenses, Aadhar cards, and vehicle documents before granting login access</p>
                      </div>
                    </div>
                    <span className="bg-amber-400 text-slate-950 px-3 py-1 rounded-full text-xs font-black shadow-xs">
                      {riders.filter(r => r.isApproved === false || r.approvalStatus === 'Pending').length} Pending Requests
                    </span>
                  </div>
                </div>

                {riders.length === 0 ? (
                  <div className="bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-500 space-y-2">
                    <Bike className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-700">No rider registration submissions yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {riders.map((rider) => {
                      const isPending = rider.isApproved === false || rider.approvalStatus === 'Pending';
                      const isApproved = rider.isApproved === true || rider.approvalStatus === 'Approved';
                      const isRejected = rider.approvalStatus === 'Rejected';

                      return (
                        <div
                          key={rider.id}
                          className={`bg-white rounded-2xl border p-5 space-y-4 shadow-2xs transition-all ${
                            isPending ? 'border-amber-400 ring-2 ring-amber-400/20' :
                            isRejected ? 'border-rose-300 bg-rose-50/20' :
                            'border-slate-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-lg shrink-0">
                                {rider.documents?.profilePhotoUrl ? (
                                  <img src={rider.documents.profilePhotoUrl} alt={rider.name} className="w-full h-full object-cover rounded-2xl" />
                                ) : (
                                  rider.name.charAt(0)
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-extrabold text-slate-900 text-base">{rider.name}</h4>
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                                    isPending ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse' :
                                    isApproved ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                                    'bg-rose-100 text-rose-900 border-rose-300'
                                  }`}>
                                    {isPending ? '⏳ PENDING ADMIN APPROVAL' : isApproved ? '✅ VERIFIED & ALLOWED TO LOG IN' : '❌ APPLICATION REJECTED'}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 font-medium">
                                  📞 Mobile: <strong className="text-slate-900">{rider.phone}</strong> • Zone: <strong>{rider.assignedZone}</strong> • Submitted: <strong>{rider.joinedDate}</strong>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              {isPending && (
                                <>
                                  <button
                                    onClick={() => handleApproveRider(rider.id, true)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                                  >
                                    <CheckCircle className="w-4 h-4 text-amber-300" />
                                    <span>Verify & Approve Rider</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      const reason = prompt("Enter rejection reason (optional):", "Incomplete license or invalid identity documents.");
                                      if (reason !== null) {
                                        handleApproveRider(rider.id, false, reason);
                                      }
                                    }}
                                    className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    <span>Reject</span>
                                  </button>
                                </>
                              )}

                              {isApproved && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Revoke approval for ${rider.name}? They will no longer be allowed to log in.`)) {
                                      handleApproveRider(rider.id, false, "Approval revoked by Admin");
                                    }
                                  }}
                                  className="bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold text-xs px-3 py-1.5 rounded-xl border border-slate-200 transition-all cursor-pointer"
                                >
                                  Revoke Approval
                                </button>
                              )}

                              {isRejected && (
                                <button
                                  onClick={() => handleApproveRider(rider.id, true)}
                                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Re-Approve Rider</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Rejection Reason Notice */}
                          {rider.rejectionReason && (
                            <div className="bg-rose-100/80 border border-rose-300 p-2.5 rounded-xl text-xs text-rose-900 font-bold">
                              ❌ Rejection Reason: <span className="font-normal">{rider.rejectionReason}</span>
                            </div>
                          )}

                          {/* Vehicle Details & Submitted Documents */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Vehicle Type</span>
                                <p className="font-extrabold text-slate-900">{rider.vehicleType}</p>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Vehicle Reg No.</span>
                                <p className="font-mono font-bold text-emerald-800">{rider.vehicleNumber}</p>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Driving License</span>
                                <p className="font-mono font-bold text-slate-900">{rider.documents?.drivingLicenseNumber || 'TN33 2024009876'}</p>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Aadhar Card</span>
                                <p className="font-mono font-bold text-slate-900">{rider.documents?.aadharNumber || '4521 8890 1234'}</p>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-200/60">
                              <span className="text-[10px] font-extrabold text-slate-500 uppercase block mb-2">Submitted Verification Documents Dossier:</span>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="bg-white p-2 rounded-xl border border-slate-200 text-center space-y-1">
                                  <span className="text-[10px] font-black text-slate-700 block">📄 Driving License</span>
                                  <img
                                    src={rider.documents?.drivingLicenseUrl || "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80"}
                                    alt="DL"
                                    className="w-full h-24 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90"
                                    onClick={() => window.open(rider.documents?.drivingLicenseUrl || "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80", "_blank")}
                                  />
                                </div>

                                <div className="bg-white p-2 rounded-xl border border-slate-200 text-center space-y-1">
                                  <span className="text-[10px] font-black text-slate-700 block">🪪 Aadhar Card</span>
                                  <img
                                    src={rider.documents?.aadharCardUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80"}
                                    alt="Aadhar"
                                    className="w-full h-24 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90"
                                    onClick={() => window.open(rider.documents?.aadharCardUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80", "_blank")}
                                  />
                                </div>

                                <div className="bg-white p-2 rounded-xl border border-slate-200 text-center space-y-1">
                                  <span className="text-[10px] font-black text-slate-700 block">🏍️ Vehicle RC</span>
                                  <img
                                    src={rider.documents?.vehicleRcUrl || "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80"}
                                    alt="Vehicle RC"
                                    className="w-full h-24 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90"
                                    onClick={() => window.open(rider.documents?.vehicleRcUrl || "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80", "_blank")}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* 5. CUSTOMERS TAB */}
        {activeTab === 'customers' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden animate-in fade-in duration-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-[10px] font-bold text-slate-500">
                <tr>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Phone / Email</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Total Orders</th>
                  <th className="p-3">Total Spend</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{c.name}</td>
                    <td className="p-3">
                      <p className="font-bold text-slate-800">{c.phone}</p>
                      <p className="text-[10px] text-slate-400">{c.email}</p>
                    </td>
                    <td className="p-3">{c.city} - {c.pincode}</td>
                    <td className="p-3 font-extrabold">{c.totalOrders}</td>
                    <td className="p-3 font-black text-emerald-800">₹{c.totalSpent}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === "Active" ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"
                      }`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. COUPONS TAB */}
        {activeTab === 'coupons' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <h3 className="font-extrabold text-sm text-slate-900">Promotional Discount Coupons</h3>
              <button
                onClick={() => setShowAddCouponModal(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Coupon</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {coupons.map((coup) => (
                <div key={coup.code} className="bg-amber-50 border border-amber-200 p-4 rounded-2xl shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-amber-900 bg-amber-200/80 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                      {coup.code}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">Active</span>
                  </div>
                  <p className="text-xs text-amber-950 font-medium">{coup.description}</p>
                  <div className="text-[11px] font-bold text-amber-900 pt-2 border-t border-amber-200/80 flex justify-between">
                    <span>
                      Discount: {coup.discountType === 'fixed' ? `₹${coup.discountValue}` : `${coup.discountValue}%`}
                    </span>
                    <span>Min Order: ₹{coup.minOrderValue}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Store Sales & Revenue Reports</h3>
                <p className="text-xs text-slate-500">Summary performance data for Nethaji Mini Mart</p>
              </div>
              <button
                onClick={() => alert("Report exported successfully as CSV/PDF!")}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Export Report Data
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <p className="font-bold text-slate-500 uppercase">Gross Sales</p>
                <p className="text-2xl font-black text-emerald-800">₹{stats?.monthlyRevenue || 0}</p>
                <p className="text-[11px] text-slate-500">Includes all delivered & active orders</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <p className="font-bold text-slate-500 uppercase">Average Order Value (AOV)</p>
                <p className="text-2xl font-black text-slate-900">
                  ₹{stats?.totalOrdersCount ? Math.round((stats.monthlyRevenue || 0) / stats.totalOrdersCount) : 0}
                </p>
                <p className="text-[11px] text-slate-500">Per customer grocery transaction</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <p className="font-bold text-slate-500 uppercase">Total Inventory Value</p>
                <p className="text-2xl font-black text-slate-900">
                  ₹{products.reduce((sum, p) => sum + p.price * p.stock, 0)}
                </p>
                <p className="text-[11px] text-slate-500">Across {products.length} products in stock</p>
              </div>

              <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 text-xs space-y-2">
                <p className="font-bold text-emerald-800 uppercase flex items-center gap-1">
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" /> Total Product Shares
                </p>
                <p className="text-2xl font-black text-emerald-900">
                  {products.reduce((sum, p) => sum + (p.shareCount || 0), 0)}
                </p>
                <p className="text-[11px] text-emerald-700 font-medium">Logged social share interactions</p>
              </div>
            </div>

            {/* Product Share Analytics Report Section */}
            <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-emerald-700" />
                    <span>Product Share Report & Customer Virality</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Ranking of grocery products by customer shares on WhatsApp and direct copy links
                  </p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-bold text-[11px] px-2.5 py-1 rounded-full">
                  Event Tracker Active
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="p-3 w-12 text-center">Rank</th>
                      <th className="p-3">Product Item</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Shares Count</th>
                      <th className="p-3">Share Volume Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {[...products]
                      .sort((a, b) => (b.shareCount || 0) - (a.shareCount || 0))
                      .map((p, idx) => {
                        const totalShares = products.reduce((sum, pr) => sum + (pr.shareCount || 0), 0) || 1;
                        const pct = Math.round(((p.shareCount || 0) / totalShares) * 100);
                        return (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="p-3 text-center font-black text-slate-400">
                              #{idx + 1}
                            </td>
                            <td className="p-3 flex items-center gap-2.5">
                              <img src={p.image} alt={p.name} className="w-8 h-8 object-contain rounded border border-slate-200 bg-white p-0.5" />
                              <div>
                                <p className="font-bold text-slate-900">{p.name}</p>
                                <p className="text-[10px] text-slate-400">{p.unit}</p>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                                {p.category}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-slate-900">₹{p.price}</td>
                            <td className="p-3">
                              <span className="bg-emerald-100 text-emerald-900 font-black px-2.5 py-0.5 rounded text-[11px] inline-flex items-center gap-1">
                                <Share2 className="w-3 h-3 text-emerald-700" />
                                {p.shareCount || 0} shares
                              </span>
                            </td>
                            <td className="p-3 w-48">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-emerald-600 h-full rounded-full transition-all duration-300" 
                                    style={{ width: `${Math.max(pct, 4)}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 w-8">{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PINCODES & SPECIFIC LOCATION DELIVERY APPROVAL TAB */}
        {activeTab === 'pincodes' && settings && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Banner */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow-md shrink-0">
                  <MapPin className="w-7 h-7 text-slate-900" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <span>SPECIFIC LOCATION & PINCODE APPROVAL MANAGER</span>
                    <span className="bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                      SUPERADMIN & ADMIN CONTROL
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure serviceable areas, delivery zones, SLA timelines, and enforce pincode-level order approval.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(settings.approvedPincodes || []).length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllPincodes}
                    className="bg-rose-900/80 hover:bg-rose-800 text-rose-100 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-rose-700/60 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                    <span>Clear All Locations</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleOpenAddPincodeModal}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-slate-950" />
                  <span>Add Approved Location</span>
                </button>
              </div>
            </div>

            {/* Enforce Pincode Approval Toggle Switch Banner */}
            <div className={`p-5 rounded-2xl border transition-all shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              settings.enforceApprovedPincodes
                ? 'bg-emerald-950/20 border-emerald-500/40'
                : 'bg-amber-950/20 border-amber-500/40'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl text-white font-bold shrink-0 ${
                  settings.enforceApprovedPincodes ? 'bg-emerald-600' : 'bg-amber-600'
                }`}>
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span>Enforce Pincode Delivery Approval</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase ${
                      settings.enforceApprovedPincodes
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {settings.enforceApprovedPincodes ? 'ACTIVE & ENFORCED' : 'DISABLED (OPEN ALL)'}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                    When <span className="font-bold text-slate-900">ENFORCED</span>, customers can only select or checkout using PIN codes explicitly listed in the approved database below. Unapproved PIN codes will be automatically blocked in header location modal & checkout.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleEnforcePincode}
                className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-2 shrink-0 ${
                  settings.enforceApprovedPincodes
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                }`}
              >
                <span>{settings.enforceApprovedPincodes ? 'Switch to Open Delivery' : 'Enforce Pincodes Approval'}</span>
              </button>
            </div>

            {/* Quick KPI Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-bold">Approved Hubs</span>
                  <MapPin className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xl font-black text-slate-900">
                  {settings.approvedPincodes?.length || 0} Locations
                </div>
                <div className="text-[10px] text-emerald-700 font-bold mt-1">
                  {settings.approvedPincodes?.filter(p => p.active).length || 0} Currently Active
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-bold">Serviceable Cities</span>
                  <Building2 className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-xl font-black text-slate-900">
                  {new Set((settings.approvedPincodes || []).map(p => p.city)).size} Cities
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-1">
                  Metro & Regional Hubs
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-bold">Free Delivery Hubs</span>
                  <Sparkles className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-xl font-black text-slate-900">
                  {(settings.approvedPincodes || []).filter(p => (p.customDeliveryFee ?? 0) === 0).length} Hubs
                </div>
                <div className="text-[10px] text-blue-700 font-bold mt-1">
                  Zero Delivery Charge
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-bold">Avg. SLA Timeline</span>
                  <Clock className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-xl font-black text-slate-900">
                  15-30 Mins
                </div>
                <div className="text-[10px] text-purple-700 font-bold mt-1">
                  Express Home Delivery
                </div>
              </div>
            </div>

            {/* Search Filter & Table Container */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={pincodeSearchTerm}
                    onChange={(e) => setPincodeSearchTerm(e.target.value)}
                    placeholder="Search by pincode, city, or area..."
                    className="w-full bg-white border border-slate-200 text-xs font-medium pl-9 pr-3 py-2 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <span className="text-xs font-bold text-slate-500">
                  Showing {(settings.approvedPincodes || []).filter(p => 
                    p.pincode.includes(pincodeSearchTerm) ||
                    p.city.toLowerCase().includes(pincodeSearchTerm.toLowerCase()) ||
                    p.area.toLowerCase().includes(pincodeSearchTerm.toLowerCase())
                  ).length} approved pincodes
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Pincode</th>
                      <th className="p-3.5">City & Region / Area</th>
                      <th className="p-3.5">Delivery SLA</th>
                      <th className="p-3.5 text-center">Min. Order (₹)</th>
                      <th className="p-3.5 text-center">Delivery Fee (₹)</th>
                      <th className="p-3.5 text-center">Approval Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(settings.approvedPincodes || []).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center bg-slate-50/50">
                          <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-700">No Approved Pincode Locations Configured</p>
                          <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                            Add custom pincodes and city hubs using "+ Add Approved Location" above to control serviceable areas.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      (settings.approvedPincodes || [])
                        .filter(p => 
                          p.pincode.includes(pincodeSearchTerm) ||
                          p.city.toLowerCase().includes(pincodeSearchTerm.toLowerCase()) ||
                          p.area.toLowerCase().includes(pincodeSearchTerm.toLowerCase())
                        )
                        .map((pin) => (
                          <tr key={pin.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3.5 font-black text-slate-900">
                              <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-mono text-xs">
                                {pin.pincode}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <div className="font-extrabold text-slate-900">{pin.city}</div>
                              <div className="text-[11px] text-slate-500 font-medium">{pin.area}</div>
                            </td>
                            <td className="p-3.5">
                              <span className="bg-amber-50 text-amber-800 font-bold text-[11px] px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1 w-fit">
                                <Clock className="w-3 h-3 text-amber-600" />
                                {pin.estimatedDeliveryTime || '15-20 Mins'}
                              </span>
                            </td>
                            <td className="p-3.5 text-center font-bold text-slate-800">
                              {pin.minimumOrderValue && pin.minimumOrderValue > 0 ? `₹${pin.minimumOrderValue}` : 'No Min'}
                            </td>
                            <td className="p-3.5 text-center font-bold">
                              {(pin.customDeliveryFee ?? 0) === 0 ? (
                                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-black text-[10px]">
                                  FREE
                                </span>
                              ) : (
                                <span className="text-slate-900">₹{pin.customDeliveryFee}</span>
                              )}
                            </td>
                            <td className="p-3.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleTogglePincodeActive(pin.id)}
                                className={`px-3 py-1 rounded-full text-[10px] font-black cursor-pointer transition-all ${
                                  pin.active
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                                }`}
                              >
                                {pin.active ? '✓ APPROVED' : 'INACTIVE'}
                              </button>
                            </td>
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditPincodeModal(pin)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
                                  title="Edit Pincode Approval"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePincode(pin.id)}
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer transition-colors"
                                  title="Delete Approved Pincode"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 8. STORE SETTINGS TAB */}
        {activeTab === 'settings' && settings && (
          <div className="space-y-6 max-w-2xl animate-in fade-in duration-200">
            {/* SUPER ADMIN AUTHORIZATION KEY CONTROL PANEL */}
            {isSuperAdmin && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 p-6 rounded-2xl border border-amber-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0">
                      <KeyRound className="w-5 h-5 text-slate-900" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-amber-950 flex items-center gap-2">
                        <span>Store Admin Authorization Key</span>
                        <span className="bg-amber-200/80 text-amber-950 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Super Admin Only
                        </span>
                      </h4>
                      <p className="text-[11px] text-amber-800 font-medium">
                        Key required for staff when registering a new Store Admin account
                      </p>
                    </div>
                  </div>
                </div>

                {securityKeyError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{securityKeyError}</span>
                  </div>
                )}

                {securityKeySuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium">{securityKeySuccess}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateSecurityKey} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-amber-900 mb-1">
                      Current Store Admin Authorization Key
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-amber-600 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={securityKeyInput}
                        onChange={(e) => setSecurityKeyInput(e.target.value)}
                        className="w-full bg-white border border-amber-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                        placeholder="e.g. nethajiminimart"
                      />
                    </div>
                    <p className="text-[10px] text-amber-800/80 mt-1">
                      Active Authorization Key: <span className="font-mono font-bold text-slate-900 bg-amber-100 px-1.5 py-0.5 rounded">{securityKeyInput}</span>. Updating this key will immediately enforce it for any subsequent staff admin registrations.
                    </p>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={securityKeyLoading}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2 disabled:opacity-60"
                    >
                      {securityKeyLoading ? (
                        <span>Updating Key...</span>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4 text-slate-950" />
                          <span>Update Authorization Key</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-200 pb-2">
              Nethaji Mini Mart – Store Profile Settings
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Store Name</label>
                <input
                  type="text"
                  required
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Store Helpline Phone</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                />
              </div>

              {/* DEDICATED STORE LOGO & BRANDING IDENTITY CHANGE CARD */}
              <div className="sm:col-span-2 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white p-5 rounded-2xl border border-slate-700 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shrink-0">
                      <ImageIcon className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                        <span>Store Logo & Brand Identity</span>
                        <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Store Logo Option
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-300 font-medium">
                        Change store logo image displayed on App Header, Mobile Navigation, Footer & Tax Invoices
                      </p>
                    </div>
                  </div>

                  {settings.logoUrl ? (
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, logoUrl: "" })}
                      className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700 text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Custom Logo</span>
                    </button>
                  ) : (
                    <span className="bg-slate-800 text-amber-400 text-[11px] font-extrabold px-3 py-1 rounded-xl border border-slate-700 shrink-0">
                      Default Shopping Icon Logo Active
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  {/* Current Logo Display Preview Box */}
                  <div className="md:col-span-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-2">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
                      Live Header Logo Preview
                    </span>
                    <div className="w-20 h-20 rounded-2xl bg-white border-2 border-emerald-500/80 p-1.5 flex items-center justify-center shadow-md relative group">
                      {settings.logoUrl ? (
                        <img
                          src={settings.logoUrl}
                          alt="Store Logo Preview"
                          className="w-full h-full object-contain rounded-xl"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full rounded-xl bg-gradient-to-tr from-emerald-700 to-emerald-600 flex items-center justify-center text-amber-400">
                          <ShoppingCart className="w-9 h-9" />
                        </div>
                      )}
                    </div>
                    <div className="text-[11px]">
                      <span className="font-extrabold text-white">{settings.storeName || "NETHAJI MINI MART"}</span>
                      <p className="text-[10px] text-slate-400 font-medium truncate max-w-[180px]">
                        {settings.logoUrl ? "Custom Image Logo Active" : "Default Shopping Icon"}
                      </p>
                    </div>
                  </div>

                  {/* Logo Options Input & Upload */}
                  <div className="md:col-span-8 space-y-3">
                    <div>
                      <label className="block font-extrabold text-xs text-amber-300 mb-1.5">
                        Store Logo Image URL (or Upload Image File below)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://example.com/logo.png"
                          value={settings.logoUrl || ""}
                          onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-2.5 font-medium text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                        />
                        {settings.logoUrl && (
                          <button
                            type="button"
                            onClick={() => setSettings({ ...settings, logoUrl: "" })}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 rounded-xl text-xs font-bold border border-slate-700 cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Direct Local Image Upload Handler */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <div className="flex-1 text-left">
                        <span className="font-bold text-xs text-slate-200 block">📁 Direct Local Image File Upload</span>
                        <p className="text-[10px] text-slate-400">Select PNG, JPG, WEBP logo image from device</p>
                      </div>
                      <label className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs shrink-0 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Browse & Upload Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  setSettings({ ...settings, logoUrl: String(event.target.result) });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* Quick Preset Sample Store Logos */}
                    <div>
                      <span className="block font-bold text-[11px] text-slate-300 mb-1">
                        ⚡ Quick Select Preset Store Logos:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          {
                            title: "Fresh Grocery Basket",
                            url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80"
                          },
                          {
                            title: "Supermarket Mart",
                            url: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200&auto=format&fit=crop&q=80"
                          },
                          {
                            title: "Green Fresh Market",
                            url: "https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?w=200&auto=format&fit=crop&q=80"
                          },
                          {
                            title: "Indian Organic Store",
                            url: "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=200&auto=format&fit=crop&q=80"
                          }
                        ].map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSettings({ ...settings, logoUrl: preset.url })}
                            className={`p-1.5 rounded-xl border transition-all text-left flex items-center gap-2 cursor-pointer ${
                              settings.logoUrl === preset.url
                                ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <img src={preset.url} alt={preset.title} className="w-7 h-7 object-cover rounded-lg shrink-0" />
                            <span className="text-[10px] font-bold truncate">{preset.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* DEDICATED GST & TAX CONFIGURATION CARD */}
              <div className="sm:col-span-2 bg-gradient-to-br from-amber-50/90 via-amber-50/40 to-orange-50/40 p-5 rounded-2xl border border-amber-200/90 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0">
                      🏷️
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-amber-950 flex items-center gap-2">
                        <span>GST & Tax Compliance Settings</span>
                        <span className="bg-amber-200 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Indian Tax Engine
                        </span>
                      </h4>
                      <p className="text-[11px] text-amber-800 font-medium">
                        Configure store GSTIN identification, default tax percentage, and automated tax billing options
                      </p>
                    </div>
                  </div>

                  <span className="bg-emerald-100 text-emerald-900 font-extrabold text-[11px] px-3 py-1 rounded-xl border border-emerald-300 shrink-0">
                    Active GST Rate: {settings.gstPercentage ?? 5}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* GSTIN Number */}
                  <div>
                    <label className="block font-extrabold text-amber-950 mb-1">
                      GSTIN Number (15-Digit Tax ID) *
                    </label>
                    <input
                      type="text"
                      required
                      value={settings.gstin}
                      onChange={(e) => setSettings({ ...settings, gstin: e.target.value.toUpperCase() })}
                      className="w-full bg-white border border-amber-300 rounded-xl p-2.5 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase shadow-2xs"
                      placeholder="e.g. 33AAAAA0000A1Z5"
                    />
                    <p className="text-[10px] text-amber-800/80 mt-1 font-medium">
                      Appears on customer tax invoices & receipts
                    </p>
                  </div>

                  {/* Store Default GST Percentage */}
                  <div>
                    <label className="block font-extrabold text-amber-950 mb-1">
                      Default Store GST Percentage (%)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={28}
                        step={0.5}
                        required
                        value={settings.gstPercentage ?? 5}
                        onChange={(e) => setSettings({ ...settings, gstPercentage: Number(e.target.value) })}
                        className="w-24 bg-white border border-amber-300 rounded-xl p-2.5 font-extrabold text-slate-900 focus:ring-2 focus:ring-amber-500 shadow-2xs text-center"
                      />
                      <span className="font-extrabold text-amber-900 text-sm">%</span>
                      
                      {/* Quick Preset Buttons */}
                      <div className="flex items-center gap-1 overflow-x-auto">
                        {[0, 5, 12, 18, 28].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => setSettings({ ...settings, gstPercentage: rate })}
                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                              (settings.gstPercentage ?? 5) === rate
                                ? 'bg-amber-500 text-slate-950 border border-amber-600 shadow-xs'
                                : 'bg-white text-slate-700 border border-amber-200 hover:bg-amber-100'
                            }`}
                          >
                            {rate}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* GST Calculation Mode */}
                  <div>
                    <label className="block font-extrabold text-amber-950 mb-1">
                      GST Tax Inclusion Mode
                    </label>
                    <select
                      value={settings.gstTaxType || 'Inclusive'}
                      onChange={(e) => setSettings({ ...settings, gstTaxType: e.target.value as 'Inclusive' | 'Exclusive' })}
                      className="w-full bg-white border border-amber-300 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 shadow-2xs"
                    >
                      <option value="Inclusive">Price Inclusive of GST Tax (MRP includes GST)</option>
                      <option value="Exclusive">Price Exclusive of GST (Added at Checkout)</option>
                    </select>
                  </div>

                  {/* Options Toggles */}
                  <div className="space-y-2 pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.enableGstInvoice !== false}
                        onChange={(e) => setSettings({ ...settings, enableGstInvoice: e.target.checked })}
                        className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-amber-950">
                        Generate Print Tax Invoice with CGST / SGST Breakups
                      </span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showHsnCodes !== false}
                        onChange={(e) => setSettings({ ...settings, showHsnCodes: e.target.checked })}
                        className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-amber-950">
                        Print HSN/SAC Codes on Order Invoices
                      </span>
                    </label>
                  </div>
                </div>

                {/* Compliance Summary Footer */}
                <div className="bg-amber-100/70 p-3 rounded-xl border border-amber-300/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-amber-900 font-bold gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 font-black">✓ GST TAX READY</span>
                    <span>• GSTIN: <code className="bg-white px-1.5 py-0.5 rounded border border-amber-200 font-mono text-slate-900">{settings.gstin || '33AAAAA0000A1Z5'}</code></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>CGST: {(settings.gstPercentage ?? 5) / 2}%</span>
                    <span>SGST: {(settings.gstPercentage ?? 5) / 2}%</span>
                    <span>Total: {settings.gstPercentage ?? 5}%</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Store Contact Email</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Store Physical Address</label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Free Delivery Order Threshold (₹)</label>
                <input
                  type="number"
                  value={settings.freeDeliveryThreshold}
                  onChange={(e) => setSettings({ ...settings, freeDeliveryThreshold: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Default Delivery Charge (₹)</label>
                <input
                  type="number"
                  value={settings.defaultDeliveryFee}
                  onChange={(e) => setSettings({ ...settings, defaultDeliveryFee: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Top Announcement Notice Banner</label>
                <input
                  type="text"
                  value={settings.noticeBanner}
                  onChange={(e) => setSettings({ ...settings, noticeBanner: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                />
              </div>

              {/* DEDICATED RIDER EARNINGS & PER-KM DISTANCE RATE CARD */}
              <div className="sm:col-span-2 bg-gradient-to-br from-emerald-50/90 via-emerald-50/40 to-teal-50/40 p-5 rounded-2xl border border-emerald-200/90 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-emerald-200/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                      <Bike className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-emerald-950 flex items-center gap-2">
                        <span>Delivery Rider Earning & Distance Rate Settings</span>
                        <span className="bg-emerald-200 text-emerald-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Per KM Engine
                        </span>
                      </h4>
                      <p className="text-[11px] text-emerald-800 font-medium">
                        Configure delivery partner compensation based on trip distance in kilometers (Per KM Rate + Base Pay)
                      </p>
                    </div>
                  </div>

                  <span className="bg-emerald-700 text-white font-extrabold text-[11px] px-3 py-1 rounded-xl shadow-xs shrink-0">
                    Active Rate: ₹{settings.riderPerKmRate ?? 15} / KM
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Per KM Rate */}
                  <div>
                    <label className="block font-extrabold text-emerald-950 mb-1">
                      Rider Earning Rate Per KM (₹ / KM) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        step={0.5}
                        required
                        value={settings.riderPerKmRate ?? 15}
                        onChange={(e) => setSettings({ ...settings, riderPerKmRate: Number(e.target.value) })}
                        className="w-full bg-white border border-emerald-300 rounded-xl p-2.5 font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-2xs"
                      />
                      <span className="absolute right-3 top-2.5 font-bold text-xs text-emerald-700">₹ / KM</span>
                    </div>
                    <p className="text-[10px] text-emerald-800/80 mt-1 font-medium">
                      Multiplied by total delivery trip distance in KM
                    </p>
                  </div>

                  {/* Rider Base Pay */}
                  <div>
                    <label className="block font-extrabold text-emerald-950 mb-1">
                      Rider Base Pay Per Order (₹) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={500}
                        step={1}
                        required
                        value={settings.riderBasePay ?? 25}
                        onChange={(e) => setSettings({ ...settings, riderBasePay: Number(e.target.value) })}
                        className="w-full bg-white border border-emerald-300 rounded-xl p-2.5 font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-2xs"
                      />
                      <span className="absolute right-3 top-2.5 font-bold text-xs text-emerald-700">₹ / Order</span>
                    </div>
                    <p className="text-[10px] text-emerald-800/80 mt-1 font-medium">
                      Fixed pickup & drop convenience pay
                    </p>
                  </div>

                  {/* Minimum Guaranteed Pay */}
                  <div>
                    <label className="block font-extrabold text-emerald-950 mb-1">
                      Minimum Guaranteed Pay (₹) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={500}
                        step={1}
                        required
                        value={settings.riderMinPayPerOrder ?? 35}
                        onChange={(e) => setSettings({ ...settings, riderMinPayPerOrder: Number(e.target.value) })}
                        className="w-full bg-white border border-emerald-300 rounded-xl p-2.5 font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-2xs"
                      />
                      <span className="absolute right-3 top-2.5 font-bold text-xs text-emerald-700">₹ / Trip</span>
                    </div>
                    <p className="text-[10px] text-emerald-800/80 mt-1 font-medium">
                      Floor payout if calculated total is lower
                    </p>
                  </div>
                </div>

                {/* Calculation Example Card */}
                <div className="bg-white/90 p-3.5 rounded-xl border border-emerald-300 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-950 font-bold gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 font-black text-[10px] bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                      💡 LIVE EARNING FORMULA
                    </span>
                    <span>
                      Total Earning = Max(₹{settings.riderMinPayPerOrder ?? 35}, Distance × ₹{settings.riderPerKmRate ?? 15}/KM + ₹{settings.riderBasePay ?? 25})
                    </span>
                  </div>
                  <div className="bg-emerald-100/80 px-3 py-1 rounded-lg border border-emerald-300 text-[11px] text-emerald-900 shrink-0 font-extrabold">
                    Example 4.0 KM Trip = <span className="text-emerald-800 font-black text-sm">₹{Math.max((settings.riderMinPayPerOrder ?? 35), Math.round(4 * (settings.riderPerKmRate ?? 15) + (settings.riderBasePay ?? 25)))}</span>
                  </div>
                </div>
              </div>

              {/* Payment QR Code Summary in Store Settings */}
              <div className="sm:col-span-2 bg-gradient-to-r from-slate-900 to-emerald-950 text-white p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 border border-emerald-800 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shrink-0">
                    <QrCode className="w-5 h-5 text-slate-950" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-white flex items-center gap-2">
                      <span>Checkout Payment UPI QR Code</span>
                      <span className="bg-emerald-400 text-slate-950 font-black text-[9px] px-2 py-0.2 rounded-full uppercase">
                        Active
                      </span>
                    </h5>
                    <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                      VPA: {settings.paymentUpiId || 'nethaji.mart@upi'} ({settings.paymentMerchantName || 'Nethaji Mini Mart'})
                    </p>
                  </div>
                </div>

                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('superadmin');
                      setTimeout(() => {
                        document.getElementById('payment-qr-superadmin-section')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-slate-950" />
                    <span>Edit Payment QR Code (Super Admin OTP)</span>
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-md cursor-pointer"
            >
              Save Store Settings
            </button>
          </form>
        </div>
        )}

        {/* 9. SUPER ADMIN PANEL TAB */}
        {activeTab === 'superadmin' && isSuperAdmin && (
          <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
            {/* Header Title */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow-md">
                  <KeyRound className="w-7 h-7 text-slate-900" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <span>SUPER ADMIN CONTROL PANEL</span>
                    <span className="bg-amber-400 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                      Master Key Control
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage Store Admin Authorization Keys and view registered store management accounts.
                  </p>
                </div>
              </div>
              {currentAdmin && (
                <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2 text-right text-xs">
                  <p className="text-slate-400 text-[10px]">Logged in as</p>
                  <p className="font-bold text-amber-400">{currentAdmin.name}</p>
                  <p className="text-[10px] text-emerald-400 font-mono">{currentAdmin.email}</p>
                </div>
              )}
            </div>

            {/* AUTHORIZATION KEY CONFIGURATION */}
            <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50/40 p-6 rounded-2xl border border-amber-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0">
                    <ShieldCheck className="w-5 h-5 text-slate-950" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-amber-950">
                      Store Admin Authorization Key
                    </h4>
                    <p className="text-[11px] text-amber-800 font-medium">
                      Staff members must enter this key when registering a new Store Admin account
                    </p>
                  </div>
                </div>
                <span className="bg-amber-200 text-amber-900 font-mono font-extrabold text-xs px-3 py-1 rounded-lg border border-amber-300">
                  Active Key: {securityKeyInput}
                </span>
              </div>

              {securityKeyError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{securityKeyError}</span>
                </div>
              )}

              {securityKeySuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">{securityKeySuccess}</span>
                </div>
              )}

              <form onSubmit={handleUpdateSecurityKey} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-amber-950 mb-1">
                    Set New Authorization Key *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-amber-600 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={securityKeyInput}
                      onChange={(e) => setSecurityKeyInput(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                      placeholder="e.g. nethajiminimart"
                    />
                  </div>
                  <p className="text-[10px] text-amber-800/80 mt-1">
                    Default key is <code className="bg-amber-100 font-mono font-bold text-amber-900 px-1 py-0.5 rounded">nethajiminimart</code>. Only Super Admin can modify this key.
                  </p>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={securityKeyLoading}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {securityKeyLoading ? (
                      <span>Saving Key...</span>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4 text-slate-950" />
                        <span>Update Authorization Key</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* PAYMENT QR CODE & UPI CONFIGURATION (SUPER ADMIN OTP PROTECTED) */}
            <div id="payment-qr-superadmin-section" className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                      <span>Payment QR Code & UPI Merchant Settings</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-300">
                        OTP Security Verified
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Manage checkout UPI QR code, merchant handle, and receiver details. Super Admin Mobile OTP verification is required to authorize changes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                <div className="shrink-0 text-center">
                  <img
                    src={paymentQrUrlInput || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi%3A%2F%2Fpay%3Fpa%3D${encodeURIComponent(paymentUpiInput)}%26pn%3D${encodeURIComponent(paymentMerchantInput)}%26cu%3DINR`}
                    alt="Payment QR Preview"
                    referrerPolicy="no-referrer"
                    className="w-28 h-28 object-contain bg-white p-2 rounded-xl border border-slate-300 shadow-xs mx-auto"
                  />
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wide mt-1 block">Live Checkout Preview</span>
                </div>
                <div className="text-xs space-y-1.5 flex-1 w-full">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-sm">{paymentMerchantInput || 'Store Merchant Name'}</span>
                    <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">Active</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200 font-mono font-bold text-slate-800 text-xs w-fit">
                    {paymentUpiInput || 'upi@id'}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Customers choosing UPI payment in the store checkout modal will scan this live QR code.
                  </p>
                </div>
              </div>

              {/* Status alerts */}
              {qrOtpErrorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3.5 flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{qrOtpErrorMessage}</span>
                </div>
              )}

              {qrOtpSuccessMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-3.5 flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{qrOtpSuccessMessage}</span>
                </div>
              )}

              {demoSentOtp && (
                <div className="bg-amber-50 border border-amber-300 text-amber-950 text-xs rounded-xl p-3.5 flex items-center justify-between font-bold shadow-xs animate-pulse">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-amber-700" />
                    <span>[DEMO SIMULATOR] Super Admin Mobile OTP Code: <code className="bg-amber-200 text-amber-950 px-2.5 py-0.5 rounded font-mono text-sm tracking-widest">{demoSentOtp}</code></span>
                  </div>
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-black">Valid for 10 Mins</span>
                </div>
              )}

              {/* Edit Form */}
              <form onSubmit={handleVerifyQrOtpAndSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Merchant UPI VPA ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={paymentUpiInput}
                      onChange={(e) => {
                        const newUpi = e.target.value;
                        setPaymentUpiInput(newUpi);
                        setPaymentQrUrlInput(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi%3A%2F%2Fpay%3Fpa%3D${encodeURIComponent(newUpi)}%26pn%3D${encodeURIComponent(paymentMerchantInput)}%26cu%3DINR`);
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g. nethaji.mart@upi"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      UPI Merchant Receiver Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={paymentMerchantInput}
                      onChange={(e) => {
                        const newName = e.target.value;
                        setPaymentMerchantInput(newName);
                        setPaymentQrUrlInput(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi%3A%2F%2Fpay%3Fpa%3D${encodeURIComponent(paymentUpiInput)}%26pn%3D${encodeURIComponent(newName)}%26cu%3DINR`);
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g. Nethaji Mini Mart & Fresh"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Custom Payment QR Image URL / Auto-Generated Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={paymentQrUrlInput}
                      onChange={(e) => setPaymentQrUrlInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Paste custom image URL or use auto-generated QR"
                    />
                    <button
                      type="button"
                      onClick={() => setPaymentQrUrlInput(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi%3A%2F%2Fpay%3Fpa%3D${encodeURIComponent(paymentUpiInput)}%26pn%3D${encodeURIComponent(paymentMerchantInput)}%26cu%3DINR`)}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-extrabold px-3 py-2.5 rounded-xl shrink-0 transition-colors cursor-pointer"
                    >
                      Reset Dynamic QR
                    </button>
                  </div>
                </div>

                {/* Mobile Phone Verification Step */}
                <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <label className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-amber-400" />
                        <span>Super Admin Mobile Number for OTP Authorization *</span>
                      </label>
                      <p className="text-[11px] text-slate-300">
                        OTP will be sent to this mobile number to confirm payment QR code changes.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="tel"
                        required
                        value={superAdminPhoneInput}
                        onChange={(e) => setSuperAdminPhoneInput(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white w-36 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        placeholder="10-digit phone"
                      />
                      <button
                        type="button"
                        disabled={qrOtpLoading}
                        onClick={handleSendQrOtp}
                        className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5 text-slate-950" />
                        <span>{qrOtpSent ? "Resend OTP" : "Send Mobile OTP"}</span>
                      </button>
                    </div>
                  </div>

                  {/* OTP Verification Field */}
                  {qrOtpSent && (
                    <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="w-full sm:w-auto">
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Enter 6-Digit Mobile OTP Code *
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={qrOtpInput}
                          onChange={(e) => setQrOtpInput(e.target.value)}
                          className="bg-white border-2 border-amber-400 rounded-xl px-4 py-2 text-center text-slate-900 font-mono font-black text-base tracking-widest w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
                          placeholder="0 0 0 0 0 0"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={qrOtpLoading}
                        className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-6 py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {qrOtpLoading ? (
                          <span>Verifying OTP...</span>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-slate-950" />
                            <span>Verify OTP & Apply Payment QR Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* REGISTERED ADMIN ACCOUNTS TABLE */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <Users className="w-5 h-5 text-emerald-700" />
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Registered Store Management Accounts
                  </h4>
                </div>
                <span className="bg-slate-100 text-slate-700 font-extrabold text-xs px-2.5 py-1 rounded-lg">
                  {adminList.length} Active Staff Account{adminList.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Admin Staff Name</th>
                      <th className="py-2.5 px-3">Email Address</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {adminList.map((adm, idx) => (
                      <tr key={adm.id || adm.email || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-900 text-amber-400 font-black flex items-center justify-center text-xs">
                              {adm.name.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-900">{adm.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-mono">{adm.email}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            adm.role === 'Super Admin'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}>
                            {adm.role || 'Store Admin'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">{adm.phone || 'N/A'}</td>
                        <td className="py-3 px-3 text-slate-400 text-[11px]">
                          {adm.createdAt ? new Date(adm.createdAt).toLocaleDateString() : 'System Default'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 10. CUSTOMER SUGGESTIONS & PRODUCT REQUESTS TAB */}
        {activeTab === 'suggestions' && (
          <SuggestionsManagementTab
            categories={categories}
            onRefreshCustomerStore={onRefreshCustomerStore}
          />
        )}

      </main>

      {/* Add / Edit Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                    {editingProduct ? "Edit Product Details" : "Add New Grocery Product"}
                  </h3>
                  <p className="text-[11px] text-slate-500">Upload product photos directly from your device</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              {/* Product Photo Upload Section */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-700" />
                    <span>Product Photo *</span>
                  </label>
                  <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                    Upload from Device
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {/* Photo Preview Box */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-dashed border-emerald-300 bg-white flex items-center justify-center overflow-hidden shrink-0 relative group shadow-2xs">
                    {productForm.image ? (
                      <>
                        <img
                          src={productForm.image}
                          alt="Product preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white bg-slate-900/80 px-2 py-1 rounded-md">
                            Change
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                        <span className="text-[10px] font-semibold">No Photo</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 w-full space-y-2">
                    <label className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-2.5 px-4 rounded-xl cursor-pointer shadow-xs transition-colors text-xs text-center">
                      <Upload className="w-4 h-4" />
                      <span>{productImageUploading ? "Processing Photo..." : "Choose Photo from Device / Gallery"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProductPhotoUpload}
                        disabled={productImageUploading}
                        className="hidden"
                      />
                    </label>

                    <p className="text-[10px] text-slate-500 leading-tight">
                      Supported: JPG, PNG, WEBP. Photos are automatically optimized for fast loading on customer devices.
                    </p>

                    {/* Quick Presets */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-600 block mb-1">Quick Preset Photos:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: "🥦 Veggies", url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80" },
                          { label: "🍎 Fruits", url: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&auto=format&fit=crop&q=80" },
                          { label: "🥛 Dairy", url: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80" },
                          { label: "🌾 Rice", url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80" },
                          { label: "🍪 Snacks", url: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80" },
                          { label: "🥤 Drinks", url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80" }
                        ].map((preset, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => setProductForm({ ...productForm, image: preset.url })}
                            className="bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Farm Tomatoes"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Nethaji Fresh"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Offer Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">MRP Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={productForm.mrp}
                    onChange={(e) => setProductForm({ ...productForm, mrp: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min={0}
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-amber-50/60 p-3 rounded-xl border border-amber-200/70">
                <div>
                  <label className="block font-bold text-amber-950 mb-1">GST Tax Rate (%)</label>
                  <select
                    value={productForm.gstRate ?? 5}
                    onChange={(e) => setProductForm({ ...productForm, gstRate: Number(e.target.value) })}
                    className="w-full bg-white border border-amber-300 rounded-xl p-2 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value={0}>0% (GST Exempt / Fresh Organic)</option>
                    <option value={5}>5% (Standard Grocery / Daily Essentials)</option>
                    <option value={12}>12% (Processed Foods / Beverages)</option>
                    <option value={18}>18% (Packaged Goods / Household)</option>
                    <option value={28}>28% (Luxury Goods)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-amber-950 mb-1">HSN / SAC Code</label>
                  <input
                    type="text"
                    value={productForm.hsnCode || ''}
                    onChange={(e) => setProductForm({ ...productForm, hsnCode: e.target.value })}
                    placeholder="e.g. 0709"
                    className="w-full bg-white border border-amber-300 rounded-xl p-2 font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Unit Size (e.g. 1 kg, 500 g, 1 Litre, 1 Pack)</label>
                <input
                  type="text"
                  placeholder="1 kg"
                  value={productForm.unit}
                  onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Fresh quality item available at Nethaji Mini Mart."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                ></textarea>
              </div>

              {/* Tag Options */}
              <div className="grid grid-cols-3 gap-2 bg-amber-50/60 p-3 rounded-xl border border-amber-200/70">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!productForm.isPopular}
                    onChange={(e) => setProductForm({ ...productForm, isPopular: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                  />
                  <span className="font-extrabold text-amber-950 text-[11px]">
                    🔥 Trending Item
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!productForm.isOffer}
                    onChange={(e) => setProductForm({ ...productForm, isOffer: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-500 focus:ring-rose-400 cursor-pointer"
                  />
                  <span className="font-extrabold text-rose-950 text-[11px]">
                    🏷️ Special Offer
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!productForm.isOrganic}
                    onChange={(e) => setProductForm({ ...productForm, isOrganic: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-400 cursor-pointer"
                  />
                  <span className="font-extrabold text-emerald-950 text-[11px]">
                    🌿 Organic Item
                  </span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={productImageUploading}
                  className="flex-1 bg-emerald-700 text-white font-extrabold py-3 rounded-xl shadow-xs hover:bg-emerald-800 transition-colors text-sm disabled:opacity-50 cursor-pointer"
                >
                  {editingProduct ? "Update Product" : "Save Product"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="bg-slate-100 text-slate-700 font-bold px-5 py-3 rounded-xl hover:bg-slate-200 transition-colors text-sm cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                    {editingCategory ? "Edit Store Category" : "Add New Category"}
                  </h3>
                  <p className="text-[11px] text-slate-500">Create or customize store departments</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              {/* Category Photo Upload Section */}
              <div className="bg-purple-50/50 p-3.5 rounded-2xl border border-purple-200/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-purple-950 text-xs flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-purple-700" />
                    <span>Category Photo / Thumbnail *</span>
                  </label>
                  <span className="text-[10px] bg-purple-100 text-purple-900 font-bold px-2 py-0.5 rounded-full">
                    Upload from Device
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-purple-300 bg-white flex items-center justify-center overflow-hidden shrink-0 relative group shadow-2xs">
                    {categoryForm.image ? (
                      <img
                        src={categoryForm.image}
                        alt="Category preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                        <span className="text-[10px] font-semibold">No Image</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <label className="w-full flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-800 text-white font-extrabold py-2.5 px-4 rounded-xl cursor-pointer shadow-xs transition-colors text-xs text-center">
                      <Upload className="w-4 h-4" />
                      <span>{categoryImageUploading ? "Processing..." : "Upload Category Photo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCategoryPhotoUpload}
                        disabled={categoryImageUploading}
                        className="hidden"
                      />
                    </label>

                    {/* Quick Category Image Presets */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-600 block mb-1">Preset Category Photos:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: "🥦 Veggies & Fruits", url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80" },
                          { label: "🥛 Dairy & Eggs", url: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=500&auto=format&fit=crop&q=80" },
                          { label: "🌾 Atta & Dals", url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80" },
                          { label: "🌶️ Spices", url: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&auto=format&fit=crop&q=80" },
                          { label: "🥤 Drinks & Snacks", url: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80" },
                          { label: "🧼 Cleaning", url: "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=500&auto=format&fit=crop&q=80" }
                        ].map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCategoryForm({ ...categoryForm, image: preset.url })}
                            className="bg-white hover:bg-purple-100 text-slate-700 hover:text-purple-900 border border-purple-200 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Fruits & Vegetables"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Farm fresh vegetables delivered directly to your doorstep"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={categoryImageUploading}
                  className="flex-1 bg-purple-700 text-white font-extrabold py-3 rounded-xl shadow-xs hover:bg-purple-800 transition-colors text-sm disabled:opacity-50 cursor-pointer"
                >
                  {editingCategory ? "Update Category" : "Save Category"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="bg-slate-100 text-slate-700 font-bold px-5 py-3 rounded-xl hover:bg-slate-200 transition-colors text-sm cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tax Invoice Modal */}
      {selectedOrderForInvoice && settings && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-lg text-emerald-800 uppercase tracking-tight">{settings.storeName}</h2>
                <p className="text-[10px] text-slate-500">{settings.address}, {settings.city} | Phone: {settings.phone}</p>
                <p className="text-[10px] font-bold text-slate-700">GSTIN: {settings.gstin}</p>
              </div>
              <button onClick={() => setSelectedOrderForInvoice(null)} className="text-slate-400 hover:text-slate-800 text-sm font-bold">✕</button>
            </div>

            <div className="text-xs space-y-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span>INVOICE #: {selectedOrderForInvoice.orderNumber}</span>
                <span>Date: {new Date(selectedOrderForInvoice.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-slate-600">Customer: <strong>{selectedOrderForInvoice.customerName}</strong> ({selectedOrderForInvoice.customerPhone})</p>
            </div>

            <table className="w-full text-left text-xs text-slate-800 border border-slate-200">
              <thead className="bg-slate-100 font-bold text-[10px] uppercase border-b">
                <tr>
                  <th className="p-2">Item</th>
                  <th className="p-2">Qty</th>
                  <th className="p-2">Rate</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedOrderForInvoice.items.map((it, i) => (
                  <tr key={i}>
                    <td className="p-2 font-medium">{it.productName} ({it.unit})</td>
                    <td className="p-2 font-bold">{it.quantity}</td>
                    <td className="p-2">₹{it.price}</td>
                    <td className="p-2 text-right font-black">₹{it.price * it.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-xs space-y-1 font-bold text-slate-800 pt-2 border-t border-slate-200 text-right">
              <p>Subtotal: ₹{selectedOrderForInvoice.subtotal}</p>
              <div className="bg-amber-50/80 p-2 rounded-lg border border-amber-200 text-right space-y-0.5 text-[11px] my-1">
                <p className="text-slate-700 font-bold">CGST ({((settings.gstPercentage ?? 5) / 2)}%): ₹{Math.round((selectedOrderForInvoice.gstAmount || 0) / 2)}</p>
                <p className="text-slate-700 font-bold">SGST ({((settings.gstPercentage ?? 5) / 2)}%): ₹{Math.round((selectedOrderForInvoice.gstAmount || 0) / 2)}</p>
                <p className="font-extrabold text-amber-950 border-t border-amber-200/80 pt-0.5 mt-0.5">Total GST Tax ({settings.gstPercentage ?? 5}%): ₹{selectedOrderForInvoice.gstAmount}</p>
              </div>
              <p>Delivery Fee: ₹{selectedOrderForInvoice.deliveryFee}</p>
              {selectedOrderForInvoice.discountAmount > 0 && <p className="text-amber-800">Discount: -₹{selectedOrderForInvoice.discountAmount}</p>}
              <p className="text-sm font-black text-emerald-800">Grand Total: ₹{selectedOrderForInvoice.totalAmount}</p>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full bg-slate-900 text-white font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Print Tax Invoice
            </button>
          </div>
        </div>
      )}

      {/* ADD / EDIT BANNER MODAL */}
      {showBannerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-7 space-y-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200 my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-black">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                    {editingBanner ? 'Edit Promo Slider Banner' : 'Create New Promo Slider Banner'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Customize shape, colors, relocation destination & promotional imagery
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBannerModal(false)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full font-bold text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {/* LIVE CARD PREVIEW */}
            <div className="bg-slate-950 p-4 md:p-5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-amber-400">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>LIVE CARD PREVIEW</span>
                </div>
                <span className="text-[10px] text-slate-400 uppercase font-mono">
                  Shape: {bannerForm.shapeStyle || 'organic-leaf'}
                </span>
              </div>

              <div
                className={`relative overflow-hidden p-4 md:p-6 text-white shadow-xl transition-all ${
                  bannerForm.shapeStyle === 'organic-leaf'
                    ? 'rounded-tr-[44px] rounded-bl-[44px] rounded-tl-2xl rounded-br-2xl'
                    : bannerForm.shapeStyle === 'pill-curve'
                    ? 'rounded-tl-[44px] rounded-br-[44px] rounded-tr-2xl rounded-bl-2xl'
                    : bannerForm.shapeStyle === 'modern-rounded'
                    ? 'rounded-[30px]'
                    : 'rounded-2xl'
                }`}
                style={{
                  backgroundColor: bannerForm.bgColor || '#00B042',
                  backgroundImage: bannerForm.bgGradient?.includes('from-') ? undefined : undefined
                }}
              >
                {/* Background ambient decoration */}
                <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-7 md:col-span-8 space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {bannerForm.badge && (
                        <span className="inline-flex items-center gap-1 bg-black/25 backdrop-blur-xs text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-white/20">
                          <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                          {bannerForm.badge}
                        </span>
                      )}
                      {bannerForm.discountBadge && (
                        <span className="inline-flex items-center bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                          {bannerForm.discountBadge}
                        </span>
                      )}
                    </div>

                    <h4 className="text-base md:text-xl font-black text-white leading-tight">
                      {bannerForm.title || 'Add Title Headline'}
                    </h4>

                    {bannerForm.subtitle && (
                      <p className="text-[11px] text-white/90 font-medium line-clamp-2 leading-relaxed">
                        {bannerForm.subtitle}
                      </p>
                    )}

                    <div className="pt-1 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black shadow-md ${
                          bannerForm.buttonBgColor || 'bg-white'
                        } ${bannerForm.buttonTextColor || 'text-[#008A38]'}`}
                      >
                        <span>{bannerForm.cta || 'Order Now'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>

                      {bannerForm.targetCategory && (
                        <span className="text-[10px] font-bold text-white/80 hidden sm:inline-block">
                          → {bannerForm.targetCategory}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="col-span-5 md:col-span-4 flex items-center justify-center">
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-white/20 p-1.5 backdrop-blur-xs shadow-lg border border-white/25">
                      <img
                        src={bannerForm.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-xl"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80';
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-4 text-xs">
              
              {/* THEME PRESET PALETTES */}
              <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <label className="font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-amber-600" />
                  <span>1-Click Theme & Color Palette</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {[
                    {
                      label: '🍃 Fresh Harvest Green',
                      bgColor: '#00B042',
                      btnBg: 'bg-white',
                      btnText: 'text-[#008A38]',
                      gradient: 'from-[#00A859] via-[#00B042] to-[#16A34A]'
                    },
                    {
                      label: '🍟 Crisp Party Red',
                      bgColor: '#E11D48',
                      btnBg: 'bg-white',
                      btnText: 'text-[#E11D48]',
                      gradient: 'from-[#E11D48] via-[#DC2626] to-[#BE123C]'
                    },
                    {
                      label: '🧀 Dairy & Golden Wheat',
                      bgColor: '#D97706',
                      btnBg: 'bg-white',
                      btnText: 'text-[#B45309]',
                      gradient: 'from-[#D97706] via-[#F59E0B] to-[#B45309]'
                    },
                    {
                      label: '🍇 Drinks & Snacks Violet',
                      bgColor: '#7C3AED',
                      btnBg: 'bg-white',
                      btnText: 'text-[#6D28D9]',
                      gradient: 'from-[#6D28D9] via-[#7C3AED] to-[#5B21B6]'
                    },
                    {
                      label: '🌊 Ocean Blue Refresh',
                      bgColor: '#0284C7',
                      btnBg: 'bg-white',
                      btnText: 'text-[#0284C7]',
                      gradient: 'from-[#0369A1] via-[#0284C7] to-[#075985]'
                    },
                    {
                      label: '🍫 Gourmet Dark Forest',
                      bgColor: '#064E3B',
                      btnBg: 'bg-amber-400',
                      btnText: 'text-slate-950',
                      gradient: 'from-[#064E3B] via-[#047857] to-[#022C22]'
                    }
                  ].map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => {
                        setBannerForm({
                          ...bannerForm,
                          bgColor: preset.bgColor,
                          buttonBgColor: preset.btnBg,
                          buttonTextColor: preset.btnText,
                          bgGradient: preset.gradient
                        });
                      }}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                        bannerForm.bgColor === preset.bgColor
                          ? 'border-slate-900 bg-white ring-2 ring-slate-900/20 shadow-xs font-black'
                          : 'border-slate-200 bg-white hover:bg-slate-100 font-bold text-slate-700'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: preset.bgColor }} />
                      <span className="text-[10px] truncate">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CARD CORNER GEOMETRY & SHAPE */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-800 flex items-center gap-1.5">
                  <LayoutGrid className="w-3.5 h-3.5 text-purple-600" />
                  <span>Card Corner Shape Style</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'organic-leaf', label: '🍃 Organic Leaf', desc: 'Top-Right & Bottom-Left Curves' },
                    { key: 'pill-curve', label: '💊 Pill Curve', desc: 'Top-Left & Bottom-Right Curves' },
                    { key: 'modern-rounded', label: '🔲 Modern Rounded', desc: 'Symmetric 32px Curves' },
                    { key: 'classic-card', label: '🃏 Classic Card', desc: 'Standard 20px Corners' }
                  ].map((shape) => (
                    <button
                      key={shape.key}
                      type="button"
                      onClick={() => setBannerForm({ ...bannerForm, shapeStyle: shape.key as any })}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        bannerForm.shapeStyle === shape.key
                          ? 'border-purple-600 bg-purple-50 text-purple-950 font-black ring-1 ring-purple-600'
                          : 'border-slate-200 bg-slate-50 text-slate-700 font-bold hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-[11px]">{shape.label}</div>
                      <div className="text-[9px] text-slate-500 font-normal leading-tight mt-0.5">{shape.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Banner Title */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Main Banner Title / Headline *</label>
                <input
                  type="text"
                  required
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  placeholder="e.g. Fresh Harvest Vegetables & Daily Staples"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Subtitle */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Subtitle / Description</label>
                <textarea
                  rows={2}
                  value={bannerForm.subtitle}
                  onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                  placeholder="e.g. Directly from local farms to your kitchen counter with 100% freshness guarantee."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Promo Badge & Discount Highlight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Promo Badge (Top Tag)</label>
                  <input
                    type="text"
                    value={bannerForm.badge}
                    onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
                    placeholder="e.g. SPECIAL HARVEST or PARTY CRUNCH"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Discount Tag (Yellow Pill)</label>
                  <input
                    type="text"
                    value={bannerForm.discountBadge}
                    onChange={(e) => setBannerForm({ ...bannerForm, discountBadge: e.target.value })}
                    placeholder="e.g. 50% OFF or BUY 1 GET 1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* CTA Button Text & Relocation Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200/70">
                <div className="space-y-1">
                  <label className="font-extrabold text-amber-950 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-700" />
                    <span>CTA Button Label</span>
                  </label>
                  <input
                    type="text"
                    value={bannerForm.cta}
                    onChange={(e) => setBannerForm({ ...bannerForm, cta: e.target.value })}
                    placeholder="e.g. Order Now or Grab Deal"
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-amber-950 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-700" />
                    <span>Relocation / Click Target Category</span>
                  </label>
                  <select
                    value={bannerForm.targetCategory}
                    onChange={(e) => setBannerForm({ ...bannerForm, targetCategory: e.target.value, targetAction: 'category' })}
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- Select Store Category --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Banner Image URL + Preset Picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Slide Image URL *</label>
                  <span className="text-[10px] text-slate-400">High-resolution food / grocery photos</span>
                </div>
                <input
                  type="url"
                  required
                  value={bannerForm.image}
                  onChange={(e) => setBannerForm({ ...bannerForm, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                {/* Preset image buttons */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-600 block">Quick Curated Image Library:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: '🥦 Vegetables & Fruits', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80' },
                      { label: '🍟 Pringles & Chips', url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800&auto=format&fit=crop&q=80' },
                      { label: '🥛 Milk, Butter & Cheese', url: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&auto=format&fit=crop&q=80' },
                      { label: '🌾 Atta, Rice & Dals', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80' },
                      { label: '🍎 Fresh Apples & Berries', url: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&auto=format&fit=crop&q=80' },
                      { label: '🥤 Cold Beverages & Sodas', url: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&auto=format&fit=crop&q=80' },
                      { label: '🍫 Chocolates & Sweets', url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800&auto=format&fit=crop&q=80' },
                      { label: '🧼 Household Essentials', url: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=800&auto=format&fit=crop&q=80' }
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setBannerForm({ ...bannerForm, image: preset.url })}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border transition-all ${
                          bannerForm.image === preset.url
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-2xs font-extrabold'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <input
                  type="checkbox"
                  id="banner-is-active"
                  checked={bannerForm.isActive}
                  onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-emerald-700 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="banner-is-active" className="font-bold text-xs text-slate-800 cursor-pointer">
                  Display this banner slide on customer storefront
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBannerModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingBanner ? 'Update Slide' : 'Create Slide'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT CATEGORY MODAL */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-800" />
                <h3 className="font-extrabold text-base text-slate-900">
                  {editingCategory ? 'Edit Store Category' : 'Add New Category'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddCategoryModal(false);
                  setEditingCategory(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              
              {/* Category Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Category Name *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. Organic Vegetables, Dairy & Eggs, Snacks"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Subtitle / Tagline */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tagline / Subtitle (Shown on pill badge)</label>
                <input
                  type="text"
                  value={categoryForm.subtitle || ''}
                  onChange={(e) => setCategoryForm({ ...categoryForm, subtitle: e.target.value })}
                  placeholder="e.g. Farm Fresh & Healthy, Daily Staples, 100% Pure"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Short Description</label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="e.g. Fresh farm produce sourced daily from local farmers."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Image URL & Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Category Cover Image *</label>
                  <label className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCategoryPhotoUpload}
                    />
                  </label>
                </div>
                <input
                  type="url"
                  required
                  value={categoryForm.image}
                  onChange={(e) => setCategoryForm({ ...categoryForm, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />

                {categoryImageUploading && (
                  <p className="text-[10px] text-emerald-700 font-bold animate-pulse">Uploading photo...</p>
                )}

                {/* Image Preview & Preset Selection */}
                <div className="flex items-center gap-3 pt-1">
                  <img
                    src={categoryForm.image}
                    alt="Category Preview"
                    className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0 bg-slate-100"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="space-y-1 flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-slate-500 block">Quick Pick Preset Image:</span>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { label: 'Veggies', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80' },
                        { label: 'Fruits', url: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=500&auto=format&fit=crop&q=80' },
                        { label: 'Grocery & Rice', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80' },
                        { label: 'Dairy & Milk', url: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=500&auto=format&fit=crop&q=80' },
                        { label: 'Snacks', url: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=500&auto=format&fit=crop&q=80' },
                        { label: 'Beverages', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80' }
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setCategoryForm({ ...categoryForm, image: preset.url })}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${
                            categoryForm.image === preset.url
                              ? 'bg-emerald-800 text-white border-emerald-900'
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCategoryModal(false);
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95"
                >
                  {editingCategory ? 'Update Category' : 'Save Category'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Quad Card Group Modal */}
      {showQuadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {editingQuadGroup ? 'Edit Quad Category Showcase Card' : 'Create Quad Category Showcase Card'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Configure the card heading, category filter, and the 4 items shown in the 2x2 grid.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuadModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuadGroup} className="space-y-6">
              
              {/* Group Meta Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="md:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    Card Heading (e.g. "Fresh Vegetables & Fruits | Up to 45% off")
                  </label>
                  <input
                    type="text"
                    value={quadForm.heading}
                    onChange={(e) => setQuadForm({ ...quadForm, heading: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    Subheading / Tagline
                  </label>
                  <input
                    type="text"
                    value={quadForm.subheading}
                    onChange={(e) => setQuadForm({ ...quadForm, subheading: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="Directly from local farms"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    Main Category Link Filter
                  </label>
                  <select
                    value={quadForm.categoryFilter}
                    onChange={(e) => setQuadForm({ ...quadForm, categoryFilter: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="All">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    Bottom Link Text (e.g. "See more in Vegetables")
                  </label>
                  <input
                    type="text"
                    value={quadForm.seeMoreText}
                    onChange={(e) => setQuadForm({ ...quadForm, seeMoreText: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="See more"
                  />
                </div>
              </div>

              {/* 4 Tile Editors */}
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">
                  Configure 4 Quad Tiles
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {quadForm.tiles.map((tile, tIdx) => (
                    <div
                      key={tile.id || tIdx}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                          Tile #{tIdx + 1}
                        </span>
                        {tile.image && (
                          <img
                            src={tile.image}
                            alt=""
                            className="w-7 h-7 object-cover rounded border border-slate-200"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                          Tile Title
                        </label>
                        <input
                          type="text"
                          value={tile.title}
                          onChange={(e) => {
                            const newTiles = [...quadForm.tiles];
                            newTiles[tIdx] = { ...newTiles[tIdx], title: e.target.value };
                            setQuadForm({ ...quadForm, tiles: newTiles });
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
                          placeholder="Item Title"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                          Image URL
                        </label>
                        <input
                          type="url"
                          value={tile.image}
                          onChange={(e) => {
                            const newTiles = [...quadForm.tiles];
                            newTiles[tIdx] = { ...newTiles[tIdx], image: e.target.value };
                            setQuadForm({ ...quadForm, tiles: newTiles });
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none"
                          placeholder="https://..."
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                            Category Link
                          </label>
                          <select
                            value={tile.categoryName}
                            onChange={(e) => {
                              const newTiles = [...quadForm.tiles];
                              newTiles[tIdx] = { ...newTiles[tIdx], categoryName: e.target.value };
                              setQuadForm({ ...quadForm, tiles: newTiles });
                            }}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-medium"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                            Badge / Price
                          </label>
                          <input
                            type="text"
                            value={tile.subtitle || ''}
                            onChange={(e) => {
                              const newTiles = [...quadForm.tiles];
                              newTiles[tIdx] = { ...newTiles[tIdx], subtitle: e.target.value };
                              setQuadForm({ ...quadForm, tiles: newTiles });
                            }}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-medium"
                            placeholder="From ₹24/kg"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95"
                >
                  {editingQuadGroup ? 'Update Quad Showcase' : 'Save Quad Showcase'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT RIGHT-TO-LEFT SLIDER BANNER */}
      {isSliderBannerModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <span className="bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-amber-300">
                  {editingSliderBanner ? 'Edit Slider Banner' : 'Create New Slider Banner'}
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  {editingSliderBanner ? 'Update Right-to-Left Slider Banner' : 'Create Right-to-Left Slider Banner'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Add custom promo cards with deal badges, imagery, and instant category filters to your Right-to-Left Slider.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsSliderBannerModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveSliderBannerForm} className="space-y-4">
              
              {/* Quick Fill Preset Banner Suggestions */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 space-y-2">
                <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider block">
                  ⚡ 1-Click Preset Banner Templates:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSliderBannerForm({
                      ...sliderBannerForm,
                      title: "Easy. Creamy. Cheesy!",
                      subtitle: "Delicious processed cheese slices, spreads & triangles for daily family snacks",
                      badge: "BEST DEALS",
                      discountBadge: "UP TO 35% OFF",
                      buttonText: "ORDER NOW",
                      bgStyle: "wood",
                      image: "https://images.unsplash.com/photo-1552767059-ce182ead8c1b?w=600&auto=format&fit=crop&q=80",
                      categoryName: "Dairy & Breakfast"
                    })}
                    className="bg-white hover:bg-amber-100 text-slate-900 border border-amber-300 font-extrabold text-[11px] px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                  >
                    <span>🧀 Easy. Creamy. Cheesy! (Wood Theme)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSliderBannerForm({
                      ...sliderBannerForm,
                      title: "Fresh Organic Vegetables",
                      subtitle: "Farm fresh spinach, tomatoes, potatoes & greens",
                      badge: "FLASH DEAL 45% OFF",
                      discountBadge: "SAVE BIG TODAY",
                      buttonText: "Shop Vegetables →",
                      bgStyle: "emerald",
                      image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80",
                      categoryName: "Vegetables & Fruits"
                    })}
                    className="bg-emerald-900 text-white hover:bg-emerald-800 font-extrabold text-[11px] px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                  >
                    <span>🥦 Fresh Vegetables (Emerald Theme)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Banner Theme Style Selector */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    Card Background & Theme Style
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'wood', label: '🪵 Wood Dairy', bg: 'bg-[#f7f3eb] text-slate-900 border-[#e2d8c3]' },
                      { id: 'emerald', label: '🥦 Emerald Fresh', bg: 'bg-emerald-950 text-white border-emerald-700' },
                      { id: 'amber', label: '🧀 Amber Gold', bg: 'bg-amber-600 text-slate-950 border-amber-400' },
                      { id: 'rose', label: '🌹 Rose Special', bg: 'bg-rose-950 text-white border-rose-700' },
                      { id: 'slate', label: '🌙 Dark Slate', bg: 'bg-slate-950 text-white border-slate-700' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSliderBannerForm({ ...sliderBannerForm, bgStyle: t.id as any })}
                        className={`p-2.5 rounded-xl border text-[11px] font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 text-center ${t.bg} ${
                          (sliderBannerForm.bgStyle || 'wood') === t.id ? 'ring-2 ring-emerald-600 ring-offset-1 scale-102 shadow-md' : 'opacity-80 hover:opacity-100'
                        }`}
                      >
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Banner Title */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    Banner Title / Headline <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sliderBannerForm.title || ''}
                    onChange={(e) => setSliderBannerForm({ ...sliderBannerForm, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="e.g. Easy. Creamy. Cheesy!"
                  />
                </div>

                {/* Subtitle */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    Subtitle / Offer Description
                  </label>
                  <input
                    type="text"
                    value={sliderBannerForm.subtitle || ''}
                    onChange={(e) => setSliderBannerForm({ ...sliderBannerForm, subtitle: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="e.g. Delicious cheese slices, spreads & triangles for daily family snacks"
                  />
                </div>

                {/* Offer Badge */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    Top Offer Badge (e.g. BEST DEALS)
                  </label>
                  <input
                    type="text"
                    value={sliderBannerForm.badge || ''}
                    onChange={(e) => setSliderBannerForm({ ...sliderBannerForm, badge: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="BEST DEALS"
                  />
                </div>

                {/* Discount Tag */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    Discount Tag (e.g. UP TO 35% OFF)
                  </label>
                  <input
                    type="text"
                    value={sliderBannerForm.discountBadge || ''}
                    onChange={(e) => setSliderBannerForm({ ...sliderBannerForm, discountBadge: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="UP TO 35% OFF"
                  />
                </div>

                {/* Target Category */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    Link Category Filter
                  </label>
                  <select
                    value={sliderBannerForm.categoryName || ''}
                    onChange={(e) => setSliderBannerForm({ ...sliderBannerForm, categoryName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="">All Categories (No Filter)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Button Text */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    Action Button Text (CTA)
                  </label>
                  <input
                    type="text"
                    value={sliderBannerForm.buttonText || ''}
                    onChange={(e) => setSliderBannerForm({ ...sliderBannerForm, buttonText: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black focus:outline-none focus:ring-2 focus:ring-emerald-600 text-emerald-900"
                    placeholder="ORDER NOW"
                  />
                </div>

                {/* Active Enable / Disable Toggle */}
                <div className="sm:col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">Enable Slider Banner on Storefront</p>
                    <p className="text-[10px] text-slate-500">When enabled, this banner will slide in the homepage carousel.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sliderBannerForm.active !== false}
                      onChange={(e) => setSliderBannerForm({ ...sliderBannerForm, active: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* Image URL */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="block text-xs font-extrabold text-slate-800">
                    Banner Image URL <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={sliderBannerForm.image || ''}
                    onChange={(e) => setSliderBannerForm({ ...sliderBannerForm, image: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="https://images.unsplash.com/..."
                  />

                  {/* Quick Preset Imagery */}
                  <div className="pt-1">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1.5">Quick Fill Preset Grocery Imagery:</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSliderBannerForm({ ...sliderBannerForm, image: 'https://images.unsplash.com/photo-1552767059-ce182ead8c1b?w=600&auto=format&fit=crop&q=80' })}
                        className="text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        🧀 Cheese & Butter
                      </button>
                      <button
                        type="button"
                        onClick={() => setSliderBannerForm({ ...sliderBannerForm, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80' })}
                        className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        🥦 Vegetables
                      </button>
                      <button
                        type="button"
                        onClick={() => setSliderBannerForm({ ...sliderBannerForm, image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&auto=format&fit=crop&q=80' })}
                        className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        🍎 Fresh Fruits
                      </button>
                      <button
                        type="button"
                        onClick={() => setSliderBannerForm({ ...sliderBannerForm, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80' })}
                        className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        🌾 Atta & Staples
                      </button>
                    </div>
                  </div>
                </div>

                {/* Active Checkbox */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-100 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sliderBannerActive"
                    checked={sliderBannerForm.active !== false}
                    onChange={(e) => setSliderBannerForm({ ...sliderBannerForm, active: e.target.checked })}
                    className="w-4 h-4 text-emerald-800 rounded border-slate-300 focus:ring-emerald-600 cursor-pointer"
                  />
                  <label htmlFor="sliderBannerActive" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Active on Storefront (Show in Right-to-Left Slider)
                  </label>
                </div>

              </div>

              {/* Live Card Preview */}
              <div className="pt-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  Card Live Preview:
                </span>
                <div className="bg-linear-to-r from-emerald-950 via-emerald-900 to-teal-950 rounded-2xl p-4 text-white shadow-md border border-emerald-700/50 flex flex-col justify-between relative overflow-hidden">
                  <div className="space-y-1.5 relative z-10">
                    <div className="flex items-center justify-between gap-2">
                      <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                        {sliderBannerForm.badge || 'FLASH DEAL'}
                      </span>
                      {sliderBannerForm.discountBadge && (
                        <span className="bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                          {sliderBannerForm.discountBadge}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-black text-white">{sliderBannerForm.title || 'Sample Banner Title'}</h4>
                    <p className="text-[11px] text-emerald-100/90">{sliderBannerForm.subtitle || 'Sample subtitle or tagline'}</p>
                  </div>
                  <div className="relative z-10 pt-3 mt-2 border-t border-emerald-700/50 flex items-center justify-between gap-2">
                    {sliderBannerForm.image && (
                      <img src={sliderBannerForm.image} alt="" className="w-10 h-10 object-cover rounded-lg border border-white/20" />
                    )}
                    <span className="bg-amber-400 text-slate-950 font-black text-[11px] px-3 py-1.5 rounded-xl ml-auto">
                      {sliderBannerForm.buttonText || 'Shop Deal →'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSliderBannerModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingSliderBanner ? 'Update Slider Banner' : 'Create Slider Banner'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT APPROVED PINCODE MODAL */}
      {showPincodeModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow-sm">
                  <MapPin className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {editingPincode ? 'Edit Approved Delivery Pincode' : 'Add New Approved Pincode'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Configure serviceable pincode details, delivery charges, and SLA timelines.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPincodeModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePincodeModal} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-800 mb-1">
                    PIN Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pincodeForm.pincode}
                    onChange={(e) => setPincodeForm({ ...pincodeForm, pincode: e.target.value.replace(/\D/g, '') })}
                    placeholder="e.g. 600007"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-800 mb-1">
                    City Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={pincodeForm.city}
                    onChange={(e) => setPincodeForm({ ...pincodeForm, city: e.target.value })}
                    placeholder="e.g. Chennai, Erode, Bengaluru"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-slate-800 mb-1">
                  Region / Area Name
                </label>
                <input
                  type="text"
                  value={pincodeForm.area}
                  onChange={(e) => setPincodeForm({ ...pincodeForm, area: e.target.value })}
                  placeholder="e.g. Triplicane / Mylapore / Central Hub"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-800 mb-1">
                  Estimated Delivery SLA Timeline
                </label>
                <input
                  type="text"
                  value={pincodeForm.estimatedDeliveryTime}
                  onChange={(e) => setPincodeForm({ ...pincodeForm, estimatedDeliveryTime: e.target.value })}
                  placeholder="e.g. 15-20 Mins Express or 30-45 Mins Express"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-800 mb-1">
                    Minimum Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={pincodeForm.minimumOrderValue}
                    onChange={(e) => setPincodeForm({ ...pincodeForm, minimumOrderValue: Number(e.target.value) })}
                    placeholder="0 for No Minimum"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-800 mb-1">
                    Custom Delivery Charge (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={pincodeForm.customDeliveryFee}
                    onChange={(e) => setPincodeForm({ ...pincodeForm, customDeliveryFee: Number(e.target.value) })}
                    placeholder="0 for FREE Delivery"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pincodeActiveCheckbox"
                  checked={pincodeForm.active}
                  onChange={(e) => setPincodeForm({ ...pincodeForm, active: e.target.checked })}
                  className="w-4 h-4 text-emerald-800 rounded border-slate-300 focus:ring-emerald-600 cursor-pointer"
                />
                <label htmlFor="pincodeActiveCheckbox" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Mark as Active & Approved for Customer Delivery
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPincodeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingPincode ? 'Update Approved Pincode' : 'Save Approved Pincode'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT DELIVERY RIDER MODAL */}
      {showRiderModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-900 text-amber-400 font-black flex items-center justify-center shadow-xs">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {editingRider ? 'Edit Delivery Rider Profile' : 'Register New Delivery Rider'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Enter rider personal details, vehicle specification, and assigned service zone.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRiderModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRiderModal} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-extrabold text-slate-800 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={riderForm.name}
                    onChange={(e) => setRiderForm({ ...riderForm, name: e.target.value })}
                    placeholder="e.g. S. Karthik"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-extrabold text-slate-800 mb-1">
                    Mobile Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={riderForm.phone}
                    onChange={(e) => setRiderForm({ ...riderForm, phone: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-extrabold text-slate-800 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={riderForm.email}
                    onChange={(e) => setRiderForm({ ...riderForm, email: e.target.value })}
                    placeholder="e.g. karthik@nethaji.in"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-extrabold text-slate-800 mb-1">
                    Vehicle Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={riderForm.vehicleType}
                    onChange={(e) => setRiderForm({ ...riderForm, vehicleType: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="Bike">🏍️ Motorbike</option>
                    <option value="Scooter">🛵 Scooter / Moped</option>
                    <option value="E-Bike">⚡ Electric Bike</option>
                    <option value="Auto">🛺 Auto Rickshaw / Cargo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-extrabold text-slate-800 mb-1">
                    Vehicle Registration No <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={riderForm.vehicleNumber}
                    onChange={(e) => setRiderForm({ ...riderForm, vehicleNumber: e.target.value })}
                    placeholder="e.g. TN 33 AB 4092"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-900 uppercase focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-extrabold text-slate-800 mb-1">
                    Initial Duty Status
                  </label>
                  <select
                    value={riderForm.status}
                    onChange={(e) => setRiderForm({ ...riderForm, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="Available">🟢 Available for Jobs</option>
                    <option value="On Delivery">🟡 On Active Delivery</option>
                    <option value="Off Duty">⚪ Off Duty</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-slate-800 mb-1">
                  Assigned Delivery Service Zone
                </label>
                <input
                  type="text"
                  value={riderForm.assignedZone}
                  onChange={(e) => setRiderForm({ ...riderForm, assignedZone: e.target.value })}
                  placeholder="e.g. Erode Central (638001), Perundurai (638052)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRiderModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingRider ? 'Update Rider Profile' : 'Register Rider'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ORDER RIDER ASSIGNMENT MODAL */}
      {showAssignRiderModal && orderToAssignRider && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow-xs">
                  <UserPlus className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Assign Delivery Executive
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Order <strong className="text-emerald-800">{orderToAssignRider.orderNumber}</strong> • ₹{orderToAssignRider.totalAmount}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAssignRiderModal(false);
                  setOrderToAssignRider(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Order Target Details */}
            <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs space-y-1">
              <div className="flex items-center justify-between font-extrabold text-amber-950">
                <span>Customer: {orderToAssignRider.customerName} ({orderToAssignRider.customerPhone})</span>
                <span className="bg-amber-200 px-2 py-0.5 rounded text-[10px]">Slot: {orderToAssignRider.deliverySlot}</span>
              </div>
              <p className="text-slate-700 font-medium">
                📍 {orderToAssignRider.address.street}, {orderToAssignRider.address.area}, {orderToAssignRider.address.city} - <strong>{orderToAssignRider.address.pincode}</strong>
              </p>
            </div>

            {/* Rider Selection List */}
            <div className="space-y-2">
              <label className="block font-black text-xs text-slate-800 uppercase tracking-wider">
                Select Available Delivery Executive ({riders.length} in fleet):
              </label>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                {riders.map((r) => {
                  const isZoneMatch = r.assignedZone.includes(orderToAssignRider.address.pincode) || r.assignedZone.toLowerCase().includes('erode');
                  const isAvailable = r.status === 'Available';

                  return (
                    <div
                      key={r.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                        isAvailable
                          ? 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                          : 'bg-slate-50/70 border-slate-200 opacity-75'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1">
                            <Bike className="w-3.5 h-3.5 text-emerald-700" />
                            {r.name}
                          </span>
                          <span className={`px-2 py-0.2 rounded text-[9px] font-black uppercase ${
                            r.status === 'Available' ? 'bg-emerald-100 text-emerald-900' :
                            r.status === 'On Delivery' ? 'bg-amber-100 text-amber-900' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {r.status}
                          </span>
                          {isZoneMatch && (
                            <span className="bg-blue-100 text-blue-900 text-[9px] font-extrabold px-1.5 py-0.2 rounded">
                              📍 Zone Match
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">
                          📞 {r.phone} • {r.vehicleType} ({r.vehicleNumber}) • ⭐ {r.rating} ({r.completedDeliveriesCount} completed)
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleConfirmAssignRider(r.id, true)}
                        className="bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1 hover:scale-105 active:scale-95"
                      >
                        <span>Assign</span>
                        <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowAssignRiderModal(false);
                  setOrderToAssignRider(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
              >
                Close / Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
