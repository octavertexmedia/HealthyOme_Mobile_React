import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

/** No navigation or login artwork: one original brand mark while bootstrapping. */
export function StartupScreen({ failed = false, onRetry }: { failed?: boolean; onRetry?: () => void }) {
  return <View style={styles.screen} testID="startup-screen">
    <Image source={require('../../../assets/images/branding/healthyome-logo.png')} resizeMode="contain"
      accessibilityLabel="HealthyOme" style={styles.brand} />
    {failed && <View style={styles.error}>
      <Text accessibilityRole="alert" style={styles.message}>Could not finish starting the app. Please try again.</Text>
      <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}>
        <Text style={styles.retryText}>Retry startup</Text>
      </Pressable>
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 24 },
  brand: { width: 160, height: 190 },
  error: { position: 'absolute', bottom: 72, left: 24, right: 24, alignItems: 'center', gap: 16 },
  message: { color: '#49544B', textAlign: 'center' },
  retry: { minHeight: 48, paddingHorizontal: 24, justifyContent: 'center', borderRadius: 12, backgroundColor: '#34732D' },
  retryText: { color: '#fff', fontWeight: '700' },
});
