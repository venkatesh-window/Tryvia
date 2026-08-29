import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { Typography } from "../../src/components/ui/Typography";
import { apiClient } from "../../src/api/client";
import { DollarSign, Wallet, Activity, Percent } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function VendorEarningsScreen() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const response = await apiClient.get("/vendor/earnings");
        setData(response.data);
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
    fetchEarnings();
  }, []);

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

  const { summary, transactions } = data;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Typography style={styles.title}>Earnings & Payouts</Typography>
        <Typography style={styles.subtitle}>
          Track your sales, commissions, and net earnings.
        </Typography>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={styles.metricIconWrap}>
            <DollarSign size={20} color="#1A1918" />
          </View>
          <Typography style={styles.metricLabel}>GROSS SALES</Typography>
          <Typography style={styles.metricValue}>
            ${summary.grossSales.toFixed(2)}
          </Typography>
        </View>
        <View style={styles.metricCard}>
          <View style={[styles.metricIconWrap, { backgroundColor: "#F0ECE6" }]}>
            <Percent size={20} color="#8E8A85" />
          </View>
          <Typography style={styles.metricLabel}>TRYVIA FEES</Typography>
          <Typography style={[styles.metricValue, { color: "#8E8A85" }]}>
            -${summary.tryviaFees.toFixed(2)}
          </Typography>
        </View>
        <View style={[styles.metricCard, { backgroundColor: "#1A1918" }]}>
          <View
            style={[
              styles.metricIconWrap,
              { backgroundColor: "#333333", borderWidth: 0 },
            ]}
          >
            <Wallet size={20} color="#FFFFFF" />
          </View>
          <Typography style={[styles.metricLabel, { color: "#B0AAA2" }]}>
            NET EARNINGS
          </Typography>
          <Typography style={[styles.metricValue, { color: "#FFFFFF" }]}>
            ${summary.netEarnings.toFixed(2)}
          </Typography>
        </View>
      </View>

      <View style={styles.splitRow}>
        <View style={styles.splitCard}>
          <Activity size={18} color="#D9985F" style={{ marginBottom: 12 }} />
          <Typography style={styles.metricLabel}>PENDING EARNINGS</Typography>
          <Typography style={styles.metricValue}>
            ${summary.pendingEarnings.toFixed(2)}
          </Typography>
          <Typography style={styles.helpText}>
            From active orders not yet delivered.
          </Typography>
        </View>
        <View style={styles.splitCard}>
          <Wallet size={18} color="#318C59" style={{ marginBottom: 12 }} />
          <Typography style={styles.metricLabel}>COMPLETED EARNINGS</Typography>
          <Typography style={styles.metricValue}>
            ${summary.completedEarnings.toFixed(2)}
          </Typography>
          <Typography style={styles.helpText}>
            Cleared for future payout processing.
          </Typography>
        </View>
      </View>

      <View style={styles.listCard}>
        <Typography style={styles.listTitle}>Recent Transactions</Typography>

        <View style={styles.listContainer}>
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Typography style={styles.emptyText}>
                No transactions yet.
              </Typography>
            </View>
          ) : (
            transactions.map((tx, idx) => (
              <View key={idx} style={styles.listItem}>
                <View style={styles.listItemHeader}>
                  <View>
                    <Typography style={styles.tdId}>#{tx.orderId}</Typography>
                    <Typography style={styles.tdDate}>
                      {new Date(tx.date).toLocaleDateString()}
                    </Typography>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      tx.status === "DELIVERED"
                        ? styles.statusDelivered
                        : tx.status === "CANCELLED"
                          ? styles.statusCancelled
                          : styles.statusPending,
                    ]}
                  >
                    <Typography
                      style={[
                        styles.statusText,
                        tx.status === "DELIVERED"
                          ? styles.statusTextDelivered
                          : tx.status === "CANCELLED"
                            ? styles.statusTextCancelled
                            : styles.statusTextPending,
                      ]}
                    >
                      {tx.status}
                    </Typography>
                  </View>
                </View>
                <View style={styles.listItemBody}>
                  <View style={{ flex: 1 }}>
                    <Typography style={styles.tdName} numberOfLines={1}>
                      {tx.productName}
                    </Typography>
                    <Typography style={styles.tdType}>
                      {tx.type.toUpperCase()}
                    </Typography>
                  </View>
                  <View style={styles.txAmounts}>
                    <Typography style={styles.tdValue}>
                      Gross: ${tx.grossAmount.toFixed(2)}
                    </Typography>
                    <Typography style={[styles.tdValue, { color: "#D9383A" }]}>
                      Fee: -${tx.tryviaFee.toFixed(2)}
                    </Typography>
                    <Typography
                      style={[styles.tdValue, { fontFamily: "Inter_700Bold" }]}
                    >
                      Net: ${tx.netAmount.toFixed(2)}
                    </Typography>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
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
  metricsGrid: {
    flexDirection: "column",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ECE7E1",
  },
  metricIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FAF8F5",
    borderWidth: 1,
    borderColor: "#ECE7E1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  metricLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10.5,
    color: "#8E8A85",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  metricValue: { fontFamily: "Inter_700Bold", fontSize: 28, color: "#1A1918" },
  splitRow: {
    flexDirection: "column",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  splitCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ECE7E1",
  },
  helpText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#B0AAA2",
    marginTop: 8,
  },
  listCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECE7E1",
    padding: 16,
    marginBottom: 40,
  },
  listTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#1A1918",
    marginBottom: 16,
  },
  listContainer: { flexDirection: "column", gap: 12 },
  listItem: {
    backgroundColor: "#FAF8F5",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ECE7E1",
  },
  listItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  listItemBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderTopWidth: 1,
    borderTopColor: "#ECE7E1",
    paddingTop: 12,
  },
  tdDate: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#8E8A85",
    marginTop: 2,
  },
  tdId: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#1A1918" },
  tdName: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#1A1918",
    marginBottom: 4,
  },
  tdType: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "#8E8A85",
    letterSpacing: 0.5,
  },
  txAmounts: { alignItems: "flex-end", gap: 4 },
  tdValue: { fontFamily: "Inter_500Medium", fontSize: 13, color: "#1A1918" },
  emptyState: { padding: 40, alignItems: "center" },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 14, color: "#8E8A85" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  statusPending: { backgroundColor: "#FEF0DB" },
  statusTextPending: { color: "#D9985F" },
  statusDelivered: { backgroundColor: "#E9F5EF" },
  statusTextDelivered: { color: "#318C59" },
  statusCancelled: { backgroundColor: "#F0ECE6" },
  statusTextCancelled: { color: "#8E8A85" },
});
