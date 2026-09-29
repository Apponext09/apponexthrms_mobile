import React, { useCallback, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Bell,
  CalendarCheck,
  CalendarPlus,
  Clock,
  History,
  Receipt,
  ReceiptText,
  Wallet,
} from 'lucide-react-native';
import {
  AppText,
  Avatar,
  Card,
  GradientHeader,
  HeaderIconButton,
  Screen,
  SectionHeader,
  StatCard,
} from '@/components/ui';
import PunchCard from '@/components/common/PunchCard';
import LeaveCard from '@/components/common/LeaveCard';
import ProgressRing from '@/components/common/ProgressRing';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { selectUser } from '@/store/slices/authSlice';
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
import {
  fetchUnreadCount,
  selectNotifications,
} from '@/store/slices/notificationSlice';
import { formatCurrency, greeting } from '@/utils/format';

const QuickAction = ({ icon: Icon, label, onPress, tone }) => {
  const { colors, radius } = useTheme();
  const [bg, fg] = {
    primary: [colors.primarySoft, colors.primary],
    success: [colors.successSoft, colors.success],
    warning: [colors.warningSoft, colors.warning],
    info: [colors.infoSoft, colors.info],
  }[tone];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.qa, pressed && { opacity: 0.7 }]}
    >
      <View
        style={[
          styles.qaIcon,
          { backgroundColor: bg, borderRadius: radius.lg },
        ]}
      >
        <Icon size={22} color={fg} />
      </View>
      <AppText variant="captionMedium" align="center" numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
};

const EmployeeDashboardScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const user = useAppSelector(selectUser);
  const stats = useAppSelector(selectMyStats);
  const { status } = useAppSelector(selectAttendance);
  const { balances, mine } = useAppSelector(selectLeave);
  const { unread } = useAppSelector(selectNotifications);

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
    <Screen
      refreshing={refreshing}
      onRefresh={load}
      statusBarLight
      header={
        <GradientHeader
          subtitle={`${greeting()},`}
          title={
            user?.firstName
              ? `${user.firstName} ${user.lastName || ''}`.trim()
              : 'Welcome'
          }
          right={
            <View style={styles.headerRight}>
              <HeaderIconButton
                icon={Bell}
                badge={unread > 0}
                onPress={() => navigation.navigate('Notifications')}
              />
              <Pressable onPress={() => navigation.navigate('ProfileTab')}>
                <Avatar
                  uri={user?.avatarUrl}
                  firstName={user?.firstName}
                  lastName={user?.lastName}
                  size={42}
                  style={styles.avatar}
                />
              </Pressable>
            </View>
          }
        />
      }
    >
      <PunchCard />

      <View style={styles.qaRow}>
        <QuickAction
          icon={CalendarPlus}
          label="Apply leave"
          tone="primary"
          onPress={() => navigation.navigate('ApplyLeave')}
        />
        <QuickAction
          icon={ReceiptText}
          label="New claim"
          tone="warning"
          onPress={() => navigation.navigate('NewExpense')}
        />
        <QuickAction
          icon={History}
          label="Attendance"
          tone="success"
          onPress={() => navigation.navigate('AttendanceTab')}
        />
        <QuickAction
          icon={Receipt}
          label="My claims"
          tone="info"
          onPress={() => navigation.navigate('ExpenseTab')}
        />
      </View>

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
  qaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  qa: { width: '23%', alignItems: 'center', gap: 8 },
  qaIcon: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  balRow: { gap: 12, paddingRight: 8 },
  balCard: { width: 130, alignItems: 'center' },
  balName: { marginTop: 10 },
});

export default EmployeeDashboardScreen;
