import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Settings } from '@/components/ui/icons';
import { AppText, Avatar } from '@/components/ui';
import HeroBackground from '@/components/ui/HeroBackground';
import { HERO_OVERLAP } from '@/components/ui/Screen';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { selectUser } from '@/store/slices/authSlice';
import {
  fetchEmployeeProfile,
  selectProfile,
} from '@/store/slices/profileSlice';
import { selectNotifications } from '@/store/slices/notificationSlice';
import { greeting } from '@/utils/format';
import { roleLabel } from '@/utils/roles';

const IconButton = ({ icon: Icon, onPress, badge }) => (
  <Pressable
    onPress={onPress}
    hitSlop={6}
    style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
  >
    <Icon size={21} color="#FFFFFF" />
    {badge ? <View style={styles.dot} /> : null}
  </Pressable>
);

// Shared header for every tab: the tab bar already names the module,
// so the header shows who is signed in plus common actions.
// `actions`: extra [{ icon, onPress }] rendered before bell + settings.
const AppHeader = ({ actions = [] }) => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const user = useAppSelector(selectUser);
  const { employee } = useAppSelector(selectProfile);
  const { unread } = useAppSelector(selectNotifications);
  const emp = employee.data || {};

  useEffect(() => {
    if (user?.employeeId && !employee.loaded && !employee.loading) {
      dispatch(fetchEmployeeProfile());
    }
  }, [dispatch, user?.employeeId, employee.loaded, employee.loading]);

  const firstName = emp.firstName || user?.firstName || '';
  const lastName = emp.lastName || user?.lastName || '';
  const name = `${firstName} ${lastName}`.trim() || user?.email || 'Welcome';
  const subtitle = user?.employeeId
    ? [emp.designation || user?.designation, emp.employeeCode]
        .filter(Boolean)
        .join(' · ')
    : [roleLabel(user?.roles), user?.orgName].filter(Boolean).join(' · ');

  return (
    <HeroBackground style={[styles.hero, { paddingTop: insets.top + 16 }]}>
      <View style={styles.row}>
        <Pressable onPress={() => navigation.navigate('ProfileTab')}>
          <Avatar
            uri={emp.avatarUrl || user?.avatarUrl}
            firstName={firstName}
            lastName={lastName}
            size={52}
            style={styles.avatar}
          />
        </Pressable>
        <View style={styles.flex}>
          <AppText variant="caption" color="rgba(255,255,255,0.8)">
            {greeting()}
          </AppText>
          <AppText variant="h1" color="#FFFFFF" numberOfLines={1}>
            {name}
          </AppText>
        </View>
        <View style={styles.actions}>
          {actions.map((a, i) => (
            <IconButton key={i} icon={a.icon} onPress={a.onPress} />
          ))}
          <IconButton
            icon={Bell}
            badge={unread > 0}
            onPress={() => navigation.navigate('Notifications')}
          />
          <IconButton
            icon={Settings}
            onPress={() => navigation.navigate('Settings')}
          />
        </View>
      </View>
      {subtitle ? (
        <AppText
          variant="small"
          color="rgba(255,255,255,0.72)"
          style={styles.subtitle}
          numberOfLines={1}
        >
          {subtitle.toUpperCase()}
        </AppText>
      ) : null}
    </HeroBackground>
  );
};

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 16,
    paddingBottom: HERO_OVERLAP + 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  avatar: { borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)' },
  actions: { flexDirection: 'row', gap: 8 },
  subtitle: { marginTop: 14, letterSpacing: 0.6 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  dot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4343',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});

export default AppHeader;
