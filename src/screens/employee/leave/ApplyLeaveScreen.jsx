import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  AppText,
  Button,
  Card,
  DateField,
  Input,
  Screen,
  SelectField,
  StackHeader,
  useToast,
} from '@/components/ui';
import { FileText, Phone, X } from '@/components/ui/icons';
import { leaveService } from '@/api/services/leaveService';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import {
  applyLeave,
  fetchLeaveBalances,
  fetchLeaveSetup,
  fetchLeaveTypes,
  fetchTeam,
  selectLeave,
} from '@/store/slices/leaveSlice';
import {
  fetchAttendanceSetup,
  selectAttendance,
} from '@/store/slices/attendanceSlice';
import { checkDay } from '@/utils/workingDays';
import { toApiDate } from '@/utils/format';

// Same day types as the portal's "Customize Days (Half/Quarter)"
const DAY_TYPES = [
  { key: 'FULL', label: 'Full', value: 1 },
  { key: 'FIRST_HALF', label: '1st half', value: 0.5 },
  { key: 'SECOND_HALF', label: '2nd half', value: 0.5 },
  { key: 'QUARTER', label: 'Quarter', value: 0.25 },
];
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const EMERGENCY_AFTER_DAYS = 5;

const buildBreakdown = (start, end, holidays, rules) => {
  const list = [];
  let d = dayjs(start);
  const last = dayjs(end);
  while (!d.isAfter(last, 'day')) {
    const check = checkDay(d, holidays, rules);
    list.push({
      date: d.format('YYYY-MM-DD'),
      isWorkingDay: check.isWorking,
      reason: check.reason,
      dayType: check.isHalfDay ? 'FIRST_HALF' : 'FULL',
      quarterType: 'Q1',
    });
    d = d.add(1, 'day');
  }
  return list;
};

const dayValue = day =>
  day.isWorkingDay ? DAY_TYPES.find(t => t.key === day.dayType)?.value ?? 1 : 0;

const Chip = ({ label, active, onPress }) => {
  const { colors, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderRadius: radius.pill,
          borderColor: active ? colors.primary : colors.border,
          backgroundColor: active ? colors.primarySoft : colors.card,
        },
      ]}
    >
      <AppText variant="small" color={active ? 'primary' : 'textSecondary'}>
        {label}
      </AppText>
    </Pressable>
  );
};

const ApplyLeaveScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { colors } = useTheme();
  const { types, balances, setup, team, submitting } =
    useAppSelector(selectLeave);
  const sickDocThreshold =
    useAppSelector(selectAttendance).setup.data.sickLeaveDocThreshold;

  const [leaveTypeId, setLeaveTypeId] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [breakdown, setBreakdown] = useState([]);
  const [customize, setCustomize] = useState(false);
  const [reason, setReason] = useState('');
  const [backupPerson, setBackupPerson] = useState(null);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [certificate, setCertificate] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(fetchLeaveTypes());
    dispatch(fetchLeaveSetup());
    dispatch(fetchAttendanceSetup());
    if (!balances.loaded) dispatch(fetchLeaveBalances());
  }, [dispatch, balances.loaded]);

  useEffect(() => {
    if (setup.data.enableBackupPerson && !team.loaded && !team.loading)
      dispatch(fetchTeam());
  }, [dispatch, setup.data.enableBackupPerson, team.loaded, team.loading]);

  // Rebuild the day-by-day list whenever the range or calendar changes
  useEffect(() => {
    if (dayjs(endDate).isBefore(dayjs(startDate), 'day')) {
      setBreakdown([]);
      return;
    }
    setBreakdown(
      buildBreakdown(
        startDate,
        endDate,
        setup.data.holidays,
        setup.data.weeklyOffRules,
      ),
    );
  }, [startDate, endDate, setup.data.holidays, setup.data.weeklyOffRules]);

  const totalDays = useMemo(
    () =>
      Math.round(breakdown.reduce((n, d) => n + dayValue(d), 0) * 100) / 100,
    [breakdown],
  );
  const offDays = breakdown.filter(d => !d.isWorkingDay);

  const selectedType = (types.data || []).find(t => t.id === leaveTypeId);
  const typeCode = (selectedType?.code || '').toUpperCase();
  const needsCertificate = typeCode === 'SL' && totalDays >= sickDocThreshold;
  const needsEmergency = totalDays > EMERGENCY_AFTER_DAYS;
  const balance = (balances.data || []).find(
    b => b.leaveTypeId === leaveTypeId,
  );

  const typeOptions = useMemo(
    () =>
      (types.data || []).map(t => {
        const bal = (balances.data || []).find(b => b.leaveTypeId === t.id);
        return {
          value: t.id,
          label: t.name,
          description: bal ? `${bal.available} days available` : t.code,
        };
      }),
    [types.data, balances.data],
  );

  const teamOptions = useMemo(
    () =>
      (team.data || []).map(e => ({
        value: e.id,
        label: `${e.firstName} ${e.lastName}`.trim() || e.email,
        description: e.designation || e.department || undefined,
      })),
    [team.data],
  );

  const updateDay = (date, patch) =>
    setBreakdown(list =>
      list.map(d => (d.date === date ? { ...d, ...patch } : d)),
    );

  const pickCertificate = () =>
    launchImageLibrary(
      { mediaType: 'photo', includeBase64: true, quality: 0.7, maxWidth: 1600 },
      async res => {
        const a = res.assets?.[0];
        if (res.didCancel || !a) return;
        if (a.fileSize && a.fileSize > 5 * 1024 * 1024) {
          toast.show('Certificate must be 5MB or smaller', 'error');
          return;
        }
        const fileName = a.fileName || 'medical-certificate.jpg';
        setCertificate({ fileName, analyzing: true, analysis: null });
        setErrors(e => ({ ...e, certificate: null }));
        try {
          // Same AI check the portal runs on upload
          const analysis = await leaveService.analyzeCertificate(
            a.base64,
            a.type || 'image/jpeg',
          );
          setCertificate({ fileName, analyzing: false, analysis });
        } catch {
          setCertificate({ fileName, analyzing: false, analysis: null });
        }
      },
    );

  const doSubmit = async () => {
    // Same payload as the portal's leave form
    const payload = {
      leaveTypeId,
      startDate: toApiDate(startDate),
      endDate: toApiDate(endDate),
      isHalfDay: breakdown.some(d => d.isWorkingDay && d.dayType !== 'FULL'),
      customDuration: totalDays,
      reason: reason.trim(),
      backupPerson: backupPerson || undefined,
      emergencyContact: needsEmergency ? emergencyContact.trim() : undefined,
      attachedFileName: certificate?.fileName || undefined,
      dayWiseBreakdown: breakdown
        .filter(d => d.isWorkingDay)
        .map(d => ({
          date: d.date,
          dayType:
            d.dayType === 'QUARTER' ? `${d.quarterType}_QUARTER` : d.dayType,
        })),
    };
    const res = await dispatch(applyLeave(payload));
    if (applyLeave.fulfilled.match(res)) {
      toast.show('Leave request submitted');
      navigation.goBack();
    } else {
      toast.show(res.payload || 'Could not submit leave', 'error');
    }
  };

  const submit = () => {
    const next = {};
    const r = reason.trim();
    if (!leaveTypeId) next.type = 'Choose a leave type';
    if (dayjs(endDate).isBefore(dayjs(startDate), 'day'))
      next.end = 'End date cannot be before start date';
    else if (totalDays <= 0)
      next.end = 'The selected dates contain no working days';
    if (r.length < 10) next.reason = 'Reason must be at least 10 characters';
    else if (r.length > 300)
      next.reason = 'Reason cannot exceed 300 characters';
    if (needsEmergency && !emergencyContact.trim())
      next.emergency = `Required for leave longer than ${EMERGENCY_AFTER_DAYS} days`;
    if (needsCertificate && !certificate)
      next.certificate = `A medical certificate is required for sick leave of ${sickDocThreshold} or more days`;
    setErrors(next);
    if (Object.keys(next).length) return;

    // Like the portal: confirm before going into a negative balance (not for LOP / SL)
    const available = balance ? balance.available : 0;
    const after = Math.round((available - totalDays) * 100) / 100;
    if (after < 0 && typeCode !== 'LOP' && typeCode !== 'SL') {
      Alert.alert(
        'Not enough balance',
        `You have ${available} days and are requesting ${totalDays}. Your balance will become ${after} days. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit anyway', onPress: doSubmit },
        ],
      );
      return;
    }
    doSubmit();
  };

  const certStatus = !certificate
    ? null
    : certificate.analyzing
    ? ['Checking certificate…', 'mutedForeground']
    : certificate.analysis?.isValid
    ? [
        `Verified${
          certificate.analysis.patientName
            ? ` for ${certificate.analysis.patientName}`
            : ''
        }`,
        'success',
      ]
    : ['Could not verify the details. HR will review it.', 'warning'];

  return (
    <Screen stack header={<StackHeader title="Apply for leave" />}>
      <SelectField
        label="Leave type"
        placeholder={
          types.loading ? 'Loading leave types…' : 'Choose a leave type'
        }
        options={typeOptions}
        value={leaveTypeId}
        onChange={v => {
          setLeaveTypeId(v);
          setErrors(e => ({ ...e, type: null }));
        }}
        error={errors.type}
      />

      <View style={styles.row}>
        <DateField
          label="From"
          value={startDate}
          onChange={d => {
            setStartDate(d);
            if (dayjs(endDate).isBefore(d, 'day')) setEndDate(d);
          }}
        />
        <DateField
          label="To"
          value={endDate}
          minimumDate={startDate}
          onChange={setEndDate}
          error={errors.end}
        />
      </View>

      <Card
        elevated={false}
        style={[
          styles.summary,
          {
            backgroundColor: colors.primarySoft,
            borderColor: colors.primarySoft,
          },
        ]}
      >
        <View style={styles.flex}>
          <AppText variant="bodyMedium" color="primary">
            {totalDays} {totalDays === 1 ? 'day' : 'days'} requested
          </AppText>
          {offDays.length ? (
            <AppText variant="caption" color="primary">
              {offDays.length} weekend / holiday{' '}
              {offDays.length === 1 ? 'day' : 'days'} not counted
            </AppText>
          ) : null}
        </View>
        {balance ? (
          <AppText variant="caption" color="primary">
            {balance.available} available
          </AppText>
        ) : null}
      </Card>

      {breakdown.length ? (
        <Pressable
          onPress={() => setCustomize(c => !c)}
          style={styles.customizeLink}
          hitSlop={6}
        >
          <AppText variant="captionMedium" color="primary">
            {customize
              ? 'Hide day-by-day details'
              : 'Customize days (half / quarter)'}
          </AppText>
        </Pressable>
      ) : null}

      {customize ? (
        <Card style={styles.breakdown}>
          {breakdown.map((d, i) => (
            <View
              key={d.date}
              style={[
                styles.dayRow,
                i < breakdown.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <AppText variant="bodyMedium">
                {dayjs(d.date).format('ddd, DD MMM')}
              </AppText>
              {d.isWorkingDay ? (
                <>
                  <View style={styles.chips}>
                    {DAY_TYPES.map(t => (
                      <Chip
                        key={t.key}
                        label={t.label}
                        active={d.dayType === t.key}
                        onPress={() => updateDay(d.date, { dayType: t.key })}
                      />
                    ))}
                  </View>
                  {d.dayType === 'QUARTER' ? (
                    <View style={styles.chips}>
                      {QUARTERS.map(q => (
                        <Chip
                          key={q}
                          label={q}
                          active={d.quarterType === q}
                          onPress={() => updateDay(d.date, { quarterType: q })}
                        />
                      ))}
                    </View>
                  ) : null}
                </>
              ) : (
                <AppText variant="caption" color="mutedForeground">
                  {d.reason} · not counted
                </AppText>
              )}
            </View>
          ))}
        </Card>
      ) : null}

      <Input
        label="Reason"
        required
        placeholder="e.g. Family function, medical appointment…"
        value={reason}
        onChangeText={t => {
          setReason(t);
          setErrors(e => ({ ...e, reason: null }));
        }}
        multiline
        maxLength={300}
        error={errors.reason}
        hint={`${reason.trim().length}/300 · at least 10 characters`}
      />

      {setup.data.enableBackupPerson ? (
        <SelectField
          label="Backup person (optional)"
          placeholder={
            team.loading ? 'Loading colleagues…' : 'Who covers for you?'
          }
          options={teamOptions}
          value={backupPerson}
          onChange={setBackupPerson}
        />
      ) : null}

      {needsEmergency ? (
        <Input
          label="Emergency contact"
          required
          icon={Phone}
          keyboardType="phone-pad"
          placeholder="Phone number while you're away"
          value={emergencyContact}
          onChangeText={t => {
            setEmergencyContact(t);
            setErrors(e => ({ ...e, emergency: null }));
          }}
          error={errors.emergency}
        />
      ) : null}

      {needsCertificate || certificate ? (
        <View style={styles.certificate}>
          <AppText
            variant="captionMedium"
            color="textSecondary"
            style={styles.certLabel}
          >
            Medical certificate{needsCertificate ? ' *' : ''}
          </AppText>
          {certificate ? (
            <Card style={styles.certCard}>
              <FileText size={20} color={colors.primary} />
              <View style={styles.flex}>
                <AppText variant="captionMedium" numberOfLines={1}>
                  {certificate.fileName}
                </AppText>
                <AppText variant="small" color={certStatus[1]}>
                  {certStatus[0]}
                </AppText>
              </View>
              <Pressable hitSlop={10} onPress={() => setCertificate(null)}>
                <X size={18} color={colors.danger} />
              </Pressable>
            </Card>
          ) : (
            <Button
              title="Attach certificate photo"
              icon={FileText}
              variant="secondary"
              onPress={pickCertificate}
            />
          )}
          {errors.certificate ? (
            <AppText variant="caption" color="danger" style={styles.certErr}>
              {errors.certificate}
            </AppText>
          ) : null}
        </View>
      ) : null}

      <Button
        title="Submit request"
        size="lg"
        onPress={submit}
        loading={submitting}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: 12 },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customizeLink: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    marginBottom: 8,
  },
  breakdown: { paddingVertical: 4, marginBottom: 16 },
  dayRow: { paddingVertical: 10, gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  certificate: { marginBottom: 16 },
  certLabel: { marginBottom: 6 },
  certCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  certErr: { marginTop: 6 },
});

export default ApplyLeaveScreen;
