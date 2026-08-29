import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { BlurView } from "expo-blur";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import {
  CreditCard,
  Building2,
  CheckCircle2,
  X,
  ShieldCheck,
  Smartphone,
  Lock,
  Zap,
  Wallet,
  MapPin,
} from "lucide-react-native";
import { Typography } from "../ui/Typography";
import { PremiumButton } from "../ui/PremiumButton";
import { useCartStore } from "../../store/useCartStore";
import { useOrderStore } from "../../store/useOrderStore";
import { useAuthStore } from "../../store/useAuthStore";
import { theme } from "../../theme/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { paymentService } from "../../api/services/paymentService";

// Dynamically load Razorpay standard checkout script on Web
const loadRazorpayWebScript = () => {
  return new Promise((resolve) => {
    if (Platform.OS !== "web") {
      resolve(false);
      return;
    }
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    if (typeof document !== "undefined") {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    } else {
      resolve(false);
    }
  });
};

export const RazorpayCheckoutModal = ({
  visible,
  deliveryAddress,
  onClose,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const {
    items,
    total,
    subtotal,
    walletDeduction,
    clearCart,
    appliedWalletCredit,
  } = useCartStore();
  const { user, deductWalletBalance } = useAuthStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [razorpayKeyId, setRazorpayKeyId] = useState(
    process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TEzhol7UoZqx9M",
  );

  useEffect(() => {
    if (visible) {
      loadRazorpayWebScript();

      paymentService
        .getPaymentConfig()
        .then((cfg) => {
          if (cfg?.key_id) setRazorpayKeyId(cfg.key_id);
        })
        .catch(() => {
          // Keep default key
        });
    }
  }, [visible]);

  // Convert backend order response to Order format for UI
  const formatFinalOrder = (backendOrder, fallbackMethod) => {
    const formattedDate = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).format(
      new Date(backendOrder.created_at || backendOrder.createdAt || Date.now()),
    );

    return {
      id: backendOrder.id
        ? backendOrder.id.toString()
        : String(Date.now()).slice(-6),
      orderNumber: `TRV-${10000 + (Number(backendOrder.numericId || backendOrder.id) || 1)}`,
      date: formattedDate,
      subtotal: backendOrder.subtotal ?? subtotal,
      walletDeduction:
        backendOrder.walletDiscount ??
        backendOrder.wallet_discount ??
        walletDeduction,
      platformFee: backendOrder.platformFee ?? backendOrder.platform_fee ?? 0,
      total: backendOrder.totalAmount ?? backendOrder.total_amount ?? total,
      status: backendOrder.status || "PAID",
      paymentMethod:
        backendOrder.paymentMethod ||
        backendOrder.payment_method ||
        fallbackMethod,
      shippingAddress:
        backendOrder.shippingAddress ||
        backendOrder.shipping_address ||
        deliveryAddress,
      items: items.map((i) => ({
        id: String(i.id),
        name: i.product.name,
        brand: i.product.brand?.name || "TRYVIA",
        imageUrl:
          i.product.image_url ||
          "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80",
        type: i.type,
        quantity: i.quantity,
        price: i.price,
      })),
    };
  };

  // Launch Standard Razorpay Unified Checkout
  const handleOpenStandardRazorpay = async () => {
    setIsProcessing(true);
    setProcessingStep("Initiating secure Razorpay session...");

    try {
      const orderInputs = items.map((i) => ({
        product_id: i.product.id,
        item_type: i.type,
        quantity: i.quantity,
        unit_price: i.price,
      }));

      // 1. Create Razorpay Order on backend
      const rzpOrder = await paymentService.createPaymentOrder({
        items: orderInputs,
        apply_wallet_credit_id: appliedWalletCredit?.id || null,
        use_wallet: walletDeduction > 0,
        shipping_address: deliveryAddress || null,
      });

      // Case A: 100% covered by wallet credit (Zero-value checkout)
      if (rzpOrder.is_zero_amount && rzpOrder.order) {
        if (walletDeduction > 0) {
          deductWalletBalance(walletDeduction);
        }
        const formatted = formatFinalOrder(rzpOrder.order, "Wallet Credit");
        useOrderStore.setState((state) => ({
          orders: [formatted, ...state.orders],
        }));
        clearCart();
        setIsProcessing(false);
        onSuccess(formatted);
        return;
      }

      // Case B: Standard Web Browser Checkout (Web SDK popup)
      if (
        Platform.OS === "web" &&
        typeof window !== "undefined" &&
        window.Razorpay
      ) {
        const options = {
          key: rzpOrder.key_id || razorpayKeyId,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency || "INR",
          name: "TRYVIA",
          description: "Haute Parfumerie & Luxury Formulations",
          image:
            "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=200",
          order_id: rzpOrder.razorpay_order_id,
          prefill: {
            name: user?.fullName || rzpOrder.customer?.name || "TryVia Member",
            email: user?.email || rzpOrder.customer?.email || "",
            contact: user?.phone || rzpOrder.customer?.contact || "",
          },
          theme: {
            color: "#1A1918",
          },
          handler: async (response) => {
            setProcessingStep(
              "Verifying cryptographic signature with Razorpay...",
            );
            try {
              const verifyRes = await paymentService.verifyPayment({
                razorpay_order_id:
                  response.razorpay_order_id ||
                  rzpOrder.razorpay_order_id ||
                  "",
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_id: rzpOrder.order_id,
                payment_instrument: "Razorpay Checkout",
              });

              if (walletDeduction > 0) {
                deductWalletBalance(walletDeduction);
              }

              const formatted = formatFinalOrder(
                verifyRes.order,
                "Razorpay Checkout",
              );
              useOrderStore.setState((state) => ({
                orders: [formatted, ...state.orders],
              }));
              clearCart();
              setIsProcessing(false);
              onSuccess(formatted);
            } catch (err) {
              console.error(
                "Payment signature verification failed:",
                err?.response?.data || err?.message,
              );
              setIsProcessing(false);
              const errMsg =
                err?.response?.data?.detail ||
                err?.message ||
                "Payment signature could not be verified.";
              Alert.alert("Verification Failed", errMsg);
            }
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      }

      // Case C: Native Mobile Checkout (iOS / Android)
      setProcessingStep("Opening secure Razorpay payment window...");
      const sessionUrl = paymentService.getCheckoutSessionUrl(
        rzpOrder.order_id,
      );

      const result = await WebBrowser.openAuthSessionAsync(
        sessionUrl,
        "tryvia://payment-callback",
      );

      if (result.type === "success" && result.url) {
        const parsed = Linking.parse(result.url);
        const {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          status,
          error: sessionErr,
        } = parsed.queryParams || {};

        if (status === "cancelled") {
          setIsProcessing(false);
          return;
        }

        if (status === "failed" || sessionErr) {
          setIsProcessing(false);
          Alert.alert(
            "Payment Failed",
            sessionErr || "Payment transaction was declined.",
          );
          return;
        }

        if (razorpay_payment_id && razorpay_signature) {
          setProcessingStep(
            "Verifying cryptographic signature with Razorpay...",
          );
          try {
            const verifyRes = await paymentService.verifyPayment({
              razorpay_order_id:
                razorpay_order_id || rzpOrder.razorpay_order_id || "",
              razorpay_payment_id: razorpay_payment_id,
              razorpay_signature: razorpay_signature,
              order_id: rzpOrder.order_id,
              payment_instrument: "Razorpay Mobile",
            });

            if (walletDeduction > 0) {
              deductWalletBalance(walletDeduction);
            }

            const formatted = formatFinalOrder(
              verifyRes.order,
              "Razorpay Mobile",
            );
            useOrderStore.setState((state) => ({
              orders: [formatted, ...state.orders],
            }));
            clearCart();
            setIsProcessing(false);
            onSuccess(formatted);
          } catch (err) {
            console.error(
              "Mobile payment verification failed:",
              err?.response?.data || err?.message,
            );
            setIsProcessing(false);
            const errMsg =
              err?.response?.data?.detail ||
              err?.message ||
              "Payment signature could not be verified.";
            Alert.alert("Verification Failed", errMsg);
          }
          return;
        }
      }

      // User closed browser without completing payment
      setIsProcessing(false);
    } catch (error) {
      console.error("Razorpay payment error:", {
        status: error?.response?.status,
        data: error?.response?.data,
        url: error?.config?.url,
        payload: error?.config?.data,
        message: error?.message,
      });
      setIsProcessing(false);
      const errMsg =
        error?.response?.data?.detail ||
        error?.message ||
        "Unable to complete Razorpay payment.";
      Alert.alert("Payment Error", errMsg);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        >
          <BlurView
            intensity={35}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        </TouchableOpacity>

        <View
          style={[
            styles.modalContent,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <View style={styles.secureBadgeRow}>
                <ShieldCheck size={14} color="#B8860B" />
                <Typography
                  variant="caption"
                  weight="bold"
                  style={styles.secureBadge}
                >
                  RAZORPAY 256-BIT SECURE CHECKOUT
                </Typography>
              </View>
              <Typography variant="h2" weight="medium" style={styles.title}>
                Complete Your Payment
              </Typography>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              hitSlop={8}
            >
              <X size={18} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Amount Summary Bar */}
          <View style={styles.amountBar}>
            <View>
              <Typography
                variant="caption"
                color="secondary"
                style={{ fontSize: 11, letterSpacing: 1 }}
              >
                TOTAL PAYABLE
              </Typography>
              <Typography
                variant="price"
                weight="bold"
                style={styles.amountText}
              >
                ₹{total.toFixed(2)}
              </Typography>
            </View>

            {walletDeduction > 0 && (
              <View style={styles.walletSavedBadge}>
                <Typography
                  variant="caption"
                  weight="bold"
                  style={{ color: "#B8860B", fontSize: 11 }}
                >
                  Saved ₹{walletDeduction.toFixed(2)} from Wallet
                </Typography>
              </View>
            )}
          </View>

          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator
                size="large"
                color="#121212"
                style={{ marginBottom: 20 }}
              />
              <Typography
                variant="body"
                weight="medium"
                style={{
                  color: theme.colors.text.primary,
                  marginBottom: 8,
                  fontSize: 16,
                }}
              >
                Connecting to Razorpay
              </Typography>
              <Typography
                variant="caption"
                color="secondary"
                style={{
                  textAlign: "center",
                  paddingHorizontal: 40,
                  lineHeight: 18,
                }}
              >
                {processingStep}
              </Typography>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollBody}
              keyboardShouldPersistTaps="handled"
            >
              {/* Delivery Address Pill */}
              {deliveryAddress && (
                <View style={styles.addressPill}>
                  <MapPin size={15} color="#8E8A85" />
                  <Typography
                    variant="caption"
                    color="secondary"
                    numberOfLines={1}
                    style={styles.addressText}
                  >
                    Deliver to: {deliveryAddress}
                  </Typography>
                </View>
              )}

              {/* Razorpay Gateway Card */}
              <View style={styles.razorpayCard}>
                <View style={styles.gatewayHeader}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <View style={styles.rzpIconContainer}>
                      <Zap size={18} color="#FFFFFF" />
                    </View>
                    <View>
                      <Typography
                        variant="body"
                        weight="bold"
                        style={{ color: "#0C2340", fontSize: 15 }}
                      >
                        Razorpay Gateway
                      </Typography>
                      <Typography
                        variant="caption"
                        color="secondary"
                        style={{ fontSize: 11.5 }}
                      >
                        All-in-one instant secure payment
                      </Typography>
                    </View>
                  </View>
                  <View style={styles.livePill}>
                    <Typography style={styles.livePillText}>INSTANT</Typography>
                  </View>
                </View>

                {/* Supported Payment Instruments Icons Grid */}
                <Typography
                  variant="caption"
                  color="secondary"
                  style={styles.instrumentsLabel}
                >
                  SUPPORTED PAYMENT METHODS:
                </Typography>
                <View style={styles.instrumentsGrid}>
                  <View style={styles.instrumentBadge}>
                    <Smartphone size={13} color="#1A1918" />
                    <Typography style={styles.instrumentText}>
                      UPI (GPay / PhonePe / Paytm / BHIM)
                    </Typography>
                  </View>
                  <View style={styles.instrumentBadge}>
                    <CreditCard size={13} color="#1A1918" />
                    <Typography style={styles.instrumentText}>
                      Cards (Credit / Debit / EMI)
                    </Typography>
                  </View>
                  <View style={styles.instrumentBadge}>
                    <Building2 size={13} color="#1A1918" />
                    <Typography style={styles.instrumentText}>
                      NetBanking (50+ Indian Banks)
                    </Typography>
                  </View>
                  <View style={styles.instrumentBadge}>
                    <Wallet size={13} color="#1A1918" />
                    <Typography style={styles.instrumentText}>
                      Wallets & PayLater
                    </Typography>
                  </View>
                </View>

                {/* Trust & Security Features */}
                <View style={styles.featureGrid}>
                  <View style={styles.featureItem}>
                    <Lock size={13} color="#16A34A" />
                    <Typography style={styles.featureText}>
                      256-bit SSL Encryption
                    </Typography>
                  </View>
                  <View style={styles.featureItem}>
                    <CheckCircle2 size={13} color="#16A34A" />
                    <Typography style={styles.featureText}>
                      PCI-DSS Level 1 Certified
                    </Typography>
                  </View>
                  <View style={styles.featureItem}>
                    <ShieldCheck size={13} color="#16A34A" />
                    <Typography style={styles.featureText}>
                      Instant Refund Protection
                    </Typography>
                  </View>
                </View>
              </View>

              {/* Single Unified Payment Button */}
              <View style={styles.buttonContainer}>
                <PremiumButton
                  title={`Pay ₹${total.toFixed(2)} with Razorpay`}
                  onPress={handleOpenStandardRazorpay}
                  disabled={isProcessing}
                />
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.06)",
  },
  secureBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  secureBadge: {
    color: "#B8860B",
    fontSize: 9.5,
    letterSpacing: 1.2,
  },
  title: {
    color: theme.colors.text.primary,
    marginTop: 2,
    fontSize: 20,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  amountBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  amountText: {
    color: theme.colors.text.primary,
    fontSize: 28,
    marginTop: 2,
  },
  walletSavedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(212, 175, 55, 0.12)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.25)",
  },
  scrollBody: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 16,
  },
  addressPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F5F0",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#ECE7E1",
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    color: "#555555",
  },
  razorpayCard: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  gatewayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  rzpIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#0C2340",
    alignItems: "center",
    justifyContent: "center",
  },
  livePill: {
    backgroundColor: "#0C2340",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  livePillText: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "700",
    letterSpacing: 1,
  },
  instrumentsLabel: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
    color: "#64748B",
  },
  instrumentsGrid: {
    gap: 6,
    marginBottom: 16,
  },
  instrumentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  instrumentText: {
    fontSize: 12,
    color: "#1E293B",
    fontFamily: "Inter_500Medium",
  },
  featureGrid: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    fontSize: 11.5,
    color: "#475569",
    fontFamily: "Inter_500Medium",
  },
  buttonContainer: {
    marginTop: 4,
    marginBottom: 8,
  },
  processingContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
});
