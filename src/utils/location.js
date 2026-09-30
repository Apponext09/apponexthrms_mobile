import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

const { ACCESS_FINE_LOCATION: FINE, ACCESS_COARSE_LOCATION: COARSE } =
  PermissionsAndroid.PERMISSIONS;
const { GRANTED, NEVER_ASK_AGAIN } = PermissionsAndroid.RESULTS;

// Permission states: 'granted' | 'denied' | 'blocked' (user chose "don't ask
// again", so only the phone's app settings can turn it back on)

export const checkLocationPermission = async () => {
  if (Platform.OS !== 'android') return 'granted';
  const [fine, coarse] = await Promise.all([
    PermissionsAndroid.check(FINE),
    PermissionsAndroid.check(COARSE),
  ]);
  return fine || coarse ? 'granted' : 'denied';
};

// Android 12+ ignores a request for precise location unless approximate
// location is requested in the same call, so always ask for both. The user
// may grant only approximate location, which is still enough for a punch.
export const requestLocationPermission = async () => {
  if (Platform.OS !== 'android') return 'granted';
  const result = await PermissionsAndroid.requestMultiple([FINE, COARSE]);
  if (result[FINE] === GRANTED || result[COARSE] === GRANTED) return 'granted';
  if (result[FINE] === NEVER_ASK_AGAIN || result[COARSE] === NEVER_ASK_AGAIN)
    return 'blocked';
  return 'denied';
};

const readPosition = highAccuracy =>
  new Promise(resolve => {
    Geolocation.getCurrentPosition(
      pos =>
        resolve({
          coords: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          },
        }),
      // code 2 = position unavailable (usually the phone's GPS is off),
      // code 3 = timeout
      err => resolve({ error: err?.code === 2 ? 'unavailable' : 'timeout' }),
      { enableHighAccuracy: highAccuracy, timeout: 15000, maximumAge: 10000 },
    );
  });

// Asks for permission when needed, then reads the current position.
// Resolves { coords, status } where status is
// 'ok' | 'denied' | 'blocked' | 'unavailable' | 'timeout'.
export const getPunchLocation = async () => {
  let permission = await checkLocationPermission();
  if (permission !== 'granted') permission = await requestLocationPermission();
  if (permission !== 'granted') return { coords: null, status: permission };

  let fix = await readPosition(true);
  // Indoors GPS can time out; fall back to network / approximate location
  if (fix.error === 'timeout') fix = await readPosition(false);
  if (fix.coords) return { coords: fix.coords, status: 'ok' };
  return { coords: null, status: fix.error };
};

// Coordinates only, or null when unavailable
export const getCurrentPosition = async () => (await getPunchLocation()).coords;
