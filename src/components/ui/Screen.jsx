import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';

// Base screen container: safe area, themed background, optional scroll + pull to refresh
const Screen = ({
  children,
  scroll = true,
  refreshing = false,
  onRefresh,
  edges = ['top'],
  contentStyle,
  header,
  statusBarLight = false,
  footer,
  stack = false, // pushed screens (no tab bar) must keep clear of the system nav bar
}) => {
  const { colors, isDark, spacing } = useTheme();
  const barStyle = statusBarLight || isDark ? 'light-content' : 'dark-content';
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[
        { padding: spacing.lg, paddingBottom: spacing.xxxl * 2 },
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView
      edges={header ? (stack ? ['bottom'] : []) : edges}
      style={[styles.flex, { backgroundColor: colors.background }]}
    >
      <StatusBar
        barStyle={barStyle}
        backgroundColor="transparent"
        translucent
      />
      {header}
      {body}
      {footer}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({ flex: { flex: 1 } });

export default Screen;
