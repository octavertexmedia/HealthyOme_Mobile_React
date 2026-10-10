import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SubscriptionDateAction } from './pauseDatePolicy';

export function SubscriptionDatePicker({ action, dates, busy, onSubmit, onClose }: {
  action: SubscriptionDateAction; dates: string[]; busy: boolean;
  onSubmit: (dates: string[]) => void; onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string[]>([]);
  const validSelected = selected.filter((date) => dates.includes(date));
  const verb = action === 'pause' ? 'Pause' : 'Resume';
  return <Modal visible transparent animationType="slide" onRequestClose={() => { if (!busy) onClose(); }}>
    <View style={styles.backdrop}><View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
      <Text style={styles.title}>{verb} selected deliveries</Text>
      <Text style={styles.detail}>{action === 'pause' ? 'Choose upcoming open delivery dates. Today’s meals cannot be paused.' : 'Only selected paused dates will resume. Other paused dates will stay paused.'} The server confirms the updated schedule.</Text>
      <ScrollView style={styles.list}>
        {!dates.length ? <Text style={styles.detail}>No eligible delivery dates are available.</Text> : dates.map((date) => {
          const checked = validSelected.includes(date);
          return <TouchableOpacity key={date} accessibilityRole="checkbox" accessibilityLabel={date}
            accessibilityState={{ checked, disabled: busy }} disabled={busy} style={[styles.row, checked && styles.selected]}
            onPress={() => setSelected((current) => checked ? current.filter((value) => value !== date) : [...current, date])}>
            <Text>{checked ? '✓  ' : '○  '}{date}</Text>
          </TouchableOpacity>;
        })}
      </ScrollView>
      <TouchableOpacity accessibilityRole="button" disabled={busy || !validSelected.length}
        style={[styles.button, (busy || !validSelected.length) && styles.disabled]} onPress={() => onSubmit(validSelected)}>
        <Text style={styles.buttonText}>{busy ? 'Updating…' : `${verb} selected dates (${validSelected.length})`}</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" disabled={busy} style={styles.row} onPress={onClose}><Text>Cancel</Text></TouchableOpacity>
    </View></View>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  title: { fontSize: 20, fontWeight: '700' }, detail: { color: '#6B7280', lineHeight: 21, marginVertical: 12 },
  list: { maxHeight: 340 }, row: { padding: 16, minHeight: 48, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  selected: { backgroundColor: '#EFF8EC' }, button: { backgroundColor: '#2C921D', borderRadius: 24, padding: 16, marginTop: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' }, disabled: { opacity: 0.5 },
});
