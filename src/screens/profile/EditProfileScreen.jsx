import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Phone, UserRound } from '@/components/ui/icons';
import {
  AppText,
  Button,
  Input,
  Screen,
  StackHeader,
  useToast,
} from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { selectUser } from '@/store/slices/authSlice';
import { selectProfile, updateProfile } from '@/store/slices/profileSlice';

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const user = useAppSelector(selectUser);
  const { saving } = useAppSelector(selectProfile);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [errors, setErrors] = useState({});

  const save = async () => {
    const next = {};
    if (!firstName.trim()) next.firstName = 'First name is required';
    if (phone && !/^[+\d][\d\s-]{6,}$/.test(phone.trim()))
      next.phone = 'Enter a valid phone number';
    setErrors(next);
    if (Object.keys(next).length) return;
    const res = await dispatch(
      updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
      }),
    );
    if (updateProfile.fulfilled.match(res)) {
      toast.show('Profile updated');
      navigation.goBack();
    } else toast.show(res.payload || 'Could not update profile', 'error');
  };

  return (
    <Screen stack header={<StackHeader title="Edit profile" />}>
      <Input
        label="First name"
        icon={UserRound}
        value={firstName}
        onChangeText={setFirstName}
        error={errors.firstName}
      />
      <Input
        label="Last name"
        icon={UserRound}
        value={lastName}
        onChangeText={setLastName}
      />
      <Input
        label="Phone"
        icon={Phone}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        error={errors.phone}
      />
      <AppText variant="caption" color="mutedForeground" style={styles.note}>
        Official details such as department, designation and bank information
        are managed by HR. Raise a profile update request from the web portal to
        change them.
      </AppText>
      <Button title="Save changes" size="lg" onPress={save} loading={saving} />
    </Screen>
  );
};

const styles = StyleSheet.create({ note: { marginBottom: 20 } });

export default EditProfileScreen;
