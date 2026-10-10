import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authApi } from '../../src/features/auth/api/auth.api';
import { useAuthStore } from '../../src/features/auth/store/auth.store';
import { colors, spacing, borderRadius, typography } from '../../src/shared/theme';
import Button from '../../src/shared/components/Button';
import { safeAuthRedirect } from '../../src/features/auth/authRedirect';
import { BrandLockup } from '../../src/shared/components/BrandLockup';
import { PlatformIcon } from '../../src/shared/components/PlatformIcon';

export default function VerifyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    phone?: string;
    email?: string;
    mode?: string;
    redirect?: string | string[];
  }>();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (newOtp.every(d => d !== '') && newOtp.join('').length === 6) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    if (code.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response =
        params.mode === 'email'
          ? await authApi.verifyEmailOTP(params.email || '', code)
          : await authApi.verifyOTP(params.phone || '', code);

      const access = response?.tokens?.access;
      const refresh = response?.tokens?.refresh;

      if (!access || !refresh || !response.user) {
        Alert.alert('Error', 'Verification failed — please try again');
        return;
      }

      await setAuth(response.user, access, refresh);
      router.dismissAll();
      router.replace((safeAuthRedirect(params.redirect) ?? '/(tabs)') as any);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      if (params.mode === 'email') {
        await authApi.resendEmailOTP(params.email || '');
      } else {
        await authApi.resendOTP(params.phone || '');
      }
      setCountdown(30);
      Alert.alert('OTP Sent', 'A new OTP has been sent');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Failed to resend OTP');
    }
  };

  const identifier = params.mode === 'email' ? params.email : params.phone;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back to sign in" style={styles.backButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)/login')}>
          <PlatformIcon name="back" color={colors.text.primary} />
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginBottom: 24 }}><BrandLockup /></View>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{'\n'}
          <Text style={styles.identifier}>{identifier}</Text>
        </Text>

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[styles.otpInput, digit && styles.otpInputFilled]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value.slice(-1), index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Resend */}
        <View style={styles.resendContainer}>
          {countdown > 0 ? (
            <Text style={styles.resendCountdown}>Resend OTP in {countdown}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>

        <Button
          title="Verify"
          onPress={() => handleVerify()}
          loading={loading}
          fullWidth
          size="lg"
          disabled={otp.some(d => d === '')}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.xxl },
  backButton: { padding: spacing.sm, alignSelf: 'flex-start', marginTop: spacing.md },
  title: { ...typography.heading.xl, color: colors.text.primary, marginTop: spacing.xxxl },
  subtitle: { ...typography.body.lg, color: colors.text.secondary, marginTop: spacing.md, lineHeight: 24 },
  identifier: { color: colors.text.primary, fontWeight: '600' },
  otpContainer: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xxxxl, gap: spacing.sm,
  },
  otpInput: {
    width: 48, height: 56, borderRadius: borderRadius.lg, borderWidth: 1.5,
    borderColor: colors.border, backgroundColor: colors.surface,
    textAlign: 'center', fontSize: 22, fontWeight: '700', color: colors.text.primary,
  },
  otpInputFilled: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  resendContainer: { alignItems: 'center', marginVertical: spacing.xxl },
  resendCountdown: { ...typography.body.md, color: colors.text.muted },
  resendLink: { ...typography.body.lg, color: colors.primary, fontWeight: '600' },
});
