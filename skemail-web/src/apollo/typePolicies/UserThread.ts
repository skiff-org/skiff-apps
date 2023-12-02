import { FieldPolicy } from '@apollo/client';

export const userThreadFieldPolicy: FieldPolicy = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  read: (_, { args, toReference }) => toReference({ __typename: 'UserThread', threadID: args?.threadID })
};
