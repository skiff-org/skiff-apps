export interface EventToRecover {
  parentEventID: string; // PK
  tryCount: number;
  createdAt: number;
}
