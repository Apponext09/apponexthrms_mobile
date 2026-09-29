import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

// variant: display | h1 | h2 | h3 | body | bodyMedium | caption | captionMedium | small
// color: any theme color key (foreground, mutedForeground, primary...) or a raw color
const AppText = ({
  variant = 'body',
  color = 'foreground',
  align,
  style,
  children,
  ...rest
}) => {
  const { colors, typography } = useTheme();
  return (
    <Text
      style={[
        typography[variant],
        { color: colors[color] || color, textAlign: align },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
};

export default AppText;
