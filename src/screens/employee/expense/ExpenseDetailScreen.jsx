import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import {
  AppText,
  Card,
  Screen,
  SectionHeader,
  Skeleton,
  StackHeader,
  StatusBadge,
} from '@/components/ui';
import { expenseService } from '@/api/services/expenseService';
import { useTheme } from '@/hooks/useTheme';
import { normalizeExpenseClaim, pick } from '@/utils/normalize';
import { formatCurrency, formatDate } from '@/utils/format';

const ExpenseDetailScreen = () => {
  const { params } = useRoute();
  const { colors } = useTheme();
  const [claim, setClaim] = useState(params?.claim || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    expenseService
      .getClaim(params.id)
      .then(data => alive && data && setClaim(normalizeExpenseClaim(data)))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [params.id]);

  if (!claim) {
    return (
      <Screen stack header={<StackHeader title="Claim details" />}>
        <Skeleton height={140} radius={16} />
      </Screen>
    );
  }

  return (
    <Screen stack header={<StackHeader title="Claim details" />}>
      <Card>
        <View style={styles.head}>
          <View style={styles.flex}>
            <AppText variant="caption" color="mutedForeground">
              {claim.claimNumber}
            </AppText>
            <AppText variant="h2">{claim.title}</AppText>
          </View>
          <StatusBadge status={claim.status} />
        </View>
        <AppText variant="display" color="primary" style={styles.amount}>
          {formatCurrency(claim.amount)}
        </AppText>
        {claim.approvedAmount ? (
          <AppText variant="caption" color="success">
            Approved {formatCurrency(claim.approvedAmount)}
          </AppText>
        ) : null}
        <AppText variant="caption" color="mutedForeground" style={styles.date}>
          Submitted {formatDate(claim.claimDate)}
        </AppText>
        {claim.description ? (
          <AppText style={styles.desc}>{claim.description}</AppText>
        ) : null}
        {claim.rejectionReason ? (
          <View style={[styles.note, { backgroundColor: colors.dangerSoft }]}>
            <AppText variant="captionMedium" color="danger">
              {claim.rejectionReason}
            </AppText>
          </View>
        ) : null}
      </Card>

      <SectionHeader
        title={`Items${loading ? '' : ` (${claim.items.length})`}`}
      />
      {loading && !claim.items.length ? (
        <Skeleton height={70} radius={16} />
      ) : (
        claim.items.map((it, i) => (
          <Card key={pick(it, 'id') || i} style={styles.item}>
            <View style={styles.flex}>
              <AppText variant="bodyMedium">
                {pick(it, 'categoryName', 'category_name', 'description') ||
                  `Item ${i + 1}`}
              </AppText>
              <AppText variant="caption" color="mutedForeground">
                {formatDate(pick(it, 'expenseDate', 'expense_date'))}
                {pick(it, 'merchantName', 'merchant_name')
                  ? ` · ${pick(it, 'merchantName', 'merchant_name')}`
                  : ''}
              </AppText>
            </View>
            <AppText variant="bodyMedium">
              {formatCurrency(
                pick(it, 'claimedAmount', 'claimed_amount', 'amount'),
              )}
            </AppText>
          </Card>
        ))
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  amount: { marginTop: 16 },
  date: { marginTop: 6 },
  desc: { marginTop: 12 },
  note: { padding: 12, borderRadius: 10, marginTop: 12 },
  item: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
});

export default ExpenseDetailScreen;
