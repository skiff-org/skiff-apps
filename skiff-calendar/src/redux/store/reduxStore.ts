import { configureStore } from '@reduxjs/toolkit';
import { createLogger } from 'redux-logger';

import { reducer } from '../reducers';

export const store = configureStore({
  reducer: reducer,
  devTools: process.env.NODE_ENV !== 'production' && process.env.NODE_ENV === 'staging',
  middleware: (getDefaultMiddleware) => {
    const defaultMiddleware = getDefaultMiddleware({ serializableCheck: false });
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      return defaultMiddleware.concat(createLogger({ level: 'info', collapsed: true }));
    }
    return defaultMiddleware;
  }
});

export default store;
