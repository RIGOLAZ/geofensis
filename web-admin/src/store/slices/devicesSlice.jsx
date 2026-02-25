import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getDevices, getDeviceStats } from '../../api/devicesApi'

export const fetchDevices = createAsyncThunk(
  'devices/fetchDevices',
  async () => {
    const devices = await getDevices()
    return devices
  }
)

export const fetchDeviceStats = createAsyncThunk(
  'devices/fetchStats',
  async () => {
    const stats = await getDeviceStats()
    return stats
  }
)

const devicesSlice = createSlice({
  name: 'devices',
  initialState: {
    data: [],
    stats: {},
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDevices.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchDevices.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload
      })
      .addCase(fetchDeviceStats.fulfilled, (state, action) => {
        state.stats = action.payload
      })
  },
})

export default devicesSlice.reducer
