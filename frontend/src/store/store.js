import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';

const LOCAL_KEY = 'equilife_user_v1';

const loadState = () => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return { user: parsed };
  } catch (e) {
    return undefined;
  }
};

const preloadedState = loadState();

const store = configureStore({
  reducer: {
    user: userReducer,
  },
  preloadedState,
});

store.subscribe(() => {
  try {
    const state = store.getState();
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state.user));
  } catch (e) {
    // ignore
  }
});

export default store;
