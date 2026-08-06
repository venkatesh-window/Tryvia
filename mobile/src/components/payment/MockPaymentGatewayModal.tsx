import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Typography } from '../ui/Typography';
import { GlassCard } from '../ui/GlassCard';
import { PremiumButton } from '../ui/PremiumButton';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { usePaymentMethodsStore } from '../../store/usePaymentMethodsStore';
import { useOrderStore, Order } from '../../store/useOrderStore';
import {
  X,
  CreditCard,
  QrCode,
  Building2,
  Banknote,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface MockPaymentGatewayModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (order: Order) => void;
}

type PaymentTab = 'upi' | 'card' | 'netbanking' | 'cod';

export const MockPaymentGatewayModal: React.FC<MockPaymentGatewayModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { items, subtotal, walletDeduction, total, clearCart } = useCartStore();
  const { user, addWalletBalance, deductWalletBalance } = useAuthStore();
  const { methods } = usePaymentMethodsStore();
  const { placeOrder } = useOrderStore();

  const [activeTab, setActiveTab] = useState<PaymentTab>('upi');
  const [selectedUpiApp, setSelectedUpiApp] = useState('Google Pay');
  const [customUpiId, setCustomUpiId] = useState('');
  
  // Card form state
  const [selectedSavedCard, setSelectedSavedCard] = useState<string | null>(
    methods.find(m => m.type === 'card')?.id || null
  );
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState(user?.fullName || '');

  // Netbanking state
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  // Processing steps
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');

  const savedCards = methods.filter(m => m.type === 'card');
  const savedUpis = methods.filter(m => m.type === 'upi');

  const handlePay = () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setIsProcessing(true);
    setProcessingStep('Initiating 256-bit Secure Gateway...');

    setTimeout(() => {
      setProcessingStep('Verifying Transaction with Bank...');
    }, 800);

    setTimeout(() => {
      setProcessingStep('Payment Authorized & Confirmed!');
    }, 1600);

    setTimeout(() => {
      // 1. Determine payment method display label
      let paymentLabel = 'UPI (Instant)';
      if (activeTab === 'card') {
        paymentLabel = selectedSavedCard
          ? `Saved Card (${savedCards.find(c => c.id === selectedSavedCard)?.cardNumberMasked || '•••• 4242'})`
          : `Credit Card (•••• ${cardNumber.slice(-4) || '8800'})`;
      } else if (activeTab === 'netbanking') {
        paymentLabel = `Net Banking (${selectedBank})`;
      } else if (activeTab === 'cod') {
        paymentLabel = 'Cash on Delivery (Pay upon Arrival)';
      } else {
        paymentLabel = `UPI (${selectedUpiApp})`;
      }

      // 2. Default shipping address
      const shippingAddress = user?.address || {
        fullName: user?.fullName || 'Luxury Member',
        street: '42 Altamount Road, Penthouse B',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400026',
      };

      // 3. Place order in order store
      const order = placeOrder({
        items,
        subtotal,
        walletDeduction,
        total,
        paymentMethod: paymentLabel,
        shippingAddress,
      });

      // 4. Update auth store wallet balances
      const testers = items.filter(i => i.type === 'tester');
      const testerCashbackEarned = testers.reduce((acc, i) => acc + (i.price * i.quantity), 0);
      if (testerCashbackEarned > 0) {
        addWalletBalance(testerCashbackEarned);
      }
      if (walletDeduction > 0) {
        deductWalletBalance(walletDeduction);
      }

      // 5. Clear cart
      clearCart();

      // 6. Complete
      setIsProcessing(false);
      onSuccess(order);
    }, 2200);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />

        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Typography variant="caption" style={styles.secureBadge}>
                <ShieldCheck size={14} color="#D4AF37" /> 256-BIT ENCRYPTED
              </Typography>
              <Typography variant="h2" weight="medium" style={{ color: '#fff', marginTop: 2 }}>
                Checkout & Pay
              </Typography>
            </View>

            <TouchableOpacity onPress={onClose} disabled={isProcessing} style={styles.closeBtn}>
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Amount Due Bar */}
          <View style={styles.amountBar}>
            <View>
              <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 1 }}>
                TOTAL PAYABLE
              </Typography>
              <Typography variant="h1" style={styles.amountText}>
                ₹{total}
              </Typography>
            </View>

            {walletDeduction > 0 && (
              <View style={styles.walletSavedBadge}>
                <Typography variant="caption" style={{ color: '#D4AF37', fontFamily: 'Inter_600SemiBold', fontSize: 11 }}>
                  -₹{walletDeduction} Wallet Applied
                </Typography>
              </View>
            )}
          </View>

          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#D4AF37" style={{ marginBottom: 24 }} />
              <Typography variant="h3" style={{ color: '#fff', textAlign: 'center', marginBottom: 8 }}>
                Processing Luxury Payment
              </Typography>
              <Typography variant="body" color="secondary" style={{ textAlign: 'center', letterSpacing: 1 }}>
                {processingStep}
              </Typography>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
              {/* Payment Methods Tabs */}
              <View style={styles.tabsRow}>
                <TouchableOpacity
                  style={[styles.tabItem, activeTab === 'upi' && styles.activeTabItem]}
                  onPress={() => setActiveTab('upi')}
                >
                  <QrCode size={18} color={activeTab === 'upi' ? '#000' : '#fff'} />
                  <Typography
                    variant="caption"
                    style={[styles.tabText, activeTab === 'upi' && styles.activeTabText]}
                  >
                    UPI
                  </Typography>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabItem, activeTab === 'card' && styles.activeTabItem]}
                  onPress={() => setActiveTab('card')}
                >
                  <CreditCard size={18} color={activeTab === 'card' ? '#000' : '#fff'} />
                  <Typography
                    variant="caption"
                    style={[styles.tabText, activeTab === 'card' && styles.activeTabText]}
                  >
                    Card
                  </Typography>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabItem, activeTab === 'netbanking' && styles.activeTabItem]}
                  onPress={() => setActiveTab('netbanking')}
                >
                  <Building2 size={18} color={activeTab === 'netbanking' ? '#000' : '#fff'} />
                  <Typography
                    variant="caption"
                    style={[styles.tabText, activeTab === 'netbanking' && styles.activeTabText]}
                  >
                    Netbanking
                  </Typography>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabItem, activeTab === 'cod' && styles.activeTabItem]}
                  onPress={() => setActiveTab('cod')}
                >
                  <Banknote size={18} color={activeTab === 'cod' ? '#000' : '#fff'} />
                  <Typography
                    variant="caption"
                    style={[styles.tabText, activeTab === 'cod' && styles.activeTabText]}
                  >
                    COD
                  </Typography>
                </TouchableOpacity>
              </View>

              {/* Tab 1: UPI */}
              {activeTab === 'upi' && (
                <View style={styles.tabSection}>
                  <Typography variant="caption" style={styles.sectionLabel}>
                    POPULAR UPI APPS
                  </Typography>

                  <View style={styles.upiGrid}>
                    {['Google Pay', 'PhonePe', 'Paytm', 'Cred UPI'].map((app) => (
                      <TouchableOpacity
                        key={app}
                        style={[
                          styles.upiAppCard,
                          selectedUpiApp === app && styles.selectedUpiCard,
                        ]}
                        onPress={() => setSelectedUpiApp(app)}
                      >
                        <Smartphone size={18} color={selectedUpiApp === app ? '#D4AF37' : '#fff'} />
                        <Typography
                          variant="body"
                          style={{ color: '#fff', fontSize: 13, marginLeft: 8 }}
                        >
                          {app}
                        </Typography>
                        {selectedUpiApp === app && (
                          <CheckCircle2 size={16} color="#D4AF37" style={{ marginLeft: 'auto' }} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  {savedUpis.length > 0 && (
                    <View style={{ marginTop: 16 }}>
                      <Typography variant="caption" style={styles.sectionLabel}>
                        SAVED UPI ID
                      </Typography>
                      {savedUpis.map((upi) => (
                        <TouchableOpacity
                          key={upi.id}
                          style={styles.savedMethodCard}
                          onPress={() => setSelectedUpiApp(upi.appLabel)}
                        >
                          <Typography variant="body" style={{ color: '#fff' }}>
                            {upi.upiId}
                          </Typography>
                          <Typography variant="caption" color="secondary">
                            {upi.appLabel}
                          </Typography>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <Typography variant="caption" style={[styles.sectionLabel, { marginTop: 16 }]}>
                    OR ENTER UPI ID
                  </Typography>
                  <View style={styles.inputBox}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. yourname@okhdfcbank"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={customUpiId}
                      onChangeText={setCustomUpiId}
                      autoCapitalize="none"
                    />
                  </View>
                </View>
              )}

              {/* Tab 2: Cards */}
              {activeTab === 'card' && (
                <View style={styles.tabSection}>
                  {savedCards.length > 0 && (
                    <View style={{ marginBottom: 16 }}>
                      <Typography variant="caption" style={styles.sectionLabel}>
                        SAVED LUXURY CARDS
                      </Typography>
                      {savedCards.map((card) => (
                        <TouchableOpacity
                          key={card.id}
                          style={[
                            styles.savedMethodCard,
                            selectedSavedCard === card.id && styles.selectedMethodCard,
                          ]}
                          onPress={() => setSelectedSavedCard(card.id)}
                        >
                          <CreditCard size={20} color={selectedSavedCard === card.id ? '#D4AF37' : '#fff'} />
                          <View style={{ marginLeft: 12, flex: 1 }}>
                            <Typography variant="body" style={{ color: '#fff', fontFamily: 'Inter_600SemiBold' }}>
                              {card.cardBrand.toUpperCase()} {card.cardNumberMasked}
                            </Typography>
                            <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.6)' }}>
                              Expires {card.expiry} • {card.cardholderName}
                            </Typography>
                          </View>
                          {selectedSavedCard === card.id && (
                            <CheckCircle2 size={18} color="#D4AF37" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <Typography variant="caption" style={styles.sectionLabel}>
                    OR ENTER NEW CARD DETAILS
                  </Typography>

                  <View style={styles.inputBox}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Card Number (XXXX XXXX XXXX XXXX)"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      keyboardType="numeric"
                      value={cardNumber}
                      onChangeText={(t) => {
                        setSelectedSavedCard(null);
                        setCardNumber(t);
                      }}
                      maxLength={19}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                    <View style={[styles.inputBox, { flex: 1 }]}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="MM / YY"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={cardExpiry}
                        onChangeText={setCardExpiry}
                        maxLength={5}
                      />
                    </View>
                    <View style={[styles.inputBox, { flex: 1 }]}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="CVV"
                        placeholderTextColor="rgba(255,255,255,0.4)"
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
                      placeholder="Cardholder Name"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={cardName}
                      onChangeText={setCardName}
                    />
                  </View>
                </View>
              )}

              {/* Tab 3: Net Banking */}
              {activeTab === 'netbanking' && (
                <View style={styles.tabSection}>
                  <Typography variant="caption" style={styles.sectionLabel}>
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
                    >
                      <Building2 size={18} color={selectedBank === bank ? '#D4AF37' : '#fff'} />
                      <Typography variant="body" style={{ color: '#fff', marginLeft: 12 }}>
                        {bank}
                      </Typography>
                      {selectedBank === bank && (
                        <CheckCircle2 size={18} color="#D4AF37" style={{ marginLeft: 'auto' }} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Tab 4: Cash on Delivery */}
              {activeTab === 'cod' && (
                <View style={styles.tabSection}>
                  <GlassCard intensity={30} style={{ padding: 20 }}>
                    <Typography variant="h3" style={{ color: '#fff', marginBottom: 8 }}>
                      Cash on Delivery Available
                    </Typography>
                    <Typography variant="body" color="secondary" style={{ lineHeight: 20 }}>
                      Pay ₹{total} seamlessly via cash or any UPI QR code presented by our Tryvia White-Glove Courier upon parcel arrival.
                    </Typography>
                  </GlassCard>
                </View>
              )}

              {/* Secure Checkout Button */}
              <View style={{ marginTop: 28, marginBottom: 20 }}>
                <PremiumButton
                  title={`Pay ₹${total} Securely`}
                  onPress={handlePay}
                  disabled={isProcessing}
                />
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F0F11',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  secureBadge: {
    color: '#D4AF37',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.5,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  amountText: {
    color: '#fff',
    fontSize: 32,
    fontFamily: 'CormorantGaramond_700Bold',
    marginTop: 2,
  },
  walletSavedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  scrollBody: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
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
    backgroundColor: '#fff',
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  activeTabText: {
    color: '#000',
    fontFamily: 'Inter_600SemiBold',
  },
  tabSection: {
    marginTop: 4,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.5,
    fontSize: 11,
    marginBottom: 12,
  },
  upiGrid: {
    gap: 10,
  },
  upiAppCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectedUpiCard: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  savedMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 10,
  },
  selectedMethodCard: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  inputBox: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  textInput: {
    color: '#fff',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  bankItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 8,
  },
  selectedBankCard: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  processingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
