import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { leaveService } from '@/api/services/leaveService';
import { profileService } from '@/api/services/profileService';
import { normalizeWeeklyOffRule } from '@/utils/workingDays';
import {
  asList,
  normalizeLeaveApplication,
  normalizeLeaveBalance,
  normalizeLeaveType,
  normalizeHoliday,
  normalizeEncashment,
  normalizeEmployee,
} from '@/utils/normalize';
import { remote, addRemoteCases, safeCall } from '../helpers';
import { logout, sessionExpired } from './authSlice';

export const fetchLeaveTypes = createAsyncThunk(
  'leave/types',
  (_, { rejectWithValue }) =>
    safeCall(
      async () => asList(await leaveService.getTypes()).map(normalizeLeaveType),
      rejectWithValue,
    ),
);

export const fetchLeaveBalances = createAsyncThunk(
  'leave/balances',
  (_, { rejectWithValue }) =>
    safeCall(async () => {
      const data = await leaveService.getBalances();
      const list = Array.isArray(data)
        ? data
        : data?.balances || data?.leaveBalances || asList(data);
      return list.map(normalizeLeaveBalance);
    }, rejectWithValue),
);

export const fetchMyLeaves = createAsyncThunk(
  'leave/mine',
  (status, { rejectWithValue }) =>
    safeCall(
      async () =>
        asList(await leaveService.getMyApplications(status)).map(
          normalizeLeaveApplication,
        ),
      rejectWithValue,
    ),
);

export const applyLeave = createAsyncThunk(
  'leave/apply',
  (payload, { dispatch, rejectWithValue }) =>
    safeCall(async () => {
      const result = await leaveService.apply(payload);
      dispatch(fetchMyLeaves());
      dispatch(fetchLeaveBalances());
      return result;
    }, rejectWithValue),
);

export const cancelLeave = createAsyncThunk(
  'leave/cancel',
  ({ id, reason }, { dispatch, rejectWithValue }) =>
    safeCall(async () => {
      await leaveService.cancel(id, reason);
      dispatch(fetchMyLeaves());
      dispatch(fetchLeaveBalances());
      return id;
    }, rejectWithValue),
);

export const fetchLeaveApprovals = createAsyncThunk(
  'leave/approvals',
  (_, { rejectWithValue }) =>
    safeCall(
      async () =>
        asList(await leaveService.getPendingApprovals()).map(
          normalizeLeaveApplication,
        ),
      rejectWithValue,
    ),
);

export const fetchProcessedLeaveApprovals = createAsyncThunk(
  'leave/processed',
  (_, { rejectWithValue }) =>
    safeCall(
      async () =>
        asList(await leaveService.getProcessedApprovals()).map(
          normalizeLeaveApplication,
        ),
      rejectWithValue,
    ),
);

export const decideLeave = createAsyncThunk(
  'leave/decide',
  ({ id, approve, note }, { rejectWithValue }) =>
    safeCall(async () => {
      if (approve) await leaveService.approve(id, note);
      else await leaveService.reject(id, note);
      return id;
    }, rejectWithValue),
);

// Holidays (with optional-holiday selections), weekly-off rules and org
// leave rules: everything the apply form needs to work out working days
export const fetchLeaveSetup = createAsyncThunk(
  'leave/setup',
  (_, { rejectWithValue }) =>
    safeCall(async () => {
      const [calendar, optional, settings] = await Promise.allSettled([
        leaveService.getCalendar(),
        leaveService.getOptionalHolidays(),
        leaveService.getSettings(),
      ]);
      const ok = r => (r.status === 'fulfilled' ? r.value || {} : {});
      const cal = ok(calendar);
      const optionalList = asList(ok(optional)).map(h => ({
        ...normalizeHoliday(h),
        selected: !!h.selected,
        selectionId: h.selection_id || h.selectionId || null,
        selectionStatus: h.selection_status || h.selectionStatus || null,
      }));
      const selected = new Set(
        optionalList.filter(h => h.selected).map(h => String(h.id)),
      );
      const rules = ok(settings);
      return {
        holidays: asList(cal.holidays).map(h => ({
          ...normalizeHoliday(h),
          selected: selected.has(String(h.id)),
        })),
        weeklyOffRules: asList(cal.weeklyOffRules).map(normalizeWeeklyOffRule),
        optionalHolidays: optionalList,
        enableBackupPerson: Boolean(
          rules.enableBackupPerson ?? rules.enable_backup_person,
        ),
      };
    }, rejectWithValue),
);

export const toggleOptionalHoliday = createAsyncThunk(
  'leave/toggleOptional',
  (holiday, { dispatch, rejectWithValue }) =>
    safeCall(async () => {
      if (holiday.selected && holiday.selectionId)
        await leaveService.removeOptionalHoliday(holiday.selectionId);
      else await leaveService.selectOptionalHoliday(holiday.id);
      await dispatch(fetchLeaveSetup());
      return holiday.id;
    }, rejectWithValue),
);

export const fetchEncashments = createAsyncThunk(
  'leave/encashments',
  (_, { rejectWithValue }) =>
    safeCall(
      async () =>
        asList(await leaveService.getMyEncashments()).map(normalizeEncashment),
      rejectWithValue,
    ),
);

export const requestEncashment = createAsyncThunk(
  'leave/requestEncashment',
  (payload, { dispatch, rejectWithValue }) =>
    safeCall(async () => {
      const result = await leaveService.requestEncashment(payload);
      dispatch(fetchEncashments());
      dispatch(fetchLeaveBalances());
      return result;
    }, rejectWithValue),
);

// Colleagues for the backup-person picker (active employees only)
export const fetchTeam = createAsyncThunk(
  'leave/team',
  (_, { getState, rejectWithValue }) =>
    safeCall(async () => {
      const me = getState().auth.user?.employeeId;
      return asList(await profileService.listEmployees())
        .map(normalizeEmployee)
        .filter(e => e.id !== me && String(e.status).toLowerCase() !== 'exit');
    }, rejectWithValue),
);

const initialState = {
  types: remote([]),
  balances: remote([]),
  mine: remote([]),
  approvals: remote([]),
  processed: remote([]),
  setup: remote({
    holidays: [],
    weeklyOffRules: [],
    optionalHolidays: [],
    enableBackupPerson: false,
  }),
  encashments: remote([]),
  team: remote([]),
  submitting: false,
  togglingHolidayId: null,
};

const leaveSlice = createSlice({
  name: 'leave',
  initialState,
  reducers: {},
  extraReducers: builder => {
    addRemoteCases(builder, fetchLeaveTypes, 'types');
    addRemoteCases(builder, fetchLeaveBalances, 'balances');
    addRemoteCases(builder, fetchMyLeaves, 'mine');
    addRemoteCases(builder, fetchLeaveApprovals, 'approvals');
    addRemoteCases(builder, fetchProcessedLeaveApprovals, 'processed');
    addRemoteCases(builder, fetchLeaveSetup, 'setup');
    addRemoteCases(builder, fetchEncashments, 'encashments');
    addRemoteCases(builder, fetchTeam, 'team');
    builder
      .addCase(toggleOptionalHoliday.pending, (state, { meta }) => {
        state.togglingHolidayId = meta.arg.id;
      })
      .addCase(toggleOptionalHoliday.fulfilled, state => {
        state.togglingHolidayId = null;
      })
      .addCase(toggleOptionalHoliday.rejected, state => {
        state.togglingHolidayId = null;
      })
      .addCase(requestEncashment.pending, state => {
        state.submitting = true;
      })
      .addCase(requestEncashment.fulfilled, state => {
        state.submitting = false;
      })
      .addCase(requestEncashment.rejected, state => {
        state.submitting = false;
      })
      .addCase(applyLeave.pending, state => {
        state.submitting = true;
      })
      .addCase(applyLeave.fulfilled, state => {
        state.submitting = false;
      })
      .addCase(applyLeave.rejected, state => {
        state.submitting = false;
      })
      .addCase(decideLeave.fulfilled, (state, { payload }) => {
        state.approvals.data = state.approvals.data.filter(
          a => a.applicationId !== payload && a.id !== payload,
        );
      })
      .addCase(logout.fulfilled, () => initialState)
      .addCase(sessionExpired.fulfilled, () => initialState);
  },
});

export const selectLeave = s => s.leave;

export default leaveSlice.reducer;
