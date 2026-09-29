import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { CheckCheck } from 'lucide-react-native';
import {
  Card,
  EmptyState,
  ErrorState,
  ListSkeleton,
  Screen,
  SegmentedTabs,
  useToast,
} from '@/components/ui';
import LeaveCard from '@/components/common/LeaveCard';
import DecisionButtons from '@/components/common/DecisionButtons';
import DecisionSheet from '@/components/common/DecisionSheet';
import AppHeader from '@/components/common/AppHeader';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import {
  decideLeave,
  fetchLeaveApprovals,
  fetchProcessedLeaveApprovals,
  selectLeave,
} from '@/store/slices/leaveSlice';
import { formatDate } from '@/utils/format';

const LeaveApprovalsScreen = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { approvals, processed } = useAppSelector(selectLeave);
  const [tab, setTab] = useState('pending');
  const [decision, setDecision] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    dispatch(fetchLeaveApprovals());
    dispatch(fetchProcessedLeaveApprovals());
  }, [dispatch]);
  useEffect(() => {
    load();
  }, [load]);

  const source = tab === 'pending' ? approvals : processed;

  const submit = async note => {
    setBusy(true);
    const id = decision.item.applicationId || decision.item.id;
    const res = await dispatch(
      decideLeave({ id, approve: decision.approve, note }),
    );
    setBusy(false);
    if (decideLeave.fulfilled.match(res)) {
      toast.show(decision.approve ? 'Leave approved' : 'Leave rejected');
      setDecision(null);
      dispatch(fetchProcessedLeaveApprovals());
    } else toast.show(res.payload || 'Action failed', 'error');
  };

  return (
    <Screen
      refreshing={source.loading && source.loaded}
      onRefresh={load}
      hero={<AppHeader />}
    >
      <Card style={styles.tabsCard}>
        <SegmentedTabs
          options={[
            {
              key: 'pending',
              label: 'Pending',
              count: approvals.data?.length || 0,
            },
            { key: 'processed', label: 'Processed' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </Card>
      {source.loading && !source.loaded ? (
        <ListSkeleton />
      ) : source.error ? (
        <ErrorState message={source.error} onRetry={load} />
      ) : source.data?.length ? (
        source.data.map(item => (
          <LeaveCard
            key={`${item.applicationId}-${item.id}`}
            item={item}
            showEmployee
            footer={
              tab === 'pending' ? (
                <DecisionButtons
                  onApprove={() => setDecision({ item, approve: true })}
                  onReject={() => setDecision({ item, approve: false })}
                />
              ) : null
            }
          />
        ))
      ) : (
        <EmptyState
          icon={CheckCheck}
          title={
            tab === 'pending' ? 'No pending requests' : 'Nothing processed yet'
          }
          message={tab === 'pending' ? "You're all caught up." : undefined}
        />
      )}

      <DecisionSheet
        visible={!!decision}
        approve={decision?.approve}
        subject={
          decision
            ? `${decision.item.employeeName || 'Employee'} · ${
                decision.item.leaveType
              } · ${formatDate(decision.item.startDate)}`
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
  tabsCard: { padding: 8, marginBottom: 14 },
});

export default LeaveApprovalsScreen;
