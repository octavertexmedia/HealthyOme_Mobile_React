import type { UserAddress } from '../../addresses/api/addresses.api';

/** Default is only the initial suggestion; a removed selection must fail closed. */
export function checkoutAddress(addresses: UserAddress[], selectedId: number | null) {
  return selectedId === null
    ? addresses.find((address) => address.is_default) ?? addresses[0]
    : addresses.find((address) => address.id === selectedId);
}
