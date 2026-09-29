import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CalendarDays,
  Fingerprint,
  LayoutDashboard,
  ReceiptText,
  UserRound,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import EmployeeDashboardScreen from '@/screens/employee/dashboard/EmployeeDashboardScreen';
import AttendanceScreen from '@/screens/employee/attendance/AttendanceScreen';
import LeaveScreen from '@/screens/employee/leave/LeaveScreen';
import ExpenseScreen from '@/screens/employee/expense/ExpenseScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import TabBarIcon from './TabBarIcon';
import { buildTabOptions } from './tabOptions';

const Tab = createBottomTabNavigator();

const TABS = [
  {
    name: 'HomeTab',
    label: 'Dashboard',
    icon: LayoutDashboard,
    component: EmployeeDashboardScreen,
  },
  {
    name: 'AttendanceTab',
    label: 'Attendance',
    icon: Fingerprint,
    component: AttendanceScreen,
  },
  {
    name: 'LeaveTab',
    label: 'Leave',
    icon: CalendarDays,
    component: LeaveScreen,
  },
  {
    name: 'ExpenseTab',
    label: 'Expense',
    icon: ReceiptText,
    component: ExpenseScreen,
  },
  {
    name: 'ProfileTab',
    label: 'Profile',
    icon: UserRound,
    component: ProfileScreen,
  },
];

const EmployeeTabs = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator screenOptions={buildTabOptions(theme, insets)}>
      {TABS.map(t => (
        <Tab.Screen
          key={t.name}
          name={t.name}
          component={t.component}
          options={{
            tabBarLabel: t.label,
            tabBarIcon: ({ focused, color }) => (
              <TabBarIcon
                icon={t.icon}
                focused={focused}
                color={color}
                activeBg={theme.colors.primarySoft}
              />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
};

export default EmployeeTabs;
