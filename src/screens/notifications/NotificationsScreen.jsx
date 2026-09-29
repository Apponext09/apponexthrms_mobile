import React, { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BellOff } from '@/components/ui/icons';
import {
  AppText,
  Card,
  EmptyState,
  ErrorState,
  ListSkeleton,
  Screen,
  StackHeader,
} from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  selectNotifications,
} from '@/store/slices/notificationSlice';
import { formatRelative } from '@/utils/format';

const NotificationsScreen = () => {
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const { list, unread } = useAppSelector(selectNotifications);

  const load = useCallback(() => {
    dispatch(fetchNotifications());
    dispatch(fetchUnreadCount());
  }, [dispatch]);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen
      stack
      refreshing={list.loading && list.loaded}
      onRefresh={load}
      header={
        <StackHeader
          title="Notifications"
          right={
            unread > 0 ? (
              <Pressable
                onPress={() => dispatch(markAllNotificationsRead())}
                hitSlop={8}
              >
                <AppText variant="captionMedium" color="primary">
                  Mark all read
                </AppText>
              </Pressable>
            ) : null
          }
        />
      }
    >
      {list.loading && !list.loaded ? (
        <ListSkeleton />
      ) : list.error ? (
        <ErrorState message={list.error} onRetry={load} />
      ) : list.data.length ? (
        list.data.map(n => (
          <Card
            key={n.id}
            style={[styles.card, !n.isRead && { borderColor: colors.primary }]}
            onPress={() => !n.isRead && dispatch(markNotificationRead(n.id))}
          >
            <View style={styles.row}>
              {!n.isRead ? (
                <View
                  style={[styles.dot, { backgroundColor: colors.primary }]}
                />
              ) : null}
              <AppText variant="bodyMedium" style={styles.flex}>
                {n.title}
              </AppText>
              <AppText variant="small" color="mutedForeground">
                {formatRelative(n.createdAt)}
              </AppText>
            </View>
            {n.message ? (
              <AppText
                variant="caption"
                color="textSecondary"
                style={styles.msg}
              >
                {n.message}
              </AppText>
            ) : null}
          </Card>
        ))
      ) : (
        <EmptyState
          icon={BellOff}
          title="No notifications"
          message="Updates about your requests and announcements appear here."
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  msg: { marginTop: 6 },
});

export default NotificationsScreen;
