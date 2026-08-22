import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Typography } from '../../src/components/ui/Typography';
import { SkincareTubeIcon, LipstickIcon, PerfumeBottleIcon, GiftSetIcon } from '../../src/components/ui/CategoryIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import { Image } from 'expo-image';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const CATEGORIES = [
  { 
    id: '1', 
    name: 'Skincare', 
    count: '48 products', 
    Icon: SkincareTubeIcon,
    image: require('../../assets/cat_skincare.jpg'),
  },
  { 
    id: '2', 
    name: 'Makeup', 
    count: '64 products', 
    Icon: LipstickIcon,
    image: require('../../assets/cat_makeup.jpg'),
  },
  { 
    id: '3', 
    name: 'Fragrance', 
    count: '32 products', 
    Icon: PerfumeBottleIcon,
    image: require('../../assets/cat_fragrance.jpg'),
  },
  { 
    id: '4', 
    name: 'Gift Sets', 
    count: '18 products', 
    Icon: GiftSetIcon,
    image: require('../../assets/cat_giftset.jpg'),
  },
];

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleCategoryPress = (categoryName: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({
      pathname: '/(tabs)/products',
      params: { category: categoryName },
    } as any);
  };

  return (
    <ScreenContainer>
      <View style={[styles.container, { paddingTop: insets.top > 0 ? insets.top + 6 : 16 }]}>
        {/* Header Title with Pink Underline */}
        <View style={styles.header}>
          <Typography style={styles.title}>Categories</Typography>
          <View style={styles.titleUnderline} />
          <Typography style={styles.subtitle}>Explore our curated luxury collections</Typography>
        </View>

        <ScrollView 
          contentContainerStyle={styles.listContainer} 
          showsVerticalScrollIndicator={false}
        >
          {CATEGORIES.map((cat, idx) => {
            const IconComp = cat.Icon;
            return (
              <Animated.View 
                key={cat.id} 
                entering={FadeInUp.duration(500).delay(idx * 90)}
              >
                <TouchableOpacity
                  style={styles.categoryCard}
                  activeOpacity={0.85}
                  onPress={() => handleCategoryPress(cat.name)}
                >
                  {/* Left Product Image Stage */}
                  <View style={styles.imageWrapper}>
                    <Image 
                      source={cat.image} 
                      style={styles.categoryImage} 
                      contentFit="cover"
                      transition={300}
                    />
                  </View>

                  {/* Middle Content */}
                  <View style={styles.catInfo}>
                    {/* Small Icon Badge */}
                    <View style={styles.iconCircle}>
                      <IconComp size={20} color="#1A1918" strokeWidth={1.5} />
                    </View>

                    <Typography style={styles.catName}>{cat.name}</Typography>
                    <Typography style={styles.catCount}>{cat.count}</Typography>
                  </View>

                  {/* Right Circle Arrow Button */}
                  <View style={styles.arrowCircle}>
                    <ChevronRight size={18} color="#CB6D73" strokeWidth={2} />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#FAF8F5',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 34,
    color: '#1A1918',
    letterSpacing: 0.2,
  },
  titleUnderline: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#E8A5A9',
    marginTop: 6,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 13.5,
    color: '#8E8A85',
    fontFamily: 'Inter_400Regular',
  },
  listContainer: {
    paddingBottom: 110,
    gap: 16,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ECE7E1',
    overflow: 'hidden',
    height: 136,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  imageWrapper: {
    width: 124,
    height: '100%',
    backgroundColor: '#F5F2EC',
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  catInfo: {
    flex: 1,
    paddingLeft: 18,
    justifyContent: 'center',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FAF0F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#F8D8DC',
  },
  catName: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 21,
    color: '#1A1918',
    marginBottom: 2,
  },
  catCount: {
    fontSize: 12.5,
    color: '#8E8A85',
    fontFamily: 'Inter_400Regular',
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAF0F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
});
