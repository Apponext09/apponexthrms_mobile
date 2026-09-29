import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  AppText,
  BottomSheet,
  Button,
  Card,
  Input,
  Screen,
  StackHeader,
  StatusBadge,
  useToast,
} from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch } from '@/hooks/useRedux';
import { cancelLeave } from '@/store/slices/leaveSlice';
import { formatDate, titleCase } from '@/utils/format';

const Row = ({ label, value }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <AppText variant="caption" color="mutedForeground">
        {label}
      </AppText>
      <AppText variant="bodyMedium" style={styles.value}>
        {value || '—'}
      </AppText>
    </View>
  );
};

const LeaveDetailScreen = () => {
  const { params } = useRoute();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const leave = params?.leave || {};
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const canCancel =
    leave.status?.startsWith('pending') ||
    leave.status === 'submitted' ||
    leave.status === 'approved';

  const doCancel = async () => {
    if (reason.trim().length < 10) {
      toast.show('Please give a reason of at least 10 characters', 'error');
      return;
    }
    setLoading(true);
    const res = await dispatch(
      cancelLeave({ id: leave.id, reason: reason.trim() }),
    );
    setLoading(false);
    if (cancelLeave.fulfilled.match(res)) {
      setOpen(false);
      toast.show('Leave request cancelled');
      navigation.goBack();
    } else toast.show(res.payload || 'Could not cancel leave', 'error');
  };

  return (
    <Screen stack header={<StackHeader title="Leave details" />}>
      <Card>
        <View style={styles.head}>
          <View style={styles.flex}>
            <AppText variant="h2">{leave.leaveType}</AppText>
            <AppText variant="caption" color="mutedForeground">
              Applied {formatDate(leave.appliedOn)}
            </AppText>
          </View>
          <StatusBadge status={leave.status} />
        </View>
        <Row
          label="From"
          value={formatDate(leave.startDate, 'ddd, DD MMM YYYY')}
        />
        <Row label="To" value={formatDate(leave.endDate, 'ddd, DD MMM YYYY')} />
        <Row
          label="Duration"
          value={`${leave.isHalfDay ? 0.5 : leave.totalDays} day(s)${
            leave.isHalfDay && leave.halfDayPeriod
              ? ` · ${titleCase(leave.halfDayPeriod)}`
              : ''
          }`}
        />
        <Row label="Approver" value={leave.approverName} />
        <Row label="Reason" value={leave.reason} />
        {leave.rejectionReason ? (
          <Row label="Rejection reason" value={leave.rejectionReason} />
        ) : null}
      </Card>

      {canCancel ? (
        <Button
          title="Cancel request"
          variant="outline"
          onPress={() => setOpen(true)}
          style={styles.cancel}
        />
      ) : null}

      <BottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        title="Cancel leave request"
      >
        <Input
          label="Reason"
          placeholder="Why are you cancelling? (min 10 characters)"
          multiline
          value={reason}
          onChangeText={setReason}
        />
        <Button
          title="Confirm cancellation"
          variant="danger"
          onPress={doCancel}
          loading={loading}
        />
      </BottomSheet>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  row: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  value: { marginTop: 2 },
  cancel: { marginTop: 16 },
});

export default LeaveDetailScreen;
