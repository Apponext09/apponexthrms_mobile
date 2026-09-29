import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

const Card = ({ children, style, onPress, padded = true, elevated = true }) => {
  const { colors, radius, spacing, shadow, isDark } = useTheme();
  const base = [
    {
      backgroundColor: colors.card,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: padded ? spacing.lg : 0,
    },
    elevated && !isDark ? shadow.sm : null,
    style,
  ];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [base, pressed && { opacity: 0.85 }]}
    >
      {children}
    </Pressable>
  );
};

export default Card;
