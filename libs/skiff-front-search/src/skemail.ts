import { expose } from 'comlink';
import { AddressObject, DecryptedAttachment } from 'skiff-graphql';

import { createSearchIndexType } from './searchIndex';
import { IndexedSkemail, skemailSearchIndexIDBKey, SearchClient } from './types';
import { customSkemailIndexTokenizer, customSkemailQueryTokenizer, customTokenProcesser } from './utils';

export const SkemailSearchIndex = createSearchIndexType<
  IndexedSkemail,
  { newestThreadUpdatedAt: null | number; oldestThreadUpdatedAt: null | number }
>(
  SearchClient.SKEMAIL,
  {
    fields: [
      'subject',
      'content',
      'toAddresses',
      'to',
      'ccAddresses',
      'cc',
      'bccAddresses',
      'bcc',
      'fromAddress',
      'from',
      'attachments'
    ],
    storeFields: ['id', 'threadID', 'updatedAt'],
    searchOptions: {
      processTerm: customTokenProcesser,
      tokenize: customSkemailQueryTokenizer
    },
    processTerm: customTokenProcesser,
    tokenize: customSkemailIndexTokenizer,
    extractField: (email, fieldName) => {
      const fieldValue = email[fieldName as keyof IndexedSkemail];
      if (typeof fieldValue === 'string') {
        return fieldValue;
      }

      if (typeof fieldValue === 'number') {
        return fieldValue.toString();
      }

      const stringArrayFieldNames = ['toAddresses', 'ccAddresses', 'bccAddresses'];
      if (stringArrayFieldNames.includes(fieldName)) {
        return (fieldValue as string[]).join('\n');
      }

      if (fieldName === 'from') {
        return (fieldValue as AddressObject).address + '\n' + ((fieldValue as AddressObject).name ?? '');
      }

      const addressArrayFieldNames = ['to', 'cc', 'bcc'];
      if (addressArrayFieldNames.includes(fieldName)) {
        const addressArrayFieldIndices = addressArrayFieldNames.map((name) => {
          const addressArray = email[name as keyof IndexedSkemail] as AddressObject[];
          const stringAddressArray = addressArray.map((address) => address.address + '\n' + (address.name ?? ''));
          return stringAddressArray.join('\n');
        });
        return addressArrayFieldIndices.join('\n');
      }

      if (fieldName === 'attachments') {
        return ((fieldValue ?? []) as DecryptedAttachment[])
          .map((attachment) => attachment.decryptedMetadata?.filename)
          .join('\n');
      }

      return '';
    }
  },
  skemailSearchIndexIDBKey,
  { newestThreadUpdatedAt: null, oldestThreadUpdatedAt: null }
);

expose(SkemailSearchIndex);
