import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import {
  CalendarX2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Plus,
} from '@/components/ui/icons';
import {
  AppText,
  Badge,
  Button,
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
import MissedPunchBanner from '@/components/common/MissedPunchBanner';
import AppHeader from '@/components/common/AppHeader';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import {
  fetchAttendanceHistory,
  fetchAttendanceSetup,
  fetchAttendanceStatus,
  fetchMyRegularizations,
  selectAttendance,
} from '@/store/slices/attendanceSlice';
import { selectProfile } from '@/store/slices/profileSlice';
import { DAY_STATUS, dateKey, getDayStatus } from '@/utils/attendanceDay';
import { checkDay } from '@/utils/workingDays';
import { formatDate, formatDuration, formatTime } from '@/utils/format';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'log', label: 'Daily log' },
  { key: 'requests', label: 'Requests' },
];

// Statuses that can be corrected with a work hour request
const FIXABLE = ['missed_punch_out', 'absent', 'late', 'early_checkout'];

const DayRow = ({ day, onFix }) => {
  const { colors, radius } = useTheme();
  const d = dayjs(day.date);
  const r = day.record;
  const meta = DAY_STATUS[day.status];
  return (
    <Card style={styles.dayCard}>
      <View style={styles.dayTop}>
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
          {r ? (
            <View style={styles.times}>
              <View>
                <AppText variant="small" color="mutedForeground">
                  IN
                </AppText>
                <AppText variant="bodyMedium">
                  {formatTime(r.checkInTime)}
                </AppText>
              </View>
              <View>
                <AppText variant="small" color="mutedForeground">
                  OUT
                </AppText>
                <AppText variant="bodyMedium">
                  {formatTime(r.checkOutTime)}
                </AppText>
              </View>
              <View>
                <AppText variant="small" color="mutedForeground">
                  HOURS
                </AppText>
                <AppText variant="bodyMedium">
                  {r.durationMinutes ? formatDuration(r.durationMinutes) : '—'}
                </AppText>
              </View>
            </View>
          ) : (
            <AppText variant="caption" color="mutedForeground">
              {day.holiday ? day.holiday.name : 'No punches'}
            </AppText>
          )}
        </View>
        {meta ? <Badge label={meta.label} tone={meta.tone} /> : null}
      </View>
      {r?.locationName || r?.isRegularized ? (
        <AppText
          variant="caption"
          color="mutedForeground"
          style={styles.dayMeta}
        >
          {[r.locationName, r.isRegularized ? 'Regularized' : null]
            .filter(Boolean)
            .join(' · ')}
        </AppText>
      ) : null}
      {onFix && FIXABLE.includes(day.status) ? (
        <Button
          title={
            day.status === 'missed_punch_out'
              ? 'Fix missed punch-out'
              : 'Request correction'
          }
          variant="secondary"
          size="sm"
          onPress={() => onFix(day)}
          style={styles.fixBtn}
        />
      ) : null}
    </Card>
  );
};

const RequestRow = ({ item }) => (
  <Card style={styles.dayCard}>
    <View style={styles.dayTop}>
      <View style={styles.flex}>
        <AppText variant="bodyMedium">
          {item.isDateRange && item.endDate && item.endDate !== item.date
            ? `${formatDate(item.date, 'DD MMM')} – ${formatDate(item.endDate)}`
            : formatDate(item.date, 'ddd, DD MMM YYYY')}
        </AppText>
        <AppText variant="caption" color="mutedForeground">
          {item.reason}
          {item.dayType ? ` · ${item.dayType}` : ''}
        </AppText>
      </View>
      <StatusBadge status={item.status} />
    </View>
    <AppText variant="caption" color="textSecondary" style={styles.dayMeta}>
      Requested {formatTime(item.checkIn)} – {formatTime(item.checkOut)}
      {item.actualCheckIn || item.actualCheckOut
        ? ` · punched ${formatTime(item.actualCheckIn)} – ${formatTime(
            item.actualCheckOut,
          )}`
        : ''}
    </AppText>
    {item.managerComments || item.hrComments ? (
      <AppText variant="caption" color="mutedForeground" style={styles.dayMeta}>
        “{item.hrComments || item.managerComments}”
      </AppText>
    ) : null}
  </Card>
);

const AttendanceScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors, radius } = useTheme();
  const { history, setup, myRegularizations } =
    useAppSelector(selectAttendance);
  const [month, setMonth] = useState(dayjs().startOf('month'));
  const [tab, setTab] = useState('overview');
  const [selectedDay, setSelectedDay] = useState(null);
  const requireCheckout = setup.data.requireCheckout;
  const joinedOn = useAppSelector(selectProfile).employee.data?.dateOfJoining;

  const load = useCallback(() => {
    dispatch(fetchAttendanceStatus());
    dispatch(fetchAttendanceSetup());
    dispatch(fetchMyRegularizations());
    dispatch(fetchAttendanceHistory({ month: month.format('YYYY-MM-DD') }));
  }, [dispatch, month]);

  useEffect(() => {
    load();
  }, [load]);

  const isCurrentMonth = month.isSame(dayjs(), 'month');
  const { holidays, weeklyOffRules } = setup.data;

  const byDate = useMemo(() => {
    const map = {};
    (history.data || []).forEach(r => {
      if (r.date) map[dateKey(r.date)] = r;
    });
    return map;
  }, [history.data]);

  // Every day of the viewed month with its status (portal rules)
  const days = useMemo(() => {
    const list = [];
    for (let i = 0; i < month.daysInMonth(); i += 1) {
      const d = month.add(i, 'day');
      const key = dateKey(d);
      const record = byDate[key] || null;
      const off = checkDay(d, holidays, weeklyOffRules);
      list.push({
        date: key,
        record,
        holiday: off.holiday || null,
        status: getDayStatus({
          date: d,
          record,
          holidays,
          weeklyOffRules,
          requireCheckout,
          joinedOn,
        }),
      });
    }
    return list;
  }, [month, byDate, holidays, weeklyOffRules, requireCheckout, joinedOn]);

  const pastDays = useMemo(
    () => days.filter(d => !dayjs(d.date).isAfter(dayjs(), 'day')),
    [days],
  );

  const summary = useMemo(() => {
    const count = st => pastDays.filter(d => d.status === st).length;
    const records = pastDays.map(d => d.record).filter(Boolean);
    const workMinutes = records.reduce(
      (n, r) => n + (r.durationMinutes || 0),
      0,
    );
    const breakMinutes = records.reduce((n, r) => n + (r.breakMinutes || 0), 0);
    const worked = records.filter(r => r.checkInTime).length;
    return {
      present: worked,
      late: count('late'),
      absent: count('absent'),
      missed: count('missed_punch_out'),
      workMinutes,
      breakMinutes,
      avg: worked ? workMinutes / worked : 0,
    };
  }, [pastDays]);

  const composition = useMemo(() => {
    const tones = {
      success: colors.success,
      warning: colors.warning,
      info: colors.info,
      danger: colors.danger,
      neutral: colors.border,
    };
    const counts = {};
    pastDays.forEach(d => {
      if (d.status) counts[d.status] = (counts[d.status] || 0) + 1;
    });
    return Object.keys(DAY_STATUS)
      .filter(k => counts[k])
      .map(k => ({
        label: DAY_STATUS[k].label,
        value: counts[k],
        color: tones[DAY_STATUS[k].tone],
      }));
  }, [pastDays, colors]);

  const hoursData = useMemo(
    () =>
      pastDays.map(d => {
        const n = dayjs(d.date).date();
        return {
          label: n === 1 || n % 5 === 0 ? String(n) : '',
          value: d.record
            ? Math.round(((d.record.durationMinutes || 0) / 60) * 10) / 10
            : 0,
        };
      }),
    [pastDays],
  );

  const calendarDays = useMemo(() => {
    const map = {};
    days.forEach(d => {
      if (d.status) map[d.date] = DAY_STATUS[d.status].tone;
    });
    return map;
  }, [days]);

  const openFix = day =>
    navigation.navigate('WorkHourRequest', {
      date: day.date,
      reason:
        day.status === 'missed_punch_out' || day.status === 'absent'
          ? 'Missed Punch'
          : null,
    });

  const logDays = useMemo(
    () =>
      [...pastDays]
        .reverse()
        .filter(
          d => d.record || d.status === 'absent' || d.status === 'holiday',
        ),
    [pastDays],
  );
  const selected = selectedDay ? days.find(d => d.date === selectedDay) : null;
  const loadingFirst = history.loading && !history.loaded;

  const changeMonth = delta => {
    setMonth(m => m.add(delta, 'month'));
    setSelectedDay(null);
  };

  return (
    <Screen
      refreshing={history.loading && history.loaded}
      onRefresh={load}
      hero={<AppHeader />}
    >
      <PunchCard />

      <MissedPunchBanner />

      <View style={styles.monthRow}>
        <Pressable
          onPress={() => changeMonth(-1)}
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
          onPress={() => changeMonth(1)}
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
        {[
          ['Present', summary.present, 'success'],
          ['Late', summary.late, 'warning'],
          ['Absent', summary.absent, 'danger'],
        ].map(([label, value, color]) => (
          <View key={label} style={styles.sumItem}>
            <AppText variant="h2" color={color}>
              {value}
            </AppText>
            <AppText variant="caption" color="mutedForeground">
              {label}
            </AppText>
          </View>
        ))}
      </Card>
      <Card style={[styles.summary, styles.summary2]}>
        {[
          ['Net hours', formatDuration(summary.workMinutes)],
          ['Break', formatDuration(summary.breakMinutes)],
          ['Avg / day', formatDuration(summary.avg)],
        ].map(([label, value]) => (
          <View key={label} style={styles.sumItem}>
            <AppText variant="h3">{value}</AppText>
            <AppText variant="caption" color="mutedForeground">
              {label}
            </AppText>
          </View>
        ))}
      </Card>

      <Card style={styles.tabsCard}>
        <SegmentedTabs options={TABS} value={tab} onChange={setTab} />
      </Card>

      {tab === 'requests' ? (
        <>
          <Button
            title="New work hour request"
            icon={Plus}
            variant="secondary"
            onPress={() => navigation.navigate('WorkHourRequest')}
            style={styles.firstSection}
          />
          <View style={styles.firstSection}>
            {myRegularizations.loading && !myRegularizations.loaded ? (
              <ListSkeleton rows={2} />
            ) : myRegularizations.error ? (
              <ErrorState message={myRegularizations.error} onRetry={load} />
            ) : myRegularizations.data.length ? (
              myRegularizations.data.map(r => (
                <RequestRow key={r.id} item={r} />
              ))
            ) : (
              <EmptyState
                icon={ClipboardList}
                title="No work hour requests"
                message="Requests to correct your attendance will appear here."
              />
            )}
          </View>
        </>
      ) : loadingFirst ? (
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
              How your {pastDays.length} days so far break down
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
              {formatDuration(summary.workMinutes)} across {summary.present}{' '}
              working {summary.present === 1 ? 'day' : 'days'}
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
                ['Late / early', colors.warning],
                ['Leave / holiday', colors.info],
                ['Absent / missed', colors.danger],
                ['Weekend', colors.mutedForeground],
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
          {selected ? (
            <DayRow day={selected} onFix={openFix} />
          ) : (
            <AppText variant="caption" color="mutedForeground" align="center">
              Tap a day to see its punches or request a correction
            </AppText>
          )}
        </>
      ) : logDays.length ? (
        <View style={styles.firstSection}>
          {logDays.map(d => (
            <DayRow key={d.date} day={d} onFix={openFix} />
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
  summary2: { marginTop: 10 },
  sumItem: { alignItems: 'center', flex: 1 },
  tabsCard: { padding: 8, marginTop: 12 },
  firstSection: { marginTop: 16 },
  hint: { marginBottom: 14 },
  calendarCard: { marginTop: 16, marginBottom: 12, paddingHorizontal: 8 },
  calLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  dayCard: { marginBottom: 10, padding: 12 },
  dayTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dayMeta: { marginTop: 8 },
  fixBtn: { marginTop: 10 },
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
