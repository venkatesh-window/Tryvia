import React from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScreenContainer } from "../../src/components/ui/ScreenContainer";
import { Typography } from "../../src/components/ui/Typography";
import { ProductCard } from "../../src/components/ui/ProductCard";
import { productService } from "../../src/api/services/productService";
import { useCartStore } from "../../src/store/useCartStore";
import { useAuthStore } from "../../src/store/useAuthStore";
import { theme } from "../../src/theme/theme";
import { BlurView } from "expo-blur";
import { CreditCard, ShoppingBag } from "lucide-react-native";
import { Image } from "expo-image";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { useResponsive } from "../../src/hooks/useResponsive";

export default function TestersScreen() {
  const router = useRouter();
  const { width, safeTopPadding, bottomTabBarPadding, isSmallDevice } =
    useResponsive();
  const { totalItems } = useCartStore();
  const { user } = useAuthStore();
  const walletBalance = user?.walletBalance || 0;

  const { data: testers, isLoading } = useQuery({
    queryKey: ["allTesters"],
    queryFn: () => productService.getTrendingTesters(),
  });

  const gridCardWidth = (width - 40 - 12) / 2;

  return (
    <ScreenContainer showOrbs={true}>
      {/* Floating Glass Header */}
      <Animated.View
        entering={FadeIn.duration(1000)}
        style={[styles.headerContainer, { paddingTop: safeTopPadding }]}
      >
        <View style={styles.headerTopRow}>
          <Typography variant="h2" weight="medium" style={styles.logo}>
            TESTERS
          </Typography>

          <View style={styles.headerIcons}>
            <BlurView intensity={30} tint="light" style={styles.walletCapsule}>
              <CreditCard size={13} color={theme.colors.text.primary} />
              <Typography
                variant="price"
                weight="bold"
                color="primary"
                numberOfLines={1}
                style={{ marginLeft: 5, fontSize: 13 }}
              >
                ₹{walletBalance}
              </Typography>
            </BlurView>

            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => router.push("/cart")}
              activeOpacity={0.8}
              hitSlop={8}
            >
              <BlurView intensity={40} tint="light" style={styles.cartBtnBlur}>
                <ShoppingBag
                  size={19}
                  color={theme.colors.text.primary}
                  strokeWidth={1.5}
                />
              </BlurView>
              {totalItems > 0 && (
                <View style={styles.badge}>
                  <Typography
                    variant="caption"
                    weight="bold"
                    style={{ color: "#fff", fontSize: 9 }}
                  >
                    {totalItems}
                  </Typography>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomTabBarPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Glass Hero Banner */}
        <Animated.View
          entering={FadeInUp.duration(1000).delay(400)}
          style={styles.bannerWrapper}
        >
          <View style={styles.heroCard}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1200&auto=format&fit=crop",
              }}
              style={styles.heroImg}
              contentFit="cover"
            />
            <BlurView intensity={25} tint="dark" style={styles.heroOverlay} />
            <View style={styles.glassBorder} />

            <View style={styles.heroContent}>
              <Typography variant="h1" weight="medium" style={styles.heroTitle}>
                TRY BEFORE{"\n"}YOU BUY
              </Typography>
              <Typography
                variant="caption"
                style={{ color: "rgba(255,255,255,0.8)", letterSpacing: 1.5 }}
              >
                100% REDEEMABLE TOWARDS FULL SIZE
              </Typography>
            </View>
          </View>
        </Animated.View>

        {/* Apple-style Staggered Grid Feed */}
        <Animated.View
          entering={FadeInUp.duration(1000).delay(600)}
          style={styles.section}
        >
          <Typography variant="h3" weight="medium" style={styles.sectionTitle}>
            Trending Testers
          </Typography>
          <View style={styles.feedGrid}>
            {isLoading ? (
              <Typography
                variant="body"
                color="secondary"
                style={{ textAlign: "center", width: "100%" }}
              >
                Loading...
              </Typography>
            ) : (
              testers?.map((item, index) => (
                <View
                  key={item.id}
                  style={{
                    width: gridCardWidth,
                    marginTop: index % 2 !== 0 ? 24 : 0,
                  }}
                >
                  <ProductCard
                    product={{
                      id: item.id,
                      name: item.name,
                      brand: item.brand?.name || "CHANEL",
                      fullPrice: item.full_price,
                      testerPrice: item.tester_price,
                      imageUrl:
                        item.image_url || "https://via.placeholder.com/300",
                    }}
                    onPress={() => router.push(`/tester/${item.id}`)}
                  />
                </View>
              ))
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingBottom: 12,
    backgroundColor: "transparent",
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  logo: {
    letterSpacing: 3,
    color: theme.colors.text.primary,
    fontSize: 22,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  walletCapsule: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border.glass,
  },
  iconBtn: {
    position: "relative",
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBtnBlur: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  badge: {
    position: "absolute",
    top: -1,
    right: -1,
    backgroundColor: theme.colors.text.primary,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    paddingHorizontal: 3,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    zIndex: 10,
  },
  scrollContent: {
    paddingTop: 12,
  },
  bannerWrapper: {
    paddingHorizontal: 20,
    marginBottom: 36,
  },
  heroCard: {
    width: "100%",
    aspectRatio: 16 / 10,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: theme.colors.shadow.glass,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
    position: "relative",
  },
  heroImg: {
    ...StyleSheet.absoluteFill,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
  },
  heroContent: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 2,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 26,
    marginBottom: 4,
    letterSpacing: 1.5,
    lineHeight: 30,
  },
  glassBorder: {
    ...StyleSheet.absoluteFill,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.6)",
    pointerEvents: "none",
  },
  section: {
    marginBottom: 36,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    marginBottom: 20,
    color: theme.colors.text.primary,
    letterSpacing: 0.5,
    fontSize: 20,
  },
  feedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    justifyContent: "space-between",
    rowGap: 16,
  },
});
