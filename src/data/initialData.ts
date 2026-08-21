import { Product, Category, Coupon, Order, Customer, StoreSettings, BannerSlide, QuadCardGroup, SliderConfig, DeliveryRider } from '../types';
import { VADAMALAI_CATEGORIES, VADAMALAI_PRODUCTS } from './vadamalaiProducts';

export const INITIAL_BANNERS: BannerSlide[] = [
  {
    id: "banner-video-1",
    title: "*BUY 3KG GET 2KG FREE",
    subtitle: "JK-Wash Liquid Detergent & Laundry Care – Premium Stain Lifting Formula",
    badge: "VMS EXCLUSIVE OFFER",
    discountBadge: "Now at Rs.368",
    cta: "SHOP NOW",
    bgGradient: "from-[#e0f2fe] via-[#bae6fd] to-[#93c5fd]",
    bgColor: "#bae6fd",
    accentColor: "text-blue-900",
    textColor: "text-slate-950",
    buttonBgColor: "bg-[#0284c7]",
    buttonTextColor: "text-white",
    shapeStyle: "classic-card",
    targetCategory: "Household & Cleaning",
    targetAction: "category",
    image: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=800&auto=format&fit=crop&q=80",
    isActive: true
  },
  {
    id: "banner-video-2",
    title: "Stock up on savings, without Compromising on quality",
    subtitle: "Daawat Basmati Rice, Aashirvaad Atta, Red Label Tea, Marie Gold, Easy Cook & Aachi Masala",
    badge: "EVERYDAY LOW PRICES",
    discountBadge: "UP TO 40% OFF",
    cta: "View more",
    bgGradient: "from-[#ffedd5] via-[#fed7aa] to-[#ffe4e6]",
    bgColor: "#fed7aa",
    accentColor: "text-rose-600",
    textColor: "text-slate-900",
    buttonBgColor: "bg-slate-950",
    buttonTextColor: "text-white",
    shapeStyle: "classic-card",
    targetCategory: "Atta, Rice & Dal",
    targetAction: "category",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80",
    isActive: true
  },
  {
    id: "banner-video-3",
    title: "Unbeatable Quality, Unbeatable Prices",
    subtitle: "Fortune Refined Sunlite Oil, Tata Iodised Salt, Anil Roasted Vermicelli & Pure Spices",
    badge: "KITCHEN ESSENTIALS",
    discountBadge: "SUPER SAVER",
    cta: "Shop Essentials",
    bgGradient: "from-[#292524] via-[#44403c] to-[#1c1917]",
    bgColor: "#292524",
    accentColor: "text-amber-400",
    textColor: "text-white",
    buttonBgColor: "bg-amber-400",
    buttonTextColor: "text-slate-950",
    shapeStyle: "classic-card",
    targetCategory: "Oil, Ghee & Masala",
    targetAction: "category",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80",
    isActive: true
  },
  {
    id: "banner-1",
    title: "Fresh Farm Veggies & Organic Greens",
    subtitle: "Directly from verified local farms to your doorstep with 100% freshness guarantee.",
    badge: "UP TO 50% OFF",
    discountBadge: "50% OFF",
    cta: "Shop Veggies",
    bgGradient: "from-[#00A859] via-[#00B042] to-[#16A34A]",
    bgColor: "#00B042",
    accentColor: "text-amber-300",
    textColor: "text-white",
    buttonBgColor: "bg-white",
    buttonTextColor: "text-[#008A38]",
    shapeStyle: "organic-leaf",
    targetCategory: "Vegetables & Fruits",
    targetAction: "category",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80",
    isActive: true
  },
  {
    id: "banner-2",
    title: "Party is where the Pringles & Snacks are",
    subtitle: "Get your favourite crispy chips, biscuits, namkeens & party beverages delivered in 10 mins.",
    badge: "PARTY CRUNCH",
    discountBadge: "BUY 1 GET 1",
    cta: "Order Now",
    bgGradient: "from-[#E11D48] via-[#DC2626] to-[#BE123C]",
    bgColor: "#E11D48",
    accentColor: "text-yellow-300",
    textColor: "text-white",
    buttonBgColor: "bg-white",
    buttonTextColor: "text-[#E11D48]",
    shapeStyle: "pill-curve",
    targetCategory: "Snacks & Munchies",
    targetAction: "category",
    image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800&auto=format&fit=crop&q=80",
    isActive: true
  }
];

export const INITIAL_STORE_SETTINGS: StoreSettings = {
  storeName: "NETHAJI MINI MART",
  tagline: "Your Trusted Supermarket - Best Quality & Best Price Guaranteed",
  phone: "+91 94427 29304",
  email: "rodeovmsjk@gmail.com",
  address: "NETHAJI MINI MART, Main Road",
  city: "Tirupattur, Tamil Nadu",
  pincode: "635601",
  gstin: "33AAAAA0000A1Z5",
  gstPercentage: 5,
  gstTaxType: "Inclusive",
  enableGstInvoice: true,
  showHsnCodes: true,
  freeDeliveryThreshold: 499,
  defaultDeliveryFee: 30,
  acceptingOrders: true,
  storeOpeningHours: "7:00 AM - 10:00 PM (Mon-Sun)",
  noticeBanner: "⚡ Express Local Home Delivery from NETHAJI MINI MART!",
  enforceApprovedPincodes: false,
  approvedPincodes: [],
  paymentUpiId: "nethaji@upi",
  paymentMerchantName: "NETHAJI MINI MART",
  paymentQrImageUrl: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi%3A%2F%2Fpay%3Fpa%3Dnethaji%40upi%26pn%3DNETHAJI%2520MINI%2520MART%26cu%3DINR",
  superAdminPhone: "9442729304",
  riderPerKmRate: 15,
  riderBasePay: 25,
  riderMinPayPerOrder: 35,
  logoUrl: "/nethaji-logo.svg"
};

export const INITIAL_CATEGORIES: Category[] = VADAMALAI_CATEGORIES;

export const INITIAL_PRODUCTS: Product[] = VADAMALAI_PRODUCTS;

export const INITIAL_COUPONS: Coupon[] = [
  {
    code: "VADAMALAI100",
    discountType: "fixed",
    discountValue: 100,
    minOrderValue: 500,
    description: "Flat ₹100 OFF on orders above ₹500 for Vadamalai Supermarket customers!",
    expiryDate: "2026-12-31",
    isActive: true
  },
  {
    code: "VADAMALAI20",
    discountType: "percentage",
    discountValue: 20,
    minOrderValue: 300,
    description: "20% OFF (Up to ₹150) on grocery & daily essentials!",
    expiryDate: "2026-12-31",
    isActive: true
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_QUAD_GROUPS: QuadCardGroup[] = [
  {
    id: 'groceries_essentials',
    heading: 'Daily Essentials & Groceries | Best Local Prices',
    subheading: 'Directly from Vadamalai Supermarket catalog',
    categoryFilter: 'Grocery & Staples',
    seeMoreText: 'See more in Grocery & Staples',
    tiles: [
      {
        id: 'q1',
        title: 'Parle-G Gluco Biscuits',
        image: 'https://cdn.rodeodigital.com/common/master/parle_g_32gm_6.5gm_4033.jpg',
        subtitle: 'Everyday Snack',
        categoryName: 'Biscuits & Cookies'
      },
      {
        id: 'q2',
        title: 'Daily Grocery & Staples',
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80',
        subtitle: 'Rice, Atta & Dals',
        categoryName: 'Grocery & Staples'
      },
      {
        id: 'q3',
        title: 'Personal & Skincare',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80',
        subtitle: 'Soaps & Shampoos',
        categoryName: 'Personal Care'
      },
      {
        id: 'q4',
        title: 'Household Cleaning',
        image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&auto=format&fit=crop&q=80',
        subtitle: 'Detergents & Surface Care',
        categoryName: 'Household Needs'
      }
    ]
  }
];

export const INITIAL_SLIDER_CONFIG: SliderConfig = {
  title: "Super Saver Deals & Offers",
  subtitle: "Handpicked deals from Vadamalai Supermarket",
  badge: "TOP OFFERS",
  autoPlaySpeedMs: 4000,
  sliderBanners: [
    {
      id: "sl-1",
      title: "Parle Biscuits & Snacks",
      subtitle: "Crunchy tea-time snacks",
      badge: "BESTSELLER",
      image: "https://cdn.rodeodigital.com/common/master/parle_g_32gm_6.5gm_4033.jpg",
      buttonText: "Shop Snacks",
      active: true,
      bgStyle: "amber"
    },
    {
      id: "sl-2",
      title: "Premium Cooking Oils & Ghee",
      subtitle: "Pure ingredients for cooking",
      badge: "SPECIAL PRICE",
      image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80",
      buttonText: "Shop Oils",
      active: true,
      bgStyle: "emerald"
    }
  ]
};

export const INITIAL_RIDERS: DeliveryRider[] = [
  {
    id: "rider-1",
    name: "Senthil Kumar",
    phone: "9842112345",
    email: "senthil@vadamalairiders.com",
    vehicleType: "Bike",
    vehicleNumber: "TN 83 AB 1234",
    status: "Available",
    assignedOrdersCount: 0,
    completedDeliveriesCount: 42,
    rating: 4.9,
    assignedZone: "Main Town (635601)",
    joinedDate: "2024-01-15",
    isApproved: true,
    approvalStatus: "Approved",
    documents: {
      drivingLicenseNumber: "TN83 2021001234",
      drivingLicenseUrl: "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80",
      aadharNumber: "4532 9901 1234",
      aadharCardUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
      vehicleRcNumber: "TN83 AB 1234",
      vehicleRcUrl: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80"
    }
  }
];
