import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomerFeatureGate } from '../../src/features/catalog/components/CustomerFeatureGate';
import {
  resolveMediaUrl,
  type Trainer,
} from '../../src/features/functional-training/api/functionalTraining.api';
import {
  useProgram,
  useTrainers,
} from '../../src/features/functional-training/hooks/useFunctionalTraining';

function TrainerCard({
  trainer,
  onPress,
}: {
  trainer: Trainer;
  onPress: () => void;
}) {
  const img = resolveMediaUrl(trainer.image);
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      {img ? (
        <Image source={{ uri: img }} style={styles.cardImg} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImg, styles.cardImgFallback]}>
          <Ionicons name="barbell-outline" size={26} color="#9CA3AF" />
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>
          {trainer.name}
        </Text>
        <Text style={styles.cardSpecialty} numberOfLines={1}>
          {trainer.specialty}
        </Text>
        <View style={styles.cardMetaRow}>
          <Ionicons name="calendar-outline" size={13} color="#4B8E3D" />
          <Text style={styles.cardMeta}>
            {trainer.sessionsPerWeek} sessions/week
          </Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.cardPrice}>₹{trainer.monthlyPriceInr}</Text>
        <Text style={styles.cardPriceUnit}>/month</Text>
        <Ionicons name="chevron-forward" size={18} color="#C5C5C5" />
      </View>
    </TouchableOpacity>
  );
}

export default function FunctionalTrainingScreen() {
  return <CustomerFeatureGate feature="training"><EnabledTrainingScreen /></CustomerFeatureGate>;
}

function EnabledTrainingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const programQuery = useProgram();
  const trainersQuery = useTrainers();

  const program = programQuery.data;
  const trainers = trainersQuery.data ?? [];
  const busy = programQuery.isLoading || trainersQuery.isLoading;

  return (
    <View style={styles.container}>
      {/* ─── HERO ─── */}
      <View
        style={[
          styles.hero,
          { paddingTop: Math.max(insets.top, 16) + 16, height: 180 + Math.max(insets.top, 16) },
        ]}
      >
        <View style={styles.heroTopRow}>
          <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#111" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.myPill}
            onPress={() => router.push('/functional-training/my' as any)}
          >
            <Ionicons name="clipboard-outline" size={14} color="#0B262F" />
            <Text style={styles.myPillText}>My plan</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.heroTitle}>Functional{'\n'}Training</Text>
        <Text style={styles.heroSubtitle}>
          Personal coaching to move better and get stronger
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}
        refreshControl={
          <RefreshControl
            refreshing={
              (programQuery.isFetching || trainersQuery.isFetching) && !busy
            }
            onRefresh={() => {
              programQuery.refetch();
              trainersQuery.refetch();
            }}
            tintColor="#4B8E3D"
          />
        }
      >
        <View style={styles.body}>
          {/* ─── PROGRAM OVERVIEW ─── */}
          {programQuery.isLoading ? (
            <ActivityIndicator color="#4B8E3D" style={{ marginTop: 24 }} />
          ) : program ? (
            <View style={styles.programCard}>
              <Text style={styles.programTitle}>{program.name}</Text>
              <Text style={styles.programSpecialty}>{program.specialty}</Text>
              {!!program.bio && (
                <Text style={styles.programBio} numberOfLines={3}>
                  {program.bio}
                </Text>
              )}
              <View style={styles.programStatsRow}>
                <View style={styles.programStat}>
                  <Text style={styles.programStatValue}>
                    ₹{program.monthlyPriceInr}
                  </Text>
                  <Text style={styles.programStatLabel}>per month</Text>
                </View>
                <View style={styles.programStatDivider} />
                <View style={styles.programStat}>
                  <Text style={styles.programStatValue}>
                    {program.sessionsPerWeek}
                  </Text>
                  <Text style={styles.programStatLabel}>sessions / week</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.programBtn}
                onPress={() =>
                  router.push(`/functional-training/${program.id}` as any)
                }
              >
                <Text style={styles.programBtnText}>View & enroll</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* ─── WHY SECTION ─── */}
          <Text style={styles.sectionTitle}>Why functional training?</Text>
          {[
            'Build real-world strength & mobility',
            'Coached, structured monthly plan',
            'Fixed weekly time slot that suits you',
          ].map((item) => (
            <View key={item} style={styles.checkRow}>
              <Ionicons name="checkmark" size={16} color="#4B8E3D" />
              <Text style={styles.checkText}>{item}</Text>
            </View>
          ))}

          {/* ─── TRAINERS ─── */}
          <Text style={[styles.sectionTitle, { marginTop: 28 }]}>
            Choose your trainer
          </Text>
          {trainersQuery.isLoading ? (
            <ActivityIndicator color="#4B8E3D" style={{ marginTop: 16 }} />
          ) : trainersQuery.isError ? (
            <View style={styles.inlineError}>
              <Text style={styles.inlineErrorText}>
                Could not load trainers.
              </Text>
              <TouchableOpacity onPress={() => trainersQuery.refetch()}>
                <Text style={styles.inlineErrorRetry}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : trainers.length === 0 ? (
            <View style={styles.emptyInline}>
              <Ionicons name="barbell-outline" size={30} color="#9CA3AF" />
              <Text style={styles.emptyInlineText}>
                No trainers available right now.
              </Text>
            </View>
          ) : (
            trainers.map((t) => (
              <TrainerCard
                key={t.id}
                trainer={t}
                onPress={() =>
                  router.push(`/functional-training/${t.id}` as any)
                }
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  /* Hero */
  hero: {
    backgroundColor: '#CDEFC4',
    paddingHorizontal: 24,
    height: 200,
    overflow: 'hidden',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  myPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  myPillText: { fontSize: 13, fontWeight: '600', color: '#0B262F' },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0B262F',
    lineHeight: 34,
    marginTop: 16,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#2C5238',
    marginTop: 6,
    maxWidth: 260,
  },

  /* Body */
  body: { padding: 20 },

  /* Program card */
  programCard: {
    backgroundColor: '#F3FBEF',
    borderRadius: 18,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#E1F1D8',
  },
  programTitle: { fontSize: 18, fontWeight: '700', color: '#0B262F' },
  programSpecialty: {
    fontSize: 13,
    color: '#4B8E3D',
    fontWeight: '600',
    marginTop: 2,
  },
  programBio: { fontSize: 13, color: '#5A6B60', marginTop: 10, lineHeight: 20 },
  programStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  programStat: { flex: 1 },
  programStatValue: { fontSize: 18, fontWeight: '700', color: '#0B262F' },
  programStatLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  programStatDivider: {
    width: 1,
    height: 34,
    backgroundColor: '#DBEAD2',
    marginHorizontal: 16,
  },
  programBtn: {
    backgroundColor: '#2C921D',
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: 'center',
  },
  programBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  /* Sections */
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 12,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  checkText: { fontSize: 14, color: '#4B5563', lineHeight: 22 },

  /* Trainer card */
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#F0F0EE',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardImg: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F3F4F6' },
  cardImgFallback: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, marginLeft: 12 },
  cardName: { fontSize: 15, fontWeight: '600', color: '#111' },
  cardSpecialty: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  cardMeta: { fontSize: 12, color: '#4B8E3D', fontWeight: '500' },
  cardRight: { alignItems: 'flex-end', paddingLeft: 8 },
  cardPrice: { fontSize: 15, fontWeight: '700', color: '#0B262F' },
  cardPriceUnit: { fontSize: 11, color: '#9CA3AF', marginBottom: 4 },

  /* Inline states */
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
  },
  inlineErrorText: { fontSize: 14, color: '#B91C1C' },
  inlineErrorRetry: { fontSize: 14, color: '#B91C1C', fontWeight: '700' },
  emptyInline: { alignItems: 'center', gap: 8, paddingVertical: 28 },
  emptyInlineText: { fontSize: 14, color: '#6B7280' },
});
