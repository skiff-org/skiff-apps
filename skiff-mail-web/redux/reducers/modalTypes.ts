import { DowngradeProgress } from 'skiff-graphql';
import { AddressObject, Email, UserThread } from 'skiff-graphql';
import { PaywallErrorCode, TierName } from 'skiff-utils';

import { ClientAttachment } from '../../components/Attachments';
import { MailboxEmailInfo } from '../../models/email';
import { MailboxThreadInfo } from '../../models/thread';
import { UserLabel, UserLabelFolder } from '../../utils/label';

/**
 * This file keeps track of all the different types of modals that we have in the app.
 * If you want to create a new modal:
 *  1. create a new `ModalType`
 *  2. create a new interface that includes the type that you just added
 *  3. added the new interface to the exported `Modals` type at the bottom of this file
 */

export enum ModalType {
  CreateOrEditLabelOrFolder,
  ImportMail,
  CommandPalette,
  ReportPhishingOrConcern,
  BlockUnblockSender,
  SkemailWelcome,
  Logout,
  AttachmentPreview,
  InviteUsers,
  Settings,
  ReferralSplash,
  UnSendMessage,
  Shortcuts,
  QrCode,
  Feedback,
  Paywall,
  AddEmail,
  Downgrade
}

/******** Attachments Preview ***********/
export interface AttachmentsPreviewModal {
  type: ModalType.AttachmentPreview;
  attachments: ClientAttachment[];
  attachmentsMetadata?: MailboxEmailInfo['decryptedAttachmentMetadata'];
  initialAttachmentIndex?: number;
  thread?: UserThread;
  email?: Email;
}

/******** Import Email Modal ***********/
export interface ImportMailModal {
  type: ModalType.ImportMail;
  error?: string;
  googleAuthClientCode?: string;
  outlookAuthClientCode?: string;
}

/******** Settings Modal ***********/
export interface SettingsModal {
  type: ModalType.Settings;
}

/******** Command Palette Modal ***********/
export interface CommandPaletteModal {
  type: ModalType.CommandPalette;
}

/******** Skemail Welcome Modal ***********/
export interface SkemailWelcomeModal {
  type: ModalType.SkemailWelcome;
}

/******** User Label Modal ***********/
export interface CreateOrEditLabelOrFolderModal {
  type: ModalType.CreateOrEditLabelOrFolder;
  // The threads the newly created label will be added to
  threadIDs?: string[];
  label?: UserLabel | UserLabelFolder;
  folder?: boolean;
  initialName?: string;
}

/******** Phishing or Concern Modal ***********/
export enum ReportPhishingOrConcernType {
  Phishing,
  Concern
}

export interface ReportPhishingOrConcernModal {
  type: ModalType.ReportPhishingOrConcern;
  threadID: string;
  emailID: string;
  fromAddress: string;
  systemLabels: string[];
  purpose: ReportPhishingOrConcernType;
}

/******** Block/Unblock Modal ***********/
export enum BlockUnblockSenderType {
  Block,
  Unblock
}

export interface BlockUnblockSenderModal {
  type: ModalType.BlockUnblockSender;
  from: AddressObject;
  action: BlockUnblockSenderType;
}

/******** Logout Modal ***********/
export interface LogoutModal {
  type: ModalType.Logout;
}

/******** Invite Users Modal ***********/
export interface InviteUsersModal {
  type: ModalType.InviteUsers;
}

/******** Referral Splash Modal */
export interface ReferralSplashModal {
  type: ModalType.ReferralSplash;
  creditBytes: number;
  referralCount: number;
}

export interface UnSendModal {
  type: ModalType.UnSendMessage;
  thread: MailboxThreadInfo;
}

/******** Shortcuts Modal ***********/
export interface ShortcutsModal {
  type: ModalType.Shortcuts;
}

/******** Qr Code Modal ***********/
export interface QrCodeModal {
  type: ModalType.QrCode;
  title: string;
  description: string;
  link: string;
  buttonProps?: { label: string; onClick: () => void };
}

/******** Feedback Modal ***********/
export interface FeedbackModal {
  type: ModalType.Feedback;
}

/******** Paywall Modal ***********/
export interface PaywallModal {
  type: ModalType.Paywall;
  paywallErrorCode: PaywallErrorCode;
}

/******** Add Email Modal ***********/
export interface AddEmailModal {
  type: ModalType.AddEmail;
  onSendSuccess?: () => void;
}

/******** Downgrade Modal ***********/
export interface DowngradeModal {
  type: ModalType.Downgrade;
  tierToDowngradeTo: TierName;
  downgradeProgress: DowngradeProgress;
}

export type Modals =
  | ImportMailModal
  | SettingsModal
  | CommandPaletteModal
  | SkemailWelcomeModal
  | CreateOrEditLabelOrFolderModal
  | ReportPhishingOrConcernModal
  | BlockUnblockSenderModal
  | LogoutModal
  | AttachmentsPreviewModal
  | InviteUsersModal
  | UnSendModal
  | ShortcutsModal
  | QrCodeModal
  | FeedbackModal
  | ReferralSplashModal
  | PaywallModal
  | AddEmailModal
  | DowngradeModal;

/******** Type Guards ***********/
export const isAttachmentPreviewModal = (modal: Modals | undefined): modal is AttachmentsPreviewModal =>
  modal?.type === ModalType.AttachmentPreview;
export const isImportModal = (modal: Modals | undefined): modal is ImportMailModal =>
  modal?.type === ModalType.ImportMail;
export const isCreateOrEditLabelOrFolderModal = (modal: Modals | undefined): modal is CreateOrEditLabelOrFolderModal =>
  modal?.type === ModalType.CreateOrEditLabelOrFolder;
export const isUnSendModal = (modal: Modals | undefined): modal is UnSendModal =>
  modal?.type === ModalType.UnSendMessage;
