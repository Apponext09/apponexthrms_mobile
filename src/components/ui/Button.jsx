import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import AppText from './AppText';

// variant: primary | secondary | outline | ghost | danger | success
const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  fullWidth = true,
  style,
}) => {
  const { colors, radius } = useTheme();
  const palette = {
    primary: {
      bg: colors.primary,
      fg: colors.primaryForeground,
      border: colors.primary,
    },
    secondary: {
      bg: colors.primarySoft,
      fg: colors.primary,
      border: colors.primarySoft,
    },
    outline: {
      bg: 'transparent',
      fg: colors.foreground,
      border: colors.border,
    },
    ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
    danger: { bg: colors.danger, fg: '#FFFFFF', border: colors.danger },
    success: { bg: colors.success, fg: '#FFFFFF', border: colors.success },
  }[variant];
  const height = size === 'sm' ? 38 : size === 'lg' ? 54 : 48;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderRadius: radius.lg,
          opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          paddingHorizontal: size === 'sm' ? 14 : 20,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.row}>
          {Icon ? (
            <Icon size={size === 'sm' ? 17 : 19} color={palette.fg} />
          ) : null}
          <AppText
            variant={size === 'sm' ? 'captionMedium' : 'bodyMedium'}
            color={palette.fg}
            style={styles.label}
          >
            {title}
          </AppText>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: { borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontWeight: '600' },
});

export default Button;
