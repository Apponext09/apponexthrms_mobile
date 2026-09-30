import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  AppText,
  Button,
  Card,
  Input,
  Screen,
  SelectField,
  StackHeader,
  useToast,
} from '@/components/ui';
import { leaveService } from '@/api/services/leaveService';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import {
  fetchLeaveBalances,
  requestEncashment,
  selectLeave,
} from '@/store/slices/leaveSlice';
import { getErrorMessage } from '@/utils/errors';
import { formatCurrency } from '@/utils/format';

// Convert unused leave into pay. Mirrors the portal's encashment form,
// including the live amount preview from /leaves/encashments/preview.
const LeaveEncashmentScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { colors } = useTheme();
  const { balances, submitting } = useAppSelector(selectLeave);
  const [leaveTypeId, setLeaveTypeId] = useState(null);
  const [days, setDays] = useState('');
  const [reason, setReason] = useState('');
  const [preview, setPreview] = useState(null); // { loading, data, error }
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!balances.loaded) dispatch(fetchLeaveBalances());
  }, [dispatch, balances.loaded]);

  const options = useMemo(
    () =>
      (balances.data || []).map(b => ({
        value: b.leaveTypeId,
        label: b.name,
        description: `${b.available} days available`,
      })),
    [balances.data],
  );
  const balance = (balances.data || []).find(
    b => b.leaveTypeId === leaveTypeId,
  );
  const daysNum = parseFloat(days);

  // Debounced preview, same as the portal
  useEffect(() => {
    if (!leaveTypeId || !(daysNum > 0)) {
      setPreview(null);
      return;
    }
    let alive = true;
    setPreview(p => ({ ...(p || {}), loading: true }));
    const t = setTimeout(async () => {
      try {
        const data = await leaveService.previewEncashment(leaveTypeId, daysNum);
        if (alive) setPreview({ loading: false, data, error: null });
      } catch (err) {
        if (alive)
          setPreview({
            loading: false,
            data: null,
            error: getErrorMessage(err),
          });
      }
    }, 350);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [leaveTypeId, daysNum]);

  const submit = async () => {
    const next = {};
    if (!leaveTypeId) next.type = 'Choose a leave type';
    if (!(daysNum > 0)) next.days = 'Enter the number of days';
    else if (balance && daysNum > balance.available)
      next.days = `Only ${balance.available} days available`;
    setErrors(next);
    if (Object.keys(next).length) return;
    const res = await dispatch(
      requestEncashment({
        leaveTypeId,
        encashmentDays: daysNum,
        reason: reason.trim(),
      }),
    );
    if (requestEncashment.fulfilled.match(res)) {
      toast.show('Encashment request submitted');
      navigation.goBack();
    } else toast.show(res.payload || 'Could not submit request', 'error');
  };

  return (
    <Screen stack header={<StackHeader title="Leave encashment" />}>
      <SelectField
        label="Leave type"
        placeholder="Choose a leave type"
        options={options}
        value={leaveTypeId}
        onChange={v => {
          setLeaveTypeId(v);
          setErrors(e => ({ ...e, type: null }));
        }}
        error={errors.type}
      />
      <Input
        label="Days to encash"
        required
        keyboardType="decimal-pad"
        placeholder="e.g. 2"
        value={days}
        onChangeText={t => {
          setDays(t.replace(/[^0-9.]/g, ''));
          setErrors(e => ({ ...e, days: null }));
        }}
        error={errors.days}
      />

      {preview ? (
        <Card
          elevated={false}
          style={[
            styles.preview,
            {
              backgroundColor: preview.error
                ? colors.dangerSoft
                : colors.primarySoft,
              borderColor: preview.error
                ? colors.dangerSoft
                : colors.primarySoft,
            },
          ]}
        >
          {preview.loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : preview.error ? (
            <AppText variant="caption" color="danger">
              {preview.error}
            </AppText>
          ) : (
            <View>
              <AppText variant="caption" color="primary">
                Estimated payout
              </AppText>
              <AppText variant="h1" color="primary">
                {formatCurrency(preview.data?.totalAmount)}
              </AppText>
              <AppText variant="caption" color="primary">
                {formatCurrency(preview.data?.dailyRate)} per day
                {preview.data?.formula ? ` · ${preview.data.formula}` : ''}
              </AppText>
            </View>
          )}
        </Card>
      ) : null}

      <Input
        label="Reason (optional)"
        placeholder="Why are you encashing this leave?"
        value={reason}
        onChangeText={setReason}
        multiline
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
  preview: { marginBottom: 16, minHeight: 60, justifyContent: 'center' },
});

export default LeaveEncashmentScreen;
