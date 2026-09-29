import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import AppText from './AppText';

const SectionHeader = ({ title, actionLabel, onAction, style }) => (
  <View style={[styles.row, style]}>
    <AppText variant="h3">{title}</AppText>
    {actionLabel ? (
      <Pressable onPress={onAction} hitSlop={8}>
        <AppText variant="captionMedium" color="primary">
          {actionLabel}
        </AppText>
      </Pressable>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
});

export default SectionHeader;
