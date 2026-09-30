import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import {
  Bell,
  Camera,
  HelpCircle,
  ImagePlus,
  Info,
  KeyRound,
  Lock,
  LogOut,
  Settings,
  Trash2,
} from '@/components/ui/icons';
import {
  AppText,
  Avatar,
  BottomSheet,
  Button,
  Card,
  Input,
  ListRow,
  Screen,
  SectionHeader,
  useToast,
} from '@/components/ui';
import AppHeader from '@/components/common/AppHeader';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { logout, selectAuth } from '@/store/slices/authSlice';
import {
  fetchEmployeeProfile,
  fetchProfileSections,
  requestProfileEdit,
  saveProfilePhoto,
  selectProfile,
} from '@/store/slices/profileSlice';
import { pick } from '@/utils/normalize';
import { formatDate, formatRelative, titleCase } from '@/utils/format';

// Label / value pairs, like the portal's read-only profile sections
const Fields = ({ rows }) => (
  <View style={styles.fields}>
    {rows.map(([label, value]) => (
      <View key={label} style={styles.field}>
        <AppText variant="small" color="mutedForeground">
          {label.toUpperCase()}
        </AppText>
        <AppText variant="bodyMedium">{value || '—'}</AppText>
      </View>
    ))}
  </View>
);

const SectionCard = ({ title, onEdit, children }) => (
  <>
    <SectionHeader
      title={title}
      actionLabel={onEdit ? 'Edit' : undefined}
      onAction={onEdit}
    />
    <Card>{children}</Card>
  </>
);

const PHOTO_OPTIONS = {
  mediaType: 'photo',
  includeBase64: true,
  quality: 0.8,
  maxWidth: 1024,
  maxHeight: 1024,
};

const ProfileScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { colors, radius } = useTheme();
  const { user, viewMode } = useAppSelector(selectAuth);
  const { employee, sections, saving } = useAppSelector(selectProfile);
  const emp = employee.data || {};
  const { editUnlocked, pendingRequest, personal, professional } =
    sections.data;
  const hasEmployee = Boolean(user?.employeeId);
  // Admins manage profiles on the portal; employees need an approved request
  const canEdit = hasEmployee && viewMode === 'employee' && editUnlocked;
  const [requestOpen, setRequestOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [reason, setReason] = useState('');

  const load = useCallback(() => {
    if (!hasEmployee) return;
    dispatch(fetchEmployeeProfile());
    dispatch(fetchProfileSections());
  }, [dispatch, hasEmployee]);
  useEffect(() => {
    load();
  }, [load]);

  const submitRequest = async () => {
    if (reason.trim().length < 5) {
      toast.show('Please give a short reason', 'error');
      return;
    }
    const res = await dispatch(requestProfileEdit(reason.trim()));
    if (requestProfileEdit.fulfilled.match(res)) {
      setRequestOpen(false);
      setReason('');
      toast.show('Edit request sent to HR');
    } else toast.show(res.payload || 'Could not send request', 'error');
  };

  const onPhoto = res => {
    setPhotoOpen(false);
    const a = res?.assets?.[0];
    if (res?.didCancel || !a?.base64) return;
    const dataUrl = `data:${a.type || 'image/jpeg'};base64,${a.base64}`;
    Alert.alert(
      'Use this photo?',
      'It becomes your profile photo and is also registered for face-recognition attendance.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async () => {
            const out = await dispatch(saveProfilePhoto(dataUrl));
            if (saveProfilePhoto.fulfilled.match(out))
              toast.show(
                out.payload.enrolled
                  ? 'Photo saved and face registered'
                  : 'Photo saved. Face registration will be retried later.',
              );
            else toast.show(out.payload || 'Could not save photo', 'error');
          },
        },
      ],
    );
  };

  const removePhoto = () =>
    Alert.alert('Remove profile photo?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setPhotoOpen(false);
          const out = await dispatch(saveProfilePhoto(null));
          if (saveProfilePhoto.fulfilled.match(out))
            toast.show('Photo removed');
          else toast.show(out.payload || 'Could not remove photo', 'error');
        },
      },
    ]);

  const confirmLogout = () =>
    Alert.alert('Sign out?', 'You will need to sign in again to use the app.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => dispatch(logout()),
      },
    ]);

  const p = (...keys) => pick(personal, ...keys);
  const q = (...keys) => pick(professional, ...keys);

  return (
    <Screen
      refreshing={employee.loading && employee.loaded}
      onRefresh={load}
      hero={<AppHeader />}
    >
      {hasEmployee ? (
        <>
          <Card style={styles.photoCard}>
            <Avatar
              uri={emp.avatarUrl || user?.avatarUrl}
              firstName={emp.firstName || user?.firstName}
              lastName={emp.lastName || user?.lastName}
              size={64}
            />
            <View style={styles.flex}>
              <AppText variant="h3">
                {`${emp.firstName || ''} ${emp.lastName || ''}`.trim() ||
                  user?.email}
              </AppText>
              <AppText variant="caption" color="mutedForeground">
                {[emp.designation, emp.employeeCode]
                  .filter(Boolean)
                  .join(' · ')}
              </AppText>
            </View>
            {canEdit ? (
              <Pressable
                onPress={() => setPhotoOpen(true)}
                hitSlop={8}
                style={[
                  styles.photoBtn,
                  {
                    backgroundColor: colors.primarySoft,
                    borderRadius: radius.md,
                  },
                ]}
              >
                <Camera size={18} color={colors.primary} />
              </Pressable>
            ) : null}
          </Card>

          {viewMode === 'employee' ? (
            <Card
              elevated={false}
              style={[
                styles.lockCard,
                {
                  backgroundColor: editUnlocked
                    ? colors.successSoft
                    : colors.muted,
                  borderColor: editUnlocked ? colors.successSoft : colors.muted,
                },
              ]}
            >
              <View style={styles.lockRow}>
                <Lock
                  size={18}
                  color={editUnlocked ? colors.success : colors.textSecondary}
                  filled={!editUnlocked}
                />
                <View style={styles.flex}>
                  <AppText
                    variant="bodyMedium"
                    color={editUnlocked ? 'success' : 'foreground'}
                  >
                    {editUnlocked
                      ? 'Profile unlocked for editing'
                      : 'Profile locked'}
                  </AppText>
                  <AppText variant="caption" color="textSecondary">
                    {editUnlocked
                      ? 'HR approved your request. Tap Edit on a section to update it.'
                      : pendingRequest
                      ? `Edit request sent ${formatRelative(
                          pendingRequest.submittedAt,
                        )}. Waiting for HR.`
                      : 'Ask HR to unlock your profile to change your details or photo.'}
                  </AppText>
                </View>
              </View>
              {!editUnlocked && !pendingRequest ? (
                <Button
                  title="Request edit"
                  size="sm"
                  variant="secondary"
                  fullWidth={false}
                  onPress={() => setRequestOpen(true)}
                  style={styles.lockBtn}
                />
              ) : null}
            </Card>
          ) : null}

          <SectionCard
            title="Basic information"
            onEdit={
              canEdit
                ? () => navigation.navigate('EditProfile', { section: 'basic' })
                : undefined
            }
          >
            <Fields
              rows={[
                ['Email', emp.email],
                ['Mobile', emp.mobile || emp.phone],
                ['Department', emp.department],
                ['Reporting manager', emp.manager],
                [
                  'Date of joining',
                  emp.dateOfJoining ? formatDate(emp.dateOfJoining) : null,
                ],
                [
                  'Employment type',
                  emp.employmentType ? titleCase(emp.employmentType) : null,
                ],
                [
                  'Date of birth',
                  emp.dateOfBirth ? formatDate(emp.dateOfBirth) : null,
                ],
                ['Gender', emp.gender ? titleCase(emp.gender) : null],
                ['Nationality', emp.nationality],
                ['Blood group', emp.bloodGroup],
              ]}
            />
          </SectionCard>

          <SectionCard
            title="Personal information"
            onEdit={
              canEdit
                ? () =>
                    navigation.navigate('EditProfile', { section: 'personal' })
                : undefined
            }
          >
            <Fields
              rows={[
                [
                  'Marital status',
                  titleCase(
                    p('maritalStatus', 'marital_status') ||
                      emp.maritalStatus ||
                      '',
                  ),
                ],
                ["Father's name", p('fatherName', 'father_name')],
                ["Mother's name", p('motherName', 'mother_name')],
                ["Spouse's name", p('spouseName', 'spouse_name')],
                ['Children', p('childrenCount', 'children_count')],
                ['Current address', p('currentAddress', 'current_address')],
                [
                  'Permanent address',
                  p('permanentAddress', 'permanent_address'),
                ],
                [
                  'City / state',
                  [p('city'), p('state')].filter(Boolean).join(', '),
                ],
                [
                  'Country / postal code',
                  [p('country'), p('postalCode', 'postal_code')]
                    .filter(Boolean)
                    .join(' · '),
                ],
              ]}
            />
          </SectionCard>

          <SectionCard
            title="Professional information"
            onEdit={
              canEdit
                ? () =>
                    navigation.navigate('EditProfile', {
                      section: 'professional',
                    })
                : undefined
            }
          >
            <Fields
              rows={[
                ['Qualification', q('qualification')],
                ['Specialization', q('specialization')],
                ['University / institute', q('university')],
                ['Graduation year', q('graduationYear', 'graduation_year')],
                [
                  'Years of experience',
                  q('yearsOfExperience', 'years_of_experience'),
                ],
                ['LinkedIn', q('linkedinUrl', 'linkedin_url')],
                ['GitHub', q('githubUrl', 'github_url')],
              ]}
            />
          </SectionCard>
        </>
      ) : (
        <Card>
          <Fields
            rows={[
              ['Email', user?.email],
              ['Phone', user?.phone],
              ['Organization', user?.orgName],
            ]}
          />
        </Card>
      )}

      <SectionHeader title="Account" />
      <Card style={styles.menu}>
        <ListRow
          icon={KeyRound}
          title="Change password"
          onPress={() => navigation.navigate('ChangePassword')}
        />
        <ListRow
          icon={Bell}
          title="Notifications"
          onPress={() => navigation.navigate('Notifications')}
          last
        />
      </Card>

      <SectionHeader title="App" />
      <Card style={styles.menu}>
        <ListRow
          icon={Settings}
          title="Settings"
          subtitle="Theme, attendance and notifications"
          onPress={() => navigation.navigate('Settings')}
        />
        <ListRow
          icon={HelpCircle}
          title="Help & support"
          onPress={() => navigation.navigate('Help')}
        />
        <ListRow
          icon={Info}
          title="About"
          onPress={() => navigation.navigate('About')}
          last
        />
      </Card>

      <Card style={[styles.menu, styles.logout]}>
        <ListRow
          icon={LogOut}
          title="Sign out"
          danger
          onPress={confirmLogout}
          last
        />
      </Card>

      <BottomSheet
        visible={requestOpen}
        onClose={() => setRequestOpen(false)}
        title="Request profile edit"
      >
        <AppText
          variant="caption"
          color="mutedForeground"
          style={styles.sheetText}
        >
          Once HR approves, your whole profile (basic, personal, professional
          and photo) unlocks for editing.
        </AppText>
        <Input
          label="Reason"
          required
          multiline
          placeholder="e.g. Updated phone number, address change, typo correction"
          value={reason}
          onChangeText={setReason}
        />
        <Button title="Send to HR" onPress={submitRequest} loading={saving} />
      </BottomSheet>

      <BottomSheet
        visible={photoOpen}
        onClose={() => setPhotoOpen(false)}
        title="Profile photo"
      >
        <View style={styles.sheetButtons}>
          <Button
            title="Take photo"
            icon={Camera}
            onPress={() =>
              launchCamera(
                { ...PHOTO_OPTIONS, cameraType: 'front', saveToPhotos: false },
                onPhoto,
              )
            }
          />
          <Button
            title="Choose from gallery"
            icon={ImagePlus}
            variant="secondary"
            onPress={() =>
              launchImageLibrary(
                { ...PHOTO_OPTIONS, selectionLimit: 1 },
                onPhoto,
              )
            }
          />
          {emp.avatarUrl ? (
            <Button
              title="Remove photo"
              icon={Trash2}
              variant="outline"
              onPress={removePhoto}
            />
          ) : null}
        </View>
      </BottomSheet>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  photoCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  photoBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockCard: { marginTop: 12, gap: 10 },
  lockRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  lockBtn: { alignSelf: 'flex-start', marginLeft: 30 },
  fields: { gap: 14 },
  field: { gap: 2 },
  menu: { paddingVertical: 2 },
  logout: { marginTop: 24 },
  sheetText: { marginBottom: 14 },
  sheetButtons: { gap: 12 },
});

export default ProfileScreen;
