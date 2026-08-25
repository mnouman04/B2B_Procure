import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice.js';
import notificationReducer from './notificationSlice.js';
import uiReducer from './uiSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationReducer,
    ui: uiReducer,
  },
  middleware: (getDefault) => getDefault({ serializableCheck: false }),
});
