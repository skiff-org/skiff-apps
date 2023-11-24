import { DBCore, Middleware } from 'dexie';
import { isIOS } from 'react-device-detect';

import { AppState } from '../../components/Layout/mobileAppEvents/types';

const shouldAbort = () => isIOS && window.nativeAppState === AppState.Background;

// Middleware that aborts transactions when app is in the background to avoid crashing when indexdb get killed by system
export const mobileBackgroundMiddleware: Middleware<DBCore> = {
  stack: 'dbcore',
  name: 'mobileBackgroundMiddleware',
  create(downlevelDatabase) {
    return {
      ...downlevelDatabase,
      table(tableName) {
        const downlevelTable = downlevelDatabase.table(tableName);
        return {
          ...downlevelTable,
          mutate: (req) => {
            // When on ios and in background abort all transactions
            if (shouldAbort()) {
              throw new Error('App in background');
            }
            return downlevelTable.mutate(req).then((res) => {
              return res;
            });
          }
        };
      }
    };
  }
};
