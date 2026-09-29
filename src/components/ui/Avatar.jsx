import React from 'react';
import { Image, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { initials } from '@/utils/format';
import { ENV } from '@/config/env';
import AppText from './AppText';

const resolveUri = uri => {
  if (!uri) return null;
  if (/^https?:\/\//.test(uri) || uri.startsWith('data:')) return uri;
  // Relative upload paths are served from the API host
  return `${ENV.API_BASE_URL.replace(/\/api\/v1$/, '')}/${uri.replace(
    /^\//,
    '',
  )}`;
};

const Avatar = ({ uri, firstName, lastName, size = 44, style }) => {
  const { colors } = useTheme();
  const src = resolveUri(uri);
  const base = { width: size, height: size, borderRadius: size / 2 };
  if (src) return <Image source={{ uri: src }} style={[base, style]} />;
  return (
    <View
      style={[
        base,
        {
          backgroundColor: colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <AppText
        variant={size > 60 ? 'h1' : 'bodyMedium'}
        color="primary"
        style={{ fontWeight: '700' }}
      >
        {initials(firstName, lastName)}
      </AppText>
    </View>
  );
};

export default Avatar;
