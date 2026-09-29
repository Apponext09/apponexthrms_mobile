import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Receipt } from 'lucide-react-native';
import { AppText, Card, StatusBadge } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { formatCurrency, formatDate } from '@/utils/format';

const ExpenseCard = ({ item, onPress, showEmployee = false, footer }) => {
  const { colors, radius } = useTheme();
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View
          style={[
            styles.icon,
            { backgroundColor: colors.warningSoft, borderRadius: radius.md },
          ]}
        >
          <Receipt size={18} color={colors.warning} />
        </View>
        <View style={styles.flex}>
          <AppText variant="bodyMedium" numberOfLines={1}>
            {item.title}
          </AppText>
          <AppText variant="caption" color="mutedForeground" numberOfLines={1}>
            {showEmployee && item.employeeName ? `${item.employeeName} · ` : ''}
            {item.claimNumber} · {formatDate(item.claimDate)}
          </AppText>
        </View>
        <View style={styles.right}>
          <AppText variant="bodyMedium">{formatCurrency(item.amount)}</AppText>
          <StatusBadge status={item.status} style={styles.badge} />
        </View>
      </View>
      {footer}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  right: { alignItems: 'flex-end' },
  badge: { marginTop: 6, alignSelf: 'flex-end' },
});

export default ExpenseCard;
