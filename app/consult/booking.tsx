import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DIETICIANS = [
  { id: '1', name: 'Dr. Priya Sharma', specialty: 'Weight Management', rating: 4.9, exp: '8 yrs', price: 499 },
  { id: '2', name: 'Dr. Rahul Mehta', specialty: 'Sports Nutrition', rating: 4.8, exp: '6 yrs', price: 449 },
  { id: '3', name: 'Dr. Anita Roy', specialty: 'Diabetes Care', rating: 4.9, exp: '10 yrs', price: 549 },
];

const TIME_SLOTS = ['10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];

export default function ConsultBookingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const handleBook = () => {
    if (!selectedDoc || !selectedSlot) {
      Alert.alert('Please select', 'Choose a dietician and time slot');
      return;
    }
    Alert.alert('Booking Confirmed!', `Your consultation is booked for ${selectedSlot}. We'll send you a confirmation soon.`, [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Consultation</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ─── Select Dietician ─── */}
        <Text style={styles.sectionTitle}>Choose a Dietician</Text>
        {DIETICIANS.map((doc) => (
          <TouchableOpacity
            key={doc.id}
            style={[styles.docCard, selectedDoc === doc.id && styles.docCardSelected]}
            activeOpacity={0.8}
            onPress={() => setSelectedDoc(doc.id)}
          >
            <View style={styles.docAvatar}>
              <Text style={{ fontSize: 28 }}>👩‍⚕️</Text>
            </View>
            <View style={styles.docInfo}>
              <Text style={styles.docName}>{doc.name}</Text>
              <Text style={styles.docSpecialty}>{doc.specialty} · {doc.exp}</Text>
              <View style={styles.docMeta}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.docRating}>{doc.rating}</Text>
                <Text style={styles.docPrice}>· ₹{doc.price}/session</Text>
              </View>
            </View>
            {selectedDoc === doc.id && (
              <View style={styles.selectedCheck}>
                <Ionicons name="checkmark-circle" size={24} color="#4B8E3D" />
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* ─── Select Time Slot ─── */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Pick a Time Slot</Text>
        <Text style={styles.sectionSubtitle}>Today, {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</Text>

        <View style={styles.slotsGrid}>
          {TIME_SLOTS.map((slot) => (
            <TouchableOpacity
              key={slot}
              style={[styles.slotChip, selectedSlot === slot && styles.slotChipSelected]}
              onPress={() => setSelectedSlot(slot)}
            >
              <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextSelected]}>
                {slot}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Book Button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.bookBtn, (!selectedDoc || !selectedSlot) && styles.bookBtnDisabled]}
          onPress={handleBook}
          activeOpacity={0.9}
        >
          <Text style={styles.bookBtnText}>
            Confirm Booking{selectedDoc ? ` · ₹${DIETICIANS.find(d => d.id === selectedDoc)?.price}` : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7F8' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#111' },

  scrollContent: { padding: 16 },

  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#111', marginBottom: 6 },
  sectionSubtitle: { fontSize: 13, color: '#9CA3AF', marginBottom: 14 },

  docCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12,
    borderWidth: 2, borderColor: 'transparent',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  docCardSelected: { borderColor: '#4B8E3D', backgroundColor: '#F0FFF4' },
  docAvatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#EAF7FD',
    alignItems: 'center', justifyContent: 'center',
  },
  docInfo: { flex: 1 },
  docName: { fontSize: 16, fontWeight: '600', color: '#111' },
  docSpecialty: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  docMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  docRating: { fontSize: 12, fontWeight: '600', color: '#111' },
  docPrice: { fontSize: 12, color: '#6B7280' },
  selectedCheck: { marginLeft: 'auto' as any },

  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB',
  },
  slotChipSelected: { backgroundColor: '#4B8E3D', borderColor: '#4B8E3D' },
  slotText: { fontSize: 13, fontWeight: '500', color: '#374151' },
  slotTextSelected: { color: '#fff' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6',
    paddingHorizontal: 16, paddingTop: 16,
  },
  bookBtn: {
    backgroundColor: '#4B8E3D', borderRadius: 999, paddingVertical: 18, alignItems: 'center',
  },
  bookBtnDisabled: { backgroundColor: '#9CA3AF' },
  bookBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
