import React from 'react';
import { Alert, StyleSheet } from 'react-native';
import {
  BellRing,
  ClipboardCheck,
  Moon,
  Smartphone,
  Sun,
  Trash2,
  AlarmClock,
} from '@/components/ui/icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Card,
  ListRow,
  Screen,
  SectionHeader,
  StackHeader,
  useToast,
} from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import {
  persistSettings,
  selectSettings,
  setTheme,
  toggleSetting,
} from '@/store/slices/settingsSlice';
import { appStorage } from '@/utils/storage';

const THEMES = [
  { key: 'system', label: 'System default', icon: Smartphone },
  { key: 'light', label: 'Light', icon: Sun },
  { key: 'dark', label: 'Dark', icon: Moon },
];

const SettingsScreen = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const settings = useAppSelector(selectSettings);

  const toggle = key => {
    dispatch(toggleSetting(key));
    dispatch(persistSettings());
  };

  const clearCache = () =>
    Alert.alert(
      'Clear cached data?',
      'Saved preferences are kept. Cached data will be downloaded again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            const keep = await appStorage.getSettings();
            const user = await appStorage.getUser();
            await AsyncStorage.clear();
            if (keep) await appStorage.setSettings(keep);
            if (user) await appStorage.setUser(user);
            toast.show('Cache cleared');
          },
        },
      ],
    );

  return (
    <Screen stack header={<StackHeader title="Settings" />}>
      <SectionHeader title="Appearance" style={styles.first} />
      <Card style={styles.menu}>
        {THEMES.map((t, i) => (
          <ListRow
            key={t.key}
            icon={t.icon}
            title={t.label}
            selected={settings.theme === t.key}
            onPress={() => {
              dispatch(setTheme(t.key));
              dispatch(persistSettings());
            }}
            last={i === THEMES.length - 1}
          />
        ))}
      </Card>

      <SectionHeader title="Notifications" />
      <Card style={styles.menu}>
        <ListRow
          icon={BellRing}
          title="Push notifications"
          subtitle="Announcements and updates"
          switchValue={settings.notificationsEnabled}
          onSwitch={() => toggle('notificationsEnabled')}
        />
        <ListRow
          icon={AlarmClock}
          iconTone="success"
          title="Attendance reminders"
          subtitle="Remind me to check in and out"
          switchValue={settings.attendanceReminders}
          onSwitch={() => toggle('attendanceReminders')}
        />
        <ListRow
          icon={ClipboardCheck}
          iconTone="warning"
          title="Approval alerts"
          subtitle="Leave and expense status changes"
          switchValue={settings.approvalAlerts}
          onSwitch={() => toggle('approvalAlerts')}
          last
        />
      </Card>

      <SectionHeader title="Data" />
      <Card style={styles.menu}>
        <ListRow
          icon={Trash2}
          title="Clear cached data"
          danger
          onPress={clearCache}
          last
        />
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  first: { marginTop: 0 },
  menu: { paddingVertical: 2 },
});

export default SettingsScreen;
