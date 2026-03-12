import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/features/auth/store/auth.store';
import { authApi } from '../../src/features/auth/api/auth.api';
import { colors, spacing, borderRadius, typography } from '../../src/shared/theme';
import Button from '../../src/shared/components/Button';

export default function EditProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const updated = await authApi.updateProfile({ first_name: firstName, last_name: lastName, email });
      if (updated) setUser({ ...user!, first_name: firstName, last_name: lastName, email });
      Alert.alert('Success', 'Profile updated');
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={colors.primary} />
          </View>
          <TouchableOpacity><Text style={styles.changePhoto}>Change Photo</Text></TouchableOpacity>
        </View>
        <Text style={styles.label}>First Name</Text>
        <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="First Name" placeholderTextColor={colors.text.placeholder} />
        <Text style={styles.label}>Last Name</Text>
        <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Last Name" placeholderTextColor={colors.text.placeholder} />
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" placeholderTextColor={colors.text.placeholder} />
        <View style={{ marginTop: spacing.xxl }}>
          <Button title="Save Changes" onPress={handleSave} loading={loading} fullWidth size="lg" />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  headerTitle: { ...typography.heading.lg, color: colors.text.primary },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginVertical: spacing.xxl },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  changePhoto: { ...typography.body.md, color: colors.primary, marginTop: spacing.md, fontWeight: '600' },
  label: { ...typography.body.sm, color: colors.text.secondary, marginBottom: spacing.xs, marginTop: spacing.lg },
  input: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    ...typography.body.md, color: colors.text.primary,
  },
});
