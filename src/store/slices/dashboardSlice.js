import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { dashboardService } from '@/api/services/dashboardService';
import { remote, addRemoteCases, safeCall } from '../helpers';
import { logout, sessionExpired } from './authSlice';

export const fetchMyStats = createAsyncThunk(
  'dashboard/me',
  (_, { rejectWithValue }) =>
    safeCall(dashboardService.getMyStats, rejectWithValue),
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
