import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { env } from '../../../shared/config/env';
import type { ReferralMe } from '../api/referrals.api';

// env.apiUrl is like https://host/api/shop — strip the API suffix to get the web origin.
function webOrigin(): string {
  return env.apiUrl.replace(/\/api\/shop\/?$/, '');
}

function buildShareUrl(sharePath: string): string {
  if (/^https?:\/\//i.test(sharePath)) return sharePath;
  const origin = webOrigin();
  const path = sharePath.startsWith('/') ? sharePath : `/${sharePath}`;
  return `${origin}${path}`;
}

export function ReferralPanel({ referral }: { referral: ReferralMe }) {
  if (!referral.program_enabled) return null;

  const shareUrl = buildShareUrl(referral.share_path);
  const rewardPoints = referral.referrer_reward_points;

  const onShare = async () => {
    try {
      await Share.share({
        message: `Join me on HealthyOme! Use my referral code ${referral.code} to get started: ${shareUrl}`,
      });
    } catch {
      Alert.alert('Could not open share sheet', 'Please try again.');
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="people-outline" size={20} color="#4B8E3D" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Refer a friend</Text>
          {rewardPoints > 0 ? (
            <Text style={styles.subtitle}>
              Earn {rewardPoints} points for every friend who joins
            </Text>
          ) : (
            <Text style={styles.subtitle}>Share your code and earn rewards together</Text>
          )}
        </View>
      </View>

      <View style={styles.codeRow}>
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>Your code</Text>
          <Text style={styles.codeValue}>{referral.code}</Text>
        </View>
        <TouchableOpacity style={styles.shareBtn} onPress={onShare} activeOpacity={0.85}>
          <Ionicons name="share-social-outline" size={16} color="#fff" />
          <Text style={styles.shareText}>Share</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{referral.pending_count}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{referral.rewarded_count}</Text>
          <Text style={styles.statLabel}>Rewarded</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F5E9',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 14, fontWeight: '600', color: '#111' },
  subtitle: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  codeBox: {
    flex: 1, backgroundColor: '#F6F6F6', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14,
  },
  codeLabel: { fontSize: 11, color: '#9CA3AF' },
  codeValue: { fontSize: 18, fontWeight: '800', color: '#111', letterSpacing: 1, marginTop: 2 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#4B8E3D', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12,
  },
  shareText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  statsRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 16,
    backgroundColor: '#F9FEF7', borderRadius: 12, paddingVertical: 12,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#0F3D21' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: '#E6E6E3' },
});
