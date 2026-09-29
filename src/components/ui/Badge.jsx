import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { statusTone } from '@/theme';
import { titleCase } from '@/utils/format';
import AppText from './AppText';

// tone: success | warning | danger | info | neutral
const Badge = ({ label, tone = 'neutral', style }) => {
  const { colors, radius } = useTheme();
  const map = {
    success: [colors.successSoft, colors.success],
    warning: [colors.warningSoft, colors.warning],
    danger: [colors.dangerSoft, colors.danger],
    info: [colors.infoSoft, colors.info],
    neutral: [colors.muted, colors.textSecondary],
  };
  const [bg, fg] = map[tone] || map.neutral;
  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: radius.pill,
          paddingHorizontal: 10,
          paddingVertical: 4,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <AppText variant="small" color={fg}>
        {label}
      </AppText>
    </View>
  );
};

export const StatusBadge = ({ status, style }) => {
  const key = String(status || '').toLowerCase();
  const tone =
    statusTone[key] || (key.startsWith('pending') ? 'warning' : 'neutral');
  return (
    <Badge label={titleCase(key || 'unknown')} tone={tone} style={style} />
  );
};

export default Badge;
