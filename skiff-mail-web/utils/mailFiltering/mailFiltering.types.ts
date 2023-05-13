import { SystemLabels } from 'skiff-graphql';

export interface UserLabelIDToThreadIDs {
  [userLabelID: string]: string[];
}

export type SystemLabelToThreadIDs = Partial<{
  [key in SystemLabels]: string[];
}>;

export interface EmailAliases {
  to: string[];
  cc: string[];
  bcc: string[];
  from: string;
}

export interface ThreadIDToActions {
  [threadID: string]: {
    labelIDsToApply: string[];
    systemLabelsToApply: string[];
    markAsRead: boolean;
  };
}
