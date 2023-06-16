import { TypePolicy } from '@apollo/client';

import { parseAsMemoizedDate } from '../typePolicyHelpers';

export const permissionEntryTypePolicy: TypePolicy = {
  fields: {
    expiryDate: {
      read: parseAsMemoizedDate
    }
  }
};
