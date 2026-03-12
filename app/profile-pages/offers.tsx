import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '../../src/shared/api/client';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/shared/theme';

export default function OffersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: coupons } = useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const res = await apiClient.get('/coupons/');
      return Array.isArray(res.data) ? res.data : res.data?.results || [];
    },
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offers & Coupons</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={coupons || []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.couponCard}>
            <View style={styles.couponLeft}>
              <View style={styles.couponBadge}>
                <Ionicons name="pricetag" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.couponCode}>{item.code}</Text>
                <Text style={styles.couponDesc}>{item.description || `Save ${item.discount_percentage}%`}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.copyBtn}>
              <Text style={styles.copyBtnText}>COPY</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="pricetag-outline" size={48} color={colors.text.disabled} />
            <Text style={styles.emptyText}>No offers available</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  headerTitle: { ...typography.heading.lg, color: colors.text.primary },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
  couponCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', ...shadows.sm,
  },
  couponLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  couponBadge: {
    width: 40, height: 40, borderRadius: borderRadius.md, backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  couponCode: { ...typography.heading.sm, color: colors.text.primary },
  couponDesc: { ...typography.body.sm, color: colors.text.secondary, marginTop: 2 },
  copyBtn: { backgroundColor: colors.primaryLight, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full },
  copyBtnText: { ...typography.button.sm, color: colors.primary },
  emptyWrap: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { ...typography.body.md, color: colors.text.muted, marginTop: spacing.md },
});
