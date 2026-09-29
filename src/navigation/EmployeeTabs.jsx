import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    icon: 'grid',
    component: EmployeeDashboardScreen,
  },
  {
    name: 'AttendanceTab',
    label: 'Attendance',
    icon: 'time',
    component: AttendanceScreen,
  },
  {
    name: 'LeaveTab',
    label: 'Leave',
    icon: 'calendar',
    component: LeaveScreen,
  },
  {
    name: 'ExpenseTab',
    label: 'Expense',
    icon: 'receipt',
    component: ExpenseScreen,
  },
  {
    name: 'ProfileTab',
    label: 'Profile',
    icon: 'person-circle',
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
              <TabBarIcon name={t.icon} focused={focused} color={color} />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
};

export default EmployeeTabs;
