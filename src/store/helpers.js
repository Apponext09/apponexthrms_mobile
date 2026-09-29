import { getErrorMessage } from '@/utils/errors';

// Standard shape for a remote resource held in a slice
export const remote = (data = null) => ({
  data,
  loading: false,
  error: null,
  loaded: false,
});

// Wires pending/fulfilled/rejected of a thunk to state[key]
export const addRemoteCases = (builder, thunk, key, transform = p => p) => {
  builder
    .addCase(thunk.pending, state => {
      state[key].loading = true;
      state[key].error = null;
    })
    .addCase(thunk.fulfilled, (state, { payload }) => {
      state[key].loading = false;
      state[key].loaded = true;
      state[key].data = transform(payload, state);
    })
    .addCase(thunk.rejected, (state, { payload, error }) => {
      state[key].loading = false;
      state[key].loaded = true;
      state[key].error = payload || error.message;
    });
};

// Wraps a service call so thunks reject with a readable message
export const safeCall = async (fn, rejectWithValue) => {
  try {
    return await fn();
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
};
