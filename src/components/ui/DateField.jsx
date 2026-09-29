import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarDays } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { formatDate } from '@/utils/format';
import AppText from './AppText';

const DateField = ({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
  error,
  style,
}) => {
  const { colors, radius, isDark } = useTheme();
  const [open, setOpen] = useState(false);

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
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.field,
          {
            borderRadius: radius.lg,
            backgroundColor: colors.card,
            borderColor: error ? colors.danger : colors.border,
          },
        ]}
      >
        <CalendarDays size={18} color={colors.mutedForeground} />
        <AppText
          color={value ? 'foreground' : 'mutedForeground'}
          style={styles.text}
        >
          {value ? formatDate(value, 'ddd, DD MMM YYYY') : 'Select date'}
        </AppText>
      </Pressable>
      {error ? (
        <AppText variant="caption" color="danger" style={styles.helper}>
          {error}
        </AppText>
      ) : null}
      {open ? (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          themeVariant={isDark ? 'dark' : 'light'}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={(event, date) => {
            setOpen(Platform.OS === 'ios');
            if (event.type === 'set' && date) onChange(date);
          }}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: 16, flex: 1 },
  label: { marginBottom: 6 },
  field: {
    height: 50,
    borderWidth: 1.2,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  text: { flex: 1 },
  helper: { marginTop: 4 },
});

export default DateField;
