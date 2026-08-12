import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useCartStore } from '../../src/features/cart/store/cart.store';
import { useCheckoutQuote } from '../../src/features/cart/hooks/useCheckoutQuote';
import { useAuthStore } from '../../src/features/auth/store/auth.store';
import { addressesApi } from '../../src/features/addresses/api/addresses.api';
import { usePayment } from '../../src/features/payments/hooks/usePayment';
import type { CreateOrderItem } from '../../src/features/payments/api/payments.api';

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, totalPrice, clearCart, updateQuantity } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const { pay, loading: paying } = usePayment();

  const [placing, setPlacing] = useState(false);
  const [includeCutlery, setIncludeCutlery] = useState(false);
  const [sendWhatsAppUpdates, setSendWhatsAppUpdates] = useState(true);

  const addressesQuery = useQuery({
    queryKey: ['addresses'],
    queryFn: addressesApi.list,
    enabled: isAuthenticated,
  });

  const defaultAddress = useMemo(() => {
    const list = addressesQuery.data ?? [];
    return list.find((a) => a.is_default) ?? list[0];
  }, [addressesQuery.data]);

  const email = ((user as any)?.email as string | undefined) ?? '';

  // Server-authoritative totals (subtotal / shipping / discount / payable_total).
  // Falls back to the local estimate while loading / logged-out / bowl-only.
  const { data: quote } = useCheckoutQuote();
  const itemTotal = quote?.subtotal ?? totalPrice;
  const discount = quote?.discount ?? 0;
  const shipping = quote?.shipping ?? 0;
  const payable = quote?.payable_total ?? totalPrice;

  // Only meal & snack lines are server-quotable; custom bowls are skipped here.
  const orderLines = useMemo<CreateOrderItem[]>(() => {
    const lines: CreateOrderItem[] = [];
    for (const it of items) {
      if (/^\d+$/.test(it.id)) {
        lines.push({ meal_item_id: parseInt(it.id, 10), quantity: it.qty });
      } else if (it.id.startsWith('snack-')) {
        const snackId = parseInt(it.id.slice('snack-'.length), 10);
        if (Number.isFinite(snackId)) lines.push({ snack_item_id: snackId, quantity: it.qty });
      }
    }
    return lines;
  }, [items]);

  const startCheckout = async () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login' as any);
      return;
    }
    if (items.length === 0) return;
    if (!defaultAddress) {
      Alert.alert('Add a delivery address', 'Please save an address before placing an order.', [
        { text: 'Add address', onPress: () => router.push('/profile-pages/addresses' as any) },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    if (!email) {
      Alert.alert('Add your email', 'We need an email on your profile to send the order receipt.', [
        { text: 'Add email', onPress: () => router.push('/profile-pages/edit' as any) },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    if (orderLines.length === 0) {
      Alert.alert('Nothing to checkout', 'Your cart has no orderable meal or snack items.');
      return;
    }

    setPlacing(true);
    try {
      // Razorpay-only: create-order derives the authoritative amount; the order
      // rows are created by verify (or complete-zero-order for a ₹0 coupon).
      const payRes = await pay({
        kind: 'cart',
        order: {
          items: orderLines,
          address_id: defaultAddress.id,
          email,
        },
        fulfillment: {
          address_id: defaultAddress.id,
          email,
          delivery_instructions: 'Hand it to me',
          notes: includeCutlery ? 'Include cutlery' : '',
          whatsapp_updates: sendWhatsAppUpdates,
        },
      });

      if (payRes.status === 'paid') {
        const orderId = payRes.order_ids[0];
        clearCart();
        Alert.alert('Order placed', 'Payment successful — your meal is on the way!', [
          {
            text: 'View order',
            onPress: () => {
              router.dismissAll();
              if (orderId) router.push(`/orders/my/${orderId}` as any);
              else router.push('/(tabs)/orders' as any);
            },
          },
        ]);
      } else if (payRes.status === 'cancelled') {
        Alert.alert('Payment cancelled', 'No charge was made. You can try again anytime.');
      } else if (payRes.error === 'payment_sdk_missing') {
        Alert.alert(
          'Update required',
          'Online payment needs the latest app build. Please update the app to complete checkout.'
        );
      } else if (payRes.error === 'payments_disabled') {
        Alert.alert('Payments unavailable', 'Online payments are temporarily disabled. Please try again later.');
      } else {
        Alert.alert('Payment failed', payRes.error || 'Please try again.');
      }
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Something went wrong';
      Alert.alert('Could not place order', String(msg));
    } finally {
      setPlacing(false);
    }
  };

  const busy = placing || paying;
  const canCheckout = items.length > 0 && !busy;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 220 }}>
        <View>
          {items.length === 0 ? (
            <View style={styles.emptyCart}>
              <Text style={styles.emptyText}>Your cart is empty</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/menu' as any)}>
                <Text style={styles.browseLink}>Browse Menu</Text>
              </TouchableOpacity>
            </View>
          ) : (
            items.map((item, idx) => (
              <View key={item.id} style={[styles.cartItem, idx < items.length - 1 && styles.cartItemBorder]}>
                <View style={styles.cartItemRow}>
                  <View style={styles.vegIndicator}><View style={styles.vegDot} /></View>
                  <Text style={styles.cartItemName}>{item.name}</Text>
                </View>
                <View style={styles.cartItemBottomRow}>
                  <Text style={styles.cartItemPrice}>₹{item.price * item.qty}</Text>
                  <View style={styles.qtyControls}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, item.qty - 1)}>
                      <Ionicons name="remove" size={18} color="#111" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.qty}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, item.qty + 1)}>
                      <Ionicons name="add" size={18} color="#111" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 1, backgroundColor: '#E6E6E6' }} />

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => setIncludeCutlery((v) => !v)}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', flex: 1 }}>
            <View style={[styles.checkbox, includeCutlery && styles.checkboxChecked]}>
              {includeCutlery && <Ionicons name="checkmark" size={16} color="#0B262F" />}
            </View>
            <Text style={styles.actionLabelText}>Include cutlery & napkins</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.whatsappRow}
          activeOpacity={0.7}
          onPress={() => setSendWhatsAppUpdates((v) => !v)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[styles.circleCheck, sendWhatsAppUpdates && styles.circleCheckActive]}>
              {sendWhatsAppUpdates && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.whatsappText}>Send delivery updates</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            <Text style={styles.whatsappText}>WhatsApp</Text>
          </View>
        </TouchableOpacity>

        <View style={[styles.sectionPad, { paddingTop: 8 }]}>
          <Text style={styles.summaryTitle}>Order summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Item total</Text>
            <Text style={styles.summaryValue}>₹ {itemTotal}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={[styles.summaryValue, { color: '#2C921D' }]}>− ₹ {discount}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery fee</Text>
            <Text style={styles.summaryValue}>{shipping > 0 ? `₹ ${shipping}` : 'Free'}</Text>
          </View>
          <View style={styles.dashedDivider} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { fontWeight: '600', color: '#0B262F', fontSize: 18 }]}>To be paid</Text>
            <Text style={[styles.summaryValue, { fontWeight: '600', color: '#0B262F', fontSize: 18 }]}>₹ {payable}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.addressRow}>
          <View style={styles.addressLeft}>
            <Ionicons name="location-outline" size={24} color="#0B262F" />
            <Text numberOfLines={1} style={styles.addressText}>
              {addressesQuery.isLoading ? (
                'Loading address…'
              ) : defaultAddress ? (
                <>
                  <Text style={{ fontWeight: '600', color: '#0B262F' }}>{defaultAddress.label || 'Home'}</Text>
                  <Text style={{ color: '#6C6C6C' }}> – {defaultAddress.address}</Text>
                </>
              ) : (
                <Text style={{ color: '#C7463A' }}>Add a delivery address</Text>
              )}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/profile-pages/addresses' as any)}>
            <Text style={styles.changeText}>{defaultAddress ? 'Change' : 'Add'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.payBtn, !canCheckout && { opacity: 0.55 }]}
          onPress={startCheckout}
          disabled={!canCheckout}
          activeOpacity={0.9}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payBtnText}>Proceed to Pay ₹{payable}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#141414' },
  sectionPad: { paddingHorizontal: 20, paddingVertical: 16 },

  emptyCart: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 14, color: '#6B7280' },
  browseLink: { fontSize: 14, fontWeight: '600', color: '#4B8E3D', marginTop: 12 },
  cartItem: { paddingHorizontal: 20, paddingVertical: 16 },
  cartItemBorder: { borderBottomWidth: 1, borderBottomColor: '#E6E6E6' },
  cartItemRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vegIndicator: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: '#08B853',
    justifyContent: 'center', alignItems: 'center',
  },
  vegDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#08B853' },
  cartItemName: { fontSize: 16, fontWeight: '500', color: '#111', flex: 1 },
  cartItemBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  cartItemPrice: { fontSize: 20, fontWeight: '600', color: '#0B262F' },
  qtyControls: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#098323',
    borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, justifyContent: 'space-between', width: 117,
  },
  qtyText: { fontSize: 16, fontWeight: '400', color: '#111' },
  qtyBtn: { padding: 4 },

  actionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff',
  },
  actionLabelText: { fontSize: 16, color: '#0B262F', fontWeight: '500', lineHeight: 22 },
  checkbox: {
    width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, borderColor: '#D5D8D7',
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: '#E8F5E9', borderColor: '#0B262F' },

  whatsappRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#EFEFEF',
    borderBottomWidth: 1, borderBottomColor: '#EFEFEF', backgroundColor: '#fff',
  },
  circleCheck: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#EFEFEF',
    justifyContent: 'center', alignItems: 'center',
  },
  circleCheckActive: { backgroundColor: '#2C921D' },
  whatsappText: { fontSize: 14, color: '#0B262F', fontWeight: '600' },

  summaryTitle: { fontSize: 18, fontWeight: '500', color: '#706F6F', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  summaryLabel: { fontSize: 16, color: '#0B262F' },
  summaryValue: { fontSize: 16, color: '#6A6A6A', fontWeight: '500' },
  dashedDivider: { height: 1, borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#BFBFBF', marginVertical: 12 },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff' },
  addressRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#E2DEDE',
    borderBottomWidth: 1, borderBottomColor: '#E2DEDE', marginBottom: 16, height: 48,
  },
  addressLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  addressText: { fontSize: 14, flex: 1 },
  changeText: { fontSize: 16, fontWeight: '500', color: '#0B262F' },
  payBtn: {
    marginHorizontal: 20, backgroundColor: '#2C921D', borderRadius: 90, paddingVertical: 16, alignItems: 'center',
  },
  payBtnText: { color: '#fff', fontWeight: '500', fontSize: 16 },
});
