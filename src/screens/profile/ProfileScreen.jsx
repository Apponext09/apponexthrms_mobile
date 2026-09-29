import React, { useCallback, useEffect } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeftRight,
  Bell,
  Briefcase,
  Building,
  CalendarDays,
  HelpCircle,
  Info,
  KeyRound,
  LogOut,
  Mail,
  Phone,
  Settings,
  UserPen,
  UserRound,
} from 'lucide-react-native';
import {
  AppText,
  Avatar,
  Badge,
  Card,
  ListRow,
  Screen,
  SectionHeader,
} from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { logout, selectAuth, switchViewMode } from '@/store/slices/authSlice';
import {
  fetchEmployeeProfile,
  selectProfile,
} from '@/store/slices/profileSlice';
import { canUseAdminView, roleLabel } from '@/utils/roles';
import { formatDate, titleCase } from '@/utils/format';

const InfoItem = ({ icon: Icon, label, value }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.info}>
      <Icon size={16} color={colors.mutedForeground} />
      <View style={styles.flex}>
        <AppText variant="small" color="mutedForeground">
          {label.toUpperCase()}
        </AppText>
        <AppText variant="bodyMedium" numberOfLines={1}>
          {value || '—'}
        </AppText>
      </View>
    </View>
  );
};

const ProfileScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { colors, shadow, radius } = useTheme();
  const { user, viewMode } = useAppSelector(selectAuth);
  const { employee } = useAppSelector(selectProfile);
  const emp = employee.data || {};
  const hasEmployee = Boolean(user?.employeeId);
  const canSwitch = canUseAdminView(user?.roles) && hasEmployee;

  const load = useCallback(() => {
    if (hasEmployee) dispatch(fetchEmployeeProfile());
  }, [dispatch, hasEmployee]);
  useEffect(() => {
    load();
  }, [load]);

  const confirmLogout = () =>
    Alert.alert('Sign out?', 'You will need to sign in again to use the app.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => dispatch(logout()),
      },
    ]);

  const name =
    `${emp.firstName || user?.firstName || ''} ${
      emp.lastName || user?.lastName || ''
    }`.trim() || user?.email;

  return (
    <Screen
      statusBarLight
      refreshing={employee.loading && employee.loaded}
      onRefresh={load}
      edges={[]}
      contentStyle={styles.content}
    >
      <LinearGradient
        colors={colors.headerGradient}
        style={[styles.hero, { paddingTop: insets.top + 16 }]}
      >
        <Avatar
          uri={emp.avatarUrl || user?.avatarUrl}
          firstName={emp.firstName || user?.firstName}
          lastName={emp.lastName || user?.lastName}
          size={84}
          style={styles.avatar}
        />
        <AppText variant="h1" color="#FFFFFF" style={styles.name}>
          {name}
        </AppText>
        <AppText variant="caption" color="rgba(255,255,255,0.85)">
          {emp.designation || user?.designation || roleLabel(user?.roles)}
          {emp.employeeCode ? ` · ${emp.employeeCode}` : ''}
        </AppText>
        <Badge
          label={viewMode === 'admin' ? 'Admin view' : 'Employee view'}
          tone="info"
          style={styles.modeBadge}
        />
      </LinearGradient>
      <View style={styles.body}>
        <Card
          style={[styles.infoCard, shadow.md, { borderRadius: radius.xxl }]}
        >
          <InfoItem
            icon={Mail}
            label="Email"
            value={emp.email || user?.email}
          />
          <InfoItem
            icon={Phone}
            label="Phone"
            value={emp.phone || user?.phone}
          />
          {hasEmployee ? (
            <>
              <InfoItem
                icon={Building}
                label="Department"
                value={emp.department}
              />
              <InfoItem
                icon={UserRound}
                label="Reporting manager"
                value={emp.manager}
              />
              <InfoItem
                icon={CalendarDays}
                label="Date of joining"
                value={emp.dateOfJoining ? formatDate(emp.dateOfJoining) : null}
              />
              <InfoItem
                icon={Briefcase}
                label="Employment type"
                value={
                  emp.employmentType ? titleCase(emp.employmentType) : null
                }
              />
            </>
          ) : (
            <InfoItem
              icon={Building}
              label="Organization"
              value={user?.orgName}
            />
          )}
        </Card>

        {canSwitch ? (
          <>
            <SectionHeader title="Workspace" />
            <Card style={styles.menu}>
              <ListRow
                icon={ArrowLeftRight}
                title={
                  viewMode === 'admin'
                    ? 'Switch to employee view'
                    : 'Switch to admin view'
                }
                subtitle={
                  viewMode === 'admin'
                    ? 'Punch attendance, apply for leave and claims'
                    : 'Review team approvals and org insights'
                }
                onPress={() =>
                  dispatch(
                    switchViewMode(viewMode === 'admin' ? 'employee' : 'admin'),
                  )
                }
                last
              />
            </Card>
          </>
        ) : null}

        <SectionHeader title="Account" />
        <Card style={styles.menu}>
          <ListRow
            icon={UserPen}
            title="Edit profile"
            onPress={() => navigation.navigate('EditProfile')}
          />
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
            subtitle="Theme, notifications and more"
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
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 0, paddingBottom: 64 },
  body: { paddingHorizontal: 16 },
  hero: {
    alignItems: 'center',
    paddingBottom: 56,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  avatar: { borderWidth: 3, borderColor: 'rgba(255,255,255,0.7)' },
  name: { marginTop: 12 },
  modeBadge: { marginTop: 10, alignSelf: 'center' },
  infoCard: { marginTop: -56, gap: 14 },
  info: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menu: { paddingVertical: 2 },
  logout: { marginTop: 24 },
});

export default ProfileScreen;
