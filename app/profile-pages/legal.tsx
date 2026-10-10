import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../../src/shared/components/ScreenHeader';

export default function LegalIndexScreen() {
  const router = useRouter();
  return <View style={styles.container}>
    <ScreenHeader title="Terms & Privacy" fallback="/(tabs)/profile" showCart={false} />
    <ScrollView contentContainerStyle={styles.content}>
      {([{ slug: 'terms', label: 'Terms of Service' }, { slug: 'privacy', label: 'Privacy Policy' }] as const).map((page) => (
        <TouchableOpacity key={page.slug} accessibilityRole="button" style={styles.row}
          onPress={() => router.push({ pathname: '/profile-pages/terms', params: { slug: page.slug } })}>
          <Text style={styles.label}>{page.label}</Text>
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.arrow}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F8F4' },
  content: { padding: 16, paddingBottom: 24, gap: 12 },
  row: { minHeight: 48, padding: 16, borderRadius: 12, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { flex: 1, fontSize: 15, lineHeight: 22, color: '#183829' },
  arrow: { fontSize: 22, color: '#61705F' },
});
