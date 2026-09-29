import { createSlice } from '@reduxjs/toolkit';
import { appStorage } from '@/utils/storage';

const initialState = {
  theme: 'system', // 'system' | 'light' | 'dark'
  notificationsEnabled: true,
  attendanceReminders: true,
  approvalAlerts: true,
  // Ask for fingerprint / face before check-in and check-out (when the device has it)
  biometricPunch: true,
  hydrated: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    hydrateSettings: (state, { payload }) => ({
      ...state,
      ...(payload || {}),
      hydrated: true,
    }),
    setTheme: (state, { payload }) => {
      state.theme = payload;
    },
    toggleSetting: (state, { payload }) => {
      state[payload] = !state[payload];
    },
  },
});

export const { hydrateSettings, setTheme, toggleSetting } =
  settingsSlice.actions;

// Persist settings after any settings action
export const persistSettings = () => (_, getState) => {
  const { hydrated, ...rest } = getState().settings;
  appStorage.setSettings(rest);
};

export const loadSettings = () => async dispatch => {
  const saved = await appStorage.getSettings();
  dispatch(hydrateSettings(saved));
};

export const selectSettings = s => s.settings;
export const selectThemePreference = s => s.settings.theme;

export default settingsSlice.reducer;
