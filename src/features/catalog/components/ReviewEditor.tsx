import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { reviewsApi, type ReviewProductType } from '../api/reviews.api';
import { useAuthStore } from '../../auth/store/auth.store';
import { env } from '../../../shared/config/env';

export function ReviewEditor({ productType, productId }: { productType: ReviewProductType; productId: number }) {
  const { user, sessionRevision } = useAuthStore();
  const query = useQuery({
    queryKey: ['productReviews', 'customer', user?.id, sessionRevision, productType, productId],
    queryFn: () => reviewsApi.forCustomer(productType, productId),
    gcTime: 0, staleTime: 0, retry: false,
  });
  if (query.isPending) return <ActivityIndicator accessibilityLabel="Loading your review" />;
  if (query.isError || !query.data) return <TouchableOpacity accessibilityRole="button" onPress={() => { void query.refetch(); }} style={{ padding: 24 }}><Text>Could not load your review. Retry</Text></TouchableOpacity>;
  return <ReviewForm key={`${sessionRevision}-${productType}-${productId}`} productType={productType} productId={productId} own={query.data.my_review} />;
}

function ReviewForm({ productType, productId, own }: { productType: ReviewProductType; productId: number; own: { rating: number; comment: string } | null }) {
  const router = useRouter();
  const client = useQueryClient();
  const revision = useAuthStore((state) => state.sessionRevision);
  const [rating, setRating] = useState(own?.rating ?? 0);
  const [comment, setComment] = useState(own?.comment ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState(false);
  const lock = useRef(false);
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const save = async () => {
    if (lock.current || env.readOnlyPreview || rating < 1) return;
    lock.current = true; setBusy(true); setMessage('');
    try {
      const result = await reviewsApi.save(productType, productId, { rating, comment });
      if (!active.current || useAuthStore.getState().sessionRevision !== revision) return;
      if (!result.my_review) throw new Error('Review save not confirmed');
      setRating(result.my_review.rating); setComment(result.my_review.comment);
      setSaved(true); setMessage('Your review has been saved. Thank you!');
      void client.invalidateQueries({ queryKey: ['productReviews', 'public', productType, productId] });
    } catch {
      if (active.current && useAuthStore.getState().sessionRevision === revision) setMessage('Could not confirm your review was saved. Check your review before retrying.');
    } finally { lock.current = false; if (active.current) setBusy(false); }
  };
  return <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }} keyboardShouldPersistTaps="handled">
    <Text accessibilityRole="header" style={{ fontSize: 22, fontWeight: '700' }}>{own ? 'Edit your review' : 'Write a review'}</Text>
    <Text>Your rating</Text>
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((value) => <TouchableOpacity key={value} accessibilityRole="radio" accessibilityLabel={`${value} star${value === 1 ? '' : 's'}`}
        accessibilityState={{ checked: rating === value, disabled: busy }} disabled={busy} onPress={() => { setRating(value); setSaved(false); }} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 26, color: value <= rating ? '#A66A00' : '#737373' }}>★</Text>
      </TouchableOpacity>)}
    </View>
    <Text>Your experience (optional)</Text>
    <TextInput accessibilityLabel="Your experience" value={comment} onChangeText={(value) => { setComment(value); setSaved(false); }} maxLength={2000} multiline editable={!busy}
      style={{ minHeight: 120, borderColor: '#CDDDC5', borderWidth: 1, padding: 14, borderRadius: 12, textAlignVertical: 'top' }} />
    {env.readOnlyPreview && <Text>This safe preview does not submit reviews.</Text>}
    {!!message && <Text accessibilityRole={saved ? undefined : 'alert'}>{message}</Text>}
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Save review" accessibilityState={{ disabled: busy || !rating || env.readOnlyPreview || saved }} disabled={busy || !rating || env.readOnlyPreview || saved} onPress={save}
      style={{ minHeight: 48, backgroundColor: '#34732D', padding: 14, alignItems: 'center', borderRadius: 24 }}><Text style={{ color: '#fff' }}>{busy ? 'Saving…' : 'Save review'}</Text></TouchableOpacity>
    <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={() => router.replace(productType === 'snack' ? `/snacks?snackId=${productId}` : `/meal/${productId}`)} style={{ padding: 14 }}><Text>Back to product</Text></TouchableOpacity>
  </ScrollView>;
}
