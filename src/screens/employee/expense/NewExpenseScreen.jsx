import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import dayjs from 'dayjs';
import { Plus, Trash2 } from '@/components/ui/icons';
import {
  AppText,
  Button,
  Card,
  DateField,
  Input,
  Screen,
  SelectField,
  StackHeader,
  useToast,
} from '@/components/ui';
import ReceiptPicker from '@/components/common/ReceiptPicker';
import { expenseService } from '@/api/services/expenseService';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import {
  fetchExpenseCategories,
  fetchExpensePolicies,
  selectExpense,
  submitClaim,
} from '@/store/slices/expenseSlice';
import { formatCurrency, toApiDate } from '@/utils/format';

// Same options as the portal
const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Direct bank transfer' },
  { value: 'manual', label: 'Manual cash / cheque' },
];

const yesterday = () => dayjs().subtract(1, 'day').toDate();

let keySeq = 0;
const newItem = (categoryId, date) => ({
  key: `item-${(keySeq += 1)}`,
  categoryId: categoryId || null,
  amount: '',
  date: date || yesterday(),
  merchant: '',
  description: '',
  receipt: null,
  justification: '',
});

// Existing claim items -> form items (edit mode)
const fromClaimItem = it => ({
  ...newItem(
    it.categoryId,
    it.expenseDate ? dayjs(it.expenseDate).toDate() : null,
  ),
  amount: it.amount ? String(it.amount) : '',
  merchant: it.merchantName,
  description: it.description,
  justification: it.justification,
  receipt: it.receiptUrl
    ? {
        uri: it.receiptUrl,
        dataUrl: it.receiptUrl,
        fileName: it.receiptFileName || 'receipt',
      }
    : null,
});

// Portal rule: the lowest per-claim limit of the active policies for the
// category (category-specific policies win over general ones); 0 = unlimited
const policyLimit = (policies, categoryId) => {
  const applicable = policies.filter(
    p => p.categoryId === 0 || p.categoryId === Number(categoryId),
  );
  const specific = applicable.filter(p => p.categoryId === Number(categoryId));
  const target = specific.length ? specific : applicable;
  if (!target.length || target.some(p => p.maxPerClaim === 0)) return null;
  const min = Math.min(...target.map(p => p.maxPerClaim));
  return { limit: min, name: target.find(p => p.maxPerClaim === min)?.name };
};

const NewExpenseScreen = () => {
  const navigation = useNavigation();
  const { params = {} } = useRoute();
  const editing = params.claim || null; // draft or returned claim
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { colors } = useTheme();
  const { categories, policies, submitting } = useAppSelector(selectExpense);

  const [title, setTitle] = useState(editing?.title || '');
  const [claimDate, setClaimDate] = useState(
    editing?.claimDate ? dayjs(editing.claimDate).toDate() : yesterday(),
  );
  const [categoryId, setCategoryId] = useState(editing?.categoryId || null);
  const [paymentMethod, setPaymentMethod] = useState(
    editing?.paymentMethod && editing.paymentMethod !== 'payroll'
      ? editing.paymentMethod
      : 'bank_transfer',
  );
  const [merchant, setMerchant] = useState(editing?.merchantName || '');
  const [project, setProject] = useState(editing?.projectCostCenter || '');
  const [description, setDescription] = useState(editing?.description || '');
  const [items, setItems] = useState(
    editing?.items?.length ? editing.items.map(fromClaimItem) : [newItem()],
  );
  const [violations, setViolations] = useState({}); // itemKey -> [messages]
  const [errors, setErrors] = useState({});
  const timers = useRef({});

  useEffect(() => {
    dispatch(fetchExpenseCategories());
    dispatch(fetchExpensePolicies());
  }, [dispatch]);

  // Default the claim category to the first one, like the portal
  useEffect(() => {
    if (!categoryId && categories.data?.length) {
      const first = categories.data[0].id;
      setCategoryId(first);
      setItems(list =>
        list.map(i => (i.categoryId ? i : { ...i, categoryId: first })),
      );
    }
  }, [categoryId, categories.data]);

  const catOptions = useMemo(
    () =>
      (categories.data || []).map(c => ({
        value: c.id,
        label: c.name,
        description: c.isReceiptMandatory
          ? `Receipt needed${
              c.minAmountForReceipt
                ? ` from ${formatCurrency(c.minAmountForReceipt)}`
                : ''
            }`
          : undefined,
      })),
    [categories.data],
  );
  const catById = id => (categories.data || []).find(c => c.id === Number(id));
  const total = items.reduce((n, i) => n + (parseFloat(i.amount) || 0), 0);

  // Server-side policy check per item, debounced (portal: validatePolicy)
  const checkPolicy = item => {
    clearTimeout(timers.current[item.key]);
    const amount = parseFloat(item.amount);
    const cat = item.categoryId || categoryId;
    if (!(amount > 0) || !cat) {
      setViolations(v => ({ ...v, [item.key]: [] }));
      return;
    }
    timers.current[item.key] = setTimeout(async () => {
      try {
        const res = await expenseService.validatePolicy(
          cat,
          amount,
          !!item.receipt,
        );
        setViolations(v => ({
          ...v,
          [item.key]: res && !res.isValid ? res.violations || [] : [],
        }));
      } catch {
        // Validation is advisory; submission still goes through the server
      }
    }, 400);
  };

  const update = (key, patch) =>
    setItems(list =>
      list.map(i => {
        if (i.key !== key) return i;
        const next = { ...i, ...patch };
        if ('amount' in patch || 'categoryId' in patch || 'receipt' in patch)
          checkPolicy(next);
        return next;
      }),
    );

  const save = async isDraft => {
    const today = dayjs().startOf('day');
    const next = {};
    if (!title.trim()) next.title = 'Give your claim a title';
    if (!dayjs(claimDate).isBefore(today))
      next.claimDate = 'Claim date must be a previous date';
    if (!categoryId) next.category = 'Select a category';
    items.forEach((i, idx) => {
      const cat = catById(i.categoryId || categoryId);
      const amount = parseFloat(i.amount) || 0;
      if (!(i.categoryId || categoryId))
        next[`cat${idx}`] = 'Select a category';
      if (!dayjs(i.date).isBefore(today))
        next[`date${idx}`] = 'Must be a previous date';
      if (!(amount > 0)) next[`amt${idx}`] = 'Enter an amount';
      if (isDraft) return;
      if (
        cat?.isReceiptMandatory &&
        amount >= (cat.minAmountForReceipt || 0) &&
        !i.receipt
      )
        next[`rcpt${idx}`] = `${cat.name} needs a receipt${
          cat.minAmountForReceipt
            ? ` from ${formatCurrency(cat.minAmountForReceipt)}`
            : ''
        }`;
      const lim = policyLimit(policies.data || [], i.categoryId || categoryId);
      if (lim && amount > lim.limit)
        next[`amt${idx}`] = `Above the policy limit of ${formatCurrency(
          lim.limit,
        )}`;
      if ((violations[i.key] || []).length && !i.justification.trim())
        next[`just${idx}`] = 'Explain why this is above policy';
    });
    if (!isDraft && !(total > 0)) next.total = 'Add at least one amount';
    setErrors(next);
    if (Object.keys(next).length) {
      toast.show('Please fix the highlighted fields', 'error');
      return;
    }

    // Same payload as the portal
    const payload = {
      title: title.trim(),
      claimDate: toApiDate(claimDate),
      categoryId,
      paymentMethod,
      merchantName: merchant.trim(),
      description: description.trim(),
      projectCostCenter: project.trim(),
      isDraft,
      items: items.map(i => ({
        categoryId: i.categoryId || categoryId,
        expenseDate: toApiDate(i.date),
        claimedAmount: parseFloat(i.amount) || 0,
        merchantName: i.merchant.trim(),
        description: i.description.trim(),
        employeeJustification: i.justification.trim(),
        receiptUrl: i.receipt?.dataUrl || '',
        ...(i.receipt?.fileType
          ? {
              receiptFileName: i.receipt.fileName,
              receiptFileType: i.receipt.fileType,
              receiptFileSize: i.receipt.fileSize,
            }
          : {}),
      })),
    };
    const res = await dispatch(submitClaim({ id: editing?.id, payload }));
    if (submitClaim.fulfilled.match(res)) {
      toast.show(
        isDraft
          ? 'Saved as draft'
          : editing
          ? 'Claim updated and sent for approval'
          : 'Claim submitted for approval',
      );
      navigation.goBack();
    } else toast.show(res.payload || 'Could not save the claim', 'error');
  };

  return (
    <Screen
      stack
      header={
        <StackHeader
          title={editing ? 'Edit expense claim' : 'New expense claim'}
        />
      }
      footer={
        <View
          style={[
            styles.footer,
            { backgroundColor: colors.card, borderTopColor: colors.border },
          ]}
        >
          <View style={styles.flex}>
            <AppText variant="caption" color="mutedForeground">
              Total
            </AppText>
            <AppText variant="h2">{formatCurrency(total)}</AppText>
          </View>
          <Button
            title="Save draft"
            variant="outline"
            fullWidth={false}
            onPress={() => save(true)}
            disabled={submitting}
          />
          <Button
            title="Submit"
            fullWidth={false}
            onPress={() => save(false)}
            loading={submitting}
          />
        </View>
      }
    >
      {editing?.status === 'returned' && editing.rejectionReason ? (
        <Card
          elevated={false}
          style={[
            styles.note,
            {
              backgroundColor: colors.warningSoft,
              borderColor: colors.warningSoft,
            },
          ]}
        >
          <AppText variant="captionMedium" color="warning">
            Returned for correction: {editing.rejectionReason}
          </AppText>
        </Card>
      ) : null}

      {!categories.loading && categories.loaded && !categories.data.length ? (
        <Card
          elevated={false}
          style={[
            styles.note,
            {
              backgroundColor: colors.warningSoft,
              borderColor: colors.warningSoft,
            },
          ]}
        >
          <AppText variant="captionMedium" color="warning">
            Your organisation has no expense categories yet. Ask HR or finance
            to set them up before submitting claims.
          </AppText>
        </Card>
      ) : null}

      <Input
        label="Claim title"
        required
        placeholder="e.g. Client visit – Pune"
        value={title}
        onChangeText={setTitle}
        error={errors.title}
      />
      <View style={styles.row}>
        <DateField
          label="Claim date"
          value={claimDate}
          maximumDate={yesterday()}
          onChange={setClaimDate}
          error={errors.claimDate}
        />
        <SelectField
          label="Category"
          placeholder={categories.loading ? 'Loading…' : 'Select'}
          options={catOptions}
          value={categoryId}
          onChange={setCategoryId}
          error={errors.category}
          style={styles.flex}
        />
      </View>
      <SelectField
        label="Payment method"
        options={PAYMENT_METHODS}
        value={paymentMethod}
        onChange={setPaymentMethod}
      />
      <View style={styles.row}>
        <Input
          label="Merchant (optional)"
          placeholder="e.g. Uber"
          value={merchant}
          onChangeText={setMerchant}
          style={styles.flex}
        />
        <Input
          label="Project / cost centre"
          placeholder="Optional"
          value={project}
          onChangeText={setProject}
          style={styles.flex}
        />
      </View>
      <Input
        label="Notes (optional)"
        placeholder="Any context for your approver"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <AppText variant="h3" style={styles.itemsTitle}>
        Expense items
      </AppText>
      {errors.total ? (
        <AppText variant="caption" color="danger" style={styles.itemErr}>
          {errors.total}
        </AppText>
      ) : null}
      {items.map((item, idx) => {
        const lim = policyLimit(
          policies.data || [],
          item.categoryId || categoryId,
        );
        const itemViolations = violations[item.key] || [];
        return (
          <Card key={item.key} style={styles.item}>
            <View style={styles.itemHead}>
              <AppText variant="captionMedium" color="mutedForeground">
                ITEM {idx + 1}
              </AppText>
              {items.length > 1 ? (
                <Pressable
                  hitSlop={10}
                  onPress={() =>
                    setItems(l => l.filter(i => i.key !== item.key))
                  }
                >
                  <Trash2 size={18} color={colors.danger} />
                </Pressable>
              ) : null}
            </View>
            <SelectField
              label="Category"
              placeholder="Select category"
              options={catOptions}
              value={item.categoryId}
              onChange={v => update(item.key, { categoryId: v })}
              error={errors[`cat${idx}`]}
            />
            <View style={styles.row}>
              <Input
                label="Amount (₹)"
                required
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={item.amount}
                onChangeText={t =>
                  update(item.key, { amount: t.replace(/[^0-9.]/g, '') })
                }
                error={errors[`amt${idx}`]}
                hint={
                  lim ? `Policy limit ${formatCurrency(lim.limit)}` : undefined
                }
                style={styles.flex}
              />
              <DateField
                label="Date"
                value={item.date}
                maximumDate={yesterday()}
                onChange={d => update(item.key, { date: d })}
                error={errors[`date${idx}`]}
              />
            </View>
            <Input
              label="Merchant (optional)"
              placeholder="e.g. Uber, Taj Hotel"
              value={item.merchant}
              onChangeText={t => update(item.key, { merchant: t })}
            />
            <Input
              label="Description (optional)"
              placeholder="What was this for?"
              value={item.description}
              onChangeText={t => update(item.key, { description: t })}
            />
            {itemViolations.length ? (
              <>
                <Card
                  elevated={false}
                  style={[
                    styles.note,
                    {
                      backgroundColor: colors.warningSoft,
                      borderColor: colors.warningSoft,
                    },
                  ]}
                >
                  {itemViolations.map(v => (
                    <AppText key={v} variant="caption" color="warning">
                      • {v}
                    </AppText>
                  ))}
                </Card>
                <Input
                  label="Justification"
                  required
                  placeholder="Why is this above policy?"
                  value={item.justification}
                  onChangeText={t => update(item.key, { justification: t })}
                  multiline
                  error={errors[`just${idx}`]}
                />
              </>
            ) : null}
            <ReceiptPicker
              value={item.receipt}
              onChange={r => update(item.key, { receipt: r })}
            />
            {errors[`rcpt${idx}`] ? (
              <AppText variant="caption" color="danger" style={styles.itemErr}>
                {errors[`rcpt${idx}`]}
              </AppText>
            ) : null}
          </Card>
        );
      })}
      <Button
        title="Add another item"
        icon={Plus}
        variant="secondary"
        onPress={() =>
          setItems(l => [...l, newItem(categoryId, l[l.length - 1]?.date)])
        }
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: 12 },
  note: { padding: 12, marginBottom: 16, gap: 4 },
  itemsTitle: { marginTop: 8, marginBottom: 12 },
  item: { marginBottom: 12 },
  itemHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemErr: { marginTop: 6, marginBottom: 6 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

export default NewExpenseScreen;
