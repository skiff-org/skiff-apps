export interface CalendarMetadata {
  lastUpdated?: number;
  calendarID: string;
  encryptedPrivateKey: string | undefined;
  encryptedByKey: string;
  publicKey: string;
  initializedLocalDB: boolean;
}
