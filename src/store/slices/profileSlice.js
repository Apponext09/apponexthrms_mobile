import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { profileService } from '@/api/services/profileService';
import { authService } from '@/api/services/authService';
import { asList, normalizeEmployee, pick } from '@/utils/normalize';
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

const emptySections = {
  editUnlocked: false,
  pendingRequest: null,
  personal: {},
  professional: {},
};

// Lock status, pending edit request, and the Personal / Professional sections
export const fetchProfileSections = createAsyncThunk(
  'profile/sections',
  (_, { getState, rejectWithValue }) =>
    safeCall(async () => {
      const id = getState().auth.user?.employeeId;
      if (!id) return emptySections;
      const [perm, requests, personal, professional] = await Promise.allSettled(
        [
          profileService.getEditPermission(id),
          profileService.getMyUpdateRequests(),
          profileService.getPersonalInfo(id),
          profileService.getProfessionalInfo(id),
        ],
      );
      const ok = r => (r.status === 'fulfilled' ? r.value || {} : {});
      const pending = asList(ok(requests)).find(r =>
        String(pick(r, 'status') || '')
          .toLowerCase()
          .startsWith('pending'),
      );
      return {
        editUnlocked: !!ok(perm).editUnlocked,
        pendingRequest: pending
          ? {
              id: pick(pending, 'id'),
              submittedAt: pick(
                pending,
                'submittedAt',
                'submitted_at',
                'createdAt',
                'created_at',
              ),
            }
          : null,
        personal: ok(personal),
        professional: ok(professional),
      };
    }, rejectWithValue),
);

export const requestProfileEdit = createAsyncThunk(
  'profile/requestEdit',
  (reason, { dispatch, getState, rejectWithValue }) =>
    safeCall(async () => {
      const id = getState().auth.user?.employeeId;
      const result = await profileService.requestEdit(id, reason);
      dispatch(fetchProfileSections());
      return result;
    }, rejectWithValue),
);

// section: 'basic' | 'personal' | 'professional'
export const saveProfileSection = createAsyncThunk(
  'profile/saveSection',
  ({ section, data }, { dispatch, getState, rejectWithValue }) =>
    safeCall(async () => {
      const id = getState().auth.user?.employeeId;
      if (section === 'basic') await profileService.updateEmployee(id, data);
      else if (section === 'personal')
        await profileService.savePersonalInfo(id, data);
      else await profileService.saveProfessionalInfo(id, data);
      dispatch(fetchEmployeeProfile());
      dispatch(fetchProfileSections());
      if (section === 'basic') dispatch(refreshProfile());
      return section;
    }, rejectWithValue),
);

// Like the portal: saves the photo and enrols it for face attendance.
// dataUrl null removes the photo.
export const saveProfilePhoto = createAsyncThunk(
  'profile/photo',
  (dataUrl, { dispatch, getState, rejectWithValue }) =>
    safeCall(async () => {
      const id = getState().auth.user?.employeeId;
      await profileService.updateEmployee(
        id,
        dataUrl
          ? { avatarUrl: dataUrl, biometricImages: [dataUrl] }
          : { avatarUrl: null },
      );
      let enrolled = false;
      if (dataUrl) {
        try {
          await profileService.enrollFace(id, [dataUrl]);
          enrolled = true;
        } catch {
          // Photo is saved either way; face enrolment can be retried
        }
      }
      dispatch(fetchEmployeeProfile());
      dispatch(refreshProfile());
      return { enrolled };
    }, rejectWithValue),
);

export const changePassword = createAsyncThunk(
  'profile/changePassword',
  ({ currentPassword, newPassword, confirmPassword }, { rejectWithValue }) =>
    safeCall(
      () =>
        authService.changePassword(
          currentPassword,
          newPassword,
          confirmPassword,
        ),
      rejectWithValue,
    ),
);

const initialState = {
  employee: remote(),
  sections: remote(emptySections),
  saving: false,
};

const savingCases = (builder, thunk) =>
  builder
    .addCase(thunk.pending, state => {
      state.saving = true;
    })
    .addCase(thunk.fulfilled, state => {
      state.saving = false;
    })
    .addCase(thunk.rejected, state => {
      state.saving = false;
    });

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {},
  extraReducers: builder => {
    addRemoteCases(builder, fetchEmployeeProfile, 'employee');
    addRemoteCases(builder, fetchProfileSections, 'sections');
    savingCases(builder, requestProfileEdit);
    savingCases(builder, saveProfileSection);
    savingCases(builder, saveProfilePhoto);
    savingCases(builder, changePassword);
    builder
      .addCase(logout.fulfilled, () => initialState)
      .addCase(sessionExpired.fulfilled, () => initialState);
  },
});

export const selectProfile = s => s.profile;

export default profileSlice.reducer;
