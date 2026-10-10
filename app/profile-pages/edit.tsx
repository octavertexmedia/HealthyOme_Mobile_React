import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../src/features/auth/store/auth.store';
import { authApi } from '../../src/features/auth/api/auth.api';
import { profileDraft, profileUpdateFromDraft, type ProfileDraft } from '../../src/features/auth/profileValidation';
import type { User } from '../../src/features/auth/types/auth.types';

export default function EditProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuthStore();
  const query = useQuery({ queryKey: ['profile', user?.id], queryFn: authApi.getProfile, enabled: isAuthenticated });
  if (!isAuthenticated) return <Redirect href="/(auth)/login?redirect=/profile-pages/edit" />;
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Go back" style={styles.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>
      {query.isLoading ? <ActivityIndicator color="#2C921D" /> : query.isError || !query.data ? (
        <View style={styles.content}>
          <Text>Could not load your profile.</Text>
          <TouchableOpacity onPress={() => query.refetch()} style={styles.saveBtn}><Text style={styles.saveBtnText}>Retry</Text></TouchableOpacity>
        </View>
      ) : <ProfileForm key={query.data.id} user={query.data} />}
    </View>
  );
}

function ProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(() => profileDraft(user));
  const [loading, setLoading] = useState(false);
  const field = (name: keyof ProfileDraft, value: string) => setDraft((current) => ({ ...current, [name]: value }));
  const handleSave = async () => {
    if (loading) return;
    const parsed = profileUpdateFromDraft(draft);
    if (!parsed.data) { Alert.alert('Check your details', parsed.error); return; }
    setLoading(true);
    try {
      const updated = await authApi.updateProfile(parsed.data);
      if (useAuthStore.getState().user?.id !== user.id) return;
      useAuthStore.getState().setUser(updated);
      queryClient.setQueryData(['profile', user.id], updated);
      Alert.alert('Profile updated', 'Your changes have been saved.');
      router.back();
    } catch (error: any) {
      Alert.alert('Could not save profile', error?.response?.data?.error || error?.message || 'Please try again.');
    } finally { setLoading(false); }
  };
  const fields: { name: Exclude<keyof ProfileDraft, 'gender'>; label: string; limit?: number; multiline?: boolean; keyboard?: 'email-address' | 'number-pad' | 'decimal-pad' }[] = [
    { name: 'first_name', label: 'First name', limit: 150 },
    { name: 'last_name', label: 'Last name', limit: 150 },
    { name: 'email', label: 'Email', keyboard: 'email-address', limit: 254 },
    { name: 'date_of_birth', label: 'Date of birth (YYYY-MM-DD)', limit: 10 },
    { name: 'age', label: 'Age', keyboard: 'number-pad', limit: 3 },
    { name: 'weight_kg', label: 'Weight (kg)', keyboard: 'decimal-pad', limit: 8 },
    { name: 'goal', label: 'Health or meal goal', limit: 255 },
    { name: 'allergies', label: 'Allergies', multiline: true, limit: 5000 },
    { name: 'lifestyle', label: 'Lifestyle', limit: 255 },
    { name: 'bio', label: 'About you', multiline: true, limit: 5000 },
    { name: 'remarks', label: 'Notes for support or kitchen', multiline: true, limit: 5000 },
  ];
  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.note}>Health details are optional. Your account phone number is read-only: {user.phone_number || 'not provided'}.</Text>
      {fields.map(({ name, label, limit, multiline, keyboard }) => (
        <View key={name}>
          <Text style={styles.label}>{label}</Text>
          <TextInput accessibilityLabel={label} style={[styles.input, multiline && styles.multiline]} value={draft[name]}
            onChangeText={(value) => field(name, value)} maxLength={limit} multiline={multiline}
            keyboardType={keyboard} autoCapitalize={name === 'email' ? 'none' : 'sentences'} editable={!loading} />
        </View>
      ))}
      <Text style={styles.label}>Gender (optional)</Text>
      <View style={styles.choices}>
        {(['', 'male', 'female', 'other', 'prefer_not_to_say'] as const).map((gender) => (
          <TouchableOpacity key={gender} accessibilityRole="radio" accessibilityState={{ checked: draft.gender === gender }}
            disabled={loading} style={[styles.choice, draft.gender === gender && styles.selected]} onPress={() => field('gender', gender)}>
            <Text>{gender ? gender.replaceAll('_', ' ') : 'Not specified'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading}>
        <Text style={styles.saveBtnText}>{loading ? 'Saving…' : 'Save changes'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16 },
  backCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111' },
  content: { paddingHorizontal: 20, paddingBottom: 60 },
  note: { color: '#6B7280', lineHeight: 20, marginVertical: 12 },
  label: { fontSize: 13, color: '#4B5563', marginBottom: 6, marginTop: 16, fontWeight: '500' },
  input: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 14, minHeight: 50, fontSize: 15, color: '#111' },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, backgroundColor: '#fff' },
  selected: { borderColor: '#2C921D', backgroundColor: '#ECFDF5' },
  saveBtn: { backgroundColor: '#2C921D', minHeight: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginTop: 28 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
