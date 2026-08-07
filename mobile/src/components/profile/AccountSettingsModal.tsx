import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Typography } from '../ui/Typography';
import { PremiumButton } from '../ui/PremiumButton';
import { useAuthStore } from '../../store/useAuthStore';
import {
  X,
  CheckCircle2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme/theme';

interface AccountSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const { user, updateProfile } = useAuthStore();

  const [fullName, setFullName] = useState(user?.fullName || 'Venkatesh S');
  const [email, setEmail] = useState(user?.email || 'venkatesh@tryvia.luxury');
  const [phone, setPhone] = useState(user?.phone || '+91 98401 23456');

  // Address
  const [street, setStreet] = useState(user?.address?.street || '42 Altamount Road, Penthouse B');
  const [city, setCity] = useState(user?.address?.city || 'Mumbai');
  const [state, setState] = useState(user?.address?.state || 'Maharashtra');
  const [pincode, setPincode] = useState(user?.address?.pincode || '400026');

  // Preferences
  const [whatsappUpdates, setWhatsappUpdates] = useState(user?.preferences?.whatsappUpdates ?? true);
  const [exclusiveInvites, setExclusiveInvites] = useState(user?.preferences?.exclusiveInvites ?? true);
  const [biometrics, setBiometrics] = useState(user?.preferences?.biometrics ?? false);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    updateProfile({
      fullName,
      email,
      phone,
      address: {
        fullName,
        street,
        city,
        state,
        pincode,
        phone,
      },
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
                PREFERENCES & IDENTITY
              </Typography>
              <Typography variant="h2" weight="medium" style={styles.title}>
                Account Settings
              </Typography>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
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
                  placeholder="Your Full Name"
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
                  placeholder="Your Email"
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
                  placeholder="Your Phone Number"
                  placeholderTextColor="rgba(0,0,0,0.35)"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Shipping Address */}
            <Typography variant="caption" color="secondary" style={[styles.sectionTitle, { marginTop: 24 }]}>
              DEFAULT SHIPPING ADDRESS
            </Typography>

            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Typography variant="caption" color="secondary" style={styles.inputLabel}>
                  STREET / APARTMENT / SUITE
                </Typography>
                <TextInput
                  style={styles.textInput}
                  value={street}
                  onChangeText={setStreet}
                  placeholder="Street Address"
                  placeholderTextColor="rgba(0,0,0,0.35)"
                />
              </View>

              <View style={styles.inputDivider} />

              <View style={{ flexDirection: 'row' }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Typography variant="caption" color="secondary" style={styles.inputLabel}>
                    CITY
                  </Typography>
                  <TextInput
                    style={styles.textInput}
                    value={city}
                    onChangeText={setCity}
                    placeholder="City"
                    placeholderTextColor="rgba(0,0,0,0.35)"
                  />
                </View>

                <View style={{ width: 1, backgroundColor: 'rgba(0,0,0,0.06)' }} />

                <View style={[styles.inputGroup, { flex: 1, paddingLeft: 16 }]}>
                  <Typography variant="caption" color="secondary" style={styles.inputLabel}>
                    PINCODE
                  </Typography>
                  <TextInput
                    style={styles.textInput}
                    value={pincode}
                    onChangeText={setPincode}
                    placeholder="PIN Code"
                    placeholderTextColor="rgba(0,0,0,0.35)"
                    keyboardType="numeric"
                    maxLength={6}
                  />
                </View>
              </View>

              <View style={styles.inputDivider} />

              <View style={styles.inputGroup}>
                <Typography variant="caption" color="secondary" style={styles.inputLabel}>
                  STATE / PROVINCE
                </Typography>
                <TextInput
                  style={styles.textInput}
                  value={state}
                  onChangeText={setState}
                  placeholder="State"
                  placeholderTextColor="rgba(0,0,0,0.35)"
                />
              </View>
            </View>

            {/* Preferences */}
            <Typography variant="caption" color="secondary" style={[styles.sectionTitle, { marginTop: 24 }]}>
              PRIVILEGES & NOTIFICATIONS
            </Typography>

            <View style={styles.card}>
              <View style={styles.preferenceRow}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Typography variant="body" weight="medium" style={{ color: theme.colors.text.primary }}>
                    WhatsApp Dispatch Updates
                  </Typography>
                  <Typography variant="caption" color="secondary" style={{ marginTop: 2 }}>
                    Real-time courier alerts directly to your verified phone.
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
    paddingVertical: 4,
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
