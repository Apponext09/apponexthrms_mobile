import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';

// data: [{ label, value, secondary? }] rendered as simple vertical bars
const MiniBarChart = ({ data = [], height = 120, color, secondaryColor }) => {
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
        return (
          <View key={`${d.label}-${i}`} style={styles.col}>
            <View
              style={[styles.track, { height, backgroundColor: colors.muted }]}
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
    gap: 8,
  },
  col: { flex: 1, alignItems: 'center' },
  track: {
    width: '70%',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  label: { marginTop: 6 },
});

export default MiniBarChart;
