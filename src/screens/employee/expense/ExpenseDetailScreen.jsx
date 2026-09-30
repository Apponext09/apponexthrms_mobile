import React, { useCallback, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {
  AppText,
  Button,
  Card,
  Screen,
  SectionHeader,
  Skeleton,
  StackHeader,
  StatusBadge,
} from '@/components/ui';
import { expenseService } from '@/api/services/expenseService';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/hooks/useRedux';
import { selectViewMode } from '@/store/slices/authSlice';
import { normalizeExpenseClaim } from '@/utils/normalize';
import {
  formatCurrency,
  formatDate,
  formatRelative,
  titleCase,
} from '@/utils/format';

const PAYMENT_LABELS = {
  bank_transfer: 'Direct bank transfer',
  manual: 'Manual cash / cheque',
  payroll: 'With payroll',
};

// Timeline dot colour by approval action
const actionTone = (action, colors) =>
  action.includes('reject')
    ? colors.danger
    : action.includes('return')
    ? colors.warning
    : action.includes('approve') ||
      action.includes('reimburs') ||
      action.includes('verif')
    ? colors.success
    : colors.primary;

const ExpenseDetailScreen = () => {
  const { params } = useRoute();
  const navigation = useNavigation();
  const { colors, radius } = useTheme();
  const viewMode = useAppSelector(selectViewMode);
  const [claim, setClaim] = useState(params?.claim || null);
  const [loading, setLoading] = useState(true);

  // Reload on focus so returning from Edit shows the latest version
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      expenseService
        .getClaim(params.id)
        .then(data => alive && data && setClaim(normalizeExpenseClaim(data)))
        .catch(() => {})
        .finally(() => alive && setLoading(false));
      return () => {
        alive = false;
      };
    }, [params.id]),
  );

  if (!claim) {
    return (
      <Screen stack header={<StackHeader title="Claim details" />}>
        <Skeleton height={140} radius={16} />
      </Screen>
    );
  }

  // Like the portal: only drafts and claims returned for correction can be edited
  const canEdit =
    viewMode === 'employee' &&
    (claim.status === 'draft' || claim.status === 'returned');

  return (
    <Screen
      stack
      header={<StackHeader title="Claim details" />}
      footer={
        canEdit ? (
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
              title={
                claim.status === 'draft' ? 'Edit draft' : 'Correct and resubmit'
              }
              onPress={() => navigation.navigate('NewExpense', { claim })}
            />
          </View>
        ) : null
      }
    >
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
          {[
            `Claim date ${formatDate(claim.claimDate)}`,
            claim.category,
            PAYMENT_LABELS[claim.paymentMethod] ||
              titleCase(claim.paymentMethod),
            claim.projectCostCenter,
          ]
            .filter(Boolean)
            .join(' · ')}
        </AppText>
        {claim.description ? (
          <AppText style={styles.desc}>{claim.description}</AppText>
        ) : null}
        {claim.rejectionReason ? (
          <View
            style={[
              styles.note,
              {
                backgroundColor:
                  claim.status === 'returned'
                    ? colors.warningSoft
                    : colors.dangerSoft,
              },
            ]}
          >
            <AppText
              variant="captionMedium"
              color={claim.status === 'returned' ? 'warning' : 'danger'}
            >
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
          <Card key={it.id || i} style={styles.item}>
            <View style={styles.itemRow}>
              <View style={styles.flex}>
                <AppText variant="bodyMedium">
                  {it.categoryName || it.description || `Item ${i + 1}`}
                </AppText>
                <AppText variant="caption" color="mutedForeground">
                  {formatDate(it.expenseDate)}
                  {it.merchantName ? ` · ${it.merchantName}` : ''}
                </AppText>
                {it.description && it.categoryName ? (
                  <AppText variant="caption" color="textSecondary">
                    {it.description}
                  </AppText>
                ) : null}
                {it.justification ? (
                  <AppText variant="caption" color="warning">
                    Justification: {it.justification}
                  </AppText>
                ) : null}
              </View>
              <AppText variant="bodyMedium">
                {formatCurrency(it.amount)}
              </AppText>
            </View>
            {/^data:image|^https?:/.test(it.receiptUrl) ? (
              <Image
                source={{ uri: it.receiptUrl }}
                style={[styles.receipt, { borderRadius: radius.md }]}
                resizeMode="cover"
              />
            ) : null}
          </Card>
        ))
      )}

      {claim.timeline.length ? (
        <>
          <SectionHeader title="Approval history" />
          <Card>
            {claim.timeline.map((log, i) => (
              <View key={log.id || i} style={styles.logRow}>
                <View style={styles.logRail}>
                  <View
                    style={[
                      styles.logDot,
                      { backgroundColor: actionTone(log.action, colors) },
                    ]}
                  />
                  {i < claim.timeline.length - 1 ? (
                    <View
                      style={[
                        styles.logLine,
                        { backgroundColor: colors.border },
                      ]}
                    />
                  ) : null}
                </View>
                <View style={[styles.flex, styles.logBody]}>
                  <AppText variant="bodyMedium">
                    {titleCase(log.action)}
                  </AppText>
                  <AppText variant="caption" color="mutedForeground">
                    {[log.approverName, titleCase(log.approverRole)]
                      .filter(Boolean)
                      .join(' · ')}
                    {log.createdAt ? ` · ${formatRelative(log.createdAt)}` : ''}
                  </AppText>
                  {log.comments ? (
                    <AppText variant="caption" color="textSecondary">
                      “{log.comments}”
                    </AppText>
                  ) : null}
                </View>
              </View>
            ))}
          </Card>
        </>
      ) : null}
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
  item: { marginBottom: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  receipt: { width: '100%', height: 160, marginTop: 12 },
  logRow: { flexDirection: 'row', gap: 12 },
  logRail: { alignItems: 'center', width: 12 },
  logDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  logLine: { width: 2, flex: 1, marginTop: 2 },
  logBody: { paddingBottom: 16, gap: 2 },
  footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
});

export default ExpenseDetailScreen;
