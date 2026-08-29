import React, { useState } from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { Image } from "expo-image";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { Typography } from "./Typography";
import { useTheme } from "../../hooks/useTheme";
import { Heart, ShoppingBag } from "lucide-react-native";
import { useCartStore } from "../../store/useCartStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useRouter } from "expo-router";

export const ProductCard = ({ product, onPress, style }) => {
  const router = useRouter();
  const theme = useTheme();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [isLiked, setIsLiked] = useState(false);

  // Generate luxury tags if none provided
  const tags =
    product.tags ||
    (product.name.toLowerCase().includes("cream") ||
    product.name.toLowerCase().includes("facial")
      ? ["Hydrating", "For All Skin Types"]
      : product.name.toLowerCase().includes("parfum") ||
          product.name.toLowerCase().includes("eau")
        ? ["Floral", "Luxury"]
        : product.name.toLowerCase().includes("lip") ||
            product.name.toLowerCase().includes("glow")
          ? ["Nourishing", "Glossy"]
          : ["Tester Available", "Best Seller"]);

  const handleAddToCart = (e) => {
    e?.stopPropagation?.();
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const cartProduct = {
      id: product.id,
      name: product.name,
      full_price: product.fullPrice,
      tester_price: product.testerPrice,
      image_url: product.imageUrl,
      brand: { id: 0, name: product.brand },
      category: { id: 0, name: product.category || "Beauty" },
      stock_full: 10,
      stock_tester: 10,
    };
    addItem(cartProduct, "tester");
  };

  const handleToggleLike = (e) => {
    e?.stopPropagation?.();
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }
    if (Platform.OS === "ios") {
      Haptics.selectionAsync();
    }
    setIsLiked((prev) => !prev);
  };

  return (
    <Pressable onPress={onPress} style={[{ width: "100%" }, style]}>
      {({ pressed }) => (
        <MotiView
          animate={{
            scale: pressed ? 0.98 : 1,
            translateY: pressed ? 1 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 350,
            damping: 25,
          }}
          style={styles.cardContainer}
        >
          {/* Top Image Stage */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.image}
              contentFit="cover"
              transition={300}
            />

            {/* Wishlist Heart Button */}
            <Pressable
              onPress={handleToggleLike}
              hitSlop={8}
              style={({ pressed: heartPressed }) => [
                styles.heartBtn,
                heartPressed && { transform: [{ scale: 0.88 }] },
              ]}
            >
              <Heart
                size={18}
                color={isLiked ? "#CB6D73" : "#1A1918"}
                fill={isLiked ? "#CB6D73" : "transparent"}
                strokeWidth={1.5}
              />
            </Pressable>
          </View>

          {/* Bottom Info Section */}
          <View style={styles.infoSection}>
            {/* Brand Title in rose */}
            <Typography
              variant="caption"
              weight="semibold"
              style={styles.brandText}
              numberOfLines={1}
            >
              {product.brand?.toUpperCase()}
            </Typography>

            {/* Product Name */}
            <Typography
              variant="body"
              weight="medium"
              style={styles.nameText}
              numberOfLines={2}
            >
              {product.name}
            </Typography>

            {/* Tags / Chips Row */}
            <View style={styles.tagsRow}>
              {tags.map((tag, idx) => (
                <View key={idx} style={styles.tagChip}>
                  <Typography style={styles.tagLabel}>{tag}</Typography>
                </View>
              ))}
            </View>

            {/* Price & Bag Button */}
            <View style={styles.bottomRow}>
              <Typography variant="h3" weight="bold" style={styles.priceText}>
                ₹{product.testerPrice || product.fullPrice}
              </Typography>

              <Pressable
                onPress={handleAddToCart}
                hitSlop={8}
                style={({ pressed: btnPressed }) => [
                  styles.bagButton,
                  btnPressed && { transform: [{ scale: 0.9 }] },
                ]}
              >
                <ShoppingBag size={17} color="#FFFFFF" strokeWidth={2} />
              </Pressable>
            </View>
          </View>
        </MotiView>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ECE7E1",
    shadowColor: "#32281E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    position: "relative",
    backgroundColor: "#F5F2EC",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  heartBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoSection: {
    padding: 14,
  },
  brandText: {
    color: "#CB6D73",
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 4,
    fontFamily: "Inter_600SemiBold",
  },
  nameText: {
    color: "#1A1918",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
    minHeight: 36,
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  tagChip: {
    backgroundColor: "#F4F0EB",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagLabel: {
    fontSize: 10,
    color: "#65605B",
    fontFamily: "Inter_400Regular",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 2,
  },
  priceText: {
    fontSize: 17,
    color: "#1A1918",
    fontWeight: "700",
  },
  bagButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#CB6D73",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#CB6D73",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 2,
  },
});
