import React from "react";

interface QueenLogoProps {
  size?: number;
  showText?: boolean;
  textColorClass?: string;
}

export default function QueenLogo({ 
  size = 46, 
  showText = true, 
  textColorClass = "text-slate-905" 
}: QueenLogoProps) {
  return (
    <div className="flex items-center gap-3 select-none">
      <div 
        className="relative shrink-0 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background Document (Light Purplish Blue) */}
          <rect 
            x="20" 
            y="22" 
            width="42" 
            height="54" 
            rx="6" 
            fill="#818CF8" 
            fillOpacity="0.45"
          />
          
          {/* Front Document (Deep Royal Blue) */}
          <rect 
            x="26" 
            y="28" 
            width="42" 
            height="54" 
            rx="6" 
            fill="#2E337A" 
            stroke="#1E1E66"
            strokeWidth="0.8"
          />

          {/* Golden Crown on Front Document */}
          <path 
            d="M32 46 L36 34 L43 41 L49 34 L53 46 Z" 
            fill="#F59E0B" 
            stroke="#D97706"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Magnifying Glass (Checkmark lens) */}
          <circle 
            cx="48" 
            cy="56" 
            r="11" 
            fill="#FFFFFF" 
            stroke="#D97706" 
            strokeWidth="2.5" 
          />
          
          {/* Handle */}
          <path 
            d="M56 64 L64 72" 
            stroke="#D97706" 
            strokeWidth="3.2" 
            strokeLinecap="round" 
          />

          {/* Golden Checkmark Inside Lens */}
          <path 
            d="M44 56 L47 59 L52 53" 
            stroke="#D97706" 
            strokeWidth="2.2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="relative">
            {/* Elegant little gold crown on top of Q */}
            <span className="absolute -top-1.5 left-0.5 text-[8px] text-amber-500">👑</span>
            <span className="font-serif text-[17px] font-extrabold tracking-wide uppercase leading-tight text-slate-900 bg-gradient-to-r from-slate-900 to-indigo-950 bg-clip-text text-transparent">
              QUEEN
            </span>
          </div>
          <span className="text-[10px] font-bold text-indigo-650 tracking-wider uppercase font-sans -mt-0.5 whitespace-nowrap">
            SIMILARITY CHECK
          </span>
        </div>
      )}
    </div>
  );
}
