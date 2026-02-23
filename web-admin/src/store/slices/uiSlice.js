import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: true,
  theme: 'light',
  notifications: [],
  loading: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        ...action.payload,
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        (n) => n.id !== action.payload
      );
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { toggleSidebar, setTheme, addNotification, removeNotification, setLoading } = uiSlice.actions;
export default uiSlice.reducer;