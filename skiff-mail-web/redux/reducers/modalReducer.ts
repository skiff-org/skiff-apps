import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { AddressObject } from '../../generated/graphql';
import { MailboxEmailInfo } from '../../models/email';
import { MailboxThreadInfo } from '../../models/thread';
import { Modals } from './modalTypes';

export enum PopulateComposeTypes {
  Reply,
  ReplyAll,
  Forward,
  EditDraft
}

export interface PopulateComposeContent {
  type: PopulateComposeTypes;
  email: MailboxEmailInfo;
  thread: MailboxThreadInfo;
}

export interface SkemailModalReducerState {
  openModal?: Modals;
  // See above comment on if we should keep this separate
  composeOpen: boolean;
  // See above comment on if we should keep this separate
  isComposeCollapsed: boolean;
  // Forward, reply, or draft message that will populate the compose window
  populateComposeContent: PopulateComposeContent | null;
  // Populate compose with "To" addresses, used for direct message redirects
  // NOTE: Only applies if populateComposeContent is null
  populateComposeToAddresses: AddressObject[] | null;
  populateComposeSubject: string | null;
}

export const initialSkemailDialogState: SkemailModalReducerState = {
  openModal: undefined,
  composeOpen: false,
  isComposeCollapsed: false,
  populateComposeContent: null,
  populateComposeToAddresses: null,
  populateComposeSubject: null
};

export const skemailModalReducer = createSlice({
  name: 'modal',
  initialState: initialSkemailDialogState,
  reducers: {
    setOpenModal: (state, action: PayloadAction<Modals | undefined>) => {
      state.openModal = action.payload;
    },
    openCompose: (
      state,
      action: PayloadAction<{
        populateComposeContent?: PopulateComposeContent;
        populateComposeToAddresses?: AddressObject[];
        populateComposeSubject?: string;
      }>
    ) => {
      const { populateComposeContent = null, populateComposeToAddresses = null, populateComposeSubject = null } = action.payload;
      state.composeOpen = true;
      state.isComposeCollapsed = false;
      state.populateComposeContent = populateComposeContent;
      state.populateComposeToAddresses = populateComposeToAddresses;
      state.populateComposeSubject = populateComposeSubject;
    },
    closeCompose: (state) => {
      state.composeOpen = false;
      state.isComposeCollapsed = false;
      state.populateComposeContent = null;
    },
    collapse: (state) => {
      state.isComposeCollapsed = true;
    },
    expand: (state) => {
      state.isComposeCollapsed = false;
    }
  }
});
