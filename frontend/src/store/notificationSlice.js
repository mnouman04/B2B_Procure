import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationApi } from '../api/endpoints.js';

export const fetchNotifications = createAsyncThunk('notifications/fetch', async (params = {}) => {
  const res = await notificationApi.list({ limit: 10, ...params });
  return { items: res.data, unreadCount: res.meta?.unreadCount ?? 0, total: res.meta?.total ?? 0 };
});

export const markNotificationRead = createAsyncThunk('notifications/markRead', async (id) => {
  await notificationApi.markRead(id);
  return id;
});

export const markAllNotificationsRead = createAsyncThunk('notifications/markAllRead', async () => {
  await notificationApi.markAllRead();
});

const slice = createSlice({
  name: 'notifications',
  initialState: { items: [], unreadCount: 0, total: 0, loading: false },
  reducers: {
    reset: () => ({ items: [], unreadCount: 0, total: 0, loading: false }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => { state.loading = true; })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(fetchNotifications.rejected, (state) => { state.loading = false; })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const item = state.items.find((n) => n._id === action.payload);
        if (item && !item.read) {
          item.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items.forEach((n) => { n.read = true; });
        state.unreadCount = 0;
      });
  },
});

export const { reset: resetNotifications } = slice.actions;
export const selectNotifications = (state) => state.notifications.items;
export const selectUnreadCount = (state) => state.notifications.unreadCount;
export default slice.reducer;
