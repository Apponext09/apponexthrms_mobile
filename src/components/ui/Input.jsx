import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import AppText from './AppText';

const Input = ({
  label,
  error,
  icon: Icon,
  secure = false,
  multiline = false,
  style,
  inputStyle,
  hint,
  ...rest
}) => {
  const { colors, radius, typography } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secure);

  return (
    <View style={[styles.wrap, style]}>
      {label ? (
        <AppText
          variant="captionMedium"
          color="textSecondary"
          style={styles.label}
        >
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          styles.field,
          {
            borderRadius: radius.lg,
            backgroundColor: colors.card,
            borderColor: error
              ? colors.danger
              : focused
              ? colors.primary
              : colors.border,
            minHeight: multiline ? 96 : 50,
            alignItems: multiline ? 'flex-start' : 'center',
          },
        ]}
      >
        {Icon ? (
          <Icon
            size={18}
            color={focused ? colors.primary : colors.mutedForeground}
            style={styles.icon}
          />
        ) : null}
        <TextInput
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry={hidden}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            typography.body,
            styles.input,
            { color: colors.foreground },
            inputStyle,
          ]}
          {...rest}
        />
        {secure ? (
          <Pressable
            onPress={() => setHidden(h => !h)}
            hitSlop={10}
            style={styles.icon}
          >
            {hidden ? (
              <Eye size={18} color={colors.mutedForeground} />
            ) : (
              <EyeOff size={18} color={colors.mutedForeground} />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText variant="caption" color="danger" style={styles.helper}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText
          variant="caption"
          color="mutedForeground"
          style={styles.helper}
        >
          {hint}
        </AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { marginBottom: 6 },
  field: { flexDirection: 'row', borderWidth: 1.2, paddingHorizontal: 14 },
  icon: { marginRight: 10, marginTop: 0 },
  input: { flex: 1, paddingVertical: 12, includeFontPadding: false },
  helper: { marginTop: 4 },
});

export default Input;
