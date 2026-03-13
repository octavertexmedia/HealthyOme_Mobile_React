import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, Alert, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authApi } from '../../src/features/auth/api/auth.api';
import { colors, spacing, borderRadius, typography } from '../../src/shared/theme';
import Button from '../../src/shared/components/Button';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (mode === 'phone') {
      if (!phone || phone.length < 10) {
        Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number');
        return;
      }
    } else {
      if (!email || !email.includes('@')) {
        Alert.alert('Invalid Email', 'Please enter a valid email address');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'phone') {
        const phoneNum = phone.startsWith('+91') ? phone : `+91${phone}`;
        await authApi.sendOTP(phoneNum);
        router.push({ pathname: '/(auth)/verify', params: { phone: phoneNum, mode: 'phone' } });
      } else {
        await authApi.sendEmailOTP(email);
        router.push({ pathname: '/(auth)/verify', params: { email, mode: 'email' } });
      }
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[colors.background, colors.primaryGradientEnd]}
        style={[styles.gradient, { paddingTop: insets.top }]}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => { router.dismissAll(); router.replace('/(tabs)'); }}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>

          {/* Logo & Welcome */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <Ionicons name="leaf" size={48} color={colors.primary} />
            </View>
            <Text style={styles.title}>Welcome to{'\n'}Healthy-O-Me</Text>
            <Text style={styles.subtitle}>Sign in to order healthy meals, manage subscriptions, and earn rewards</Text>
          </View>

          {/* Auth Mode Toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'phone' && styles.modeButtonActive]}
              onPress={() => setMode('phone')}
            >
              <Ionicons name="call" size={16} color={mode === 'phone' ? '#fff' : colors.text.secondary} />
              <Text style={[styles.modeText, mode === 'phone' && styles.modeTextActive]}>Phone</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'email' && styles.modeButtonActive]}
              onPress={() => setMode('email')}
            >
              <Ionicons name="mail" size={16} color={mode === 'email' ? '#fff' : colors.text.secondary} />
              <Text style={[styles.modeText, mode === 'email' && styles.modeTextActive]}>Email</Text>
            </TouchableOpacity>
          </View>

          {/* Input */}
          <View style={styles.inputSection}>
            {mode === 'phone' ? (
              <View style={styles.phoneInputContainer}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Enter phone number"
                  placeholderTextColor={colors.text.placeholder}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            ) : (
              <View style={styles.emailInputContainer}>
                <Ionicons name="mail-outline" size={20} color={colors.text.disabled} />
                <TextInput
                  style={styles.emailInput}
                  placeholder="Enter email address"
                  placeholderTextColor={colors.text.placeholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            )}
          </View>

          {/* Send OTP Button */}
          <View style={styles.buttonSection}>
            <Button
              title={loading ? 'Sending...' : 'Send OTP'}
              onPress={handleSendOTP}
              loading={loading}
              fullWidth
              size="lg"
            />
          </View>

          <Text style={styles.terms}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.xxl, paddingBottom: spacing.xxxxl },
  backButton: { alignSelf: 'flex-start', padding: spacing.sm, marginTop: spacing.md },
  headerSection: { marginTop: spacing.xxxxl, marginBottom: spacing.xxxl },
  logoContainer: {
    width: 80, height: 80, borderRadius: borderRadius.xl, backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xxl,
  },
  title: { ...typography.heading.xl, color: colors.text.primary, fontSize: 28, lineHeight: 36 },
  subtitle: { ...typography.body.lg, color: colors.text.secondary, marginTop: spacing.md, lineHeight: 24 },
  modeToggle: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: 4, marginBottom: spacing.xxl, borderWidth: 1, borderColor: colors.border,
  },
  modeButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.md, borderRadius: borderRadius.md, gap: spacing.sm,
  },
  modeButtonActive: { backgroundColor: colors.primary },
  modeText: { ...typography.button.md, color: colors.text.secondary },
  modeTextActive: { color: '#fff' },
  inputSection: { marginBottom: spacing.xxl },
  phoneInputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  countryCode: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.lg,
    borderRightWidth: 1, borderRightColor: colors.border, backgroundColor: colors.divider,
  },
  countryCodeText: { ...typography.body.lg, color: colors.text.primary },
  phoneInput: { flex: 1, ...typography.body.lg, paddingHorizontal: spacing.lg, color: colors.text.primary },
  emailInputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.lg, gap: spacing.sm,
  },
  emailInput: { flex: 1, ...typography.body.lg, paddingVertical: spacing.lg, color: colors.text.primary },
  buttonSection: { marginBottom: spacing.xxl },
  terms: { ...typography.body.sm, color: colors.text.muted, textAlign: 'center', lineHeight: 20 },
  termsLink: { color: colors.primary, fontWeight: '600' },
});
