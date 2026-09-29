import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { expenseService } from '@/api/services/expenseService';
import {
  asList,
  normalizeExpenseCategory,
  normalizeExpenseClaim,
} from '@/utils/normalize';
import { remote, addRemoteCases, safeCall } from '../helpers';
import { logout, sessionExpired } from './authSlice';

export const fetchExpenseCategories = createAsyncThunk(
  'expense/categories',
  (_, { rejectWithValue }) =>
    safeCall(
      async () =>
        asList(await expenseService.getCategories()).map(
          normalizeExpenseCategory,
        ),
      rejectWithValue,
    ),
);

export const fetchMyClaims = createAsyncThunk(
  'expense/mine',
  (status, { rejectWithValue }) =>
    safeCall(
      async () =>
        asList(await expenseService.getMyClaims(status)).map(
          normalizeExpenseClaim,
        ),
      rejectWithValue,
    ),
);

export const submitClaim = createAsyncThunk(
  'expense/submit',
  (payload, { dispatch, rejectWithValue }) =>
    safeCall(async () => {
      const result = await expenseService.submit(payload);
      dispatch(fetchMyClaims());
      return result;
    }, rejectWithValue),
);

export const fetchExpenseApprovals = createAsyncThunk(
  'expense/approvals',
  (_, { rejectWithValue }) =>
    safeCall(
      async () =>
        asList(await expenseService.getPendingApprovals()).map(
          normalizeExpenseClaim,
        ),
      rejectWithValue,
    ),
);

export const decideClaim = createAsyncThunk(
  'expense/decide',
  ({ id, approve, note }, { rejectWithValue }) =>
    safeCall(async () => {
      if (approve) await expenseService.approve(id, note);
      else await expenseService.reject(id, note);
      return id;
    }, rejectWithValue),
);

const initialState = {
  categories: remote([]),
  mine: remote([]),
  approvals: remote([]),
  submitting: false,
};

const expenseSlice = createSlice({
  name: 'expense',
  initialState,
  reducers: {},
  extraReducers: builder => {
    addRemoteCases(builder, fetchExpenseCategories, 'categories');
    addRemoteCases(builder, fetchMyClaims, 'mine');
    addRemoteCases(builder, fetchExpenseApprovals, 'approvals');
    builder
      .addCase(submitClaim.pending, state => {
        state.submitting = true;
      })
      .addCase(submitClaim.fulfilled, state => {
        state.submitting = false;
      })
      .addCase(submitClaim.rejected, state => {
        state.submitting = false;
      })
      .addCase(decideClaim.fulfilled, (state, { payload }) => {
        state.approvals.data = state.approvals.data.filter(
          c => c.id !== payload,
        );
      })
      .addCase(logout.fulfilled, () => initialState)
      .addCase(sessionExpired.fulfilled, () => initialState);
  },
});

export const selectExpense = s => s.expense;

export default expenseSlice.reducer;
