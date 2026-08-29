import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Typography } from "../../src/components/ui/Typography";
import { Search, Filter, Download, ShoppingBag } from "lucide-react-native";
import { apiClient } from "../../src/api/client";
import { useRouter } from "expo-router";

export default function VendorOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await apiClient.get("/vendor/orders");
        setOrders(response.data);
      } catch (err) {
        if (
          err.response?.status === 404 &&
          (err.response?.data?.detail?.includes("Vendor account not found") ||
            err.response?.data?.message?.includes("Vendor account not found"))
        ) {
          router.replace("/vendor/apply");
          return;
        }
        setError(
          err.response?.data?.detail ||
            err.response?.data?.message ||
            err.message,
        );
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#CB6D73" />
      </View>
    );
  }

  const filteredOrders = orders.filter(
    (o) =>
      o.id?.toString().includes(search) ||
      o.customer?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Typography style={styles.title}>Orders</Typography>
          <Typography style={styles.subtitle}>
            Manage customer orders and fulfillment
          </Typography>
        </View>
        <TouchableOpacity style={styles.exportBtn} activeOpacity={0.8}>
          <Download size={16} color="#1A1918" />
          <Typography style={styles.exportBtnText}>Export</Typography>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={{ marginBottom: 16 }}>
          <Typography style={{ color: "#D9383A" }}>{error}</Typography>
        </View>
      )}

      <View style={styles.controlsBar}>
        <View style={styles.searchContainer}>
          <Search size={18} color="#8E8A85" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Order ID or Customer..."
            placeholderTextColor="#B0AAA2"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Filter size={18} color="#1A1918" />
          <Typography style={styles.filterText}>Status: All</Typography>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <ShoppingBag size={48} color="#ECE7E1" />
            <Typography style={styles.emptyText}>No orders found</Typography>
            <Typography style={styles.emptySubtext}>
              Orders containing your products will appear here.
            </Typography>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {filteredOrders.map((order, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.orderCard}
                activeOpacity={0.7}
                onPress={() => router.push(`/vendor/orders/${order._id}`)}
              >
                <View style={styles.orderHeader}>
                  <View>
                    <Typography style={styles.orderId}>
                      Order #{order.id}
                    </Typography>
                    <Typography style={styles.orderDate}>
                      {new Date(order.date).toLocaleDateString()}
                    </Typography>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      order.status === "PENDING" || order.status === "PAID"
                        ? styles.statusPending
                        : order.status === "PROCESSING"
                          ? styles.statusProcessing
                          : order.status === "SHIPPED"
                            ? styles.statusShipped
                            : order.status === "DELIVERED"
                              ? styles.statusDelivered
                              : styles.statusCancelled,
                    ]}
                  >
                    <Typography
                      style={[
                        styles.statusText,
                        order.status === "PENDING" || order.status === "PAID"
                          ? styles.statusTextPending
                          : order.status === "PROCESSING"
                            ? styles.statusTextProcessing
                            : order.status === "SHIPPED"
                              ? styles.statusTextShipped
                              : order.status === "DELIVERED"
                                ? styles.statusTextDelivered
                                : styles.statusTextCancelled,
                      ]}
                    >
                      {order.status}
                    </Typography>
                  </View>
                </View>

                <View style={styles.orderDivider} />

                <View style={styles.orderBody}>
                  <View style={styles.orderDetail}>
                    <Typography style={styles.orderLabel}>Customer</Typography>
                    <Typography style={styles.orderValue}>
                      {order.customer}
                    </Typography>
                  </View>
                  <View style={styles.orderDetail}>
                    <Typography style={styles.orderLabel}>Items</Typography>
                    <Typography style={styles.orderValue}>
                      {order.products}
                    </Typography>
                  </View>
                  <View style={styles.orderDetail}>
                    <Typography style={styles.orderLabel}>Total</Typography>
                    <Typography style={styles.orderAmount}>
                      ${order.total.toFixed(2)}
                    </Typography>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 28,
    color: "#1A1918",
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#8E8A85",
  },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#ECE7E1",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  exportBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#1A1918",
  },
  controlsBar: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#ECE7E1",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#1A1918",
    height: "100%",
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#ECE7E1",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  filterText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#1A1918",
  },
  emptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECE7E1",
    padding: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: "#1A1918",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#8E8A85",
    textAlign: "center",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  ordersList: {
    gap: 12,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECE7E1",
    padding: 16,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderId: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#1A1918",
    marginBottom: 2,
  },
  orderDate: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#8E8A85",
  },
  orderDivider: {
    height: 1,
    backgroundColor: "#ECE7E1",
    marginBottom: 12,
  },
  orderBody: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  orderDetail: {
    gap: 4,
  },
  orderLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#8E8A85",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  orderValue: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#1A1918",
  },
  orderAmount: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#CB6D73",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  statusPending: { backgroundColor: "#FDECEC" },
  statusTextPending: { color: "#D9383A" },
  statusProcessing: { backgroundColor: "#FEF0DB" },
  statusTextProcessing: { color: "#D9985F" },
  statusShipped: { backgroundColor: "#EBF3FF" },
  statusTextShipped: { color: "#3A7BD9" },
  statusDelivered: { backgroundColor: "#E9F5EF" },
  statusTextDelivered: { color: "#318C59" },
  statusCancelled: { backgroundColor: "#F0ECE6" },
  statusTextCancelled: { color: "#8E8A85" },
  viewText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#CB6D73",
  },
});
