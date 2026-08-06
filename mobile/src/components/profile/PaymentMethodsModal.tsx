import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Typography } from '../ui/Typography';
import { GlassCard } from '../ui/GlassCard';
import { PremiumButton } from '../ui/PremiumButton';
import { usePaymentMethodsStore, SavedCard, SavedUpi } from '../../store/usePaymentMethodsStore';
import {
  X,
  CreditCard,
  Plus,
  Trash2,
  CheckCircle,
  Smartphone,
  Shield,
  Star,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface PaymentMethodsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PaymentMethodsModal: React.FC<PaymentMethodsModalProps> = ({
  visible,
  onClose,
}) => {
  const { methods, addCard, addUpi, removeMethod, setDefaultMethod } = usePaymentMethodsStore();

  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isAddingUpi, setIsAddingUpi] = useState(false);

  // New card form state
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardName, setNewCardName] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');
  const [newCardBrand, setNewCardBrand] = useState<'visa' | 'mastercard' | 'amex'>('visa');

  // New UPI form state
  const [newUpiId, setNewUpiId] = useState('');
  const [newUpiApp, setNewUpiApp] = useState('Google Pay');

  const handleSaveCard = () => {
    if (!newCardNumber || !newCardExpiry) return;
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const last4 = newCardNumber.slice(-4) || '1234';
    addCard({
      cardholderName: newCardName || 'Luxury Member',
      cardNumberMasked: `•••• ${last4}`,
      expiry: newCardExpiry,
      cardBrand: newCardBrand,
      isDefault: methods.length === 0,
    });
    setNewCardNumber('');
    setNewCardName('');
    setNewCardExpiry('');
    setIsAddingCard(false);
  };

  const handleSaveUpi = () => {
    if (!newUpiId) return;
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    addUpi({
      upiId: newUpiId,
      appLabel: newUpiApp,
      isDefault: methods.length === 0,
    });
    setNewUpiId('');
    setIsAddingUpi(false);
  };

  const cards = methods.filter((m): m is SavedCard => m.type === 'card');
  const upis = methods.filter((m): m is SavedUpi => m.type === 'upi');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Typography variant="caption" style={styles.subHeader}>
                SECURE WALLET
              </Typography>
              <Typography variant="h2" weight="medium" style={{ color: '#fff', marginTop: 2 }}>
                Payment Methods
              </Typography>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Cards Section */}
            <View style={styles.sectionHeaderRow}>
              <Typography variant="caption" style={styles.sectionTitle}>
                SAVED CARDS ({cards.length})
              </Typography>
              {!isAddingCard && (
                <TouchableOpacity
                  style={styles.addSmallBtn}
                  onPress={() => {
                    setIsAddingCard(true);
                    setIsAddingUpi(false);
                  }}
                >
                  <Plus size={14} color="#D4AF37" />
                  <Typography variant="caption" style={{ color: '#D4AF37', marginLeft: 4, fontFamily: 'Inter_600SemiBold' }}>
                    Add Card
                  </Typography>
                </TouchableOpacity>
              )}
            </View>

            {/* Add Card Form */}
            {isAddingCard && (
              <GlassCard intensity={35} style={styles.addFormCard}>
                <Typography variant="h3" style={{ color: '#fff', marginBottom: 12 }}>
                  Add Luxury Card
                </Typography>

                {/* Brand Selector */}
                <View style={styles.brandRow}>
                  {(['visa', 'mastercard', 'amex'] as const).map((brand) => (
                    <TouchableOpacity
                      key={brand}
                      style={[styles.brandChip, newCardBrand === brand && styles.selectedBrandChip]}
                      onPress={() => setNewCardBrand(brand)}
                    >
                      <Typography
                        variant="caption"
                        style={[
                          { color: 'rgba(255,255,255,0.7)' },
                          newCardBrand === brand && { color: '#000', fontFamily: 'Inter_600SemiBold' },
                        ]}
                      >
                        {brand.toUpperCase()}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Card Number"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    keyboardType="numeric"
                    value={newCardNumber}
                    onChangeText={setNewCardNumber}
                    maxLength={19}
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <View style={[styles.inputBox, { flex: 1 }]}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="MM / YY"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={newCardExpiry}
                      onChangeText={setNewCardExpiry}
                      maxLength={5}
                    />
                  </View>
                  <View style={[styles.inputBox, { flex: 2 }]}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Name on Card"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={newCardName}
                      onChangeText={setNewCardName}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                  <TouchableOpacity
                    style={[styles.formBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                    onPress={() => setIsAddingCard(false)}
                  >
                    <Typography variant="body" style={{ color: '#fff' }}>Cancel</Typography>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.formBtn, { backgroundColor: '#fff', flex: 2 }]}
                    onPress={handleSaveCard}
                  >
                    <Typography variant="body" weight="bold" style={{ color: '#000' }}>Save Card</Typography>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            )}

            {/* List of Cards */}
            {cards.map((card) => (
              <GlassCard key={card.id} intensity={25} style={styles.methodCard}>
                <View style={styles.cardTopRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <CreditCard size={22} color="#D4AF37" strokeWidth={1.5} />
                    <Typography variant="h3" style={{ color: '#fff', marginLeft: 12, fontSize: 18 }}>
                      {card.cardBrand.toUpperCase()} {card.cardNumberMasked}
                    </Typography>
                  </View>

                  {card.isDefault ? (
                    <View style={styles.defaultBadge}>
                      <Typography variant="caption" style={{ color: '#D4AF37', fontFamily: 'Inter_600SemiBold', fontSize: 10 }}>
                        DEFAULT
                      </Typography>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => setDefaultMethod(card.id)}>
                      <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        Make Default
                      </Typography>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.cardBottomRow}>
                  <Typography variant="caption" color="secondary">
                    {card.cardholderName} • Expires {card.expiry}
                  </Typography>

                  <TouchableOpacity onPress={() => removeMethod(card.id)} style={{ padding: 4 }}>
                    <Trash2 size={16} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                </View>
              </GlassCard>
            ))}

            {/* UPI Section */}
            <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
              <Typography variant="caption" style={styles.sectionTitle}>
                SAVED UPI IDS ({upis.length})
              </Typography>
              {!isAddingUpi && (
                <TouchableOpacity
                  style={styles.addSmallBtn}
                  onPress={() => {
                    setIsAddingUpi(true);
                    setIsAddingCard(false);
                  }}
                >
                  <Plus size={14} color="#D4AF37" />
                  <Typography variant="caption" style={{ color: '#D4AF37', marginLeft: 4, fontFamily: 'Inter_600SemiBold' }}>
                    Add UPI
                  </Typography>
                </TouchableOpacity>
              )}
            </View>

            {/* Add UPI Form */}
            {isAddingUpi && (
              <GlassCard intensity={35} style={styles.addFormCard}>
                <Typography variant="h3" style={{ color: '#fff', marginBottom: 12 }}>
                  Add UPI Handle
                </Typography>

                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. yourname@okhdfcbank"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={newUpiId}
                    onChangeText={setNewUpiId}
                    autoCapitalize="none"
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                  <TouchableOpacity
                    style={[styles.formBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                    onPress={() => setIsAddingUpi(false)}
                  >
                    <Typography variant="body" style={{ color: '#fff' }}>Cancel</Typography>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.formBtn, { backgroundColor: '#fff', flex: 2 }]}
                    onPress={handleSaveUpi}
                  >
                    <Typography variant="body" weight="bold" style={{ color: '#000' }}>Save UPI</Typography>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            )}

            {/* List of UPIs */}
            {upis.map((upi) => (
              <GlassCard key={upi.id} intensity={25} style={styles.methodCard}>
                <View style={styles.cardTopRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Smartphone size={20} color="#D4AF37" />
                    <Typography variant="body" weight="medium" style={{ color: '#fff', marginLeft: 12 }}>
                      {upi.upiId}
                    </Typography>
                  </View>

                  <TouchableOpacity onPress={() => removeMethod(upi.id)} style={{ padding: 4 }}>
                    <Trash2 size={16} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                </View>
              </GlassCard>
            ))}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#0F0F11',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  subHeader: {
    color: '#D4AF37',
    fontSize: 11,
    letterSpacing: 2,
    fontFamily: 'Inter_600SemiBold',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.5,
    fontSize: 11,
  },
  addSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  methodCard: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  addFormCard: {
    padding: 18,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  brandRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  brandChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  selectedBrandChip: {
    backgroundColor: '#fff',
  },
  inputBox: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  textInput: {
    color: '#fff',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  formBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
