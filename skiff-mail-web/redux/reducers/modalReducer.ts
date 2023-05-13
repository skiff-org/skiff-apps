import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { isMobile } from 'react-device-detect';
import { BannerTypes, isDesktopApp } from 'skiff-front-utils';
import { AddressObject, DecryptedAttachment } from 'skiff-graphql';

import { isInline } from '../../components/Attachments';
import {
  createReplyInitialContent,
  getEmailBody,
  createForwardContent
} from '../../components/MailEditor/mailEditorUtils';
import { MailboxEmailInfo, ThreadViewEmailInfo } from '../../models/email';
import { MailboxThreadInfo, ThreadDetailInfo } from '../../models/thread';
import { excludeEmailAliases, filterPopulatedToAddresses } from '../../utils/composeUtils';
import { getReplyOrForwardFromAddress } from '../../utils/mailboxUtils';

import { Modals } from './modalTypes';

export enum PopulateComposeTypes {
  Reply,
  ReplyAll,
  Forward,
  EditDraft
}

export enum ComposeExpandTypes {
  Collapsed,
  Expanded,
  FullExpanded
}

export interface PopulateComposeContent {
  subject: string;
  toAddresses: AddressObject[];
  ccAddresses: AddressObject[];
  bccAddresses: AddressObject[];
  fromAddress: string | undefined;
  messageBody: string;
  attachmentMetadata: DecryptedAttachment[];
  replyEmailID: string | null;
  replyThread: MailboxThreadInfo | null;
}

const emptyComposeContent: PopulateComposeContent = {
  subject: '',
  toAddresses: [],
  ccAddresses: [],
  bccAddresses: [],
  fromAddress: undefined,
  messageBody: '',
  attachmentMetadata: [],
  replyEmailID: null,
  replyThread: null
};

export interface SkemailModalReducerState {
  openModal?: Modals;
  composeOpen: boolean;
  // Compose at the bottom of a thread. Mutually exclusive with composeOpen
  replyComposeOpen: boolean;
  bannersOpen: Array<BannerTypes>;
  // See above comment on if we should keep this separate
  composeCollapseState: ComposeExpandTypes;
  // Forward, reply, or draft message that will populate the compose window
  populateComposeContent: PopulateComposeContent;
  // Whether an email is being sent
  isSending: boolean;
}

const defaultExpandState = ComposeExpandTypes.Expanded;

const isSS = typeof window !== 'object'; // Is on server side

export const initialSkemailDialogState: SkemailModalReducerState = {
  openModal: undefined,
  composeOpen: false,
  replyComposeOpen: false,
  bannersOpen: !isMobile && !isSS && !isDesktopApp() ? [BannerTypes.Mobile] : [],
  composeCollapseState: defaultExpandState,
  populateComposeContent: emptyComposeContent,
  isSending: false
};

export const skemailModalReducer = createSlice({
  name: 'modal',
  initialState: initialSkemailDialogState,
  reducers: {
    setOpenModal: (state, action: PayloadAction<Modals | undefined>) => {
      state.openModal = action.payload;
    },
    openBanner: (state, action: PayloadAction<BannerTypes>) => {
      const addBanner = action.payload;
      state.bannersOpen = [...state.bannersOpen.filter((banner) => banner !== addBanner), addBanner];
    },
    closeBanner: (state, action: PayloadAction<BannerTypes>) => {
      const removeBanner = action.payload;
      state.bannersOpen = state.bannersOpen.filter((banner) => banner !== removeBanner);
    },
    openEmptyCompose: (state) => {
      state.populateComposeContent = emptyComposeContent;
      state.composeOpen = true;
      state.replyComposeOpen = false;
      state.composeCollapseState = defaultExpandState;
    },
    replyCompose: (
      state,
      action: PayloadAction<{
        email: ThreadViewEmailInfo;
        thread: ThreadDetailInfo;
        emailAliases: string[];
        defaultEmailAlias?: string;
        signature?: string;
      }>
    ) => {
      const { email, thread, emailAliases, defaultEmailAlias, signature } = action.payload;
      const { decryptedSubject = '', from, to, decryptedAttachmentMetadata, replyTo } = email;
      const subjectStr = decryptedSubject ?? '';
      // if starts with 're', do not append re
      state.populateComposeContent.subject = subjectStr.toLowerCase().startsWith('re: ')
        ? subjectStr
        : `RE: ${subjectStr}`;

      if (emailAliases.includes(from.address)) {
        state.populateComposeContent.toAddresses = to;
      } else {
        state.populateComposeContent.toAddresses = [replyTo || from];
      }
      state.populateComposeContent.ccAddresses = [];
      state.populateComposeContent.bccAddresses = [];
      state.populateComposeContent.fromAddress = getReplyOrForwardFromAddress(email, emailAliases, defaultEmailAlias);
      state.populateComposeContent.messageBody = createReplyInitialContent(email, signature);
      state.populateComposeContent.replyEmailID = email.id;
      state.populateComposeContent.replyThread = thread;

      state.populateComposeContent.attachmentMetadata = decryptedAttachmentMetadata?.filter(isInline) ?? [];

      if (isMobile) {
        state.composeOpen = true;
        state.replyComposeOpen = false;
      } else {
        state.composeOpen = false;
        state.replyComposeOpen = true;
      }

      state.composeCollapseState = defaultExpandState;
    },
    replyAllCompose: (
      state,
      action: PayloadAction<{
        email: MailboxEmailInfo;
        thread: MailboxThreadInfo;
        emailAliases: string[];
        defaultEmailAlias?: string;
        signature?: string;
      }>
    ) => {
      const { email, thread, emailAliases, defaultEmailAlias, signature } = action.payload;
      const { decryptedSubject, to, cc, bcc, from, decryptedAttachmentMetadata, replyTo } = email;
      const subjectStr = decryptedSubject ?? '';
      // if starts with 're', do not append re
      state.populateComposeContent.subject = subjectStr.toLowerCase().startsWith('re: ')
        ? subjectStr
        : `RE: ${subjectStr}`;
      state.populateComposeContent.toAddresses = filterPopulatedToAddresses([replyTo || from, ...to], emailAliases);
      state.populateComposeContent.ccAddresses = excludeEmailAliases(cc, emailAliases);
      state.populateComposeContent.bccAddresses = excludeEmailAliases(bcc, emailAliases);
      state.populateComposeContent.fromAddress = getReplyOrForwardFromAddress(email, emailAliases, defaultEmailAlias);
      state.populateComposeContent.messageBody = createReplyInitialContent(email, signature);

      state.populateComposeContent.replyEmailID = email.id;
      state.populateComposeContent.replyThread = thread;

      state.populateComposeContent.attachmentMetadata = decryptedAttachmentMetadata ?? [];

      if (isMobile) {
        state.composeOpen = true;
        state.replyComposeOpen = false;
      } else {
        state.composeOpen = false;
        state.replyComposeOpen = true;
      }

      state.composeCollapseState = defaultExpandState;
    },
    editDraftCompose: (state, action: PayloadAction<MailboxEmailInfo>) => {
      const email = action.payload;
      const { decryptedSubject, to, cc, bcc } = email;
      state.populateComposeContent.subject = decryptedSubject || '';
      state.populateComposeContent.toAddresses = to;
      state.populateComposeContent.ccAddresses = cc;
      state.populateComposeContent.bccAddresses = bcc;

      state.populateComposeContent.messageBody = getEmailBody(email);

      state.composeOpen = true;
      state.replyComposeOpen = false;
      state.composeCollapseState = defaultExpandState;
    },
    forwardCompose: (
      state,
      action: PayloadAction<{
        email: MailboxEmailInfo;
        emailAliases: string[];
        defaultEmailAlias?: string;
      }>
    ) => {
      const { email, emailAliases, defaultEmailAlias } = action.payload;
      const { decryptedSubject, decryptedAttachmentMetadata } = email;
      state.populateComposeContent.subject = `FWD: ${decryptedSubject || ''}`;
      state.populateComposeContent.fromAddress = getReplyOrForwardFromAddress(email, emailAliases, defaultEmailAlias);

      state.populateComposeContent.messageBody = createForwardContent(email);
      state.populateComposeContent.attachmentMetadata = decryptedAttachmentMetadata ?? [];

      if (isMobile) {
        state.composeOpen = true;
        state.replyComposeOpen = false;
      } else {
        state.composeOpen = false;
        state.replyComposeOpen = true;
      }

      state.composeCollapseState = defaultExpandState;
    },
    directMessageCompose: (state, action: PayloadAction<AddressObject>) => {
      const dmTo = action.payload;
      state.populateComposeContent = emptyComposeContent;
      state.populateComposeContent.toAddresses = [dmTo];

      state.composeOpen = true;
      state.composeCollapseState = defaultExpandState;
    },
    closeCompose: (state) => {
      state.composeOpen = false;
      state.replyComposeOpen = false;
      state.composeCollapseState = defaultExpandState;
      state.populateComposeContent = emptyComposeContent;
    },
    closeReplyCompose: (state) => {
      state.replyComposeOpen = false;
      state.composeCollapseState = defaultExpandState;
      state.populateComposeContent = emptyComposeContent;
    },
    collapse: (state) => {
      state.composeCollapseState = ComposeExpandTypes.Collapsed;
    },
    expand: (state) => {
      state.composeCollapseState = ComposeExpandTypes.Expanded;
    },
    fullExpand: (state) => {
      state.composeCollapseState = ComposeExpandTypes.FullExpanded;
    },
    setIsSending: (state, action: PayloadAction<boolean>) => {
      state.isSending = action.payload;
    }
  }
});
