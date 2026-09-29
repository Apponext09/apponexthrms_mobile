import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { Button } from '@/components/ui';

const DecisionButtons = ({ onApprove, onReject }) => (
  <View style={styles.row}>
    <Button
      title="Reject"
      icon={X}
      variant="outline"
      size="sm"
      onPress={onReject}
      style={styles.flex}
    />
    <Button
      title="Approve"
      icon={Check}
      variant="primary"
      size="sm"
      onPress={onApprove}
      style={styles.flex}
    />
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, marginTop: 14 },
  flex: { flex: 1 },
});

export default DecisionButtons;
