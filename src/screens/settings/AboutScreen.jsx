import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { AppText, Card, Screen, StackHeader } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { ENV } from '@/config/env';

const AboutScreen = () => {
  const { colors } = useTheme();
  return (
    <Screen stack header={<StackHeader title="About" />}>
      <View style={styles.center}>
        <View style={[styles.logoWrap, { borderColor: colors.border }]}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <AppText variant="h1">{ENV.APP_NAME}</AppText>
        <AppText variant="caption" color="mutedForeground">
          Version {ENV.APP_VERSION}
        </AppText>
      </View>
      <Card>
        <AppText color="textSecondary">
          Apponext HRMS brings attendance, leave, expenses and approvals to your
          phone. Employees can punch in with location, apply for time off and
          submit claims on the go, while managers and HR review requests and
          track attendance in real time.
        </AppText>
      </Card>
      <AppText
        variant="small"
        color="mutedForeground"
        align="center"
        style={styles.copy}
      >
        © {new Date().getFullYear()} Apponext. All rights reserved.
      </AppText>
    </Screen>
  );
};

const styles = StyleSheet.create({
  center: { alignItems: 'center', marginVertical: 24, gap: 4 },
  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  logo: { width: '100%', height: '100%' },
  copy: { marginTop: 24 },
});

export default AboutScreen;
