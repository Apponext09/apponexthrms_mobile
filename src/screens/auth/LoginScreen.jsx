import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock, Mail, ShieldCheck } from 'lucide-react-native';
import { AppText, Button, Input } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { clearLoginError, login, selectAuth } from '@/store/slices/authSlice';
import { ENV } from '@/config/env';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginScreen = () => {
  const { colors, spacing, radius, shadow } = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { loginLoading, loginError } = useAppSelector(selectAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const submit = () => {
    const next = {};
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid work email';
    if (password.length < 1) next.password = 'Enter your password';
    setErrors(next);
    if (Object.keys(next).length) return;
    dispatch(login({ email, password }));
  };

  const onChange = (setter, key) => v => {
    setter(v);
    if (errors[key]) setErrors(e => ({ ...e, [key]: null }));
    if (loginError) dispatch(clearLoginError());
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <LinearGradient
            colors={colors.headerGradient}
            style={[styles.hero, { paddingTop: insets.top + 40 }]}
          >
            <View style={styles.logoWrap}>
              <Image
                source={require('@/assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <AppText variant="display" color="#FFFFFF" style={styles.heroTitle}>
              Welcome back
            </AppText>
            <AppText variant="body" color="rgba(255,255,255,0.85)">
              Sign in to {ENV.APP_NAME}
            </AppText>
          </LinearGradient>

          <View
            style={{
              paddingHorizontal: spacing.lg,
              paddingBottom: spacing.xxl,
            }}
          >
            <View
              style={[
                styles.form,
                shadow.md,
                {
                  backgroundColor: colors.card,
                  borderRadius: radius.xxl,
                  borderColor: colors.border,
                },
              ]}
            >
              <Input
                label="Work email"
                icon={Mail}
                placeholder="name@company.com"
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
              <Pressable
                style={styles.forgot}
                hitSlop={8}
                onPress={() =>
                  Alert.alert(
                    'Forgot password?',
                    'Please contact your HR or administrator to reset your password.',
                  )
                }
              >
                <AppText variant="captionMedium" color="primary">
                  Forgot password?
                </AppText>
              </Pressable>

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
                size="lg"
                onPress={submit}
                loading={loginLoading}
              />
            </View>

            <View style={styles.secure}>
              <ShieldCheck size={14} color={colors.mutedForeground} />
              <AppText variant="caption" color="mutedForeground">
                Secured with encrypted sessions
              </AppText>
            </View>
            <AppText variant="small" color="mutedForeground" align="center">
              v{ENV.APP_VERSION}
            </AppText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 70,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 8,
    marginBottom: 20,
  },
  logo: { width: '100%', height: '100%' },
  heroTitle: { marginBottom: 4 },
  form: { padding: 20, marginTop: -60, borderWidth: 1 },
  forgot: { alignSelf: 'flex-end', marginTop: -6, marginBottom: 18 },
  error: { padding: 12, marginBottom: 14 },
  secure: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
    marginBottom: 6,
  },
});

export default LoginScreen;
