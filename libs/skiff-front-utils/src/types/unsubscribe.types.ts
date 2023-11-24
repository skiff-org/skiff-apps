export interface UnsubscribeLinks {
  mailto?: {
    address: string;
    subject?: string;
    body?: string;
  };
  httpLink?: string;
}

export interface UnsubscribeInfo {
  links: UnsubscribeLinks;
  senderToUnsubscribeFrom: string;
  recipient: string;
}
