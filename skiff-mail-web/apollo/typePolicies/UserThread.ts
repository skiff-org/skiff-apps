import { FieldPolicy } from '@apollo/client';

export const userThreadFieldPolicy: FieldPolicy = {
  read: (_, { args, toReference }) => toReference({ __typename: 'UserThread', threadID: args?.threadID })
};
