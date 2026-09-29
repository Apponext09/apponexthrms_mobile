import React, { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Briefcase,
  Building2,
  CalendarClock,
  ClipboardCheck,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react-native';
import {
  AppText,
  Avatar,
  Card,
  EmptyState,
  Screen,
  SectionHeader,
  Skeleton,
  StatCard,
  StatusBadge,
} from '@/components/ui';
import MiniBarChart from '@/components/common/MiniBarChart';
import ProgressRing from '@/components/common/ProgressRing';
import AppHeader from '@/components/common/AppHeader';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import {
  fetchAdminStats,
  selectAdminStats,
} from '@/store/slices/dashboardSlice';
import { fetchUnreadCount } from '@/store/slices/notificationSlice';
import { formatCompact } from '@/utils/format';

const Legend = ({ color, label, value }) => (
  <View style={styles.legend}>
    <View style={[styles.legendDot, { backgroundColor: color }]} />
    <AppText variant="caption" color="mutedForeground" style={styles.flex}>
      {label}
    </AppText>
    <AppText variant="captionMedium">{value}</AppText>
  </View>
);

const AdminDashboardScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const stats = useAppSelector(selectAdminStats);

  const load = useCallback(() => {
    dispatch(fetchAdminStats());
    dispatch(fetchUnreadCount());
  }, [dispatch]);
  useEffect(() => {
    load();
  }, [load]);

  const d = stats.data || {};
  const k = d.kpis || {};
  const today = d.attendanceAnalytics?.today || {};
  const weekly = (d.attendanceAnalytics?.weeklyTrend || []).map(w => ({
    label: String(w.day || '').slice(0, 2),
    value: w.present,
    secondary: w.late,
  }));
  const byType = d.leaveAnalytics?.byType || [];

  return (
    <Screen
      refreshing={stats.loading && stats.loaded}
      onRefresh={load}
      hero={<AppHeader />}
    >
      {stats.loading && !stats.loaded ? (
        <View style={styles.grid}>
          {[0, 1, 2, 3].map(i => (
            <Skeleton key={i} height={110} radius={16} style={styles.skel} />
          ))}
        </View>
      ) : stats.error ? (
        <EmptyState
          title="Dashboard unavailable"
          message={stats.error}
          actionLabel="Try again"
          onAction={load}
        />
      ) : (
        <>
          <View style={styles.grid}>
            <StatCard
              icon={Users}
              label="Headcount"
              value={k.totalHeadcount ?? 0}
              tone="primary"
              caption={k.newHires ? `+${k.newHires} new hires` : undefined}
            />
            <StatCard
              icon={CalendarClock}
              label="On leave today"
              value={k.onLeaveToday ?? 0}
              tone="warning"
            />
            <StatCard
              icon={ClipboardCheck}
              label="Pending approvals"
              value={k.pendingApprovals ?? 0}
              tone="danger"
              onPress={() => navigation.navigate('AdminLeaveTab')}
            />
            <StatCard
              icon={Wallet}
              label="Monthly payroll"
              value={`₹${formatCompact(k.monthlyPayrollCost)}`}
              tone="success"
            />
            <StatCard
              icon={Building2}
              label="Departments"
              value={k.activeDepartments ?? 0}
              tone="info"
            />
            <StatCard
              icon={Briefcase}
              label="Open jobs"
              value={k.openJobs ?? 0}
              tone="primary"
            />
          </View>

          <SectionHeader
            title="Today's attendance"
            actionLabel="Details"
            onAction={() => navigation.navigate('AdminAttendanceTab')}
          />
          <Card style={styles.todayCard}>
            <ProgressRing
              size={96}
              stroke={10}
              progress={(Number(today.attendanceRate) || 0) / 100}
              color={colors.success}
            >
              <AppText variant="h2">
                {Math.round(Number(today.attendanceRate) || 0)}%
              </AppText>
              <AppText variant="small" color="mutedForeground">
                present
              </AppText>
            </ProgressRing>
            <View style={styles.legendCol}>
              <Legend
                color={colors.success}
                label="Present"
                value={today.present ?? 0}
              />
              <Legend
                color={colors.warning}
                label="Late"
                value={today.late ?? 0}
              />
              <Legend
                color={colors.info}
                label="On leave"
                value={today.onLeave ?? 0}
              />
              <Legend
                color={colors.danger}
                label="Absent"
                value={today.absent ?? 0}
              />
            </View>
          </Card>

          {weekly.length ? (
            <>
              <SectionHeader title="This week" />
              <Card>
                <MiniBarChart
                  data={weekly}
                  color={colors.primary}
                  secondaryColor={colors.warning}
                />
                <View style={styles.chartLegend}>
                  <Legend color={colors.primary} label="Present" value="" />
                  <Legend color={colors.warning} label="Late" value="" />
                </View>
              </Card>
            </>
          ) : null}

          {byType.length ? (
            <>
              <SectionHeader title="Leave by type" />
              <Card>
                {byType.map((t, i) => (
                  <View
                    key={t.leaveTypeId || i}
                    style={[
                      styles.typeRow,
                      i < byType.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: t.color || colors.primary },
                      ]}
                    />
                    <AppText variant="bodyMedium" style={styles.flex}>
                      {t.name}
                    </AppText>
                    <AppText variant="caption" color="success">
                      {t.approvedCount} approved
                    </AppText>
                    <AppText
                      variant="caption"
                      color="warning"
                      style={styles.pending}
                    >
                      {t.pendingCount} pending
                    </AppText>
                  </View>
                ))}
              </Card>
            </>
          ) : null}

          {d.recentEmployees?.length ? (
            <>
              <SectionHeader title="Recently joined" />
              <Card padded={false}>
                {d.recentEmployees.slice(0, 5).map((e, i, arr) => (
                  <Pressable
                    key={e.id}
                    style={[
                      styles.empRow,
                      i < arr.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <Avatar
                      uri={e.avatarUrl}
                      firstName={e.firstName}
                      lastName={e.lastName}
                      size={40}
                    />
                    <View style={styles.flex}>
                      <AppText variant="bodyMedium">
                        {e.firstName} {e.lastName}
                      </AppText>
                      <AppText variant="caption" color="mutedForeground">
                        {[e.employeeCode, e.departmentName]
                          .filter(Boolean)
                          .join(' · ')}
                      </AppText>
                    </View>
                    <StatusBadge status={e.status} />
                  </Pressable>
                ))}
              </Card>
            </>
          ) : null}

          <Card style={styles.tip} elevated={false}>
            <UserPlus size={18} color={colors.primary} />
            <AppText
              variant="caption"
              color="textSecondary"
              style={styles.flex}
            >
              Employee onboarding, payroll and reports are available on the web
              portal.
            </AppText>
          </Card>
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  skel: { width: '47%' },
  todayCard: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  legendCol: { flex: 1, gap: 8 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  chartLegend: { flexDirection: 'row', gap: 20, marginTop: 14 },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  pending: { marginLeft: 8 },
  empRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20 },
});

export default AdminDashboardScreen;
