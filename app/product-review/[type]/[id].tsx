import React from 'react';
import { Text, View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../src/features/auth/store/auth.store';
import { ReviewEditor } from '../../../src/features/catalog/components/ReviewEditor';
import { CustomerFeatureGate } from '../../../src/features/catalog/components/CustomerFeatureGate';

export default function ProductReviewScreen() {
  const { type, id } = useLocalSearchParams<{ type: string; id: string }>();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, sessionRevision } = useAuthStore();
  const productId = Number(id);
  if (!['meal', 'snack'].includes(type) || !Number.isSafeInteger(productId) || productId < 1) return <Text>Invalid review product.</Text>;
  const productType = type === 'snack' ? 'snack' : 'meal';
  return <CustomerFeatureGate feature={productType === 'snack' ? 'snacks' : 'quickMeals'}>
    {!isAuthenticated ? <Redirect href={{ pathname: '/(auth)/login', params: { redirect: `/product-review/${productType}/${productId}` } }} /> : (
      <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: '#fff' }}><ReviewEditor key={sessionRevision} productType={productType} productId={productId} /></View>
    )}
  </CustomerFeatureGate>;
}
