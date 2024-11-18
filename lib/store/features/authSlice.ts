import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../services/ninoxSlice';
import { Middleware } from '@reduxjs/toolkit';

interface AuthState {
  userId: string | null;
  token: string | null;
  isAuthenticated: boolean;
}

interface LoginResponse {
  jwt: string;
  user_id: string;
}

export const updateLoginStatus = createAsyncThunk(
  'auth/updateLoginStatus',
  async (userId: string) => {
    try {
      await apiService.patchData(
        { new_login: "yes" },
        'data',
        `user/${userId}`,
        undefined
      );
    } catch (error) {
      console.error('Failed to update login status:', error);
    }
  }
);

const initialState: AuthState = {
  userId: null,
  token: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<LoginResponse>
    ) => {
      state.userId = action.payload.user_id;
      state.token = action.payload.jwt;
      state.isAuthenticated = true;
      localStorage.setItem('auth_token', action.payload.jwt);
    },
    logout: (state) => {
      state.userId = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('auth_token');
    },
    initializeAuth: (state) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        state.token = token;
        state.isAuthenticated = true;
      }
    },
  },
});

// Middleware für Auth-Effekte
export const authMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  
  if (authSlice.actions.setCredentials.match(action)) {
    store.dispatch(updateLoginStatus(action.payload.user_id) as any);
  }
  
  return result;
};

export const { setCredentials, logout, initializeAuth } = authSlice.actions;
export const authReducer = authSlice.reducer;

export const selectCurrentUserId = (state: { auth: AuthState }) => state.auth.userId;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectToken = (state: { auth: AuthState }) => state.auth.token;