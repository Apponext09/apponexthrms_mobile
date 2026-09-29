import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CalendarRange } from '@/components/ui/icons';
import { AppText, Card, StatusBadge } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { formatDate, formatShortDate } from '@/utils/format';

const LeaveCard = ({ item, onPress, showEmployee = false, footer }) => {
  const { colors, radius } = useTheme();
  const sameDay = item.startDate === item.endDate;
  const days = item.isHalfDay ? 0.5 : item.totalDays;
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View
          style={[
            styles.icon,
            { backgroundColor: colors.primarySoft, borderRadius: radius.md },
          ]}
        >
          <CalendarRange size={20} color={colors.primary} filled />
        </View>
        <View style={styles.flex}>
          <AppText variant="bodyMedium" numberOfLines={1}>
            {showEmployee && item.employeeName
              ? item.employeeName
              : item.leaveType}
          </AppText>
          <AppText variant="caption" color="mutedForeground">
            {showEmployee ? `${item.leaveType} · ` : ''}
            {sameDay
              ? formatDate(item.startDate)
              : `${formatShortDate(item.startDate)} – ${formatDate(
                  item.endDate,
                )}`}
          </AppText>
        </View>
        <StatusBadge status={item.status} />
      </View>
      <View style={[styles.meta, { borderTopColor: colors.border }]}>
        <AppText variant="captionMedium" color="textSecondary">
          {days} {days === 1 ? 'day' : 'days'}
          {item.isHalfDay && item.halfDayPeriod
            ? ` · ${item.halfDayPeriod.replace('_', ' ')}`
            : ''}
        </AppText>
        {item.reason ? (
          <AppText
            variant="caption"
            color="mutedForeground"
            numberOfLines={1}
            style={styles.reason}
          >
            {item.reason}
          </AppText>
        ) : null}
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
  meta: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reason: { flex: 1, textAlign: 'right' },
});

export default LeaveCard;
