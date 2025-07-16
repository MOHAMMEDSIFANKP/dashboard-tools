// src\store\store.ts
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import counterReducer from './slices/counterSlice';
import dashboardReducer from './slices/dashboardSlice';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { setupListeners } from '@reduxjs/toolkit/query';
import { api } from '@/lib/services/usersApi';
import { testCase2Api } from '@/lib/services/testCase2Api';

// Combine normal reducers with RTK Query reducer
const rootReducer = combineReducers({
  counter: counterReducer,
  dashboard: dashboardReducer, 
  [api.reducerPath]: api.reducer,
   [testCase2Api.reducerPath]: testCase2Api.reducer,
});

// Persist config (only persists the reducers you need, not RTK Query cache)
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['counter','dashboard'], // don't persist the usersApi slice
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
  getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
    },
  }).concat(api.middleware, testCase2Api.middleware), // add RTK Query middleware
});

export const persistor = persistStore(store);
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
