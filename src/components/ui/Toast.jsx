import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import AppText from './AppText';

const ToastContext = createContext({ show: () => {} });

export const ToastProvider = ({ children }) => {
  const { colors, radius, shadow } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);

  // type: success | error | info
  const show = useCallback(
    (message, type = 'success') => {
      clearTimeout(timer.current);
      setToast({ message, type });
      Animated.spring(anim, { toValue: 1, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(anim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => setToast(null));
      }, 2800);
    },
    [anim],
  );

  const tone =
    toast?.type === 'error'
      ? colors.danger
      : toast?.type === 'info'
      ? colors.info
      : colors.success;
  const Icon =
    toast?.type === 'error'
      ? AlertCircle
      : toast?.type === 'info'
      ? Info
      : CheckCircle2;

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            shadow.lg,
            {
              top: insets.top + 10,
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderLeftColor: tone,
              borderRadius: radius.lg,
              opacity: anim,
              transform: [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Icon size={20} color={tone} />
          <AppText variant="captionMedium" style={styles.msg}>
            {toast.message}
          </AppText>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  msg: { flex: 1 },
});
