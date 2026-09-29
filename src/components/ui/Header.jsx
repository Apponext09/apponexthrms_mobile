import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from '@/components/ui/icons';
import { useTheme } from '@/hooks/useTheme';
import AppText from './AppText';

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

const styles = StyleSheet.create({
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
});
