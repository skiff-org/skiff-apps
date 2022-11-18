import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { isMobile } from 'react-device-detect';
import { AddressObject, DecryptedAttachment } from 'skiff-graphql';

import { isInline } from '../../components/Attachments';
import { createReplyInitialContent, getEmailBody } from '../../components/MailEditor/mailEditorUtils';
import { MailboxEmailInfo } from '../../models/email';
import { MailboxThreadInfo } from '../../models/thread';
import { excludeEmailAliases, filterPopulatedToAddresses } from '../../utils/composeUtils';
import { getReplyOrForwardFromAddress } from '../../utils/mailboxUtils';

import { Modals } from './modalTypes';

export enum BannerTypes {
  Mobile = 'MOBILE',
  Notification = 'NOTIFICATION'
}

export enum PopulateComposeTypes {
  Reply,
  ReplyAll,
  Forward,
  EditDraft
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
  // See above comment on if we should keep this separate
  composeOpen: boolean;
  bannersOpen: Array<BannerTypes>;
  // See above comment on if we should keep this separate
  isComposeCollapsed: boolean;
  // Forward, reply, or draft message that will populate the compose window
  populateComposeContent: PopulateComposeContent;
  // Whether an email is being sent
  isSending: boolean;
}

export const initialSkemailDialogState: SkemailModalReducerState = {
  openModal: undefined,
  composeOpen: false,
  bannersOpen: !isMobile ? [BannerTypes.Mobile] : [],
  isComposeCollapsed: false,
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
      state.isComposeCollapsed = false;
    },
    replyCompose: (
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
      const { decryptedSubject = '', from, to, decryptedAttachmentMetadata } = email;
      state.populateComposeContent.subject = `RE: ${decryptedSubject as string}`;

      if (emailAliases.includes(from.address)) {
        state.populateComposeContent.toAddresses = to;
      } else {
        state.populateComposeContent.toAddresses = [from];
      }
      state.populateComposeContent.ccAddresses = [];
      state.populateComposeContent.bccAddresses = [];
      state.populateComposeContent.fromAddress = getReplyOrForwardFromAddress(email, emailAliases, defaultEmailAlias);
      state.populateComposeContent.messageBody = createReplyInitialContent(email, signature);
      state.populateComposeContent.replyEmailID = email.id;
      state.populateComposeContent.replyThread = thread;

      state.populateComposeContent.attachmentMetadata = decryptedAttachmentMetadata?.filter(isInline) ?? [];

      state.composeOpen = true;
      state.isComposeCollapsed = false;
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
      const { decryptedSubject, to, cc, bcc, from, decryptedAttachmentMetadata } = email;
      state.populateComposeContent.subject = `RE: ${decryptedSubject || ''}`;
      state.populateComposeContent.toAddresses = filterPopulatedToAddresses([from, ...to], emailAliases);
      state.populateComposeContent.ccAddresses = excludeEmailAliases(cc, emailAliases);
      state.populateComposeContent.bccAddresses = excludeEmailAliases(bcc, emailAliases);
      state.populateComposeContent.fromAddress = getReplyOrForwardFromAddress(email, emailAliases, defaultEmailAlias);
      state.populateComposeContent.messageBody = createReplyInitialContent(email, signature);

      state.populateComposeContent.replyEmailID = email.id;
      state.populateComposeContent.replyThread = thread;

      state.populateComposeContent.attachmentMetadata = decryptedAttachmentMetadata ?? [];

      state.composeOpen = true;
      state.isComposeCollapsed = false;
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
      state.isComposeCollapsed = false;
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

      state.populateComposeContent.messageBody = getEmailBody(email);
      state.populateComposeContent.attachmentMetadata = decryptedAttachmentMetadata ?? [];

      state.composeOpen = true;
      state.isComposeCollapsed = false;
    },
    directMessageCompose: (state, action: PayloadAction<AddressObject>) => {
      const dmTo = action.payload;
      state.populateComposeContent = emptyComposeContent;
      state.populateComposeContent.toAddresses = [dmTo];

      state.composeOpen = true;
      state.isComposeCollapsed = false;
    },
    closeCompose: (state) => {
      state.composeOpen = false;
      state.isComposeCollapsed = false;
      state.populateComposeContent = emptyComposeContent;
    },
    collapse: (state) => {
      state.isComposeCollapsed = true;
    },
    expand: (state) => {
      state.isComposeCollapsed = false;
    },
    setIsSending: (state, action: PayloadAction<boolean>) => {
      state.isSending = action.payload;
    }
  }
});
