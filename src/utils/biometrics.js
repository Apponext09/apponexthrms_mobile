import * as Keychain from 'react-native-keychain';

// Device biometrics (fingerprint / face unlock) used to confirm a punch.
// The OS shows its own prompt; the app never sees fingerprint or face data.
// We store a throwaway value behind biometric access control and read it
// back: the read only succeeds after the user passes the system prompt.

const SERVICE = 'com.apponext.hrms.punch-verify';
const SECRET = 'punch-verified';

const LABELS = {
  [Keychain.BIOMETRY_TYPE.FINGERPRINT]: 'Fingerprint',
  [Keychain.BIOMETRY_TYPE.TOUCH_ID]: 'Touch ID',
  [Keychain.BIOMETRY_TYPE.FACE_ID]: 'Face ID',
  [Keychain.BIOMETRY_TYPE.FACE]: 'Face unlock',
  [Keychain.BIOMETRY_TYPE.IRIS]: 'Iris',
};

// Returns { type, label } when the device has biometrics enrolled, else null
export const getBiometry = async () => {
  try {
    const type = await Keychain.getSupportedBiometryType();
    return type ? { type, label: LABELS[type] || 'Biometrics' } : null;
  } catch {
    return null;
  }
};

const ensureKey = () =>
  Keychain.setGenericPassword('punch', SECRET, {
    service: SERVICE,
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
    storage: Keychain.STORAGE_TYPE.RSA,
  });

const isCancel = err => {
  const msg = String(err?.message || err).toLowerCase();
  return msg.includes('cancel') || msg.includes('user');
};

// Shows the system biometric prompt.
// Resolves { ok: true } on success, { ok: false, cancelled } otherwise.
export const verifyBiometric = async ({ title, subtitle } = {}) => {
  const read = () =>
    Keychain.getGenericPassword({
      service: SERVICE,
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
      authenticationPrompt: {
        title: title || 'Confirm it’s you',
        subtitle,
        cancel: 'Cancel',
      },
    });

  try {
    const existing = await Keychain.hasGenericPassword({ service: SERVICE });
    if (!existing) await ensureKey();
    const creds = await read();
    return { ok: !!creds && creds.password === SECRET, cancelled: false };
  } catch (err) {
    if (isCancel(err)) return { ok: false, cancelled: true };
    // The key is invalidated when enrolled fingerprints change; recreate it once
    try {
      await Keychain.resetGenericPassword({ service: SERVICE });
      await ensureKey();
      const creds = await read();
      return { ok: !!creds && creds.password === SECRET, cancelled: false };
    } catch (retryErr) {
      return { ok: false, cancelled: isCancel(retryErr) };
    }
  }
};
