import React from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { AppText } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';

const SplashScreen = () => {
  const { colors } = useTheme();
  return (
    <LinearGradient colors={colors.headerGradient} style={styles.flex}>
      <View style={styles.center}>
        <View style={styles.logoWrap}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <AppText variant="h1" color="#FFFFFF" style={styles.title}>
          Apponext HRMS
        </AppText>
        <AppText variant="caption" color="rgba(255,255,255,0.8)">
          Your workplace, in your pocket
        </AppText>
      </View>
      <ActivityIndicator color="#FFFFFF" style={styles.loader} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  logo: { width: '100%', height: '100%' },
  title: { marginTop: 18 },
  loader: { marginBottom: 60 },
});

export default SplashScreen;
