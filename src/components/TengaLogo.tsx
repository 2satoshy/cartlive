import React from 'react';

interface TengaLogoProps {
  className?: string;
  size?: number;
}

export const TengaLogo: React.FC<TengaLogoProps> = ({ className = '', size = 32 }) => {
  return (
    <img
      src="/tenga-logo2.png"
      alt="PnP Express"
      width={size}
      height={size}
      className={`flex-shrink-0 object-contain ${className}`}
    />
  );
};
