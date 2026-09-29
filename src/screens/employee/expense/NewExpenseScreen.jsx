import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import {
  fetchExpenseCategories,
  selectExpense,
  submitClaim,
} from '@/store/slices/expenseSlice';
import { formatCurrency, toApiDate } from '@/utils/format';

const newItem = () => ({
  key: Math.random().toString(36).slice(2),
  categoryId: null,
  amount: '',
  date: new Date(),
  merchant: '',
  description: '',
  receipt: null,
});

const NewExpenseScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { colors } = useTheme();
  const { categories, submitting } = useAppSelector(selectExpense);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState([newItem()]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(fetchExpenseCategories());
  }, [dispatch]);

  const options = useMemo(
    () =>
      (categories.data || []).map(c => ({
        value: c.id,
        label: c.name,
        description: c.spendingLimit
          ? `Limit ${formatCurrency(c.spendingLimit)}`
          : undefined,
      })),
    [categories.data],
  );
  const total = items.reduce((a, i) => a + (parseFloat(i.amount) || 0), 0);

  const update = (key, patch) =>
    setItems(list => list.map(i => (i.key === key ? { ...i, ...patch } : i)));

  const submit = async () => {
    const next = {};
    if (title.trim().length < 3) next.title = 'Give your claim a title';
    items.forEach((i, idx) => {
      const cat = (categories.data || []).find(c => c.id === i.categoryId);
      if (!i.categoryId) next[`cat${idx}`] = 'Select a category';
      if (cat?.isReceiptMandatory && !i.receipt)
        next[`rcpt${idx}`] = `A receipt is required for ${cat.name}`;
      if (!(parseFloat(i.amount) > 0))
        next[`amt${idx}`] = 'Enter a valid amount';
    });
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      claimDate: toApiDate(new Date()),
      categoryId: items[0].categoryId,
      items: items.map(i => ({
        categoryId: i.categoryId,
        claimedAmount: parseFloat(i.amount),
        expenseDate: toApiDate(i.date),
        merchantName: i.merchant.trim() || undefined,
        description: i.description.trim() || title.trim(),
        ...(i.receipt
          ? {
              receiptUrl: i.receipt.dataUrl,
              receiptFileName: i.receipt.fileName,
              receiptFileType: i.receipt.fileType,
              receiptFileSize: i.receipt.fileSize,
            }
          : {}),
      })),
    };
    const res = await dispatch(submitClaim(payload));
    if (submitClaim.fulfilled.match(res)) {
      toast.show('Expense claim submitted');
      navigation.goBack();
    } else toast.show(res.payload || 'Could not submit claim', 'error');
  };

  return (
    <Screen
      stack
      header={<StackHeader title="New expense claim" />}
      footer={
        <View
          style={[
            styles.footer,
            { backgroundColor: colors.card, borderTopColor: colors.border },
          ]}
        >
          <View>
            <AppText variant="caption" color="mutedForeground">
              Total
            </AppText>
            <AppText variant="h2">{formatCurrency(total)}</AppText>
          </View>
          <Button
            title="Submit claim"
            onPress={submit}
            loading={submitting}
            fullWidth={false}
          />
        </View>
      }
    >
      <Input
        label="Claim title"
        placeholder="e.g. Client visit – Pune"
        value={title}
        onChangeText={setTitle}
        error={errors.title}
      />
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
      {items.map((item, idx) => (
        <Card key={item.key} style={styles.item}>
          <View style={styles.itemHead}>
            <AppText variant="captionMedium" color="mutedForeground">
              ITEM {idx + 1}
            </AppText>
            {items.length > 1 ? (
              <Pressable
                hitSlop={10}
                onPress={() => setItems(l => l.filter(i => i.key !== item.key))}
              >
                <Trash2 size={18} color={colors.danger} />
              </Pressable>
            ) : null}
          </View>
          <SelectField
            label="Category"
            placeholder={categories.loading ? 'Loading…' : 'Select category'}
            options={options}
            value={item.categoryId}
            onChange={v => update(item.key, { categoryId: v })}
            error={errors[`cat${idx}`]}
          />
          <View style={styles.row}>
            <Input
              label="Amount (₹)"
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={item.amount}
              onChangeText={t =>
                update(item.key, { amount: t.replace(/[^0-9.]/g, '') })
              }
              error={errors[`amt${idx}`]}
              style={styles.flex}
            />
            <DateField
              label="Date"
              value={item.date}
              maximumDate={new Date()}
              onChange={d => update(item.key, { date: d })}
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
          <ReceiptPicker
            value={item.receipt}
            onChange={r => update(item.key, { receipt: r })}
          />
          {errors[`rcpt${idx}`] ? (
            <AppText variant="caption" color="danger" style={styles.rcptErr}>
              {errors[`rcpt${idx}`]}
            </AppText>
          ) : null}
        </Card>
      ))}
      <Button
        title="Add another item"
        icon={Plus}
        variant="secondary"
        onPress={() => setItems(l => [...l, newItem()])}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  itemsTitle: { marginTop: 8, marginBottom: 12 },
  item: { marginBottom: 12 },
  itemHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  row: { flexDirection: 'row', gap: 12 },
  rcptErr: { marginTop: 6 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

export default NewExpenseScreen;
