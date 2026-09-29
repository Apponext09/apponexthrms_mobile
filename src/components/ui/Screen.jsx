import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
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
  hero, // AppHeader rendered inside the scroll view; content overlaps its bottom edge
  statusBarLight = false,
  footer,
  stack = false, // pushed screens (no tab bar) must keep clear of the system nav bar
}) => {
  const { colors, isDark, spacing } = useTheme();
  // With a hero header the status bar sits on blue until it scrolls away
  const insets = useSafeAreaInsets();
  const [pastHero, setPastHero] = useState(false);
  const onScroll = hero
    ? e => setPastHero(e.nativeEvent.contentOffset.y > 110)
    : undefined;
  const barStyle =
    isDark || statusBarLight || (hero && !pastHero)
      ? 'light-content'
      : 'dark-content';
  // Tabs stay mounted, so apply the style whenever this screen gains focus
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle(barStyle, true);
    }, [barStyle]),
  );
  const padding = { padding: spacing.lg, paddingBottom: spacing.xxxl * 2 };
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[hero ? styles.heroScroll : padding, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      onScroll={onScroll}
      scrollEventThrottle={64}
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
      {hero ? (
        <>
          {hero}
          <View style={[padding, styles.overlap]}>{children}</View>
        </>
      ) : (
        children
      )}
    </ScrollView>
  ) : (
    <View style={[styles.flex, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView
      edges={header || hero ? (stack ? ['bottom'] : []) : edges}
      style={[styles.flex, { backgroundColor: colors.background }]}
    >
      {header}
      {body}
      {footer}
      {hero && pastHero ? (
        <View
          pointerEvents="none"
          style={[
            styles.statusStrip,
            { height: insets.top, backgroundColor: colors.background },
          ]}
        />
      ) : null}
    </SafeAreaView>
  );
};

export const HERO_OVERLAP = 44;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  heroScroll: { paddingBottom: 0 },
  statusStrip: { position: 'absolute', top: 0, left: 0, right: 0 },
  overlap: { marginTop: -HERO_OVERLAP, paddingTop: 0 },
});

export default Screen;
