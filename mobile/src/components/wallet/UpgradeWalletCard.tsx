import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '../ui/Typography';
import { GlassCard } from '../ui/GlassCard';
import { WalletCredit } from '../../api/services/walletService';
import { Sparkles } from 'lucide-react-native';
import { theme } from '../../theme/theme';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface UpgradeWalletCardProps {
  credit: WalletCredit;
  compact?: boolean;
}

export function UpgradeWalletCard({ credit, compact = false }: UpgradeWalletCardProps) {
  return (
    <Animated.View entering={FadeInUp.duration(600)}>
      <GlassCard intensity={40} style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <Sparkles size={16} color={theme.colors.text.primary} />
            <Typography variant="h3" weight="bold" style={styles.title}>
              TRYVIA Upgrade Wallet
            </Typography>
          </View>
          <View style={styles.statusBadge}>
            <Typography variant="caption" weight="bold" style={styles.statusText}>
              ELIGIBLE
            </Typography>
          </View>
        </View>

        {!compact && (
          <Typography variant="caption" color="secondary" style={styles.message}>
            You previously purchased a tester for this product. 75% of your tester purchase is available as a discount towards the full-size product!
          </Typography>
        )}

        <View style={styles.breakdownBox}>
          <View style={styles.row}>
            <Typography variant="body" color="secondary">Wallet Balance</Typography>
            <Typography variant="body" weight="medium">₹{credit.original_amount.toFixed(2)}</Typography>
          </View>
          
          <View style={styles.row}>
            <Typography variant="body" color="primary">Redeemable Amount (75%)</Typography>
            <Typography variant="body" color="primary" weight="bold">-₹{credit.redeemable_amount.toFixed(2)}</Typography>
          </View>
          
          <View style={styles.row}>
            <Typography variant="body" color="secondary">Platform Fee (25%)</Typography>
            <Typography variant="body" color="secondary">₹{credit.platform_fee.toFixed(2)}</Typography>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)', // Subtle gold tint for upgrade
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    letterSpacing: 1,
  },
  statusBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)', // Light green
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  statusText: {
    color: '#15803d',
    fontSize: 10,
    letterSpacing: 1,
  },
  message: {
    marginBottom: 16,
    lineHeight: 20,
  },
  breakdownBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  }
});
