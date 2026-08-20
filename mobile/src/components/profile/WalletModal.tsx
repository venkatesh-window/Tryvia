import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Typography } from '../ui/Typography';
import { GlassCard } from '../ui/GlassCard';
import { X, Sparkles, Clock, CheckCircle2 } from 'lucide-react-native';
import { theme } from '../../theme/theme';
import { BlurView } from 'expo-blur';
import { walletService, WalletBalanceSummary } from '../../api/services/walletService';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface WalletModalProps {
  visible: boolean;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const [summary, setSummary] = useState<WalletBalanceSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      walletService.getBalance()
        .then(res => {
          setSummary(res);
          setLoading(false);
        })
        .catch(e => {
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
        <View style={[styles.modalContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Typography variant="h2" weight="medium">TRYVIA Wallet</Typography>
              <Typography variant="caption" color="secondary" style={{ marginTop: 4 }}>
                Smart Upgrade Credits
              </Typography>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <X size={20} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Balance Card */}
            <GlassCard intensity={40} style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <Sparkles size={20} color="#B8860B" />
                <Typography variant="caption" weight="bold" style={{ color: '#B8860B', letterSpacing: 1.5, marginLeft: 8 }}>
                  AVAILABLE BALANCE
                </Typography>
              </View>
              <Typography variant="h1" weight="bold" style={styles.balanceAmount}>
                ₹{summary?.total_balance?.toFixed(2) || '0.00'}
              </Typography>
              <Typography variant="body" color="secondary" style={styles.balanceDesc}>
                Earn 100% of your tester purchase amount as credit towards the full-size product!
              </Typography>
            </GlassCard>

            {loading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Typography variant="body" color="secondary">Loading wallet details...</Typography>
              </View>
            ) : (
              <View style={styles.historySection}>
                <Typography variant="h3" weight="medium" style={styles.sectionTitle}>
                  Active Credits
                </Typography>
                
                {summary?.active_credits.length === 0 ? (
                  <Typography variant="body" color="secondary" style={styles.emptyText}>
                    You have no active credits. Buy a tester &gt; ₹200 to earn credits!
                  </Typography>
                ) : (
                  summary?.active_credits.map((credit, idx) => (
                    <Animated.View key={credit.id} entering={FadeInUp.delay(idx * 100)}>
                      <View style={styles.creditItem}>
                        <View style={styles.creditIcon}>
                          <Clock size={16} color={theme.colors.text.primary} />
                        </View>
                        <View style={styles.creditInfo}>
                          <Typography variant="body" weight="medium">Product #{credit.eligible_product_id} Upgrade</Typography>
                          <Typography variant="caption" color="secondary">
                            Expires: {new Date(credit.expiry_date).toLocaleDateString()}
                          </Typography>
                        </View>
                        <View style={styles.creditValue}>
                          <Typography variant="body" weight="bold" style={{ color: '#15803d' }}>
                            +₹{credit.original_amount.toFixed(0)}
                          </Typography>
                        </View>
                      </View>
                    </Animated.View>
                  ))
                )}

                <Typography variant="h3" weight="medium" style={[styles.sectionTitle, { marginTop: 32 }]}>
                  Used & Expired
                </Typography>
                
                {summary?.used_credits.map((credit, idx) => (
                  <View key={`used-${credit.id}`} style={styles.creditItem}>
                    <View style={styles.creditIcon}>
                      <CheckCircle2 size={16} color="#666" />
                    </View>
                    <View style={styles.creditInfo}>
                      <Typography variant="body" weight="medium" style={{ color: '#666' }}>Redeemed</Typography>
                      <Typography variant="caption" color="secondary">
                        Product #{credit.eligible_product_id} Upgrade
                      </Typography>
                    </View>
                    <View style={styles.creditValue}>
                      <Typography variant="body" weight="bold" style={{ color: '#666' }}>
                        -₹{credit.redeemable_amount.toFixed(0)}
                      </Typography>
                    </View>
                  </View>
                ))}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FAFAF8',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 24,
  },
  balanceCard: {
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    marginBottom: 32,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceAmount: {
    fontSize: 40,
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  balanceDesc: {
    lineHeight: 20,
  },
  historySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    letterSpacing: 1,
  },
  emptyText: {
    fontStyle: 'italic',
    paddingVertical: 12,
  },
  creditItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  creditIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  creditInfo: {
    flex: 1,
  },
  creditValue: {
    alignItems: 'flex-end',
  }
});
