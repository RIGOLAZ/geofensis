import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: true,
    notifications: [],
    theme: 'light',
  },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    addNotification: (state, action) => {
      state.notifications.push(action.payload)
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload)
    },
    setTheme: (state, action) => {
      state.theme = action.payload
    },
  },
})

export const { toggleSidebar, addNotification, removeNotification, setTheme } = uiSlice.actions
export default uiSlice.reducer
