import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import dayjs from 'dayjs';
import { AppText } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Month grid (weeks start on Monday) with each day tinted by its status.
// month: any date in the month. days: { 'YYYY-MM-DD': tone } where tone is a
// theme tone key (success | warning | danger | info | neutral).
const MonthCalendar = ({ month, days = {}, selected, onSelect }) => {
  const { colors, radius } = useTheme();
  const tones = {
    success: [colors.successSoft, colors.success],
    warning: [colors.warningSoft, colors.warning],
    danger: [colors.dangerSoft, colors.danger],
    info: [colors.infoSoft, colors.info],
    neutral: [colors.muted, colors.mutedForeground],
  };

  const cells = useMemo(() => {
    const start = dayjs(month).startOf('month');
    const lead = (start.day() + 6) % 7; // Monday-first offset
    const count = start.daysInMonth();
    const list = Array.from({ length: lead }, () => null);
    for (let i = 0; i < count; i += 1) list.push(start.add(i, 'day'));
    while (list.length % 7) list.push(null);
    return list;
  }, [month]);

  const today = dayjs();

  return (
    <View>
      <View style={styles.row}>
        {WEEKDAYS.map(d => (
          <AppText
            key={d}
            variant="small"
            color="mutedForeground"
            align="center"
            style={styles.cell}
          >
            {d}
          </AppText>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }).map((_, w) => (
        <View key={w} style={styles.row}>
          {cells.slice(w * 7, w * 7 + 7).map((d, i) => {
            if (!d) return <View key={i} style={styles.cell} />;
            const key = d.format('YYYY-MM-DD');
            const tone = tones[days[key]];
            const isToday = d.isSame(today, 'day');
            const isSelected = selected === key;
            return (
              <Pressable
                key={key}
                style={styles.cell}
                onPress={() => onSelect && onSelect(key)}
              >
                <View
                  style={[
                    styles.day,
                    { borderRadius: radius.md },
                    tone && { backgroundColor: tone[0] },
                    isToday && {
                      borderWidth: 1.5,
                      borderColor: colors.primary,
                    },
                    isSelected && { backgroundColor: colors.primary },
                  ]}
                >
                  <AppText
                    variant="captionMedium"
                    color={
                      isSelected
                        ? colors.primaryForeground
                        : tone
                        ? tone[1]
                        : d.isAfter(today, 'day')
                        ? 'mutedForeground'
                        : 'foreground'
                    }
                  >
                    {d.date()}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 3 },
  day: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MonthCalendar;
