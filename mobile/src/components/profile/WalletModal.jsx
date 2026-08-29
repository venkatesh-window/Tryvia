import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Typography } from "../ui/Typography";
import { GlassCard } from "../ui/GlassCard";
import { X, Sparkles, Clock, CheckCircle2 } from "lucide-react-native";
import { theme } from "../../theme/theme";
import { walletService } from "../../api/services/walletService";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const WalletModal = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      walletService
        .getBalance()
        .then((res) => {
          setSummary(res);
          setLoading(false);
        })
        .catch((e) => {
          console.log(e);
          setLoading(false);
        });
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Typography variant="h2" weight="medium">
                TRYVIA Wallet
              </Typography>
              <Typography
                variant="caption"
                color="secondary"
                style={{ marginTop: 4 }}
              >
                Smart Upgrade Credits
              </Typography>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={8}
            >
              <X size={20} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Balance Card */}
            <GlassCard intensity={40} style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <Sparkles size={20} color="#B8860B" />
                <Typography
                  variant="caption"
                  weight="bold"
                  style={{
                    color: "#B8860B",
                    letterSpacing: 1.5,
                    marginLeft: 8,
                    paddingHorizontal: 2,
                  }}
                >
                  AVAILABLE BALANCE
                </Typography>
              </View>
              <Typography
                variant="h1"
                weight="bold"
                style={styles.balanceAmount}
              >
                ₹{summary?.total_balance?.toFixed(2) || "0.00"}
              </Typography>
              <Typography
                variant="body"
                color="secondary"
                style={styles.balanceDesc}
              >
                Earn credits on mini purchases and apply up to 60% of original product prices!
              </Typography>
            </GlassCard>

            {loading ? (
              <View style={{ padding: 40, alignItems: "center" }}>
                <Typography variant="body" color="secondary">
                  Loading wallet details...
                </Typography>
              </View>
            ) : (
              <View style={styles.historySection}>
                {/* Active Credits */}
                <Typography
                  variant="h3"
                  weight="medium"
                  style={styles.sectionTitle}
                >
                  Active Credit Lots
                </Typography>

                {(!summary?.active_credits || summary.active_credits.length === 0) ? (
                  <Typography
                    variant="body"
                    color="secondary"
                    style={styles.emptyText}
                  >
                    No active credits. Buy a mini product to earn credits!
                  </Typography>
                ) : (
                  summary.active_credits.map((credit, idx) => (
                    <Animated.View
                      key={credit.id}
                      entering={FadeInUp.delay(idx * 50)}
                    >
                      <View style={styles.creditItem}>
                        <View style={styles.creditIcon}>
                          <Sparkles size={16} color="#B8860B" />
                        </View>
                        <View style={styles.creditInfo}>
                          <Typography variant="body" weight="medium">
                            Tester Upgrade Credit
                          </Typography>
                          {credit.status === "PARTIALLY_USED" && (
                            <Typography variant="caption" style={{ color: "#d97706", fontSize: 10 }}>
                              Partially Used (originally ₹{credit.original_amount})
                            </Typography>
                          )}
                          <Typography variant="caption" color="secondary">
                            Expires: {new Date(credit.expiry_date).toLocaleDateString()}
                          </Typography>
                        </View>
                        <View style={styles.creditValue}>
                          <Typography
                            variant="body"
                            weight="bold"
                            style={{ color: "#15803d" }}
                          >
                            ₹{Number(credit.redeemable_amount ?? 0).toFixed(2)}
                          </Typography>
                        </View>
                      </View>
                    </Animated.View>
                  ))
                )}

                {/* Transaction History */}
                <Typography
                  variant="h3"
                  weight="medium"
                  style={[styles.sectionTitle, { marginTop: 24 }]}
                >
                  Transaction Audit History
                </Typography>

                {(!summary?.transactions || summary.transactions.length === 0) ? (
                  <Typography
                    variant="body"
                    color="secondary"
                    style={styles.emptyText}
                  >
                    No transaction logs recorded.
                  </Typography>
                ) : (
                  summary.transactions.map((tx, idx) => (
                    <Animated.View
                      key={tx.id}
                      entering={FadeInUp.delay(idx * 50)}
                    >
                      <View style={styles.creditItem}>
                        <View style={styles.creditIcon}>
                          {tx.type === "CREDIT" ? (
                            <Sparkles size={16} color="#B8860B" />
                          ) : (
                            <CheckCircle2 size={16} color="#666" />
                          )}
                        </View>
                        <View style={styles.creditInfo}>
                          <Typography variant="body" weight="medium">
                            {tx.description || (tx.type === "CREDIT" ? "Credits Earned" : "Credits Used")}
                          </Typography>
                          <Typography variant="caption" color="secondary">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </Typography>
                        </View>
                        <View style={styles.creditValue}>
                          <Typography
                            variant="body"
                            weight="bold"
                            style={{ color: tx.type === "CREDIT" ? "#15803d" : "#ef4444" }}
                          >
                            {tx.type === "CREDIT" ? "+" : "-"}₹{Number(tx.amount).toFixed(2)}
                          </Typography>
                        </View>
                      </View>
                    </Animated.View>
                  ))
                )}
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FAFAF8",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 24,
  },
  balanceCard: {
    padding: 24,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    marginBottom: 32,
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  balanceAmount: {
    fontSize: 40,
    color: theme.colors.text.primary,
    marginBottom: 12,
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 2,
  },
  balanceDesc: {
    lineHeight: 20,
    paddingHorizontal: 2,
  },
  historySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    letterSpacing: 1,
  },
  emptyText: {
    fontStyle: "italic",
    paddingVertical: 12,
  },
  creditItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  creditIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.04)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  creditInfo: {
    flex: 1,
  },
  creditValue: {
    alignItems: "flex-end",
  },
});
