import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MOCK_HISTORY = [
  { id: '1', title: 'Balanced Meal Plan', date: 'Jan 12, 2025', points: 25, type: 'earned' },
  { id: '2', title: 'Refer a friend bonus', date: 'Jan 10, 2025', points: 200, type: 'earned' },
  { id: '3', title: 'Redeemed 10% Discount', date: 'Jan 8, 2025', points: -100, type: 'redeemed' },
  { id: '4', title: 'Quick Meal order', date: 'Jan 5, 2025', points: 25, type: 'earned' },
];

export default function RewardsHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const totalPoints = MOCK_HISTORY.reduce((sum, h) => sum + h.points, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Points History</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Total badge */}
      <View style={styles.totalBadge}>
        <Text style={styles.totalLabel}>Total Balance</Text>
        <Text style={styles.totalPts}>{totalPoints} pts</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {MOCK_HISTORY.map((item, idx) => (
          <View key={item.id} style={[styles.historyRow, idx !== MOCK_HISTORY.length - 1 && styles.historyRowBorder]}>
            <View style={[styles.iconCircle, { backgroundColor: item.type === 'earned' ? '#E8F5E9' : '#FEE2E2' }]}>
              <Ionicons
                name={item.type === 'earned' ? 'arrow-down' : 'arrow-up'}
                size={18}
                color={item.type === 'earned' ? '#4B8E3D' : '#EF4444'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.historyTitle}>{item.title}</Text>
              <Text style={styles.historyDate}>{item.date}</Text>
            </View>
            <Text style={[styles.historyPoints, { color: item.type === 'earned' ? '#4B8E3D' : '#EF4444' }]}>
              {item.points > 0 ? '+' : ''}{item.points} pts
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F6' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#111' },

  totalBadge: {
    backgroundColor: '#0F3D21', padding: 20, paddingHorizontal: 24, margin: 16, borderRadius: 20,
  },
  totalLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  totalPts: { fontSize: 32, fontWeight: '800', color: '#fff' },

  scrollContent: {
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 20,
    overflow: 'hidden', paddingHorizontal: 16,
  },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16,
  },
  historyRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
  },
  historyTitle: { fontSize: 14, fontWeight: '500', color: '#111' },
  historyDate: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  historyPoints: { fontSize: 15, fontWeight: '700' },
});
