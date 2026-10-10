import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, findNodeHandle, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { initialWindowMetrics, SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import PlanMenuContent, { type MenuFilters, type MenuSelection } from './PlanMenuContent';

export function dismissMenuGesture(distance: number, velocity: number) {
  return distance > 80 || (distance > 12 && velocity > 0.8);
}
type Props = { visible: boolean; selection: MenuSelection; onClose: () => void; onAfterClose?: () => void };
export default function PlanMenuSheet({ visible, selection, onClose, onAfterClose }: Props) {
  // State lives outside the native Modal so dismissal never loses the customer's filters.
  const identity = JSON.stringify(selection);
  const [saved, setSaved] = useState<{ identity: string; filters: MenuFilters }>({ identity, filters: {} });
  const filters = saved.identity === identity ? saved.filters : {};
  const heading = useRef<React.ComponentRef<typeof Text>>(null);
  const wasOpen = useRef(visible);
  useEffect(() => {
    if (visible) { wasOpen.current = true; return; }
    if (!wasOpen.current) return;
    wasOpen.current = false;
    const timer = setTimeout(() => onAfterClose?.(), 400);
    return () => clearTimeout(timer);
  }, [visible, onAfterClose]);
  return <Modal testID="day-menu-modal" visible={visible} transparent animationType="slide" presentationStyle="overFullScreen"
    statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}
    onShow={() => { const node = findNodeHandle(heading.current); if (node) AccessibilityInfo.setAccessibilityFocus(node); }}>
    {/* CustomerShell consumes route insets. A native modal needs its own real window insets. */}
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <MenuSurface visible={visible} onClose={onClose} heading={heading}>
        <PlanMenuContent visible={visible} selection={selection} filters={filters}
          onSelect={(patch) => setSaved({ identity, filters: { ...filters, ...patch } })} />
      </MenuSurface>
    </SafeAreaProvider>
  </Modal>;
}
function MenuSurface({ visible, onClose, heading, children }: {
  visible: boolean; onClose: () => void; heading: React.RefObject<React.ComponentRef<typeof Text> | null>; children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const offset = useRef(new Animated.Value(0)).current;
  useEffect(() => { if (visible) offset.setValue(0); }, [visible, offset]);
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onMoveShouldSetPanResponderCapture: (_, gesture) => gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => offset.stopAnimation(),
    onPanResponderMove: (_, gesture) => offset.setValue(Math.max(0, gesture.dy)),
    onPanResponderRelease: (_, gesture) => {
      if (dismissMenuGesture(gesture.dy, gesture.vy)) onClose();
      else Animated.spring(offset, { toValue: 0, useNativeDriver: true }).start();
    },
    onPanResponderTerminate: () => Animated.spring(offset, { toValue: 0, useNativeDriver: true }).start(),
  }), [offset, onClose]);
  return <View style={styles.overlay}>
    <Pressable testID="menu-backdrop" accessibilityRole="button" accessibilityLabel="Dismiss day-wise menu" onPress={onClose} style={StyleSheet.absoluteFill} />
    <Animated.View testID="day-menu-sheet" accessibilityViewIsModal onAccessibilityEscape={onClose}
      style={[styles.sheet, { height: height * 0.86, maxHeight: Math.max(180, height - insets.top - 24), paddingLeft: insets.left, paddingRight: insets.right, transform: [{ translateY: offset }] }]}>
      <View testID="menu-drag-handle" collapsable={false} {...pan.panHandlers} style={styles.header}>
        <View style={styles.grabber} />
        <View style={styles.titleRow}>
          <Text ref={heading} accessibilityRole="header" style={styles.title}>Day-wise menu</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Close day-wise menu" onPress={onClose} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>
        </View>
      </View>
      <ScrollView nestedScrollEnabled contentContainerStyle={[styles.body, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>{children}</ScrollView>
    </Animated.View>
  </View>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000066' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  header: { paddingHorizontal: 16, paddingTop: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  grabber: { height: 4, width: 40, borderRadius: 2, backgroundColor: '#AFB8AC', alignSelf: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
  title: { color: '#183829', fontSize: 19, fontWeight: '700', flex: 1 },
  close: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }, closeText: { fontSize: 30, color: '#4B5563' },
  body: { paddingHorizontal: 16, paddingTop: 12 },
});
