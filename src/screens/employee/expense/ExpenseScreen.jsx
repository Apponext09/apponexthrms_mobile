import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  BadgeCheck,
  Hourglass,
  Plus,
  ReceiptText,
  Wallet,
  XCircle,
} from 'lucide-react-native';
import {
  Button,
  EmptyState,
  ErrorState,
  ListSkeleton,
  Screen,
  SectionHeader,
  SegmentedTabs,
  StatCard,
} from '@/components/ui';
import ExpenseCard from '@/components/common/ExpenseCard';
import AppHeader from '@/components/common/AppHeader';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { fetchMyClaims, selectExpense } from '@/store/slices/expenseSlice';
import { formatCurrency } from '@/utils/format';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'In review' },
  { key: 'approved', label: 'Approved' },
  { key: 'reimbursed', label: 'Paid' },
  { key: 'rejected', label: 'Rejected' },
];

const isPending = s => s.startsWith('pending') || s === 'submitted';

const ExpenseScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const { mine } = useAppSelector(selectExpense);
  const [filter, setFilter] = useState('all');

  const load = useCallback(() => dispatch(fetchMyClaims()), [dispatch]);
  useEffect(() => {
    load();
  }, [load]);

  const claims = useMemo(() => mine.data || [], [mine.data]);
  const totals = useMemo(
    () => ({
      claimed: claims.reduce((a, c) => a + c.amount, 0),
      pending: claims
        .filter(c => isPending(c.status))
        .reduce((a, c) => a + c.amount, 0),
      pendingCount: claims.filter(c => isPending(c.status)).length,
      approved: claims
        .filter(c => c.status === 'approved')
        .reduce((a, c) => a + (c.approvedAmount || c.amount), 0),
      paid: claims
        .filter(c => ['reimbursed', 'paid'].includes(c.status))
        .reduce((a, c) => a + (c.approvedAmount || c.amount), 0),
      rejected: claims
        .filter(c => c.status === 'rejected')
        .reduce((a, c) => a + c.amount, 0),
    }),
    [claims],
  );
  const list = useMemo(() => {
    if (filter === 'all') return claims;
    if (filter === 'pending') return claims.filter(c => isPending(c.status));
    if (filter === 'reimbursed')
      return claims.filter(c => ['reimbursed', 'paid'].includes(c.status));
    return claims.filter(c => c.status === filter);
  }, [claims, filter]);

  return (
    <Screen
      refreshing={mine.loading && mine.loaded}
      onRefresh={load}
      hero={
        <AppHeader
          actions={[
            { icon: Plus, onPress: () => navigation.navigate('NewExpense') },
          ]}
        />
      }
      footer={
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <Button
            title="New expense claim"
            icon={Plus}
            onPress={() => navigation.navigate('NewExpense')}
          />
        </View>
      }
    >
      <View style={styles.grid}>
        <StatCard
          icon={Hourglass}
          label="In review"
          value={formatCurrency(totals.pending)}
          caption={`${totals.pendingCount} awaiting approval`}
          tone="warning"
        />
        <StatCard
          icon={BadgeCheck}
          label="Approved"
          value={formatCurrency(totals.approved)}
          caption="queued for payout"
          tone="primary"
        />
        <StatCard
          icon={Wallet}
          label="Reimbursed"
          value={formatCurrency(totals.paid)}
          caption="settled claims"
          tone="success"
        />
        <StatCard
          icon={XCircle}
          label="Rejected"
          value={formatCurrency(totals.rejected)}
          caption="rejected claims"
          tone="danger"
        />
      </View>

      <SectionHeader title="My claims" />
      <SegmentedTabs
        options={FILTERS}
        value={filter}
        onChange={setFilter}
        style={styles.tabs}
      />
      {mine.loading && !mine.loaded ? (
        <ListSkeleton />
      ) : mine.error ? (
        <ErrorState message={mine.error} onRetry={load} />
      ) : list.length ? (
        list.map(c => (
          <ExpenseCard
            key={c.id}
            item={c}
            onPress={() =>
              navigation.navigate('ExpenseDetail', { id: c.id, claim: c })
            }
          />
        ))
      ) : (
        <EmptyState
          icon={ReceiptText}
          title="No claims yet"
          message="Submit a claim for travel, meals or other work expenses."
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tabs: { marginBottom: 14 },
  footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
});

export default ExpenseScreen;
