import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { fetchLeaveApprovals, selectLeave } from '@/store/slices/leaveSlice';
import {
  fetchExpenseApprovals,
  selectExpense,
} from '@/store/slices/expenseSlice';
import AdminDashboardScreen from '@/screens/admin/dashboard/AdminDashboardScreen';
import AdminAttendanceScreen from '@/screens/admin/attendance/AdminAttendanceScreen';
import LeaveApprovalsScreen from '@/screens/admin/leave/LeaveApprovalsScreen';
import ExpenseApprovalsScreen from '@/screens/admin/expense/ExpenseApprovalsScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import TabBarIcon from './TabBarIcon';
import { buildTabOptions } from './tabOptions';

const Tab = createBottomTabNavigator();

const AdminTabs = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  useEffect(() => {
    // Preload approval queues so the tab badges show counts immediately
    dispatch(fetchLeaveApprovals());
    dispatch(fetchExpenseApprovals());
  }, [dispatch]);
  const leaveCount = useAppSelector(selectLeave).approvals.data?.length || 0;
  const expenseCount =
    useAppSelector(selectExpense).approvals.data?.length || 0;
  const icon =
    name =>
    ({ focused, color }) =>
      <TabBarIcon name={name} focused={focused} color={color} />;
  const badge = {
    tabBarBadgeStyle: { backgroundColor: theme.colors.danger, fontSize: 10 },
  };

  return (
    <Tab.Navigator screenOptions={buildTabOptions(theme, insets)}>
      <Tab.Screen
        name="AdminHomeTab"
        component={AdminDashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: icon('grid'),
        }}
      />
      <Tab.Screen
        name="AdminAttendanceTab"
        component={AdminAttendanceScreen}
        options={{ tabBarLabel: 'Attendance', tabBarIcon: icon('time') }}
      />
      <Tab.Screen
        name="AdminLeaveTab"
        component={LeaveApprovalsScreen}
        options={{
          tabBarLabel: 'Leave',
          tabBarIcon: icon('calendar'),
          tabBarBadge: leaveCount || undefined,
          ...badge,
        }}
      />
      <Tab.Screen
        name="AdminExpenseTab"
        component={ExpenseApprovalsScreen}
        options={{
          tabBarLabel: 'Expense',
          tabBarIcon: icon('receipt'),
          tabBarBadge: expenseCount || undefined,
          ...badge,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile', tabBarIcon: icon('person-circle') }}
      />
    </Tab.Navigator>
  );
};

export default AdminTabs;
