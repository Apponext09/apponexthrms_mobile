import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import AppText from './AppText';
import Card from './Card';

// tone: primary | success | warning | danger | info
const StatCard = ({
  icon: Icon,
  label,
  value,
  tone = 'primary',
  caption,
  style,
  onPress,
}) => {
  const { colors, radius } = useTheme();
  const toneMap = {
    primary: [colors.primarySoft, colors.primary],
    success: [colors.successSoft, colors.success],
    warning: [colors.warningSoft, colors.warning],
    danger: [colors.dangerSoft, colors.danger],
    info: [colors.infoSoft, colors.info],
  };
  const [bg, fg] = toneMap[tone] || toneMap.primary;
  return (
    <Card style={[styles.card, style]} onPress={onPress}>
      {Icon ? (
        <View
          style={[
            styles.icon,
            { backgroundColor: bg, borderRadius: radius.md },
          ]}
        >
          <Icon size={19} color={fg} filled />
        </View>
      ) : null}
      <AppText variant="h2" numberOfLines={1}>
        {value}
      </AppText>
      <AppText variant="caption" color="mutedForeground" numberOfLines={1}>
        {label}
      </AppText>
      {caption ? (
        <AppText variant="small" color={fg} style={styles.caption}>
          {caption}
        </AppText>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: '46%' },
  icon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  caption: { marginTop: 4 },
});

export default StatCard;
