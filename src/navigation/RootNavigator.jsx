import React, { useMemo } from 'react';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/hooks/useRedux';
import { selectAuth } from '@/store/slices/authSlice';
import SplashScreen from '@/screens/auth/SplashScreen';
import LoginScreen from '@/screens/auth/LoginScreen';
import ApplyLeaveScreen from '@/screens/employee/leave/ApplyLeaveScreen';
import LeaveDetailScreen from '@/screens/employee/leave/LeaveDetailScreen';
import NewExpenseScreen from '@/screens/employee/expense/NewExpenseScreen';
import ExpenseDetailScreen from '@/screens/employee/expense/ExpenseDetailScreen';
import WorkHourRequestScreen from '@/screens/employee/attendance/WorkHourRequestScreen';
import NotificationsScreen from '@/screens/notifications/NotificationsScreen';
import EditProfileScreen from '@/screens/profile/EditProfileScreen';
import ChangePasswordScreen from '@/screens/profile/ChangePasswordScreen';
import SettingsScreen from '@/screens/settings/SettingsScreen';
import HelpScreen from '@/screens/settings/HelpScreen';
import AboutScreen from '@/screens/settings/AboutScreen';
import EmployeeTabs from './EmployeeTabs';
import AdminTabs from './AdminTabs';
import { navigationRef } from './navigationRef';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const theme = useTheme();
  const { status, isAuthenticated, viewMode } = useAppSelector(selectAuth);

  const navTheme = useMemo(() => {
    const base = theme.isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.card,
        text: theme.colors.foreground,
        border: theme.colors.border,
        notification: theme.colors.danger,
      },
    };
  }, [theme]);

  if (status !== 'ready') return <SplashScreen />;

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        {!isAuthenticated ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ animation: 'fade' }}
          />
        ) : (
          <>
            {/* Keyed by view mode so switching admin/employee resets the tab state */}
            <Stack.Screen
              name="Main"
              key={viewMode}
              component={viewMode === 'admin' ? AdminTabs : EmployeeTabs}
              options={{ animation: 'fade' }}
            />
            <Stack.Screen name="ApplyLeave" component={ApplyLeaveScreen} />
            <Stack.Screen name="LeaveDetail" component={LeaveDetailScreen} />
            <Stack.Screen name="NewExpense" component={NewExpenseScreen} />
            <Stack.Screen
              name="ExpenseDetail"
              component={ExpenseDetailScreen}
            />
            <Stack.Screen
              name="WorkHourRequest"
              component={WorkHourRequestScreen}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
            />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen
              name="ChangePassword"
              component={ChangePasswordScreen}
            />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Help" component={HelpScreen} />
            <Stack.Screen name="About" component={AboutScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
