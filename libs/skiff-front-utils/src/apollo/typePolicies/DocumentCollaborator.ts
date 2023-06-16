import { TypePolicy } from '@apollo/client';

import { parseAsMemoizedDate } from '../typePolicyHelpers';

export const documentCollaboratorTypePolicy: TypePolicy = {
  fields: {
    expiryDate: {
      read: parseAsMemoizedDate
    }
  }
};
