import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/features/auth/store/auth.store';
import { colors, spacing, borderRadius, typography } from '../../src/shared/theme';
import EmptyState from '../../src/shared/components/EmptyState';
import {
  useInbox,
  useMarkRead,
  useMarkAllRead,
} from '../../src/features/notifications/useInbox';
import type { InAppNotification } from '../../src/features/notifications/inbox.api';

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function iconFor(n: InAppNotification): keyof typeof Ionicons.glyphMap {
  const key = `${n.category} ${n.event_type}`.toLowerCase();
  if (key.includes('order')) return 'receipt-outline';
  if (key.includes('promo') || key.includes('offer')) return 'pricetag-outline';
  if (key.includes('reward') || key.includes('point')) return 'gift-outline';
  if (key.includes('subscription') || key.includes('plan')) return 'repeat-outline';
  if (key.includes('consult')) return 'medkit-outline';
  if (key.includes('welcome')) return 'sparkles-outline';
  return 'notifications-outline';
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const inboxQuery = useInbox(isAuthenticated);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const notifications = inboxQuery.data?.notifications ?? [];
  const unreadCount = inboxQuery.data?.unread_count ?? 0;

  const onPressItem = useCallback(
    (item: InAppNotification) => {
      if (!item.is_read) {
        markRead.mutate(item.id);
      }
      if (item.link_path) {
        router.push(item.link_path as any);
      }
    },
    [markRead, router]
  );

  const renderItem = useCallback(
    ({ item }: { item: InAppNotification }) => (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.tile, !item.is_read && styles.tileUnread]}
        onPress={() => onPressItem(item)}
      >
        <View style={[styles.iconCircle, !item.is_read && styles.iconCircleUnread]}>
          <Ionicons
            name={iconFor(item)}
            size={20}
            color={item.is_read ? colors.text.secondary : colors.primary}
          />
        </View>
        <View style={styles.tileBody}>
          <Text style={[styles.tileTitle, !item.is_read && styles.tileTitleUnread]} numberOfLines={1}>
            {item.title}
          </Text>
          {!!item.body && (
            <Text style={styles.tileText} numberOfLines={2}>
              {item.body}
            </Text>
          )}
          <Text style={styles.tileTime}>{timeAgo(item.created_at)}</Text>
        </View>
        {!item.is_read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    ),
    [onPressItem]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>
        {isAuthenticated && unreadCount > 0 ? (
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            {markAllRead.isPending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.markAllText}>Mark all</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={{ width: 64 }} />
        )}
      </View>

      {!isAuthenticated ? (
        <EmptyState
          icon="log-in-outline"
          title="Sign in required"
          description="Sign in to see your notifications."
          actionLabel="Sign In"
          onAction={() => router.push('/(auth)/login' as any)}
        />
      ) : inboxQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : inboxQuery.isError ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Couldn't load notifications"
          description="Please check your connection and try again."
          actionLabel="Retry"
          onAction={() => inboxQuery.refetch()}
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={
            notifications.length === 0 ? styles.emptyContent : styles.listContent
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={inboxQuery.isRefetching}
              onRefresh={() => inboxQuery.refetch()}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="notifications-off-outline"
              title="No notifications yet"
              description="Updates about your orders, offers and rewards will show up here."
            />
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
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitle: { ...typography.heading.md, color: colors.text.primary },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { ...typography.body.xs, color: colors.text.inverse, letterSpacing: 0 },
  markAllBtn: {
    width: 64,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  markAllText: { ...typography.button.sm, color: colors.primary },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  listContent: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  emptyContent: { flexGrow: 1 },
  separator: { height: spacing.md },

  tile: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileUnread: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleUnread: { backgroundColor: colors.surface },
  tileBody: { flex: 1 },
  tileTitle: {
    ...typography.body.lg,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  tileTitleUnread: { fontWeight: '700' },
  tileText: {
    ...typography.body.md,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  tileTime: { ...typography.body.sm, color: colors.text.muted },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    marginTop: spacing.xs,
  },
});
