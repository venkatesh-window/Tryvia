import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay, 
  Easing
} from 'react-native-reanimated';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Typography } from '../../src/components/ui/Typography';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useTheme } from '../../src/hooks/useTheme';
import { useRouter } from 'expo-router';
import { ProductCard, ProductData } from '../../src/components/ui/ProductCard';

const { width } = Dimensions.get('window');

const MOCK_UPGRADES: ProductData[] = [
  {
    id: 1,
    name: 'Midnight Recovery Cloud Cream',
    brand: 'Kiehls',
    fullPrice: 5200,
    testerPrice: 350,
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop',
  }
];

export default function RewardsScreen() {
  const { user } = useAuthStore();
  const theme = useTheme();
  const router = useRouter();
  
  // Mock gamification state
  const walletBalance = user?.walletBalance || 350;
  const currentStars = user?.stars || 120;
  const nextTierStars = 300;
  const progressPercent = Math.min((currentStars / nextTierStars) * 100, 100);
  
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withDelay(
      500, 
      withTiming(progressPercent, { 
        duration: 1500, 
        easing: Easing.out(Easing.exp) 
      })
    );
  }, [progressPercent]);

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value}%`,
    };
  });

  return (
    <ScreenContainer showOrbs={true}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <Typography variant="h1">Rewards</Typography>
        </View>

        {/* Wallet Credit Card */}
        <GlassCard intensity={80} style={[styles.walletCard, { borderColor: theme.colors.secondary.main }]}>
          <Typography variant="caption" color="secondary" style={styles.walletTitle}>
            TRYVIA WALLET BALANCE
          </Typography>
          <Typography variant="h1" style={styles.walletAmount}>₹{walletBalance}</Typography>
          <Typography variant="body" color="secondary" style={styles.walletSubtitle}>
            100% applicable on full-size upgrades.
          </Typography>
        </GlassCard>

        {/* Loyalty Tier Progress */}
        <View style={styles.section}>
          <View style={styles.tierHeader}>
            <Typography variant="h3">{user?.loyaltyTier || 'BRONZE'} TIER</Typography>
            <Typography variant="caption" color="secondary">
              {currentStars} / {nextTierStars} ★
            </Typography>
          </View>
          
          <View style={[styles.progressBarBg, { backgroundColor: 'rgba(0,0,0,0.05)' }]}>
            <Animated.View style={[styles.progressBarFill, { backgroundColor: theme.colors.primary.main }, progressStyle]} />
          </View>
          <Typography variant="caption" color="secondary" style={styles.tierHint}>
            Earn {nextTierStars - currentStars} more stars to reach Silver.
          </Typography>
        </View>

        {/* Ready to Upgrade */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typography variant="h3">Ready to Upgrade</Typography>
          </View>
          <Typography variant="body" color="secondary" style={styles.upgradeHint}>
            You've tried these testers. Apply your wallet credit now!
          </Typography>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {MOCK_UPGRADES.map((item) => (
              <ProductCard 
                key={item.id}
                product={item} 
                onPress={() => router.push(`/product/${item.id}` as any)} 
              />
            ))}
          </ScrollView>
        </View>

        {/* Transaction History */}
        <View style={styles.section}>
          <Typography variant="h3" style={styles.sectionTitle}>History</Typography>
          
          <GlassCard style={styles.transactionCard}>
            <View style={styles.txIconContainer}>
               <Typography variant="h3" color="primary">↗</Typography>
            </View>
            <View style={styles.txDetails}>
              <Typography variant="body" weight="medium">Tester Purchased</Typography>
              <Typography variant="caption" color="secondary">Kiehls Midnight Recovery</Typography>
            </View>
            <View style={styles.txAmount}>
              <Typography variant="body" color="primary" weight="bold">+₹350</Typography>
            </View>
          </GlassCard>

          <GlassCard style={[styles.transactionCard, { opacity: 0.7 }]}>
            <View style={styles.txIconContainer}>
               <Typography variant="h3" color="secondary">↘</Typography>
            </View>
            <View style={styles.txDetails}>
              <Typography variant="body" weight="medium">Full Size Upgrade</Typography>
              <Typography variant="caption" color="secondary">Baccarat Rouge 540</Typography>
            </View>
            <View style={styles.txAmount}>
              <Typography variant="body" color="secondary" weight="bold">-₹950</Typography>
            </View>
          </GlassCard>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 32,
  },
  walletCard: {
    padding: 32,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
  },
  walletTitle: {
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  walletAmount: {
    fontSize: 48, // Override for massive display
    marginBottom: 8,
  },
  walletSubtitle: {
    textAlign: 'center',
  },
  section: {
    marginBottom: 40,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  tierHint: {
    textAlign: 'right',
  },
  sectionHeader: {
    marginBottom: 8,
  },
  upgradeHint: {
    marginBottom: 16,
  },
  horizontalScroll: {
    paddingBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  transactionCard: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  txIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  txDetails: {
    flex: 1,
  },
  txAmount: {
    alignItems: 'flex-end',
  },
  bottomPadding: {
    height: 100, // Accounts for floating tab bar
  }
});
