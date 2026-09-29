import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Plus, ReceiptText } from 'lucide-react-native';
import {
  AppText,
  Button,
  EmptyState,
  ErrorState,
  GradientHeader,
  ListSkeleton,
  Screen,
  SectionHeader,
  SegmentedTabs,
} from '@/components/ui';
import ExpenseCard from '@/components/common/ExpenseCard';
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
  const { colors, radius } = useTheme();
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
      paid: claims
        .filter(c => ['reimbursed', 'paid'].includes(c.status))
        .reduce((a, c) => a + (c.approvedAmount || c.amount), 0),
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
      statusBarLight
      refreshing={mine.loading && mine.loaded}
      onRefresh={load}
      header={
        <GradientHeader subtitle="Claims & reimbursements" title="Expenses">
          <View style={styles.totals}>
            {[
              ['Total claimed', totals.claimed],
              ['In review', totals.pending],
              ['Reimbursed', totals.paid],
            ].map(([label, value]) => (
              <View
                key={label}
                style={[styles.totalBox, { borderRadius: radius.lg }]}
              >
                <AppText variant="bodyMedium" color="#FFFFFF" numberOfLines={1}>
                  {formatCurrency(value)}
                </AppText>
                <AppText variant="small" color="rgba(255,255,255,0.85)">
                  {label}
                </AppText>
              </View>
            ))}
          </View>
        </GradientHeader>
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
      <SectionHeader title="My claims" style={styles.firstHeader} />
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
  totals: { flexDirection: 'row', gap: 8, marginTop: 16 },
  totalBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.14)', padding: 10 },
  firstHeader: { marginTop: 4 },
  tabs: { marginBottom: 14 },
  footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
});

export default ExpenseScreen;
