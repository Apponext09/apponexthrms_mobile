import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { notificationService } from '@/api/services/notificationService';
import { asList, normalizeNotification } from '@/utils/normalize';
import { remote, addRemoteCases, safeCall } from '../helpers';
import { logout, sessionExpired } from './authSlice';

export const fetchNotifications = createAsyncThunk(
  'notifications/list',
  (_, { rejectWithValue }) =>
    safeCall(
      async () =>
        asList(await notificationService.list()).map(normalizeNotification),
      rejectWithValue,
    ),
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/unread',
  (_, { rejectWithValue }) =>
    safeCall(async () => {
      const data = await notificationService.unreadCount();
      return Number(data?.count ?? data?.unreadCount ?? data ?? 0) || 0;
    }, rejectWithValue),
);

export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  (id, { rejectWithValue }) =>
    safeCall(async () => {
      await notificationService.markRead(id);
      return id;
    }, rejectWithValue),
);

export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAll',
  (_, { rejectWithValue }) =>
    safeCall(() => notificationService.markAllRead(), rejectWithValue),
);

const initialState = { list: remote([]), unread: 0 };

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: builder => {
    addRemoteCases(builder, fetchNotifications, 'list');
    builder
      .addCase(fetchUnreadCount.fulfilled, (state, { payload }) => {
        state.unread = payload;
      })
      .addCase(markNotificationRead.fulfilled, (state, { payload }) => {
        const n = state.list.data.find(x => x.id === payload);
        if (n && !n.isRead) {
          n.isRead = true;
          state.unread = Math.max(0, state.unread - 1);
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, state => {
        state.list.data.forEach(n => {
          n.isRead = true;
        });
        state.unread = 0;
      })
      .addCase(logout.fulfilled, () => initialState)
      .addCase(sessionExpired.fulfilled, () => initialState);
  },
});

export const selectNotifications = s => s.notifications;

export default notificationSlice.reducer;
