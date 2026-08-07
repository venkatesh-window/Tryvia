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
import { usePaymentMethodsStore, SavedCard, SavedUpi } from '../../store/usePaymentMethodsStore';
import {
  X,
  CreditCard,
  Plus,
  Trash2,
  Smartphone,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme/theme';

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
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        >
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill as any} />
        </TouchableOpacity>

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Typography variant="caption" weight="bold" style={styles.subHeader}>
                SECURE WALLET
              </Typography>
              <Typography variant="h2" weight="medium" style={styles.title}>
                Payment Methods
              </Typography>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Cards Section */}
            <View style={styles.sectionHeaderRow}>
              <Typography variant="caption" color="secondary" style={styles.sectionTitle}>
                SAVED CARDS ({cards.length})
              </Typography>
              {!isAddingCard && (
                <TouchableOpacity
                  style={styles.addSmallBtn}
                  onPress={() => {
                    setIsAddingCard(true);
                    setIsAddingUpi(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Plus size={13} color="#B8860B" />
                  <Typography variant="caption" weight="bold" style={{ color: '#B8860B', marginLeft: 4 }}>
                    Add Card
                  </Typography>
                </TouchableOpacity>
              )}
            </View>

            {/* Add Card Form */}
            {isAddingCard && (
              <View style={styles.addFormCard}>
                <Typography variant="h3" weight="medium" style={{ color: theme.colors.text.primary, marginBottom: 12 }}>
                  Add Luxury Card
                </Typography>

                {/* Brand Selector */}
                <View style={styles.brandRow}>
                  {(['visa', 'mastercard', 'amex'] as const).map((brand) => (
                    <TouchableOpacity
                      key={brand}
                      style={[styles.brandChip, newCardBrand === brand && styles.selectedBrandChip]}
                      onPress={() => setNewCardBrand(brand)}
                      activeOpacity={0.7}
                    >
                      <Typography
                        variant="caption"
                        style={[
                          { color: '#666666' },
                          newCardBrand === brand && { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' },
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
                    placeholderTextColor="rgba(0,0,0,0.35)"
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
                      placeholderTextColor="rgba(0,0,0,0.35)"
                      value={newCardExpiry}
                      onChangeText={setNewCardExpiry}
                      maxLength={5}
                    />
                  </View>
                  <View style={[styles.inputBox, { flex: 2 }]}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Name on Card"
                      placeholderTextColor="rgba(0,0,0,0.35)"
                      value={newCardName}
                      onChangeText={setNewCardName}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                  <TouchableOpacity
                    style={[styles.formBtn, { backgroundColor: 'rgba(0,0,0,0.04)' }]}
                    onPress={() => setIsAddingCard(false)}
                    activeOpacity={0.7}
                  >
                    <Typography variant="body" weight="medium" style={{ color: theme.colors.text.primary }}>Cancel</Typography>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.formBtn, { backgroundColor: '#121212', flex: 2 }]}
                    onPress={handleSaveCard}
                    activeOpacity={0.8}
                  >
                    <Typography variant="body" weight="bold" style={{ color: '#FFFFFF' }}>Save Card</Typography>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* List of Cards */}
            {cards.map((card) => (
              <View key={card.id} style={styles.methodCard}>
                <View style={styles.cardTopRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <CreditCard size={20} color="#B8860B" strokeWidth={1.5} />
                    <Typography variant="body" weight="semibold" style={{ color: theme.colors.text.primary, marginLeft: 10, fontSize: 15 }}>
                      {card.cardBrand.toUpperCase()} {card.cardNumberMasked}
                    </Typography>
                  </View>

                  {card.isDefault ? (
                    <View style={styles.defaultBadge}>
                      <Typography variant="caption" weight="bold" style={{ color: '#B8860B', fontSize: 10 }}>
                        DEFAULT
                      </Typography>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => setDefaultMethod(card.id)} activeOpacity={0.7}>
                      <Typography variant="caption" color="secondary" style={{ textDecorationLine: 'underline' }}>
                        Make Default
                      </Typography>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.cardBottomRow}>
                  <Typography variant="caption" color="secondary">
                    {card.cardholderName} • Expires {card.expiry}
                  </Typography>

                  <TouchableOpacity onPress={() => removeMethod(card.id)} style={{ padding: 4 }} activeOpacity={0.7}>
                    <Trash2 size={15} color={theme.colors.text.secondary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* UPI Section */}
            <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
              <Typography variant="caption" color="secondary" style={styles.sectionTitle}>
                SAVED UPI IDS ({upis.length})
              </Typography>
              {!isAddingUpi && (
                <TouchableOpacity
                  style={styles.addSmallBtn}
                  onPress={() => {
                    setIsAddingUpi(true);
                    setIsAddingCard(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Plus size={13} color="#B8860B" />
                  <Typography variant="caption" weight="bold" style={{ color: '#B8860B', marginLeft: 4 }}>
                    Add UPI
                  </Typography>
                </TouchableOpacity>
              )}
            </View>

            {/* Add UPI Form */}
            {isAddingUpi && (
              <View style={styles.addFormCard}>
                <Typography variant="h3" weight="medium" style={{ color: theme.colors.text.primary, marginBottom: 12 }}>
                  Add UPI Handle
                </Typography>

                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. yourname@okhdfcbank"
                    placeholderTextColor="rgba(0,0,0,0.35)"
                    value={newUpiId}
                    onChangeText={setNewUpiId}
                    autoCapitalize="none"
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                  <TouchableOpacity
                    style={[styles.formBtn, { backgroundColor: 'rgba(0,0,0,0.04)' }]}
                    onPress={() => setIsAddingUpi(false)}
                    activeOpacity={0.7}
                  >
                    <Typography variant="body" weight="medium" style={{ color: theme.colors.text.primary }}>Cancel</Typography>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.formBtn, { backgroundColor: '#121212', flex: 2 }]}
                    onPress={handleSaveUpi}
                    activeOpacity={0.8}
                  >
                    <Typography variant="body" weight="bold" style={{ color: '#FFFFFF' }}>Save UPI</Typography>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* List of UPIs */}
            {upis.map((upi) => (
              <View key={upi.id} style={styles.methodCard}>
                <View style={styles.cardTopRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Smartphone size={18} color="#B8860B" />
                    <Typography variant="body" weight="medium" style={{ color: theme.colors.text.primary, marginLeft: 10 }}>
                      {upi.upiId}
                    </Typography>
                  </View>

                  <TouchableOpacity onPress={() => removeMethod(upi.id)} style={{ padding: 4 }} activeOpacity={0.7}>
                    <Trash2 size={15} color={theme.colors.text.secondary} />
                  </TouchableOpacity>
                </View>
              </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  subHeader: {
    color: '#B8860B',
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 2,
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
  scrollBody: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    letterSpacing: 1.5,
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
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
    backgroundColor: '#FAFAF8',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    marginBottom: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  addFormCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FAFAF8',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    marginBottom: 16,
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
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  selectedBrandChip: {
    backgroundColor: '#121212',
  },
  inputBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  textInput: {
    color: theme.colors.text.primary,
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
