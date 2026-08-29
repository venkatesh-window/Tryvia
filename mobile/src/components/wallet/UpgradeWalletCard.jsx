import React from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { Typography } from "../ui/Typography";
import { GlassCard } from "../ui/GlassCard";
import { Sparkles } from "lucide-react-native";
import { theme } from "../../theme/theme";
import Animated, { FadeInUp } from "react-native-reanimated";

export function UpgradeWalletCard({ credit, fullSizePrice, compact = false }) {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 360;
  
  const redeemableAmount = Number(credit?.redeemable_amount ?? credit?.redeemableAmount ?? 0);
  const originalAmount = Number(credit?.original_amount ?? credit?.originalAmount ?? credit?.amount ?? 0);
  const finalPrice = Math.max(0, fullSizePrice - redeemableAmount);

  return (
    <Animated.View entering={FadeInUp.duration(600)}>
      <GlassCard
        intensity={40}
        style={[styles.card, isSmallScreen && { padding: 12 }]}
      >
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <Sparkles size={16} color={theme.colors.text.primary} />
            <Typography
              variant="h3"
              weight="bold"
              style={styles.title}
              numberOfLines={1}
            >
              TRYVIA Upgrade Wallet
            </Typography>
          </View>
          <View style={styles.statusBadge}>
            <Typography
              variant="caption"
              weight="bold"
              style={styles.statusText}
            >
              ELIGIBLE
            </Typography>
          </View>
        </View>

        {!compact && (
          <Typography
            variant="caption"
            color="secondary"
            style={styles.message}
          >
            You previously purchased a tester for this product. 90% of your
            tester purchase is available as a discount towards the full-size
            product!
          </Typography>
        )}

        <View style={styles.breakdownBox}>
          <View style={styles.row}>
            <Typography variant="body" color="secondary">
              Full-size price
            </Typography>
            <Typography variant="body" weight="medium">
              ₹{fullSizePrice.toFixed(2)}
            </Typography>
          </View>

          <View style={styles.row}>
            <Typography
              variant="body"
              color="primary"
              style={{ flexShrink: 1, marginRight: 8 }}
            >
              TRYVIA Wallet Credit
            </Typography>
            <Typography variant="body" color="primary" weight="bold">
              -₹{redeemableAmount.toFixed(2)}
            </Typography>
          </View>

          <View style={[styles.row, styles.totalRow]}>
            <Typography variant="body" weight="bold">
              Amount Payable
            </Typography>
            <Typography
              variant="body"
              weight="bold"
              style={{ fontSize: isSmallScreen ? 16 : 18 }}
            >
              ₹{finalPrice.toFixed(2)}
            </Typography>
          </View>

          {!compact && (
            <View style={{ marginTop: 6 }}>
              <Typography
                variant="caption"
                color="secondary"
                style={{ fontSize: 9 }}
              >
                *Credit derived from previous tester purchase (₹
                {originalAmount} - 25% Platform Fee)
              </Typography>
            </View>
          )}
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.4)", // Subtle gold tint for upgrade
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 8,
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  title: {
    letterSpacing: 0.5,
    fontSize: 15,
  },
  statusBadge: {
    backgroundColor: "rgba(34, 197, 94, 0.15)", // Light green
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  statusText: {
    color: "#15803d",
    fontSize: 9,
    letterSpacing: 0.5,
  },
  message: {
    marginBottom: 12,
    lineHeight: 18,
    fontSize: 12,
  },
  breakdownBox: {
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalRow: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
});
