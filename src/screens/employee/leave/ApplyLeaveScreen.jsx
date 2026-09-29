import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
  useToast,
} from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import {
  applyLeave,
  fetchLeaveBalances,
  fetchLeaveTypes,
  selectLeave,
} from '@/store/slices/leaveSlice';
import { toApiDate } from '@/utils/format';

const ApplyLeaveScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { colors, radius } = useTheme();
  const { types, balances, submitting } = useAppSelector(selectLeave);

  const [leaveTypeId, setLeaveTypeId] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayPeriod, setHalfDayPeriod] = useState('first_half');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(fetchLeaveTypes());
    if (!balances.loaded) dispatch(fetchLeaveBalances());
  }, [dispatch, balances.loaded]);

  const options = useMemo(
    () =>
      (types.data || []).map(t => {
        const bal = (balances.data || []).find(b => b.leaveTypeId === t.id);
        return {
          value: t.id,
          label: t.name,
          description: bal ? `${bal.available} days available` : t.code,
        };
      }),
    [types.data, balances.data],
  );

  const days = isHalfDay
    ? 0.5
    : Math.max(1, dayjs(endDate).diff(dayjs(startDate), 'day') + 1);
  const selectedBal = (balances.data || []).find(
    b => b.leaveTypeId === leaveTypeId,
  );

  const submit = async () => {
    const next = {};
    if (!leaveTypeId) next.type = 'Choose a leave type';
    if (dayjs(endDate).isBefore(dayjs(startDate), 'day'))
      next.end = 'End date cannot be before start date';
    if (reason.trim().length < 3) next.reason = 'Please add a short reason';
    setErrors(next);
    if (Object.keys(next).length) return;

    const res = await dispatch(
      applyLeave({
        leaveTypeId,
        startDate: toApiDate(startDate),
        endDate: toApiDate(isHalfDay ? startDate : endDate),
        reason: reason.trim(),
        isHalfDay,
        ...(isHalfDay ? { halfDayPeriod } : {}),
      }),
    );
    if (applyLeave.fulfilled.match(res)) {
      toast.show('Leave request submitted');
      navigation.goBack();
    } else {
      toast.show(res.payload || 'Could not submit leave', 'error');
    }
  };

  return (
    <Screen stack header={<StackHeader title="Apply for leave" />}>
      <SelectField
        label="Leave type"
        placeholder={
          types.loading ? 'Loading leave types…' : 'Choose a leave type'
        }
        options={options}
        value={leaveTypeId}
        onChange={v => {
          setLeaveTypeId(v);
          setErrors(e => ({ ...e, type: null }));
        }}
        error={errors.type}
      />

      <Card style={styles.halfCard} padded>
        <View style={styles.flex}>
          <AppText variant="bodyMedium">Half day</AppText>
          <AppText variant="caption" color="mutedForeground">
            Take only the first or second half off
          </AppText>
        </View>
        <Switch
          value={isHalfDay}
          onValueChange={setIsHalfDay}
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor="#FFFFFF"
        />
      </Card>

      {isHalfDay ? (
        <View style={styles.periodRow}>
          {[
            { key: 'first_half', label: 'First half' },
            { key: 'second_half', label: 'Second half' },
          ].map(p => {
            const active = halfDayPeriod === p.key;
            return (
              <Pressable
                key={p.key}
                onPress={() => setHalfDayPeriod(p.key)}
                style={[
                  styles.period,
                  {
                    borderRadius: radius.lg,
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.primarySoft : colors.card,
                  },
                ]}
              >
                <AppText
                  variant="bodyMedium"
                  color={active ? 'primary' : 'foreground'}
                >
                  {p.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={styles.dateRow}>
        <DateField
          label={isHalfDay ? 'Date' : 'From'}
          value={startDate}
          onChange={d => {
            setStartDate(d);
            if (dayjs(endDate).isBefore(d, 'day')) setEndDate(d);
          }}
        />
        {!isHalfDay ? (
          <DateField
            label="To"
            value={endDate}
            minimumDate={startDate}
            onChange={setEndDate}
            error={errors.end}
          />
        ) : null}
      </View>

      <Card
        style={[
          styles.summary,
          {
            backgroundColor: colors.primarySoft,
            borderColor: colors.primarySoft,
          },
        ]}
        elevated={false}
      >
        <AppText variant="bodyMedium" color="primary">
          {days} {days === 1 ? 'day' : 'days'} requested
        </AppText>
        {selectedBal ? (
          <AppText variant="caption" color="primary">
            {selectedBal.available} available
          </AppText>
        ) : null}
      </Card>

      <Input
        label="Reason"
        placeholder="e.g. Family function, medical appointment…"
        value={reason}
        onChangeText={t => {
          setReason(t);
          setErrors(e => ({ ...e, reason: null }));
        }}
        multiline
        error={errors.reason}
        hint="Weekends and holidays are counted according to your leave policy."
      />

      <Button
        title="Submit request"
        size="lg"
        onPress={submit}
        loading={submitting}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  halfCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  periodRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  period: {
    flex: 1,
    borderWidth: 1.2,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dateRow: { flexDirection: 'row', gap: 12 },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
});

export default ApplyLeaveScreen;
