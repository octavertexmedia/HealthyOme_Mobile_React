import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../src/shared/storage/mmkv';
import { useCurrentLocation } from '../../src/features/location/hooks/useCurrentLocation';
import { locationStorage } from '../../src/features/location/api/locationStorage';
import DeliveryAreaPicker, {
  type DeliveryAreaSelection,
} from '../../src/features/delivery-areas/components/DeliveryAreaPicker';

export default function LocationPermissionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { detect, loading } = useCurrentLocation();

  const [showPicker, setShowPicker] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const finishOnboarding = async (params: {
    label: string;
    hasPermission: boolean;
    deliveryAreaId?: number | null;
  }) => {
    await storage.set('has_onboarded', 'true');
    await locationStorage.save({
      label: params.label,
      hasPermission: params.hasPermission,
      deliveryAreaId: params.deliveryAreaId ?? null,
    });
    if (!params.hasPermission) {
      await locationStorage.setPermission(false);
    }
    router.replace('/(tabs)');
  };

  const handleUseCurrentLocation = async () => {
    setNotice(null);
    const result = await detect();
    if (result) {
      await finishOnboarding({ label: result.label, hasPermission: true });
      return;
    }
    // Permission denied or location unavailable -> fall back to the picker.
    setNotice('We could not access your location. Please pick a delivery area instead.');
    setShowPicker(true);
  };

  const handleAreaSelected = async (area: DeliveryAreaSelection) => {
    setShowPicker(false);
    await finishOnboarding({ label: area.name, hasPermission: false, deliveryAreaId: area.id });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="location" size={40} color="#2C921D" />
        </View>

        <Text style={styles.title}>Find healthy food near you</Text>
        <Text style={styles.subtitle}>
          We serve select areas to keep meals fresh and healthy.
        </Text>

        {!!notice && <Text style={styles.notice}>{notice}</Text>}
      </View>

      <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <TouchableOpacity
          style={[styles.btnPrimary, loading && styles.btnDisabled]}
          onPress={handleUseCurrentLocation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnPrimaryText}>Use Current Location</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => setShowPicker(true)}
          disabled={loading}
        >
          <Text style={styles.btnSecondaryText}>Or Select a Pickup Point</Text>
        </TouchableOpacity>
      </View>

      <DeliveryAreaPicker
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handleAreaSelected}
        title="Select a pickup point"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#D1FADF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  notice: {
    marginTop: 24,
    fontSize: 14,
    color: '#B45309',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  btnPrimary: {
    width: '100%',
    backgroundColor: '#2C921D',
    height: 56,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  btnSecondary: {
    width: '100%',
    backgroundColor: '#fff',
    height: 56,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2C921D',
  },
  btnSecondaryText: {
    color: '#2C921D',
    fontSize: 16,
    fontWeight: '600',
  },
});
