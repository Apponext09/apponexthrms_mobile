import React, { useEffect, useState } from 'react';
import {
  Alert,
  AppState,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import dayjs from 'dayjs';
import {
  Coffee,
  Fingerprint,
  LogIn,
  LogOut,
  MapPin,
  Play,
  ScanFace,
} from '@/components/ui/icons';
import { AppText, Badge, Button, Card, SelectField } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import {
  fetchAttendanceSetup,
  punch,
  selectAttendance,
  selectPunchLocation,
  toggleBreak,
} from '@/store/slices/attendanceSlice';
import { selectSettings } from '@/store/slices/settingsSlice';
import { formatClock, formatTime, titleCase } from '@/utils/format';
import { getBiometry, verifyBiometric } from '@/utils/biometrics';
import {
  checkLocationPermission,
  requestLocationPermission,
} from '@/utils/location';

// Shown after a punch that went through without GPS coordinates
const NO_LOCATION_NOTE = {
  denied: 'Location permission was not given, so no location was saved.',
  blocked: 'Location is blocked for this app, so no location was saved.',
  unavailable: "Your phone's location is off, so no location was saved.",
  timeout: 'Could not get your location in time, so none was saved.',
};

// Live clock + check-in/out + break controls, driven by GET /attendance/status
const PunchCard = () => {
  const { colors, radius } = useTheme();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { status, punching, breakLoading, setup, selectedLocationId } =
    useAppSelector(selectAttendance);
  const s = status.data || {};
  const { locations, requireCheckout } = setup.data;
  const [now, setNow] = useState(dayjs());
  const { biometricPunch } = useAppSelector(selectSettings);
  const [biometry, setBiometry] = useState(null);
  const useBiometric = biometricPunch && !!biometry;
  const isFace = biometry && /face/i.test(biometry.label);
  const BioIcon = isFace ? ScanFace : Fingerprint;

  useEffect(() => {
    const t = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(t);
  }, []);

  // Only offer biometric punching when the device already has it enrolled
  useEffect(() => {
    getBiometry().then(setBiometry);
  }, []);

  // Ask for location up front (the portal asks when the page opens), and
  // re-check when the user comes back from the phone's settings
  const [locPermission, setLocPermission] = useState(null);
  useEffect(() => {
    let alive = true;
    const refresh = async ask => {
      let st = await checkLocationPermission();
      if (st !== 'granted' && ask) st = await requestLocationPermission();
      if (alive)
        setLocPermission(p => (st === 'denied' && p === 'blocked' ? p : st));
    };
    refresh(true);
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') refresh(false);
    });
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  const fixLocation = async () => {
    if (locPermission === 'blocked') {
      Linking.openSettings();
      return;
    }
    setLocPermission(await requestLocationPermission());
  };

  // Punch locations and org rules (check-out required or not)
  useEffect(() => {
    if (!setup.loaded && !setup.loading) dispatch(fetchAttendanceSetup());
  }, [dispatch, setup.loaded, setup.loading]);

  // In check-in-only organisations the day is complete once checked in
  const checkedIn = !!s.isCheckedIn && !s.isCheckedOut && requireCheckout;
  const done = !!s.isCheckedOut || (!!s.isCheckedIn && !requireCheckout);
  const noShift = s.hasShift === false && !s.isHoliday && !s.isWeekOff;
  const blocked =
    !!s.isAttendanceBlocked ||
    ((s.isHoliday || s.isWeekOff) && !s.isPunchAllowedOnHoliday);
  const workedSeconds =
    checkedIn && s.checkInTime
      ? now.diff(dayjs(s.checkInTime), 'second')
      : (Number(s.duration) || 0) * 60;

  const doPunch = type => {
    const run = async () => {
      if (useBiometric) {
        const check = await verifyBiometric({
          title: type === 'in' ? 'Confirm check in' : 'Confirm check out',
          subtitle: `Use your ${biometry.label.toLowerCase()} to continue`,
        });
        if (!check.ok) {
          toast.show(
            check.cancelled
              ? 'Verification cancelled. Nothing was recorded.'
              : `${biometry.label} not recognised. Try again.`,
            'error',
          );
          return;
        }
      }
      const res = await dispatch(punch({ type }));
      if (punch.fulfilled.match(res)) {
        const message =
          type === 'in'
            ? requireCheckout
              ? 'Checked in successfully.'
              : 'Checked in. Check-out is not required.'
            : 'Checked out. See you tomorrow!';
        const note = NO_LOCATION_NOTE[res.payload?.locationStatus];
        toast.show(
          note ? `${message} ${note}` : message,
          note ? 'info' : 'success',
        );
        if (
          res.payload?.locationStatus === 'denied' ||
          res.payload?.locationStatus === 'blocked'
        )
          setLocPermission(res.payload.locationStatus);
      } else toast.show(res.payload || 'Punch failed', 'error');
    };
    if (type === 'out') {
      Alert.alert(
        'Check out?',
        'Your working hours for today will be recorded.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Check out', style: 'destructive', onPress: run },
        ],
      );
    } else run();
  };

  const doBreak = async () => {
    const res = await dispatch(toggleBreak({ start: !s.isOnBreak }));
    if (toggleBreak.fulfilled.match(res))
      toast.show(s.isOnBreak ? 'Break ended' : 'Break started', 'info');
    else toast.show(res.payload || 'Could not update break', 'error');
  };

  const shift = s.shift || s.shiftInfo || null;
  const statusLabel = done
    ? 'Day complete'
    : checkedIn
    ? s.isOnBreak
      ? 'On break'
      : 'Working'
    : 'Not checked in';
  const statusTone = done
    ? 'info'
    : checkedIn
    ? s.isOnBreak
      ? 'warning'
      : 'success'
    : 'neutral';

  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <View>
          <AppText variant="caption" color="mutedForeground">
            {now.format('dddd, DD MMM YYYY')}
          </AppText>
          <AppText variant="display" style={styles.clock}>
            {now.format('hh:mm')}
            <AppText variant="h3" color="mutedForeground">
              {' '}
              {now.format('A')}
            </AppText>
          </AppText>
        </View>
        <Badge label={statusLabel} tone={statusTone} />
      </View>

      {s.isHoliday || s.isWeekOff ? (
        <View
          style={[
            styles.notice,
            { backgroundColor: colors.infoSoft, borderRadius: radius.md },
          ]}
        >
          <AppText variant="captionMedium" color="info">
            {s.isHoliday
              ? `Holiday: ${s.holidayName || 'Public holiday'}`
              : 'Today is your week off'}
          </AppText>
        </View>
      ) : null}

      {noShift ? (
        <View
          style={[
            styles.notice,
            { backgroundColor: colors.warningSoft, borderRadius: radius.md },
          ]}
        >
          <AppText variant="captionMedium" color="warning">
            No work shift is assigned for today. Contact HR to assign one.
          </AppText>
        </View>
      ) : null}

      <View
        style={[
          styles.stats,
          { backgroundColor: colors.muted, borderRadius: radius.lg },
        ]}
      >
        <View style={styles.stat}>
          <AppText variant="small" color="mutedForeground">
            CHECK IN
          </AppText>
          <AppText variant="bodyMedium">{formatTime(s.checkInTime)}</AppText>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <AppText variant="small" color="mutedForeground">
            CHECK OUT
          </AppText>
          <AppText variant="bodyMedium">
            {requireCheckout ? formatTime(s.checkOutTime) : 'Not needed'}
          </AppText>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <AppText variant="small" color="mutedForeground">
            WORKED
          </AppText>
          <AppText variant="bodyMedium">{formatClock(workedSeconds)}</AppText>
        </View>
      </View>

      {shift?.shiftName || shift?.startTime ? (
        <AppText variant="caption" color="mutedForeground" style={styles.shift}>
          {shift.shiftName ? `${shift.shiftName} · ` : ''}
          {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
          {shift.currentEntryStatus && !checkedIn && !done
            ? ` · ${titleCase(shift.currentEntryStatus)}`
            : ''}
        </AppText>
      ) : null}

      {!done && locations.length > 1 ? (
        <SelectField
          label="Punch location"
          options={locations.map(l => ({
            value: l.id,
            label: l.name,
            description: l.isPrimary ? 'Primary location' : undefined,
          }))}
          value={selectedLocationId}
          onChange={id => dispatch(selectPunchLocation(id))}
          style={styles.location}
        />
      ) : null}

      {done ? null : checkedIn ? (
        <View style={styles.actions}>
          <Button
            title={s.isOnBreak ? 'End break' : 'Take break'}
            icon={s.isOnBreak ? Play : Coffee}
            variant="secondary"
            onPress={doBreak}
            loading={breakLoading}
            disabled={!s.isOnBreak && s.isBreakQuotaExhausted}
            style={styles.flex}
          />
          <Button
            title="Check out"
            icon={useBiometric ? BioIcon : LogOut}
            variant="danger"
            onPress={() => doPunch('out')}
            loading={punching}
            disabled={s.isOnBreak}
            style={styles.flex}
          />
        </View>
      ) : (
        <Button
          title={
            blocked
              ? 'Attendance not allowed today'
              : useBiometric
              ? `Check in with ${biometry.label}`
              : 'Check in'
          }
          icon={useBiometric && !blocked ? BioIcon : LogIn}
          size="lg"
          onPress={() => doPunch('in')}
          loading={punching}
          disabled={blocked}
          style={styles.checkIn}
        />
      )}

      {locPermission && locPermission !== 'granted' ? (
        <Pressable onPress={fixLocation} style={styles.locRow} hitSlop={8}>
          <MapPin size={13} color={colors.warning} />
          <AppText variant="small" color="warning">
            {locPermission === 'blocked'
              ? 'Location is blocked · Open settings'
              : 'Location permission needed · Allow'}
          </AppText>
        </Pressable>
      ) : (
        <View style={styles.locRow}>
          <MapPin size={13} color={colors.mutedForeground} />
          <AppText variant="small" color="mutedForeground">
            {useBiometric
              ? `${biometry.label} and location are verified with each punch`
              : 'Location is captured with each punch'}
          </AppText>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { padding: 18 },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clock: { marginTop: 2 },
  notice: { padding: 10, marginTop: 12 },
  stats: { flexDirection: 'row', marginTop: 16, paddingVertical: 12 },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  divider: { width: 1, marginVertical: 4 },
  shift: { marginTop: 10, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  flex: { flex: 1 },
  checkIn: { marginTop: 16 },
  location: { marginTop: 16, marginBottom: 0 },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
  },
});

export default PunchCard;
