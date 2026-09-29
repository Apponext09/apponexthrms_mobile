import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

// Thin horizontal progress bar; progress is 0..1
const ProgressBar = ({ progress = 0, color, height = 6, style }) => {
  const { colors } = useTheme();
  const p = Math.min(1, Math.max(0, Number(progress) || 0));
  return (
    <View
      style={[
        {
          height,
          borderRadius: height / 2,
          backgroundColor: colors.muted,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <View
        style={{
          width: `${p * 100}%`,
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: color || colors.primary,
        }}
      />
    </View>
  );
};

export default ProgressBar;
