import { AddressObject } from '../../generated/graphql';
import { UserLabel } from '../../utils/label';

/**
 * This file keeps track of all the different types of modals that we have in the app.
 * If you want to create a new modal:
 *  1. create a new `ModalType`
 *  2. create a new interface that includes the type that you just added
 *  3. added the new interface to the exported `Modals` type at the bottom of this file
 */

export enum ModalType {
  CreateOrEditUserLabel,
  CommandPalette,
  ReportPhishingOrConcern,
  BlockUnblockSender,
  SkemailWelcome,
  Logout
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
export interface CreateOrEditUserLabelModal {
  type: ModalType.CreateOrEditUserLabel;
  // The threads the newly created label will be added to
  threadIDs?: string[];
  label?: UserLabel;
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

export type Modals =
  | CommandPaletteModal
  | SkemailWelcomeModal
  | CreateOrEditUserLabelModal
  | ReportPhishingOrConcernModal
  | BlockUnblockSenderModal
  | LogoutModal;
