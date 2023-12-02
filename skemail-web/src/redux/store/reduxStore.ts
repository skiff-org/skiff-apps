import { configureStore } from '@reduxjs/toolkit';
import { createLogger } from 'redux-logger';

import { reducer } from '../reducers';

export const store = configureStore({
  reducer: reducer,
  devTools: process.env.NODE_ENV !== 'production',
  middleware: (getDefaultMiddleware) => {
    const defaultMiddleware = getDefaultMiddleware({ serializableCheck: false });
    if (process.env.NODE_ENV === 'development') {
      return defaultMiddleware.concat(createLogger({ level: 'info', collapsed: true }));
    }
    return defaultMiddleware;
  }
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
