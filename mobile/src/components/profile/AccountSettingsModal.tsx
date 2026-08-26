import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Typography } from '../ui/Typography';
import { PremiumButton } from '../ui/PremiumButton';
import { useAuthStore } from '../../store/useAuthStore';
import {
  X,
  CheckCircle2,
  MapPin,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AccountSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { user, updateProfile } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Address fields - empty by default for user to fill
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Preferences
  const [whatsappUpdates, setWhatsappUpdates] = useState(true);
  const [exclusiveInvites, setExclusiveInvites] = useState(true);
  const [biometrics, setBiometrics] = useState(false);

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state whenever modal opens with current user profile
  useEffect(() => {
    if (visible && user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setStreet(user.address?.street || '');
      setCity(user.address?.city || '');
      setState(user.address?.state || '');
      setPincode(user.address?.pincode || '');
      setWhatsappUpdates(user.preferences?.whatsappUpdates ?? true);
      setExclusiveInvites(user.preferences?.exclusiveInvites ?? true);
      setBiometrics(user.preferences?.biometrics ?? false);
    }
  }, [visible, user]);

  const handleSave = () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const hasAddress = street.trim() || city.trim() || pincode.trim();

    updateProfile({
      fullName: fullName.trim() || user?.fullName || 'Member',
      email: email.trim() || user?.email || '',
      phone: phone.trim(),
      address: hasAddress ? {
        fullName: fullName.trim() || user?.fullName || 'Member',
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        phone: phone.trim(),
      } : null,
      preferences: {
        whatsappUpdates,
        exclusiveInvites,
        biometrics,
      },
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const isAddressFilled = user?.address && (user.address.street || user.address.city);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        >
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill as any} />
        </TouchableOpacity>

        <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Typography variant="caption" weight="bold" style={styles.subHeader}>
                PREFERENCES & IDENTITY
              </Typography>
              <Typography variant="h2" weight="medium" style={styles.title}>
                Account Settings
              </Typography>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7} hitSlop={8}>
              <X size={18} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollBody}
            keyboardShouldPersistTaps="handled"
          >
            {/* Personal Details */}
            <Typography variant="caption" color="secondary" style={styles.sectionTitle}>
              PERSONAL INFORMATION
            </Typography>

            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Typography variant="caption" color="secondary" style={styles.inputLabel}>
                  FULL NAME
                </Typography>
                <TextInput
                  style={styles.textInput}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="e.g. Christian Dior"
                  placeholderTextColor="rgba(0,0,0,0.35)"
                />
              </View>

              <View style={styles.inputDivider} />

              <View style={styles.inputGroup}>
                <Typography variant="caption" color="secondary" style={styles.inputLabel}>
                  EMAIL ADDRESS
                </Typography>
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  placeholderTextColor="rgba(0,0,0,0.35)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputDivider} />

              <View style={styles.inputGroup}>
                <Typography variant="caption" color="secondary" style={styles.inputLabel}>
                  PHONE NUMBER
                </Typography>
                <TextInput
                  style={styles.textInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+91 98765 43210"
                  placeholderTextColor="rgba(0,0,0,0.35)"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Delivery Address */}
            <View style={styles.addressHeaderRow}>
              <Typography variant="caption" color="secondary" style={styles.sectionTitle}>
                DEFAULT DELIVERY ADDRESS
              </Typography>
              {!isAddressFilled && (
                <View style={styles.notSetBadge}>
                  <MapPin size={11} color="#CB6D73" />
                  <Typography style={styles.notSetBadgeText}>Not set yet</Typography>
                </View>
              )}
            </View>

            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Typography variant="caption" color="secondary" style={styles.inputLabel}>
                  STREET / APARTMENT / SUITE
                </Typography>
                <TextInput
                  style={styles.textInput}
                  value={street}
                  onChangeText={setStreet}
                  placeholder="Enter house, flat number, street name"
                  placeholderTextColor="rgba(0,0,0,0.35)"
                />
              </View>

              <View style={styles.inputDivider} />

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Typography variant="caption" color="secondary" style={styles.inputLabel}>
                    CITY
                  </Typography>
                  <TextInput
                    style={styles.textInput}
                    value={city}
                    onChangeText={setCity}
                    placeholder="e.g. Mumbai"
                    placeholderTextColor="rgba(0,0,0,0.35)"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Typography variant="caption" color="secondary" style={styles.inputLabel}>
                    PINCODE
                  </Typography>
                  <TextInput
                    style={styles.textInput}
                    value={pincode}
                    onChangeText={setPincode}
                    placeholder="e.g. 400001"
                    placeholderTextColor="rgba(0,0,0,0.35)"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputDivider} />

              <View style={styles.inputGroup}>
                <Typography variant="caption" color="secondary" style={styles.inputLabel}>
                  STATE
                </Typography>
                <TextInput
                  style={styles.textInput}
                  value={state}
                  onChangeText={setState}
                  placeholder="e.g. Maharashtra"
                  placeholderTextColor="rgba(0,0,0,0.35)"
                />
              </View>
            </View>

            {/* VIP & App Preferences */}
            <Typography variant="caption" color="secondary" style={[styles.sectionTitle, { marginTop: 24 }]}>
              VIP PRIVILEGES & ALERTS
            </Typography>

            <View style={styles.card}>
              <View style={styles.preferenceRow}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Typography variant="body" weight="medium" style={{ color: theme.colors.text.primary }}>
                    WhatsApp Concierge Updates
                  </Typography>
                  <Typography variant="caption" color="secondary" style={{ marginTop: 2 }}>
                    Receive private order tracking and release dispatch alerts.
                  </Typography>
                </View>
                <Switch
                  value={whatsappUpdates}
                  onValueChange={setWhatsappUpdates}
                  trackColor={{ false: 'rgba(0,0,0,0.1)', true: '#121212' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.inputDivider} />

              <View style={styles.preferenceRow}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Typography variant="body" weight="medium" style={{ color: theme.colors.text.primary }}>
                    VIP Pre-Launch Access
                  </Typography>
                  <Typography variant="caption" color="secondary" style={{ marginTop: 2 }}>
                    Early reservations for limited-edition fragrance drops.
                  </Typography>
                </View>
                <Switch
                  value={exclusiveInvites}
                  onValueChange={setExclusiveInvites}
                  trackColor={{ false: 'rgba(0,0,0,0.1)', true: '#121212' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.inputDivider} />

              <View style={styles.preferenceRow}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Typography variant="body" weight="medium" style={{ color: theme.colors.text.primary }}>
                    Biometric Sign-in
                  </Typography>
                  <Typography variant="caption" color="secondary" style={{ marginTop: 2 }}>
                    Fast biometric authentication for frictionless checkout.
                  </Typography>
                </View>
                <Switch
                  value={biometrics}
                  onValueChange={setBiometrics}
                  trackColor={{ false: 'rgba(0,0,0,0.1)', true: '#121212' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Save Button */}
            <View style={{ marginTop: 28, marginBottom: 20 }}>
              {savedSuccess ? (
                <View style={styles.successPill}>
                  <CheckCircle2 size={18} color="#16A34A" />
                  <Typography variant="body" weight="bold" style={{ color: '#16A34A', marginLeft: 8 }}>
                    Settings Saved Successfully
                  </Typography>
                </View>
              ) : (
                <PremiumButton
                  title="Save Profile Changes"
                  onPress={handleSave}
                  variant="primary"
                />
              )}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
    color: '#CB6D73',
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
  addressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 6,
  },
  notSetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF0F1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  notSetBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: '#CB6D73',
  },
  sectionTitle: {
    letterSpacing: 1.5,
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 10,
  },
  card: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FAFAF8',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  inputGroup: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 9,
    letterSpacing: 1,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  textInput: {
    color: theme.colors.text.primary,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    paddingVertical: Platform.OS === 'ios' ? 4 : 2,
  },
  inputDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginVertical: 10,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  successPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.25)',
  },
});
