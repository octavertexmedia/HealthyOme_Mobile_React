import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCartStore } from '../../src/features/cart/store/cart.store';
import { useAuthStore } from '../../src/features/auth/store/auth.store';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/shared/theme';
import { formatPrice } from '../../src/shared/utils/helpers';
import Button from '../../src/shared/components/Button';

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, totalPrice, clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [coupon, setCoupon] = useState('');
  const [loading, setLoading] = useState(false);

  const deliveryFee = totalPrice > 200 ? 0 : 30;
  const grandTotal = totalPrice + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    if (!address.trim()) { Alert.alert('Error', 'Please enter delivery address'); return; }
    if (!phone.trim() || phone.length < 10) { Alert.alert('Error', 'Please enter valid phone number'); return; }

    setLoading(true);
    try {
      // In production, call ordersApi.placeOrder()
      setTimeout(() => {
        clearCart();
        setLoading(false);
        Alert.alert('🎉 Order Placed!', 'Your order has been placed successfully', [
          { text: 'View Orders', onPress: () => { router.dismissAll(); router.push('/(tabs)/orders'); } },
        ]);
      }, 1500);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to place order');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Enter your full delivery address"
            placeholderTextColor={colors.text.placeholder}
            multiline
            numberOfLines={3}
            value={address}
            onChangeText={setAddress}
          />
        </View>

        {/* Phone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter phone number"
            placeholderTextColor={colors.text.placeholder}
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        {/* Special Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions (Optional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Any special requests?"
            placeholderTextColor={colors.text.placeholder}
            multiline
            numberOfLines={2}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Coupon */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coupon Code</Text>
          <View style={styles.couponRow}>
            <TextInput
              style={styles.couponInput}
              placeholder="Enter coupon code"
              placeholderTextColor={colors.text.placeholder}
              value={coupon}
              onChangeText={setCoupon}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.applyBtn}>
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.summaryItem}>
              <Text style={styles.summaryItemName}>{item.name} × {item.qty}</Text>
              <Text style={styles.summaryItemPrice}>{formatPrice(item.price * item.qty)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatPrice(totalPrice)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={[styles.summaryValue, deliveryFee === 0 && { color: colors.primary }]}>
              {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(grandTotal)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          title={`Place Order · ${formatPrice(grandTotal)}`}
          onPress={handlePlaceOrder}
          loading={loading}
          fullWidth
          size="lg"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  headerTitle: { ...typography.heading.lg, color: colors.text.primary },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 120 },
  section: { marginBottom: spacing.xxl },
  sectionTitle: { ...typography.heading.sm, color: colors.text.primary, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    ...typography.body.md, color: colors.text.primary,
  },
  textArea: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    ...typography.body.md, color: colors.text.primary, minHeight: 80, textAlignVertical: 'top',
  },
  couponRow: { flexDirection: 'row', gap: spacing.md },
  couponInput: {
    flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.lg,
    ...typography.body.md, color: colors.text.primary,
  },
  applyBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl, justifyContent: 'center',
  },
  applyBtnText: { ...typography.button.md, color: '#fff' },
  summaryCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.xl,
    borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },
  summaryTitle: { ...typography.heading.md, color: colors.text.primary, marginBottom: spacing.lg },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  summaryItemName: { ...typography.body.md, color: colors.text.secondary, flex: 1 },
  summaryItemPrice: { ...typography.body.md, color: colors.text.primary, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  summaryLabel: { ...typography.body.md, color: colors.text.secondary },
  summaryValue: { ...typography.body.md, color: colors.text.primary, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: spacing.md, marginTop: spacing.sm, marginBottom: 0 },
  totalLabel: { ...typography.heading.md, color: colors.text.primary },
  totalValue: { ...typography.heading.md, color: colors.primary },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg,
  },
});
