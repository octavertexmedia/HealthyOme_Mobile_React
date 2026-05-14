import React from 'react';
import { FlatList, FlatListProps } from 'react-native';

/**
 * Thin wrapper: uses @shopify/flash-list (much faster for long, uniform
 * lists) when installed, falls back to FlatList otherwise.
 *
 * Same props as FlatList plus `estimatedItemSize` (required by FlashList).
 * FlashList needs `estimatedItemSize` to be set for best performance — pick
 * the median rendered row height.
 */
type Props<T> = FlatListProps<T> & {
  estimatedItemSize?: number;
};

let FlashList: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  FlashList = require('@shopify/flash-list').FlashList;
} catch {
  FlashList = null;
}

export function FastList<T>(props: Props<T>) {
  if (FlashList) {
    return <FlashList {...(props as any)} />;
  }
  // FlatList ignores estimatedItemSize; drop it to satisfy TS.
  const { estimatedItemSize: _ignored, ...rest } = props;
  return <FlatList<T> {...rest} />;
}
