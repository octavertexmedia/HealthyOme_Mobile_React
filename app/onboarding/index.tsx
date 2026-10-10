import React, { useRef, useState } from 'react';
import { 
  View, Text, StyleSheet, Dimensions, Image, TouchableOpacity, FlatList 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Healthy food,\nbetter lifestyle',
    desc: 'Build healthier habits with fresh, nutritious meals - made to fit your everyday life.',
    image: require('../../assets/images/salad-img.webp'),
  },
  {
    id: '2',
    title: 'Fresh food.\nThoughtfully delivered.',
    desc: 'We operate in select areas to ensure maximum freshness, quality, and sustainability.',
    image: require('../../assets/images/hero-img.webp'),
  },
  {
    id: '3',
    title: 'Quick Meals or\nSubscriptions',
    desc: 'Order for today or plan your entire week with our flexible subscriptions.',
    image: require('../../assets/images/high-protien.webp'),
  }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      router.replace('/onboarding/location');
    }
  };

  const handleSkip = () => {
    router.replace('/onboarding/location');
  };

  const renderItem = ({ item, index }: { item: typeof SLIDES[0], index: number }) => {
    // Top background curve using a massive circle
    return (
      <View style={[styles.slide, { width }]}>
        <View style={styles.imageWrapper}>
          <Image source={item.image} style={styles.image} resizeMode="cover" />
          <View style={styles.curveOverlay} />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.desc}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      {/* Skip Button */}
      {currentIndex < SLIDES.length - 1 && (
        <TouchableOpacity 
          style={[styles.skipButton, { top: Math.max(insets.top, 20) + 12 }]} 
          onPress={handleSkip}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Bottom Section */}
      <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        {/* Pagination Dots */}
        <View style={styles.paginationRow}>
          {SLIDES.map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.dot, 
                currentIndex === index ? styles.dotActive : styles.dotInactive
              ]} 
            />
          ))}
        </View>

        {/* Next / Get Started Button */}
        <TouchableOpacity style={styles.actionButton} onPress={handleNext}>
          <Text style={styles.actionButtonText}>
            {currentIndex === SLIDES.length - 1 ? 'Get started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    overflow: 'hidden',
  },
  imageWrapper: {
    width: width,
    height: height * 0.55,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f1f1f1',
    borderBottomLeftRadius: width * 2,
    borderBottomRightRadius: width * 2,
    transform: [{ scaleX: 1.5 }],
  },
  image: {
    width: width,
    height: '100%',
    alignSelf: 'center',
    transform: [{ scaleX: 1 / 1.5 }],
  },
  curveOverlay: {
    position: 'absolute',
    width: width,
    height: '100%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    transform: [{ scaleX: 1 / 1.5 }],
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: -20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  skipButton: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#2C921D',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  skipText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#111',
    width: 20,
  },
  dotInactive: {
    backgroundColor: '#D1D5DB',
  },
  actionButton: {
    width: '100%',
    backgroundColor: '#2C921D',
    height: 56,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
