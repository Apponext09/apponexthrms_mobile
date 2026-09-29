import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import dayjs from 'dayjs';
import { attendanceService } from '@/api/services/attendanceService';
import { getCurrentPosition } from '@/utils/location';
import { normalizeAttendanceRecord, asList } from '@/utils/normalize';
import { remote, addRemoteCases, safeCall } from '../helpers';
import { logout, sessionExpired } from './authSlice';

export const fetchAttendanceStatus = createAsyncThunk(
  'attendance/status',
  (_, { rejectWithValue }) =>
    safeCall(attendanceService.getStatus, rejectWithValue),
);

export const fetchAttendanceHistory = createAsyncThunk(
  'attendance/history',
  ({ month } = {}, { rejectWithValue }) =>
    safeCall(async () => {
      const m = month ? dayjs(month) : dayjs();
      const { items } = await attendanceService.getHistory({
        page: 1,
        pageSize: 62,
        startDate: m.startOf('month').format('YYYY-MM-DD'),
        endDate: m.endOf('month').format('YYYY-MM-DD'),
      });
      return items.map(normalizeAttendanceRecord);
    }, rejectWithValue),
);

// Check-in / check-out attach GPS coordinates when permission is granted
export const punch = createAsyncThunk(
  'attendance/punch',
  ({ type }, { dispatch, rejectWithValue }) =>
    safeCall(async () => {
      const coords = await getCurrentPosition();
      const result =
        type === 'in'
          ? await attendanceService.checkIn(coords)
          : await attendanceService.checkOut(coords);
      dispatch(fetchAttendanceStatus());
      return result;
    }, rejectWithValue),
);

export const toggleBreak = createAsyncThunk(
  'attendance/break',
  ({ start }, { dispatch, rejectWithValue }) =>
    safeCall(async () => {
      const result = start
        ? await attendanceService.breakIn()
        : await attendanceService.breakOut();
      dispatch(fetchAttendanceStatus());
      return result;
    }, rejectWithValue),
);

export const fetchPendingRegularizations = createAsyncThunk(
  'attendance/regularizations',
  ({ asHr }, { rejectWithValue }) =>
    safeCall(
      async () =>
        asList(await attendanceService.getPendingRegularizations(asHr)),
      rejectWithValue,
    ),
);

export const decideRegularization = createAsyncThunk(
  'attendance/decideRegularization',
  ({ id, approve, asHr, comment }, { rejectWithValue }) =>
    safeCall(async () => {
      await attendanceService.decideRegularization(id, approve, asHr, comment);
      return id;
    }, rejectWithValue),
);

const initialState = {
  status: remote(),
  history: remote([]),
  regularizations: remote([]),
  punching: false,
  breakLoading: false,
};

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {},
  extraReducers: builder => {
    addRemoteCases(builder, fetchAttendanceStatus, 'status');
    addRemoteCases(builder, fetchAttendanceHistory, 'history');
    addRemoteCases(builder, fetchPendingRegularizations, 'regularizations');
    builder
      .addCase(punch.pending, state => {
        state.punching = true;
      })
      .addCase(punch.fulfilled, state => {
        state.punching = false;
      })
      .addCase(punch.rejected, state => {
        state.punching = false;
      })
      .addCase(toggleBreak.pending, state => {
        state.breakLoading = true;
      })
      .addCase(toggleBreak.fulfilled, state => {
        state.breakLoading = false;
      })
      .addCase(toggleBreak.rejected, state => {
        state.breakLoading = false;
      })
      .addCase(decideRegularization.fulfilled, (state, { payload }) => {
        state.regularizations.data = state.regularizations.data.filter(
          r => r.id !== payload,
        );
      })
      .addCase(logout.fulfilled, () => initialState)
      .addCase(sessionExpired.fulfilled, () => initialState);
  },
});

export const selectAttendance = s => s.attendance;

export default attendanceSlice.reducer;
