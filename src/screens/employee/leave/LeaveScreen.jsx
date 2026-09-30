import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import dayjs from 'dayjs';
import { useNavigation } from '@react-navigation/native';
import {
  CalendarCheck,
  CalendarOff,
  Hourglass,
  Layers,
  Plus,
  TrendingDown,
  Wallet,
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
  StatusBadge,
  useToast,
} from '@/components/ui';
import LeaveCard from '@/components/common/LeaveCard';
import AppHeader from '@/components/common/AppHeader';
import ProgressBar from '@/components/charts/ProgressBar';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import {
  fetchEncashments,
  fetchLeaveBalances,
  fetchLeaveSetup,
  fetchMyLeaves,
  selectLeave,
  toggleOptionalHoliday,
} from '@/store/slices/leaveSlice';
import { formatCurrency, formatDate } from '@/utils/format';

const TABS = [
  { key: 'requests', label: 'Requests' },
  { key: 'holidays', label: 'Holidays' },
  { key: 'encashment', label: 'Encashment' },
];

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
  const toast = useToast();
  const { balances, mine, setup, encashments, togglingHolidayId } =
    useAppSelector(selectLeave);
  const [tab, setTab] = useState('requests');
  const [filter, setFilter] = useState('all');

  const load = useCallback(() => {
    dispatch(fetchLeaveBalances());
    dispatch(fetchMyLeaves());
    dispatch(fetchLeaveSetup());
    dispatch(fetchEncashments());
  }, [dispatch]);

  const today = dayjs().startOf('day');
  const upcomingHolidays = useMemo(
    () =>
      (setup.data.holidays || [])
        .filter(h => !h.isOptional && !dayjs(h.date).isBefore(today))
        .sort((a, b) => dayjs(a.date) - dayjs(b.date)),
    [setup.data.holidays, today],
  );

  const toggleOptional = async h => {
    const res = await dispatch(toggleOptionalHoliday(h));
    if (toggleOptionalHoliday.fulfilled.match(res))
      toast.show(
        h.selected ? 'Optional holiday removed' : 'Optional holiday selected',
      );
    else toast.show(res.payload || 'Could not update holiday', 'error');
  };

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
              <View style={styles.balTop}>
                <AppText
                  variant="bodyMedium"
                  style={styles.flex}
                  numberOfLines={1}
                >
                  {b.name}
                </AppText>
                <AppText variant="bodyMedium" color="primary">
                  {b.available} left
                </AppText>
              </View>
              {/* Bar shows what is still available out of the allocation */}
              <ProgressBar
                progress={b.total ? b.available / b.total : 0}
                style={styles.balBar}
              />
              <AppText variant="caption" color="mutedForeground">
                {b.consumed} used
                {b.pending ? ` · ${b.pending} pending` : ''}
                {b.total ? ` · ${b.total} allocated` : ''}
              </AppText>
            </View>
          ))}
        </Card>
      ) : null}

      <Card style={styles.tabsCard}>
        <SegmentedTabs options={TABS} value={tab} onChange={setTab} />
      </Card>

      {tab === 'requests' ? (
        <>
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
        </>
      ) : tab === 'holidays' ? (
        <>
          <SectionHeader title="Upcoming holidays" style={styles.firstHeader} />
          {setup.loading && !setup.loaded ? (
            <ListSkeleton rows={2} />
          ) : upcomingHolidays.length ? (
            <Card style={styles.listCard}>
              {upcomingHolidays.map((h, i) => (
                <View
                  key={h.id}
                  style={[
                    styles.holidayRow,
                    i < upcomingHolidays.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.flex}>
                    <AppText variant="bodyMedium">{h.name}</AppText>
                    <AppText variant="caption" color="mutedForeground">
                      {formatDate(h.date, 'dddd, DD MMM YYYY')}
                    </AppText>
                  </View>
                  <AppText variant="caption" color="primary">
                    {dayjs(h.date).diff(today, 'day') === 0
                      ? 'Today'
                      : `in ${dayjs(h.date).diff(today, 'day')}d`}
                  </AppText>
                </View>
              ))}
            </Card>
          ) : (
            <EmptyState
              icon={CalendarOff}
              title="No upcoming holidays"
              message="Your holiday calendar has no more holidays this year."
            />
          )}

          <SectionHeader title="Optional holidays" />
          {setup.data.optionalHolidays.length ? (
            <Card style={styles.listCard}>
              {setup.data.optionalHolidays.map((h, i) => {
                const past = dayjs(h.date).isBefore(today);
                return (
                  <View
                    key={h.id}
                    style={[
                      styles.holidayRow,
                      i < setup.data.optionalHolidays.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.flex}>
                      <AppText variant="bodyMedium">{h.name}</AppText>
                      <AppText variant="caption" color="mutedForeground">
                        {formatDate(h.date, 'ddd, DD MMM YYYY')}
                        {h.selectionStatus ? ` · ${h.selectionStatus}` : ''}
                      </AppText>
                    </View>
                    {past ? (
                      <AppText variant="caption" color="mutedForeground">
                        {h.selected ? 'Taken' : 'Passed'}
                      </AppText>
                    ) : (
                      <Button
                        title={h.selected ? 'Remove' : 'Select'}
                        size="sm"
                        variant={h.selected ? 'outline' : 'secondary'}
                        fullWidth={false}
                        loading={togglingHolidayId === h.id}
                        onPress={() => toggleOptional(h)}
                      />
                    )}
                  </View>
                );
              })}
            </Card>
          ) : (
            <Card>
              <AppText variant="caption" color="mutedForeground">
                No optional holidays in your calendar.
              </AppText>
            </Card>
          )}
        </>
      ) : (
        <>
          <Button
            title="Request leave encashment"
            icon={Wallet}
            variant="secondary"
            onPress={() => navigation.navigate('LeaveEncashment')}
            style={styles.encashBtn}
          />
          {encashments.loading && !encashments.loaded ? (
            <ListSkeleton rows={2} />
          ) : encashments.error ? (
            <ErrorState message={encashments.error} onRetry={load} />
          ) : encashments.data.length ? (
            encashments.data.map(e => (
              <Card key={e.id} style={styles.encashCard}>
                <View style={styles.holidayRow}>
                  <View style={styles.flex}>
                    <AppText variant="bodyMedium">{e.leaveType}</AppText>
                    <AppText variant="caption" color="mutedForeground">
                      {e.days} {e.days === 1 ? 'day' : 'days'} ·{' '}
                      {formatDate(e.date)}
                    </AppText>
                  </View>
                  <View style={styles.right}>
                    <AppText variant="bodyMedium">
                      {formatCurrency(e.amount)}
                    </AppText>
                    <StatusBadge status={e.status} style={styles.badge} />
                  </View>
                </View>
              </Card>
            ))
          ) : (
            <EmptyState
              icon={Wallet}
              title="No encashment requests"
              message="Convert unused leave into pay, where your policy allows it."
            />
          )}
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  balDetail: { paddingVertical: 4 },
  balLine: { paddingVertical: 12 },
  balTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  balBar: { marginTop: 8, marginBottom: 6 },
  tabs: { marginBottom: 14 },
  tabsCard: { padding: 8, marginTop: 16, marginBottom: 14 },
  firstHeader: { marginTop: 0 },
  listCard: { paddingVertical: 4 },
  holidayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  encashBtn: { marginBottom: 14 },
  encashCard: { marginBottom: 10, paddingVertical: 4 },
  right: { alignItems: 'flex-end' },
  badge: { marginTop: 6, alignSelf: 'flex-end' },
  footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
});

export default LeaveScreen;
