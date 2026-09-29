import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { Camera, ImagePlus, X } from 'lucide-react-native';
import { AppText, BottomSheet, Button } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/hooks/useTheme';

const MAX_BYTES = 10 * 1024 * 1024; // same 10MB limit as the web portal
const OPTIONS = {
  mediaType: 'photo',
  includeBase64: true,
  quality: 0.7,
  maxWidth: 1600,
  maxHeight: 1600,
};

// value: { uri, dataUrl, fileName, fileType, fileSize } | null
const ReceiptPicker = ({ value, onChange }) => {
  const { colors, radius } = useTheme();
  const toast = useToast();
  const [open, setOpen] = useState(false);

  const handle = res => {
    setOpen(false);
    if (res.didCancel) return;
    if (res.errorCode) {
      toast.show(
        res.errorMessage || 'Could not open the camera or gallery',
        'error',
      );
      return;
    }
    const a = res.assets?.[0];
    if (!a?.base64) return;
    if (a.fileSize && a.fileSize > MAX_BYTES) {
      toast.show('Receipt is larger than 10MB', 'error');
      return;
    }
    const type = a.type || 'image/jpeg';
    onChange({
      uri: a.uri,
      dataUrl: `data:${type};base64,${a.base64}`,
      fileName: a.fileName || 'receipt.jpg',
      fileType: type,
      fileSize: a.fileSize || 0,
    });
  };

  if (value) {
    return (
      <View
        style={[
          styles.preview,
          { borderColor: colors.border, borderRadius: radius.lg },
        ]}
      >
        <Image
          source={{ uri: value.uri }}
          style={[styles.thumb, { borderRadius: radius.md }]}
        />
        <View style={styles.flex}>
          <AppText variant="captionMedium" numberOfLines={1}>
            {value.fileName}
          </AppText>
          <AppText variant="small" color="mutedForeground">
            {value.fileSize
              ? `${Math.round(value.fileSize / 1024)} KB`
              : 'Attached'}
          </AppText>
        </View>
        <Pressable hitSlop={10} onPress={() => onChange(null)}>
          <X size={18} color={colors.danger} />
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.add,
          {
            borderColor: colors.primary,
            borderRadius: radius.lg,
            backgroundColor: colors.primarySoft,
          },
        ]}
      >
        <Camera size={18} color={colors.primary} />
        <AppText variant="captionMedium" color="primary">
          Attach receipt
        </AppText>
      </Pressable>
      <BottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        title="Add receipt"
      >
        <View style={styles.sheet}>
          <Button
            title="Take photo"
            icon={Camera}
            onPress={() =>
              launchCamera({ ...OPTIONS, saveToPhotos: false }, handle)
            }
          />
          <Button
            title="Choose from gallery"
            icon={ImagePlus}
            variant="secondary"
            onPress={() =>
              launchImageLibrary({ ...OPTIONS, selectionLimit: 1 }, handle)
            }
          />
        </View>
      </BottomSheet>
    </>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.2,
    borderStyle: 'dashed',
    paddingVertical: 14,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    padding: 10,
  },
  thumb: { width: 48, height: 48 },
  sheet: { gap: 12 },
});

export default ReceiptPicker;
