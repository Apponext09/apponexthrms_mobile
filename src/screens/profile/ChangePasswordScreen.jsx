import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Check, Lock } from 'lucide-react-native';
import {
  AppText,
  Button,
  Input,
  Screen,
  StackHeader,
  useToast,
} from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { changePassword, selectProfile } from '@/store/slices/profileSlice';

const RULES = [
  { test: p => p.length >= 8, label: 'At least 8 characters' },
  { test: p => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: p => /[0-9]/.test(p), label: 'One number' },
  { test: p => /[^A-Za-z0-9]/.test(p), label: 'One special character' },
];

const ChangePasswordScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { colors } = useTheme();
  const { saving } = useAppSelector(selectProfile);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});

  const save = async () => {
    const e = {};
    if (!current) e.current = 'Enter your current password';
    if (!RULES.every(r => r.test(next)))
      e.next = 'Password does not meet the requirements';
    if (next !== confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    if (Object.keys(e).length) return;
    const res = await dispatch(
      changePassword({ currentPassword: current, newPassword: next }),
    );
    if (changePassword.fulfilled.match(res)) {
      toast.show('Password changed');
      navigation.goBack();
    } else toast.show(res.payload || 'Could not change password', 'error');
  };

  return (
    <Screen stack header={<StackHeader title="Change password" />}>
      <Input
        label="Current password"
        icon={Lock}
        secure
        value={current}
        onChangeText={setCurrent}
        error={errors.current}
      />
      <Input
        label="New password"
        icon={Lock}
        secure
        value={next}
        onChangeText={setNext}
        error={errors.next}
      />
      <View style={styles.rules}>
        {RULES.map(r => {
          const ok = r.test(next);
          return (
            <View key={r.label} style={styles.rule}>
              <Check
                size={14}
                color={ok ? colors.success : colors.mutedForeground}
              />
              <AppText
                variant="caption"
                color={ok ? 'success' : 'mutedForeground'}
              >
                {r.label}
              </AppText>
            </View>
          );
        })}
      </View>
      <Input
        label="Confirm new password"
        icon={Lock}
        secure
        value={confirm}
        onChangeText={setConfirm}
        error={errors.confirm}
      />
      <Button
        title="Update password"
        size="lg"
        onPress={save}
        loading={saving}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  rules: { marginTop: -6, marginBottom: 16, gap: 4 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});

export default ChangePasswordScreen;
