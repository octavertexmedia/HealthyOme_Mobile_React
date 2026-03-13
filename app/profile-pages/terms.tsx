import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TermsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const SECTIONS = [
    { title: '1. Acceptance of Terms', body: 'By using Healthy-O-Me services, you confirm you have read and agree to be bound by these Terms and Conditions. If you do not agree, please do not use our service.' },
    { title: '2. Service Description', body: 'Healthy-O-Me provides fresh, nutritionist-approved meal delivery services including subscription plans, à la carte orders, and dietician consultations.' },
    { title: '3. Order & Delivery Policy', body: 'Orders are confirmed only after payment. Delivery timelines are estimates. Healthy-O-Me is not liable for delays due to traffic, weather, or other factors beyond our control.' },
    { title: '4. Cancellation Policy', body: 'Subscriptions may be paused or cancelled at any time. Refunds for active subscription cycles are pro-rated and processed within 5–7 business days.' },
    { title: '5. Privacy', body: 'Your data is collected and processed in accordance with our Privacy Policy. We do not sell personal information to third parties.' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last updated: March 2026</Text>
        
        {SECTIONS.map((section, idx) => (
          <View key={idx} style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
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
  
  scrollContent: { padding: 24, paddingBottom: 100 },
  lastUpdated: { fontSize: 13, color: '#9CA3AF', marginBottom: 24 },
  sectionBlock: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 8 },
  sectionBody: { fontSize: 14, color: '#6B7280', lineHeight: 22 },
});
