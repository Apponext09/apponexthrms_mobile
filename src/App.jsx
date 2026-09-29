import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '@/store';
import { bootstrapSession, sessionExpired } from '@/store/slices/authSlice';
import { loadSettings } from '@/store/slices/settingsSlice';
import { setSessionExpiredHandler } from '@/api/client';
import { ToastProvider } from '@/components/ui/Toast';
import RootNavigator from '@/navigation/RootNavigator';

// Log the user out when the refresh token is no longer valid
setSessionExpiredHandler(() => store.dispatch(sessionExpired()));

const Bootstrap = () => {
  useEffect(() => {
    store.dispatch(loadSettings());
    store.dispatch(bootstrapSession());
  }, []);
  return (
    <ToastProvider>
      <RootNavigator />
    </ToastProvider>
  );
};

const App = () => (
  <Provider store={store}>
    <SafeAreaProvider>
      <Bootstrap />
    </SafeAreaProvider>
  </Provider>
);

export default App;
