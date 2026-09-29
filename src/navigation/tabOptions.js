import { Platform } from 'react-native';

export const buildTabOptions = (theme, insets) => ({
  headerShown: false,
  tabBarActiveTintColor: theme.colors.primary,
  tabBarInactiveTintColor: theme.colors.mutedForeground,
  tabBarHideOnKeyboard: true,
  tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  tabBarStyle: {
    backgroundColor: theme.colors.tabBar,
    borderTopColor: theme.colors.border,
    height: 64 + insets.bottom,
    paddingTop: 8,
    paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 12),
    elevation: 12,
    shadowColor: '#0B1C3C',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
  },
});
