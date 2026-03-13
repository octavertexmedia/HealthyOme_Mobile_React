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
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#2C921D" />
          </View>
          <TouchableOpacity><Text style={styles.changePhoto}>Change Photo</Text></TouchableOpacity>
        </View>
        <Text style={styles.label}>First Name</Text>
        <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="First Name" placeholderTextColor="#9CA3AF" />
        <Text style={styles.label}>Last Name</Text>
        <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Last Name" placeholderTextColor="#9CA3AF" />
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#9CA3AF" />
        <View style={{ marginTop: 32 }}>
          <TouchableOpacity 
            style={[styles.saveBtn, loading && { opacity: 0.7 }]}
            onPress={handleSave} 
            disabled={loading}
          >
            <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 20, paddingBottom: 16 
  },
  backCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center'
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginVertical: 32 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' },
  changePhoto: { fontSize: 14, color: '#2C921D', marginTop: 12, fontWeight: '600' },
  label: { fontSize: 13, color: '#6B7280', marginBottom: 6, marginTop: 16, fontWeight: '500' },
  input: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', 
    paddingHorizontal: 16, height: 50, fontSize: 15, color: '#111',
  },
  saveBtn: {
    backgroundColor: '#2C921D', height: 52, borderRadius: 999, justifyContent: 'center', alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
