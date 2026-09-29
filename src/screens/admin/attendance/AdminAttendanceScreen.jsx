import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ClipboardList } from 'lucide-react-native';
import {
  AppText,
  Card,
  EmptyState,
  ErrorState,
  ListSkeleton,
  Screen,
  SectionHeader,
  StatCard,
  useToast,
} from '@/components/ui';
import MiniBarChart from '@/components/common/MiniBarChart';
import DecisionButtons from '@/components/common/DecisionButtons';
import DecisionSheet from '@/components/common/DecisionSheet';
import AppHeader from '@/components/common/AppHeader';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { selectUser } from '@/store/slices/authSlice';
import {
  fetchAdminStats,
  selectAdminStats,
} from '@/store/slices/dashboardSlice';
import {
  decideRegularization,
  fetchPendingRegularizations,
  selectAttendance,
} from '@/store/slices/attendanceSlice';
import { isAdmin } from '@/utils/roles';
import { pick } from '@/utils/normalize';
import { formatDate, formatTime } from '@/utils/format';

const regView = r => ({
  id: pick(r, 'id'),
  name:
    pick(r, 'employeeName', 'employee_name') ||
    [
      pick(r, 'firstName', 'first_name', 'employeeFirstName'),
      pick(r, 'lastName', 'last_name', 'employeeLastName'),
    ]
      .filter(Boolean)
      .join(' ') ||
    'Employee',
  date: pick(
    r,
    'attendanceDate',
    'attendance_date',
    'requestDate',
    'request_date',
    'date',
  ),
  checkIn: pick(
    r,
    'requestedCheckIn',
    'requested_check_in',
    'checkInTime',
    'check_in_time',
  ),
  checkOut: pick(
    r,
    'requestedCheckOut',
    'requested_check_out',
    'checkOutTime',
    'check_out_time',
  ),
  reason: pick(r, 'reason', 'remarks', 'description') || '',
  type: pick(r, 'requestType', 'request_type', 'type') || 'Regularization',
});

const AdminAttendanceScreen = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { colors } = useTheme();
  const user = useAppSelector(selectUser);
  const stats = useAppSelector(selectAdminStats);
  const { regularizations } = useAppSelector(selectAttendance);
  const asHr = isAdmin(user?.roles);
  const [decision, setDecision] = useState(null); // { item, approve }
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    dispatch(fetchAdminStats());
    dispatch(fetchPendingRegularizations({ asHr }));
  }, [dispatch, asHr]);
  useEffect(() => {
    load();
  }, [load]);

  const today = stats.data?.attendanceAnalytics?.today || {};
  const weekly = (stats.data?.attendanceAnalytics?.weeklyTrend || []).map(
    w => ({
      label: String(w.day || '').slice(0, 2),
      value: w.present,
      secondary: w.late,
    }),
  );
  const regs = (regularizations.data || []).map(regView);

  const submit = async note => {
    setBusy(true);
    const res = await dispatch(
      decideRegularization({
        id: decision.item.id,
        approve: decision.approve,
        asHr,
        comment: note,
      }),
    );
    setBusy(false);
    if (decideRegularization.fulfilled.match(res)) {
      toast.show(decision.approve ? 'Request approved' : 'Request rejected');
      setDecision(null);
    } else toast.show(res.payload || 'Action failed', 'error');
  };

  return (
    <Screen
      refreshing={regularizations.loading && regularizations.loaded}
      onRefresh={load}
      hero={<AppHeader />}
    >
      <View style={styles.grid}>
        <StatCard label="Present" value={today.present ?? 0} tone="success" />
        <StatCard label="Late" value={today.late ?? 0} tone="warning" />
        <StatCard label="On leave" value={today.onLeave ?? 0} tone="info" />
        <StatCard label="Absent" value={today.absent ?? 0} tone="danger" />
      </View>
      <Card style={styles.rateCard}>
        <AppText variant="caption" color="mutedForeground">
          Attendance rate today
        </AppText>
        <AppText variant="h1" color="success">
          {Math.round(Number(today.attendanceRate) || 0)}%
        </AppText>
        <AppText variant="caption" color="mutedForeground">
          of {today.totalHeadcount ?? 0} employees · {today.wfh ?? 0} working
          from home · {today.halfDay ?? 0} half day
        </AppText>
      </Card>

      {weekly.length ? (
        <>
          <SectionHeader title="Weekly trend" />
          <Card>
            <MiniBarChart
              data={weekly}
              color={colors.success}
              secondaryColor={colors.warning}
            />
          </Card>
        </>
      ) : null}

      <SectionHeader
        title={`Regularization requests${
          regs.length ? ` (${regs.length})` : ''
        }`}
      />
      {regularizations.loading && !regularizations.loaded ? (
        <ListSkeleton rows={2} />
      ) : regularizations.error ? (
        <ErrorState message={regularizations.error} onRetry={load} />
      ) : regs.length ? (
        regs.map(r => (
          <Card key={r.id} style={styles.reg}>
            <AppText variant="bodyMedium">{r.name}</AppText>
            <AppText variant="caption" color="mutedForeground">
              {r.type} · {formatDate(r.date)}
              {r.checkIn || r.checkOut
                ? ` · ${formatTime(r.checkIn)} – ${formatTime(r.checkOut)}`
                : ''}
            </AppText>
            {r.reason ? (
              <AppText variant="caption" style={styles.reason}>
                “{r.reason}”
              </AppText>
            ) : null}
            <DecisionButtons
              onApprove={() => setDecision({ item: r, approve: true })}
              onReject={() => setDecision({ item: r, approve: false })}
            />
          </Card>
        ))
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="All caught up"
          message="No attendance corrections are waiting for you."
        />
      )}

      <DecisionSheet
        visible={!!decision}
        approve={decision?.approve}
        subject={
          decision
            ? `${decision.item.name} · ${formatDate(decision.item.date)}`
            : ''
        }
        onClose={() => setDecision(null)}
        onSubmit={submit}
        loading={busy}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  rateCard: { marginTop: 12, gap: 2 },
  reg: { marginBottom: 12 },
  reason: { marginTop: 8, fontStyle: 'italic' },
});

export default AdminAttendanceScreen;
