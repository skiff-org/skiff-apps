import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { isMobile } from 'react-device-detect';
import { BannerTypes, ContactWithoutTypename, isReactNativeDesktopApp } from 'skiff-front-utils';
import { AddressObject, DecryptedAttachment, DisplayPictureData, ValueLabel } from 'skiff-graphql';

import { isInline } from '../../components/Attachments';
import {
  createForwardContent,
  createReplyInitialContent,
  getEmailBody
} from '../../components/MailEditor/mailEditorUtils';
import { MailboxEmailInfo, ThreadViewEmailInfo } from '../../models/email';
import { ThreadDetailInfo } from '../../models/thread';
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
  replyEmailID: string | undefined;
  replyThread: ThreadDetailInfo | undefined;
}

const emptyComposeContent: PopulateComposeContent = {
  subject: '',
  toAddresses: [],
  ccAddresses: [],
  bccAddresses: [],
  fromAddress: undefined,
  messageBody: '',
  attachmentMetadata: [],
  replyEmailID: undefined,
  replyThread: undefined
};

export interface PopulateComposeContent {
  subject: string;
  toAddresses: AddressObject[];
  ccAddresses: AddressObject[];
  bccAddresses: AddressObject[];
  fromAddress: string | undefined;
  messageBody: string;
  attachmentMetadata: DecryptedAttachment[];
  replyEmailID: string | undefined;
  replyThread: ThreadDetailInfo | undefined;
}

export interface PopulateContactContent {
  contactID: string | undefined;
  firstName: string | undefined;
  lastName: string | undefined;
  address: string | undefined;
  displayPictureData: DisplayPictureData | undefined;
  decryptedData?: {
    decryptedPhoneNumbers: ValueLabel[] | undefined;
    decryptedBirthday: string | undefined;
    decryptedNotes: string | undefined;
    decryptedCompany: string | undefined;
    decryptedJobTitle: string | undefined;
    decryptedAddresses: ValueLabel[] | undefined;
    decryptedNickname: string | undefined;
    decryptedURL: string | undefined;
  };
}

export interface SkemailModalReducerState {
  openModal?: Modals;
  composeOpen: boolean;
  // Compose at the bottom of a thread. Mutually exclusive with composeOpen
  replyComposeOpen: { open: boolean; popOut: boolean; threadID: string | undefined };
  bannersOpen: Array<BannerTypes>;
  // See above comment on if we should keep this separate
  composeCollapseState: ComposeExpandTypes;
  // Forward, reply, or draft message that will populate the compose window
  populateComposeContent: PopulateComposeContent;
  // Whether an email is being sent
  isSending: boolean;
  // Pre-populate add contact modal with data
  populateContactContent: PopulateContactContent | undefined;
  // Pre-populate contact modal with a selected contact
  selectedContact: ContactWithoutTypename | undefined;
  // Show format bar in compose
  showFormatBar: boolean;
}

const defaultExpandState = ComposeExpandTypes.Expanded;

const isSS = typeof window !== 'object'; // Is on server side

export const initialSkemailDialogState: SkemailModalReducerState = {
  openModal: undefined,
  composeOpen: false,
  replyComposeOpen: { open: false, popOut: false, threadID: undefined },
  bannersOpen: !isMobile && !isSS && !isReactNativeDesktopApp() ? [BannerTypes.Mobile] : [],
  composeCollapseState: defaultExpandState,
  populateComposeContent: emptyComposeContent,
  populateContactContent: undefined,
  selectedContact: undefined,
  isSending: false,
  showFormatBar: false
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
      state.replyComposeOpen = { ...state.replyComposeOpen, open: false };
      state.composeCollapseState = defaultExpandState;
    },
    openAddContactWithContent: (state, action: PayloadAction<PopulateContactContent>) => {
      state.populateContactContent = action.payload;
    },
    openAddContactWithSelectedContact: (state, action: PayloadAction<ContactWithoutTypename>) => {
      state.selectedContact = action.payload;
    },
    clearPopulateContactContent: (state) => {
      state.populateContactContent = undefined;
    },
    clearSelectedContact: (state) => {
      state.selectedContact = undefined;
    },
    toggleFormatBar: (state) => {
      state.showFormatBar = !state.showFormatBar;
    },
    replyCompose: (
      state,
      action: PayloadAction<{
        email: ThreadViewEmailInfo;
        thread: ThreadDetailInfo;
        emailAliases: string[];
        quickAliases: string[];
        defaultEmailAlias?: string;
        signature?: string;
      }>
    ) => {
      const { email, thread, emailAliases, quickAliases, defaultEmailAlias, signature } = action.payload;
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
      const replyOrForwardFromAddress = getReplyOrForwardFromAddress(
        email,
        emailAliases,
        quickAliases,
        defaultEmailAlias
      );
      state.populateComposeContent.fromAddress = replyOrForwardFromAddress;
      state.populateComposeContent.messageBody = createReplyInitialContent(
        email,
        !!replyOrForwardFromAddress && quickAliases.includes(replyOrForwardFromAddress),
        signature
      );
      state.populateComposeContent.replyEmailID = email.id;
      state.populateComposeContent.replyThread = thread;

      state.populateComposeContent.attachmentMetadata = decryptedAttachmentMetadata?.filter(isInline) ?? [];

      if (isMobile) {
        state.composeOpen = true;
        state.replyComposeOpen = { ...state.replyComposeOpen, open: false };
      } else {
        state.composeOpen = false;
        state.replyComposeOpen = { ...state.replyComposeOpen, open: true };
      }

      state.composeCollapseState = defaultExpandState;
    },
    replyAllCompose: (
      state,
      action: PayloadAction<{
        email: MailboxEmailInfo;
        thread: ThreadDetailInfo;
        emailAliases: string[];
        quickAliases: string[];
        defaultEmailAlias?: string;
        signature?: string;
      }>
    ) => {
      const { email, thread, emailAliases, quickAliases, defaultEmailAlias, signature } = action.payload;
      const { decryptedSubject, to, cc, bcc, from, decryptedAttachmentMetadata, replyTo } = email;
      const subjectStr = decryptedSubject ?? '';
      // if starts with 're', do not append re
      state.populateComposeContent.subject = subjectStr.toLowerCase().startsWith('re: ')
        ? subjectStr
        : `RE: ${subjectStr}`;
      state.populateComposeContent.toAddresses = filterPopulatedToAddresses(
        [replyTo || from, ...to],
        [...emailAliases, ...quickAliases] // filter out user's standard and quick aliases from to field
      );
      state.populateComposeContent.ccAddresses = excludeEmailAliases(cc, emailAliases);
      state.populateComposeContent.bccAddresses = excludeEmailAliases(bcc, emailAliases);
      const replyOrForwardFromAddress = getReplyOrForwardFromAddress(
        email,
        emailAliases,
        quickAliases,
        defaultEmailAlias
      );
      state.populateComposeContent.fromAddress = replyOrForwardFromAddress;
      state.populateComposeContent.messageBody = createReplyInitialContent(
        email,
        !!replyOrForwardFromAddress && quickAliases.includes(replyOrForwardFromAddress),
        signature
      );

      state.populateComposeContent.replyEmailID = email.id;
      state.populateComposeContent.replyThread = thread;

      state.populateComposeContent.attachmentMetadata = decryptedAttachmentMetadata?.filter(isInline) ?? [];

      if (isMobile) {
        state.composeOpen = true;
        state.replyComposeOpen = { ...state.replyComposeOpen, open: false };
      } else {
        state.composeOpen = false;
        state.replyComposeOpen = { ...state.replyComposeOpen, open: true };
      }

      state.composeCollapseState = defaultExpandState;
    },
    editDraftCompose: (
      state,
      action: PayloadAction<{ draftEmail: MailboxEmailInfo; replyThread?: ThreadDetailInfo }>
    ) => {
      const { draftEmail, replyThread } = action.payload;
      const { decryptedSubject, to, cc, bcc, from } = draftEmail;
      state.populateComposeContent.subject = decryptedSubject || '';
      state.populateComposeContent.fromAddress = from.address;
      state.populateComposeContent.toAddresses = to;
      state.populateComposeContent.ccAddresses = cc;
      state.populateComposeContent.bccAddresses = bcc;
      const mostRecentEmailOnReplyThread = replyThread?.emails?.[replyThread.emails.length - 1];
      // draft is either for a reply or a forward, this ensures it is threaded
      if (replyThread && mostRecentEmailOnReplyThread) {
        state.populateComposeContent.replyEmailID = mostRecentEmailOnReplyThread.id;
        state.populateComposeContent.replyThread = replyThread;
      }
      state.populateComposeContent.messageBody = getEmailBody(draftEmail);

      state.composeOpen = true;
      state.replyComposeOpen = { ...state.replyComposeOpen, open: false };
      state.composeCollapseState = defaultExpandState;
    },
    forwardCompose: (
      state,
      action: PayloadAction<{
        email: MailboxEmailInfo;
        emailAliases: string[];
        quickAliases: string[];
        thread: ThreadDetailInfo;
        defaultEmailAlias?: string;
      }>
    ) => {
      const { email, emailAliases, quickAliases, defaultEmailAlias, thread } = action.payload;
      const { decryptedSubject, decryptedAttachmentMetadata } = email;
      state.populateComposeContent.subject = `FWD: ${decryptedSubject || ''}`;
      state.populateComposeContent.fromAddress = getReplyOrForwardFromAddress(
        email,
        emailAliases,
        quickAliases,
        defaultEmailAlias
      );

      state.populateComposeContent.messageBody = createForwardContent(email);
      state.populateComposeContent.attachmentMetadata = decryptedAttachmentMetadata ?? [];
      state.populateComposeContent.replyEmailID = email.id;

      state.populateComposeContent.replyThread = thread;

      if (isMobile) {
        state.composeOpen = true;
        state.replyComposeOpen = { ...state.replyComposeOpen, open: false };
      } else {
        state.composeOpen = false;
        state.replyComposeOpen = { ...state.replyComposeOpen, open: true };
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
    popOutReplyCompose: (
      state,
      action: PayloadAction<{
        threadID: string | undefined;
        draftEmailText: string;
      }>
    ) => {
      state.replyComposeOpen = { open: true, popOut: true, threadID: action.payload.threadID };
      state.populateComposeContent.messageBody = action.payload.draftEmailText;
    },
    closeCompose: (state) => {
      state.composeOpen = false;
      state.replyComposeOpen = { open: false, popOut: false, threadID: undefined };
      state.composeCollapseState = defaultExpandState;
      state.populateComposeContent = emptyComposeContent;
    },
    closeReplyCompose: (state) => {
      state.replyComposeOpen = { open: false, popOut: false, threadID: undefined };
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
