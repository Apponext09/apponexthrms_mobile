import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import dayjs from 'dayjs';
import { attendanceService } from '@/api/services/attendanceService';
import { settingsService } from '@/api/services/settingsService';
import { getCurrentPosition } from '@/utils/location';
import {
  normalizeAttendanceRecord,
  normalizeHoliday,
  normalizeRegularization,
  asList,
} from '@/utils/normalize';
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

// Everything the punch screen needs besides today's status: punch
// locations, org attendance settings and the holiday calendar
export const fetchAttendanceSetup = createAsyncThunk(
  'attendance/setup',
  (_, { rejectWithValue }) =>
    safeCall(async () => {
      const [locations, org, holidays] = await Promise.allSettled([
        attendanceService.getPermittedLocations(),
        settingsService.getOrgSettings(),
        settingsService.getMyHolidays(dayjs().year()),
      ]);
      const loc = locations.status === 'fulfilled' ? locations.value || {} : {};
      const settings = org.status === 'fulfilled' ? org.value || {} : {};
      return {
        locations: (loc.locations || []).map(l => ({
          id: String(l.locationId || l.id),
          name: l.name,
          isPrimary: !!l.isPrimary,
          radiusMeters: Number(l.radiusMeters) || null,
        })),
        allowRemote: !!loc.allowRemote,
        // Some organisations only record a check-in (no check-out needed)
        requireCheckout:
          settings.require_checkout === undefined
            ? true
            : !!settings.require_checkout,
        holidays:
          holidays.status === 'fulfilled'
            ? asList(holidays.value).map(normalizeHoliday)
            : [],
      };
    }, rejectWithValue),
);

// Check-in / check-out attach GPS coordinates when permission is granted
// and the punch location picked on the punch card
export const punch = createAsyncThunk(
  'attendance/punch',
  ({ type }, { dispatch, getState, rejectWithValue }) =>
    safeCall(async () => {
      const coords = await getCurrentPosition();
      const locationId = getState().attendance.selectedLocationId;
      const result =
        type === 'in'
          ? await attendanceService.checkIn(coords, locationId)
          : await attendanceService.checkOut(coords, locationId);
      dispatch(fetchAttendanceStatus());
      return result;
    }, rejectWithValue),
);

export const fetchMyRegularizations = createAsyncThunk(
  'attendance/myRegularizations',
  (_, { rejectWithValue }) =>
    safeCall(
      async () =>
        asList(await attendanceService.getMyRegularizations()).map(
          normalizeRegularization,
        ),
      rejectWithValue,
    ),
);

// Raises a work hour (regularization) request, same payload as the portal
export const createRegularization = createAsyncThunk(
  'attendance/createRegularization',
  (payload, { dispatch, rejectWithValue }) =>
    safeCall(async () => {
      const result = await attendanceService.createRegularization(payload);
      dispatch(fetchMyRegularizations());
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
  myRegularizations: remote([]),
  setup: remote({
    locations: [],
    allowRemote: false,
    requireCheckout: true,
    holidays: [],
  }),
  selectedLocationId: null,
  submittingRegularization: false,
  punching: false,
  breakLoading: false,
};

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    selectPunchLocation: (state, { payload }) => {
      state.selectedLocationId = payload;
    },
  },
  extraReducers: builder => {
    addRemoteCases(builder, fetchAttendanceStatus, 'status');
    addRemoteCases(builder, fetchMyRegularizations, 'myRegularizations');
    addRemoteCases(builder, fetchAttendanceSetup, 'setup');
    addRemoteCases(builder, fetchAttendanceHistory, 'history');
    addRemoteCases(builder, fetchPendingRegularizations, 'regularizations');
    builder
      .addCase(createRegularization.pending, state => {
        state.submittingRegularization = true;
      })
      .addCase(createRegularization.fulfilled, state => {
        state.submittingRegularization = false;
      })
      .addCase(createRegularization.rejected, state => {
        state.submittingRegularization = false;
      })
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
      .addCase(sessionExpired.fulfilled, () => initialState)
      // Default to the primary location, like the portal (matcher, because
      // addRemoteCases already handles fetchAttendanceSetup.fulfilled)
      .addMatcher(
        fetchAttendanceSetup.fulfilled.match,
        (state, { payload }) => {
          const ids = payload.locations.map(l => l.id);
          if (!ids.includes(state.selectedLocationId)) {
            const primary = payload.locations.find(l => l.isPrimary);
            state.selectedLocationId =
              (primary || payload.locations[0])?.id || null;
          }
        },
      );
  },
});

export const { selectPunchLocation } = attendanceSlice.actions;

export const selectAttendance = s => s.attendance;

export default attendanceSlice.reducer;
