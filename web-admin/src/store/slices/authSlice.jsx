import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { loginUser as apiLoginUser, getCurrentUser, logoutUser } from '../../api/authApi'

// Renommé pour correspondre à l'import dans LoginPage
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const user = await apiLoginUser(email, password)
      return user
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async () => {
    const user = await getCurrentUser()
    return user
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      logoutUser()
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.user = action.payload
        state.isAuthenticated = !!action.payload
      })
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer