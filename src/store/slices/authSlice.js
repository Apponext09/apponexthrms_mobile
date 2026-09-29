import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authService } from '@/api/services/authService';
import {
  setSessionTokens,
  clearSessionTokens,
  setPersistSession,
} from '@/api/client';
import { tokenStorage, appStorage } from '@/utils/storage';
import { normalizeUser } from '@/utils/normalize';
import { getErrorMessage } from '@/utils/errors';
import { canUseAdminView, defaultViewMode } from '@/utils/roles';

// Restores a saved session on app start
export const bootstrapSession = createAsyncThunk('auth/bootstrap', async () => {
  const tokens = await tokenStorage.get();
  if (!tokens?.accessToken) return null;
  setSessionTokens(tokens);
  const cachedUser = await appStorage.getUser();
  const viewMode = await appStorage.getViewMode();
  try {
    // Refresh the profile in the background; a 401 here triggers token refresh
    const me = await authService.me();
    const user = { ...cachedUser, ...normalizeUser(me?.user || me, me?.roles) };
    if (!user.roles?.length && cachedUser?.roles) user.roles = cachedUser.roles;
    if (!user.employeeId && cachedUser?.employeeId)
      user.employeeId = cachedUser.employeeId;
    await appStorage.setUser(user);
    return { user, viewMode };
  } catch (err) {
    if (err.response?.status === 401) {
      await tokenStorage.clear();
      clearSessionTokens();
      return null;
    }
    // Offline: continue with the cached user
    return cachedUser ? { user: cachedUser, viewMode } : null;
  }
});

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password, remember = true }, { rejectWithValue }) => {
    try {
      const data = await authService.login(
        email.trim().toLowerCase(),
        password,
      );
      if (!data?.accessToken)
        return rejectWithValue('Login failed. No session was returned.');
      const tokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };
      setSessionTokens(tokens);
      setPersistSession(remember);
      if (remember) await tokenStorage.save(tokens);
      else await tokenStorage.clear();
      let user = normalizeUser(data.user, data.roles);
      try {
        // The login payload can have empty names; /auth/me has the full profile
        const me = await authService.me();
        const full = normalizeUser(me?.user || me, me?.roles);
        const filled = Object.entries(full).filter(
          ([, v]) => v !== '' && v != null && !(Array.isArray(v) && !v.length),
        );
        user = { ...user, ...Object.fromEntries(filled) };
      } catch {
        // Non-fatal: continue with the login payload
      }
      await appStorage.setUser(user);
      const viewMode = defaultViewMode(user);
      await appStorage.setViewMode(viewMode);
      return { user, viewMode };
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, 'Invalid email or password'));
    }
  },
);

// Clears every local trace of the session; each step is best-effort so a
// storage failure can never leave the user stuck signed in
const clearLocalSession = async () => {
  clearSessionTokens();
  await Promise.allSettled([tokenStorage.clear(), appStorage.clearSession()]);
};

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await authService.logout();
  } catch {
    // Ignore: we clear the local session regardless
  }
  await clearLocalSession();
});

// Used when the refresh token is rejected
export const sessionExpired = createAsyncThunk(
  'auth/sessionExpired',
  clearLocalSession,
);

export const refreshProfile = createAsyncThunk(
  'auth/refreshProfile',
  async (_, { getState }) => {
    const me = await authService.me();
    const current = getState().auth.user || {};
    const user = { ...current, ...normalizeUser(me?.user || me, me?.roles) };
    if (!user.roles?.length) user.roles = current.roles;
    if (!user.employeeId) user.employeeId = current.employeeId;
    await appStorage.setUser(user);
    return user;
  },
);

export const switchViewMode = createAsyncThunk(
  'auth/switchViewMode',
  async mode => {
    await appStorage.setViewMode(mode);
    return mode;
  },
);

const initialState = {
  status: 'idle', // idle | bootstrapping | ready
  isAuthenticated: false,
  user: null,
  viewMode: 'employee', // 'employee' | 'admin'
  loginLoading: false,
  loginError: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearLoginError: state => {
      state.loginError = null;
    },
    updateUser: (state, { payload }) => {
      state.user = { ...state.user, ...payload };
    },
  },
  extraReducers: builder => {
    const signOut = state => ({ ...initialState, status: 'ready' });
    builder
      .addCase(bootstrapSession.pending, state => {
        state.status = 'bootstrapping';
      })
      .addCase(bootstrapSession.fulfilled, (state, { payload }) => {
        state.status = 'ready';
        if (payload?.user) {
          state.isAuthenticated = true;
          state.user = payload.user;
          const allowed =
            payload.viewMode === 'admin'
              ? canUseAdminView(payload.user.roles)
              : true;
          state.viewMode =
            allowed && payload.viewMode
              ? payload.viewMode
              : defaultViewMode(payload.user);
        }
      })
      .addCase(bootstrapSession.rejected, state => {
        state.status = 'ready';
      })
      .addCase(login.pending, state => {
        state.loginLoading = true;
        state.loginError = null;
      })
      .addCase(login.fulfilled, (state, { payload }) => {
        state.loginLoading = false;
        state.isAuthenticated = true;
        state.user = payload.user;
        state.viewMode = payload.viewMode;
      })
      .addCase(login.rejected, (state, { payload, error }) => {
        state.loginLoading = false;
        state.loginError = payload || error.message;
      })
      .addCase(logout.fulfilled, signOut)
      .addCase(logout.rejected, signOut)
      .addCase(sessionExpired.fulfilled, signOut)
      .addCase(refreshProfile.fulfilled, (state, { payload }) => {
        state.user = payload;
      })
      .addCase(switchViewMode.fulfilled, (state, { payload }) => {
        state.viewMode = payload;
      });
  },
});

export const { clearLoginError, updateUser } = authSlice.actions;

export const selectAuth = s => s.auth;
export const selectUser = s => s.auth.user;
export const selectViewMode = s => s.auth.viewMode;

export default authSlice.reducer;
