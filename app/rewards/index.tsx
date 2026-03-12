import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { rewardsApi } from '../../src/features/rewards/api/rewards.api';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/shared/theme';
import { formatPrice } from '../../src/shared/utils/helpers';

export default function RewardsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: rewards } = useQuery({
    queryKey: ['rewards'],
    queryFn: rewardsApi.getRewards,
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rewards</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Points Card */}
      <View style={styles.cardPadding}>
        <LinearGradient
          colors={['#2C921D', '#1B6B12']}
          style={styles.pointsCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.pointsIconWrap}>
            <Ionicons name="gift" size={32} color="#FFD700" />
          </View>
          <Text style={styles.pointsLabel}>Your Reward Points</Text>
          <Text style={styles.pointsValue}>0</Text>
          <Text style={styles.pointsSubtext}>Earn points with every order</Text>
        </LinearGradient>
      </View>

      {/* Rewards List */}
      <FlatList
        data={rewards || []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.rewardCard}>
            <View style={styles.rewardLeft}>
              <View style={styles.rewardIcon}>
                <Text style={{ fontSize: 24 }}>🎁</Text>
              </View>
              <View>
                <Text style={styles.rewardName}>{item.name}</Text>
                <Text style={styles.rewardDesc}>{item.description}</Text>
                <Text style={styles.rewardPoints}>{item.points_required} points</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.claimBtn}>
              <Text style={styles.claimBtnText}>Claim</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="gift-outline" size={48} color={colors.text.disabled} />
            <Text style={styles.emptyText}>Rewards coming soon!</Text>
            <Text style={styles.emptySubtext}>Keep ordering to earn points</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  headerTitle: { ...typography.heading.xl, color: colors.text.primary },
  cardPadding: { paddingHorizontal: spacing.xl, marginBottom: spacing.xxl },
  pointsCard: {
    borderRadius: borderRadius.xl, padding: spacing.xxl, alignItems: 'center',
  },
  pointsIconWrap: { marginBottom: spacing.md },
  pointsLabel: { ...typography.body.md, color: 'rgba(255,255,255,0.8)' },
  pointsValue: { fontSize: 48, fontWeight: '800', color: '#fff', marginVertical: spacing.sm },
  pointsSubtext: { ...typography.body.sm, color: 'rgba(255,255,255,0.6)' },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
  rewardCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },
  rewardLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  rewardIcon: {
    width: 48, height: 48, borderRadius: borderRadius.md, backgroundColor: colors.divider,
    justifyContent: 'center', alignItems: 'center',
  },
  rewardName: { ...typography.body.lg, color: colors.text.primary, fontWeight: '600' },
  rewardDesc: { ...typography.body.sm, color: colors.text.secondary, marginTop: 2 },
  rewardPoints: { ...typography.body.xs, color: colors.primary, fontWeight: '600', marginTop: 4 },
  claimBtn: {
    backgroundColor: colors.primaryLight, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  claimBtnText: { ...typography.button.sm, color: colors.primary },
  emptyWrap: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { ...typography.heading.md, color: colors.text.muted, marginTop: spacing.lg },
  emptySubtext: { ...typography.body.md, color: colors.text.disabled, marginTop: spacing.xs },
});
