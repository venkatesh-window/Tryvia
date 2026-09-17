import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import {
  ChevronLeft,
  Share2,
  CheckCircle2,
  Download,
} from "lucide-react-native";
import { Typography } from "../../src/components/ui/Typography";
import { useOrderStore } from "../../src/store/useOrderStore";
import { theme } from "../../src/theme/theme";
import { ScreenContainer } from "../../src/components/ui/ScreenContainer";
import { useResponsive } from "../../src/hooks/useResponsive";

export default function InvoiceScreen() {
  const { id } = useLocalSearchParams();
  const { safeTopPadding, insets, isSmallDevice } = useResponsive();
  const { orders, fetchOrders } = useOrderStore();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (orders.length > 0) {
      const found = orders.find((o) => String(o.id) === String(id));
      if (found) setOrder(found);
    }
  }, [orders, id]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Tryvia Tax Invoice #${order?.orderNumber || id}\nTotal: ₹${order?.total || "4,800"}\nStatus: ${order?.status || "Paid"}\nThank you for shopping luxury with Tryvia.`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ScreenContainer showOrbs={false}>
      <View style={[styles.header, { paddingTop: safeTopPadding }]}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
          style={styles.backButton}
          hitSlop={8}
        >
          <ChevronLeft size={22} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Typography variant="h3" weight="bold">
          Invoice #{order?.orderNumber || id}
        </Typography>
        <TouchableOpacity
          onPress={handleShare}
          style={styles.shareButton}
          hitSlop={8}
        >
          <Share2 size={19} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 24) + 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.invoiceCard, isSmallDevice && { padding: 16 }]}>
          {/* Header Info */}
          <View style={styles.invoiceHeader}>
            <View>
              <Typography variant="h2" weight="bold" style={styles.brandTitle}>
                TRYVIA
              </Typography>
              <Typography variant="caption" color="secondary">
                Luxury Fragrances & Cosmetics
              </Typography>
            </View>
            <View style={styles.statusBadge}>
              <CheckCircle2 size={12} color="#16A34A" />
              <Typography
                variant="caption"
                weight="bold"
                style={styles.statusText}
              >
                {order?.status?.toUpperCase() || "PAID"}
              </Typography>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Invoice Meta */}
          <View style={styles.metaRow}>
            <View>
              <Typography variant="caption" color="secondary">
                Invoice Number
              </Typography>
              <Typography variant="body" weight="medium">
                INV-2026-{order?.orderNumber || id}
              </Typography>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Typography variant="caption" color="secondary">
                Date
              </Typography>
              <Typography variant="body" weight="medium">
                {order?.date || "May 15, 2026"}
              </Typography>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View>
              <Typography variant="caption" color="secondary">
                Billed To
              </Typography>
              <Typography variant="body" weight="medium">
                Luxury Client
              </Typography>
              <Typography variant="caption" color="secondary">
                member@tryvia.com
              </Typography>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Typography variant="caption" color="secondary">
                Payment Method
              </Typography>
              <Typography variant="body" weight="medium">
                {order?.paymentMethod || "UPI / Card"}
              </Typography>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Items */}
          <Typography variant="h3" style={{ marginBottom: 12 }}>
            Purchased Items
          </Typography>

          {order?.items?.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Typography variant="body" weight="medium" numberOfLines={1}>
                  {item.name}
                </Typography>
                <Typography variant="caption" color="secondary">
                  Qty: {item.quantity} •{" "}
                  {item.type === "tester" ? "Miniature" : "Full Size"}
                </Typography>
              </View>
              <Typography variant="body" weight="bold">
                ₹{item.price * item.quantity}
              </Typography>
            </View>
          )) || (
            <View style={styles.itemRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Typography variant="body" weight="medium" numberOfLines={1}>
                  Maison Margiela Jazz Club
                </Typography>
                <Typography variant="caption" color="secondary">
                  Full Size (100ml) × 1
                </Typography>
              </View>
              <Typography variant="body" weight="bold">
                ₹4,800.00
              </Typography>
            </View>
          )}

          <View style={styles.divider} />

          {/* Summary Breakdown */}
          <View style={styles.summaryRow}>
            <Typography variant="body" color="secondary">
              Subtotal
            </Typography>
            <Typography variant="body">
              ₹{order?.total || "4,800.00"}
            </Typography>
          </View>
          <View style={styles.summaryRow}>
            <Typography variant="body" color="secondary">
              Integrated GST (18%)
            </Typography>
            <Typography variant="body">Included</Typography>
          </View>
          <View style={styles.summaryRow}>
            <Typography variant="body" color="secondary">
              Shipping & Handling
            </Typography>
            <Typography variant="body" style={{ color: "#16A34A" }}>
              FREE
            </Typography>
          </View>

          <View style={[styles.divider, { marginVertical: 14 }]} />

          <View style={styles.summaryRow}>
            <Typography variant="h3" weight="bold">
              Grand Total
            </Typography>
            <Typography variant="h3" weight="bold">
              ₹{order?.total || "4,800.00"}
            </Typography>
          </View>
        </View>

        <TouchableOpacity
          style={styles.downloadButton}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <Download size={18} color="#FFF" style={{ marginRight: 8 }} />
          <Typography variant="body" weight="medium" style={{ color: "#FFF" }}>
            Download PDF Invoice
          </Typography>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  backButton: {
    padding: 8,
  },
  shareButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  invoiceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  invoiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brandTitle: {
    letterSpacing: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    color: "#16A34A",
    fontSize: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginVertical: 14,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.text.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 18,
    minHeight: 50,
  },
});
