import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CalendarOff, Plus } from 'lucide-react-native';
import {
  AppText,
  Button,
  Card,
  EmptyState,
  ErrorState,
  GradientHeader,
  ListSkeleton,
  Screen,
  SectionHeader,
  SegmentedTabs,
} from '@/components/ui';
import LeaveCard from '@/components/common/LeaveCard';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import {
  fetchLeaveBalances,
  fetchMyLeaves,
  selectLeave,
} from '@/store/slices/leaveSlice';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'cancelled', label: 'Cancelled' },
];

const LeaveScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors, radius } = useTheme();
  const { balances, mine } = useAppSelector(selectLeave);
  const [filter, setFilter] = useState('all');

  const load = useCallback(() => {
    dispatch(fetchLeaveBalances());
    dispatch(fetchMyLeaves());
  }, [dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  const list = useMemo(() => {
    const all = mine.data || [];
    if (filter === 'all') return all;
    if (filter === 'pending')
      return all.filter(
        l => l.status.startsWith('pending') || l.status === 'submitted',
      );
    return all.filter(l => l.status === filter);
  }, [mine.data, filter]);

  return (
    <Screen
      statusBarLight
      refreshing={mine.loading && mine.loaded}
      onRefresh={load}
      header={
        <GradientHeader subtitle="Plan your time off" title="Leave">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.balRow}
          >
            {(balances.data || []).map(b => (
              <View
                key={`${b.leaveTypeId}-${b.name}`}
                style={[styles.balChip, { borderRadius: radius.lg }]}
              >
                <AppText variant="h2" color="#FFFFFF">
                  {b.available}
                </AppText>
                <AppText
                  variant="small"
                  color="rgba(255,255,255,0.85)"
                  numberOfLines={1}
                >
                  {b.code || b.name}
                </AppText>
              </View>
            ))}
            {!balances.data?.length && !balances.loading ? (
              <AppText variant="caption" color="rgba(255,255,255,0.85)">
                No leave balances configured
              </AppText>
            ) : null}
          </ScrollView>
        </GradientHeader>
      }
      footer={
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <Button
            title="Apply for leave"
            icon={Plus}
            onPress={() => navigation.navigate('ApplyLeave')}
          />
        </View>
      }
    >
      {balances.data?.length ? (
        <Card style={styles.balDetail}>
          {balances.data.map((b, i) => (
            <View
              key={`${b.leaveTypeId}-${i}`}
              style={[
                styles.balLine,
                i < balances.data.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <AppText
                variant="bodyMedium"
                style={styles.flex}
                numberOfLines={1}
              >
                {b.name}
              </AppText>
              <AppText variant="caption" color="mutedForeground">
                {b.consumed} used{b.pending ? ` · ${b.pending} pending` : ''}
              </AppText>
              <AppText variant="bodyMedium" color="primary">
                {b.available} left
              </AppText>
            </View>
          ))}
        </Card>
      ) : null}

      <SectionHeader title="My requests" />
      <SegmentedTabs
        options={FILTERS}
        value={filter}
        onChange={setFilter}
        style={styles.tabs}
      />

      {mine.loading && !mine.loaded ? (
        <ListSkeleton />
      ) : mine.error ? (
        <ErrorState message={mine.error} onRetry={load} />
      ) : list.length ? (
        list.map(l => (
          <LeaveCard
            key={l.id}
            item={l}
            onPress={() => navigation.navigate('LeaveDetail', { leave: l })}
          />
        ))
      ) : (
        <EmptyState
          icon={CalendarOff}
          title="No leave requests"
          message="Requests you apply for will show up here."
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  balRow: { gap: 10, marginTop: 16 },
  balChip: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  balDetail: { paddingVertical: 4 },
  balLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  tabs: { marginBottom: 14 },
  footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
});

export default LeaveScreen;
