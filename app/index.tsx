import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { storage } from '../src/shared/storage/mmkv';
import { BrandLockup } from '../src/shared/components/BrandLockup';

export default function SplashScreen() {
  const router = useRouter();
  useEffect(() => {
    let mounted = true;

    const checkOnboarding = async () => {
      // Simulate splash screen delay so user can see the logo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!mounted) return;

      const hasOnboardedStr = await storage.getString('has_onboarded');
      if (!mounted) return;

      if (hasOnboardedStr !== 'true') {
        router.replace('/onboarding' as any);
      } else {
        router.replace('/(tabs)');
      }
    };

    void checkOnboarding().catch(() => { if (mounted) router.replace('/(tabs)'); });
    return () => { mounted = false; };
  }, [router]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.logoContainer}>
        <BrandLockup />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#fff' 
  },
  logoContainer: {
    width: 235,
    height: 284,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  }
});
