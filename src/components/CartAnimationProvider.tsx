import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';

interface FlyingItem {
  id: string;
  image: string;
  name: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  controlX: number;
  controlY: number;
}

interface ImpactRipple {
  id: string;
  x: number;
  y: number;
  label: string;
}

interface CartAnimationContextType {
  triggerFlyToCart: (product: Product, eventOrElement?: React.MouseEvent | HTMLElement | { clientX: number; clientY: number }) => void;
  isCartBouncing: boolean;
}

const CartAnimationContext = createContext<CartAnimationContextType>({
  triggerFlyToCart: () => {},
  isCartBouncing: false
});

export const useCartAnimation = () => useContext(CartAnimationContext);

// Web Audio API helper for pleasant quick-commerce "Pop" sound
const playCartPopSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // First frequency bump (Pop)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {
    // Silent catch if audio not allowed without gesture
  }
};

export const CartAnimationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const [impactRipples, setImpactRipples] = useState<ImpactRipple[]>([]);
  const [isCartBouncing, setIsCartBouncing] = useState(false);

  const getTargetCartCoordinates = useCallback(() => {
    // 1. Try floating cart bar first if visible
    const floatingBarBtn = document.getElementById('floating-cart-btn') || document.getElementById('floating-cart-bar');
    if (floatingBarBtn) {
      const rect = floatingBarBtn.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight) {
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      }
    }

    // 2. Try header cart button
    const headerCartBtn = document.getElementById('header-cart-btn');
    if (headerCartBtn) {
      const rect = headerCartBtn.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      }
    }

    // 3. Try bottom nav cart icon
    const bottomNavCart = document.getElementById('bottom-nav-cart-btn');
    if (bottomNavCart) {
      const rect = bottomNavCart.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      }
    }

    // Fallback: top right corner area
    return { x: window.innerWidth - 60, y: 30 };
  }, []);

  const triggerFlyToCart = useCallback((
    product: Product,
    eventOrElement?: React.MouseEvent | HTMLElement | { clientX: number; clientY: number }
  ) => {
    let startX = window.innerWidth / 2;
    let startY = window.innerHeight / 2;

    if (eventOrElement) {
      if ('clientX' in eventOrElement && typeof eventOrElement.clientX === 'number') {
        startX = eventOrElement.clientX;
        startY = eventOrElement.clientY;
      } else if ('getBoundingClientRect' in eventOrElement && typeof (eventOrElement as HTMLElement).getBoundingClientRect === 'function') {
        const rect = (eventOrElement as HTMLElement).getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
      }
    }

    const { x: endX, y: endY } = getTargetCartCoordinates();

    // Calculate a curved control point (arc upwards)
    const midX = (startX + endX) / 2;
    const midY = Math.min(startX, endX) < window.innerWidth / 2 
      ? Math.min(startY, endY) - 120 
      : Math.min(startY, endY) - 160;

    const id = `fly-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const newItem: FlyingItem = {
      id,
      image: product.image,
      name: product.name,
      startX,
      startY,
      endX,
      endY,
      controlX: midX,
      controlY: Math.max(20, midY)
    };

    setFlyingItems((prev) => [...prev, newItem]);

    // Schedule impact burst sound and bounce effect when item lands (~600ms)
    setTimeout(() => {
      // Trigger sound
      playCartPopSound();

      // Trigger cart bouncing state
      setIsCartBouncing(true);
      setTimeout(() => setIsCartBouncing(false), 500);

      // Add floating ripple burst
      const rippleId = `ripple-${Date.now()}`;
      setImpactRipples((prev) => [
        ...prev,
        { id: rippleId, x: endX, y: endY, label: '+1' }
      ]);

      setTimeout(() => {
        setImpactRipples((prev) => prev.filter((r) => r.id !== rippleId));
      }, 900);

      // Remove flying item
      setFlyingItems((prev) => prev.filter((item) => item.id !== id));
    }, 620);
  }, [getTargetCartCoordinates]);

  return (
    <CartAnimationContext.Provider value={{ triggerFlyToCart, isCartBouncing }}>
      {children}

      {/* Global Flying Particles Canvas Overlay */}
      <div className="fixed inset-0 pointer-events-none z-9999 overflow-hidden">
        <AnimatePresence>
          {flyingItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{
                x: item.startX - 24,
                y: item.startY - 24,
                scale: 0.4,
                opacity: 0,
                rotate: -15
              }}
              animate={{
                x: [item.startX - 24, item.controlX - 24, item.endX - 18],
                y: [item.startY - 24, item.controlY - 24, item.endY - 18],
                scale: [0.6, 1.25, 0.35],
                opacity: [0, 1, 1, 0.8],
                rotate: [0, 180, 360]
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{
                duration: 0.65,
                ease: [0.2, 0.8, 0.2, 1]
              }}
              className="absolute w-12 h-12 rounded-full bg-white border-2 border-amber-400 p-1 shadow-2xl flex items-center justify-center"
              style={{
                boxShadow: '0 10px 25px -3px rgba(245, 158, 11, 0.6), 0 4px 6px -2px rgba(0, 0, 0, 0.1)'
              }}
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-contain rounded-full"
              />
              
              {/* Particle Trail Sparkles */}
              <motion.div
                animate={{ scale: [1, 1.8, 0], opacity: [0.9, 0.4, 0] }}
                transition={{ duration: 0.4, repeat: Infinity }}
                className="absolute -inset-1 bg-amber-400/30 rounded-full blur-xs -z-10"
              />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-white animate-ping" />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Landing Impact Ripples & Floating "+1" */}
        <AnimatePresence>
          {impactRipples.map((ripple) => (
            <React.Fragment key={ripple.id}>
              {/* Expanding Ring Flash */}
              <motion.div
                initial={{ x: ripple.x - 25, y: ripple.y - 25, scale: 0.2, opacity: 1 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="absolute w-12 h-12 rounded-full border-4 border-emerald-400 bg-emerald-400/20 shadow-lg pointer-events-none"
              />

              {/* Floating "+1" Badge */}
              <motion.div
                initial={{ x: ripple.x - 12, y: ripple.y - 10, scale: 0.5, opacity: 1 }}
                animate={{ y: ripple.y - 50, scale: 1.2, opacity: 0 }}
                transition={{ duration: 0.75, ease: 'easeOut' }}
                className="absolute font-black text-xs text-white bg-gradient-to-r from-emerald-600 to-rose-600 px-2 py-0.5 rounded-full shadow-lg border border-white/80 pointer-events-none flex items-center gap-0.5"
              >
                <span>✨ {ripple.label}</span>
              </motion.div>
            </React.Fragment>
          ))}
        </AnimatePresence>
      </div>
    </CartAnimationContext.Provider>
  );
};
