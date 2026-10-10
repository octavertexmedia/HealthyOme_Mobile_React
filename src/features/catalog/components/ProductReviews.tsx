import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { reviewsApi, type ReviewProductType } from '../api/reviews.api';
import { borderRadius, colors, spacing, typography } from '../../../shared/theme';

interface Props {
  productType: ReviewProductType;
  productId: number;
  onOpenEditor?: () => void;
}

export function ProductReviews(props: Props) {
  if (!Number.isSafeInteger(props.productId) || props.productId < 1) return null;
  // A different product always starts at page one, including reused snack modals.
  return <ReviewPages key={`${props.productType}-${props.productId}`} {...props} />;
}

function ReviewPages({ productType, productId, onOpenEditor }: Props) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isPending, isError, isFetching, refetch } = useQuery({
    queryKey: ['productReviews', 'public', productType, productId, page],
    queryFn: () => reviewsApi.forProduct(productType, productId, page),
    staleTime: 60 * 1000,
    retry: false,
  });
  const previousDisabled = page === 1 || isFetching;
  const nextDisabled = !data?.has_more || isError || isFetching;

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.title}>Customer reviews</Text>
      <TouchableOpacity accessibilityRole="button" onPress={() => { onOpenEditor?.(); router.push(`/product-review/${productType}/${productId}`); }} style={styles.button}>
        <Text style={styles.action}>Write or edit a review</Text>
      </TouchableOpacity>
      {isPending ? (
        <ActivityIndicator accessibilityLabel="Loading reviews" color={colors.primary} />
      ) : isError ? (
        <View>
          <Text accessibilityRole="alert" style={styles.body}>Could not load reviews.</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Retry reviews"
            accessibilityState={{ disabled: isFetching }}
            disabled={isFetching}
            onPress={() => { void refetch(); }}
            style={styles.button}
          >
            <Text style={styles.action}>{isFetching ? 'Loading…' : 'Retry'}</Text>
          </TouchableOpacity>
        </View>
      ) : data ? (
        <View>
          <Text style={styles.body}>
            {data.count === 0
              ? 'No reviews yet.'
              : `${data.rating === null ? 'Rating unavailable' : `${data.rating.toFixed(1)} / 5`} · ${data.count} review${data.count === 1 ? '' : 's'}`}
          </Text>
          {data.results.map((review) => (
            <View key={review.id} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.name}>{review.user_name || 'Customer'}</Text>
                <Text accessibilityLabel={`${review.rating} out of 5 stars`} style={styles.rating}>
                  {'★'.repeat(review.rating)}
                </Text>
              </View>
              {review.comment ? <Text style={styles.body}>{review.comment}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}
      {(page > 1 || data?.has_more) && (
        <View style={styles.row}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Previous reviews"
            accessibilityState={{ disabled: previousDisabled }}
            disabled={previousDisabled}
            onPress={() => setPage((value) => value - 1)}
            style={[styles.button, previousDisabled && styles.disabled]}
          >
            <Text style={styles.action}>Previous</Text>
          </TouchableOpacity>
          <Text style={styles.body}>Page {page}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Next reviews"
            accessibilityState={{ disabled: nextDisabled }}
            disabled={nextDisabled}
            onPress={() => setPage((value) => value + 1)}
            style={[styles.button, nextDisabled && styles.disabled]}
          >
            <Text style={styles.action}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.lg, gap: spacing.md },
  title: { ...typography.heading.md, color: colors.text.primary },
  body: { ...typography.body.md, color: colors.text.secondary, lineHeight: 22 },
  card: { marginTop: spacing.md, padding: spacing.md, gap: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  name: { ...typography.body.md, color: colors.text.primary, fontWeight: '600', flexShrink: 1 },
  rating: { color: '#9A6500' },
  button: { minHeight: 44, paddingHorizontal: spacing.md, justifyContent: 'center', alignItems: 'center' },
  action: { ...typography.body.md, color: colors.primary, fontWeight: '600' },
  disabled: { opacity: 0.4 },
});
