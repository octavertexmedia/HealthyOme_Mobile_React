import React, { type ReactNode } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getImageUrl } from '../../shared/utils/helpers';
import { env } from '../../shared/config/env';

export function BrowseScreen({ title, fallback, children }: { title: string; fallback: Href; children: ReactNode }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return <View style={[browseStyles.screen, { paddingTop: insets.top }]}>
    <View style={browseStyles.header}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace(fallback)}>
        <Ionicons name="chevron-back" size={26} color="#183829" />
      </TouchableOpacity>
      <Text style={browseStyles.heading}>{title}</Text>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="My subscriptions" onPress={() => router.push('/subscription/my')}>
        <Ionicons name="person-circle-outline" size={27} color="#183829" />
      </TouchableOpacity>
    </View>
    <ScrollView contentContainerStyle={[browseStyles.content, { paddingBottom: insets.bottom + 28 }]}>
      {env.readOnlyPreview ? <Text style={browseStyles.notice}>Guest preview · payments and account changes disabled</Text> : null}
      {children}
    </ScrollView>
  </View>;
}

export function BrowseCard({ title, description, image, label, onPress }: { title: string; description?: string; image?: string | null; label?: string; onPress: () => void }) {
  const source = getImageUrl(image);
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={browseStyles.card}>
    {source ? <Image source={{ uri: source }} style={browseStyles.image} resizeMode="cover" /> : null}
    <View style={browseStyles.cardBody}>
      <Text style={browseStyles.title}>{title}</Text>
      {description ? <Text style={browseStyles.body}>{description}</Text> : null}
      {label ? <Text style={browseStyles.price}>{label}</Text> : null}
      <Text style={browseStyles.link}>View details →</Text>
    </View>
  </TouchableOpacity>;
}

export const browseStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFFF8' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, gap: 12, borderBottomWidth: 1, borderColor: '#E6E6E3' },
  heading: { fontSize: 17, fontWeight: '600', color: '#183829', flex: 1, textAlign: 'center' },
  content: { padding: 16, gap: 18 },
  notice: { fontSize: 12, color: '#52604F', textAlign: 'center' },
  card: { backgroundColor: '#FFF', borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: '#E1EBDE' },
  image: { width: '100%', height: 196 },
  cardBody: { padding: 18, gap: 8 },
  title: { fontSize: 22, lineHeight: 29, fontWeight: '700', color: '#193827' },
  body: { fontSize: 15, lineHeight: 23, color: '#59645B' },
  price: { color: '#397B30', fontSize: 17, fontWeight: '600' },
  link: { color: '#397B30', fontSize: 15, fontWeight: '600', paddingVertical: 8 },
});
