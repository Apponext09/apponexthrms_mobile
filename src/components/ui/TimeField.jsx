import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { Clock } from '@/components/ui/icons';
import { useTheme } from '@/hooks/useTheme';
import AppText from './AppText';

// Time picker field. value / onChange use "HH:mm" (24h) strings.
const TimeField = ({ label, value, onChange, error, required, style }) => {
  const { colors, radius, isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const asDate = value
    ? dayjs(`2000-01-01T${value}`).toDate()
    : dayjs().second(0).toDate();

  return (
    <View style={[styles.wrap, style]}>
      {label ? (
        <AppText
          variant="captionMedium"
          color="textSecondary"
          style={styles.label}
        >
          {label}
          {required ? (
            <AppText variant="captionMedium" color="danger">
              {' '}
              *
            </AppText>
          ) : null}
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
        <Clock size={18} color={colors.mutedForeground} />
        <AppText
          color={value ? 'foreground' : 'mutedForeground'}
          style={styles.text}
        >
          {value
            ? dayjs(`2000-01-01T${value}`).format('hh:mm A')
            : 'Select time'}
        </AppText>
      </Pressable>
      {error ? (
        <AppText variant="caption" color="danger" style={styles.helper}>
          {error}
        </AppText>
      ) : null}
      {open ? (
        <DateTimePicker
          value={asDate}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          themeVariant={isDark ? 'dark' : 'light'}
          onChange={(event, date) => {
            setOpen(Platform.OS === 'ios');
            if (event.type === 'set' && date)
              onChange(dayjs(date).format('HH:mm'));
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

export default TimeField;
