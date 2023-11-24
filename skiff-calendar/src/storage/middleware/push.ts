import { DBCore, Middleware } from 'dexie';

// This middleware make sure we do sync just after event updated
export const pushMiddleware: (handler: () => void) => Middleware<DBCore> = (handler) => ({
  stack: 'dbcore',
  name: 'push',
  create(downlevelDatabase) {
    return {
      ...downlevelDatabase,
      table(tableName) {
        const downlevelTable = downlevelDatabase.table(tableName);
        return {
          ...downlevelTable,
          mutate: async (req) => {
            return downlevelTable.mutate(req).then((res) => {
              if (tableName !== 'events') return res;
              handler();
              return res;
            });
          }
        };
      }
    };
  }
});
