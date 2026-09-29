import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Building2, Lock, LogIn, Mail } from '@/components/ui/icons';
import { AppText, Button, Input } from '@/components/ui';
import HeroBackground from '@/components/ui/HeroBackground';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { clearLoginError, login, selectAuth } from '@/store/slices/authSlice';
import { ENV } from '@/config/env';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginScreen = () => {
  const { colors, radius, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { loginLoading, loginError } = useAppSelector(selectAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});

  const submit = () => {
    const next = {};
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid work email';
    if (!password) next.password = 'Enter your password';
    setErrors(next);
    if (Object.keys(next).length) return;
    dispatch(login({ email, password, remember }));
  };

  const onChange = (setter, key) => value => {
    setter(value);
    if (errors[key]) setErrors(e => ({ ...e, [key]: null }));
    if (loginError) dispatch(clearLoginError());
  };

  const contactHr = () =>
    Alert.alert(
      'Need help signing in?',
      'Your HR admin can reset your password or unlock your account.',
    );

  const sso = () =>
    Alert.alert(
      'Company SSO',
      'Single sign-on is not enabled for the mobile app yet. Please sign in with your portal email and password.',
    );

  return (
    <View style={[styles.flex, { backgroundColor: colors.card }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <HeroBackground
            style={[styles.hero, { paddingTop: insets.top + 40 }]}
          >
            <View style={[styles.logoTile, { borderRadius: radius.xl }]}>
              <Image
                source={require('@/assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <AppText
              variant="h1"
              color="#FFFFFF"
              align="center"
              style={styles.brand}
            >
              {ENV.APP_NAME}
            </AppText>
            <AppText
              variant="body"
              color="rgba(255,255,255,0.8)"
              align="center"
            >
              Employee self-service
            </AppText>
          </HeroBackground>

          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.card,
                paddingBottom: insets.bottom + spacing.xxl,
              },
            ]}
          >
            <AppText variant="display">Sign in</AppText>
            <AppText
              variant="body"
              color="mutedForeground"
              style={styles.helper}
            >
              Use the work email your HR team registered for you.
            </AppText>

            <Input
              label="Work email"
              required
              filled
              icon={Mail}
              placeholder="you@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              value={email}
              onChangeText={onChange(setEmail, 'email')}
              error={errors.email}
              returnKeyType="next"
            />
            <Input
              label="Password"
              required
              filled
              icon={Lock}
              placeholder="Enter your password"
              secure
              autoCapitalize="none"
              value={password}
              onChangeText={onChange(setPassword, 'password')}
              error={errors.password}
              returnKeyType="go"
              onSubmitEditing={submit}
            />

            <View style={styles.optionsRow}>
              <Pressable
                style={styles.remember}
                onPress={() => setRemember(r => !r)}
              >
                <Switch
                  value={remember}
                  onValueChange={setRemember}
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor="#FFFFFF"
                />
                <AppText variant="body">Keep me signed in</AppText>
              </Pressable>
              <Pressable hitSlop={8} onPress={contactHr}>
                <AppText variant="bodyMedium" color="primary">
                  Forgot password?
                </AppText>
              </Pressable>
            </View>

            {loginError ? (
              <View
                style={[
                  styles.error,
                  {
                    backgroundColor: colors.dangerSoft,
                    borderRadius: radius.md,
                  },
                ]}
              >
                <AppText variant="captionMedium" color="danger">
                  {loginError}
                </AppText>
              </View>
            ) : null}

            <Button
              title="Sign in"
              icon={LogIn}
              size="lg"
              onPress={submit}
              loading={loginLoading}
            />

            <View style={styles.orRow}>
              <View style={[styles.line, { backgroundColor: colors.border }]} />
              <AppText variant="caption" color="mutedForeground">
                or
              </AppText>
              <View style={[styles.line, { backgroundColor: colors.border }]} />
            </View>

            <Button
              title="Continue with company SSO"
              icon={Building2}
              variant="outline"
              size="lg"
              onPress={sso}
            />

            <Pressable onPress={contactHr} style={styles.trouble}>
              <AppText variant="caption" color="mutedForeground" align="center">
                Trouble signing in? Contact your HR admin.
              </AppText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  hero: { alignItems: 'center', paddingBottom: 64 },
  logoTile: {
    width: 76,
    height: 76,
    backgroundColor: '#FFFFFF',
    padding: 10,
    marginBottom: 18,
  },
  logo: { width: '100%', height: '100%' },
  brand: { marginBottom: 4 },
  sheet: {
    flexGrow: 1,
    marginTop: -28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  helper: { marginTop: 6, marginBottom: 22 },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -2,
    marginBottom: 20,
  },
  remember: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  error: { padding: 12, marginBottom: 14 },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 18,
  },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  trouble: { marginTop: 20 },
});

export default LoginScreen;
