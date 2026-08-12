import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// The backend is Razorpay-only with NO saved-cards / saved-payment-modes API.
// Payment methods are chosen inside the secure Razorpay checkout at pay time,
// so this screen only explains what's supported — it does not store or list
// any real payment instruments.
const SUPPORTED_METHODS = [
  { icon: 'qr-code', label: 'UPI', subtitle: 'GPay, PhonePe, Paytm, BHIM' },
  { icon: 'card', label: 'Credit / Debit Card', subtitle: 'Visa, Mastercard, RuPay' },
  { icon: 'business', label: 'Net Banking', subtitle: 'All major banks' },
  { icon: 'wallet', label: 'Wallets', subtitle: 'Popular digital wallets' },
];

export default function PaymentModesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.secureBanner}>
          <View style={styles.secureIcon}>
            <Ionicons name="shield-checkmark" size={22} color="#2C921D" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.secureTitle}>Secure payments via Razorpay</Text>
            <Text style={styles.secureSubtitle}>
              You choose how to pay on the secure checkout screen when you place an order. We never
              store your card or payment details.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>Supported at checkout</Text>
        <View style={styles.card}>
          {SUPPORTED_METHODS.map((pm, idx) => (
            <React.Fragment key={pm.label}>
              <View style={styles.tile}>
                <View style={styles.iconBox}>
                  <Ionicons name={pm.icon as any} size={22} color="#2C921D" />
                </View>
                <View style={styles.tileInfo}>
                  <Text style={styles.tileLabel}>{pm.label}</Text>
                  <Text style={styles.tileSub}>{pm.subtitle}</Text>
                </View>
              </View>
              {idx < SUPPORTED_METHODS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>
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
  secureBanner: {
    flexDirection: 'row', gap: 12, backgroundColor: '#ECFDF5', borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#D1FADF', marginBottom: 24,
  },
  secureIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  secureTitle: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 4 },
  secureSubtitle: { fontSize: 13, color: '#4B5563', lineHeight: 19 },

  sectionHeading: { fontSize: 13, fontWeight: '600', color: '#9CA3AF', marginBottom: 10, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  tile: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  iconBox: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#ECFDF5',
    justifyContent: 'center', alignItems: 'center',
  },
  tileInfo: { flex: 1 },
  tileLabel: { fontSize: 15, fontWeight: '500', color: '#111', marginBottom: 2 },
  tileSub: { fontSize: 13, color: '#6B7280' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 76 },
});
