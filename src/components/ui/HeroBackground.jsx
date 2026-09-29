import React from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '@/hooks/useTheme';

// Blue header surface with the two soft decorative circles from the design reference
const HeroBackground = ({ children, style }) => {
  const { colors } = useTheme();
  return (
    <LinearGradient
      colors={colors.headerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.wrap, style]}
    >
      <View pointerEvents="none" style={[styles.circle, styles.topRight]} />
      <View pointerEvents="none" style={[styles.circle, styles.bottomLeft]} />
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
  circle: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 999,
  },
  topRight: { width: 300, height: 300, top: -120, right: -110 },
  bottomLeft: { width: 220, height: 220, bottom: -120, left: -90 },
});

export default HeroBackground;
