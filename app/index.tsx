import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { storage } from '../src/shared/storage/mmkv';

export default function SplashScreen() {
  const router = useRouter();
  useEffect(() => {
    let mounted = true;

    const checkOnboarding = async () => {
      // Simulate splash screen delay so user can see the logo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!mounted) return;

      const hasOnboardedStr = await storage.getString('has_onboarded');
      const hasLocationPermissionStr = await storage.getString('has_location_permission');

      if (hasOnboardedStr !== 'true') {
        router.replace('/onboarding' as any);
      } else if (hasLocationPermissionStr !== 'true') {
        router.replace('/onboarding/location' as any);
      } else {
        router.replace('/(tabs)');
      }
    };

    checkOnboarding();
    return () => { mounted = false; };
  }, [router]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.logoContainer}>
        {/* We reuse the logo from the header or any central asset */}
        <Image 
          source={require('../assets/images/healthy0me-logo.webp')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
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
