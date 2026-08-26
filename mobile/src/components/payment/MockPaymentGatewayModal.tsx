import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import {
  CreditCard,
  Building2,
  Banknote,
  CheckCircle2,
  X,
  ShieldCheck,
  Smartphone,
  Package,
} from 'lucide-react-native';
import { Typography } from '../ui/Typography';
import { PremiumButton } from '../ui/PremiumButton';
import { useCartStore } from '../../store/useCartStore';
import { useOrderStore, Order } from '../../store/useOrderStore';
import { useAuthStore } from '../../store/useAuthStore';
import { theme } from '../../theme/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MockPaymentGatewayModalProps {
  visible: boolean;
  deliveryAddress?: string;
  onClose: () => void;
  onSuccess: (order: Order) => void;
}

export const MockPaymentGatewayModal: React.FC<MockPaymentGatewayModalProps> = ({
  visible,
  deliveryAddress,
  onClose,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const { items, total, walletDeduction, clearCart, appliedWalletCredit } = useCartStore();
  const { placeOrder } = useOrderStore();
  const { user, deductWalletBalance } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'upi' | 'card' | 'netbanking' | 'cod'>('cod');
  const [selectedUpiApp, setSelectedUpiApp] = useState<string>('Google Pay');
  const [customUpiId, setCustomUpiId] = useState('');

  // Card details (manual input only)
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');

  const handlePay = async () => {
    setIsProcessing(true);

    if (activeTab === 'cod') {
      setProcessingStep('Verifying delivery destination...');
      await new Promise((resolve) => setTimeout(resolve, 600));
      setProcessingStep('Reserving formulation stock in warehouse...');
      await new Promise((resolve) => setTimeout(resolve, 800));
      setProcessingStep('Generating TryVia courier consignment...');
      await new Promise((resolve) => setTimeout(resolve, 800));
    } else if (activeTab === 'upi') {
      const upiTarget = customUpiId.trim() || selectedUpiApp;
      setProcessingStep(`Requesting authorization on ${upiTarget}...`);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setProcessingStep('Verifying UPI payment with bank...');
      await new Promise((resolve) => setTimeout(resolve, 900));
    } else if (activeTab === 'netbanking') {
      setProcessingStep(`Connecting to ${selectedBank} secure gateway...`);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setProcessingStep('Processing net banking authorization...');
      await new Promise((resolve) => setTimeout(resolve, 900));
    } else {
      setProcessingStep('Authenticating 256-bit encryption...');
      await new Promise((resolve) => setTimeout(resolve, 700));
      setProcessingStep('Verifying card credentials with banking network...');
      await new Promise((resolve) => setTimeout(resolve, 900));
      setProcessingStep('Authorizing payment transaction...');
      await new Promise((resolve) => setTimeout(resolve, 700));
    }

    // Deduct wallet balance if applied
    if (walletDeduction > 0) {
      deductWalletBalance(walletDeduction);
    }

    // Determine payment method label
    let methodLabel = 'Cash on Delivery';
    if (activeTab === 'upi') {
      methodLabel = customUpiId.trim() ? `UPI (${customUpiId.trim()})` : `UPI - ${selectedUpiApp}`;
    } else if (activeTab === 'card') {
      methodLabel = 'Card ending ' + (cardNumber.slice(-4) || '1234');
    } else if (activeTab === 'netbanking') {
      methodLabel = 'Netbanking - ' + selectedBank;
    }

    // Determine shipping address from checkout form or user profile
    const userFormatted = user?.address?.street
      ? `${user.address.street}, ${user.address.city} - ${user.address.pincode}`
      : undefined;
    const finalShippingAddress = deliveryAddress?.trim() || userFormatted;

    // Create completed order
    const newOrder = await placeOrder({
      items: [...items],
      paymentMethod: methodLabel,
      apply_wallet_credit_id: appliedWalletCredit?.id || null,
      shippingAddress: finalShippingAddress,
    });
    
    if (!newOrder) {
      setIsProcessing(false);
      Alert.alert('Order Notice', 'Your order has been recorded.');
      return;
    }

    clearCart();
    setIsProcessing(false);
    onSuccess(newOrder);
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        >
          <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill as any} />
        </TouchableOpacity>

        <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <View style={styles.secureBadgeRow}>
                <ShieldCheck size={14} color="#B8860B" />
                <Typography variant="caption" weight="bold" style={styles.secureBadge}>
                  TRYVIA SECURE PAY
                </Typography>
              </View>
              <Typography variant="h2" weight="medium" style={styles.title}>
                Select Payment Method
              </Typography>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7} hitSlop={8}>
              <X size={18} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Amount Bar */}
          <View style={styles.amountBar}>
            <View>
              <Typography variant="caption" color="secondary" style={{ fontSize: 11 }}>
                TOTAL PAYABLE AMOUNT
              </Typography>
              <Typography variant="price" weight="bold" style={styles.amountText}>
                ₹{total.toFixed(2)}
              </Typography>
            </View>

            {walletDeduction > 0 && (
              <View style={styles.walletSavedBadge}>
                <Typography variant="caption" weight="bold" style={{ color: '#B8860B', fontSize: 11 }}>
                  Saved ₹{walletDeduction} from Wallet
                </Typography>
              </View>
            )}
          </View>

          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#121212" style={{ marginBottom: 20 }} />
              <Typography variant="body" weight="medium" style={{ color: theme.colors.text.primary, marginBottom: 8, fontSize: 16 }}>
                {activeTab === 'cod' ? 'Booking Cash on Delivery' : 'Processing Payment'}
              </Typography>
              <Typography variant="caption" color="secondary" style={{ textAlign: 'center', paddingHorizontal: 40, lineHeight: 18 }}>
                {processingStep}
              </Typography>
            </View>
          ) : (
            <ScrollView 
              showsVerticalScrollIndicator={false} 
              contentContainerStyle={styles.scrollBody}
              keyboardShouldPersistTaps="handled"
            >
              {/* Payment Method Tabs */}
              <View style={styles.tabsRow}>
                <TouchableOpacity
                  style={[styles.tabItem, activeTab === 'cod' && styles.activeTabItem]}
                  onPress={() => setActiveTab('cod')}
                  activeOpacity={0.8}
                >
                  <Banknote size={15} color={activeTab === 'cod' ? '#FFFFFF' : '#666666'} />
                  <Typography
                    variant="caption"
                    weight="medium"
                    numberOfLines={1}
                    style={[styles.tabText, activeTab === 'cod' && styles.activeTabText]}
                  >
                    COD
                  </Typography>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabItem, activeTab === 'upi' && styles.activeTabItem]}
                  onPress={() => setActiveTab('upi')}
                  activeOpacity={0.8}
                >
                  <Smartphone size={15} color={activeTab === 'upi' ? '#FFFFFF' : '#666666'} />
                  <Typography
                    variant="caption"
                    weight="medium"
                    numberOfLines={1}
                    style={[styles.tabText, activeTab === 'upi' && styles.activeTabText]}
                  >
                    UPI
                  </Typography>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabItem, activeTab === 'card' && styles.activeTabItem]}
                  onPress={() => setActiveTab('card')}
                  activeOpacity={0.8}
                >
                  <CreditCard size={15} color={activeTab === 'card' ? '#FFFFFF' : '#666666'} />
                  <Typography
                    variant="caption"
                    weight="medium"
                    numberOfLines={1}
                    style={[styles.tabText, activeTab === 'card' && styles.activeTabText]}
                  >
                    Cards
                  </Typography>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabItem, activeTab === 'netbanking' && styles.activeTabItem]}
                  onPress={() => setActiveTab('netbanking')}
                  activeOpacity={0.8}
                >
                  <Building2 size={15} color={activeTab === 'netbanking' ? '#FFFFFF' : '#666666'} />
                  <Typography
                    variant="caption"
                    weight="medium"
                    numberOfLines={1}
                    style={[styles.tabText, activeTab === 'netbanking' && styles.activeTabText]}
                  >
                    Banking
                  </Typography>
                </TouchableOpacity>
              </View>

              {/* Tab 1: Cash on Delivery */}
              {activeTab === 'cod' && (
                <View style={styles.tabSection}>
                  <View style={styles.codCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                      <Package size={22} color="#CB6D73" />
                      <Typography variant="h3" weight="bold" style={{ color: theme.colors.text.primary, marginLeft: 10 }}>
                        Pay on Arrival
                      </Typography>
                    </View>
                    <Typography variant="body" color="secondary" style={{ lineHeight: 21, fontSize: 13 }}>
                      Pay ₹{total.toFixed(2)} comfortably via cash or any UPI QR code scan presented by our courier upon parcel handover.
                    </Typography>
                    <View style={styles.codPerkRow}>
                      <ShieldCheck size={16} color="#16A34A" />
                      <Typography style={styles.codPerkText}>Verified genuine tamper-evident packaging</Typography>
                    </View>
                  </View>
                </View>
              )}

              {/* Tab 2: UPI */}
              {activeTab === 'upi' && (
                <View style={styles.tabSection}>
                  <Typography variant="caption" color="secondary" style={styles.sectionLabel}>
                    SELECT UPI APPLICATION
                  </Typography>

                  <View style={styles.upiGrid}>
                    {['Google Pay', 'PhonePe', 'Paytm', 'Cred UPI'].map((app) => (
                      <TouchableOpacity
                        key={app}
                        style={[
                          styles.upiAppCard,
                          selectedUpiApp === app && !customUpiId && styles.selectedUpiCard,
                        ]}
                        onPress={() => {
                          setSelectedUpiApp(app);
                          setCustomUpiId('');
                        }}
                        activeOpacity={0.7}
                      >
                        <Smartphone size={18} color={selectedUpiApp === app && !customUpiId ? '#121212' : '#888888'} />
                        <Typography
                          variant="body"
                          weight={selectedUpiApp === app && !customUpiId ? 'semibold' : 'regular'}
                          style={{ color: theme.colors.text.primary, fontSize: 13, marginLeft: 10 }}
                        >
                          {app}
                        </Typography>
                        {selectedUpiApp === app && !customUpiId && (
                          <CheckCircle2 size={16} color="#121212" style={{ marginLeft: 'auto' }} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Typography variant="caption" color="secondary" style={[styles.sectionLabel, { marginTop: 16 }]}>
                    OR ENTER CUSTOM UPI ID
                  </Typography>
                  <View style={styles.inputBox}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. yourname@upi"
                      placeholderTextColor="rgba(0,0,0,0.35)"
                      value={customUpiId}
                      onChangeText={setCustomUpiId}
                      autoCapitalize="none"
                    />
                  </View>
                </View>
              )}

              {/* Tab 3: Cards (Manual Entry Only) */}
              {activeTab === 'card' && (
                <View style={styles.tabSection}>
                  <Typography variant="caption" color="secondary" style={styles.sectionLabel}>
                    CREDIT / DEBIT CARD DETAILS
                  </Typography>

                  <View style={styles.inputBox}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Card Number (XXXX XXXX XXXX XXXX)"
                      placeholderTextColor="rgba(0,0,0,0.35)"
                      keyboardType="numeric"
                      value={cardNumber}
                      onChangeText={setCardNumber}
                      maxLength={19}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                    <View style={[styles.inputBox, { flex: 1 }]}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="MM / YY"
                        placeholderTextColor="rgba(0,0,0,0.35)"
                        value={cardExpiry}
                        onChangeText={setCardExpiry}
                        maxLength={5}
                      />
                    </View>
                    <View style={[styles.inputBox, { flex: 1 }]}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="CVV"
                        placeholderTextColor="rgba(0,0,0,0.35)"
                        keyboardType="numeric"
                        secureTextEntry
                        value={cardCvv}
                        onChangeText={setCardCvv}
                        maxLength={4}
                      />
                    </View>
                  </View>

                  <View style={[styles.inputBox, { marginTop: 12 }]}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Cardholder Name as on Card"
                      placeholderTextColor="rgba(0,0,0,0.35)"
                      value={cardName}
                      onChangeText={setCardName}
                    />
                  </View>
                </View>
              )}

              {/* Tab 4: Net Banking */}
              {activeTab === 'netbanking' && (
                <View style={styles.tabSection}>
                  <Typography variant="caption" color="secondary" style={styles.sectionLabel}>
                    SELECT PREMIUM BANK
                  </Typography>

                  {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank'].map((bank) => (
                    <TouchableOpacity
                      key={bank}
                      style={[
                        styles.bankItemCard,
                        selectedBank === bank && styles.selectedBankCard,
                      ]}
                      onPress={() => setSelectedBank(bank)}
                      activeOpacity={0.7}
                    >
                      <Building2 size={18} color={selectedBank === bank ? '#121212' : '#888888'} />
                      <Typography variant="body" weight={selectedBank === bank ? 'semibold' : 'regular'} style={{ color: theme.colors.text.primary, marginLeft: 12 }}>
                        {bank}
                      </Typography>
                      {selectedBank === bank && (
                        <CheckCircle2 size={18} color="#121212" style={{ marginLeft: 'auto' }} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Checkout Action Button */}
              <View style={{ marginTop: 24, marginBottom: 12 }}>
                <PremiumButton
                  title={activeTab === 'cod' ? `Confirm Cash on Delivery (₹${total.toFixed(2)})` : `Pay ₹${total.toFixed(2)} Securely`}
                  onPress={handlePay}
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
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  secureBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  secureBadge: {
    color: '#B8860B',
    fontSize: 10,
    letterSpacing: 1.5,
  },
  title: {
    color: theme.colors.text.primary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  amountText: {
    color: theme.colors.text.primary,
    fontSize: 28,
    marginTop: 2,
  },
  walletSavedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  scrollBody: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  activeTabItem: {
    backgroundColor: '#121212',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    color: '#666666',
    fontSize: 12,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabSection: {
    marginTop: 4,
  },
  sectionLabel: {
    letterSpacing: 1.5,
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 10,
  },
  upiGrid: {
    gap: 8,
  },
  upiAppCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FAFAF8',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  selectedUpiCard: {
    borderColor: '#121212',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  inputBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  textInput: {
    color: theme.colors.text.primary,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  bankItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FAFAF8',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    marginBottom: 8,
  },
  selectedBankCard: {
    borderColor: '#121212',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  codCard: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#FAFAF8',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  codPerkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
    backgroundColor: '#FAF0F1',
    padding: 10,
    borderRadius: 10,
  },
  codPerkText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#1A1918',
  },
  processingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
