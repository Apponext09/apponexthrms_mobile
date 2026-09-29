import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import dayjs from 'dayjs';
import { CalendarX2, ChevronLeft, ChevronRight } from '@/components/ui/icons';
import {
  AppText,
  Card,
  EmptyState,
  ErrorState,
  ListSkeleton,
  Screen,
  SectionHeader,
  SegmentedTabs,
  StatusBadge,
} from '@/components/ui';
import BarChart from '@/components/charts/BarChart';
import MonthCalendar from '@/components/charts/MonthCalendar';
import StackedBar from '@/components/charts/StackedBar';
import PunchCard from '@/components/common/PunchCard';
import AppHeader from '@/components/common/AppHeader';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import {
  fetchAttendanceHistory,
  fetchAttendanceStatus,
  selectAttendance,
} from '@/store/slices/attendanceSlice';
import { formatDuration, formatTime } from '@/utils/format';

// One status per day: late > half day > present, else whatever the server says
const dayStatus = record => {
  if (record.isLate) return 'late';
  if (record.status === 'half_day') return 'half_day';
  if (record.checkInTime) return 'present';
  return record.status || 'absent';
};

const STATUS_TONE = {
  present: 'success',
  late: 'warning',
  half_day: 'info',
  on_leave: 'info',
  absent: 'danger',
};

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'log', label: 'Daily log' },
];

const DayRow = ({ record }) => {
  const { colors, radius } = useTheme();
  const d = dayjs(record.date);
  const status = dayStatus(record);
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
  const [tab, setTab] = useState('overview');
  const [selectedDay, setSelectedDay] = useState(null);

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

  const byDate = useMemo(() => {
    const map = {};
    records.forEach(r => {
      if (r.date) map[dayjs(r.date).format('YYYY-MM-DD')] = r;
    });
    return map;
  }, [records]);

  // Days of the viewed month that have already happened (up to today)
  const elapsedDays = useMemo(() => {
    const last = isCurrentMonth ? dayjs().date() : month.daysInMonth();
    return Array.from({ length: last }, (_, i) => month.add(i, 'day'));
  }, [month, isCurrentMonth]);

  const composition = useMemo(() => {
    const counts = { present: 0, late: 0, half_day: 0, other: 0 };
    records.forEach(r => {
      const st = dayStatus(r);
      if (counts[st] !== undefined) counts[st] += 1;
      else counts.other += 1;
    });
    const noPunch = elapsedDays.filter(
      d => !byDate[d.format('YYYY-MM-DD')],
    ).length;
    return [
      { label: 'Present', value: counts.present, color: colors.success },
      { label: 'Late', value: counts.late, color: colors.warning },
      { label: 'Half day', value: counts.half_day, color: colors.info },
      { label: 'Other', value: counts.other, color: colors.danger },
      { label: 'No punch', value: noPunch, color: colors.border },
    ].filter(x => x.value > 0 || x.label === 'Present');
  }, [records, elapsedDays, byDate, colors]);

  const hoursData = useMemo(
    () =>
      elapsedDays.map(d => {
        const r = byDate[d.format('YYYY-MM-DD')];
        const n = d.date();
        return {
          label: n === 1 || n % 5 === 0 ? String(n) : '',
          value: r ? Math.round(((r.durationMinutes || 0) / 60) * 10) / 10 : 0,
        };
      }),
    [elapsedDays, byDate],
  );

  const calendarDays = useMemo(() => {
    const map = {};
    Object.entries(byDate).forEach(([k, r]) => {
      map[k] = STATUS_TONE[dayStatus(r)] || 'neutral';
    });
    elapsedDays.forEach(d => {
      const k = d.format('YYYY-MM-DD');
      if (!map[k] && !d.isSame(dayjs(), 'day')) map[k] = 'neutral';
    });
    return map;
  }, [byDate, elapsedDays]);

  const selectedRecord = selectedDay ? byDate[selectedDay] : null;
  const loadingFirst = history.loading && !history.loaded;

  return (
    <Screen
      refreshing={history.loading && history.loaded}
      onRefresh={load}
      hero={<AppHeader />}
    >
      <PunchCard />

      <View style={styles.monthRow}>
        <Pressable
          onPress={() => {
            setMonth(m => m.subtract(1, 'month'));
            setSelectedDay(null);
          }}
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
          onPress={() => {
            setMonth(m => m.add(1, 'month'));
            setSelectedDay(null);
          }}
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

      <Card style={styles.tabsCard}>
        <SegmentedTabs options={TABS} value={tab} onChange={setTab} />
      </Card>

      {loadingFirst ? (
        <ListSkeleton rows={3} />
      ) : history.error ? (
        <ErrorState message={history.error} onRetry={load} />
      ) : tab === 'overview' ? (
        <>
          <SectionHeader
            title="Month composition"
            style={styles.firstSection}
          />
          <Card>
            <AppText
              variant="caption"
              color="mutedForeground"
              style={styles.hint}
            >
              How your {elapsedDays.length} days so far break down
            </AppText>
            <StackedBar segments={composition} />
          </Card>

          <SectionHeader title="Hours logged" />
          <Card>
            <AppText
              variant="caption"
              color="mutedForeground"
              style={styles.hint}
            >
              {formatDuration(summary.minutes)} across {summary.present} working{' '}
              {summary.present === 1 ? 'day' : 'days'}
            </AppText>
            <BarChart data={hoursData} height={110} barWidth="70%" />
          </Card>
        </>
      ) : tab === 'calendar' ? (
        <>
          <Card style={styles.calendarCard}>
            <MonthCalendar
              month={month}
              days={calendarDays}
              selected={selectedDay}
              onSelect={setSelectedDay}
            />
            <View style={styles.calLegend}>
              {[
                ['Present', colors.success],
                ['Late', colors.warning],
                ['Half day', colors.info],
                ['No punch', colors.mutedForeground],
              ].map(([label, c]) => (
                <View key={label} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: c }]} />
                  <AppText variant="small" color="textSecondary">
                    {label}
                  </AppText>
                </View>
              ))}
            </View>
          </Card>
          {selectedDay ? (
            selectedRecord ? (
              <DayRow record={selectedRecord} />
            ) : (
              <Card>
                <AppText variant="caption" color="mutedForeground">
                  No attendance recorded on{' '}
                  {dayjs(selectedDay).format('ddd, DD MMM')}.
                </AppText>
              </Card>
            )
          ) : (
            <AppText variant="caption" color="mutedForeground" align="center">
              Tap a day to see its punches
            </AppText>
          )}
        </>
      ) : records.length ? (
        <View style={styles.firstSection}>
          {records.map(r => (
            <DayRow key={r.id || r.date} record={r} />
          ))}
        </View>
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
  tabsCard: { padding: 8, marginTop: 12 },
  firstSection: { marginTop: 16 },
  hint: { marginBottom: 14 },
  calendarCard: { marginTop: 16, marginBottom: 12, paddingHorizontal: 8 },
  calLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    marginTop: 12,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
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
