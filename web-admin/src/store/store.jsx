import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import zonesReducer from './slices/zonesSlice'
import devicesReducer from './slices/devicesSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    zones: zonesReducer,
    devices: devicesReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['zones/setZones', 'devices/setDevices'],
        ignoredPaths: ['zones.data.createdAt', 'devices.data.lastUpdate'],
      },
    }),
})

export default store
