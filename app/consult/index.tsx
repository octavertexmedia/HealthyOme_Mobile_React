import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ConsultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* ─── HEADER (blue-teal bg) ─── */}
      <View style={[styles.hero, { paddingTop: Math.max(insets.top, 16) + 16, height: 160 + Math.max(insets.top, 16) }]}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#111" />
        </TouchableOpacity>

        <Text style={styles.heroTitle}>Consult {'\n'}a Dietician</Text>

        {/* Illustration — overlapping bottom-right */}
        <Image
          source={require('../../assets/images/figma/consult_dietician.png')}
          style={styles.heroImg}
          resizeMode="contain"
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* ─── CONSULTATION CARD ─── */}
        <View style={styles.body}>
          <View style={styles.consultCard}>
            <View style={styles.consultCardLeft}>
              <Text style={styles.consultCardTitle}>1-on-1 Consultation</Text>
              <Text style={styles.consultCardSubtitle}>
                Personalized plan for your health goals
              </Text>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => router.push('/consult/booking' as any)}
              >
                <Text style={styles.exploreBtnText}>Explore</Text>
              </TouchableOpacity>
            </View>

            <Image
              source={require('../../assets/images/figma/dietician_1.png')}
              style={styles.doctorImg}
              resizeMode="contain"
            />
          </View>

          {/* ─── WHY SECTION ─── */}
          <Text style={styles.sectionTitle}>Why consult a Dietitian?</Text>
          {[
            'Personalised nutrition plan',
            'Certified & verified experts',
            'Support for weight, PCOS, diabetes',
          ].map((item) => (
            <View key={item} style={styles.checkRow}>
              <Ionicons name="checkmark" size={16} color="#9CA3AF" />
              <Text style={styles.checkText}>{item}</Text>
            </View>
          ))}

          {/* ─── HOW IT WORKS ─── */}
          <Text style={[styles.sectionTitle, { marginTop: 28 }]}>How it works</Text>
          {[
            'Choose consultation',
            'Talk to your dietician',
            'Get your personalised plan',
          ].map((step, idx) => (
            <View key={idx} style={styles.stepRow}>
              <View style={styles.stepDot} />
              <Text style={styles.checkText}>{step}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  /* Hero */
  hero: {
    backgroundColor: '#8EC5D6',
    paddingHorizontal: 24,
    paddingTop: 16,
    height: 200,
    overflow: 'hidden',
  },
  backCircle: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 28, fontWeight: '700', color: '#fff', lineHeight: 34,
    marginTop: 'auto', position: 'absolute', left: 24, bottom: 24,
  },
  heroImg: {
    width: 170, height: 170,
    position: 'absolute', right: -10, bottom: 0,
  },

  /* Body */
  body: { padding: 20 },

  /* Consult Card */
  consultCard: {
    backgroundColor: '#EAF7FD', borderRadius: 18, padding: 20,
    paddingRight: 140, marginBottom: 28, minHeight: 120,
    position: 'relative', overflow: 'hidden',
  },
  consultCardLeft: { zIndex: 10 },
  consultCardTitle: { fontSize: 14, fontWeight: '600', color: '#111', marginBottom: 4 },
  consultCardSubtitle: { fontSize: 12, color: '#666', marginBottom: 10, maxWidth: 180 },
  exploreBtn: {
    backgroundColor: '#4FB6E9', borderRadius: 20, paddingVertical: 6,
    paddingHorizontal: 18, alignSelf: 'flex-start',
  },
  exploreBtnText: { fontSize: 14, color: '#fff', fontWeight: '500' },
  doctorImg: {
    width: 160, height: 160,
    position: 'absolute', right: -10, bottom: -10,
  },

  /* Sections */
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111', marginBottom: 12 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  checkText: { fontSize: 14, color: '#9CA3AF', lineHeight: 22 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  stepDot: {
    width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#bbb',
  },
});
