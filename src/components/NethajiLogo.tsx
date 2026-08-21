import React from 'react';

interface NethajiLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  width?: number | string;
  height?: number | string;
  theme?: 'natural-green' | 'on-green' | 'on-white' | 'on-dark';
  withBackground?: boolean;
  animated?: boolean;
}

export const NethajiLogo: React.FC<NethajiLogoProps> = ({
  className = '',
  size = 'md',
  width,
  height,
  theme = 'natural-green',
  withBackground = false,
  animated = false,
}) => {
  const sizeMap = {
    sm: { w: 140, h: 140 },
    md: { w: 240, h: 240 },
    lg: { w: 340, h: 340 },
    xl: { w: 440, h: 440 },
    custom: { w: width || 280, h: height || 280 }
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const svgWidth = width || currentSize.w;
  const svgHeight = height || currentSize.h;

  // Natural Green Brand Palette
  // Background: Rich Natural Forest/Emerald Green (#14602E to #0A3E1D)
  // Primary Text & Orbit: Bright Canary Yellow (#FFD214 to #FFBC00)
  // 'superm' & 'rt': Clean Crisp White (#FFFFFF)
  // '@' Accent: Bright Canary Yellow (#FFC700)
  // Leaves: Fresh Green (#15803D & #22C55E)
  const leafDark = "#15803D";
  const leafLight = "#22C55E";
  const supermartColor = theme === 'on-white' ? '#1E293B' : '#FFFFFF';

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 500 500"
        width={svgWidth}
        height={svgHeight}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-auto max-w-full ${animated ? 'animate-in fade-in zoom-in-95 duration-500' : ''}`}
      >
        <defs>
          {/* Natural Green Gradient Background */}
          <linearGradient id="naturalGreenLogoBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14602E" />
            <stop offset="50%" stopColor="#0F5328" />
            <stop offset="100%" stopColor="#0A3E1D" />
          </linearGradient>

          {/* Golden Yellow Gradient */}
          <linearGradient id="nethajiYellowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFD214" />
            <stop offset="100%" stopColor="#FFBC00" />
          </linearGradient>

          {/* Leaves Gradient */}
          <linearGradient id="leafGradTop" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={leafDark} />
            <stop offset="100%" stopColor={leafLight} />
          </linearGradient>
          <linearGradient id="leafGradBottom" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#166534" />
            <stop offset="100%" stopColor="#4ADE80" />
          </linearGradient>
        </defs>

        {/* Optional Embedded Natural Green Background Card */}
        {withBackground && (
          <rect 
            width="500" 
            height="500" 
            rx="44" 
            fill="url(#naturalGreenLogoBg)" 
          />
        )}

        {/* --- 1. THE YELLOW ORBITAL OVAL RING WITH ARROWS --- */}
        <path
          d="M 270 110 C 135 110, 20 170, 20 250 C 20 330, 130 385, 270 385 C 385 385, 475 335, 475 250 C 475 180, 400 128, 302 113"
          stroke="url(#nethajiYellowGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="1400"
          strokeDashoffset="120"
        />

        {/* Top Clockwise Arrow Head */}
        <path
          d="M 312 103 L 296 114 L 308 126 Z"
          fill="url(#nethajiYellowGrad)"
        />

        {/* Bottom Clockwise Arrow Head */}
        <path
          d="M 142 355 L 126 368 L 138 380 Z"
          fill="url(#nethajiYellowGrad)"
          transform="rotate(160 134 368)"
        />

        {/* --- 2. FRESH GREEN TWO-LEAF SPROUT AT TOP-RIGHT OF ORBIT --- */}
        <g transform="translate(378, 142) rotate(-8)">
          {/* Left Leaf */}
          <path
            d="M 0 0 C -16 -20, -6 -40, 12 -44 C 18 -24, 12 -6, 0 0 Z"
            fill="url(#leafGradTop)"
          />
          <path
            d="M 0 0 C 6 -16, 10 -28, 12 -44"
            stroke="#062612"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Right Leaf */}
          <path
            d="M 8 -2 C 22 -16, 36 -22, 46 -16 C 40 -2, 26 6, 8 -2 Z"
            fill="url(#leafGradBottom)"
          />
          <path
            d="M 8 -2 C 24 -6, 34 -12, 46 -16"
            stroke="#062612"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.8"
          />
        </g>

        {/* --- 3. MAIN LOGO TEXT: 'NETHAJI' --- */}
        <g transform="translate(250, 236)">
          <text
            x="0"
            y="0"
            textAnchor="middle"
            fill="url(#nethajiYellowGrad)"
            fontFamily="'Arial Black', 'Montserrat', 'Trebuchet MS', -apple-system, sans-serif"
            fontWeight="900"
            fontSize="84"
            letterSpacing="3"
            style={{ 
              textTransform: 'uppercase',
              filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.25))' 
            }}
          >
            NETHAJI
          </text>
        </g>

        {/* --- 4. SUBTEXT: 'superm@rt' --- */}
        <g transform="translate(250, 310)">
          <text
            x="0"
            y="0"
            textAnchor="middle"
            fontFamily="'Montserrat', 'Arial Black', -apple-system, sans-serif"
            fontWeight="900"
            fontSize="48"
            letterSpacing="0.5"
            style={{ filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.25))' }}
          >
            <tspan fill={supermartColor} fontWeight="900">
              superm
            </tspan>
            <tspan 
              fill="url(#nethajiYellowGrad)" 
              fontSize="56" 
              fontWeight="900"
              dx="1"
            >
              @
            </tspan>
            <tspan fill={supermartColor} fontWeight="900" dx="1">
              rt
            </tspan>
          </text>
        </g>
      </svg>
    </div>
  );
};
