import { Dimensions, PixelRatio, Platform } from 'react-native';

// Base guideline dimensions based on standard modern smartphone (iPhone 14 / standard 375x812)
const GUIDELINE_BASE_WIDTH = 375;
const GUIDELINE_BASE_HEIGHT = 812;

/**
 * Get current window dimensions dynamically
 */
export const getWindowDimensions = () => Dimensions.get('window');

/**
 * Width percentage to DP
 * @param widthPercent string e.g. "50%" or number e.g. 50
 */
export const wp = (widthPercent: number | string): number => {
  const { width } = Dimensions.get('window');
  const elemWidth = typeof widthPercent === 'number' ? widthPercent : parseFloat(widthPercent);
  return PixelRatio.roundToNearestPixel((width * elemWidth) / 100);
};

/**
 * Height percentage to DP
 * @param heightPercent string e.g. "50%" or number e.g. 50
 */
export const hp = (heightPercent: number | string): number => {
  const { height } = Dimensions.get('window');
  const elemHeight = typeof heightPercent === 'number' ? heightPercent : parseFloat(heightPercent);
  return PixelRatio.roundToNearestPixel((height * elemHeight) / 100);
};

/**
 * Linear horizontal scale based on guideline base width (375)
 */
export const scale = (size: number): number => {
  const { width } = Dimensions.get('window');
  return (width / GUIDELINE_BASE_WIDTH) * size;
};

/**
 * Linear vertical scale based on guideline base height (812)
 */
export const verticalScale = (size: number): number => {
  const { height } = Dimensions.get('window');
  return (height / GUIDELINE_BASE_HEIGHT) * size;
};

/**
 * Moderate scale with dampening factor (default 0.5)
 * Ideal for font sizes and padding that should not grow/shrink too aggressively
 */
export const moderateScale = (size: number, factor = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

/**
 * Moderate vertical scale with dampening factor
 */
export const moderateVerticalScale = (size: number, factor = 0.5): number => {
  return size + (verticalScale(size) - size) * factor;
};

/**
 * Helper to check device size categories
 */
export const isSmallDevice = (): boolean => {
  const { width } = Dimensions.get('window');
  return width <= 360;
};

export const isMediumDevice = (): boolean => {
  const { width } = Dimensions.get('window');
  return width > 360 && width <= 400;
};

export const isLargeDevice = (): boolean => {
  const { width } = Dimensions.get('window');
  return width > 400;
};

export const isShortDevice = (): boolean => {
  const { height } = Dimensions.get('window');
  return height <= 700;
};
