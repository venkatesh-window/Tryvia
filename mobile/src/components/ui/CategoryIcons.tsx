import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const SkincareTubeIcon: React.FC<IconProps> = ({ size = 28, color = '#1A1918', strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Cap */}
    <Rect x="8" y="19" width="8" height="3" rx="0.5" stroke={color} strokeWidth={strokeWidth} />
    {/* Tube body */}
    <Path
      d="M7 3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V5L15.5 19H8.5L7 5V3Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
    {/* Label line / brand indicator */}
    <Path d="M10 9H14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Path d="M10 12H14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

export const LipstickIcon: React.FC<IconProps> = ({ size = 28, color = '#1A1918', strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Base container */}
    <Rect x="7" y="11" width="10" height="11" rx="1" stroke={color} strokeWidth={strokeWidth} />
    {/* Inner collar */}
    <Rect x="8.5" y="8" width="7" height="3" stroke={color} strokeWidth={strokeWidth} />
    {/* Lipstick bullet with angled tip */}
    <Path
      d="M9.5 8V4.5C9.5 3.5 11 2 13 2C14.5 2 14.5 3.5 14.5 4.5V8"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
  </Svg>
);

export const PerfumeBottleIcon: React.FC<IconProps> = ({ size = 28, color = '#1A1918', strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Cap */}
    <Rect x="10" y="2" width="4" height="3" rx="0.5" stroke={color} strokeWidth={strokeWidth} />
    {/* Atomizer / Neck */}
    <Rect x="11" y="5" width="2" height="2" stroke={color} strokeWidth={strokeWidth} />
    {/* Rounded Perfume Bottle */}
    <Path
      d="M5 14C5 9.5 8 8 12 8C16 8 19 9.5 19 14C19 19 16 21 12 21C8 21 5 19 5 14Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
    {/* Inner fragrance liquid / label ring */}
    <Circle cx="12" cy="14.5" r="3" stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);

export const GiftSetIcon: React.FC<IconProps> = ({ size = 28, color = '#1A1918', strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Box Body */}
    <Rect x="4" y="9" width="16" height="13" rx="1" stroke={color} strokeWidth={strokeWidth} />
    {/* Box Lid */}
    <Rect x="3" y="6" width="18" height="3.5" rx="0.5" stroke={color} strokeWidth={strokeWidth} />
    {/* Vertical Ribbon */}
    <Path d="M12 6V22" stroke={color} strokeWidth={strokeWidth} />
    {/* Ribbon Bow */}
    <Path
      d="M12 6C10.5 4 8 3.5 7.5 4.5C7 5.5 8.5 6 12 6Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
    <Path
      d="M12 6C13.5 4 16 3.5 16.5 4.5C17 5.5 15.5 6 12 6Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
  </Svg>
);
