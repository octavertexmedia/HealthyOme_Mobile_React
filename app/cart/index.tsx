import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCartStore } from '../../src/features/cart/store/cart.store';
import { useCheckoutQuote } from '../../src/features/cart/hooks/useCheckoutQuote';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/shared/theme';
import { formatPrice, getImageUrl } from '../../src/shared/utils/helpers';
import EmptyState from '../../src/shared/components/EmptyState';
import Button from '../../src/shared/components/Button';

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, totalItems, totalPrice, updateQuantity, clearCart } = useCartStore();
  const { data: quote } = useCheckoutQuote();

  // Prefer server-authoritative totals (SiteSettings thresholds + payable_total).
  // Fall back to a local estimate while logged-out / loading / bowl-only cart.
  const freeShippingThreshold = quote?.free_shipping_threshold ?? 200;
  const subtotal = quote?.subtotal ?? totalPrice;
  const deliveryFee =
    quote?.shipping ?? (totalPrice > freeShippingThreshold ? 0 : 30);
  const discount = quote?.discount ?? 0;
  const grandTotal = quote?.payable_total ?? subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cart</Text>
          <View style={{ width: 24 }} />
        </View>
        <EmptyState
          icon="cart-outline"
          title="Your cart is empty"
          description="Add meals from the menu to get started"
          actionLabel="Browse Menu"
          onAction={() => router.push('/(tabs)/menu')}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart ({totalItems})</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <View style={styles.cartItemImage}>
              {item.image ? (
                <Image source={{ uri: getImageUrl(item.image) }} style={styles.cartImg} />
              ) : (
                <View style={styles.cartImgFallback}>
                  <Ionicons name="restaurant" size={20} color={colors.text.disabled} />
                </View>
              )}
            </View>
            <View style={styles.cartItemInfo}>
              <Text style={styles.cartItemName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.cartItemPrice}>{formatPrice(item.price)}</Text>
            </View>
            <View style={styles.cartItemActions}>
              <View style={styles.qtyControl}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, item.qty - 1)}>
                  <Ionicons name={item.qty === 1 ? 'trash-outline' : 'remove'} size={14} color={item.qty === 1 ? colors.status.error : colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.qty}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, item.qty + 1)}>
                  <Ionicons name="add" size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.cartItemTotal}>{formatPrice(item.price * item.qty)}</Text>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.summarySection}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={[styles.summaryValue, styles.freeText]}>−{formatPrice(discount)}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              <Text style={[styles.summaryValue, deliveryFee === 0 && styles.freeText]}>
                {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
              </Text>
            </View>
            {deliveryFee > 0 && subtotal < freeShippingThreshold && (
              <Text style={styles.freeDeliveryHint}>Add {formatPrice(freeShippingThreshold - subtotal)} more for free delivery</Text>
            )}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(grandTotal)}</Text>
            </View>
          </View>
        }
      />

      {/* Checkout Button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          title={`Proceed to Checkout · ${formatPrice(grandTotal)}`}
          onPress={() => router.push('/checkout')}
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
  clearText: { ...typography.body.md, color: colors.status.error },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 120 },
  cartItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    padding: spacing.md, borderRadius: borderRadius.xl, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border, gap: spacing.md, ...shadows.sm,
  },
  cartItemImage: { width: 64, height: 64, borderRadius: borderRadius.md, overflow: 'hidden' },
  cartImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  cartImgFallback: { width: '100%', height: '100%', backgroundColor: colors.divider, justifyContent: 'center', alignItems: 'center' },
  cartItemInfo: { flex: 1 },
  cartItemName: { ...typography.body.md, color: colors.text.primary, fontWeight: '600' },
  cartItemPrice: { ...typography.body.sm, color: colors.text.muted, marginTop: 2 },
  cartItemActions: { alignItems: 'flex-end', gap: spacing.sm },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.divider, borderRadius: borderRadius.full, padding: 2,
  },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  qtyText: { ...typography.body.sm, color: colors.text.primary, fontWeight: '600', minWidth: 20, textAlign: 'center' },
  cartItemTotal: { ...typography.heading.sm, color: colors.text.primary },
  summarySection: {
    backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.xl,
    marginTop: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md,
  },
  summaryLabel: { ...typography.body.md, color: colors.text.secondary },
  summaryValue: { ...typography.body.md, color: colors.text.primary, fontWeight: '600' },
  freeText: { color: colors.primary },
  freeDeliveryHint: { ...typography.body.sm, color: colors.accent.orange, marginBottom: spacing.md },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: spacing.md, marginBottom: 0 },
  totalLabel: { ...typography.heading.md, color: colors.text.primary },
  totalValue: { ...typography.heading.md, color: colors.primary },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg,
  },
});
