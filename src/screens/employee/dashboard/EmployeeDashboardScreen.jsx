import React, { useCallback, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CalendarCheck, Clock, Receipt, Wallet } from '@/components/ui/icons';
import {
  AppText,
  Card,
  Screen,
  SectionHeader,
  StatCard,
} from '@/components/ui';
import PunchCard from '@/components/common/PunchCard';
import LeaveCard from '@/components/common/LeaveCard';
import ProgressRing from '@/components/charts/ProgressRing';
import AppHeader from '@/components/common/AppHeader';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { fetchMyStats, selectMyStats } from '@/store/slices/dashboardSlice';
import {
  fetchAttendanceStatus,
  selectAttendance,
} from '@/store/slices/attendanceSlice';
import {
  fetchLeaveBalances,
  fetchMyLeaves,
  selectLeave,
} from '@/store/slices/leaveSlice';
import { fetchUnreadCount } from '@/store/slices/notificationSlice';
import { formatCurrency } from '@/utils/format';

const EmployeeDashboardScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const stats = useAppSelector(selectMyStats);
  const { status } = useAppSelector(selectAttendance);
  const { balances, mine } = useAppSelector(selectLeave);

  const load = useCallback(() => {
    dispatch(fetchMyStats());
    dispatch(fetchAttendanceStatus());
    dispatch(fetchLeaveBalances());
    dispatch(fetchMyLeaves());
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  const d = stats.data || {};
  const refreshing = (stats.loading || status.loading) && stats.loaded;
  const recentLeaves = (mine.data || []).slice(0, 2);

  return (
    <Screen refreshing={refreshing} onRefresh={load} hero={<AppHeader />}>
      <PunchCard />

      <SectionHeader title="This month" />
      <View style={styles.grid}>
        <StatCard
          icon={CalendarCheck}
          label="Days present"
          value={d.attendanceDays ?? 0}
          tone="success"
        />
        <StatCard
          icon={Clock}
          label="Leave days taken"
          value={d.leaveDays ?? 0}
          tone="primary"
        />
        <StatCard
          icon={Wallet}
          label="Expenses claimed"
          value={formatCurrency(d.expenseAmount ?? 0)}
          tone="warning"
        />
        <StatCard
          icon={Receipt}
          label="Pending claims"
          value={d.pendingExpenses ?? 0}
          tone="danger"
        />
      </View>

      <SectionHeader
        title="Leave balance"
        actionLabel="View all"
        onAction={() => navigation.navigate('LeaveTab')}
      />
      {balances.data?.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.balRow}
        >
          {balances.data.map(b => {
            const total = b.total || b.available + b.consumed || 1;
            return (
              <Card key={`${b.leaveTypeId}-${b.name}`} style={styles.balCard}>
                <ProgressRing
                  size={64}
                  stroke={7}
                  progress={b.available / total}
                  color={colors.primary}
                >
                  <AppText variant="h3">{b.available}</AppText>
                </ProgressRing>
                <AppText
                  variant="captionMedium"
                  numberOfLines={1}
                  style={styles.balName}
                >
                  {b.name}
                </AppText>
                <AppText variant="small" color="mutedForeground">
                  {b.consumed} used
                </AppText>
              </Card>
            );
          })}
        </ScrollView>
      ) : (
        <Card>
          <AppText variant="caption" color="mutedForeground">
            {balances.loading ? 'Loading balances…' : 'No leave balances found'}
          </AppText>
        </Card>
      )}

      {recentLeaves.length ? (
        <>
          <SectionHeader
            title="Recent requests"
            actionLabel="See all"
            onAction={() => navigation.navigate('LeaveTab')}
          />
          {recentLeaves.map(l => (
            <LeaveCard
              key={l.id}
              item={l}
              onPress={() => navigation.navigate('LeaveDetail', { leave: l })}
            />
          ))}
        </>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  balRow: { gap: 12, paddingRight: 8 },
  balCard: { width: 130, alignItems: 'center' },
  balName: { marginTop: 10 },
});

export default EmployeeDashboardScreen;
