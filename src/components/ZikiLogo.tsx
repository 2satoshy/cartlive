import React from 'react';
import { PnPLogo } from './PnPLogo';

interface ZikiLogoProps {
  className?: string;
  size?: number;
}

export const ZikiLogo: React.FC<ZikiLogoProps> = ({ className = '', size = 32 }) => {
  return <PnPLogo className={className} height={size} showClickCollect={false} />;
};
