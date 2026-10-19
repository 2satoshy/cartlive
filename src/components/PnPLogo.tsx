import React from 'react';

interface PnPLogoProps {
  className?: string;
  height?: number;
  showClickCollect?: boolean;
}

export const PnPLogo: React.FC<PnPLogoProps> = ({
  className = '',
  height = 36,
  showClickCollect = true,
}) => {
  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <svg
        height={height}
        viewBox="0 0 520 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-auto max-w-full"
        style={{ height: `${height}px` }}
      >
        {/* --- 1. TM LOGO EMBLEM --- */}
        <g id="TM-Emblem">
          {/* Outer blue box */}
          <rect x="2" y="10" width="85" height="60" rx="4" fill="white" stroke="#005AA9" strokeWidth="4" />
          <rect x="6" y="14" width="77" height="52" rx="2" fill="white" stroke="#005AA9" strokeWidth="2" />
          
          {/* Oval light blue background */}
          <rect x="10" y="18" width="69" height="44" rx="20" fill="#60A5FA" />
          
          {/* TM stylized text shape */}
          <path
            d="M 22 28 H 42 V 34 H 35 V 52 H 29 V 34 H 22 V 28 Z"
            fill="#002D62"
          />
          <path
            d="M 44 28 H 52 L 57 42 L 62 28 H 70 V 52 H 64 V 36 L 59 52 H 55 L 50 36 V 52 H 44 V 28 Z"
            fill="#002D62"
          />
        </g>

        {/* --- 2. PICK SECTION --- */}
        <g id="Pick-Section">
          {/* Navy Square Box for P */}
          <rect x="102" y="10" width="58" height="60" rx="8" fill="#002D62" />
          <text x="131" y="55" fontFamily="Arial Black, Impact, sans-serif" fontSize="48" fontWeight="900" fill="white" textAnchor="middle">P</text>
          
          {/* Text "ick" in Navy */}
          <text x="168" y="56" fontFamily="Arial Black, sans-serif" fontSize="42" fontWeight="900" fill="#002D62">ick</text>
        </g>

        {/* --- 3. "n" SECTION --- */}
        <g id="N-Section">
          <text x="248" y="56" fontFamily="Arial Black, sans-serif" fontSize="42" fontWeight="900" fill="#D0021B">n</text>
        </g>

        {/* --- 4. PAY SECTION --- */}
        <g id="Pay-Section">
          {/* Red Square Box for P */}
          <rect x="288" y="10" width="58" height="60" rx="8" fill="#D0021B" />
          <text x="317" y="55" fontFamily="Arial Black, Impact, sans-serif" fontSize="48" fontWeight="900" fill="white" textAnchor="middle">P</text>
          
          {/* Text "ay" in Red */}
          <text x="354" y="56" fontFamily="Arial Black, sans-serif" fontSize="42" fontWeight="900" fill="#D0021B">ay</text>
        </g>

        {/* --- 5. CLICK N COLLECT EMBLEM (OPTIONAL RIGHT SIDE) --- */}
        {showClickCollect && (
          <g id="Click-Collect-Section" transform="translate(425, 5)">
            {/* Shopping Bag Outline */}
            <path
              d="M 28 15 C 28 8 33 3 40 3 C 47 3 52 8 52 15 M 15 18 H 65 V 65 C 65 68 62 70 58 70 H 22 C 18 70 15 68 15 65 Z"
              fill="none"
              stroke="#002D62"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Bag wheels */}
            <circle cx="28" cy="72" r="4.5" fill="none" stroke="#002D62" strokeWidth="3" />
            <circle cx="52" cy="72" r="4.5" fill="none" stroke="#002D62" strokeWidth="3" />

            {/* Click n Collect Red Text */}
            <text x="1" y="24" fontFamily="Arial, sans-serif" fontSize="12" fontStyle="italic" fontWeight="900" fill="#D0021B">Click n</text>
            <text x="1" y="38" fontFamily="Arial, sans-serif" fontSize="13" fontStyle="italic" fontWeight="900" fill="#002D62">Collect</text>
            
            {/* Cursor Click Icon */}
            <path d="M 45 32 L 56 50 L 51 52 L 46 42 L 40 47 Z" fill="#002D62" stroke="white" strokeWidth="1" />
            {/* Click rays */}
            <path d="M 38 28 L 34 24 M 45 23 L 45 18 M 52 28 L 56 24" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}
      </svg>
    </div>
  );
};
