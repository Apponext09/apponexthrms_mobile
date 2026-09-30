import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  AppText,
  Button,
  Card,
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
  const [loading, setLoading] = useState(false);
  const canCancel =
    leave.status?.startsWith('pending') ||
    leave.status === 'submitted' ||
    leave.status === 'approved';

  // Like the portal: a confirmation, no reason required
  const doCancel = async () => {
    setLoading(true);
    const res = await dispatch(cancelLeave({ id: leave.id }));
    setLoading(false);
    if (cancelLeave.fulfilled.match(res)) {
      toast.show('Leave request cancelled');
      navigation.goBack();
    } else toast.show(res.payload || 'Could not cancel leave', 'error');
  };

  const confirmCancel = () =>
    Alert.alert(
      'Cancel this leave request?',
      'Your balance will be restored.',
      [
        { text: 'Keep it', style: 'cancel' },
        { text: 'Cancel request', style: 'destructive', onPress: doCancel },
      ],
    );

  const days = leave.totalDays || (leave.isHalfDay ? 0.5 : 0);

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
          value={`${days} ${days === 1 ? 'day' : 'days'}${
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
          onPress={confirmCancel}
          loading={loading}
          style={styles.cancel}
        />
      ) : null}
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
