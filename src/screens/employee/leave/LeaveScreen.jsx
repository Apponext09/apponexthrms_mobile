import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  CalendarCheck,
  CalendarOff,
  Hourglass,
  Layers,
  Plus,
  TrendingDown,
} from '@/components/ui/icons';
import {
  AppText,
  Button,
  Card,
  EmptyState,
  ErrorState,
  ListSkeleton,
  Screen,
  SectionHeader,
  SegmentedTabs,
  StatCard,
} from '@/components/ui';
import LeaveCard from '@/components/common/LeaveCard';
import AppHeader from '@/components/common/AppHeader';
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
  const { colors } = useTheme();
  const { balances, mine } = useAppSelector(selectLeave);
  const [filter, setFilter] = useState('all');

  const load = useCallback(() => {
    dispatch(fetchLeaveBalances());
    dispatch(fetchMyLeaves());
  }, [dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    const b = balances.data || [];
    return {
      available: b.reduce((n, x) => n + x.available, 0),
      taken: b.reduce((n, x) => n + x.consumed, 0),
      pending: b.reduce((n, x) => n + x.pending, 0),
      types: b.length,
    };
  }, [balances.data]);

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
      refreshing={mine.loading && mine.loaded}
      onRefresh={load}
      hero={<AppHeader />}
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
      <View style={styles.grid}>
        <StatCard
          icon={CalendarCheck}
          label="Available"
          value={totals.available}
          caption="days across all types"
          tone="primary"
        />
        <StatCard
          icon={TrendingDown}
          label="Taken"
          value={totals.taken}
          caption="days this year"
          tone="success"
        />
        <StatCard
          icon={Hourglass}
          label="Pending"
          value={totals.pending}
          caption="awaiting approval"
          tone="warning"
        />
        <StatCard
          icon={Layers}
          label="Leave types"
          value={totals.types}
          caption="assigned to you"
          tone="info"
        />
      </View>

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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
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
