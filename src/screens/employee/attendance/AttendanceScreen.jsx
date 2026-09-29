import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import dayjs from 'dayjs';
import { CalendarX2, ChevronLeft, ChevronRight } from 'lucide-react-native';
import {
  AppText,
  Card,
  EmptyState,
  ErrorState,
  GradientHeader,
  ListSkeleton,
  Screen,
  SectionHeader,
  StatusBadge,
} from '@/components/ui';
import PunchCard from '@/components/common/PunchCard';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import {
  fetchAttendanceHistory,
  fetchAttendanceStatus,
  selectAttendance,
} from '@/store/slices/attendanceSlice';
import { formatDuration, formatTime } from '@/utils/format';

const DayRow = ({ record }) => {
  const { colors, radius } = useTheme();
  const d = dayjs(record.date);
  const status =
    record.isLate && record.status === 'present'
      ? 'late'
      : record.status || (record.checkInTime ? 'present' : 'absent');
  return (
    <Card style={styles.dayCard}>
      <View
        style={[
          styles.dateBox,
          { backgroundColor: colors.primarySoft, borderRadius: radius.md },
        ]}
      >
        <AppText variant="h3" color="primary">
          {d.format('DD')}
        </AppText>
        <AppText variant="small" color="primary">
          {d.format('ddd').toUpperCase()}
        </AppText>
      </View>
      <View style={styles.flex}>
        <View style={styles.times}>
          <View>
            <AppText variant="small" color="mutedForeground">
              IN
            </AppText>
            <AppText variant="bodyMedium">
              {formatTime(record.checkInTime)}
            </AppText>
          </View>
          <View>
            <AppText variant="small" color="mutedForeground">
              OUT
            </AppText>
            <AppText variant="bodyMedium">
              {formatTime(record.checkOutTime)}
            </AppText>
          </View>
          <View>
            <AppText variant="small" color="mutedForeground">
              HOURS
            </AppText>
            <AppText variant="bodyMedium">
              {record.durationMinutes
                ? formatDuration(record.durationMinutes)
                : '—'}
            </AppText>
          </View>
        </View>
      </View>
      <StatusBadge status={status} />
    </Card>
  );
};

const AttendanceScreen = () => {
  const dispatch = useAppDispatch();
  const { colors, radius } = useTheme();
  const { history } = useAppSelector(selectAttendance);
  const [month, setMonth] = useState(dayjs().startOf('month'));

  const load = useCallback(() => {
    dispatch(fetchAttendanceStatus());
    dispatch(fetchAttendanceHistory({ month: month.format('YYYY-MM-DD') }));
  }, [dispatch, month]);

  useEffect(() => {
    load();
  }, [load]);

  const records = useMemo(
    () =>
      [...(history.data || [])].sort(
        (a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf(),
      ),
    [history.data],
  );
  const summary = useMemo(() => {
    const present = records.filter(r => r.checkInTime).length;
    const late = records.filter(r => r.isLate).length;
    const minutes = records.reduce(
      (acc, r) => acc + (r.durationMinutes || 0),
      0,
    );
    return { present, late, minutes, avg: present ? minutes / present : 0 };
  }, [records]);

  const isCurrentMonth = month.isSame(dayjs(), 'month');

  return (
    <Screen
      statusBarLight
      refreshing={history.loading && history.loaded}
      onRefresh={load}
      header={<GradientHeader subtitle="Track your time" title="Attendance" />}
    >
      <PunchCard />

      <View style={styles.monthRow}>
        <Pressable
          onPress={() => setMonth(m => m.subtract(1, 'month'))}
          hitSlop={10}
          style={[
            styles.navBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.md,
            },
          ]}
        >
          <ChevronLeft size={18} color={colors.foreground} />
        </Pressable>
        <AppText variant="h3">{month.format('MMMM YYYY')}</AppText>
        <Pressable
          disabled={isCurrentMonth}
          onPress={() => setMonth(m => m.add(1, 'month'))}
          hitSlop={10}
          style={[
            styles.navBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.md,
              opacity: isCurrentMonth ? 0.4 : 1,
            },
          ]}
        >
          <ChevronRight size={18} color={colors.foreground} />
        </Pressable>
      </View>

      <Card style={styles.summary}>
        <View style={styles.sumItem}>
          <AppText variant="h2" color="success">
            {summary.present}
          </AppText>
          <AppText variant="caption" color="mutedForeground">
            Present
          </AppText>
        </View>
        <View style={styles.sumItem}>
          <AppText variant="h2" color="warning">
            {summary.late}
          </AppText>
          <AppText variant="caption" color="mutedForeground">
            Late
          </AppText>
        </View>
        <View style={styles.sumItem}>
          <AppText variant="h2">
            {formatDuration(summary.minutes).replace(/ \d+m$/, '')}
          </AppText>
          <AppText variant="caption" color="mutedForeground">
            Total hours
          </AppText>
        </View>
        <View style={styles.sumItem}>
          <AppText variant="h2">{formatDuration(summary.avg)}</AppText>
          <AppText variant="caption" color="mutedForeground">
            Avg / day
          </AppText>
        </View>
      </Card>

      <SectionHeader title="Daily log" />
      {history.loading && !history.loaded ? (
        <ListSkeleton rows={4} />
      ) : history.error ? (
        <ErrorState message={history.error} onRetry={load} />
      ) : records.length ? (
        records.map(r => <DayRow key={r.id || r.date} record={r} />)
      ) : (
        <EmptyState
          icon={CalendarX2}
          title="No attendance yet"
          message={`No records found for ${month.format('MMMM')}.`}
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 12,
  },
  navBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  summary: { flexDirection: 'row', justifyContent: 'space-between' },
  sumItem: { alignItems: 'center', flex: 1 },
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    padding: 12,
  },
  dateBox: {
    width: 50,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 8,
  },
});

export default AttendanceScreen;
