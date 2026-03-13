import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCartStore } from '../../src/features/cart/store/cart.store';
import { useAuthStore } from '../../src/features/auth/store/auth.store';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/shared/theme';
import { formatPrice } from '../../src/shared/utils/helpers';

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, totalPrice, updateQuantity, removeItem, clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const [startingFrom] = useState('Tomorrow');
  const [deliveryInstruction] = useState('Hand it to me');
  const [sendWhatsAppUpdates, setSendWhatsAppUpdates] = useState(true);
  const [includeCutlery, setIncludeCutlery] = useState(false);
  const [includeNapkins, setIncludeNapkins] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    setLoading(true);
    try {
      setTimeout(() => {
        clearCart();
        setLoading(false);
        Alert.alert('🎉 Order Placed!', 'Your order has been placed successfully', [
          { text: 'View Orders', onPress: () => { router.dismissAll(); router.push('/(tabs)/orders'); } },
        ]);
      }, 1500);
    } catch {
      setLoading(false);
      Alert.alert('Error', 'Failed to place order');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 200, backgroundColor: '#fff' }}>
        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerTitle}>No time to cook? Try <Text style={{fontWeight:'500'}}>subscription</Text></Text>
            <TouchableOpacity>
              <Text style={styles.bannerLink}>Tell me more</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.bannerClose}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ─── Cart Items ─── */}
        <View>
          {items.length === 0 ? (
            <View style={styles.emptyCart}>
              <Text style={styles.emptyText}>Your cart is empty</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/menu')}>
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
                  
                  {/* Qty Controls */}
                  <View style={styles.qtyControls}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateQuantity(item.id, item.qty - 1)}
                    >
                      <Ionicons name="remove" size={18} color="#111" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.qty}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateQuantity(item.id, item.qty + 1)}
                    >
                      <Ionicons name="add" size={18} color="#111" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <Divider />

        {/* ─── Action Rows ─── */}
        <View style={{ backgroundColor: '#fff', paddingVertical: 8 }}>
          <CheckboxActionRow
            label="Add spoons? napkins? Other cutlery?"
            subLabel="Leave a comment..."
            checked={includeCutlery}
            onChange={() => setIncludeCutlery(!includeCutlery)}
          />
          <Divider />
          <ActionRow
            icon="calendar-outline"
            label="Delivery instructions"
            value="Hand it to me"
          />
          <Divider />
        </View>

        {/* ─── WhatsApp Toggle ─── */}
        <TouchableOpacity
          style={styles.whatsappRow}
          activeOpacity={0.7}
          onPress={() => setSendWhatsAppUpdates(v => !v)}
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

        {/* ─── Coupon ─── */}
        <View style={styles.sectionPad}>
          <TouchableOpacity style={styles.couponCard} activeOpacity={0.8}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <Ionicons name="pricetag" size={20} color="#0C7238" />
              <View>
                <Text style={styles.couponTitle}>Apply coupon</Text>
                <Text style={styles.couponSub}>2 Applicable</Text>
              </View>
            </View>
            <Text style={styles.couponLink}>View offers</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Order Summary ─── */}
        <View style={[styles.sectionPad, { paddingTop: 8 }]}>
          <Text style={styles.summaryTitle}>Order summery</Text>
          <SummaryRow label="Item total" value={`₹ ${totalPrice}`} />
          <SummaryRow label="Discount" value={`₹ 0`} />
          <View style={styles.dashedDivider} />
          <SummaryRow label="To be payed" value={`₹ ${totalPrice}`} bold />
        </View>

        {/* ─── Cancellation Note ─── */}
        <View style={styles.noteContainer}>
          <Text style={styles.noteTitle}>Note</Text>
          <Text style={styles.noteDesc}>One time orders can not be cancelled or refunded once placed</Text>
        </View>
      </ScrollView>

      {/* ─── Fixed Bottom ─── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        {/* Address */}
        <View style={styles.addressRow}>
          <View style={styles.addressLeft}>
            <Ionicons name="location-outline" size={24} color="#0B262F" />
            <Text numberOfLines={1} style={styles.addressText}>
              <Text style={{ fontWeight: '600', color: '#0B262F' }}>Home</Text>
              <Text style={{ color: '#6C6C6C' }}> - Oberoi Apartment, sector...</Text>
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/profile-pages/addresses')}>
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.payBtn, loading && { opacity: 0.7 }]}
          onPress={handlePlaceOrder}
          disabled={loading}
          activeOpacity={0.9}
        >
          <Text style={styles.payBtnText}>
            {loading ? 'Placing Order...' : `Proceed to Pay ₹${totalPrice}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ── Helper Components ── */

function Divider() {
  return <View style={{ height: 1, backgroundColor: '#E6E6E6' }} />;
}

function ActionRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', flex: 1 }}>
        <Ionicons name={icon as any} size={24} color="#0B262F" />
        <View style={{ flex: 1 }}>
          <Text style={styles.actionLabelText}>{label}</Text>
          <Text style={styles.actionValue}>{value}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#0B262F" />
    </TouchableOpacity>
  );
}

function CheckboxActionRow({ label, subLabel, checked, onChange }: any) {
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onChange} activeOpacity={0.7}>
      <View style={{ flexDirection: 'row', gap: 12, flex: 1, alignItems: 'center' }}>
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked && <Ionicons name="checkmark" size={16} color="#0B262F" />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.actionLabelText}>{label}</Text>
          <Text style={styles.actionValue}>{subLabel}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#0B262F" />
    </TouchableOpacity>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, bold && { fontWeight: '600', color: '#0B262F', fontSize: 18 }]}>{label}</Text>
      <Text style={[styles.summaryValue, bold && { fontWeight: '600', color: '#0B262F', fontSize: 18 }]}>{value}</Text>
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

  /* Banner */
  banner: {
    backgroundColor: '#04360F', flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingVertical: 12, justifyContent: 'space-between',
  },
  bannerTextCol: { flex: 1, gap: 4 },
  bannerTitle: { fontSize: 16, color: '#fff', lineHeight: 22 },
  bannerLink: { fontSize: 16, color: '#3AC924', fontWeight: '500', lineHeight: 22 },
  bannerClose: { padding: 4 },

  /* Cart items */
  emptyCart: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 14, color: '#6B7280' },
  browseLink: { fontSize: 14, fontWeight: '600', color: '#4B8E3D', marginTop: 12 },
  cartItem: {
    paddingHorizontal: 20, paddingVertical: 16,
  },
  cartItemBorder: { borderBottomWidth: 1, borderBottomColor: '#E6E6E6' },
  cartItemRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vegIndicator: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: '#08B853',
    justifyContent: 'center', alignItems: 'center',
  },
  vegDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#08B853',
  },
  cartItemName: { fontSize: 16, fontWeight: '500', color: '#111', flex: 1 },
  cartItemBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  cartItemPrice: { fontSize: 20, fontWeight: '600', color: '#0B262F' },
  qtyControls: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderColor: '#098323', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8,
    justifyContent: 'space-between', width: 117,
  },
  qtyText: { fontSize: 16, fontWeight: '400', color: '#111' },
  qtyBtn: { padding: 4 },

  /* Action Rows */
  actionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff'
  },
  actionLabelText: { fontSize: 16, color: '#6C6C6C', fontWeight: '500', lineHeight: 22 },
  actionValue: { fontSize: 16, fontWeight: '500', color: '#0B262F', lineHeight: 22 },

  /* Checkbox */
  checkbox: {
    width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, borderColor: '#D5D8D7',
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: '#E8F5E9', borderColor: '#0B262F' },

  /* WhatsApp */
  whatsappRow: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 20, paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: '#EFEFEF', backgroundColor: '#fff'
  },
  circleCheck: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#EFEFEF',
    justifyContent: 'center', alignItems: 'center',
  },
  circleCheckActive: { backgroundColor: '#2C921D' },
  whatsappText: { fontSize: 14, color: '#0B262F', fontWeight: '600' },

  /* Coupon */
  couponCard: {
    backgroundColor: '#D7FAE7', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  couponTitle: { fontSize: 18, fontWeight: '500', color: '#0B262F' },
  couponSub: { fontSize: 14, color: '#0B262F', marginTop: 4, fontWeight: '500' },
  couponLink: { fontSize: 12, fontWeight: '600', color: '#0C7238' },

  /* Note section */
  noteContainer: { paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#CCC', backgroundColor: '#FFF' },
  noteTitle: { fontSize: 16, fontWeight: '500', color: '#C7463A', marginBottom: 4 },
  noteDesc: { fontSize: 16, fontWeight: '500', color: '#0B262F' },

  /* Summary */
  summaryTitle: { fontSize: 18, fontWeight: '500', color: '#706F6F', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  summaryLabel: { fontSize: 16, color: '#0B262F' },
  summaryValue: { fontSize: 16, color: '#6A6A6A', fontWeight: '500' },
  dashedDivider: { height: 1, borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#BFBFBF', marginVertical: 12 },

  /* Bottom Bar */
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
  },
  addressRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#E2DEDE', borderBottomWidth: 1, borderBottomColor: '#E2DEDE',
    marginBottom: 16, height: 48,
  },
  addressLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  addressText: { fontSize: 14, flex: 1 },
  changeText: { fontSize: 16, fontWeight: '500', color: '#0B262F' },
  payBtn: {
    marginHorizontal: 20, backgroundColor: '#2C921D',
    borderRadius: 90, paddingVertical: 16, alignItems: 'center',
  },
  payBtnText: { color: '#fff', fontWeight: '500', fontSize: 16 },
});
