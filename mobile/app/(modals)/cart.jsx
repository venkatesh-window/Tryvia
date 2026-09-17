import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "../../src/components/ui/ScreenContainer";
import { Typography } from "../../src/components/ui/Typography";
import { PremiumButton } from "../../src/components/ui/PremiumButton";
import { useCartStore } from "../../src/store/useCartStore";
import { useTheme } from "../../src/hooks/useTheme";
import { Image } from "expo-image";
import { GlassCard } from "../../src/components/ui/GlassCard";
import { RazorpayCheckoutModal } from "../../src/components/payment/RazorpayCheckoutModal";
import { OrderSuccessModal } from "../../src/components/payment/OrderSuccessModal";

export default function CartModal() {
  const router = useRouter();
  const theme = useTheme();
  const {
    items,
    total,
    productSubtotal,
    testerSubtotal,
    walletDeduction,
    platformFee,
    deliveryCharge,
    testerGst,
    productDeliveryFee,
    testerDeliveryFee,
    productSectionTotal,
    testerSectionTotal,
    isTesterMinimumMet,
    removeItem,
  } = useCartStore();

  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  const fullProducts = items.filter(i => i.type === "full");
  const testerProducts = items.filter(i => i.type === "tester");

  const isMinimumMet = total > 0 && isTesterMinimumMet;
  const minOrderValue = 200;

  const handleCheckout = () => {
    setIsPaymentModalVisible(true);
  };

  const handlePaymentSuccess = (order) => {
    setIsPaymentModalVisible(false);
    setCompletedOrder(order);
  };

  const handleViewOrders = () => {
    setCompletedOrder(null);
    router.replace("/(tabs)/profile");
  };

  const handleContinueShopping = () => {
    setCompletedOrder(null);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  const renderItem = (item) => (
    <GlassCard key={item.id} style={styles.cartItem}>
      <Image
        source={{
          uri: item.product.image_url || "https://via.placeholder.com/150",
        }}
        style={styles.itemImage}
      />
      <View style={styles.itemInfo}>
        <Typography variant="caption" color="secondary">
          {item.product.brand?.name?.toUpperCase() || "UNKNOWN BRAND"}
        </Typography>
        <Typography variant="body" weight="medium">
          {item.product.name}
        </Typography>
        <Typography
          variant="caption"
          color="secondary"
          style={{ marginTop: 2 }}
        >
          {item.type === "tester" ? "Mini/Tester" : "Full Size"} x{item.quantity}
        </Typography>
        <Typography
          variant="price"
          weight="bold"
          style={styles.itemPrice}
        >
          ₹{item.price}
        </Typography>
      </View>
      <Pressable
        onPress={() => removeItem(item.id)}
        style={styles.removeBtn}
      >
        <Typography variant="caption" color="secondary">
          Remove
        </Typography>
      </Pressable>
    </GlassCard>
  );

  return (
    <ScreenContainer showOrbs={false}>
      <View style={styles.header}>
        <Typography variant="h2">Your Bag</Typography>
        <Pressable onPress={() => { router.canGoBack() ? router.back() : router.replace("/(tabs)"); }} style={styles.closeBtn}>
          <Typography variant="h3" color="secondary">
            ✕
          </Typography>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Typography variant="body" color="secondary" align="center">
              Your bag is empty.
            </Typography>
          </View>
        ) : (
          <>
            {/* FULL PRODUCTS SECTION */}
            {fullProducts.length > 0 && (
              <View style={styles.sectionContainer}>
                <Typography variant="h3" weight="bold" style={styles.sectionTitle}>
                  Full Size Products
                </Typography>
                {fullProducts.map(renderItem)}
                
                <View style={styles.sectionBill}>
                  <View style={styles.totalRow}>
                    <Typography variant="body" color="secondary">Product Subtotal</Typography>
                    <Typography variant="price" weight="medium">₹{productSubtotal}</Typography>
                  </View>
                  {walletDeduction > 0 && (
                    <View style={styles.totalRow}>
                      <Typography variant="body" color="primary">Wallet Credit Used</Typography>
                      <Typography variant="price" color="primary">-₹{Number(walletDeduction).toFixed(2)}</Typography>
                    </View>
                  )}
                  <View style={styles.totalRow}>
                    <Typography variant="body" color="secondary">Platform Fee</Typography>
                    <Typography variant="price" weight="medium">₹{platformFee.toFixed(2)}</Typography>
                  </View>
                  <View style={styles.totalRow}>
                    <Typography variant="body" color="secondary">Delivery Charge</Typography>
                    <Typography variant="price" weight="medium">₹{productDeliveryFee.toFixed(2)}</Typography>
                  </View>
                  <View style={[styles.totalRow, { marginTop: 8, borderTopWidth: 1, borderColor: "rgba(0,0,0,0.05)", paddingTop: 8 }]}>
                    <Typography variant="body" weight="bold">Product Total</Typography>
                    <Typography variant="price" weight="bold">₹{productSectionTotal.toFixed(2)}</Typography>
                  </View>
                </View>
              </View>
            )}

            {/* TESTERS SECTION */}
            {testerProducts.length > 0 && (
              <View style={[styles.sectionContainer, fullProducts.length > 0 && { marginTop: 32 }]}>
                <Typography variant="h3" weight="bold" style={styles.sectionTitle}>
                  Mini / Testers
                </Typography>
                {testerProducts.map(renderItem)}

                <View style={styles.sectionBill}>
                  <View style={styles.totalRow}>
                    <Typography variant="body" color="secondary">Tester Subtotal</Typography>
                    <Typography variant="price" weight="medium">₹{testerSubtotal}</Typography>
                  </View>
                  <View style={styles.totalRow}>
                    <Typography variant="body" color="secondary">GST (18%)</Typography>
                    <Typography variant="price" weight="medium">₹{testerGst.toFixed(2)}</Typography>
                  </View>
                  <View style={styles.totalRow}>
                    <Typography variant="body" color="secondary">Delivery Charge</Typography>
                    <Typography variant="price" weight="medium">₹{testerDeliveryFee.toFixed(2)}</Typography>
                  </View>
                  <View style={[styles.totalRow, { marginTop: 8, borderTopWidth: 1, borderColor: "rgba(0,0,0,0.05)", paddingTop: 8 }]}>
                    <Typography variant="body" weight="bold">Tester Total</Typography>
                    <Typography variant="price" weight="bold">₹{testerSectionTotal.toFixed(2)}</Typography>
                  </View>
                  
                  <View style={styles.cashbackBadge}>
                    <Typography variant="caption" weight="bold" style={{ color: "#B8860B", textAlign: "center" }}>
                      ✨ You will receive ₹{testerSubtotal.toFixed(2)} as cashback in your wallet after purchase!
                    </Typography>
                  </View>

                  {!isTesterMinimumMet && (
                    <Typography variant="caption" style={{ color: "#EF4444", textAlign: "center", marginTop: 8 }}>
                      Minimum tester purchase of ₹200 required to checkout.
                    </Typography>
                  )}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { backgroundColor: theme.colors.background.default },
        ]}
      >
        <View
          style={[
            styles.totalRow,
            {
              paddingTop: 8,
            },
          ]}
        >
          <Typography variant="h2">Grand Total</Typography>
          <Typography variant="price" weight="bold" style={{ fontSize: 28 }}>
            ₹{total.toFixed(2)}
          </Typography>
        </View>

        <PremiumButton
          title="Proceed to Checkout"
          onPress={handleCheckout}
          disabled={!isMinimumMet || items.length === 0}
          variant={isMinimumMet && items.length > 0 ? "primary" : "secondary"}
          style={{ marginTop: 16 }}
        />
      </View>

      {/* Razorpay Checkout Modal */}
      <RazorpayCheckoutModal
        visible={isPaymentModalVisible}
        onClose={() => setIsPaymentModalVisible(false)}
        onSuccess={handlePaymentSuccess}
      />

      {/* Order Placed Success Modal */}
      <OrderSuccessModal
        visible={!!completedOrder}
        order={completedOrder}
        onViewOrders={handleViewOrders}
        onContinueShopping={handleContinueShopping}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    paddingTop: Platform.OS === "ios" ? 12 : 24,
  },
  closeBtn: {
    padding: 8,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  emptyState: {
    marginTop: 48,
    alignItems: "center",
  },
  cartItem: {
    flexDirection: "row",
    padding: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemPrice: {
    marginTop: 4,
  },
  removeBtn: {
    padding: 8,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  sectionBill: {
    backgroundColor: "rgba(0,0,0,0.02)",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  cashbackBadge: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
  },
});
