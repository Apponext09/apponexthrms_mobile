import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import AppText from './AppText';

// options: [{ key, label, count? }]
const SegmentedTabs = ({ options, value, onChange, style }) => {
  const { colors, radius } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, style]}
    >
      {options.map(o => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={[
              styles.chip,
              {
                borderRadius: radius.pill,
                backgroundColor: active ? colors.primary : colors.card,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
          >
            <AppText
              variant="captionMedium"
              color={active ? colors.primaryForeground : colors.textSecondary}
            >
              {o.label}
              {o.count != null ? ` · ${o.count}` : ''}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 2 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
});

export default SegmentedTabs;
