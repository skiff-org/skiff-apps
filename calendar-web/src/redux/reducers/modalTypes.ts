export enum CalendarModalType {
  Logout,
  SaveDraft,
  Settings,
  Feedback,
  QrCode,
  DiscardEventChanges
}

/******** Logout ***********/
export interface LogoutModal {
  type: CalendarModalType.Logout;
}

/******** Participant Invite Or Update ***********/

// Different reasons we would email the participants of an event
export enum EventActionType {
  EventUpdate = 'EVENT_UPDATE',
  EventDeletion = 'EVENT_DELETION',
  AttendeeUninvited = 'ATTENDEE_UNINVITED'
}

export enum SaveDraftModalRecurringAction {
  ThisEvent = 'THIS_EVENT',
  AllEvents = 'ALL_EVENTS',
  ThisAndFutureEvents = 'THIS_AND_FUTURE_EVENTS'
}

export enum SaveDraftModalSaveAction {
  Save = 'SAVE',
  Cancel = 'CANCEL',
  SaveWithoutSending = 'SAVE_WITHOUT_SENDING',
  NotOpened = 'NOT_OPENED'
}

export type SaveDraftModalResponse = {
  saveAction: SaveDraftModalSaveAction;
  recurringAction?: SaveDraftModalRecurringAction;
};

export interface SaveDraftModel {
  type: CalendarModalType.SaveDraft;
  callback: (response: SaveDraftModalResponse) => void;
  isDelete: boolean;
}

/******** Settings ***********/
export interface SettingsModal {
  type: CalendarModalType.Settings;
}

/******** Feedback Modal ***********/
export interface FeedbackModal {
  type: CalendarModalType.Feedback;
}

/******** Qr Code Modal ***********/
export interface QrCodeModal {
  type: CalendarModalType.QrCode;
  title: string;
  description: string;
  link: string;
  buttonProps?: { label: string; onClick: () => void };
}

/******** Discard Event Changes ***********/
export interface DiscardEventChangesModal {
  type: CalendarModalType.DiscardEventChanges;
}

export type CalendarModal =
  | LogoutModal
  | SaveDraftModel
  | SettingsModal
  | FeedbackModal
  | QrCodeModal
  | DiscardEventChangesModal;

/**
 * Type guards for CalendarModal
 */

export const isSaveDraftModal = (modal: CalendarModal | undefined): modal is SaveDraftModel =>
  modal?.type === CalendarModalType.SaveDraft;
