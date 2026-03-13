import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function OffersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const OFFERS = [
    { code: 'FIRST20', title: '20% off your first order', desc: 'Valid for new users only. Min. order ₹299.', expiry: 'Expires Mar 31, 2026' },
    { code: 'HEALTH50', title: '₹50 off subscription', desc: 'On your first subscription plan purchase.', expiry: 'Expires Apr 15, 2026' },
    { code: 'SUMMER', title: 'Free delivery this week', desc: 'No minimum order required.', expiry: 'Expires Mar 17, 2026' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offers & Coupons</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {OFFERS.map((offer, idx) => (
          <View key={idx} style={styles.offerCard}>
            <LinearGradient
              colors={['#D1FADF', '#ECFDF5']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.offerLeft}
            >
              <Ionicons name="pricetag" size={24} color="#2C921D" />
              <Text style={styles.offerCode}>{offer.code}</Text>
            </LinearGradient>
            <View style={styles.offerRight}>
              <Text style={styles.offerTitle}>{offer.title}</Text>
              <Text style={styles.offerDesc}>{offer.desc}</Text>
              <View style={styles.offerExpiryRow}>
                <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                <Text style={styles.offerExpiryText}>{offer.expiry}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 20, paddingBottom: 16 
  },
  backCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center'
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111' },
  
  scrollContent: { padding: 20 },
  offerCard: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  offerLeft: {
    width: 90, justifyContent: 'center', alignItems: 'center', padding: 16,
  },
  offerCode: { fontSize: 12, fontWeight: '800', color: '#2C921D', marginTop: 8, textAlign: 'center' },
  offerRight: { flex: 1, padding: 16, justifyContent: 'center' },
  offerTitle: { fontSize: 16, fontWeight: '600', color: '#111', marginBottom: 4 },
  offerDesc: { fontSize: 13, color: '#6B7280', marginBottom: 12, lineHeight: 18 },
  offerExpiryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  offerExpiryText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
});
