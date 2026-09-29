import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import dayjs from 'dayjs';
import { dashboardService } from '@/api/services/dashboardService';
import { attendanceService } from '@/api/services/attendanceService';
import { leaveService } from '@/api/services/leaveService';
import { expenseService } from '@/api/services/expenseService';
import {
  asList,
  normalizeAttendanceRecord,
  normalizeExpenseClaim,
  normalizeLeaveApplication,
} from '@/utils/normalize';
import { remote, addRemoteCases, safeCall } from '../helpers';
import { logout, sessionExpired } from './authSlice';

// Builds this month's numbers from module endpoints; used when /dashboard/me/stats fails
const computeMyStats = async () => {
  const start = dayjs().startOf('month');
  const end = dayjs().endOf('month');
  const [history, leaves, claims] = await Promise.allSettled([
    attendanceService.getHistory({
      page: 1,
      pageSize: 62,
      startDate: start.format('YYYY-MM-DD'),
      endDate: end.format('YYYY-MM-DD'),
    }),
    leaveService.getMyApplications(),
    expenseService.getMyClaims(),
  ]);
  const records =
    history.status === 'fulfilled'
      ? history.value.items.map(normalizeAttendanceRecord)
      : [];
  const apps =
    leaves.status === 'fulfilled'
      ? asList(leaves.value).map(normalizeLeaveApplication)
      : [];
  const exps =
    claims.status === 'fulfilled'
      ? asList(claims.value).map(normalizeExpenseClaim)
      : [];
  const inMonth = d =>
    d && !dayjs(d).isBefore(start, 'day') && !dayjs(d).isAfter(end, 'day');
  return {
    attendanceDays: records.filter(r => r.checkInTime).length,
    leaveDays: apps
      .filter(a => a.status === 'approved' && inMonth(a.startDate))
      .reduce((n, a) => n + (a.isHalfDay ? 0.5 : a.totalDays), 0),
    expenseAmount: exps
      .filter(c => inMonth(c.claimDate))
      .reduce((n, c) => n + c.amount, 0),
    pendingExpenses: exps.filter(
      c => c.status.startsWith('pending') || c.status === 'submitted',
    ).length,
  };
};

export const fetchMyStats = createAsyncThunk(
  'dashboard/me',
  (_, { rejectWithValue }) =>
    safeCall(async () => {
      try {
        return await dashboardService.getMyStats();
      } catch {
        return computeMyStats();
      }
    }, rejectWithValue),
);

export const fetchAdminStats = createAsyncThunk(
  'dashboard/admin',
  (_, { rejectWithValue }) =>
    safeCall(dashboardService.getAdminStats, rejectWithValue),
);

const initialState = { me: remote(), admin: remote() };

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: builder => {
    addRemoteCases(builder, fetchMyStats, 'me');
    addRemoteCases(builder, fetchAdminStats, 'admin');
    builder
      .addCase(logout.fulfilled, () => initialState)
      .addCase(sessionExpired.fulfilled, () => initialState);
  },
});

export const selectMyStats = s => s.dashboard.me;
export const selectAdminStats = s => s.dashboard.admin;

export default dashboardSlice.reducer;
