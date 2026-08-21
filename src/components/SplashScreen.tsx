import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NethajiLogo } from './NethajiLogo';

interface SplashScreenProps {
  onComplete?: () => void;
  minDuration?: number; // in milliseconds
  storeName?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  minDuration = 1800,
  storeName = "NETHAJI superm@rt"
}) => {
  const [phase, setPhase] = useState<'splash' | 'done'>('splash');

  useEffect(() => {
    // Complete splash screen after minDuration
    const timer = setTimeout(() => {
      setPhase('done');
      if (onComplete) {
        onComplete();
      }
    }, minDuration);

    return () => {
      clearTimeout(timer);
    };
  }, [minDuration, onComplete]);

  // Fast skip if user taps screen
  const handleSkip = () => {
    setPhase('done');
    if (onComplete) onComplete();
  };

  if (phase === 'done') {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {phase === 'splash' && (
        <motion.div
          key="native-natural-green-splash-screen"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            scale: 1.06,
            transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] } 
          }}
          onClick={handleSkip}
          className="fixed inset-0 z-[9999] bg-[#0f5328] flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden"
          style={{ willChange: 'opacity, transform' }}
        >
          {/* Subtle Ambient Radial Lighting for depth - Organic Natural Green Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(74,222,128,0.22)_0%,_rgba(22,101,52,0.6)_50%,_rgba(9,44,21,0.96)_100%)] pointer-events-none" />

          {/* Centered Brand Logo Animation */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 15 }}
            animate={{ 
              scale: [0.6, 1.04, 1],
              opacity: 1,
              y: 0
            }}
            transition={{
              duration: 0.85,
              ease: [0.16, 1, 0.3, 1],
              times: [0, 0.7, 1]
            }}
            className="relative z-10 flex flex-col items-center justify-center p-6"
          >
            {/* Logo Graphic Container with subtle breathing pulse */}
            <motion.div
              animate={{
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.85
              }}
              className="w-72 sm:w-[360px] max-w-[88vw] drop-shadow-2xl"
            >
              <NethajiLogo size="custom" width="100%" height="auto" theme="on-dark" />
            </motion.div>

            {/* Minimalist Golden Shimmer Micro Loader Bar */}
            <div className="w-36 h-1.5 bg-emerald-950/60 rounded-full mt-4 overflow-hidden relative border border-emerald-400/20 shadow-inner">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  repeat: Infinity,
                  duration: 1.0,
                  ease: "easeInOut"
                }}
                className="w-full h-full bg-gradient-to-r from-transparent via-[#FFC800] to-transparent rounded-full"
              />
            </div>

            {/* Micro Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 0.9, y: 0 }}
              transition={{ delay: 0.45, duration: 0.4 }}
              className="text-[11px] font-extrabold text-emerald-100 uppercase tracking-widest mt-4 font-mono drop-shadow-sm"
            >
              Fresh Everyday • Superfast Delivery
            </motion.p>
          </motion.div>

          {/* Bottom Tap to continue hint */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1.1, duration: 0.3 }}
            className="absolute bottom-7 text-[10px] text-emerald-200 font-medium tracking-wider"
          >
            Tap anywhere to enter
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

