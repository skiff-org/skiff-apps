import { createJSONWrapperDatagram } from '@skiff-org/skiff-crypto';
import { AddressObject } from 'skiff-graphql';

import { ThreadFragment } from '../../generated/graphql';

export interface DraftInfo {
  draftID: string;
  createdAt: number;
  toAddresses: Array<AddressObject>;
  ccAddresses: Array<AddressObject>;
  bccAddresses: Array<AddressObject>;
  subject: string;
  text: string;
  // Do not save the entire AddressObject -- we want to use
  // the most up-to-date display name when we decrypt and
  // create the AddressObject later on
  fromAddress: string;
  // TODO: Attachments
  existingThread?: ThreadFragment;
}

export const DraftContentDatagram = createJSONWrapperDatagram<DraftInfo>('ddl://skiff/DraftContentDatagram');
