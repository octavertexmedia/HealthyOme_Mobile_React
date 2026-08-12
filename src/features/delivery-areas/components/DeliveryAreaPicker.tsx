import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../../../shared/theme';
import EmptyState from '../../../shared/components/EmptyState';
import { useGroupedDeliveryAreas } from '../hooks/useDeliveryAreas';
import type { DeliveryArea } from '../api/deliveryAreas.api';

export interface DeliveryAreaSelection {
  id: number;
  name: string;
}

interface DeliveryAreaPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (area: DeliveryAreaSelection) => void;
  selectedId?: number | null;
  title?: string;
}

interface Section {
  key: string;
  heading: string;
  data: DeliveryArea[];
}

export default function DeliveryAreaPicker({
  visible,
  onClose,
  onSelect,
  selectedId,
  title = 'Select delivery area',
}: DeliveryAreaPickerProps) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, refetch, isRefetching } = useGroupedDeliveryAreas();

  const sections = useMemo<Section[]>(() => {
    const subscribed = data?.subscribed_meals ?? [];
    const quick = data?.quick_meals ?? [];
    const q = search.trim().toLowerCase();

    const match = (a: DeliveryArea) => {
      if (!q) return true;
      const inName = a.name?.toLowerCase().includes(q);
      const inPincode = (a.pincodes ?? []).some((p) => String(p).toLowerCase().includes(q));
      return inName || inPincode;
    };

    const result: Section[] = [];
    const subs = subscribed.filter(match);
    const quicks = quick.filter(match);
    if (subs.length) result.push({ key: 'subscribed', heading: 'Subscription areas', data: subs });
    if (quicks.length) result.push({ key: 'quick', heading: 'Quick meal areas', data: quicks });
    return result;
  }, [data, search]);

  const isEmpty = sections.length === 0;

  const handleSelect = (area: DeliveryArea) => {
    onSelect({ id: area.id, name: area.name });
    setSearch('');
    onClose();
  };

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.xl), maxHeight: '85%' }]}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.text.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by area or pincode"
              placeholderTextColor={colors.text.placeholder}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={colors.text.muted} />
              </TouchableOpacity>
            )}
          </View>

          {isLoading ? (
            <View style={styles.stateWrap}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.stateText}>Loading areas...</Text>
            </View>
          ) : isError ? (
            <EmptyState
              icon="cloud-offline-outline"
              title="Couldn't load areas"
              description="Please check your connection and try again."
              actionLabel="Retry"
              onAction={() => refetch()}
            />
          ) : isEmpty ? (
            <EmptyState
              icon="location-outline"
              title={search ? 'No matching areas' : 'No delivery areas'}
              description={
                search
                  ? 'Try a different area name or pincode.'
                  : 'Delivery areas are not available right now.'
              }
            />
          ) : (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {sections.map((section) => (
                <View key={section.key}>
                  <Text style={styles.sectionHeading}>{section.heading}</Text>
                  {section.data.map((area) => {
                    const selected = selectedId === area.id;
                    return (
                      <TouchableOpacity
                        key={area.id}
                        style={[styles.row, selected && styles.rowSelected]}
                        onPress={() => handleSelect(area)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.rowTextWrap}>
                          <Text style={styles.rowTitle}>{area.name}</Text>
                          {!!area.description && (
                            <Text style={styles.rowSubtitle} numberOfLines={1}>
                              {area.description}
                            </Text>
                          )}
                        </View>
                        {selected && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
              {isRefetching && (
                <View style={styles.refetchWrap}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...typography.heading.md, color: colors.text.primary },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    height: 48,
    marginBottom: spacing.lg,
  },
  searchInput: { flex: 1, ...typography.body.md, color: colors.text.primary, paddingVertical: 0 },
  stateWrap: { paddingVertical: spacing.xxxxl, alignItems: 'center', gap: spacing.md },
  stateText: { ...typography.body.md, color: colors.text.secondary },
  list: { flexGrow: 0 },
  listContent: { paddingBottom: spacing.lg },
  sectionHeading: {
    ...typography.body.xs,
    textTransform: 'uppercase',
    color: colors.text.muted,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.sm,
  },
  rowSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  rowTextWrap: { flex: 1, marginRight: spacing.md },
  rowTitle: { ...typography.body.lg, color: colors.text.primary },
  rowSubtitle: { ...typography.body.sm, color: colors.text.secondary, marginTop: 2 },
  refetchWrap: { paddingVertical: spacing.lg, alignItems: 'center' },
});
