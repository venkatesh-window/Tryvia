import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "../../src/components/ui/ScreenContainer";
import { Typography } from "../../src/components/ui/Typography";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Package,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  MapPin,
  FileText,
  ShoppingBag,
  Banknote,
  CreditCard,
  ChevronRight,
} from "lucide-react-native";
import { Image } from "expo-image";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useOrderStore } from "../../src/store/useOrderStore";
import { useCartStore } from "../../src/store/useCartStore";
import { useAuthStore } from "../../src/store/useAuthStore";
import { AddressDetailModal } from "../../src/components/orders/AddressDetailModal";
import * as Haptics from "expo-haptics";

const STATUS_STEPS = ["PENDING", "PAID", "SHIPPED", "DELIVERED"];

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { orders, fetchOrders } = useOrderStore();
  const { addItem } = useCartStore();
  const { user } = useAuthStore();
  const [selectedAddressOrder, setSelectedAddressOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleReorder = (order) => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    order.items.forEach((item) => {
      addItem(
        {
          id: Number(item.id.replace(/\D/g, "")) || 1,
          name: item.name,
          full_price: item.type === "full" ? item.price : item.price * 5,
          tester_price: item.type === "tester" ? item.price : 350,
          image_url: item.imageUrl,
          brand: { id: 0, name: item.brand },
          category: { id: 0, name: "Luxury" },
          stock_full: 10,
          stock_tester: 10,
        },
        item.type,
      );
    });
    router.push("/cart");
  };

  const getStatusDisplay = (order) => {
    const isCod =
      order.paymentMethod?.toLowerCase().includes("cash") ||
      order.paymentMethod?.toLowerCase().includes("cod");

    if (order.status === "DELIVERED") {
      return {
        label: "Delivered",
        color: "#16A34A",
        bg: "#F0FDF4",
        border: "#DCFCE7",
        note: "Delivered to your destination",
      };
    }
    if (order.status === "SHIPPED") {
      return {
        label: "In Transit",
        color: "#2563EB",
        bg: "#EFF6FF",
        border: "#DBEAFE",
        note: isCod
          ? `Pay ₹${order.total.toFixed(2)} on arrival`
          : "Courier out for delivery",
      };
    }
    if (isCod || order.status === "PENDING") {
      return {
        label: "COD • Unpaid",
        color: "#D97706",
        bg: "#FFFBEB",
        border: "#FDE68A",
        note: `Pay ₹${order.total.toFixed(2)} in cash/UPI upon delivery`,
      };
    }
    return {
      label: "Paid",
      color: "#16A34A",
      bg: "#F0FDF4",
      border: "#DCFCE7",
      note: "Prepaid order confirmed & being packaged",
    };
  };

  return (
    <ScreenContainer>
      <View
        style={[
          styles.container,
          { paddingTop: insets.top > 0 ? insets.top + 8 : 18 },
        ]}
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View>
            <Typography style={styles.title}>My Orders</Typography>
            <Typography style={styles.subtitle}>
              Track shipments, discovery testers & smart upgrades
            </Typography>
          </View>

          <View style={styles.headerIconCircle}>
            <Package size={20} color="#CB6D73" strokeWidth={1.75} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {orders.length === 0 ? (
            /* Empty State */
            <Animated.View
              entering={FadeInUp.duration(500)}
              style={styles.emptyStateCard}
            >
              <View style={styles.emptyIconCircle}>
                <ShoppingBag size={28} color="#CB6D73" strokeWidth={1.5} />
              </View>
              <Typography style={styles.emptyTitle}>
                No Orders Placed Yet
              </Typography>
              <Typography style={styles.emptySubtitle}>
                Your order journey begins here. Discover authentic luxury
                discovery testers and flagship formulations.
              </Typography>
              <TouchableOpacity
                style={styles.emptyButton}
                activeOpacity={0.85}
                onPress={() => router.push("/(tabs)")}
              >
                <Typography style={styles.emptyButtonText}>
                  Explore Formulations
                </Typography>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            orders.map((order, orderIdx) => {
              const statusInfo = getStatusDisplay(order);
              const currentStepIdx = STATUS_STEPS.indexOf(order.status);
              const isCod =
                order.paymentMethod?.toLowerCase().includes("cash") ||
                order.paymentMethod?.toLowerCase().includes("cod");

              return (
                <Animated.View
                  key={order.id}
                  entering={FadeInUp.duration(500).delay(orderIdx * 60)}
                  style={styles.orderCard}
                >
                  {/* Order Top Bar: Icon, ID, Timestamp & Status Pill */}
                  <View style={styles.orderHeader}>
                    <View style={styles.orderIdentityRow}>
                      <View
                        style={[
                          styles.orderIconBadge,
                          order.status === "DELIVERED" &&
                            styles.deliveredIconBadge,
                        ]}
                      >
                        <Package
                          size={18}
                          color={
                            order.status === "DELIVERED" ? "#16A34A" : "#1A1918"
                          }
                          strokeWidth={1.5}
                        />
                      </View>

                      <View style={styles.orderIdentityText}>
                        <Typography style={styles.orderId}>
                          #{order.orderNumber}
                        </Typography>
                        <Typography style={styles.orderTime}>
                          {order.date} • {order.paymentMethod}
                        </Typography>
                      </View>
                    </View>

                    {/* Status Badge */}
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: statusInfo.bg,
                          borderColor: statusInfo.border,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: statusInfo.color },
                        ]}
                      />
                      <Typography
                        style={[styles.statusText, { color: statusInfo.color }]}
                      >
                        {statusInfo.label}
                      </Typography>
                    </View>
                  </View>

                  {/* Payment Note Banner */}
                  <View
                    style={[
                      styles.paymentNoteBanner,
                      isCod ? styles.codBanner : styles.prepaidBanner,
                    ]}
                  >
                    {isCod ? (
                      <Banknote size={14} color="#D97706" />
                    ) : (
                      <CreditCard size={14} color="#16A34A" />
                    )}
                    <Typography
                      style={[
                        styles.paymentNoteText,
                        { color: isCod ? "#92400E" : "#166534" },
                      ]}
                    >
                      {statusInfo.note}
                    </Typography>
                  </View>

                  {/* Stepper Timeline */}
                  <View style={styles.stepperContainer}>
                    {STATUS_STEPS.map((step, idx) => {
                      const isCompleted = idx <= currentStepIdx;
                      const isCurrent = idx === currentStepIdx;

                      return (
                        <React.Fragment key={step}>
                          <View style={styles.stepPointWrapper}>
                            <View
                              style={[
                                styles.stepPoint,
                                isCompleted && styles.stepPointActive,
                                isCurrent && styles.stepPointCurrent,
                              ]}
                            >
                              {isCompleted ? (
                                <CheckCircle2 size={10} color="#FFFFFF" />
                              ) : (
                                <View style={styles.stepPointInactive} />
                              )}
                            </View>
                            <Typography
                              style={[
                                styles.stepLabel,
                                isCompleted && styles.stepLabelActive,
                              ]}
                            >
                              {step === "PENDING"
                                ? isCod
                                  ? "BOOKED"
                                  : "PLACED"
                                : step}
                            </Typography>
                          </View>

                          {idx < STATUS_STEPS.length - 1 && (
                            <View
                              style={[
                                styles.stepConnector,
                                idx < currentStepIdx &&
                                  styles.stepConnectorActive,
                              ]}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </View>

                  <View style={styles.cardDivider} />

                  {/* Items List */}
                  <View style={styles.itemsContainer}>
                    {order.items.map((item, idx) => (
                      <View key={idx} style={styles.itemRow}>
                        <View style={styles.itemImageWrapper}>
                          <Image
                            source={{
                              uri:
                                item.imageUrl ||
                                "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=200",
                            }}
                            style={styles.itemImage}
                            contentFit="cover"
                          />
                        </View>

                        <View style={styles.itemDetails}>
                          <Typography style={styles.itemBrand}>
                            {item.brand.toUpperCase()}
                          </Typography>
                          <Typography style={styles.itemName} numberOfLines={2}>
                            {item.name}
                          </Typography>
                          <Typography style={styles.itemType}>
                            {item.type === "tester"
                              ? "Discovery Tester"
                              : "Flagship Full Size"}{" "}
                            • Qty {item.quantity}
                          </Typography>
                        </View>

                        <View style={styles.itemPriceCol}>
                          <Typography style={styles.itemPrice}>
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </Typography>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Delivery Address Destination Card */}
                  <TouchableOpacity
                    style={styles.addressContainer}
                    activeOpacity={0.75}
                    onPress={() => {
                      if (Platform.OS === "ios") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setSelectedAddressOrder(order);
                    }}
                  >
                    <View style={styles.addressHeaderRow}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 5,
                          flex: 1,
                        }}
                      >
                        <MapPin size={12} color="#CB6D73" />
                        <Typography style={styles.addressTitle}>
                          DELIVERY DESTINATION
                        </Typography>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 2,
                        }}
                      >
                        <Typography style={styles.addressTapHint}>
                          View Details
                        </Typography>
                        <ChevronRight size={12} color="#8E8A85" />
                      </View>
                    </View>
                    <Typography style={styles.addressText} numberOfLines={2}>
                      {order.shippingAddress ||
                        (user?.address?.street
                          ? `${user.address.fullName ? user.address.fullName + " • " : ""}${user.address.street}, ${user.address.city} - ${user.address.pincode}`
                          : user?.fullName
                            ? `${user.fullName} • Standard Delivery Address`
                            : "Address pending confirmation")}
                    </Typography>
                  </TouchableOpacity>

                  <View style={styles.cardDivider} />

                  {/* Order Footer - Clean 2-Row Design */}
                  <View style={styles.footerContainer}>
                    {/* Row 1: Total Amount summary */}
                    <View style={styles.totalSummaryRow}>
                      <Typography style={styles.totalLabel}>
                        {isCod ? "TOTAL TO PAY (ON DELIVERY)" : "TOTAL PAID"}
                      </Typography>
                      <Typography style={styles.totalAmount}>
                        ₹{order.total.toFixed(2)}
                      </Typography>
                    </View>

                    {/* Row 2: Action Buttons */}
                    <View style={styles.actionButtonsRow}>
                      <TouchableOpacity
                        style={styles.reorderBtn}
                        onPress={() => handleReorder(order)}
                        activeOpacity={0.8}
                      >
                        <RotateCcw size={12} color="#FFFFFF" />
                        <Typography style={styles.reorderBtnText}>
                          Reorder
                        </Typography>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.invoiceBtn}
                        onPress={() => router.push(`/invoice/${order.id}`)}
                        activeOpacity={0.8}
                      >
                        <FileText size={12} color="#1A1918" />
                        <Typography style={styles.invoiceBtnText}>
                          Invoice
                        </Typography>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.reviewBtn}
                        onPress={() => router.push(`/review/${order.id}`)}
                        activeOpacity={0.8}
                      >
                        <Sparkles size={12} color="#FFFFFF" />
                        <Typography style={styles.reviewBtnText}>
                          Review
                        </Typography>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Animated.View>
              );
            })
          )}
        </ScrollView>

        <AddressDetailModal
          visible={!!selectedAddressOrder}
          orderNumber={
            selectedAddressOrder?.orderNumber
              ? `#${selectedAddressOrder.orderNumber}`
              : undefined
          }
          recipientName={user?.fullName || user?.address?.fullName}
          addressString={
            selectedAddressOrder?.shippingAddress ||
            (user?.address?.street
              ? `${user.address.street}, ${user.address.city}, ${user.address.state || "Maharashtra"} - ${user.address.pincode}`
              : "Registered Primary Delivery Address")
          }
          phone={user?.phone || user?.address?.phone}
          onClose={() => setSelectedAddressOrder(null)}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: "#FAF8F5",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 30,
    color: "#1A1918",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12.5,
    color: "#8E8A85",
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    maxWidth: "90%",
    lineHeight: 17,
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FAF0F1",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F8D8DC",
  },
  scrollContent: {
    paddingBottom: 110,
    gap: 16,
  },
  emptyStateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ECE7E1",
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FAF0F1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 22,
    color: "#1A1918",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#8E8A85",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  emptyButton: {
    backgroundColor: "#1A1918",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EFEAE3",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  orderIdentityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  orderIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FAF0F1",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F8D8DC",
  },
  deliveredIconBadge: {
    backgroundColor: "#EBF7EE",
    borderColor: "#D4EDDA",
  },
  orderIdentityText: {
    justifyContent: "center",
    flex: 1,
  },
  orderId: {
    fontFamily: "Inter_700Bold",
    fontSize: 14.5,
    color: "#1A1918",
  },
  orderTime: {
    fontSize: 11.5,
    color: "#8E8A85",
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
  paymentNoteBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    marginBottom: 12,
  },
  codBanner: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  prepaidBanner: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  paymentNoteText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  stepPointWrapper: {
    alignItems: "center",
    zIndex: 2,
  },
  stepPoint: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EFEBE5",
    alignItems: "center",
    justifyContent: "center",
  },
  stepPointActive: {
    backgroundColor: "#1A1918",
  },
  stepPointCurrent: {
    borderWidth: 2,
    borderColor: "#CB6D73",
  },
  stepPointInactive: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#C5C0B8",
  },
  stepLabel: {
    fontSize: 8.5,
    color: "#8E8A85",
    marginTop: 3,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.3,
  },
  stepLabelActive: {
    color: "#1A1918",
    fontFamily: "Inter_600SemiBold",
  },
  stepConnector: {
    flex: 1,
    height: 1.5,
    backgroundColor: "#ECE7E1",
    marginHorizontal: 3,
    marginBottom: 12,
  },
  stepConnectorActive: {
    backgroundColor: "#1A1918",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F3EFEA",
    marginVertical: 12,
  },
  itemsContainer: {
    gap: 10,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemImageWrapper: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#F5F2EC",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ECE7E1",
  },
  itemImage: {
    width: "100%",
    height: "100%",
  },
  itemDetails: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  itemBrand: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: "#8E8A85",
    letterSpacing: 0.8,
  },
  itemName: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 14.5,
    color: "#1A1918",
    lineHeight: 18,
    marginTop: 1,
  },
  itemType: {
    fontSize: 11,
    color: "#8E8A85",
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  itemPriceCol: {
    alignItems: "flex-end",
  },
  itemPrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#1A1918",
  },
  addressContainer: {
    backgroundColor: "#FAF8F5",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#EFEAE3",
  },
  addressHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
    gap: 4,
  },
  addressTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 9.5,
    letterSpacing: 0.8,
    color: "#CB6D73",
  },
  addressTapHint: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: "#8E8A85",
  },
  addressText: {
    fontSize: 11.5,
    lineHeight: 16,
    color: "#1A1918",
    fontFamily: "Inter_400Regular",
  },
  footerContainer: {
    gap: 10,
  },
  totalSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: {
    fontSize: 9.5,
    color: "#8E8A85",
    letterSpacing: 0.8,
    fontFamily: "Inter_700Bold",
  },
  totalAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#1A1918",
  },
  actionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reorderBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    backgroundColor: "#1A1918",
    borderRadius: 10,
  },
  reorderBtnText: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 11.5,
  },
  invoiceBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    backgroundColor: "#F5F2EC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ECE7E1",
  },
  invoiceBtnText: {
    color: "#1A1918",
    fontFamily: "Inter_500Medium",
    fontSize: 11.5,
  },
  reviewBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    backgroundColor: "#CB6D73",
    borderRadius: 10,
  },
  reviewBtnText: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 11.5,
  },
});
