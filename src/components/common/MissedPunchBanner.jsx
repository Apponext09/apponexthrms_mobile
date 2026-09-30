import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import { AppText, Button, Card } from '@/components/ui';
import { attendanceService } from '@/api/services/attendanceService';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/hooks/useRedux';
import { selectAttendance } from '@/store/slices/attendanceSlice';
import { normalizeAttendanceRecord } from '@/utils/normalize';
import { getDayStatus } from '@/utils/attendanceDay';

const LOOKBACK_DAYS = 14;

// Warns about recent days with a check-in but no check-out and links to a
// work hour request for the most recent one
const MissedPunchBanner = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { status, setup, myRegularizations } = useAppSelector(selectAttendance);
  const requireCheckout = setup.data.requireCheckout;
  const [missed, setMissed] = useState([]);

  useEffect(() => {
    if (!requireCheckout) {
      setMissed([]);
      return;
    }
    let alive = true;
    attendanceService
      .getHistory({
        page: 1,
        pageSize: 31,
        startDate: dayjs().subtract(LOOKBACK_DAYS, 'day').format('YYYY-MM-DD'),
        endDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
      })
      .then(({ items }) => {
        if (!alive) return;
        const days = items
          .map(normalizeAttendanceRecord)
          .filter(
            r =>
              getDayStatus({ date: r.date, record: r, requireCheckout }) ===
              'missed_punch_out',
          )
          .map(r => dayjs(r.date).format('YYYY-MM-DD'))
          .sort()
          .reverse();
        setMissed(days);
      })
      .catch(() => alive && setMissed([]));
    return () => {
      alive = false;
    };
  }, [requireCheckout, status.data?.checkInTime, status.data?.checkOutTime]);

  // Hide days that already have a work hour request
  const requested = new Set((myRegularizations.data || []).map(r => r.date));
  const open = missed.filter(d => !requested.has(d));
  if (!open.length) return null;

  return (
    <Card
      elevated={false}
      style={[
        styles.card,
        { backgroundColor: colors.dangerSoft, borderColor: colors.dangerSoft },
      ]}
    >
      <AppText variant="bodyMedium" color="danger">
        {open.length === 1
          ? `You didn't check out on ${dayjs(open[0]).format('ddd, DD MMM')}`
          : `You missed ${open.length} punch-outs recently`}
      </AppText>
      <AppText variant="caption" color="danger" style={styles.text}>
        {open.length === 1 ? 'That day has' : 'Those days have'} no working
        hours until your manager approves a work hour request.
      </AppText>
      <Button
        title="Fix now"
        variant="danger"
        size="sm"
        fullWidth={false}
        onPress={() =>
          navigation.navigate('WorkHourRequest', {
            date: open[0],
            reason: 'Missed Punch',
          })
        }
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { marginTop: 12, gap: 6, alignItems: 'flex-start' },
  text: { marginBottom: 6 },
});

export default MissedPunchBanner;
