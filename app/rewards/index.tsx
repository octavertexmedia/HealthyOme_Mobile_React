import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { rewardsApi, type Reward } from '../../src/features/rewards/api/rewards.api';
import { useAuthStore } from '../../src/features/auth/store/auth.store';

const EARN_METHODS = [
  {
    icon: 'bag-handle-outline' as const,
    title: 'Make a Purchase',
    subtitle: 'Earn 25 point for every ₹100 spent',
    points: '+25',
  },
  {
    icon: 'people-outline' as const,
    title: 'Refer a friend',
    subtitle: 'Get 200 points when they join',
    points: '+200',
  },
  {
    icon: 'flame-outline' as const,
    title: 'Daily Streak',
    subtitle: 'Get 25 points on 7 day continuous buy',
    points: '+25',
  },
];

export default function RewardsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: rewards } = useQuery({
    queryKey: ['rewards'],
    queryFn: rewardsApi.getRewards,
  });
  const { data: userPointsData } = useQuery<number>({
    queryKey: ['rewards', 'points'],
    queryFn: rewardsApi.getUserPoints,
    enabled: isAuthenticated,
  });

  const userPoints = userPointsData ?? 0;
  const rewardsList = rewards || [];

  const claimMutation = useMutation({
    mutationFn: (rewardId: number) => rewardsApi.claimReward(rewardId),
    // Optimistic — drop the user's visible balance immediately, restore on error.
    onMutate: async (rewardId) => {
      await queryClient.cancelQueries({ queryKey: ['rewards', 'points'] });
      const previous = queryClient.getQueryData<number>(['rewards', 'points']) ?? 0;
      const reward = rewardsList.find((r: Reward) => r.id === rewardId);
      const cost = reward?.points_required ?? 0;
      queryClient.setQueryData<number>(['rewards', 'points'], Math.max(0, previous - cost));
      return { previous };
    },
    onError: (err: any, _rewardId, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(['rewards', 'points'], ctx.previous);
      }
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        'Could not claim this reward. Please try again.';
      Alert.alert('Claim failed', String(msg));
    },
    onSuccess: () => {
      Alert.alert('Reward claimed', 'Your reward has been applied to your account.');
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      queryClient.invalidateQueries({ queryKey: ['rewards', 'history'] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards', 'points'] });
    },
  });

  const onClaim = (reward: Reward) => {
    if (!isAuthenticated) {
      router.push('/(auth)/login' as any);
      return;
    }
    if (userPoints < reward.points_required) return;
    Alert.alert(
      'Claim reward?',
      `${reward.name} — costs ${reward.points_required} pts. You have ${userPoints} pts.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Claim', onPress: () => claimMutation.mutate(reward.id) },
      ]
    );
  };

  const getRewardEmoji = (type: string) => {
    if (type === 'free_meal') return '🥗';
    if (type === 'discount') return '🏷️';
    return '💰';
  };

  const getRewardSubtitle = (reward: any) => {
    if (reward.discount_percentage) return `${reward.discount_percentage}% discount on next order`;
    if (reward.discount_amount) return `₹${parseFloat(reward.discount_amount)} off your order`;
    if (reward.cashback_amount) return `₹${parseFloat(reward.cashback_amount)} cashback`;
    return reward.description;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ─── HEADER GRADIENT ─── */}
      <LinearGradient colors={['#0F3D21', '#1E6F3E']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTrailing}>YOUR REWARD</Text>
          <Text style={styles.headerPts}>{userPoints} pts</Text>
          <Text style={styles.headerSub}>The more you order, the more points you earn</Text>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ─── POINTS SUMMARY CARD ─── */}
        <TouchableOpacity
          style={styles.pointsCard}
          onPress={() => router.push('/rewards/history' as any)}
          activeOpacity={0.8}
        >
          <View style={styles.pointsLeft}>
            <View style={styles.coinCircle}>
              <Text style={{ fontSize: 24 }}>🪙</Text>
            </View>
            <View>
              <Text style={styles.pointsValue}>{userPoints} pts</Text>
              <Text style={styles.pointsTap}>Tap to view history</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* ─── AVAILABLE REWARDS ─── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Rewards</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          style={{ marginBottom: 8 }}
        >
          {rewardsList.length === 0 ? (
            <View style={styles.emptyRewards}>
              <Text style={styles.emptyText}>No rewards available yet</Text>
            </View>
          ) : rewardsList.map((reward: any) => (
            <View key={reward.id} style={styles.rewardCard}>
              <LinearGradient colors={['#E8F5E9', '#C8E6C9']} style={styles.rewardTop}>
                <Text style={{ fontSize: 40 }}>{getRewardEmoji(reward.reward_type)}</Text>
              </LinearGradient>
              <View style={styles.rewardInfo}>
                <Text style={styles.rewardName} numberOfLines={1}>{reward.name}</Text>
                <Text style={styles.rewardDesc} numberOfLines={1}>{getRewardSubtitle(reward)}</Text>
                <View style={styles.rewardBottom}>
                  <Text style={styles.rewardPts}>{reward.points_required} pts</Text>
                  <TouchableOpacity
                    style={[
                      styles.claimBtn,
                      userPoints >= reward.points_required ? styles.claimBtnActive : styles.claimBtnLocked,
                    ]}
                    disabled={
                      userPoints < reward.points_required ||
                      (claimMutation.isPending && claimMutation.variables === reward.id)
                    }
                    onPress={() => onClaim(reward)}
                  >
                    {claimMutation.isPending && claimMutation.variables === reward.id ? (
                      <ActivityIndicator size="small" color="#4B8E3D" />
                    ) : (
                      <Text
                        style={[
                          styles.claimBtnText,
                          {
                            color:
                              userPoints >= reward.points_required ? '#4B8E3D' : '#9CA3AF',
                          },
                        ]}
                      >
                        {userPoints >= reward.points_required ? 'Claim' : 'Locked'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* ─── EARN MORE POINTS ─── */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Earn more points</Text>
        </View>

        <View style={styles.earnCard}>
          {EARN_METHODS.map((method, idx) => (
            <View
              key={method.title}
              style={[styles.earnRow, idx !== EARN_METHODS.length - 1 && styles.earnRowBorder]}
            >
              <View style={styles.earnLeft}>
                <View style={styles.earnIcon}>
                  <Ionicons name={method.icon} size={20} color="#4B8E3D" />
                </View>
                <View>
                  <Text style={styles.earnTitle}>{method.title}</Text>
                  <Text style={styles.earnSubtitle}>{method.subtitle}</Text>
                </View>
              </View>
              <Text style={styles.earnPoints}>{method.points}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F6' },

  header: { paddingHorizontal: 16, paddingBottom: 28 },
  backBtn: { paddingVertical: 14 },
  headerContent: { marginTop: 8 },
  headerTrailing: {
    fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5, marginBottom: 4,
  },
  headerPts: { fontSize: 36, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 6 },

  scrollContent: { paddingBottom: 40 },

  pointsCard: {
    marginHorizontal: 16, marginTop: 16, backgroundColor: '#fff', borderRadius: 16,
    padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  pointsLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  coinCircle: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF8E1',
    alignItems: 'center', justifyContent: 'center',
  },
  pointsValue: { fontSize: 24, fontWeight: '700', color: '#111' },
  pointsTap: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  sectionHeader: { paddingHorizontal: 16, marginTop: 28, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111' },

  emptyRewards: { width: 200, alignItems: 'center', paddingVertical: 20 },
  emptyText: { color: '#9CA3AF', fontSize: 14 },

  rewardCard: {
    width: 176, backgroundColor: '#fff', borderRadius: 16,
    overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  rewardTop: {
    height: 96, alignItems: 'center', justifyContent: 'center',
  },
  rewardInfo: { padding: 12 },
  rewardName: { fontSize: 14, fontWeight: '600', color: '#111' },
  rewardDesc: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  rewardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  rewardPts: { fontSize: 12, color: '#9CA3AF' },
  claimBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  claimBtnActive: { backgroundColor: '#E8F5E9' },
  claimBtnLocked: { backgroundColor: '#F3F4F6' },
  claimBtnText: { fontSize: 12, fontWeight: '600' },

  earnCard: {
    marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 16,
    overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
  },
  earnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  earnRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  earnLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  earnIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center',
  },
  earnTitle: { fontSize: 14, fontWeight: '500', color: '#111' },
  earnSubtitle: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  earnPoints: { fontSize: 14, fontWeight: '700', color: '#4B8E3D' },
});
