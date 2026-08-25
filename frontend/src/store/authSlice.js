import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../api/endpoints.js';
import { tokenStore } from '../api/client.js';

export const login = createAsyncThunk('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const res = await authApi.login(payload);
    tokenStore.set(res.data);
    return res.data.user;
  } catch (err) {
    return rejectWithValue(err);
  }
});

export const registerCompany = createAsyncThunk('auth/registerCompany', async (payload, { rejectWithValue }) => {
  try {
    const res = await authApi.registerCompany(payload);
    tokenStore.set(res.data);
    return res.data.user;
  } catch (err) {
    return rejectWithValue(err);
  }
});

export const registerSupplier = createAsyncThunk('auth/registerSupplier', async (payload, { rejectWithValue }) => {
  try {
    const res = await authApi.registerSupplier(payload);
    tokenStore.set(res.data);
    return res.data.user;
  } catch (err) {
    return rejectWithValue(err);
  }
});

/** Restores the session on a hard refresh. */
export const bootstrapSession = createAsyncThunk('auth/bootstrap', async (_, { rejectWithValue }) => {
  if (!tokenStore.get()) return null;
  try {
    const res = await authApi.me();
    return res.data;
  } catch (err) {
    tokenStore.clear();
    return rejectWithValue(err);
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await authApi.logout();
  } finally {
    tokenStore.clear();
  }
  return null;
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (payload, { rejectWithValue }) => {
  try {
    const res = await authApi.updateProfile(payload);
    return res.data;
  } catch (err) {
    return rejectWithValue(err);
  }
});

const initialState = {
  user: null,
  status: 'idle', // idle | loading | authenticated | error
  bootstrapped: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    const authenticated = (state, action) => {
      state.user = action.payload;
      state.status = action.payload ? 'authenticated' : 'idle';
      state.bootstrapped = true;
      state.error = null;
    };

    builder
      .addCase(bootstrapSession.pending, (state) => { state.status = 'loading'; })
      .addCase(bootstrapSession.fulfilled, authenticated)
      .addCase(bootstrapSession.rejected, (state) => {
        state.user = null;
        state.status = 'idle';
        state.bootstrapped = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.status = 'idle';
      })
      .addCase(updateProfile.fulfilled, (state, action) => { state.user = action.payload; });

    [login, registerCompany, registerSupplier].forEach((thunk) => {
      builder
        .addCase(thunk.pending, (state) => { state.status = 'loading'; state.error = null; })
        .addCase(thunk.fulfilled, authenticated)
        .addCase(thunk.rejected, (state, action) => {
          state.status = 'error';
          state.error = action.payload || { message: 'Sign in failed' };
        });
    });
  },
});

export const { clearError } = authSlice.actions;

export const selectUser = (state) => state.auth.user;
export const selectRole = (state) => state.auth.user?.role ?? null;
export const selectIsAuthenticated = (state) => Boolean(state.auth.user);
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
export const selectBootstrapped = (state) => state.auth.bootstrapped;

export default authSlice.reducer;
