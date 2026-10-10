import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/shared/components/ScreenHeader';
import { useQuery } from '@tanstack/react-query';
import { useCartStore } from '../../src/features/cart/store/cart.store';
import { useCheckoutQuote } from '../../src/features/cart/hooks/useCheckoutQuote';
import { useAuthStore } from '../../src/features/auth/store/auth.store';
import { addressesApi } from '../../src/features/addresses/api/addresses.api';
import { usePayment } from '../../src/features/payments/hooks/usePayment';
import type { CreateOrderItem } from '../../src/features/payments/api/payments.api';
import { useSiteSettings } from '../../src/features/catalog/hooks/useMeals';
import { CheckoutAddressPicker } from '../../src/features/cart/CheckoutAddressPicker';
import { checkoutAddress } from '../../src/features/cart/utils/checkoutAddress';
import {
  checkoutQuoteCoversLines,
  checkoutQuoteBlockMessage,
  isValidCheckoutDate,
  normalizeCouponCode,
  tomorrowIso,
} from '../../src/features/cart/utils/checkout';

export default function CheckoutScreen() {
  const revision = useAuthStore((state) => state.sessionRevision);
  return <CheckoutContent key={revision} />;
}

function CheckoutContent() {
  const router = useRouter();
  const params = useLocalSearchParams<{ coupon?: string | string[] }>();
  const insets = useSafeAreaInsets();
  const { items, totalPrice, clearCart, updateQuantity } = useCartStore();
  const { isAuthenticated, user, sessionRevision } = useAuthStore();
  const { pay, loading: paying } = usePayment();
  const { data: siteSettings } = useSiteSettings();

  const [placing, setPlacing] = useState(false);
  const placingRef = useRef(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [includeCutlery, setIncludeCutlery] = useState(false);
  const [includeNapkins, setIncludeNapkins] = useState(false);
  const [sendWhatsAppUpdates, setSendWhatsAppUpdates] = useState(true);
  const promoCoupon = normalizeCouponCode(
    Array.isArray(params.coupon) ? params.coupon[0] ?? '' : params.coupon ?? ''
  );
  const [couponInput, setCouponInput] = useState(promoCoupon);
  const [couponCode, setCouponCode] = useState(promoCoupon);
  const [deliveryDate, setDeliveryDate] = useState(() => tomorrowIso());
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('Hand it to me');
  const [allergies, setAllergies] = useState('');

  useEffect(() => {
    if (!promoCoupon) return;
    setCouponInput(promoCoupon);
    setCouponCode(promoCoupon);
  }, [promoCoupon]);

  const addressesQuery = useQuery({
    queryKey: ['addresses', user?.id, sessionRevision],
    queryFn: addressesApi.list,
    enabled: isAuthenticated,
    gcTime: 0,
  });

  const selectedAddress = checkoutAddress(addressesQuery.data ?? [], selectedAddressId);
  useEffect(() => {
    if (selectedAddressId === null && selectedAddress) setSelectedAddressId(selectedAddress.id);
  }, [selectedAddressId, selectedAddress]);

  const email = user?.email?.trim() ?? '';

  // Server-authoritative totals (subtotal / shipping / discount / payable_total).
  // The selected address is included so the quote also validates its delivery zone.
  const {
    data: quote,
    error: quoteRequestError,
    isFetching: quoteLoading,
    refetch: refreshQuote,
    projection,
  } = useCheckoutQuote({
    couponCode: couponCode || undefined,
    addressId: selectedAddress?.id,
    enabled: Boolean(selectedAddress) && !addressesQuery.isError,
  });
  const itemTotal = quote?.subtotal ?? totalPrice;
  const discount = quote?.discount ?? 0;
  const shipping = quote?.shipping ?? 0;
  const payable = quote?.payable_total ?? totalPrice;

  const orderLines: CreateOrderItem[] = projection.lines;
  const hasCustomBowls = projection.customBowlItems.length > 0;
  const hasUnsupportedItems = projection.unsupportedItems.length > 0;
  const customBowlServerEnabled = siteSettings?.custom_bowl_checkout_enabled === true;
  const couponRejected = Boolean(quote?.error?.includes('coupon'));
  const checkoutFingerprint = JSON.stringify({ address: selectedAddress?.id, couponCode, lines: projection.lines, sessionRevision });
  const currentCheckout = useRef(checkoutFingerprint);
  currentCheckout.current = checkoutFingerprint;

  const removeCustomBowls = () => {
    for (const item of projection.customBowlItems) {
      useCartStore.getState().removeItem(item.id);
    }
  };

  const applyCoupon = () => {
    const normalized = normalizeCouponCode(couponInput);
    if (!normalized) {
      Alert.alert('Enter a coupon', 'Type a coupon code before applying it.');
      return;
    }
    setCouponInput(normalized);
    if (normalized === couponCode) {
      void refreshQuote();
    } else {
      setCouponCode(normalized);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponInput('');
  };

  const startCheckout = async () => {
    if (placingRef.current || paying) return;
    if (!isAuthenticated) {
      router.push({
        pathname: '/(auth)/login',
        params: {
          redirect: couponCode
            ? `/checkout?coupon=${encodeURIComponent(couponCode)}`
            : '/checkout',
        },
      });
      return;
    }
    if (items.length === 0) return;
    if (hasUnsupportedItems) {
      Alert.alert(
        hasCustomBowls ? 'Custom bowl checkout unavailable' : 'Cart needs attention',
        hasCustomBowls
          ? customBowlServerEnabled
            ? 'Custom bowls are enabled by the store, but this app version cannot safely insert them into the server cart. Remove them before paying; they will never be silently omitted.'
            : 'Store settings do not currently allow custom-bowl checkout. Remove bowl items before paying; they will never be silently omitted.'
          : 'One or more cart items cannot be sent safely. Remove them and add them again before paying.'
      );
      return;
    }
    if (!selectedAddress || addressesQuery.isError) {
      Alert.alert('Add a delivery address', 'Please save an address before placing an order.', [
        { text: 'Add address', onPress: () => router.push('/profile-pages/addresses') },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    if (!email) {
      Alert.alert('Add your email', 'We need an email on your profile to send the order receipt.', [
        { text: 'Add email', onPress: () => router.push('/profile-pages/edit') },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    if (!isValidCheckoutDate(deliveryDate)) {
      Alert.alert('Check delivery date', 'Use YYYY-MM-DD and choose tomorrow or a later date.');
      return;
    }
    if (orderLines.length === 0) {
      Alert.alert('Nothing to checkout', 'Your cart has no orderable meal or snack items.');
      return;
    }

    placingRef.current = true;
    setPlacing(true);
    const fingerprint = currentCheckout.current;
    try {
      // Revalidate immediately before creating a payment transaction so stale
      // totals, coupon status, minimum order and delivery-zone state cannot pass.
      const refreshed = await refreshQuote();
      const latestQuote = refreshed.data;
      if (useAuthStore.getState().sessionRevision !== sessionRevision) return;
      if (currentCheckout.current !== fingerprint) {
        Alert.alert('Checkout changed', 'Confirm the selected address and cart, then try again.');
        return;
      }
      if (
        refreshed.isError ||
        !latestQuote?.can_checkout ||
        !checkoutQuoteCoversLines(latestQuote, projection.lines)
      ) {
        Alert.alert(
          'Checkout unavailable',
          checkoutQuoteBlockMessage(latestQuote) ??
            'The server cart did not match every item shown. Refresh your cart and try again.'
        );
        return;
      }

      // Razorpay-only: create-order derives the authoritative amount; the order
      // rows are created by verify (or complete-zero-order for a ₹0 coupon).
      const payRes = await pay({
        kind: 'cart',
        order: {
          items: orderLines,
          replace: true,
          address_id: selectedAddress.id,
          email,
          amount: latestQuote.payable_total,
          ...(couponCode ? { coupon_code: couponCode } : {}),
          notes: {
            source: 'mobile_app',
            include_cutlery: includeCutlery,
            include_napkins: includeNapkins,
          },
        },
        fulfillment: {
          address_id: selectedAddress.id,
          email,
          delivery_date: deliveryDate,
          ...(deliveryTimeSlot.trim()
            ? { delivery_time_slot: deliveryTimeSlot.trim().slice(0, 100) }
            : {}),
          delivery_instructions:
            deliveryInstructions.trim().slice(0, 200) || 'Hand it to me',
          allergies: allergies.trim().slice(0, 5000),
          ...(couponCode ? { coupon_code: couponCode } : {}),
          notes: [
            includeCutlery ? 'Include cutlery' : '',
            includeNapkins ? 'Include napkins' : '',
          ].filter(Boolean).join(' · '),
          whatsapp_updates: sendWhatsAppUpdates,
        },
      });

      if (useAuthStore.getState().sessionRevision !== sessionRevision) return;
      if (payRes.status === 'paid') {
        const orderId = payRes.order_ids[0];
        clearCart();
        Alert.alert('Order placed', 'Payment successful — your meal is on the way!', [
          {
            text: 'View order',
            onPress: () => {
              router.dismissAll();
              if (orderId) router.push(`/orders/my/${orderId}`);
              else router.push('/(tabs)/orders');
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
    } catch (error: unknown) {
      Alert.alert('Could not place order', getErrorMessage(error));
    } finally {
      placingRef.current = false;
      setPlacing(false);
    }
  };

  const busy = placing || paying;
  const quoteBlockMessage = isAuthenticated
    ? quoteRequestError
      ? 'Could not confirm the order total. Check your connection and try again.'
      : checkoutQuoteBlockMessage(quote) ??
        (quote && !checkoutQuoteCoversLines(quote, projection.lines)
          ? 'The server cart does not match every item shown. Refresh the cart before paying.'
          : null)
    : null;
  const checkoutBlockMessage = hasUnsupportedItems
    ? hasCustomBowls
      ? customBowlServerEnabled
        ? 'Remove custom bowls to continue. This app version cannot safely submit them yet.'
        : 'Remove custom bowls to continue. Store settings do not currently allow bowl checkout.'
      : 'Remove unsupported cart items to continue.'
    : addressesQuery.isError && isAuthenticated
      ? 'Could not confirm your saved addresses. Retry before paying.'
    : !selectedAddress && isAuthenticated
      ? 'Choose a saved delivery address for this order.'
      : !email && isAuthenticated
        ? 'Add an email to your profile to continue.'
        : !isValidCheckoutDate(deliveryDate)
          ? 'Choose a valid delivery date from tomorrow onward.'
          : quoteBlockMessage;
  const canCheckout =
    items.length > 0 &&
    !busy &&
    (!isAuthenticated || (!quoteLoading && !checkoutBlockMessage && quote?.can_checkout === true));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Checkout" fallback="/cart" backLabel="Back to cart" showCart={false} />

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View>
          {items.length === 0 ? (
            <View style={styles.emptyCart}>
              <Text style={styles.emptyText}>Your cart is empty</Text>
              <TouchableOpacity onPress={() => router.navigate('/(tabs)')}>
                <Text style={styles.browseLink}>Browse food</Text>
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
                    <TouchableOpacity disabled={busy} style={styles.qtyBtn} onPress={() => updateQuantity(item.id, item.qty - 1)}>
                      <Ionicons name="remove" size={18} color="#111" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.qty}</Text>
                    <TouchableOpacity disabled={busy} style={styles.qtyBtn} onPress={() => updateQuantity(item.id, item.qty + 1)}>
                      <Ionicons name="add" size={18} color="#111" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {hasUnsupportedItems && (
          <View style={styles.blockedCard}>
            <View style={styles.noticeTitleRow}>
              <Ionicons name="alert-circle" size={20} color="#9B341F" />
              <Text style={styles.blockedTitle}>
                {hasCustomBowls ? 'Custom bowls need to be removed' : 'Cart needs attention'}
              </Text>
            </View>
            <Text style={styles.blockedText}>
              {hasCustomBowls
                ? customBowlServerEnabled
                  ? 'This app version cannot put custom bowls into the server checkout cart yet, so it will never charge you while silently omitting them.'
                  : 'Store settings do not currently allow custom-bowl checkout. Bowl items will never be silently omitted from a paid order.'
                : 'One or more items cannot be represented by the secure checkout API.'}
            </Text>
            {hasCustomBowls && (
              <TouchableOpacity style={styles.removeBowlButton} onPress={removeCustomBowls}>
                <Text style={styles.removeBowlButtonText}>
                  Remove {projection.customBowlItems.length === 1 ? 'custom bowl' : 'custom bowls'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {quote?.warnings?.map((warning, index) => (
          <View key={`${warning}-${index}`} style={styles.warningCard}>
            <Ionicons name="information-circle-outline" size={18} color="#865D12" />
            <Text style={styles.warningText}>{warning}</Text>
          </View>
        ))}

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
            <Text style={styles.actionLabelText}>Include cutlery</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => setIncludeNapkins((v) => !v)}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', flex: 1 }}>
            <View style={[styles.checkbox, includeNapkins && styles.checkboxChecked]}>
              {includeNapkins && <Ionicons name="checkmark" size={16} color="#0B262F" />}
            </View>
            <Text style={styles.actionLabelText}>Include napkins</Text>
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

        <View style={styles.formSection}>
          <Text style={styles.formTitle}>Delivery details</Text>
          {isAuthenticated && (addressesQuery.isLoading ? <ActivityIndicator accessibilityLabel="Loading addresses" /> : addressesQuery.isError ? (
            <TouchableOpacity accessibilityRole="button" onPress={() => { void addressesQuery.refetch(); }}><Text>Could not load addresses. Retry addresses</Text></TouchableOpacity>
          ) : <CheckoutAddressPicker addresses={addressesQuery.data ?? []} selectedId={selectedAddress?.id}
            onSelect={setSelectedAddressId} busy={busy} onManage={() => router.push('/profile-pages/addresses')} />)}
          <Text style={styles.inputLabel}>Delivery date</Text>
          <TextInput
            value={deliveryDate}
            onChangeText={setDeliveryDate}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            maxLength={10}
            style={styles.input}
          />
          <Text style={styles.inputHint}>Choose tomorrow or a later date.</Text>

          <Text style={styles.inputLabel}>Preferred time slot (optional)</Text>
          <TextInput
            value={deliveryTimeSlot}
            onChangeText={setDeliveryTimeSlot}
            placeholder="For example, 12:00 PM – 2:00 PM"
            maxLength={100}
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Delivery instructions</Text>
          <TextInput
            value={deliveryInstructions}
            onChangeText={setDeliveryInstructions}
            placeholder="Hand it to me"
            maxLength={200}
            style={[styles.input, styles.multilineInput]}
            multiline
          />

          <Text style={styles.inputLabel}>Food allergies (optional)</Text>
          <TextInput
            value={allergies}
            onChangeText={setAllergies}
            placeholder="Tell the kitchen about food allergies"
            maxLength={5000}
            style={[styles.input, styles.multilineInput]}
            multiline
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formTitle}>Coupon</Text>
          <View style={styles.couponRow}>
            <TextInput
              value={couponInput}
              onChangeText={setCouponInput}
              placeholder="Enter coupon code"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={50}
              style={[styles.input, styles.couponInput]}
              editable={!quoteLoading && !busy}
            />
            <TouchableOpacity
              style={[styles.applyButton, quoteLoading && styles.buttonDisabled]}
              onPress={applyCoupon}
              disabled={quoteLoading || busy}
            >
              {quoteLoading && couponCode ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.applyButtonText}>Apply</Text>
              )}
            </TouchableOpacity>
          </View>
          {couponCode ? (
            couponRejected ? (
              <View style={styles.couponFeedbackRow}>
                <Text style={styles.couponError}>
                  {quote?.error_message || 'Coupon could not be applied.'}
                </Text>
                <TouchableOpacity onPress={removeCoupon}>
                  <Text style={styles.removeCouponText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : quote && !quoteLoading && !quote.error ? (
              <View style={styles.couponFeedbackRow}>
                <Text style={styles.couponSuccess}>
                  {discount > 0
                    ? `${couponCode} applied · You save ₹${discount}`
                    : `${couponCode} applied`}
                </Text>
                <TouchableOpacity onPress={removeCoupon}>
                  <Text style={styles.removeCouponText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : quote?.error && !quoteLoading ? (
              <View style={styles.couponFeedbackRow}>
                <Text style={styles.couponError}>
                  Resolve the checkout issue below, then this coupon will be checked again.
                </Text>
                <TouchableOpacity onPress={removeCoupon}>
                  <Text style={styles.removeCouponText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : null
          ) : null}
        </View>

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
          {checkoutBlockMessage && isAuthenticated && (
            <View style={styles.checkoutBlockRow}>
              <Ionicons name="alert-circle-outline" size={18} color="#9B341F" />
              <Text style={styles.checkoutBlockText}>{checkoutBlockMessage}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.addressRow}>
          <View style={styles.addressLeft}>
            <Ionicons name="location-outline" size={24} color="#0B262F" />
            <Text numberOfLines={1} style={styles.addressText}>
              {addressesQuery.isLoading ? (
                'Loading address…'
              ) : selectedAddress ? (
                <>
                  <Text style={{ fontWeight: '600', color: '#0B262F' }}>{selectedAddress.label || 'Home'}</Text>
                  <Text style={{ color: '#6C6C6C' }}> – {selectedAddress.address}</Text>
                </>
              ) : (
                <Text style={{ color: '#C7463A' }}>Add a delivery address</Text>
              )}
            </Text>
          </View>
          {!isAuthenticated && <TouchableOpacity onPress={() => router.push({ pathname: '/(auth)/login', params: { redirect: '/checkout' } })}>
            <Text style={styles.changeText}>Sign in</Text>
          </TouchableOpacity>}
        </View>

        <TouchableOpacity
          accessibilityRole="button" accessibilityLabel={isAuthenticated ? 'Proceed to payment' : 'Sign in to checkout'}
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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error !== 'object' || error === null) return 'Something went wrong';

  const response = 'response' in error ? error.response : undefined;
  if (typeof response === 'object' && response !== null && 'data' in response) {
    const data = response.data;
    if (typeof data === 'object' && data !== null && 'error' in data) {
      const message = data.error;
      if (typeof message === 'string' && message) return message;
    }
  }
  return 'Something went wrong';
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

  blockedCard: {
    marginHorizontal: 20, marginVertical: 12, padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#F1B9A8', backgroundColor: '#FFF4EF',
  },
  noticeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  blockedTitle: { flex: 1, color: '#7C2D12', fontSize: 15, fontWeight: '700' },
  blockedText: { color: '#7C2D12', fontSize: 13, lineHeight: 19, marginTop: 8 },
  removeBowlButton: {
    alignSelf: 'flex-start', borderRadius: 999, backgroundColor: '#9B341F',
    paddingHorizontal: 14, paddingVertical: 9, marginTop: 12,
  },
  removeBowlButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  warningCard: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginHorizontal: 20,
    marginBottom: 8, padding: 12, borderRadius: 10, backgroundColor: '#FFF8DF',
  },
  warningText: { flex: 1, color: '#6E4B0D', fontSize: 13, lineHeight: 18 },

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

  formSection: {
    paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  formTitle: { fontSize: 18, fontWeight: '600', color: '#0B262F', marginBottom: 12 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#34454A', marginBottom: 7, marginTop: 8 },
  input: {
    borderWidth: 1, borderColor: '#D5D8D7', borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 11, fontSize: 15, color: '#0B262F', backgroundColor: '#fff',
  },
  multilineInput: { minHeight: 72, textAlignVertical: 'top' },
  inputHint: { fontSize: 12, color: '#6C6C6C', marginTop: 5 },
  couponRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  couponInput: { flex: 1 },
  applyButton: {
    minWidth: 82, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0B6F3A', paddingHorizontal: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  applyButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  couponFeedbackRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    gap: 12, marginTop: 10,
  },
  couponSuccess: { flex: 1, color: '#217A32', fontSize: 13, fontWeight: '600' },
  couponError: { flex: 1, color: '#B42318', fontSize: 13, lineHeight: 18 },
  removeCouponText: { color: '#8A341E', fontSize: 13, fontWeight: '700' },

  summaryTitle: { fontSize: 18, fontWeight: '500', color: '#706F6F', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  summaryLabel: { fontSize: 16, color: '#0B262F' },
  summaryValue: { fontSize: 16, color: '#6A6A6A', fontWeight: '500' },
  dashedDivider: { height: 1, borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#BFBFBF', marginVertical: 12 },
  checkoutBlockRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 7, padding: 10,
    backgroundColor: '#FFF4EF', borderRadius: 9, marginTop: 10,
  },
  checkoutBlockText: { flex: 1, color: '#7C2D12', fontSize: 13, lineHeight: 18 },

  bottomBar: { backgroundColor: '#fff' },
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
