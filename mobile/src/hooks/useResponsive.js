import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PixelRatio } from "react-native";

const GUIDELINE_BASE_WIDTH = 375;
const GUIDELINE_BASE_HEIGHT = 812;

export function useResponsive() {
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isSmallDevice = width <= 360;
  const isMediumDevice = width > 360 && width <= 400;
  const isLargeDevice = width > 400;
  const isShortDevice = height <= 700;
  const isLandscape = width > height;

  const wp = (percent) => {
    return PixelRatio.roundToNearestPixel((width * percent) / 100);
  };

  const hp = (percent) => {
    return PixelRatio.roundToNearestPixel((height * percent) / 100);
  };

  const scale = (size) => {
    return (width / GUIDELINE_BASE_WIDTH) * size;
  };

  const verticalScale = (size) => {
    return (height / GUIDELINE_BASE_HEIGHT) * size;
  };

  const moderateScale = (size, factor = 0.5) => {
    return size + (scale(size) - size) * factor;
  };

  const moderateVerticalScale = (size, factor = 0.5) => {
    return size + (verticalScale(size) - size) * factor;
  };

  // Safe bottom padding for scroll content over floating tab bars or bottom sheets
  const bottomTabBarPadding = insets.bottom + 76;
  const safeTopPadding = Math.max(insets.top, 16);

  return {
    width,
    height,
    fontScale,
    insets,
    isSmallDevice,
    isMediumDevice,
    isLargeDevice,
    isShortDevice,
    isLandscape,
    wp,
    hp,
    scale,
    verticalScale,
    moderateScale,
    moderateVerticalScale,
    bottomTabBarPadding,
    safeTopPadding,
  };
}
