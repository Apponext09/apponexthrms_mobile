import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import settingsReducer from './slices/settingsSlice';
import dashboardReducer from './slices/dashboardSlice';
import attendanceReducer from './slices/attendanceSlice';
import leaveReducer from './slices/leaveSlice';
import expenseReducer from './slices/expenseSlice';
import profileReducer from './slices/profileSlice';
import notificationReducer from './slices/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    settings: settingsReducer,
    dashboard: dashboardReducer,
    attendance: attendanceReducer,
    leave: leaveReducer,
    expense: expenseReducer,
    profile: profileReducer,
    notifications: notificationReducer,
  },
});
