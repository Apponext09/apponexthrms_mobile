import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

const TOKEN_SERVICE = 'com.apponext.hrms.tokens';
const KEYS = {
  user: '@hrms/user',
  settings: '@hrms/settings',
};

// Tokens live in the Android Keystore / iOS Keychain, never in plain AsyncStorage
export const tokenStorage = {
  async save({ accessToken, refreshToken }) {
    await Keychain.setGenericPassword(
      'session',
      JSON.stringify({ accessToken, refreshToken }),
      {
        service: TOKEN_SERVICE,
      },
    );
  },
  async get() {
    try {
      const creds = await Keychain.getGenericPassword({
        service: TOKEN_SERVICE,
      });
      return creds ? JSON.parse(creds.password) : null;
    } catch {
      return null;
    }
  },
  async clear() {
    await Keychain.resetGenericPassword({ service: TOKEN_SERVICE });
  },
};

const getJSON = async key => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const setJSON = (key, value) =>
  AsyncStorage.setItem(key, JSON.stringify(value));

export const appStorage = {
  getUser: () => getJSON(KEYS.user),
  setUser: user => setJSON(KEYS.user, user),
  getSettings: () => getJSON(KEYS.settings),
  setSettings: settings => setJSON(KEYS.settings, settings),
  async clearSession() {
    await AsyncStorage.removeItem(KEYS.user);
  },
};
