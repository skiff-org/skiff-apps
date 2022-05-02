import { AddressObject, ThreadFragment } from '../../generated/graphql';
import { createJSONWrapperDatagram } from './v1/lib/datagramClasses';

export interface DraftInfo {
  draftID: string;
  createdAt: number;
  toAddresses: Array<AddressObject>;
  ccAddresses: Array<AddressObject>;
  bccAddresses: Array<AddressObject>;
  subject: string;
  text: string;
  existingThread?: ThreadFragment;
}

export const DraftContentDatagram = createJSONWrapperDatagram<DraftInfo>('ddl://skiff/DraftContentDatagram');
