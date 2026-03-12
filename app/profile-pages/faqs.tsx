import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '../../src/shared/api/client';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/shared/theme';

export default function FAQsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = React.useState<number | null>(null);

  const { data: faqs } = useQuery({
    queryKey: ['faqs'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/faqs/');
        return Array.isArray(res.data) ? res.data : res.data?.results || [];
      } catch { return []; }
    },
    staleTime: 60 * 60 * 1000,
  });

  const defaultFaqs = [
    { id: 1, question: 'How does delivery work?', answer: 'We deliver freshly prepared meals to your doorstep within designated delivery areas. Orders are dispatched based on your chosen time slot.' },
    { id: 2, question: 'What are subscription benefits?', answer: 'Subscribers save up to 30% on meal costs, get free bonus meals, and enjoy priority delivery.' },
    { id: 3, question: 'Can I pause my subscription?', answer: 'Yes! You can hold, resume, or cancel your subscription anytime from your profile.' },
    { id: 4, question: 'How do rewards work?', answer: 'Earn points with every order. Accumulated points can be redeemed for discounts and free meals.' },
    { id: 5, question: 'How do I contact support?', answer: 'Reach out to us via WhatsApp or email from the Help & Support section in your profile.' },
  ];

  const items = (faqs && faqs.length > 0) ? faqs : defaultFaqs;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAQs</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.faqCard}
            onPress={() => setExpanded(expanded === item.id ? null : item.id)}
            activeOpacity={0.85}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{item.question}</Text>
              <Ionicons name={expanded === item.id ? 'chevron-up' : 'chevron-down'} size={18} color={colors.text.muted} />
            </View>
            {expanded === item.id && <Text style={styles.faqAnswer}>{item.answer}</Text>}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  headerTitle: { ...typography.heading.lg, color: colors.text.primary },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
  faqCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { ...typography.body.lg, color: colors.text.primary, fontWeight: '600', flex: 1, marginRight: spacing.md },
  faqAnswer: { ...typography.body.md, color: colors.text.secondary, marginTop: spacing.md, lineHeight: 22 },
});
