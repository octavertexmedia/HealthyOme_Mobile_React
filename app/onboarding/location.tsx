import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../src/shared/storage/mmkv';

export default function LocationPermissionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleComplete = () => {
    // Mark onboarding flags
    storage.set('has_onboarded', 'true');
    storage.set('has_location_permission', 'true');
    router.replace('/(tabs)');
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
      </View>

      <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <TouchableOpacity style={styles.btnPrimary} onPress={handleComplete}>
          <Text style={styles.btnPrimaryText}>Use Current Location</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnSecondary} onPress={handleComplete}>
          <Text style={styles.btnSecondaryText}>Or Select a Pickup Point</Text>
        </TouchableOpacity>
      </View>
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
