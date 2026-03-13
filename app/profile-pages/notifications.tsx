import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [toggles, setToggles] = useState({
    orderUpdates: true,
    promotions: true,
    subscriptionReminders: true,
    rewardAlerts: false,
  });

  const toggleSwitch = (key: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const SETTINGS = [
    { key: 'orderUpdates', label: 'Order Updates', subtitle: 'Status of your active orders' },
    { key: 'promotions', label: 'Promotions & Offers', subtitle: 'Deals, discounts and special offers' },
    { key: 'subscriptionReminders', label: 'Subscription Reminders', subtitle: 'Upcoming delivery & plan renewals' },
    { key: 'rewardAlerts', label: 'Reward Alerts', subtitle: 'When you earn or can redeem points' },
  ] as const;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {SETTINGS.map((item, idx) => (
            <React.Fragment key={item.key}>
              <View style={styles.tile}>
                <View style={styles.tileInfo}>
                  <Text style={styles.tileLabel}>{item.label}</Text>
                  <Text style={styles.tileSub}>{item.subtitle}</Text>
                </View>
                <Switch 
                  trackColor={{ false: '#D1D5DB', true: '#D1FADF' }}
                  thumbColor={toggles[item.key] ? '#2C921D' : '#f4f3f4'}
                  ios_backgroundColor="#D1D5DB"
                  onValueChange={() => toggleSwitch(item.key)}
                  value={toggles[item.key]}
                />
              </View>
              {idx < SETTINGS.length - 1 && <View style={styles.divider} />}
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
  card: {
    backgroundColor: '#fff', borderRadius: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  tile: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  tileInfo: { flex: 1 },
  tileLabel: { fontSize: 16, fontWeight: '500', color: '#111', marginBottom: 2 },
  tileSub: { fontSize: 13, color: '#6B7280' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 },
});
