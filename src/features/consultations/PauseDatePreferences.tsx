import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { localToday } from '../../shared/utils/calendarDates';
import { addConsultationPauseDate, PAUSE_PREFERENCES_NOTICE } from './pausePreferences';

export function PauseDatePreferences({ dates, disabled, onChange }: { dates: string[]; disabled: boolean; onChange: (dates: string[]) => void }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const add = () => {
    try { onChange(addConsultationPauseDate(dates, input, localToday())); setInput(''); setError(''); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Check the date.'); }
  };
  return <View style={styles.section}>
    <Text style={styles.title}>Pause-date preferences</Text>
    <Text style={styles.detail}>{PAUSE_PREFERENCES_NOTICE}</Text>
    <TextInput accessibilityLabel="Pause preference date" placeholder="YYYY-MM-DD" value={input} onChangeText={(value) => { setInput(value); setError(''); }}
      editable={!disabled} maxLength={10} autoCapitalize="none" style={styles.input} />
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    <TouchableOpacity accessibilityRole="button" disabled={disabled || !input.trim()} onPress={add} style={styles.row}><Text style={styles.link}>Add date to preferences</Text></TouchableOpacity>
    {dates.map((date) => <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Remove pause preference ${date}`} key={date}
      disabled={disabled} style={styles.row} onPress={() => onChange(dates.filter((value) => value !== date))}>
      <Text>{date}</Text><Text style={styles.link}>Remove</Text>
    </TouchableOpacity>)}
    <Text style={styles.detail}>{dates.length ? 'Use a save button below to save these preferences.' : 'No pause dates selected. Saving will clear any previous pause-date preferences.'}</Text>
  </View>;
}

const styles = StyleSheet.create({
  section: { marginVertical: 16 }, title: { fontSize: 16, fontWeight: '600' }, detail: { color: '#6B7280', fontSize: 13, lineHeight: 20, marginVertical: 10 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, minHeight: 48 },
  row: { minHeight: 48, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between' }, link: { color: '#2C921D', fontWeight: '600' }, error: { color: '#B91C1C', marginTop: 8 },
});
