import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CheckCheck, Hourglass, Wallet } from 'lucide-react-native';
import {
  SectionHeader,
  StatCard,
  EmptyState,
  ErrorState,
  ListSkeleton,
  Screen,
  useToast,
} from '@/components/ui';
import ExpenseCard from '@/components/common/ExpenseCard';
import DecisionButtons from '@/components/common/DecisionButtons';
import DecisionSheet from '@/components/common/DecisionSheet';
import AppHeader from '@/components/common/AppHeader';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import {
  decideClaim,
  fetchExpenseApprovals,
  selectExpense,
} from '@/store/slices/expenseSlice';
import { formatCurrency } from '@/utils/format';

const ExpenseApprovalsScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { approvals } = useAppSelector(selectExpense);
  const [decision, setDecision] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => dispatch(fetchExpenseApprovals()), [dispatch]);
  useEffect(() => {
    load();
  }, [load]);

  const list = useMemo(() => approvals.data || [], [approvals.data]);
  const total = useMemo(() => list.reduce((a, c) => a + c.amount, 0), [list]);

  const submit = async note => {
    setBusy(true);
    const res = await dispatch(
      decideClaim({ id: decision.item.id, approve: decision.approve, note }),
    );
    setBusy(false);
    if (decideClaim.fulfilled.match(res)) {
      toast.show(decision.approve ? 'Claim approved' : 'Claim rejected');
      setDecision(null);
    } else toast.show(res.payload || 'Action failed', 'error');
  };

  return (
    <Screen
      refreshing={approvals.loading && approvals.loaded}
      onRefresh={load}
      hero={<AppHeader />}
    >
      <View style={styles.grid}>
        <StatCard
          icon={Hourglass}
          label="Awaiting review"
          value={list.length}
          tone="warning"
        />
        <StatCard
          icon={Wallet}
          label="Total amount"
          value={formatCurrency(total)}
          tone="primary"
        />
      </View>
      <SectionHeader title="Pending claims" />
      {approvals.loading && !approvals.loaded ? (
        <ListSkeleton />
      ) : approvals.error ? (
        <ErrorState message={approvals.error} onRetry={load} />
      ) : list.length ? (
        list.map(item => (
          <ExpenseCard
            key={item.id}
            item={item}
            showEmployee
            onPress={() =>
              navigation.navigate('ExpenseDetail', { id: item.id, claim: item })
            }
            footer={
              <DecisionButtons
                onApprove={() => setDecision({ item, approve: true })}
                onReject={() => setDecision({ item, approve: false })}
              />
            }
          />
        ))
      ) : (
        <EmptyState
          icon={CheckCheck}
          title="No pending claims"
          message="Expense claims that need your approval will appear here."
        />
      )}

      <DecisionSheet
        visible={!!decision}
        approve={decision?.approve}
        subject={
          decision
            ? `${decision.item.employeeName || 'Employee'} · ${
                decision.item.title
              } · ${formatCurrency(decision.item.amount)}`
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
  grid: { flexDirection: 'row', gap: 12 },
});

export default ExpenseApprovalsScreen;
