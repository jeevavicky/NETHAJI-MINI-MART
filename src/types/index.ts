export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  mrp: number;
  price: number;
  unit: string; // e.g. "1 kg", "500 g", "1 L", "Pack of 2"
  image: string;
  rating: number;
  reviewsCount: number;
  stock: number;
  isPopular?: boolean;
  isOffer?: boolean;
  isOneRupeeZone?: boolean;
  isOrganic?: boolean;
  description: string;
  sku: string;
  tags?: string[];
  shareCount?: number;
  gstRate?: number;
  hsnCode?: string;
}

export interface Category {
  id: string;
  name: string;
  iconName: string;
  itemCount: number;
  image: string;
  description?: string;
  subtitle?: string;
}

export interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  cta: string;
  bgGradient: string;
  accentColor: string;
  image: string;
  isActive?: boolean;
  targetCategory?: string;
  targetAction?: 'category' | 'offers' | 'trending' | 'oneRupee' | 'all';
  bgColor?: string;
  textColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  shapeStyle?: 'organic-leaf' | 'modern-rounded' | 'pill-curve' | 'classic-card';
  discountBadge?: string;
  orderIndex?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  description: string;
  expiryDate: string;
  isActive: boolean;
}

export type OrderStatus = 'Placed' | 'Approved' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled';

export type ReturnStatus = 'Requested' | 'Approved' | 'Refunded' | 'Rejected';

export interface ReturnRequest {
  requestedAt: string;
  reason: string;
  comments?: string;
  status: ReturnStatus;
  refundUpiId: string;
  refundUpiName?: string;
  refundUpiProvider?: 'Google Pay' | 'PhonePe' | 'Paytm' | 'BHIM UPI' | 'Other UPI';
  refundAmount: number;
  adminNote?: string;
  processedAt?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  unit: string;
  image: string;
}

export interface DeliveryRider {
  id: string;
  name: string;
  phone: string;
  email?: string;
  vehicleType: 'Bike' | 'Scooter' | 'E-Bike' | 'Auto';
  vehicleNumber: string;
  status: 'Available' | 'On Delivery' | 'Off Duty';
  assignedOrdersCount: number;
  completedDeliveriesCount: number;
  rating: number;
  assignedZone: string;
  joinedDate: string;
  isApproved?: boolean;
  approvalStatus?: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  documents?: {
    drivingLicenseNumber?: string;
    drivingLicenseUrl?: string;
    aadharNumber?: string;
    aadharCardUrl?: string;
    vehicleRcNumber?: string;
    vehicleRcUrl?: string;
    profilePhotoUrl?: string;
    submittedAt?: string;
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: {
    street: string;
    area: string;
    city: string;
    pincode: string;
    landmark?: string;
  };
  items: OrderItem[];
  subtotal: number;
  gstAmount: number;
  deliveryFee: number;
  discountAmount: number;
  couponCode?: string;
  totalAmount: number;
  paymentMethod: 'COD' | 'GPay' | 'UPI' | 'Card' | 'NetBanking';
  paymentStatus: 'Pending' | 'Paid';
  deliverySlot: string;
  orderStatus: OrderStatus;
  createdAt: string;
  estimatedDelivery: string;
  assignedRiderId?: string;
  assignedRiderName?: string;
  assignedRiderPhone?: string;
  assignedRiderVehicle?: string;
  assignedAt?: string;
  sharedLocation?: {
    lat: number;
    lng: number;
    landmark?: string;
    floorDoor?: string;
    gateInstructions?: string;
    liveTrackingUrl?: string;
    updatedAt?: string;
  };
  returnRequest?: ReturnRequest;
  rating?: number;
  feedback?: string;
  ratedAt?: string;
  hasOneRupeeOffer?: boolean;
  timeline: {
    status: OrderStatus;
    timestamp: string;
    note?: string;
  }[];
  distanceKm?: number;
  riderEarnings?: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  totalOrders: number;
  totalSpent: number;
  status: 'Active' | 'Blocked';
  joinedDate: string;
  hasClaimedOneRupeeOffer?: boolean;
}

export interface StoreReview {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface ApprovedDeliveryPincode {
  id: string;
  pincode: string;
  city: string;
  area: string;
  active: boolean;
  estimatedDeliveryTime?: string;
  minimumOrderValue?: number;
  customDeliveryFee?: number;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  gstin: string;
  gstPercentage?: number;
  gstTaxType?: 'Inclusive' | 'Exclusive';
  enableGstInvoice?: boolean;
  showHsnCodes?: boolean;
  freeDeliveryThreshold: number;
  defaultDeliveryFee: number;
  acceptingOrders: boolean;
  storeOpeningHours: string;
  noticeBanner: string;
  enforceApprovedPincodes?: boolean;
  approvedPincodes?: ApprovedDeliveryPincode[];
  paymentUpiId?: string;
  paymentMerchantName?: string;
  paymentQrImageUrl?: string;
  superAdminPhone?: string;
  riderPerKmRate?: number;
  riderBasePay?: number;
  riderMinPayPerOrder?: number;
  logoUrl?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role?: string;
  phone?: string;
  createdAt?: string;
}

export interface AdminStats {
  todaySales: number;
  monthlyRevenue: number;
  totalOrdersCount: number;
  pendingOrdersCount: number;
  activeCustomersCount: number;
  lowStockCount: number;
  salesGraph: { date: string; sales: number; orders: number }[];
  topSellingProducts: { name: string; quantity: number; revenue: number }[];
}

export interface QuadTile {
  id: string;
  title: string;
  image: string;
  categoryName?: string;
  subtitle?: string;
  discountBadge?: string;
}

export interface QuadCardGroup {
  id: string;
  heading: string;
  subheading?: string;
  categoryFilter?: string;
  tiles: QuadTile[];
  seeMoreText?: string;
}

export type HomepageSectionKey = 'promoPeekSlider' | 'hero' | 'categories' | 'freshOffers' | 'slider' | 'quads' | 'catalog';

export interface SliderBanner {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  image: string;
  categoryName?: string;
  discountBadge?: string;
  buttonText?: string;
  active?: boolean;
  bgStyle?: 'wood' | 'emerald' | 'amber' | 'slate' | 'rose';
}

export interface SliderConfig {
  title: string;
  subtitle: string;
  badge: string;
  autoPlaySpeedMs?: number;
  featuredProductIds?: string[];
  sectionOrder?: HomepageSectionKey[];
  hiddenSections?: HomepageSectionKey[];
  sliderBanners?: SliderBanner[];
  freshOffersTitle?: string;
  freshOffersHighlight?: string;
  freshOffersSubtitle?: string;
}

export interface DeliveryLocation {
  city: string;
  pincode: string;
  area?: string;
}

export type SuggestionType = 'product_request' | 'feature_request' | 'store_feedback';
export type SuggestionStatus = 'Pending' | 'Under Review' | 'In Progress' | 'Added' | 'Declined';

export interface CustomerSuggestion {
  id: string;
  type: SuggestionType;
  title: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  category?: string;
  brandOrDetails?: string;
  expectedPrice?: number;
  imageUrl?: string;
  description: string;
  status: SuggestionStatus;
  adminNote?: string;
  createdAt: string;
  upvotes?: number;
  upvotedBy?: string[];
  productCreatedId?: string;
}

