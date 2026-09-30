import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import dayjs from 'dayjs';
import {
  AppText,
  Button,
  Card,
  DateField,
  Input,
  Screen,
  SelectField,
  StackHeader,
  TimeField,
  useToast,
} from '@/components/ui';
import { attendanceService } from '@/api/services/attendanceService';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import {
  createRegularization,
  selectAttendance,
} from '@/store/slices/attendanceSlice';
import { normalizeAttendanceRecord } from '@/utils/normalize';
import { formatTime, toApiDate } from '@/utils/format';

// Same options as the portal's Work Hour Request form
const REASONS = [
  'Missed Punch',
  'Forgot to Punch',
  'On Duty',
  'Technical Issue',
  'Work From Home',
  'Personal Reason',
].map(r => ({ value: r, label: r }));

const DAY_TYPES = ['Full Day', 'Half Day', 'First Half', 'Second Half'].map(
  d => ({ value: d, label: d }),
);

const toHHmm = t => {
  if (!t) return '';
  if (/^\d{2}:\d{2}/.test(String(t))) return String(t).slice(0, 5);
  const d = dayjs(t);
  return d.isValid() ? d.format('HH:mm') : '';
};

const WorkHourRequestScreen = () => {
  const navigation = useNavigation();
  const { params = {} } = useRoute();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { colors } = useTheme();
  const { status, submittingRegularization } = useAppSelector(selectAttendance);
  const shift = status.data?.shiftInfo || {};

  const [date, setDate] = useState(
    params.date ? dayjs(params.date).toDate() : new Date(),
  );
  const [isRange, setIsRange] = useState(false);
  const [endDate, setEndDate] = useState(date);
  const [actual, setActual] = useState(params.record || null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [reason, setReason] = useState(params.reason || null);
  const [dayType, setDayType] = useState('Full Day');
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState({});

  // Load what was actually punched on the chosen day, like the portal does
  useEffect(() => {
    if (isRange) return;
    const key = toApiDate(date);
    let alive = true;
    attendanceService
      .getHistory({ startDate: key, endDate: key, pageSize: 5 })
      .then(({ items }) => {
        if (!alive) return;
        const rec = items.map(normalizeAttendanceRecord)[0] || null;
        setActual(rec);
      })
      .catch(() => alive && setActual(null));
    return () => {
      alive = false;
    };
  }, [date, isRange]);

  // Prefill requested times: actual punch, otherwise the shift's times
  useEffect(() => {
    setCheckIn(toHHmm(actual?.checkInTime) || toHHmm(shift.startTime));
    setCheckOut(toHHmm(actual?.checkOutTime) || toHHmm(shift.endTime));
  }, [actual, shift.startTime, shift.endTime]);

  const actualText = useMemo(() => {
    if (isRange) return null;
    if (!actual) return 'No punches recorded on this day';
    return `Punched in ${formatTime(actual.checkInTime)} · out ${formatTime(
      actual.checkOutTime,
    )}`;
  }, [actual, isRange]);

  const submit = async () => {
    const next = {};
    if (!reason) next.reason = 'Select a reason';
    if (!checkIn) next.checkIn = 'Required';
    if (!checkOut) next.checkOut = 'Required';
    if (!comment.trim()) next.comment = 'Please add a comment';
    if (isRange && dayjs(endDate).isBefore(dayjs(date), 'day'))
      next.endDate = 'End date cannot be before start date';
    setErrors(next);
    if (Object.keys(next).length) return;

    const start = toApiDate(date);
    const payload = {
      date: start,
      isDateRange: isRange,
      endDate: isRange ? toApiDate(endDate) : start,
      checkIn,
      checkOut,
      actualCheckIn: !isRange
        ? toHHmm(actual?.checkInTime) || undefined
        : undefined,
      actualCheckOut: !isRange
        ? toHHmm(actual?.checkOutTime) || undefined
        : undefined,
      attendanceRecordId: !isRange ? actual?.id || undefined : undefined,
      reason,
      dayType,
      comment: comment.trim(),
    };
    const res = await dispatch(createRegularization(payload));
    if (createRegularization.fulfilled.match(res)) {
      toast.show('Work hour request submitted for approval');
      navigation.goBack();
    } else {
      toast.show(res.payload || 'Could not submit request', 'error');
    }
  };

  return (
    <Screen stack header={<StackHeader title="Work hour request" />}>
      <AppText variant="caption" color="mutedForeground" style={styles.intro}>
        Ask your manager to correct your attendance, for example a missed
        punch-out or a day worked on site.
      </AppText>

      <Card style={styles.rangeCard}>
        <View style={styles.flex}>
          <AppText variant="bodyMedium">Apply for a date range</AppText>
          <AppText variant="caption" color="mutedForeground">
            Same times for every day in the range
          </AppText>
        </View>
        <Switch
          value={isRange}
          onValueChange={setIsRange}
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor="#FFFFFF"
        />
      </Card>

      <View style={styles.row}>
        <DateField
          label={isRange ? 'From' : 'Date'}
          value={date}
          maximumDate={new Date()}
          onChange={d => {
            setDate(d);
            if (dayjs(endDate).isBefore(d, 'day')) setEndDate(d);
          }}
        />
        {isRange ? (
          <DateField
            label="To"
            value={endDate}
            minimumDate={date}
            maximumDate={new Date()}
            onChange={setEndDate}
            error={errors.endDate}
          />
        ) : null}
      </View>

      {actualText ? (
        <Card
          elevated={false}
          style={[
            styles.actual,
            { backgroundColor: colors.muted, borderColor: colors.muted },
          ]}
        >
          <AppText variant="caption" color="textSecondary">
            {actualText}
          </AppText>
        </Card>
      ) : null}

      <View style={styles.row}>
        <TimeField
          label="Check in"
          required
          value={checkIn}
          onChange={setCheckIn}
          error={errors.checkIn}
        />
        <TimeField
          label="Check out"
          required
          value={checkOut}
          onChange={setCheckOut}
          error={errors.checkOut}
        />
      </View>

      <SelectField
        label="Reason"
        placeholder="Select a reason"
        options={REASONS}
        value={reason}
        onChange={setReason}
        error={errors.reason}
      />
      <SelectField
        label="Day type"
        options={DAY_TYPES}
        value={dayType}
        onChange={setDayType}
      />
      <Input
        label="Comment"
        required
        placeholder="What happened on this day?"
        value={comment}
        onChangeText={setComment}
        multiline
        error={errors.comment}
      />

      <Button
        title="Submit request"
        size="lg"
        onPress={submit}
        loading={submittingRegularization}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  intro: { marginBottom: 16 },
  rangeCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  row: { flexDirection: 'row', gap: 12 },
  actual: { padding: 12, marginBottom: 16 },
});

export default WorkHourRequestScreen;
