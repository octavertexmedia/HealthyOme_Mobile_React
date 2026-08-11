import React from 'react';
import { FlatList, FlatListProps } from 'react-native';

/**
 * Virtualized list wrapper with a FlatList backend.
 *
 * We deliberately use FlatList rather than @shopify/flash-list: the flash-list
 * version compatible with this Expo SDK's New Architecture is a v2 that drops
 * `estimatedItemSize`/`columnWrapperStyle` (which the grids here rely on), and
 * for these list sizes FlatList is plenty fast. Reintroduce FlashList v2 as a
 * measured perf optimization if profiling shows a real list-scroll problem.
 *
 * Accepts (and ignores) `estimatedItemSize` so call sites don't have to change.
 */
type Props<T> = FlatListProps<T> & {
  estimatedItemSize?: number;
};

export function FastList<T>(props: Props<T>) {
  const { estimatedItemSize: _ignored, ...rest } = props;
  return <FlatList<T> {...rest} />;
}
