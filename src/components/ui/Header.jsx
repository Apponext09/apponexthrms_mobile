import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import AppText from './AppText';

// Gradient header used on tab root screens
export const GradientHeader = ({ title, subtitle, right, children }) => {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={colors.headerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.gradient,
        { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.flex}>
          {subtitle ? (
            <AppText variant="caption" color="rgba(255,255,255,0.8)">
              {subtitle}
            </AppText>
          ) : null}
          <AppText variant="h1" color="#FFFFFF" numberOfLines={1}>
            {title}
          </AppText>
        </View>
        {right}
      </View>
      {children}
    </LinearGradient>
  );
};

// Plain header with a back button for stack screens
export const StackHeader = ({ title, right, onBack }) => {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.stack,
        {
          paddingTop: insets.top + spacing.sm,
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <Pressable
        onPress={onBack || navigation.goBack}
        hitSlop={12}
        style={[
          styles.back,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <ChevronLeft size={22} color={colors.foreground} />
      </Pressable>
      <AppText variant="h3" style={styles.stackTitle} numberOfLines={1}>
        {title}
      </AppText>
      <View style={styles.right}>{right}</View>
    </View>
  );
};

// Round translucent icon button for gradient headers
export const HeaderIconButton = ({ icon: Icon, onPress, badge }) => (
  <Pressable onPress={onPress} hitSlop={8} style={styles.iconBtn}>
    <Icon size={20} color="#FFFFFF" />
    {badge ? <View style={styles.dot} /> : null}
  </Pressable>
);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gradient: {
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  stackTitle: { flex: 1, marginLeft: 12 },
  right: { minWidth: 40, alignItems: 'flex-end' },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4343',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
