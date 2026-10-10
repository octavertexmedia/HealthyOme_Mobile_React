import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/features/auth/store/auth.store';
import { consultationsApi } from '../../src/features/consultations/api/consultations.api';
import { ConsultationHealthCheckout } from '../../src/features/consultations/ConsultationHealthCheckout';

export default function ConsultationHealthScreen() {
  const params = useLocalSearchParams<{ booking?: string }>();
  const { isAuthenticated, user, sessionRevision } = useAuthStore();
  const insets = useSafeAreaInsets();
  const id = Number(params.booking);
  const valid = Number.isSafeInteger(id) && id > 0;
  const query = useQuery({
    queryKey: ['consult', 'health-checkout', user?.id, sessionRevision, id],
    queryFn: () => consultationsApi.getBooking(id),
    enabled: isAuthenticated && valid,
    gcTime: 0,
    staleTime: 0,
    retry: false,
  });
  if (!valid) return <Text>Invalid consultation. Start from My bookings.</Text>;
  if (!isAuthenticated) return <Redirect href={{ pathname: '/(auth)/login', params: { redirect: `/consult/health?booking=${id}` } }} />;
  return <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: '#F7FAF5' }}>
    {query.isPending ? <ActivityIndicator accessibilityLabel="Loading consultation" /> : query.isError || !query.data ? (
      <TouchableOpacity accessibilityRole="button" onPress={() => { void query.refetch(); }} style={{ padding: 24 }}><Text>Could not load your consultation. Retry</Text></TouchableOpacity>
    ) : <ConsultationHealthCheckout key={`${sessionRevision}-${id}`} booking={query.data} />}
  </View>;
}
