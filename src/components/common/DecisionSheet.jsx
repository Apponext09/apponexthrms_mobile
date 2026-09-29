import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, BottomSheet, Button, Input } from '@/components/ui';

// Approve / reject confirmation with an optional (or required) note
const DecisionSheet = ({
  visible,
  onClose,
  approve,
  subject,
  onSubmit,
  loading,
  requireNoteOnReject = true,
}) => {
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setNote('');
      setError(null);
    }
  }, [visible]);

  const submit = () => {
    if (!approve && requireNoteOnReject && note.trim().length < 3) {
      setError('Please add a reason for rejecting');
      return;
    }
    onSubmit(note.trim());
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={approve ? 'Approve request' : 'Reject request'}
    >
      {subject ? (
        <AppText
          variant="caption"
          color="mutedForeground"
          style={styles.subject}
        >
          {subject}
        </AppText>
      ) : null}
      <Input
        label={approve ? 'Comment (optional)' : 'Reason for rejection'}
        placeholder={
          approve
            ? 'Add a note for the employee'
            : 'Explain why this is rejected'
        }
        value={note}
        onChangeText={t => {
          setNote(t);
          setError(null);
        }}
        multiline
        error={error}
      />
      <View style={styles.row}>
        <Button
          title="Cancel"
          variant="outline"
          onPress={onClose}
          style={styles.flex}
        />
        <Button
          title={approve ? 'Approve' : 'Reject'}
          variant={approve ? 'success' : 'danger'}
          onPress={submit}
          loading={loading}
          style={styles.flex}
        />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  subject: { marginBottom: 14 },
  row: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
});

export default DecisionSheet;
