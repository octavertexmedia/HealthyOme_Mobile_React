import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLegalPage } from '../../src/features/legal/hooks/useLegalPage';
import Loading from '../../src/shared/components/Loading';

// Supports both Terms (default) and Privacy via ?slug=privacy.
const FALLBACK: Record<string, { title: string; body: string }> = {
  terms: {
    title: 'Terms & Conditions',
    body: "We couldn't load the latest Terms & Conditions right now. Please check your internet connection and try again, or reach out to our support team for a copy.",
  },
  privacy: {
    title: 'Privacy Policy',
    body: "We couldn't load the latest Privacy Policy right now. Please check your internet connection and try again, or reach out to our support team for a copy.",
  },
};

function formatUpdated(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function TermsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = params.slug === 'privacy' ? 'privacy' : 'terms';

  const { data, isLoading, isError } = useLegalPage(slug);
  const fallback = FALLBACK[slug];

  const title = data?.title || fallback.title;
  const body = data?.body ?? fallback.body;
  const updated = formatUpdated(data?.last_updated ?? null);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <Loading fullScreen message="Loading..." />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {updated && <Text style={styles.lastUpdated}>Last updated: {updated}</Text>}
          {isError && (
            <Text style={styles.errorNote}>
              Showing an offline summary — some content may be out of date.
            </Text>
          )}
          <Text style={styles.body}>{body}</Text>
        </ScrollView>
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
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111', flex: 1, textAlign: 'center' },

  scrollContent: { padding: 24, paddingBottom: 100 },
  lastUpdated: { fontSize: 13, color: '#9CA3AF', marginBottom: 24 },
  errorNote: { fontSize: 13, color: '#F59E0B', marginBottom: 16, lineHeight: 20 },
  body: { fontSize: 14, color: '#374151', lineHeight: 24 },
});
