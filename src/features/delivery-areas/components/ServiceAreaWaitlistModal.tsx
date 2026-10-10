import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { colors, spacing, borderRadius, typography } from '../../../shared/theme';
import { serviceAreaWaitlistApi } from '../api/serviceAreaWaitlist.api';
import { buildWaitlistPayload } from '../serviceAreaWaitlistValidation';

interface ServiceAreaWaitlistModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
  initialEmail?: string;
  initialPhone?: string;
  initialArea?: string;
}

function serverMessage(error: unknown): string {
  const response = (error as { response?: { data?: { error?: unknown } } })?.response?.data;
  return typeof response?.error === 'string'
    ? response.error
    : 'We could not save your request. Please try again.';
}

export default function ServiceAreaWaitlistModal({
  visible,
  onClose,
  onSubmitted,
  initialEmail = '',
  initialPhone = '',
  initialArea = '',
}: ServiceAreaWaitlistModalProps) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [requestedArea, setRequestedArea] = useState(initialArea);

  useEffect(() => {
    if (!visible) return;
    setEmail(initialEmail);
    setPhone(initialPhone);
    setRequestedArea(initialArea);
  }, [initialArea, initialEmail, initialPhone, visible]);

  const joinMutation = useMutation({
    mutationFn: serviceAreaWaitlistApi.join,
    onSuccess: () => {
      Alert.alert('You are on the list', 'We will contact you when HealthyOme reaches your area.');
      (onSubmitted ?? onClose)();
    },
    onError: (error) => Alert.alert('Could not join waitlist', serverMessage(error)),
  });

  const submit = () => {
    const result = buildWaitlistPayload({ email, whatsappPhone: phone, requestedArea });
    if (!result.ok) {
      Alert.alert('Check your details', result.message);
      return;
    }
    joinMutation.mutate(result.payload);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Notify me when you deliver here</Text>
              <Text style={styles.subtitle}>Share at least one way for our team to reach you.</Text>
            </View>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close waitlist form">
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Area or locality"
            placeholderTextColor={colors.text.placeholder}
            value={requestedArea}
            onChangeText={setRequestedArea}
            maxLength={200}
          />
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor={colors.text.placeholder}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="WhatsApp number"
            placeholderTextColor={colors.text.placeholder}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <TouchableOpacity
            style={[styles.submit, joinMutation.isPending && styles.disabled]}
            onPress={submit}
            disabled={joinMutation.isPending}
          >
            {joinMutation.isPending ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <Text style={styles.submitText}>Notify me</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.xl },
  headerCopy: { flex: 1, paddingRight: spacing.md },
  title: { ...typography.heading.md, color: colors.text.primary },
  subtitle: { ...typography.body.sm, color: colors.text.secondary, marginTop: spacing.xs },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    color: colors.text.primary,
    backgroundColor: colors.background,
    ...typography.body.md,
  },
  submit: {
    height: 50,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  submitText: { ...typography.button.md, color: colors.text.inverse },
  disabled: { opacity: 0.6 },
});
