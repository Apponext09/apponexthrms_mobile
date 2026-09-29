import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CheckCheck } from 'lucide-react-native';
import {
  AppText,
  EmptyState,
  ErrorState,
  GradientHeader,
  ListSkeleton,
  Screen,
  useToast,
} from '@/components/ui';
import ExpenseCard from '@/components/common/ExpenseCard';
import DecisionButtons from '@/components/common/DecisionButtons';
import DecisionSheet from '@/components/common/DecisionSheet';
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
      statusBarLight
      refreshing={approvals.loading && approvals.loaded}
      onRefresh={load}
      header={
        <GradientHeader
          subtitle="Awaiting your review"
          title="Expense approvals"
        >
          <View style={styles.summary}>
            <AppText variant="h2" color="#FFFFFF">
              {list.length}
            </AppText>
            <AppText variant="caption" color="rgba(255,255,255,0.85)">
              {' '}
              claims · {formatCurrency(total)}
            </AppText>
          </View>
        </GradientHeader>
      }
    >
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
  summary: { flexDirection: 'row', alignItems: 'baseline', marginTop: 12 },
});

export default ExpenseApprovalsScreen;
