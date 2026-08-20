import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Star } from 'lucide-react-native';
import { Typography } from '../../src/components/ui/Typography';
import { PremiumButton } from '../../src/components/ui/PremiumButton';
import { theme } from '../../src/theme/theme';

import { useAuthStore } from '../../src/store/useAuthStore';

export default function ReviewScreen() {
  const { id } = useLocalSearchParams();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    // Mock submit review logic
    useAuthStore.getState().addStars(50);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <Star size={64} color="#D4AF37" fill="#D4AF37" style={{ marginBottom: 24 }} />
        <Typography variant="h2" weight="bold" style={{ marginBottom: 8 }}>Review Submitted!</Typography>
        <Typography variant="body" color="secondary" align="center" style={{ marginBottom: 32, paddingHorizontal: 32 }}>
          Thank you for your feedback. You have earned 50 Tryvia Stars!
        </Typography>
        <PremiumButton title="Back to Orders" onPress={() => router.back()} style={{ width: 200 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Typography variant="h3" weight="bold">Leave a Review</Typography>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <Typography variant="body" color="secondary" style={{ marginBottom: 24 }}>
          How was your experience with Order #{id}? Share your thoughts to earn Tryvia Stars.
        </Typography>

        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Star 
                size={40} 
                color={star <= rating ? "#D4AF37" : "#E5E5E5"} 
                fill={star <= rating ? "#D4AF37" : "transparent"} 
                style={{ marginHorizontal: 8 }}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Typography variant="h3" style={{ marginBottom: 12 }}>Your Review</Typography>
        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={6}
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
          style={{ marginTop: 24 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  textInput: {
    backgroundColor: '#FAFAF8',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    fontFamily: 'Inter_400Regular',
  }
});
