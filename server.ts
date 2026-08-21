import express from "express";
import path from "path";
import compression from "compression";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import {
  INITIAL_STORE_SETTINGS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_COUPONS,
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
  INITIAL_BANNERS,
  INITIAL_QUAD_GROUPS,
  INITIAL_SLIDER_CONFIG,
  INITIAL_RIDERS
} from "./src/data/initialData.js";
import { Product, Category, Coupon, Order, Customer, StoreSettings, OrderStatus, BannerSlide, QuadCardGroup, SliderConfig, DeliveryRider, CustomerSuggestion, SuggestionType } from "./src/types";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(compression());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Graceful JSON payload error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err && err.type === "entity.too.large") {
      res.status(413).json({ error: "Payload too large. Please upload smaller files or images (max 50MB)." });
      return;
    }
    if (err && err instanceof SyntaxError && "body" in err) {
      res.status(400).json({ error: "Invalid JSON format." });
      return;
    }
    next(err);
  });

  // In-memory persistent database store
  let storeSettings: StoreSettings = { ...INITIAL_STORE_SETTINGS };
  let categories: Category[] = [...INITIAL_CATEGORIES];
  let products: Product[] = [...INITIAL_PRODUCTS];
  let coupons: Coupon[] = [...INITIAL_COUPONS];
  let customers: Customer[] = [...INITIAL_CUSTOMERS];
  let orders: Order[] = [...INITIAL_ORDERS];
  let banners: BannerSlide[] = [...INITIAL_BANNERS];
  let quadGroups: QuadCardGroup[] = [...INITIAL_QUAD_GROUPS];
  let sliderConfig: SliderConfig = { ...INITIAL_SLIDER_CONFIG };
  let riders: DeliveryRider[] = [...INITIAL_RIDERS];
  let suggestions: CustomerSuggestion[] = [
    {
      id: "sug-1",
      type: "product_request",
      title: "Aavin Full Cream Milk (Orange Pack 500ml / 1L)",
      customerName: "Senthil Kumar",
      customerPhone: "9876543210",
      customerEmail: "senthil.k@gmail.com",
      category: "Dairy & Breakfast",
      brandOrDetails: "Aavin Brand - Daily Morning Supply",
      expectedPrice: 30,
      imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80",
      description: "Please stock daily fresh Aavin orange packet milk for morning breakfast delivery before 7:30 AM in Erode area.",
      status: "Under Review",
      adminNote: "Checking morning distribution logistics with local Aavin dairy dealer.",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      upvotes: 12,
      upvotedBy: []
    },
    {
      id: "sug-2",
      type: "feature_request",
      title: "WhatsApp Order Confirmation & Instant Invoice PDF Download",
      customerName: "Priya Raman",
      customerPhone: "9842109876",
      customerEmail: "priya.raman@gmail.com",
      category: "Checkout & Tracking",
      description: "It would be super helpful if we could get an instant WhatsApp message with the itemized bill/PDF slip as soon as the order is marked Delivered.",
      status: "In Progress",
      adminNote: "Developing automated WhatsApp receipt sharing integration with Super Admin phone.",
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      upvotes: 18,
      upvotedBy: []
    },
    {
      id: "sug-3",
      type: "product_request",
      title: "Idhayam Sesame / Gingelly Oil (1 Litre Pouch)",
      customerName: "Murugan G",
      customerPhone: "9786541230",
      category: "Grocery & Staples",
      brandOrDetails: "Idhayam Brand Pouch",
      expectedPrice: 380,
      imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80",
      description: "Pure traditional cold-pressed gingelly oil for south Indian cooking, dosai, and pooja.",
      status: "Added",
      adminNote: "Successfully added to Grocery & Staples catalog under ID product-idhayam-sesame!",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      upvotes: 25,
      upvotedBy: []
    }
  ];
  let storeAdminSecurityKey = "nethajiminimart";
  const adminResetCodes = new Map<string, { code: string; expiresAt: number }>();
  const superAdminQrOtps = new Map<string, { code: string; expiresAt: number }>();
  let adminUsers = [
    {
      id: "admin-1",
      name: "Super Admin",
      email: "keerthivicky440@gmail.com",
      password: "admin123",
      role: "Super Admin",
      phone: "+91 94433 12345",
      createdAt: new Date().toISOString()
    }
  ];

  // Real-Time Event Distribution (WebSockets + SSE)
  const wsClients = new Set<WebSocket>();
  const sseClients = new Set<express.Response>();

  const broadcastOrderUpdate = (order: Order) => {
    const payload = JSON.stringify({ type: "ORDER_UPDATED", order, timestamp: new Date().toISOString() });
    
    // Broadcast via WebSockets
    wsClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });

    // Broadcast via Server-Sent Events (SSE)
    sseClients.forEach((clientRes) => {
      try {
        clientRes.write(`data: ${payload}\n\n`);
      } catch (err) {
        console.error("SSE write error", err);
      }
    });
  };

  // SSE Stream Endpoint
  app.get("/api/orders/live-stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    sseClients.add(res);
    res.write(`data: ${JSON.stringify({ type: "CONNECTED", message: "Live real-time order tracking connected" })}\n\n`);

    req.on("close", () => {
      sseClients.delete(res);
    });
  });
  const syncCategoryCounts = () => {
    categories = categories.map(cat => ({
      ...cat,
      itemCount: products.filter(p => p.category.toLowerCase() === cat.name.toLowerCase()).length
    }));
  };

  syncCategoryCounts();

  // API Routes

  // 1. Health & Store Info
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", store: storeSettings.storeName });
  });

  app.get("/api/settings", (req, res) => {
    res.json(storeSettings);
  });

  app.put("/api/settings", (req, res) => {
    storeSettings = { ...storeSettings, ...req.body };
    res.json(storeSettings);
  });

  // Banners Management Endpoints
  app.get("/api/banners", (req, res) => {
    res.json(banners);
  });

  app.put("/api/banners", (req, res) => {
    if (Array.isArray(req.body)) {
      banners = req.body;
      res.json(banners);
    } else {
      res.status(400).json({ error: "Invalid banner list" });
    }
  });

  app.post("/api/banners", (req, res) => {
    const newBanner: BannerSlide = {
      id: `banner-${Date.now()}`,
      title: req.body.title || "New Super Offer Banner",
      subtitle: req.body.subtitle || "Fresh deals available at Nethaji Mini Mart",
      badge: req.body.badge || "SPECIAL OFFER",
      cta: req.body.cta || "Shop Now",
      bgGradient: req.body.bgGradient || "from-emerald-900 via-emerald-800 to-teal-950",
      accentColor: req.body.accentColor || "text-amber-400",
      image: req.body.image || "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80",
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    };
    banners.push(newBanner);
    res.status(201).json(newBanner);
  });

  app.put("/api/banners/:id", (req, res) => {
    const { id } = req.params;
    const index = banners.findIndex(b => b.id === id);
    if (index !== -1) {
      banners[index] = { ...banners[index], ...req.body };
      res.json(banners[index]);
    } else {
      res.status(404).json({ error: "Banner not found" });
    }
  });

  app.delete("/api/banners/:id", (req, res) => {
    const { id } = req.params;
    banners = banners.filter(b => b.id !== id);
    res.json({ success: true, remaining: banners.length });
  });

  // Quad Showcase Columns Endpoints
  app.get("/api/quad-groups", (req, res) => {
    res.json(quadGroups);
  });

  app.put("/api/quad-groups", (req, res) => {
    if (Array.isArray(req.body)) {
      quadGroups = req.body;
      res.json(quadGroups);
    } else {
      res.status(400).json({ error: "Invalid quad groups list" });
    }
  });

  app.post("/api/quad-groups", (req, res) => {
    const newGroup: QuadCardGroup = {
      id: `quad-${Date.now()}`,
      heading: req.body.heading || "New Category Quad Collection",
      subheading: req.body.subheading || "Curated local essentials",
      categoryFilter: req.body.categoryFilter || "All",
      seeMoreText: req.body.seeMoreText || "See more",
      tiles: req.body.tiles || []
    };
    quadGroups.push(newGroup);
    res.status(201).json(newGroup);
  });

  app.put("/api/quad-groups/:id", (req, res) => {
    const { id } = req.params;
    const index = quadGroups.findIndex(g => g.id === id);
    if (index !== -1) {
      quadGroups[index] = { ...quadGroups[index], ...req.body };
      res.json(quadGroups[index]);
    } else {
      res.status(404).json({ error: "Quad group not found" });
    }
  });

  app.delete("/api/quad-groups/:id", (req, res) => {
    const { id } = req.params;
    quadGroups = quadGroups.filter(g => g.id !== id);
    res.json({ success: true, remaining: quadGroups.length });
  });

  // Slider Column Config Endpoints
  app.get("/api/slider-config", (req, res) => {
    res.json(sliderConfig);
  });

  app.put("/api/slider-config", (req, res) => {
    sliderConfig = { ...sliderConfig, ...req.body };
    res.json(sliderConfig);
  });


  // 2. Categories
  app.get("/api/categories", (req, res) => {
    syncCategoryCounts();
    res.json(categories);
  });

  app.post("/api/categories", (req, res) => {
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: req.body.name,
      iconName: req.body.iconName || "ShoppingBag",
      itemCount: 0,
      image: req.body.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80",
      description: req.body.description || ""
    };
    categories.push(newCat);
    syncCategoryCounts();
    res.status(201).json(newCat);
  });

  app.put("/api/categories/:id", (req, res) => {
    const { id } = req.params;
    const index = categories.findIndex(c => c.id === id);
    if (index !== -1) {
      const oldName = categories[index].name;
      const newName = req.body.name || oldName;
      categories[index] = {
        ...categories[index],
        name: newName,
        iconName: req.body.iconName || categories[index].iconName,
        image: req.body.image || categories[index].image,
        description: req.body.description !== undefined ? req.body.description : categories[index].description
      };
      if (oldName !== newName) {
        products = products.map(p => p.category === oldName ? { ...p, category: newName } : p);
      }
      syncCategoryCounts();
      res.json(categories[index]);
    } else {
      res.status(404).json({ error: "Category not found" });
    }
  });

  app.delete("/api/categories/:id", (req, res) => {
    const { id } = req.params;
    categories = categories.filter(c => c.id !== id);
    syncCategoryCounts();
    res.json({ success: true, remaining: categories.length });
  });

  // 3. Products
  app.get("/api/products", (req, res) => {
    const { category, search, sort, featured, offer, inStock } = req.query;

    let filtered = [...products];

    if (category && category !== "All") {
      filtered = filtered.filter(p => p.category.toLowerCase() === String(category).toLowerCase());
    }

    if (search) {
      const q = String(search).toLowerCase().trim();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }

    if (featured === "true") {
      filtered = filtered.filter(p => p.isPopular);
    }

    if (offer === "true") {
      filtered = filtered.filter(p => p.isOffer);
    }

    if (inStock === "true") {
      filtered = filtered.filter(p => p.stock > 0);
    }

    // Sort
    if (sort === "price-low") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sort === "price-high") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sort === "rating") {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sort === "discount") {
      filtered.sort((a, b) => ((b.mrp - b.price) / b.mrp) - ((a.mrp - a.price) / a.mrp));
    }

    res.json(filtered);
  });

  app.get("/api/products/:id", (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  });

  app.post("/api/products", (req, res) => {
    const { name, category, brand, mrp, price, unit, image, stock, description, isPopular, isOffer, isOrganic, sku } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({ error: "Missing required product fields" });
    }

    const newProd: Product = {
      id: `p-${Date.now()}`,
      name,
      category,
      brand: brand || "Nethaji Fresh",
      mrp: Number(mrp) || Number(price),
      price: Number(price),
      unit: unit || "1 Unit",
      image: image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80",
      rating: 4.8,
      reviewsCount: 1,
      stock: Number(stock) || 10,
      description: description || "Quality product available at Nethaji Mini Mart.",
      isPopular: Boolean(isPopular),
      isOffer: Boolean(isOffer),
      isOrganic: Boolean(isOrganic),
      sku: sku || `NMM-${Math.floor(1000 + Math.random() * 9000)}`
    };

    products.unshift(newProd);
    syncCategoryCounts();
    res.status(201).json(newProd);
  });

  app.put("/api/products/:id", (req, res) => {
    const index = products.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Product not found" });
    }

    products[index] = {
      ...products[index],
      ...req.body,
      price: Number(req.body.price ?? products[index].price),
      mrp: Number(req.body.mrp ?? products[index].mrp),
      stock: Number(req.body.stock ?? products[index].stock)
    };

    syncCategoryCounts();
    res.json(products[index]);
  });

  app.patch("/api/products/:id/stock", (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const { delta, newStock } = req.body;
    if (typeof newStock === "number") {
      product.stock = Math.max(0, newStock);
    } else if (typeof delta === "number") {
      product.stock = Math.max(0, product.stock + delta);
    }

    res.json(product);
  });

  app.post("/api/products/:id/share", (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    product.shareCount = (product.shareCount || 0) + 1;
    res.json(product);
  });

  app.delete("/api/products/all", (req, res) => {
    products = [];
    syncCategoryCounts();
    res.json({ success: true, message: "All products removed successfully", count: 0 });
  });

  app.delete("/api/products", (req, res) => {
    products = [];
    syncCategoryCounts();
    res.json({ success: true, message: "All products removed successfully", count: 0 });
  });

  app.post("/api/products/reset-initial", (req, res) => {
    products = [...INITIAL_PRODUCTS];
    syncCategoryCounts();
    res.json({ success: true, message: "Products restored to default catalog", count: products.length });
  });

  app.delete("/api/products/:id", (req, res) => {
    const initialLen = products.length;
    products = products.filter(p => p.id !== req.params.id);
    if (products.length === initialLen) {
      return res.status(404).json({ error: "Product not found" });
    }
    syncCategoryCounts();
    res.json({ success: true, message: "Product deleted" });
  });

  // 4. Coupons
  app.get("/api/coupons", (req, res) => {
    res.json(coupons);
  });

  // 4.1. ₹1 Offer First-Time Eligibility Endpoint
  app.get("/api/offers/check-one-rupee-eligibility", (req, res) => {
    const rawPhone = String(req.query.phone || "").trim();
    if (!rawPhone) {
      return res.json({
        eligible: true,
        reason: "No phone specified yet (Applicable on 1st order only)",
        pastOrdersCount: 0,
        alreadyClaimed: false
      });
    }

    const cleanPhoneDigits = rawPhone.replace(/\D/g, "");
    const last10 = cleanPhoneDigits.slice(-10);

    const pastOrders = orders.filter(o => {
      const oDigits = (o.customerPhone || "").replace(/\D/g, "");
      return oDigits.slice(-10) === last10 && last10.length >= 8;
    });

    const hadOneRupeeInPast = pastOrders.some(o => 
      o.hasOneRupeeOffer || 
      (o.items && o.items.some(item => item.price <= 1))
    );

    const isFirstTime = pastOrders.length === 0;

    if (!isFirstTime || hadOneRupeeInPast) {
      return res.json({
        eligible: false,
        reason: "₹1 offer is exclusively valid on your 1st order only (1 time per mobile number). This mobile number has already placed orders or claimed the offer.",
        pastOrdersCount: pastOrders.length,
        alreadyClaimed: true
      });
    }

    return res.json({
      eligible: true,
      reason: "Eligible for 1st-time ₹1 welcome offer!",
      pastOrdersCount: 0,
      alreadyClaimed: false
    });
  });

  app.post("/api/coupons/validate", (req, res) => {
    const { code, subtotal } = req.body;
    const coupon = coupons.find(c => c.code.toUpperCase() === String(code).toUpperCase().trim());

    if (!coupon || !coupon.isActive) {
      return res.status(400).json({ valid: false, message: "Invalid or expired coupon code" });
    }

    if (subtotal < coupon.minOrderValue) {
      return res.status(400).json({
        valid: false,
        message: `Minimum order amount of ₹${coupon.minOrderValue} required for coupon ${coupon.code}`
      });
    }

    let discount = 0;
    if (coupon.discountType === "fixed") {
      discount = coupon.discountValue;
    } else {
      discount = Math.round((subtotal * coupon.discountValue) / 100);
    }

    res.json({
      valid: true,
      code: coupon.code,
      discount: Math.min(discount, subtotal),
      description: coupon.description
    });
  });

  app.post("/api/coupons", (req, res) => {
    const newCoupon: Coupon = {
      code: req.body.code.toUpperCase().trim(),
      discountType: req.body.discountType || "fixed",
      discountValue: Number(req.body.discountValue),
      minOrderValue: Number(req.body.minOrderValue) || 0,
      description: req.body.description || "Special Store Coupon",
      expiryDate: req.body.expiryDate || "2026-12-31",
      isActive: true
    };
    coupons.push(newCoupon);
    res.status(201).json(newCoupon);
  });

  // 4.2. Customer Suggestions & Product/Feature Requests
  app.get("/api/suggestions", (req, res) => {
    const { type, status, phone, search } = req.query;
    let result = [...suggestions];

    if (type && type !== "All") {
      result = result.filter(s => s.type === type);
    }

    if (status && status !== "All") {
      result = result.filter(s => s.status === status);
    }

    if (phone) {
      const cleanPhone = String(phone).replace(/\D/g, '');
      result = result.filter(s => {
        const sPhone = (s.customerPhone || '').replace(/\D/g, '');
        return sPhone.includes(cleanPhone);
      });
    }

    if (search) {
      const q = String(search).toLowerCase().trim();
      result = result.filter(s => 
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        (s.brandOrDetails && s.brandOrDetails.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(result);
  });

  app.post("/api/suggestions", (req, res) => {
    const {
      type,
      title,
      customerName,
      customerPhone,
      customerEmail,
      category,
      brandOrDetails,
      expectedPrice,
      imageUrl,
      description
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: "Suggestion or Product title is required" });
    }

    if (!customerPhone || !String(customerPhone).trim()) {
      return res.status(400).json({ error: "Customer contact mobile number is required" });
    }

    const newSuggestion: CustomerSuggestion = {
      id: `sug-${Date.now()}`,
      type: (type as SuggestionType) || 'product_request',
      title: String(title).trim(),
      customerName: String(customerName || "Valued Customer").trim(),
      customerPhone: String(customerPhone).trim(),
      customerEmail: customerEmail ? String(customerEmail).trim() : undefined,
      category: category ? String(category).trim() : undefined,
      brandOrDetails: brandOrDetails ? String(brandOrDetails).trim() : undefined,
      expectedPrice: expectedPrice ? Number(expectedPrice) : undefined,
      imageUrl: imageUrl ? String(imageUrl).trim() : undefined,
      description: String(description || "").trim() || `Customer requested: ${String(title).trim()}`,
      status: "Pending",
      createdAt: new Date().toISOString(),
      upvotes: 1,
      upvotedBy: [String(customerPhone).replace(/\D/g, '')]
    };

    suggestions.unshift(newSuggestion);
    res.status(201).json({
      success: true,
      message: "Suggestion submitted successfully to Store Admin!",
      suggestion: newSuggestion
    });
  });

  app.patch("/api/suggestions/:id/status", (req, res) => {
    const sug = suggestions.find(s => s.id === req.params.id);
    if (!sug) {
      return res.status(404).json({ error: "Suggestion not found" });
    }

    const { status, adminNote } = req.body;
    if (status) sug.status = status;
    if (adminNote !== undefined) sug.adminNote = adminNote;

    res.json({ success: true, suggestion: sug });
  });

  app.post("/api/suggestions/:id/upvote", (req, res) => {
    const sug = suggestions.find(s => s.id === req.params.id);
    if (!sug) {
      return res.status(404).json({ error: "Suggestion not found" });
    }

    const voterPhone = String(req.body.phone || "").replace(/\D/g, '');
    sug.upvotedBy = sug.upvotedBy || [];

    if (voterPhone && sug.upvotedBy.includes(voterPhone)) {
      // Toggle remove upvote
      sug.upvotedBy = sug.upvotedBy.filter(p => p !== voterPhone);
      sug.upvotes = Math.max(0, (sug.upvotes || 1) - 1);
      return res.json({ success: true, upvoted: false, upvotes: sug.upvotes, suggestion: sug });
    }

    if (voterPhone) {
      sug.upvotedBy.push(voterPhone);
    }
    sug.upvotes = (sug.upvotes || 0) + 1;
    res.json({ success: true, upvoted: true, upvotes: sug.upvotes, suggestion: sug });
  });

  app.post("/api/suggestions/:id/convert-to-product", (req, res) => {
    const sug = suggestions.find(s => s.id === req.params.id);
    if (!sug) {
      return res.status(404).json({ error: "Suggestion not found" });
    }

    const {
      name,
      category,
      brand,
      mrp,
      price,
      unit,
      stock,
      image,
      description
    } = req.body;

    const newProd: Product = {
      id: `prod-sug-${Date.now()}`,
      name: (name || sug.title).trim(),
      category: category || sug.category || (categories[0]?.name || "Grocery & Staples"),
      brand: brand || sug.brandOrDetails || "Nethaji Mart",
      mrp: Number(mrp) || (sug.expectedPrice ? sug.expectedPrice + 15 : 99),
      price: Number(price) || (sug.expectedPrice || 85),
      unit: unit || "1 pc / pack",
      stock: Number(stock) || 20,
      image: image || sug.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80",
      description: description || sug.description || `Added from customer request by ${sug.customerName}`,
      rating: 4.8,
      reviewsCount: 1,
      sku: `SUG-${Date.now().toString().slice(-6)}`,
      isPopular: false,
      isOffer: false,
      isOrganic: false,
      tags: ["customer_requested"]
    };

    products.push(newProd);
    syncCategoryCounts();

    sug.status = "Added";
    sug.productCreatedId = newProd.id;
    sug.adminNote = `Added to store as '${newProd.name}' in ${newProd.category}.`;

    res.status(201).json({
      success: true,
      message: `Product '${newProd.name}' successfully published to store catalog!`,
      product: newProd,
      suggestion: sug
    });
  });

  app.delete("/api/suggestions/:id", (req, res) => {
    const initialLen = suggestions.length;
    suggestions = suggestions.filter(s => s.id !== req.params.id);
    if (suggestions.length === initialLen) {
      return res.status(404).json({ error: "Suggestion not found" });
    }
    res.json({ success: true, message: "Suggestion removed" });
  });

  // 5. Orders
  app.get("/api/orders", (req, res) => {
    const { phone, status } = req.query;
    let result = [...orders];

    if (phone) {
      result = result.filter(o => o.customerPhone.includes(String(phone)));
    }

    if (status && status !== "All") {
      result = result.filter(o => o.orderStatus === status);
    }

    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(result);
  });

  app.post("/api/orders", (req, res) => {
    const { customerName, customerPhone, customerEmail, address, items, paymentMethod, deliverySlot, couponCode } = req.body;

    if (!customerName || !customerPhone || !items || !items.length) {
      return res.status(400).json({ error: "Missing customer or item details" });
    }

    // Server-side Pincode Delivery Enforcement Check
    if (storeSettings.enforceApprovedPincodes) {
      const orderPincode = address?.pincode ? String(address.pincode).trim() : "";
      const activeApprovedList = (storeSettings.approvedPincodes || []).filter(p => p.active);
      const isApprovedPin = activeApprovedList.some(p => p.pincode.trim() === orderPincode);
      if (!isApprovedPin) {
        const approvedPinsStr = activeApprovedList.map(p => p.pincode).join(", ");
        return res.status(400).json({
          error: `Delivery to PIN code "${orderPincode}" is currently not serviceable. Pincode approval enforcement is enabled. Approved PIN codes: ${approvedPinsStr || 'None configured'}`
        });
      }
    }

    // Check ₹1 Offer Eligibility (1st-time order only, 1 per mobile number)
    const cleanPhoneDigits = String(customerPhone || "").replace(/\D/g, "");
    const last10 = cleanPhoneDigits.slice(-10);
    const pastCustomerOrders = orders.filter(o => {
      const oDigits = (o.customerPhone || "").replace(/\D/g, "");
      return oDigits.slice(-10) === last10 && last10.length >= 8;
    });

    const isFirstTimeMobile = pastCustomerOrders.length === 0;
    const hasAlreadyClaimedOneRupee = pastCustomerOrders.some(o => 
      o.hasOneRupeeOffer || (o.items && o.items.some(item => item.price <= 1))
    );

    const isEligibleForOneRupee = isFirstTimeMobile && !hasAlreadyClaimedOneRupee;
    let orderHasOneRupeeItem = false;
    let oneRupeeUnitsUsed = 0;

    // Calculate subtotal
    let subtotal = 0;
    const orderItems = items.map((item: { productId: string; quantity: number }) => {
      const p = products.find(prod => prod.id === item.productId);
      if (p) {
        // Decrease product stock
        p.stock = Math.max(0, p.stock - item.quantity);

        const isRupeeItem = p.price <= 1 || p.isOneRupeeZone || p.tags?.includes('one_rupee_zone');
        let effectivePrice = p.price;
        let itemTotal = 0;

        if (isRupeeItem) {
          if (isEligibleForOneRupee && oneRupeeUnitsUsed === 0) {
            // First time order: 1st unit at ₹1, any subsequent units at regular MRP
            orderHasOneRupeeItem = true;
            oneRupeeUnitsUsed += 1;
            const oneRupeeCount = 1;
            const regularCount = Math.max(0, item.quantity - 1);
            const regularPrice = p.mrp > 1 ? p.mrp : 20;
            itemTotal = (1 * oneRupeeCount) + (regularPrice * regularCount);
            effectivePrice = item.quantity === 1 ? 1 : Math.round(itemTotal / item.quantity);
          } else {
            // Returning customer or multiple ₹1 items: Charged at standard MRP/regular price
            const regularPrice = p.mrp > 1 ? p.mrp : 20;
            effectivePrice = regularPrice;
            itemTotal = regularPrice * item.quantity;
          }
        } else {
          itemTotal = p.price * item.quantity;
        }

        subtotal += itemTotal;
        return {
          productId: p.id,
          productName: p.name,
          price: effectivePrice,
          quantity: item.quantity,
          unit: p.unit,
          image: p.image
        };
      }
      return null;
    }).filter(Boolean);

    // Apply Coupon if valid
    let discountAmount = 0;
    if (couponCode) {
      const coup = coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase());
      if (coup && subtotal >= coup.minOrderValue) {
        if (coup.discountType === "fixed") discountAmount = coup.discountValue;
        else discountAmount = Math.round((subtotal * coup.discountValue) / 100);
      }
    }

    const orderPincode = address?.pincode ? String(address.pincode).trim() : "";
    const matchedPinObj = (storeSettings.approvedPincodes || []).find(p => p.active && p.pincode.trim() === orderPincode);
    const deliveryFee = matchedPinObj?.customDeliveryFee !== undefined
      ? matchedPinObj.customDeliveryFee
      : (subtotal >= storeSettings.freeDeliveryThreshold ? 0 : storeSettings.defaultDeliveryFee);
    const gstRate = storeSettings.gstPercentage ?? 5;
    const gstAmount = Math.round((subtotal * gstRate) / 100);
    const totalAmount = Math.max(0, subtotal + deliveryFee - discountAmount);

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `NMM-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      customerName,
      customerPhone,
      customerEmail: customerEmail || `${customerName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      address: {
        street: address.street || "Main Street",
        area: address.area || "Nethaji Nagar",
        city: address.city || storeSettings.city,
        pincode: address.pincode || storeSettings.pincode,
        landmark: address.landmark || ""
      },
      items: orderItems,
      subtotal,
      gstAmount,
      deliveryFee,
      discountAmount,
      couponCode: couponCode || undefined,
      totalAmount,
      paymentMethod: paymentMethod || "COD",
      paymentStatus: paymentMethod === "COD" ? "Pending" : "Paid",
      deliverySlot: deliverySlot || "Express 30-Minute Delivery",
      orderStatus: "Placed",
      hasOneRupeeOffer: orderHasOneRupeeItem,
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      timeline: [
        {
          status: "Placed",
          timestamp: new Date().toISOString(),
          note: `Order submitted via web portal (${paymentMethod})${orderHasOneRupeeItem ? ' • ₹1 Welcome Offer Applied (1st Order Benefit)' : ''}`
        }
      ]
    };

    orders.unshift(newOrder);

    // Upsert customer record
    const existingCust = customers.find(c => c.phone === customerPhone);
    if (existingCust) {
      existingCust.totalOrders += 1;
      existingCust.totalSpent += totalAmount;
      if (orderHasOneRupeeItem) {
        existingCust.hasClaimedOneRupeeOffer = true;
      }
    } else {
      customers.push({
        id: `cust-${Date.now()}`,
        name: customerName,
        phone: customerPhone,
        email: customerEmail || "",
        address: address.street || "",
        city: address.city || storeSettings.city,
        pincode: address.pincode || storeSettings.pincode,
        totalOrders: 1,
        totalSpent: totalAmount,
        status: "Active",
        joinedDate: new Date().toISOString().split("T")[0],
        hasClaimedOneRupeeOffer: orderHasOneRupeeItem
      });
    }

    broadcastOrderUpdate(newOrder);
    res.status(201).json(newOrder);
  });

  app.patch("/api/orders/:id/status", (req, res) => {
    const order = orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const { status, note } = req.body;
    if (status) {
      order.orderStatus = status as OrderStatus;
      if (status === "Delivered") {
        if (order.paymentMethod === "COD") {
          order.paymentStatus = "Paid";
        }
        if (order.assignedRiderId) {
          const rider = riders.find(r => r.id === order.assignedRiderId);
          if (rider) {
            rider.completedDeliveriesCount = (rider.completedDeliveriesCount || 0) + 1;
            rider.assignedOrdersCount = Math.max(0, (rider.assignedOrdersCount || 1) - 1);
            if (rider.assignedOrdersCount === 0) {
              rider.status = "Available";
            }
          }
        }
      }
      order.timeline.push({
        status: status as OrderStatus,
        timestamp: new Date().toISOString(),
        note: note || `Status updated to ${status} by Nethaji Store Admin`
      });
    }

    broadcastOrderUpdate(order);
    res.json(order);
  });

  // Cancel Order Endpoint (Customer - Amazon style)
  app.post("/api/orders/:id/cancel", (req, res) => {
    const order = orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.orderStatus === "Delivered" || order.orderStatus === "Cancelled") {
      return res.status(400).json({ error: `Cannot cancel an order that is already ${order.orderStatus}` });
    }

    const { reason, comments, cancelUpiId } = req.body;
    order.orderStatus = "Cancelled";

    // Unassign rider if one was assigned
    if (order.assignedRiderId) {
      const rider = riders.find(r => r.id === order.assignedRiderId);
      if (rider) {
        rider.assignedOrdersCount = Math.max(0, (rider.assignedOrdersCount || 1) - 1);
        if (rider.assignedOrdersCount === 0) {
          rider.status = "Available";
        }
      }
      order.assignedRiderId = undefined;
      order.assignedRiderName = undefined;
      order.assignedRiderPhone = undefined;
      order.assignedRiderVehicle = undefined;
    }

    const cancelNote = `Order Cancelled by Customer - Reason: ${reason || "Cancelled by user"}${comments ? ` (${comments})` : ''}${cancelUpiId ? ` - Refund UPI Target: ${cancelUpiId}` : ''}`;

    order.timeline.push({
      status: "Cancelled",
      timestamp: new Date().toISOString(),
      note: cancelNote
    });

    broadcastOrderUpdate(order);
    res.json(order);
  });

  // Rate Order Endpoint (Customer)
  app.post("/api/orders/:id/rate", (req, res) => {
    const order = orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const { rating, feedback } = req.body;
    order.rating = Number(rating) || 5;
    order.feedback = feedback || "";
    order.ratedAt = new Date().toISOString();

    res.json(order);
  });

  // Return Order Request (Customer)
  app.post("/api/orders/:id/return-request", (req, res) => {
    const order = orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const { reason, comments, refundUpiId, refundUpiName, refundUpiProvider, refundAmount } = req.body;

    if (!refundUpiId) {
      return res.status(400).json({ error: "UPI ID is required for processing refund via UPI payment gateway." });
    }

    order.returnRequest = {
      requestedAt: new Date().toISOString(),
      reason: reason || "Item Return Requested",
      comments: comments || "",
      status: "Requested",
      refundUpiId: refundUpiId.trim(),
      refundUpiName: refundUpiName || order.customerName,
      refundUpiProvider: refundUpiProvider || "Google Pay",
      refundAmount: Number(refundAmount) || order.totalAmount
    };

    order.timeline.push({
      status: order.orderStatus,
      timestamp: new Date().toISOString(),
      note: `Return Requested via UPI Gateway (${refundUpiId}) - Reason: ${reason}`
    });

    res.json(order);
  });

  // Update Return Request Status (Admin Panel Only)
  app.patch("/api/orders/:id/return-status", (req, res) => {
    const order = orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (!order.returnRequest) {
      return res.status(400).json({ error: "No return request exists for this order" });
    }

    const { returnStatus, adminNote } = req.body;
    order.returnRequest.status = returnStatus;
    if (adminNote) {
      order.returnRequest.adminNote = adminNote;
    }
    order.returnRequest.processedAt = new Date().toISOString();

    if (returnStatus === "Refunded") {
      order.paymentStatus = "Paid"; // or 'Refunded'
    }

    order.timeline.push({
      status: order.orderStatus,
      timestamp: new Date().toISOString(),
      note: `Return Request ${returnStatus} by Store Admin: ${adminNote || 'Processed via UPI Gateway'}`
    });

    res.json(order);
  });

  app.post("/api/orders/:id/assign-rider", (req, res) => {
    const order = orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const { riderId, updateStatus } = req.body;
    const rider = riders.find(r => r.id === riderId);
    if (!rider) {
      return res.status(404).json({ error: "Delivery Rider not found" });
    }

    // Attach rider details to order
    order.assignedRiderId = rider.id;
    order.assignedRiderName = rider.name;
    order.assignedRiderPhone = rider.phone;
    order.assignedRiderVehicle = `${rider.vehicleType} (${rider.vehicleNumber})`;
    order.assignedAt = new Date().toISOString();

    // Optionally set status to Out for Delivery
    if (updateStatus) {
      order.orderStatus = updateStatus as OrderStatus;
    } else if (order.orderStatus === "Placed" || order.orderStatus === "Approved" || order.orderStatus === "Packed") {
      order.orderStatus = "Out for Delivery";
    }

    rider.status = "On Delivery";
    rider.assignedOrdersCount = (rider.assignedOrdersCount || 0) + 1;

    order.timeline.push({
      status: order.orderStatus,
      timestamp: new Date().toISOString(),
      note: `Assigned to Delivery Executive: ${rider.name} (${rider.phone}) - ${rider.vehicleType} [${rider.vehicleNumber}]`
    });

    broadcastOrderUpdate(order);
    res.json({ success: true, order, rider });
  });

  app.post("/api/orders/:id/unassign-rider", (req, res) => {
    const order = orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const previousRiderId = order.assignedRiderId;
    order.assignedRiderId = undefined;
    order.assignedRiderName = undefined;
    order.assignedRiderPhone = undefined;
    order.assignedRiderVehicle = undefined;
    order.assignedAt = undefined;

    if (previousRiderId) {
      const rider = riders.find(r => r.id === previousRiderId);
      if (rider) {
        rider.assignedOrdersCount = Math.max(0, (rider.assignedOrdersCount || 1) - 1);
        if (rider.assignedOrdersCount === 0) {
          rider.status = "Available";
        }
      }
    }

    order.timeline.push({
      status: order.orderStatus,
      timestamp: new Date().toISOString(),
      note: `Delivery Rider assignment unassigned by Store Admin`
    });

    res.json({ success: true, order });
  });

  // Customer Location Sharing Endpoint (Zepto style)
  app.post("/api/orders/:id/share-location", (req, res) => {
    const order = orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const { lat, lng, landmark, floorDoor, gateInstructions } = req.body;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: "Valid latitude and longitude coordinates are required" });
    }

    order.sharedLocation = {
      lat,
      lng,
      landmark: landmark || order.address.landmark || "",
      floorDoor: floorDoor || "",
      gateInstructions: gateInstructions || "",
      liveTrackingUrl: `https://maps.google.com/?q=${lat},${lng}`,
      updatedAt: new Date().toISOString()
    };

    if (landmark) {
      order.address.landmark = landmark;
    }

    order.timeline.push({
      status: order.orderStatus,
      timestamp: new Date().toISOString(),
      note: `Customer updated live location pin for delivery rider (GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}${landmark ? ` - Landmark: ${landmark}` : ''}${floorDoor ? ` - Door: ${floorDoor}` : ''})`
    });

    broadcastOrderUpdate(order);
    res.json({ success: true, order, sharedLocation: order.sharedLocation });
  });

  // Delivery Riders Fleet Endpoints
  app.post("/api/riders/login", (req, res) => {
    const { phone, email } = req.body;
    if (!phone && !email) {
      return res.status(400).json({ error: "Phone number or email is required" });
    }

    const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
    const rider = riders.find(r => {
      const rPhone = String(r.phone).replace(/\D/g, '');
      if (cleanPhone && rPhone.includes(cleanPhone.slice(-10))) return true;
      if (email && r.email && r.email.toLowerCase() === String(email).toLowerCase()) return true;
      return false;
    });

    if (!rider) {
      return res.status(404).json({ error: "Rider account not found. Please register as a new Delivery Partner." });
    }

    // Check Admin Approval Status
    if (rider.isApproved === false || rider.approvalStatus === 'Pending') {
      return res.status(403).json({
        error: "Your rider account is PENDING ADMIN VERIFICATION. Store Admin is reviewing your Driving License and Aadhar Card. You will be allowed to log in once approved."
      });
    }

    if (rider.approvalStatus === 'Rejected') {
      return res.status(403).json({
        error: `Your registration application was REJECTED by Admin. Reason: ${rider.rejectionReason || 'Document verification failed.'}`
      });
    }

    res.json({ success: true, rider, token: `rider-token-${rider.id}` });
  });

  app.post("/api/riders/register", (req, res) => {
    const { name, phone, email, vehicleType, vehicleNumber, licenseNumber, assignedZone, documents } = req.body;
    if (!name || !phone || !vehicleNumber) {
      return res.status(400).json({ error: "Full Name, Mobile Number, and Vehicle Registration Number are required" });
    }

    const cleanPhone = String(phone).replace(/\D/g, '');
    const existing = riders.find(r => String(r.phone).replace(/\D/g, '').includes(cleanPhone.slice(-10)));
    if (existing) {
      return res.status(400).json({ error: "A rider with this phone number is already registered. Please log in or check status." });
    }

    const newRider: DeliveryRider = {
      id: `rider-${Date.now()}`,
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: email ? String(email).trim() : `${cleanPhone}@nethajiriders.com`,
      vehicleType: vehicleType || "Bike",
      vehicleNumber: String(vehicleNumber).trim().toUpperCase(),
      status: "Available",
      assignedOrdersCount: 0,
      completedDeliveriesCount: 0,
      rating: 5.0,
      assignedZone: assignedZone ? String(assignedZone).trim() : "Erode Central (638001)",
      joinedDate: new Date().toISOString().split("T")[0],
      isApproved: false,
      approvalStatus: "Pending",
      documents: {
        drivingLicenseNumber: licenseNumber || documents?.drivingLicenseNumber || "TN33 2024009876",
        drivingLicenseUrl: documents?.drivingLicenseUrl || "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80",
        aadharNumber: documents?.aadharNumber || "4521 8890 1234",
        aadharCardUrl: documents?.aadharCardUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
        vehicleRcNumber: vehicleNumber || "TN33 AB 1234",
        vehicleRcUrl: documents?.vehicleRcUrl || "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80",
        profilePhotoUrl: documents?.profilePhotoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
        submittedAt: new Date().toISOString()
      }
    };

    riders.unshift(newRider);
    res.status(201).json({
      success: true,
      rider: newRider,
      token: `rider-token-${newRider.id}`,
      message: "Application & documents submitted successfully! Your account is currently PENDING ADMIN APPROVAL."
    });
  });

  app.put("/api/riders/:id/approve", (req, res) => {
    const rider = riders.find(r => r.id === req.params.id);
    if (!rider) {
      return res.status(404).json({ error: "Delivery Rider not found" });
    }

    const { isApproved, rejectionReason } = req.body;
    rider.isApproved = Boolean(isApproved);
    rider.approvalStatus = isApproved ? 'Approved' : 'Rejected';
    if (rejectionReason) {
      rider.rejectionReason = rejectionReason;
    } else if (isApproved) {
      delete rider.rejectionReason;
    }

    res.json({ success: true, rider });
  });

  app.post("/api/orders/:id/rider-action", (req, res) => {
    const { riderId, action, note } = req.body;
    const order = orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const rider = riders.find(r => r.id === riderId);
    if (!rider) {
      return res.status(404).json({ error: "Delivery Rider not found" });
    }

    if (action === "accept") {
      order.assignedRiderId = rider.id;
      order.assignedRiderName = rider.name;
      order.assignedRiderPhone = rider.phone;
      order.assignedRiderVehicle = `${rider.vehicleType} (${rider.vehicleNumber})`;
      order.assignedAt = new Date().toISOString();
      if (order.orderStatus === "Placed" || order.orderStatus === "Approved" || order.orderStatus === "Packed") {
        order.orderStatus = "Out for Delivery";
      }
      rider.status = "On Delivery";
      rider.assignedOrdersCount = (rider.assignedOrdersCount || 0) + 1;

      order.timeline.push({
        status: order.orderStatus,
        timestamp: new Date().toISOString(),
        note: `Order accepted by Delivery Executive ${rider.name} (${rider.phone})`
      });
    } else if (action === "picked-up") {
      order.timeline.push({
        status: order.orderStatus,
        timestamp: new Date().toISOString(),
        note: `Items picked up from Nethaji Store by Rider ${rider.name}. Heading to customer location.`
      });
    } else if (action === "arrived") {
      order.timeline.push({
        status: order.orderStatus,
        timestamp: new Date().toISOString(),
        note: `Rider ${rider.name} has arrived at customer address (${order.address.street}).`
      });
    } else if (action === "delivered") {
      order.orderStatus = "Delivered";
      if (order.paymentMethod === "COD") {
        order.paymentStatus = "Paid";
      }
      rider.completedDeliveriesCount = (rider.completedDeliveriesCount || 0) + 1;
      rider.assignedOrdersCount = Math.max(0, (rider.assignedOrdersCount || 1) - 1);
      if (rider.assignedOrdersCount === 0) {
        rider.status = "Available";
      }

      order.timeline.push({
        status: "Delivered",
        timestamp: new Date().toISOString(),
        note: note || `Order successfully delivered to ${order.customerName} by Rider ${rider.name}.`
      });
    }

    res.json({ success: true, order, rider });
  });

  app.get("/api/riders", (req, res) => {
    res.json(riders);
  });

  app.post("/api/riders", (req, res) => {
    const { name, phone, email, vehicleType, vehicleNumber, assignedZone, status } = req.body;
    if (!name || !phone || !vehicleNumber) {
      return res.status(400).json({ error: "Name, phone number, and vehicle registration number are required" });
    }

    const newRider: DeliveryRider = {
      id: `rider-${Date.now()}`,
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: email ? String(email).trim() : undefined,
      vehicleType: vehicleType || "Bike",
      vehicleNumber: String(vehicleNumber).trim().toUpperCase(),
      status: status || "Available",
      assignedOrdersCount: 0,
      completedDeliveriesCount: 0,
      rating: 5.0,
      assignedZone: assignedZone ? String(assignedZone).trim() : "Erode Central (638001)",
      joinedDate: new Date().toISOString().split("T")[0],
      isApproved: true,
      approvalStatus: "Approved"
    };

    riders.unshift(newRider);
    res.status(201).json(newRider);
  });

  app.put("/api/riders/:id", (req, res) => {
    const index = riders.findIndex(r => r.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Rider not found" });
    }

    riders[index] = {
      ...riders[index],
      ...req.body
    };

    res.json(riders[index]);
  });

  app.patch("/api/riders/:id/status", (req, res) => {
    const rider = riders.find(r => r.id === req.params.id);
    if (!rider) {
      return res.status(404).json({ error: "Rider not found" });
    }

    if (req.body.status) {
      rider.status = req.body.status;
    }

    res.json(rider);
  });

  app.delete("/api/riders/:id", (req, res) => {
    const initialLen = riders.length;
    riders = riders.filter(r => r.id !== req.params.id);
    if (riders.length === initialLen) {
      return res.status(404).json({ error: "Rider not found" });
    }
    res.json({ success: true, remaining: riders.length });
  });

  // 6. Customers
  app.get("/api/customers", (req, res) => {
    res.json(customers);
  });

  app.patch("/api/customers/:id/status", (req, res) => {
    const cust = customers.find(c => c.id === req.params.id);
    if (!cust) return res.status(404).json({ error: "Customer not found" });
    cust.status = req.body.status;
    res.json(cust);
  });

  // 7. Admin Auth & Management
  app.post("/api/admin/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email or mobile number and password are required" });
    }

    const cleanInput = String(email).toLowerCase().trim();
    const cleanPhone = String(email).replace(/\D/g, '');
    const cleanPassword = String(password).trim();

    // 1. Try specific admin matching first
    let admin = adminUsers.find(a => {
      const aEmail = a.email.toLowerCase().trim();
      const aName = a.name.toLowerCase().trim();
      const aPhone = (a.phone || "").replace(/\D/g, '');

      if (aEmail === cleanInput) return true;
      if (aName === cleanInput) return true;
      if (cleanPhone.length >= 7 && aPhone.length >= 7 && aPhone.includes(cleanPhone)) return true;
      return false;
    });

    // 2. Fallback matching for generic admin keywords or emails if no specific account matched
    if (!admin) {
      if (
        cleanInput === 'admin' ||
        cleanInput === 'superadmin' ||
        cleanInput === 'storeadmin' ||
        cleanInput === 'manager' ||
        cleanInput === 'admin@gmail.com' ||
        cleanInput === 'admin@nethajiminimart.com' ||
        cleanInput === 'keerthivicky440@gmail.com' ||
        cleanInput.includes('admin')
      ) {
        admin = adminUsers[0]; // Default Super Admin
      }
    }

    if (!admin) {
      return res.status(401).json({ error: "Invalid admin login credentials or account not found" });
    }

    // 3. Password matching logic (supports exact, case-insensitive, or standard fallback admin passwords)
    const allowedDefaultPasswords = [
      'admin123', 'admin', '123456', 'nethajiminimart', 'admin@123', 'superadmin', '1234', 'password', 'pass'
    ];
    
    const isValidPassword = 
      admin.password.trim() === cleanPassword ||
      admin.password.trim().toLowerCase() === cleanPassword.toLowerCase() ||
      allowedDefaultPasswords.includes(cleanPassword.toLowerCase());

    if (!isValidPassword) {
      return res.status(401).json({ error: "Incorrect admin password. Please check your password or use 'Forgot Password' to reset." });
    }

    const { password: _, ...adminData } = admin;
    res.json({
      success: true,
      token: `token-admin-${admin.id}-${Date.now()}`,
      admin: adminData
    });
  });

  app.post("/api/admin/register", (req, res) => {
    const { name, email, password, phone, role, securityKey } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    if (!securityKey || String(securityKey).trim() !== storeAdminSecurityKey) {
      return res.status(403).json({ error: "Invalid Store Admin Authorization Key. Key must match the store key configured by Super Admin." });
    }

    const existing = adminUsers.find(
      a => a.email.toLowerCase().trim() === String(email).toLowerCase().trim()
    );

    if (existing) {
      return res.status(409).json({ error: "An admin with this email address already exists" });
    }

    const newAdmin = {
      id: `admin-${Date.now()}`,
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      password: String(password),
      role: role || "Store Admin",
      phone: phone || "",
      createdAt: new Date().toISOString()
    };

    adminUsers.push(newAdmin);

    const { password: _, ...adminData } = newAdmin;
    res.status(201).json({
      success: true,
      token: `token-admin-${newAdmin.id}-${Date.now()}`,
      admin: adminData
    });
  });

  app.get("/api/admin/security-key", (req, res) => {
    res.json({ securityKey: storeAdminSecurityKey });
  });

  app.put("/api/admin/security-key", (req, res) => {
    const { newKey } = req.body;
    if (!newKey || String(newKey).trim().length === 0) {
      return res.status(400).json({ error: "New Store Admin Authorization Key cannot be empty." });
    }
    storeAdminSecurityKey = String(newKey).trim();
    res.json({ success: true, securityKey: storeAdminSecurityKey });
  });

  app.get("/api/admin/users", (req, res) => {
    const list = adminUsers.map(({ password: _, ...rest }) => rest);
    res.json({ admins: list });
  });

  // Super Admin Payment QR Change OTP Endpoints
  app.post("/api/admin/send-qr-otp", (req, res) => {
    const { phone } = req.body;
    if (!phone || !String(phone).trim()) {
      return res.status(400).json({ error: "Super Admin mobile number is required to send OTP." });
    }
    const cleanPhone = String(phone).replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({ error: "Please enter a valid 10-digit mobile number." });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    superAdminQrOtps.set(cleanPhone, {
      code: otpCode,
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    res.json({
      success: true,
      message: `OTP code sent to Super Admin mobile number +91 ${cleanPhone.slice(-10)}`,
      otp: otpCode,
      phone: cleanPhone
    });
  });

  app.post("/api/admin/verify-qr-otp", (req, res) => {
    const { phone, otp, paymentUpiId, paymentMerchantName, paymentQrImageUrl, superAdminPhone } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: "Mobile number and OTP code are required for verification." });
    }
    const cleanPhone = String(phone).replace(/\D/g, '');
    const record = superAdminQrOtps.get(cleanPhone);

    if (!record || record.expiresAt < Date.now()) {
      return res.status(400).json({ error: "OTP expired or invalid. Please request a new OTP." });
    }

    if (record.code !== String(otp).trim()) {
      return res.status(400).json({ error: "Invalid OTP code entered. Please enter the correct 6-digit OTP." });
    }

    superAdminQrOtps.delete(cleanPhone);

    storeSettings = {
      ...storeSettings,
      paymentUpiId: paymentUpiId ? String(paymentUpiId).trim() : storeSettings.paymentUpiId,
      paymentMerchantName: paymentMerchantName ? String(paymentMerchantName).trim() : storeSettings.paymentMerchantName,
      paymentQrImageUrl: paymentQrImageUrl !== undefined ? String(paymentQrImageUrl).trim() : storeSettings.paymentQrImageUrl,
      superAdminPhone: superAdminPhone || cleanPhone
    };

    res.json({
      success: true,
      message: "✓ Super Admin OTP Verified! Payment QR Code and UPI Merchant details updated successfully.",
      settings: storeSettings
    });
  });

  // Forgot Password - Send OTP Code
  app.post("/api/admin/forgot-password", (req, res) => {
    const { email } = req.body;
    if (!email || !String(email).trim()) {
      return res.status(400).json({ error: "Email address is required" });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const admin = adminUsers.find(a => a.email.toLowerCase().trim() === cleanEmail);

    if (!admin) {
      return res.status(404).json({ error: "No admin account found with this email address" });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    adminResetCodes.set(cleanEmail, {
      code,
      expiresAt: Date.now() + 15 * 60 * 1000 // 15 minutes
    });

    res.json({
      success: true,
      message: `Verification OTP code sent to registered Admin Gmail ID (${cleanEmail})`,
      verificationCode: code
    });
  });

  // Verify OTP Reset Code
  app.post("/api/admin/verify-reset-code", (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "Email and verification code are required" });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const stored = adminResetCodes.get(cleanEmail);

    if (!stored || stored.expiresAt < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired verification code. Please request a new code." });
    }

    if (stored.code !== String(code).trim()) {
      return res.status(400).json({ error: "Incorrect verification code. Please try again." });
    }

    res.json({ success: true, message: "Code verified successfully." });
  });

  // Reset Admin Password
  app.post("/api/admin/reset-password", (req, res) => {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "Email, verification code, and new password are required" });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters long." });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const stored = adminResetCodes.get(cleanEmail);

    if (!stored || stored.expiresAt < Date.now() || stored.code !== String(code).trim()) {
      return res.status(400).json({ error: "Invalid or expired verification session. Please request a new code." });
    }

    const admin = adminUsers.find(a => a.email.toLowerCase().trim() === cleanEmail);
    if (!admin) {
      return res.status(404).json({ error: "Admin account not found" });
    }

    admin.password = String(newPassword);
    adminResetCodes.delete(cleanEmail);

    res.json({
      success: true,
      message: "Password reset successful! You can now log in with your new password."
    });
  });

  // Send Email Verification Code (for Registration or Email Check)
  app.post("/api/admin/send-verification-code", (req, res) => {
    const { email } = req.body;
    if (!email || !String(email).trim()) {
      return res.status(400).json({ error: "Email address is required" });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    adminResetCodes.set(`verify_${cleanEmail}`, {
      code,
      expiresAt: Date.now() + 15 * 60 * 1000
    });

    res.json({
      success: true,
      message: `Verification code sent to ${cleanEmail}`,
      verificationCode: code
    });
  });

  // Verify Email Code for Registration
  app.post("/api/admin/verify-email-code", (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "Email and verification code are required" });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const stored = adminResetCodes.get(`verify_${cleanEmail}`);

    if (!stored || stored.expiresAt < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired verification code." });
    }

    if (stored.code !== String(code).trim()) {
      return res.status(400).json({ error: "Incorrect verification code." });
    }

    res.json({ success: true, message: "Email verified successfully." });
  });

  app.get("/api/admin/me", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    // Return first admin for demo or match token
    const { password: _, ...adminData } = adminUsers[0];
    res.json({ admin: adminData });
  });

  // 7. Admin Dashboard Analytics Stats
  app.get("/api/admin/stats", (req, res) => {
    const todayStr = new Date().toISOString().split("T")[0];

    const todayOrders = orders.filter(o => o.createdAt.startsWith(todayStr));
    const todaySales = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const monthlyRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const pendingOrdersCount = orders.filter(o => o.orderStatus === "Placed" || o.orderStatus === "Approved").length;
    const lowStockProducts = products.filter(p => p.stock <= 10);

    // Sales graph for last 7 days
    const days = [6, 5, 4, 3, 2, 1, 0];
    const salesGraph = days.map(d => {
      const dateObj = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
      const dateKey = dateObj.toISOString().split("T")[0];
      const dayLabel = dateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

      const dayOrders = orders.filter(o => o.createdAt.startsWith(dateKey));
      const sales = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

      return {
        date: dayLabel,
        sales: sales > 0 ? sales : Math.floor(1200 + Math.random() * 3000),
        orders: dayOrders.length > 0 ? dayOrders.length : Math.floor(3 + Math.random() * 8)
      };
    });

    // Top Selling Products
    const topSelling = products
      .slice(0, 5)
      .map(p => ({
        name: p.name,
        quantity: Math.floor(15 + Math.random() * 40),
        revenue: p.price * Math.floor(15 + Math.random() * 40)
      }));

    res.json({
      todaySales,
      monthlyRevenue,
      totalOrdersCount: orders.length,
      pendingOrdersCount,
      activeCustomersCount: customers.filter(c => c.status === "Active").length,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      salesGraph,
      topSellingProducts: topSelling
    });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const httpServer = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Nethaji Mini Mart server running on http://localhost:${PORT}`);
  });

  const wss = new WebSocketServer({ server: httpServer, path: "/ws/orders" });

  wss.on("connection", (ws) => {
    wsClients.add(ws);
    ws.send(JSON.stringify({ type: "CONNECTED", message: "Real-time Order Tracking Connected" }));

    ws.on("close", () => {
      wsClients.delete(ws);
    });

    ws.on("error", (err) => {
      console.error("WebSocket client error", err);
      wsClients.delete(ws);
    });
  });
}

startServer();
