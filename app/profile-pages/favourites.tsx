import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, shadows } from '../../src/shared/theme';
import { formatPrice, getImageUrl } from '../../src/shared/utils/helpers';
import Loading from '../../src/shared/components/Loading';
import EmptyState from '../../src/shared/components/EmptyState';
import { useFavourites, useToggleFavourite } from '../../src/features/favourites/hooks/useFavourites';
import type { FavouriteItem } from '../../src/features/favourites/types/favourite.types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.xl * 2 - spacing.md) / 2;

export default function FavouritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data, isLoading, isError, refetch } = useFavourites();
  const toggleFavourite = useToggleFavourite();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleRemove = (item: FavouriteItem) => {
    toggleFavourite.mutate({
      mealItemId: item.meal_item_id,
      snapshot: {
        name: item.name,
        image: item.image,
        price: item.price,
        calories: item.calories,
      },
    });
  };

  const renderItem = ({ item }: { item: FavouriteItem }) => {
    const calories =
      item.calories === null || item.calories === undefined || item.calories === ''
        ? null
        : `${item.calories} kcal`;

    return (
      <TouchableOpacity
        style={styles.mealCard}
        onPress={() => router.push(`/meal/${item.meal_item_id}`)}
        activeOpacity={0.85}
      >
        <View style={styles.mealImageWrap}>
          {item.image ? (
            <Image source={{ uri: getImageUrl(item.image) }} style={styles.mealImage} />
          ) : (
            <View style={styles.mealImageFallback}>
              <Ionicons name="restaurant" size={28} color={colors.text.disabled} />
            </View>
          )}
          <TouchableOpacity
            style={styles.heartBtn}
            onPress={() => handleRemove(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="heart" size={18} color={colors.status.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.mealInfo}>
          <Text style={styles.mealName} numberOfLines={2}>
            {item.name}
          </Text>
          {calories ? <Text style={styles.mealMeta}>{calories}</Text> : null}

          <View style={styles.mealBottom}>
            <Text style={styles.mealPrice}>{formatPrice(item.price)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const favourites = data ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favourites</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <Loading fullScreen message="Loading favourites..." />
      ) : isError ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Couldn't load favourites"
          description="Something went wrong. Pull to refresh or try again."
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      ) : favourites.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title="No favourites yet"
          description="Tap the heart on any meal to save it here."
          actionLabel="Browse menu"
          onAction={() => router.push('/(tabs)/menu')}
        />
      ) : (
        <FlatList
          data={favourites}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111' },

  gridContent: { paddingHorizontal: spacing.xl, paddingBottom: 40, paddingTop: 4 },
  gridRow: { gap: spacing.md, marginBottom: spacing.md },

  mealCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.sm,
  },
  mealImageWrap: { width: '100%', height: 112, backgroundColor: '#F1F5F1' },
  mealImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  mealImageFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  mealInfo: { padding: 12 },
  mealName: { fontSize: 13, fontWeight: '600', color: '#111', lineHeight: 17 },
  mealMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  mealBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  mealPrice: { fontSize: 14, fontWeight: '600', color: '#111' },
});
