import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Typography } from "../../src/components/ui/Typography";
import { apiClient } from "../../src/api/client";
import { ArrowLeftRight, Check, X } from "lucide-react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";

export default function VendorReturnsScreen() {
  const router = useRouter();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);

  const fetchReturns = async () => {
    try {
      const response = await apiClient.get("/returns/vendor");
      setReturns(response.data);
    } catch (e) {
      if (
        e.response?.status === 404 &&
        (e.response?.data?.detail?.includes("Vendor account not found") ||
          e.response?.data?.message?.includes("Vendor account not found"))
      ) {
        router.replace("/vendor/apply");
        return;
      }
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleAction = async (id, status) => {
    setActioning(id);
    try {
      await apiClient.patch(`/returns/vendor/${id}/status`, { status });
      await fetchReturns();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setActioning(null);
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#CB6D73" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Typography style={styles.title}>Returns</Typography>
        <Typography style={styles.subtitle}>
          Manage customer return requests.
        </Typography>
      </View>

      <View style={styles.listCard}>
        {returns.length === 0 ? (
          <View style={styles.emptyState}>
            <ArrowLeftRight
              size={40}
              color="#ECE7E1"
              style={{ marginBottom: 16 }}
            />
            <Typography style={styles.emptyText}>
              No returns requested.
            </Typography>
          </View>
        ) : (
          returns.map((ret, idx) => (
            <View key={idx} style={styles.returnCard}>
              <View style={styles.returnHeader}>
                <View>
                  <Typography style={styles.returnId}>
                    Return #{ret._id.toString().substring(0, 8)}
                  </Typography>
                  <Typography style={styles.returnDate}>
                    Order #{ret.order?.numericId} •{" "}
                    {new Date(ret.createdAt).toLocaleDateString()}
                  </Typography>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    ret.status === "APPROVED" || ret.status === "REFUNDED"
                      ? styles.statusApproved
                      : ret.status === "REJECTED" || ret.status === "CANCELLED"
                        ? styles.statusRejected
                        : styles.statusPending,
                  ]}
                >
                  <Typography
                    style={[
                      styles.statusText,
                      ret.status === "APPROVED" || ret.status === "REFUNDED"
                        ? styles.statusTextApproved
                        : ret.status === "REJECTED" ||
                            ret.status === "CANCELLED"
                          ? styles.statusTextRejected
                          : styles.statusTextPending,
                    ]}
                  >
                    {ret.status}
                  </Typography>
                </View>
              </View>

              <View style={styles.productRow}>
                <Image
                  source={{ uri: ret.product?.imageUrl }}
                  style={styles.productImg}
                />
                <View style={{ flex: 1 }}>
                  <Typography style={styles.productName} numberOfLines={1}>
                    {ret.product?.name}
                  </Typography>
                  <Typography style={styles.productType}>
                    {ret.quantity}x{" "}
                    {ret.itemType === "full" ? "Full Size" : "Tester"}
                  </Typography>
                  <Typography style={styles.reasonText}>
                    <Typography
                      style={{
                        fontFamily: "Inter_600SemiBold",
                        color: "#1A1918",
                      }}
                    >
                      Reason:{" "}
                    </Typography>
                    {ret.customerReason}
                  </Typography>
                </View>
              </View>

              {ret.status === "REQUESTED" && (
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: "#A3D9B8" }]}
                    onPress={() => handleAction(ret._id, "APPROVED")}
                    disabled={actioning === ret._id}
                  >
                    {actioning === ret._id ? (
                      <ActivityIndicator size="small" color="#318C59" />
                    ) : (
                      <>
                        <Check size={16} color="#318C59" />
                        <Typography
                          style={[styles.actionBtnText, { color: "#318C59" }]}
                        >
                          Approve
                        </Typography>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: "#F8B4B4" }]}
                    onPress={() => handleAction(ret._id, "REJECTED")}
                    disabled={actioning === ret._id}
                  >
                    <X size={16} color="#D9383A" />
                    <Typography
                      style={[styles.actionBtnText, { color: "#D9383A" }]}
                    >
                      Reject
                    </Typography>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F5" },
  header: { padding: 16, paddingBottom: 16 },
  title: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 28,
    color: "#1A1918",
    marginBottom: 4,
  },
  subtitle: { fontFamily: "Inter_500Medium", fontSize: 14, color: "#8E8A85" },
  listCard: { paddingHorizontal: 16, paddingBottom: 40 },
  returnCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECE7E1",
    padding: 20,
    marginBottom: 16,
  },
  returnHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F8F6F3",
  },
  returnId: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#1A1918",
    marginBottom: 2,
  },
  returnDate: { fontFamily: "Inter_500Medium", fontSize: 12, color: "#8E8A85" },
  productRow: { flexDirection: "row", gap: 16 },
  productImg: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#F8F6F3",
  },
  productName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#1A1918",
    marginBottom: 4,
  },
  productType: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#8E8A85",
    marginBottom: 8,
  },
  reasonText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#4A4846",
    fontStyle: "italic",
    backgroundColor: "#FAF8F5",
    padding: 8,
    borderRadius: 8,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F8F6F3",
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  actionBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  emptyState: {
    padding: 60,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECE7E1",
  },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 14, color: "#8E8A85" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  statusPending: { backgroundColor: "#FEF0DB" },
  statusTextPending: { color: "#D9985F" },
  statusApproved: { backgroundColor: "#E9F5EF" },
  statusTextApproved: { color: "#318C59" },
  statusRejected: { backgroundColor: "#FDECEC" },
  statusTextRejected: { color: "#D9383A" },
});
