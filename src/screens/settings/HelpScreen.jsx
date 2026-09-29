import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronDown, ChevronUp } from '@/components/ui/icons';
import {
  AppText,
  Card,
  Screen,
  SectionHeader,
  StackHeader,
} from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';

const FAQ = [
  [
    'Why can’t I check in?',
    'Check-in is blocked on holidays, week-offs or when no shift is assigned to you. Contact HR if you believe this is wrong.',
  ],
  [
    'Why is my location needed?',
    'Your organization may require GPS location for attendance. It is captured only when you check in or out.',
  ],
  [
    'How do I correct a missed punch?',
    'Raise an attendance regularization request from the web portal. Your manager will review it.',
  ],
  [
    'When will my expense be reimbursed?',
    'Once your manager and finance approve the claim, it is paid in the next payment cycle.',
  ],
  [
    'How do I cancel a leave request?',
    'Open the request from the Leave tab and tap “Cancel request”.',
  ],
];

const Item = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => setOpen(o => !o)}
      style={[styles.item, { borderBottomColor: colors.border }]}
    >
      <View style={styles.q}>
        <AppText variant="bodyMedium" style={styles.flex}>
          {q}
        </AppText>
        {open ? (
          <ChevronUp size={18} color={colors.mutedForeground} />
        ) : (
          <ChevronDown size={18} color={colors.mutedForeground} />
        )}
      </View>
      {open ? (
        <AppText variant="caption" color="textSecondary" style={styles.a}>
          {a}
        </AppText>
      ) : null}
    </Pressable>
  );
};

const HelpScreen = () => (
  <Screen stack header={<StackHeader title="Help & support" />}>
    <SectionHeader title="Frequently asked questions" style={styles.first} />
    <Card style={styles.card}>
      {FAQ.map(([q, a]) => (
        <Item key={q} q={q} a={a} />
      ))}
    </Card>
    <SectionHeader title="Still need help?" />
    <Card>
      <AppText variant="caption" color="mutedForeground">
        For questions about your account, attendance, leave or claims, contact
        your HR admin. They can also reset your password.
      </AppText>
    </Card>
  </Screen>
);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  first: { marginTop: 0 },
  card: { paddingVertical: 0 },
  item: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  q: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  a: { marginTop: 8 },
});

export default HelpScreen;
