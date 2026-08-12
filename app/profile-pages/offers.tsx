import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useCoupons } from '../../src/features/coupons/hooks/useCoupons';
import type { Coupon } from '../../src/features/coupons/types/coupon.types';
import Loading from '../../src/shared/components/Loading';
import EmptyState from '../../src/shared/components/EmptyState';

function formatMoney(value: string | null): string {
  if (value == null) return '';
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  // Drop trailing .00 for whole rupee amounts.
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
}

function formatDiscount(coupon: Coupon): string {
  const value = formatMoney(coupon.discount_value);
  if (coupon.discount_type === 'percentage') {
    const cap = coupon.max_discount ? ` (up to ₹${formatMoney(coupon.max_discount)})` : '';
    return `${value}% off${cap}`;
  }
  return `₹${value} off`;
}

function formatExpiry(validUntil: string): string {
  const d = new Date(validUntil);
  if (Number.isNaN(d.getTime())) return '';
  return `Expires ${d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
}

export default function OffersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: coupons, isLoading, isError, refetch } = useCoupons();

  const renderOffer = ({ item }: { item: Coupon }) => {
    const minOrder = formatMoney(item.min_order_amount);
    const expiry = formatExpiry(item.valid_until);
    return (
      <View style={styles.offerCard}>
        <LinearGradient
          colors={['#D1FADF', '#ECFDF5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.offerLeft}
        >
          <Ionicons name="pricetag" size={24} color="#2C921D" />
          <Text style={styles.offerCode}>{item.code}</Text>
        </LinearGradient>
        <View style={styles.offerRight}>
          <Text style={styles.offerTitle}>{formatDiscount(item)}</Text>
          {!!item.description && <Text style={styles.offerDesc}>{item.description}</Text>}
          {Number(minOrder) > 0 && (
            <Text style={styles.offerMinOrder}>Min. order ₹{minOrder}</Text>
          )}
          {!!expiry && (
            <View style={styles.offerExpiryRow}>
              <Ionicons name="time-outline" size={14} color="#9CA3AF" />
              <Text style={styles.offerExpiryText}>{expiry}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offers & Coupons</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <Loading fullScreen message="Loading offers..." />
      ) : isError ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Couldn't load offers"
          description="Please check your connection and try again."
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      ) : !coupons || coupons.length === 0 ? (
        <EmptyState
          icon="pricetags-outline"
          title="No offers right now"
          description="Check back soon for new coupons and deals."
        />
      ) : (
        <FlatList
          data={coupons}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderOffer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  offerDesc: { fontSize: 13, color: '#6B7280', marginBottom: 8, lineHeight: 18 },
  offerMinOrder: { fontSize: 12, color: '#6B7280', marginBottom: 8, fontWeight: '500' },
  offerExpiryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  offerExpiryText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
});
