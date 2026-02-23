import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  devices: [],
  onlineCount: 0,
  loading: false,
};

const devicesSlice = createSlice({
  name: 'devices',
  initialState,
  reducers: {
    setDevices: (state, action) => {
      state.devices = action.payload;
      state.onlineCount = action.payload.filter((d) => d.online).length;
    },
    updateDeviceStatus: (state, action) => {
      const { deviceId, status } = action.payload;
      const device = state.devices.find((d) => d.id === deviceId);
      if (device) {
        device.online = status;
        state.onlineCount = state.devices.filter((d) => d.online).length;
      }
    },
  },
});

export const { setDevices, updateDeviceStatus } = devicesSlice.actions;
export default devicesSlice.reducer;