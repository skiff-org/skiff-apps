export enum MobileAppEventTypes {
  SetPushNotification = 'setPushNotification',
  AndroidBackPress = 'androidBackPress',
  AppState = 'appState'
}

interface AndroidBackPress {
  type: MobileAppEventTypes.AndroidBackPress;
  payload: Record<string, never>;
}

interface SetPushNotification {
  type: MobileAppEventTypes.SetPushNotification;
  payload: {
    deviceID: string;
    token: string;
    os: string;
  };
}

export enum AppState {
  Active = 'active',
  Background = 'background',
  Inactive = 'inactive',
  Unknown = 'unknown',
  Extension = 'extension'
}
interface AppStateEvent {
  type: MobileAppEventTypes.AppState;
  payload: AppState;
}

export enum PrivateUserDataVersion {
  V0 // privateKey, signingPrivateKey, documentKey
}
export type MobileAppEvent = SetPushNotification | AndroidBackPress | AppStateEvent;
