import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import dayjs from 'dayjs';
import {
  AppText,
  Button,
  DateField,
  Input,
  Screen,
  SelectField,
  StackHeader,
  useToast,
} from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { saveProfileSection, selectProfile } from '@/store/slices/profileSlice';
import { pick } from '@/utils/normalize';
import { toApiDate } from '@/utils/format';

// Options match the portal's profile forms
const opts = list =>
  list.map(v => (typeof v === 'string' ? { value: v, label: v } : v));
const GENDERS = opts([
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]);
const NATIONALITIES = opts([
  'Indian',
  'American',
  'British',
  'Canadian',
  'Australian',
  'Singaporean',
  'German',
  'French',
  'Other',
]);
const BLOOD_GROUPS = opts(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);
const MARITAL = opts([
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
]);

const TITLES = {
  basic: 'Basic information',
  personal: 'Personal information',
  professional: 'Professional information',
};

// Edits one profile section. Only reachable once HR has unlocked the profile.
const EditProfileScreen = () => {
  const navigation = useNavigation();
  const { params = {} } = useRoute();
  const section = params.section || 'basic';
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { employee, sections, saving } = useAppSelector(selectProfile);
  const emp = employee.data || {};
  const personal = sections.data.personal || {};
  const professional = sections.data.professional || {};

  const initial = useMemo(() => {
    if (section === 'basic')
      return {
        firstName: emp.firstName,
        lastName: emp.lastName,
        mobile: emp.mobile,
        dateOfBirth: emp.dateOfBirth ? dayjs(emp.dateOfBirth).toDate() : null,
        gender: String(emp.gender || '').toLowerCase() || null,
        nationality: emp.nationality || null,
        bloodGroup: emp.bloodGroup || null,
      };
    if (section === 'personal')
      return {
        maritalStatus:
          String(
            pick(personal, 'maritalStatus', 'marital_status') ||
              emp.maritalStatus ||
              '',
          ).toLowerCase() || null,
        fatherName: pick(personal, 'fatherName', 'father_name') || '',
        motherName: pick(personal, 'motherName', 'mother_name') || '',
        spouseName: pick(personal, 'spouseName', 'spouse_name') || '',
        childrenCount: String(
          pick(personal, 'childrenCount', 'children_count') ?? '',
        ),
        currentAddress:
          pick(personal, 'currentAddress', 'current_address') || '',
        permanentAddress:
          pick(personal, 'permanentAddress', 'permanent_address') || '',
        city: pick(personal, 'city') || '',
        state: pick(personal, 'state') || '',
        country: pick(personal, 'country') || '',
        postalCode: pick(personal, 'postalCode', 'postal_code') || '',
      };
    return {
      qualification: pick(professional, 'qualification') || '',
      specialization: pick(professional, 'specialization') || '',
      university: pick(professional, 'university') || '',
      graduationYear: String(
        pick(professional, 'graduationYear', 'graduation_year') ?? '',
      ),
      yearsOfExperience: String(
        pick(professional, 'yearsOfExperience', 'years_of_experience') ?? '',
      ),
      linkedinUrl: pick(professional, 'linkedinUrl', 'linkedin_url') || '',
      githubUrl: pick(professional, 'githubUrl', 'github_url') || '',
    };
    // Form is initialised once from the loaded profile
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const set = key => value => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: null }));
  };

  const validate = () => {
    const next = {};
    if (section === 'basic') {
      if (!String(form.firstName || '').trim()) next.firstName = 'Required';
      if (form.mobile && !/^\d{10}$/.test(form.mobile.trim()))
        next.mobile = 'Mobile number must be exactly 10 digits';
    }
    if (
      section === 'personal' &&
      form.childrenCount &&
      !/^\d+$/.test(form.childrenCount)
    )
      next.childrenCount = 'Whole number only';
    if (section === 'professional') {
      if (form.graduationYear && !/^\d{4}$/.test(form.graduationYear))
        next.graduationYear = 'Enter a 4-digit year';
      if (form.yearsOfExperience && !/^\d+$/.test(form.yearsOfExperience))
        next.yearsOfExperience = 'Whole number only';
    }
    setErrors(next);
    return !Object.keys(next).length;
  };

  const payload = () => {
    if (section === 'basic')
      return {
        firstName: form.firstName.trim(),
        lastName: (form.lastName || '').trim(),
        mobile: (form.mobile || '').trim() || null,
        dateOfBirth: form.dateOfBirth ? toApiDate(form.dateOfBirth) : null,
        gender: form.gender || null,
        nationality: form.nationality || null,
        bloodGroup: form.bloodGroup || null,
      };
    if (section === 'personal')
      return {
        ...form,
        maritalStatus: form.maritalStatus || null,
        childrenCount: form.childrenCount ? Number(form.childrenCount) : 0,
      };
    return {
      ...form,
      graduationYear: form.graduationYear ? Number(form.graduationYear) : null,
      yearsOfExperience: form.yearsOfExperience
        ? Number(form.yearsOfExperience)
        : 0,
    };
  };

  const save = async () => {
    if (!validate()) return;
    const res = await dispatch(
      saveProfileSection({ section, data: payload() }),
    );
    if (saveProfileSection.fulfilled.match(res)) {
      toast.show(`${TITLES[section]} saved`);
      navigation.goBack();
    } else toast.show(res.payload || 'Could not save', 'error');
  };

  const field = (key, label, props = {}) => (
    <Input
      label={label}
      value={form[key]}
      onChangeText={set(key)}
      error={errors[key]}
      {...props}
    />
  );

  return (
    <Screen stack header={<StackHeader title={TITLES[section]} />}>
      {section === 'basic' ? (
        <>
          {field('firstName', 'First name', { required: true })}
          {field('lastName', 'Last name')}
          {field('mobile', 'Mobile number', {
            keyboardType: 'number-pad',
            maxLength: 10,
            onChangeText: t => set('mobile')(t.replace(/\D/g, '')),
          })}
          <DateField
            label="Date of birth"
            value={form.dateOfBirth}
            maximumDate={new Date()}
            onChange={set('dateOfBirth')}
          />
          <SelectField
            label="Gender"
            options={GENDERS}
            value={form.gender}
            onChange={set('gender')}
          />
          <View style={styles.row}>
            <SelectField
              label="Nationality"
              options={NATIONALITIES}
              value={form.nationality}
              onChange={set('nationality')}
              style={styles.flex}
            />
            <SelectField
              label="Blood group"
              options={BLOOD_GROUPS}
              value={form.bloodGroup}
              onChange={set('bloodGroup')}
              style={styles.flex}
            />
          </View>
          <AppText
            variant="caption"
            color="mutedForeground"
            style={styles.note}
          >
            Employee code, email, department, designation and manager are
            managed by HR.
          </AppText>
        </>
      ) : section === 'personal' ? (
        <>
          <SelectField
            label="Marital status"
            options={MARITAL}
            value={form.maritalStatus}
            onChange={set('maritalStatus')}
          />
          {field('fatherName', "Father's name")}
          {field('motherName', "Mother's name")}
          {form.maritalStatus === 'married'
            ? field('spouseName', "Spouse's name")
            : null}
          {field('childrenCount', 'Children', { keyboardType: 'number-pad' })}
          {field('currentAddress', 'Current address', { multiline: true })}
          {field('permanentAddress', 'Permanent address', { multiline: true })}
          <View style={styles.row}>
            {field('city', 'City', { style: styles.flex })}
            {field('state', 'State', { style: styles.flex })}
          </View>
          <View style={styles.row}>
            {field('country', 'Country', { style: styles.flex })}
            {field('postalCode', 'Postal code', {
              keyboardType: 'number-pad',
              style: styles.flex,
            })}
          </View>
        </>
      ) : (
        <>
          {field('qualification', 'Qualification')}
          {field('specialization', 'Specialization')}
          {field('university', 'University / institute')}
          <View style={styles.row}>
            {field('graduationYear', 'Graduation year', {
              keyboardType: 'number-pad',
              maxLength: 4,
              style: styles.flex,
            })}
            {field('yearsOfExperience', 'Years of experience', {
              keyboardType: 'number-pad',
              style: styles.flex,
            })}
          </View>
          {field('linkedinUrl', 'LinkedIn profile URL', {
            autoCapitalize: 'none',
            keyboardType: 'url',
          })}
          {field('githubUrl', 'GitHub profile URL', {
            autoCapitalize: 'none',
            keyboardType: 'url',
          })}
        </>
      )}
      <Button title="Save changes" size="lg" onPress={save} loading={saving} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: 12 },
  note: { marginBottom: 20 },
});

export default EditProfileScreen;
