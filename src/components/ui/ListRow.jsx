import React from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { Check, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import AppText from './AppText';

// Settings style row: icon, title/subtitle, and chevron / switch / value on the right
const ListRow = ({
  icon: Icon,
  iconTone = 'primary',
  title,
  subtitle,
  value,
  onPress,
  switchValue,
  onSwitch,
  danger,
  last,
  selected,
}) => {
  const { colors, radius } = useTheme();
  const tone = danger
    ? [colors.dangerSoft, colors.danger]
    : {
        primary: [colors.primarySoft, colors.primary],
        success: [colors.successSoft, colors.success],
        warning: [colors.warningSoft, colors.warning],
        info: [colors.infoSoft, colors.info],
      }[iconTone];
  const hasSwitch = typeof onSwitch === 'function';

  return (
    <Pressable
      onPress={hasSwitch ? () => onSwitch(!switchValue) : onPress}
      disabled={!onPress && !hasSwitch}
      style={({ pressed }) => [
        styles.row,
        !last && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      {Icon ? (
        <View
          style={[
            styles.icon,
            { backgroundColor: tone[0], borderRadius: radius.md },
          ]}
        >
          <Icon size={18} color={tone[1]} />
        </View>
      ) : null}
      <View style={styles.flex}>
        <AppText variant="bodyMedium" color={danger ? 'danger' : 'foreground'}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color="mutedForeground">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="caption" color="mutedForeground" style={styles.value}>
          {value}
        </AppText>
      ) : null}
      {hasSwitch ? (
        <Switch
          value={!!switchValue}
          onValueChange={onSwitch}
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor="#FFFFFF"
        />
      ) : selected !== undefined ? (
        selected ? (
          <Check size={20} color={colors.primary} />
        ) : null
      ) : onPress ? (
        <ChevronRight size={18} color={colors.mutedForeground} />
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  icon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  value: { marginRight: 4 },
});

export default ListRow;
