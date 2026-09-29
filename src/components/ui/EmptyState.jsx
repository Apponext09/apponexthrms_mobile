import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Inbox } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import AppText from './AppText';
import Button from './Button';

const EmptyState = ({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  message,
  actionLabel,
  onAction,
  style,
}) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, style]}>
      <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
        <Icon size={28} color={colors.primary} />
      </View>
      <AppText variant="h3" align="center">
        {title}
      </AppText>
      {message ? (
        <AppText
          variant="caption"
          color="mutedForeground"
          align="center"
          style={styles.msg}
        >
          {message}
        </AppText>
      ) : null}
      {actionLabel ? (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="secondary"
          size="sm"
          fullWidth={false}
          style={styles.btn}
        />
      ) : null}
    </View>
  );
};

export const ErrorState = ({ message, onRetry }) => (
  <EmptyState
    title="Couldn't load data"
    message={message}
    actionLabel={onRetry ? 'Try again' : undefined}
    onAction={onRetry}
  />
);

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  msg: { marginTop: 6, maxWidth: 280 },
  btn: { marginTop: 16, alignSelf: 'center' },
});

export default EmptyState;
