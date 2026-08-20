import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft, Star } from 'lucide-react-native';
import { Typography } from '../../src/components/ui/Typography';
import { PremiumButton } from '../../src/components/ui/PremiumButton';
import { theme } from '../../src/theme/theme';
import { useAuthStore } from '../../src/store/useAuthStore';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { useResponsive } from '../../src/hooks/useResponsive';

export default function ReviewScreen() {
  const { id } = useLocalSearchParams();
  const { safeTopPadding, insets, isSmallDevice } = useResponsive();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    useAuthStore.getState().addStars(50);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <ScreenContainer showOrbs={false}>
        <View style={[styles.centerContainer, { paddingTop: safeTopPadding, paddingBottom: insets.bottom + 20 }]}>
          <Star size={56} color="#D4AF37" fill="#D4AF37" style={{ marginBottom: 20 }} />
          <Typography variant="h2" weight="bold" style={{ marginBottom: 8 }}>Review Submitted!</Typography>
          <Typography variant="body" color="secondary" align="center" style={{ marginBottom: 28, paddingHorizontal: 24, lineHeight: 20 }}>
            Thank you for your feedback. You have earned 50 Tryvia Stars!
          </Typography>
          <PremiumButton title="Back to Orders" onPress={() => router.back()} style={{ minWidth: 180 }} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer showOrbs={false}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, { paddingTop: safeTopPadding }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
            <ChevronLeft size={22} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Typography variant="h3" weight="bold">Leave a Review</Typography>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          style={styles.content} 
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Typography variant="body" color="secondary" style={{ marginBottom: 20, lineHeight: 20 }}>
            How was your experience with Order #{id}? Share your thoughts to earn Tryvia Stars.
          </Typography>

          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)} hitSlop={8}>
                <Star 
                  size={isSmallDevice ? 32 : 38} 
                  color={star <= rating ? "#D4AF37" : "#D1D5DB"} 
                  fill={star <= rating ? "#D4AF37" : "transparent"} 
                  style={{ marginHorizontal: isSmallDevice ? 4 : 6 }}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Typography variant="h3" style={{ marginBottom: 10 }}>Your Review</Typography>
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={5}
            placeholder="Write your experience here..."
            placeholderTextColor="#999"
            value={review}
            onChangeText={setReview}
            textAlignVertical="top"
          />

          <PremiumButton 
            title="Submit & Earn Stars" 
            onPress={handleSubmit} 
            disabled={rating === 0}
            style={{ marginTop: 20 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 28,
  },
  textInput: {
    backgroundColor: '#FAFAF8',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    minHeight: 110,
    fontFamily: 'Inter_400Regular',
    color: theme.colors.text.primary,
  }
});

