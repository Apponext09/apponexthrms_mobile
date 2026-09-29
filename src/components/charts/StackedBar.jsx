import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';

// One horizontal bar split into colored segments, with a legend underneath.
// segments: [{ label, value, color }]
const StackedBar = ({ segments = [], height = 12, showLegend = true }) => {
  const { colors } = useTheme();
  const total = segments.reduce((n, s) => n + (Number(s.value) || 0), 0);
  return (
    <View>
      <View
        style={[
          styles.bar,
          { height, borderRadius: height / 2, backgroundColor: colors.muted },
        ]}
      >
        {total > 0
          ? segments
              .filter(s => Number(s.value) > 0)
              .map((s, i) => (
                <View
                  key={`${s.label}-${i}`}
                  style={{ flex: Number(s.value), backgroundColor: s.color }}
                />
              ))
          : null}
      </View>
      {showLegend ? (
        <View style={styles.legend}>
          {segments.map((s, i) => (
            <View key={`${s.label}-${i}`} style={styles.item}>
              <View style={[styles.dot, { backgroundColor: s.color }]} />
              <AppText variant="caption" color="textSecondary">
                {s.label}
              </AppText>
              <AppText variant="captionMedium">{s.value}</AppText>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', overflow: 'hidden', gap: 2 },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 16,
    rowGap: 8,
    marginTop: 12,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 3 },
});

export default StackedBar;
