import { store } from './reduxStore';

export type AppDispatch = typeof store.dispatch;
export type AppState = ReturnType<typeof store.getState>;
