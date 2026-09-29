import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';

// Vertical bar chart.
// data: [{ label, value, secondary? }] — `secondary` stacks on top in a second color.
// showValues prints each bar's total above it; formatValue customises that text.
const BarChart = ({
  data = [],
  height = 120,
  color,
  secondaryColor,
  showValues = false,
  formatValue = v => String(v),
  barWidth = '62%',
}) => {
  const { colors } = useTheme();
  const max = Math.max(
    1,
    ...data.map(d => (Number(d.value) || 0) + (Number(d.secondary) || 0)),
  );
  return (
    <View style={styles.wrap}>
      {data.map((d, i) => {
        const v = Number(d.value) || 0;
        const s = Number(d.secondary) || 0;
        const total = v + s;
        return (
          <View key={`${d.label}-${i}`} style={styles.col}>
            {showValues ? (
              <AppText variant="small" color="textSecondary" numberOfLines={1}>
                {total ? formatValue(total) : ''}
              </AppText>
            ) : null}
            <View
              style={[
                styles.track,
                { height, width: barWidth, backgroundColor: colors.muted },
              ]}
            >
              {s > 0 ? (
                <View
                  style={{
                    height: (s / max) * height,
                    backgroundColor: secondaryColor || colors.warning,
                  }}
                />
              ) : null}
              <View
                style={{
                  height: (v / max) * height,
                  backgroundColor: color || colors.primary,
                }}
              />
            </View>
            <AppText
              variant="small"
              color="mutedForeground"
              style={styles.label}
              numberOfLines={1}
            >
              {d.label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 4,
  },
  col: { flex: 1, alignItems: 'center', gap: 4 },
  track: { borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
  label: { marginTop: 2 },
});

export default BarChart;
