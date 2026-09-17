import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "../src/components/ui/ScreenContainer";
import { Typography } from "../src/components/ui/Typography";
import { PremiumButton } from "../src/components/ui/PremiumButton";
import { useCartStore } from "../src/store/useCartStore";
import { useAuthStore } from "../src/store/useAuthStore";
import { ChevronLeft } from "lucide-react-native";
import { theme } from "../src/theme/theme";
import { useForm, Controller } from "react-hook-form";
import { walletService } from "../src/api/services/walletService";

import { RazorpayCheckoutModal } from "../src/components/payment/RazorpayCheckoutModal";
import { OrderSuccessModal } from "../src/components/payment/OrderSuccessModal";
import { useResponsive } from "../src/hooks/useResponsive";

export default function CheckoutScreen() {
  const router = useRouter();
  const { safeTopPadding, insets, isSmallDevice } = useResponsive();
  const { user, isAuthenticated, updateProfile } = useAuthStore();
  const { items, useWallet, toggleUseWallet, subtotal, total, walletDeduction } = useCartStore();

  const [checkoutCalculation, setCheckoutCalculation] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/auth");
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    if (items.length > 0) {
      setIsCalculating(true);
      walletService.calculateCheckout(
        items.map(i => ({ product_id: i.product.id, quantity: i.quantity, item_type: i.type })),
        useWallet
      )
        .then(res => setCheckoutCalculation(res))
        .catch(err => console.error("Calc err", err))
        .finally(() => setIsCalculating(false));
    }
  }, [items, useWallet]);

  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [checkoutAddress, setCheckoutAddress] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address?.street || "",
      city: user?.address?.city || "",
      pincode: user?.address?.pincode || "",
    },
  });

  const onSubmit = (data) => {
    const formatted = `${data.address.trim()}, ${data.city.trim()} - ${data.pincode.trim()}`;
    setCheckoutAddress(formatted);

    // Save profile and address
    updateProfile({
      fullName: data.fullName.trim(),
      phone: data.phone.trim(),
      address: {
        fullName: data.fullName.trim(),
        street: data.address.trim(),
        city: data.city.trim(),
        state: user?.address?.state || "Maharashtra",
        pincode: data.pincode.trim(),
        phone: data.phone.trim(),
      },
    });

    setIsPaymentModalVisible(true);
  };

  const handlePaymentSuccess = (order) => {
    setIsPaymentModalVisible(false);
    setCompletedOrder(order);
  };

  const handleViewOrders = () => {
    setCompletedOrder(null);
    router.replace("/(tabs)/orders");
  };

  const handleContinueShopping = () => {
    setCompletedOrder(null);
    router.replace("/(tabs)");
  };

  return (
    <ScreenContainer showOrbs={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.header, { paddingTop: safeTopPadding }]}>
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
            style={styles.backBtn}
            hitSlop={8}
          >
            <ChevronLeft
              size={22}
              color={theme.colors.text.primary}
              strokeWidth={1.5}
            />
          </TouchableOpacity>
          <Typography variant="h2" weight="medium" style={styles.headerTitle}>
            CHECKOUT
          </Typography>
          <View style={{ width: 42 }} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 40 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Typography variant="h3" weight="medium" style={styles.sectionTitle}>
            Contact Information
          </Typography>

          <Controller
            control={control}
            rules={{ required: "Full Name is required" }}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholderTextColor="#888"
                />
                {errors.fullName && (
                  <Typography variant="caption" style={styles.errorText}>
                    {errors.fullName.message}
                  </Typography>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            rules={{
              required: "Email is required",
              pattern: { value: /^\S+@\S+$/i, message: "Invalid email" },
            }}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#888"
                />
                {errors.email && (
                  <Typography variant="caption" style={styles.errorText}>
                    {errors.email.message}
                  </Typography>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            rules={{ required: "Phone is required" }}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="phone-pad"
                  placeholderTextColor="#888"
                />
                {errors.phone && (
                  <Typography variant="caption" style={styles.errorText}>
                    {errors.phone.message}
                  </Typography>
                )}
              </View>
            )}
          />

          <Typography
            variant="h3"
            weight="medium"
            style={[styles.sectionTitle, { marginTop: 20 }]}
          >
            Shipping Address
          </Typography>

          <Controller
            control={control}
            rules={{ required: "Address is required" }}
            name="address"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Street Address"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholderTextColor="#888"
                />
                {errors.address && (
                  <Typography variant="caption" style={styles.errorText}>
                    {errors.address.message}
                  </Typography>
                )}
              </View>
            )}
          />

          <View style={styles.row}>
            <Controller
              control={control}
              rules={{ required: "City is required" }}
              name="city"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  style={[styles.inputContainer, { flex: 1, marginRight: 6 }]}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="City"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholderTextColor="#888"
                  />
                  {errors.city && (
                    <Typography variant="caption" style={styles.errorText}>
                      {errors.city.message}
                    </Typography>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              rules={{ required: "Pincode is required" }}
              name="pincode"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  style={[styles.inputContainer, { flex: 1, marginLeft: 6 }]}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="Pincode"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="numeric"
                    placeholderTextColor="#888"
                  />
                  {errors.pincode && (
                    <Typography variant="caption" style={styles.errorText}>
                      {errors.pincode.message}
                    </Typography>
                  )}
                </View>
              )}
            />
          </View>

          <View style={[styles.summaryBox, isSmallDevice && { padding: 16 }]}>
            <Typography
              variant="h3"
              weight="medium"
              style={{ marginBottom: 14 }}
            >
              Payment Summary
            </Typography>

            {isCalculating ? (
              <View style={{ paddingVertical: 20, alignItems: "center" }}>
                <ActivityIndicator size="small" color="#B8860B" />
                <Typography variant="caption" color="secondary" style={{ marginTop: 8 }}>
                  Calculating best price...
                </Typography>
              </View>
            ) : checkoutCalculation ? (
              <View>
                <View style={styles.summaryRow}>
                  <Typography variant="body" color="secondary">
                    Product Price
                  </Typography>
                  <Typography variant="price" weight="medium">
                    ₹{checkoutCalculation.subtotal.toFixed(2)}
                  </Typography>
                </View>

                {checkoutCalculation.availableCredits > 0 && (
                  <>
                    <View style={styles.divider} />
                    <View style={[styles.summaryRow, { alignItems: 'center', marginBottom: 16 }]}>
                      <View>
                        <Typography variant="body" weight="medium">
                          Use TRYVIA Wallet
                        </Typography>
                        <Typography variant="caption" color="secondary" style={{ fontSize: 11 }}>
                          Available: ₹{checkoutCalculation.availableCredits.toFixed(2)}
                        </Typography>
                      </View>
                      <Switch
                        value={useWallet}
                        onValueChange={toggleUseWallet}
                        trackColor={{ false: "#E2E8F0", true: "#B8860B" }}
                        thumbColor={"#FFFFFF"}
                      />
                    </View>
                  </>
                )}

                {useWallet && checkoutCalculation.walletUsed > 0 && (
                  <View>
                    <View style={styles.summaryRow}>
                      <Typography variant="body" color="secondary">
                        Maximum Credits Usable (60%)
                      </Typography>
                      <Typography variant="price" weight="medium">
                        ₹{checkoutCalculation.maximumWalletUsage.toFixed(2)}
                      </Typography>
                    </View>

                    <View style={styles.summaryRow}>
                      <Typography variant="body" color="secondary">
                        Credits Used
                      </Typography>
                      <Typography variant="price" weight="medium" style={{ color: "#16A34A" }}>
                        -₹{checkoutCalculation.walletUsed.toFixed(2)}
                      </Typography>
                    </View>
                    
                    <View style={styles.summaryRow}>
                      <Typography variant="body" color="secondary">
                        Remaining Credits
                      </Typography>
                      <Typography variant="price" weight="medium" style={{ fontSize: 12 }}>
                        ₹{checkoutCalculation.remainingWallet.toFixed(2)}
                      </Typography>
                    </View>
                  </View>
                )}

                <View style={styles.summaryRow}>
                  <Typography variant="body" color="secondary">
                    Platform Fee
                  </Typography>
                  <Typography variant="price" weight="medium">
                    ₹{checkoutCalculation.platformFee.toFixed(2)}
                  </Typography>
                </View>

                <View style={styles.summaryRow}>
                  <Typography variant="body" color="secondary">
                    Delivery Charge
                  </Typography>
                  <Typography variant="price" weight="medium">
                    ₹{checkoutCalculation.deliveryCharge.toFixed(2)}
                  </Typography>
                </View>

                <View style={styles.divider} />

                <View style={styles.summaryRow}>
                  <Typography variant="h2" weight="medium" style={{ fontSize: 18 }}>
                    Total to Pay
                  </Typography>
                  <Typography
                    variant="price"
                    weight="bold"
                    style={{ fontSize: 22 }}
                  >
                    ₹{checkoutCalculation.customerPayment.toFixed(2)}
                  </Typography>
                </View>
              </View>
            ) : (
              <Typography variant="body" color="secondary">
                Unable to load calculation
              </Typography>
            )}
          </View>

          <PremiumButton
            title="Proceed to Payment"
            onPress={handleSubmit(onSubmit)}
            style={{ marginTop: 20 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <RazorpayCheckoutModal
        visible={isPaymentModalVisible}
        deliveryAddress={checkoutAddress}
        onClose={() => setIsPaymentModalVisible(false)}
        onSuccess={handlePaymentSuccess}
      />

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
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    letterSpacing: 2,
    fontSize: 20,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#FAFAF8",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    minHeight: 46,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: theme.colors.text.primary,
  },
  errorText: {
    color: "#EF4444",
    marginTop: 2,
    marginLeft: 4,
    fontSize: 11,
  },
  row: {
    flexDirection: "row",
  },
  summaryBox: {
    backgroundColor: "#FAFAF8",
    borderRadius: 18,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginVertical: 12,
  },
});
