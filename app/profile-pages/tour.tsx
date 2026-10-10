import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { ScreenHeader } from '../../src/shared/components/ScreenHeader';
import { useSiteSettings } from '../../src/features/catalog/hooks/useMeals';
import { customerFeatures, homeFeatures } from '../../src/features/catalog/customerFeatures';

/** Replayable public guide: no onboarding, cart, auth, or customer data writes. */
export default function AppTourScreen() {
  const router = useRouter();
  const { data: settings } = useSiteSettings();
  const flags = customerFeatures(settings);
  const home = homeFeatures(settings);
  const services: { label: string; route: Href }[] = [
    ...(home.showSubscription ? [{ label: 'Meal subscriptions', route: '/subscription/categories' as const }] : []),
    ...(flags.quickMeals ? [{ label: 'Quick Meals', route: '/(tabs)/menu' as const }] : []),
    ...(flags.snacks ? [{ label: 'Healthy Snacks', route: '/(tabs)/snacks' as const }] : []),
    ...(flags.training ? [{ label: 'Functional Training', route: '/(tabs)/training' as const }] : []),
    ...(home.showConsult ? [{ label: 'Dietitian', route: '/(tabs)/dietitian' as const }] : []),
  ];
  return <View style={styles.container}>
    <ScreenHeader title="App tour" fallback="/(tabs)/profile" showCart={false} />
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.intro}>Your quick guide to Healthy-O-Me. You can browse without signing in.</Text>
      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>1. Explore what is available</Text>
        <Text style={styles.body}>Start from Home or use the bottom tabs. Choose a service below to explore its current catalogue.</Text>
        {services.map((service) => <TouchableOpacity key={service.label} accessibilityRole="button"
          accessibilityLabel={`Explore ${service.label}`} style={styles.link} onPress={() => router.push(service.route)}>
          <Text style={styles.linkText}>Explore {service.label}</Text>
        </TouchableOpacity>)}
      </View>
      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>2. Plan your order</Text>
        <Text style={styles.body}>Read a plan or product, choose your options, then review your cart. Browsing does not need a saved address or location permission. Sign in when you are ready to manage your delivery details or complete checkout.</Text>
      </View>
      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>3. Find your account and support</Text>
        <Text style={styles.body}>Tap the profile icon at the top of Home to return to Your Account. Orders, subscriptions, addresses and rewards require sign-in. Support, FAQs and this tour are open to everyone.</Text>
      </View>
      <TouchableOpacity accessibilityRole="button" style={styles.done} onPress={() => router.navigate('/(tabs)')}>
        <Text style={styles.doneText}>Done — explore Home</Text>
      </TouchableOpacity>
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F8F4' },
  content: { padding: 16, paddingBottom: 24, gap: 16 },
  intro: { fontSize: 15, lineHeight: 22, color: '#445044' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 8 },
  title: { fontSize: 16, lineHeight: 23, fontWeight: '600', color: '#183829' },
  body: { fontSize: 14, lineHeight: 22, color: '#445044' },
  link: { minHeight: 48, justifyContent: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#DCE5D8' },
  linkText: { fontSize: 14, lineHeight: 20, color: '#28651F', fontWeight: '600' },
  done: { minHeight: 48, borderRadius: 12, padding: 14, backgroundColor: '#2C791F', alignItems: 'center', justifyContent: 'center' },
  doneText: { fontSize: 15, lineHeight: 21, fontWeight: '600', color: '#fff' },
});
