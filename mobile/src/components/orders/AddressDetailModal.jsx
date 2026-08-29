import React from "react";
import { View, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { BlurView } from "expo-blur";
import { Typography } from "../ui/Typography";
import { MapPin, X, Truck, User, Phone } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const AddressDetailModal = ({
  visible,
  orderNumber,
  recipientName,
  addressString,
  phone,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
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
          style={[styles.card, { paddingBottom: Math.max(insets.bottom, 20) }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.pinCircle}>
                <MapPin size={18} color="#CB6D73" />
              </View>
              <View>
                <Typography style={styles.badge}>
                  VERIFIED DESTINATION
                </Typography>
                <Typography style={styles.title}>
                  Delivery Address Details
                </Typography>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              hitSlop={8}
            >
              <X size={18} color="#1A1918" />
            </TouchableOpacity>
          </View>

          {orderNumber && (
            <View style={styles.orderRefRow}>
              <Typography style={styles.orderRefLabel}>
                ORDER REFERENCE
              </Typography>
              <Typography style={styles.orderRefValue}>
                {orderNumber}
              </Typography>
            </View>
          )}

          {/* Full Address Container */}
          <View style={styles.addressBox}>
            <View style={styles.detailRow}>
              <User size={15} color="#8E8A85" />
              <Typography style={styles.recipientNameText}>
                {recipientName || "Verified TryVia Member"}
              </Typography>
            </View>

            {phone && (
              <View style={[styles.detailRow, { marginTop: 6 }]}>
                <Phone size={14} color="#8E8A85" />
                <Typography style={styles.phoneText}>{phone}</Typography>
              </View>
            )}

            <View style={styles.divider} />

            <Typography style={styles.fullAddressText}>
              {addressString || "Standard Verified Delivery Address"}
            </Typography>
          </View>

          {/* Logistics Trust Note */}
          <View style={styles.logisticsCard}>
            <Truck size={16} color="#CB6D73" />
            <Typography style={styles.logisticsText}>
              Dispatched with tamper-proof luxury packaging and live
              door-to-door courier tracking.
            </Typography>
          </View>

          {/* Close Action Button */}
          <TouchableOpacity
            style={styles.doneBtn}
            activeOpacity={0.85}
            onPress={onClose}
          >
            <Typography style={styles.doneBtnText}>Close Address</Typography>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  pinCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FAF0F1",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F8D8DC",
  },
  badge: {
    fontSize: 9.5,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
    color: "#CB6D73",
  },
  title: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 19,
    color: "#1A1918",
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0, 0, 0, 0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  orderRefRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FAF8F5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#ECE7E1",
  },
  orderRefLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#8E8A85",
    letterSpacing: 0.8,
  },
  orderRefValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: "#1A1918",
  },
  addressBox: {
    backgroundColor: "#FAF8F5",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ECE7E1",
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  recipientNameText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#1A1918",
  },
  phoneText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12.5,
    color: "#666666",
  },
  divider: {
    height: 1,
    backgroundColor: "#EFEAE3",
    marginVertical: 12,
  },
  fullAddressText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13.5,
    lineHeight: 20,
    color: "#1A1918",
  },
  logisticsCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FAF0F1",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F8D8DC",
    marginBottom: 18,
  },
  logisticsText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 11.5,
    color: "#8E8A85",
    lineHeight: 16,
  },
  doneBtn: {
    backgroundColor: "#1A1918",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  doneBtnText: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});
