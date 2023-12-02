export interface ErrorHandlerMetadata {
  lastUpdated?: number;
  calendarID: string;
  parentEventID?: string;
  errorID: string;
  message: string[];
  emailID?: string;
  count: number;
}
