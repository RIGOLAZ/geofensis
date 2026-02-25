import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getZones, createZone, updateZone, deleteZone } from '../../api/zonesApi'

export const fetchZones = createAsyncThunk(
  'zones/fetchZones',
  async () => {
    const zones = await getZones()
    return zones
  }
)

export const addZone = createAsyncThunk(
  'zones/addZone',
  async (zoneData) => {
    const zone = await createZone(zoneData)
    return zone
  }
)

const zonesSlice = createSlice({
  name: 'zones',
  initialState: {
    data: [],
    loading: false,
    error: null,
    selectedZone: null,
  },
  reducers: {
    setSelectedZone: (state, action) => {
      state.selectedZone = action.payload
    },
    clearSelectedZone: (state) => {
      state.selectedZone = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchZones.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchZones.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload
      })
      .addCase(fetchZones.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      .addCase(addZone.fulfilled, (state, action) => {
        state.data.push(action.payload)
      })
  },
})

export const { setSelectedZone, clearSelectedZone } = zonesSlice.actions
export default zonesSlice.reducer
