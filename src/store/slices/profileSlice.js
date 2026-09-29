import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { profileService } from '@/api/services/profileService';
import { authService } from '@/api/services/authService';
import { normalizeEmployee } from '@/utils/normalize';
import { remote, addRemoteCases, safeCall } from '../helpers';
import { logout, sessionExpired, refreshProfile } from './authSlice';

export const fetchEmployeeProfile = createAsyncThunk(
  'profile/employee',
  (_, { rejectWithValue }) =>
    safeCall(
      async () =>
        normalizeEmployee(await profileService.getMyEmployeeProfile()),
      rejectWithValue,
    ),
);

export const updateProfile = createAsyncThunk(
  'profile/update',
  (payload, { dispatch, rejectWithValue }) =>
    safeCall(async () => {
      const result = await authService.updateProfile(payload);
      dispatch(refreshProfile());
      return result;
    }, rejectWithValue),
);

export const changePassword = createAsyncThunk(
  'profile/changePassword',
  ({ currentPassword, newPassword }, { rejectWithValue }) =>
    safeCall(
      () => authService.changePassword(currentPassword, newPassword),
      rejectWithValue,
    ),
);

const initialState = { employee: remote(), saving: false };

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {},
  extraReducers: builder => {
    addRemoteCases(builder, fetchEmployeeProfile, 'employee');
    builder
      .addCase(updateProfile.pending, state => {
        state.saving = true;
      })
      .addCase(updateProfile.fulfilled, state => {
        state.saving = false;
      })
      .addCase(updateProfile.rejected, state => {
        state.saving = false;
      })
      .addCase(changePassword.pending, state => {
        state.saving = true;
      })
      .addCase(changePassword.fulfilled, state => {
        state.saving = false;
      })
      .addCase(changePassword.rejected, state => {
        state.saving = false;
      })
      .addCase(logout.fulfilled, () => initialState)
      .addCase(sessionExpired.fulfilled, () => initialState);
  },
});

export const selectProfile = s => s.profile;

export default profileSlice.reducer;
