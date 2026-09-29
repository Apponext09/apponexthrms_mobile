import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import AppText from './AppText';
import BottomSheet from './BottomSheet';

// options: [{ value, label, description? }]
const SelectField = ({
  label,
  placeholder = 'Select',
  options = [],
  value,
  onChange,
  error,
  style,
}) => {
  const { colors, radius } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <View style={[styles.wrap, style]}>
      {label ? (
        <AppText
          variant="captionMedium"
          color="textSecondary"
          style={styles.label}
        >
          {label}
        </AppText>
      ) : null}
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.field,
          {
            borderRadius: radius.lg,
            backgroundColor: colors.card,
            borderColor: error ? colors.danger : colors.border,
          },
        ]}
      >
        <AppText
          color={selected ? 'foreground' : 'mutedForeground'}
          style={styles.flex}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
        </AppText>
        <ChevronDown size={18} color={colors.mutedForeground} />
      </Pressable>
      {error ? (
        <AppText variant="caption" color="danger" style={styles.helper}>
          {error}
        </AppText>
      ) : null}

      <BottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={label || placeholder}
      >
        <FlatList
          data={options}
          keyExtractor={o => String(o.value)}
          ItemSeparatorComponent={() => (
            <View style={[styles.sep, { backgroundColor: colors.border }]} />
          )}
          ListEmptyComponent={
            <AppText color="mutedForeground" style={styles.empty}>
              No options available
            </AppText>
          }
          renderItem={({ item }) => {
            const active = item.value === value;
            return (
              <Pressable
                onPress={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
                style={styles.option}
              >
                <View style={styles.flex}>
                  <AppText
                    variant="bodyMedium"
                    color={active ? 'primary' : 'foreground'}
                  >
                    {item.label}
                  </AppText>
                  {item.description ? (
                    <AppText variant="caption" color="mutedForeground">
                      {item.description}
                    </AppText>
                  ) : null}
                </View>
                {active ? <Check size={18} color={colors.primary} /> : null}
              </Pressable>
            );
          }}
        />
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { marginBottom: 6 },
  field: {
    height: 50,
    borderWidth: 1.2,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  flex: { flex: 1 },
  helper: { marginTop: 4 },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  sep: { height: StyleSheet.hairlineWidth },
  empty: { paddingVertical: 20, textAlign: 'center' },
});

export default SelectField;
