import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Lock } from '@/components/ui/icons';
import {
  AppText,
  Button,
  Input,
  Screen,
  StackHeader,
  useToast,
} from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { changePassword, selectProfile } from '@/store/slices/profileSlice';

// Same rules as the portal's Settings > Security page: all three fields are
// required and the new passwords must match. The server checks the current
// password; it has no length or strength rules.
const ChangePasswordScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { saving } = useAppSelector(selectProfile);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});

  const save = async () => {
    const e = {};
    if (!current) e.current = 'Enter your current password';
    if (!next) e.next = 'Enter a new password';
    if (!confirm) e.confirm = 'Confirm the new password';
    else if (next !== confirm) e.confirm = 'New passwords do not match';
    setErrors(e);
    if (Object.keys(e).length) return;
    const res = await dispatch(
      changePassword({
        currentPassword: current,
        newPassword: next,
        confirmPassword: confirm,
      }),
    );
    if (changePassword.fulfilled.match(res)) {
      toast.show('Password updated');
      navigation.goBack();
    } else toast.show(res.payload || 'Could not update password', 'error');
  };

  return (
    <Screen stack header={<StackHeader title="Change password" />}>
      <AppText variant="caption" color="mutedForeground" style={styles.intro}>
        This is the same password you use on the web portal.
      </AppText>
      <Input
        label="Current password"
        required
        icon={Lock}
        secure
        value={current}
        onChangeText={setCurrent}
        error={errors.current}
      />
      <Input
        label="New password"
        required
        icon={Lock}
        secure
        value={next}
        onChangeText={setNext}
        error={errors.next}
      />
      <Input
        label="Confirm new password"
        required
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
  intro: { marginBottom: 16 },
});

export default ChangePasswordScreen;
