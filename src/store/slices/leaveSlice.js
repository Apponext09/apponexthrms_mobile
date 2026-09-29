import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { leaveService } from '@/api/services/leaveService';
import {
  asList,
  normalizeLeaveApplication,
  normalizeLeaveBalance,
  normalizeLeaveType,
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

const initialState = {
  types: remote([]),
  balances: remote([]),
  mine: remote([]),
  approvals: remote([]),
  processed: remote([]),
  submitting: false,
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
    builder
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
