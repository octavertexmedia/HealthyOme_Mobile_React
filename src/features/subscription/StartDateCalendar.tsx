import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export function calendarDates(year: number, month: number) {
  const offset = (new Date(year, month, 1, 12).getDay() + 6) % 7;
  return [...Array<string | null>(offset).fill(null), ...Array.from({ length: new Date(year, month + 1, 0, 12).getDate() }, (_, day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day + 1).padStart(2, '0')}`)];
}
export function StartDateCalendar({ value, minimum, onChange }: { value: string; minimum: string; onChange: (date: string) => void }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => new Date(`${value || minimum}T12:00:00`));
  const move = (offset: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + offset, 1, 12));
  return <View style={{ gap: 12 }}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Choose subscription start date" onPress={() => setOpen(!open)} style={{ padding: 14, borderWidth: 1, borderColor: '#D5DDD0', borderRadius: 12 }}><Text>{value} ▾</Text></TouchableOpacity>
    {open && <View style={{ padding: 12, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#D5DDD0' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => move(-1)} style={{ padding: 14 }}><Text>‹</Text></TouchableOpacity>
        <Text>{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Next month" onPress={() => move(1)} style={{ padding: 14 }}><Text>›</Text></TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row' }}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => <Text key={index} style={{ width: '14.2857%', textAlign: 'center' }}>{label}</Text>)}</View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{calendarDates(month.getFullYear(), month.getMonth()).map((date, index) => {
        const disabled = !date || date < minimum || new Date(`${date}T12:00:00`).getDay() === 0;
        return <TouchableOpacity key={date || `gap-${index}`} accessibilityRole="button" accessibilityLabel={date || 'Empty day'} accessibilityState={{ disabled, selected: date === value }} disabled={disabled}
          onPress={() => { if (date) { onChange(date); setOpen(false); } }} style={{ width: '14.2857%', minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: date === value ? '#E7F5E3' : '#fff', opacity: disabled ? 0.35 : 1 }}><Text>{date ? Number(date.slice(-2)) : ''}</Text></TouchableOpacity>;
      })}</View>
      <Text style={{ fontSize: 12, color: '#687281' }}>Sundays are closed. The server confirms delivery availability.</Text>
    </View>}
  </View>;
}
