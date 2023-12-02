import { AddressObject, DowngradeProgress, Email, UserThread } from 'skiff-graphql';
import { PaywallErrorCode, TierName } from 'skiff-utils';

import { ClientAttachment } from '../../components/Attachments';
import { MarkAsType } from '../../components/Settings/Filters/Filters.constants';
import { Condition, MoveToType } from '../../components/Settings/Filters/Filters.types';
import { MailboxEmailInfo } from '../../models/email';
import { UserLabelFolder, UserLabelPlain } from '../../utils/label';

/**
 * This file keeps track of all the different types of modals that we have in the app.
 * If you want to create a new modal:
 *  1. create a new `ModalType`
 *  2. create a new interface that includes the type that you just added
 *  3. added the new interface to the exported `Modals` type at the bottom of this file
 */

export enum ModalType {
  CreateOrEditLabelOrFolder,
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
  QrCode,
  Feedback,
  Paywall,
  ConfirmSignature,
  AddEmail,
  Downgrade,
  SearchCustomDomain,
  PlanDelinquency,
  Filter,
  BulkUnsubscribe
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
  // Add labels to threads if applicable
  addLabelOrFolder?: (label: UserLabelPlain | UserLabelFolder) => Promise<void>;
  // Additional actions to perform after closing the modal
  onClose?: (userLabel?: UserLabelPlain | UserLabelFolder) => void;
  // The threads the newly created label will be added to
  threadIDs?: string[];
  label?: UserLabelPlain | UserLabelFolder;
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
  threadID: string;
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
  // Additional actions to perform after closing the modal
  onClose?: () => void;
}

/******** Confirm Signature (Disable) Modal ***********/
export interface ConfirmSignatureModal {
  type: ModalType.ConfirmSignature;
  onConfirm: () => void;
}

/******** Add Email Modal ***********/
export interface AddEmailModal {
  type: ModalType.AddEmail;
  onSendSuccess?: (email: string) => void;
}

/******** Downgrade Modal ***********/
export interface DowngradeModal {
  type: ModalType.Downgrade;
  tierToDowngradeTo: TierName;
  downgradeProgress: DowngradeProgress;
}

/******** Search Custom Domain Modal ***********/
export interface SearchCustomDomainModal {
  type: ModalType.SearchCustomDomain;
}

/******** Plan Delinquency Modal ***********/
export interface PlanDelinquencyModal {
  type: ModalType.PlanDelinquency;
  currentTier: TierName;
  downgradeProgress: DowngradeProgress | undefined;
  delinquentAlias?: string;
}

/******** Filter Modal ***********/
export interface FilterModal {
  type: ModalType.Filter;
  filterID?: string;
  selectedMoveToOption?: MoveToType;
  selectedLabels?: UserLabelPlain[];
  selectedMarkAsOption?: MarkAsType;
  shouldSkipNotifications?: boolean;
  activeConditions?: Condition[];
  shouldORFilters?: boolean;
  name?: string;
}

/******** Unsubscribe Modal ***********/
export interface BulkUnsubscribeModal {
  type: ModalType.BulkUnsubscribe;
}

export type Modals =
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
  | QrCodeModal
  | FeedbackModal
  | ReferralSplashModal
  | PaywallModal
  | ConfirmSignatureModal
  | AddEmailModal
  | DowngradeModal
  | SearchCustomDomainModal
  | PlanDelinquencyModal
  | FilterModal
  | BulkUnsubscribeModal;

/******** Type Guards ***********/
export const isAttachmentPreviewModal = (modal: Modals | undefined): modal is AttachmentsPreviewModal =>
  modal?.type === ModalType.AttachmentPreview;
export const isCreateOrEditLabelOrFolderModal = (modal: Modals | undefined): modal is CreateOrEditLabelOrFolderModal =>
  modal?.type === ModalType.CreateOrEditLabelOrFolder;
export const isUnSendModal = (modal: Modals | undefined): modal is UnSendModal =>
  modal?.type === ModalType.UnSendMessage;
export const isFilterModal = (modal: Modals | undefined): modal is FilterModal => modal?.type === ModalType.Filter;
