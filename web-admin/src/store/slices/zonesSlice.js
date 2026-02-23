import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const initialState = {
  zones: [],
  loading: false,
  error: null,
  selectedZone: null,
};

export const fetchZones = createAsyncThunk('zones/fetchZones', async () => {
  const snapshot = await getDocs(collection(db, 'zones'));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
});

export const createZone = createAsyncThunk('zones/createZone', async (zoneData) => {
  const docRef = await addDoc(collection(db, 'zones'), {
    ...zoneData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return { id: docRef.id, ...zoneData };
});

export const updateZone = createAsyncThunk('zones/updateZone', async ({ id, data }) => {
  await updateDoc(doc(db, 'zones', id), {
    ...data,
    updatedAt: new Date(),
  });
  return { id, ...data };
});

export const deleteZone = createAsyncThunk('zones/deleteZone', async (id) => {
  await deleteDoc(doc(db, 'zones', id));
  return id;
});

const zonesSlice = createSlice({
  name: 'zones',
  initialState,
  reducers: {
    setSelectedZone: (state, action) => {
      state.selectedZone = action.payload;
    },
    clearSelectedZone: (state) => {
      state.selectedZone = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchZones.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchZones.fulfilled, (state, action) => {
        state.zones = action.payload;
        state.loading = false;
      })
      .addCase(fetchZones.rejected, (state, action) => {
        state.error = action.error.message;
        state.loading = false;
      })
      .addCase(createZone.fulfilled, (state, action) => {
        state.zones.push(action.payload);
      })
      .addCase(updateZone.fulfilled, (state, action) => {
        const index = state.zones.findIndex((z) => z.id === action.payload.id);
        if (index !== -1) {
          state.zones[index] = action.payload;
        }
      })
      .addCase(deleteZone.fulfilled, (state, action) => {
        state.zones = state.zones.filter((z) => z.id !== action.payload);
      });
  },
});

export const { setSelectedZone, clearSelectedZone } = zonesSlice.actions;
export default zonesSlice.reducer;