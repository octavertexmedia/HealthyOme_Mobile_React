import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { UserAddress } from '../addresses/api/addresses.api';

export function CheckoutAddressPicker({ addresses, selectedId, onSelect, busy, onManage }: {
  addresses: UserAddress[];
  selectedId?: number;
  onSelect: (id: number) => void;
  busy: boolean;
  onManage: () => void;
}) {
  return <View style={{ gap: 10 }}>
    <Text style={{ fontWeight: '700', fontSize: 17 }}>Delivery address for this order</Text>
    <Text>Selecting here does not change your account&apos;s default address.</Text>
    {addresses.map((address) => <TouchableOpacity
      key={address.id} accessibilityRole="radio"
      accessibilityLabel={`${address.label || 'Address'}: ${address.address}`}
      accessibilityState={{ checked: selectedId === address.id, disabled: busy }}
      disabled={busy} onPress={() => onSelect(address.id)}
      style={{ padding: 14, borderRadius: 12, borderWidth: 2, borderColor: selectedId === address.id ? '#34732D' : '#E5E7EB' }}
    >
      <Text style={{ fontWeight: '600' }}>{address.label || 'Address'}{address.is_default ? ' · Account default' : ''}</Text>
      <Text>{address.address}</Text>
      {!!address.delivery_area?.name && <Text>{address.delivery_area.name}</Text>}
    </TouchableOpacity>)}
    {!addresses.length && <Text>No saved delivery addresses.</Text>}
    <TouchableOpacity accessibilityRole="button" disabled={busy} accessibilityState={{ disabled: busy }} onPress={onManage} style={{ minHeight: 44, justifyContent: 'center' }}>
      <Text style={{ color: '#34732D', fontWeight: '600' }}>Add or manage addresses</Text>
    </TouchableOpacity>
  </View>;
}
