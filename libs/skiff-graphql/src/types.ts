export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type PublicKey = Scalars['PublicKey']
export type SocketEvent = Scalars['SocketEvent']
export type PublicKeyWithSignature = Scalars['PublicKeyWithSignature']

/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  Date: Date;
  ExternalAttendeeType: any;
  InternalAttendeeType: any;
  JSON: Record<any, any>;
  PublicKey: { key: string, signature?: string };
  PublicKeyWithSignature: { key: string, signature: string };
  SocketEvent: { eventType: EventType, eventContent: any, token?: string };
  Upload: any;
  Void: any;
  join__FieldSet: any;
  link__Import: any;
};

export enum AccentColor {
  Blue = 'BLUE',
  DarkBlue = 'DARK_BLUE',
  Green = 'GREEN',
  Orange = 'ORANGE',
  Pink = 'PINK',
  Red = 'RED',
  Yellow = 'YELLOW'
}

export type AcceptInviteStep1Request = {
  docID: Scalars['String'];
  inviteID: Scalars['String'];
};

export type AcceptInviteStep1Response = {
  __typename?: 'AcceptInviteStep1Response';
  encryptedPrivateHierarchicalKey: Scalars['String'];
  encryptedSessionKey: Scalars['String'];
  permissionLevel: PermissionLevel;
  publicHierarchicalKey?: Maybe<Scalars['String']>;
  salt: Scalars['String'];
  serverEphemeralPublic: Scalars['String'];
};

export type AcceptInviteStep2Request = {
  clientEphemeralPublic: Scalars['String'];
  clientSessionProof: Scalars['String'];
  docID: Scalars['String'];
  inviteID: Scalars['String'];
  newPermissionEntry: PermissionEntryInput;
  publicHierarchicalKey?: InputMaybe<Scalars['String']>;
  signature: Scalars['String'];
};

export type AcceptInviteStep2Response = {
  __typename?: 'AcceptInviteStep2Response';
  serverSessionProof: Scalars['String'];
};

export enum AccountRecovery {
  EmailSendFailed = 'EMAIL_SEND_FAILED',
  InvalidRecoveryKey = 'INVALID_RECOVERY_KEY',
  NotVerifiedEmail = 'NOT_VERIFIED_EMAIL',
  SentEmail = 'SENT_EMAIL',
  VerifiedEmail = 'VERIFIED_EMAIL',
  VerifiedRecoveryKey = 'VERIFIED_RECOVERY_KEY'
}

export enum ActionType {
  ApplyLabel = 'APPLY_LABEL',
  ApplySystemLabel = 'APPLY_SYSTEM_LABEL',
  MarkAsRead = 'MARK_AS_READ'
}

export type AddEmailRequest = {
  newEmail?: InputMaybe<Scalars['String']>;
  token?: InputMaybe<Scalars['String']>;
};

export type AddEmailResponse = {
  __typename?: 'AddEmailResponse';
  status: RequestStatus;
};

export type AddPendingInviteRequest = {
  docID: Scalars['String'];
  documentLink: Scalars['String'];
  email: Scalars['String'];
  permissionLevel: PermissionLevel;
};

export type AddPendingInviteResponse = {
  __typename?: 'AddPendingInviteResponse';
  status: RequestStatus;
};

export enum AdditionalContext {
  LastChunk = 'LAST_CHUNK',
  NotLastChunk = 'NOT_LAST_CHUNK',
  NoContext = 'NO_CONTEXT'
}

export type AddressObject = {
  __typename?: 'AddressObject';
  address: Scalars['String'];
  blocked?: Maybe<Scalars['Boolean']>;
  name?: Maybe<Scalars['String']>;
};

export type AdjustBusinessPlanRequest = {
  requestedQuantity: Scalars['Int'];
};

export type AdjustBusinessPlanResponse = {
  __typename?: 'AdjustBusinessPlanResponse';
  seats?: Maybe<Scalars['Int']>;
  status: RequestStatus;
};

export type AliasesOnDomainResponse = {
  __typename?: 'AliasesOnDomainResponse';
  domainAliases: Array<DomainAliasData>;
};

export enum AscDesc {
  Asc = 'ASC',
  Desc = 'DESC'
}

export type Attachment = {
  __typename?: 'Attachment';
  attachmentID: Scalars['String'];
  decryptedSessionKey?: Maybe<Scalars['String']>;
  downloadLink: Scalars['String'];
  encryptedSessionKey: EncryptedSessionKeyOutput;
};

export type AttachmentMetadata = {
  __typename?: 'AttachmentMetadata';
  checksum: Scalars['String'];
  contentDisposition: Scalars['String'];
  contentId: Scalars['String'];
  contentType: Scalars['String'];
  filename: Scalars['String'];
  size: Scalars['Int'];
};

export enum AttendeePermission {
  Owner = 'OWNER',
  Read = 'READ',
  Write = 'WRITE'
}

export enum AttendeeStatus {
  Maybe = 'MAYBE',
  No = 'NO',
  Pending = 'PENDING',
  Yes = 'YES'
}

export type AutoImportStatus = {
  __typename?: 'AutoImportStatus';
  subscribed: Scalars['Boolean'];
};

export type AutoReplyOutput = {
  __typename?: 'AutoReplyOutput';
  encryptedHtml: EncryptedDataOutput;
  encryptedSessionKey: EncryptedSessionKeyOutput;
  encryptedSubject: EncryptedDataOutput;
  encryptedText: EncryptedDataOutput;
  encryptedTextAsHtml: EncryptedDataOutput;
  encryptedTextSnippet?: Maybe<EncryptedDataOutput>;
};

export type BatchError = {
  __typename?: 'BatchError';
  code: Scalars['String'];
  extensions?: Maybe<Scalars['JSON']>;
  message: Scalars['String'];
};

export type BlockEmailAddressRequest = {
  emailAddressToBlock?: InputMaybe<Scalars['String']>;
};

export enum BottomDrawerModes {
  Closed = 'CLOSED',
  Feedback = 'FEEDBACK',
  Uploads = 'UPLOADS'
}

export enum CacheControlScope {
  Private = 'PRIVATE',
  Public = 'PUBLIC'
}

export type Calendar = {
  __typename?: 'Calendar';
  calendarID: Scalars['String'];
  publicKey: Scalars['String'];
};

export type CalendarEvent = {
  __typename?: 'CalendarEvent';
  calendarEventID: Scalars['String'];
  calendarID: Scalars['String'];
  creatorCalendarID: Scalars['String'];
  deleted: Scalars['Boolean'];
  encryptedByKey: Scalars['String'];
  encryptedContent: Scalars['String'];
  encryptedPreferences?: Maybe<Scalars['String']>;
  encryptedPreferencesSessionKey?: Maybe<Scalars['String']>;
  encryptedSessionKey: Scalars['String'];
  endDate: Scalars['Date'];
  externalCreator?: Maybe<Scalars['String']>;
  externalID: Scalars['String'];
  internalAttendeeList: Array<InternalAttendee>;
  lastUpdateKeyMap?: Maybe<LastUpdateKeyMap>;
  parentEventID: Scalars['String'];
  parentRecurrenceID?: Maybe<Scalars['String']>;
  recurrenceDate?: Maybe<Scalars['Date']>;
  recurrenceRule?: Maybe<RecurrenceRule>;
  sequence: Scalars['Int'];
  startDate: Scalars['Date'];
  updatedAt: Scalars['Date'];
};

export type CalendarEventData = {
  deleted: Scalars['Boolean'];
  encryptedCalendarEventSessionKey?: InputMaybe<Scalars['String']>;
  encryptedContent: Scalars['String'];
  encryptedPreferences?: InputMaybe<Scalars['String']>;
  endDate: Scalars['Date'];
  externalID: Scalars['String'];
  lastUpdateKeyMap?: InputMaybe<LastUpdateKeyMapInput>;
  parentRecurrenceID?: InputMaybe<Scalars['String']>;
  recurrenceDate?: InputMaybe<Scalars['Date']>;
  recurrenceRule?: InputMaybe<RecurrenceRuleInput>;
  startDate: Scalars['Date'];
};

export type CalendarEventData2 = {
  deleted: Scalars['Boolean'];
  encryptedCalendarEventSessionKey?: InputMaybe<Scalars['String']>;
  encryptedContent: Scalars['String'];
  encryptedPreferences?: InputMaybe<Scalars['String']>;
  endDate: Scalars['Date'];
  externalID: Scalars['String'];
  lastUpdateKeyMap?: InputMaybe<LastUpdateKeyMapInput>;
  parentRecurrenceID?: InputMaybe<Scalars['String']>;
  recurrenceDate?: InputMaybe<Scalars['Date']>;
  recurrenceRule?: InputMaybe<RecurrenceRuleInput>;
  sequence: Scalars['Int'];
  startDate: Scalars['Date'];
};

export type ChangeLinkPermissionRequest = {
  docID: Scalars['String'];
  permissionLevel: PermissionLevel;
};

export type ChangeLinkPermissionResponse = {
  __typename?: 'ChangeLinkPermissionResponse';
  document: Document;
};

export type CheckIfDomainsAvailableResponse = {
  __typename?: 'CheckIfDomainsAvailableResponse';
  domains?: Maybe<Array<Domain>>;
};

export type CheckoutSession = {
  __typename?: 'CheckoutSession';
  downgradeProgress?: Maybe<DowngradeProgress>;
  status: RequestStatus;
  url?: Maybe<Scalars['String']>;
};

export type ClearSessionCacheResponse = {
  __typename?: 'ClearSessionCacheResponse';
  status: RequestStatus;
};

export type ConfirmCacheUploadRequest = {
  cacheID: Scalars['String'];
};

export type ConfirmCacheUploadResponse = {
  __typename?: 'ConfirmCacheUploadResponse';
  ipfsPath?: Maybe<Scalars['String']>;
  readUrl?: Maybe<Scalars['String']>;
};

export type Contact = {
  __typename?: 'Contact';
  displayPictureData?: Maybe<DisplayPictureDataSkemail>;
  emailAddress: Scalars['String'];
  firstName?: Maybe<Scalars['String']>;
  lastName?: Maybe<Scalars['String']>;
};

export type CreateBillingPortalSessionOutput = {
  __typename?: 'CreateBillingPortalSessionOutput';
  url?: Maybe<Scalars['String']>;
};

export type CreateCacheElementRequest = {
  dataSize: Scalars['Float'];
  docID: Scalars['String'];
  type: Scalars['String'];
};

export type CreateCacheElementResponse = {
  __typename?: 'CreateCacheElementResponse';
  cacheID: Scalars['String'];
  writeUrl: Scalars['String'];
};

export type CreateCalendarUserRequest = {
  calendarEncryptedPrivateKey?: InputMaybe<Scalars['String']>;
  calendarPublicKey: Scalars['String'];
  publicKey: Scalars['PublicKeyWithSignature'];
  signingPublicKey: Scalars['PublicKey'];
};

export type CreateCustomDomainAliasRequest = {
  customDomain: Scalars['String'];
  emailAlias: Scalars['String'];
  userID?: InputMaybe<Scalars['String']>;
};

export type CreateCustomDomainAliasResponse = {
  __typename?: 'CreateCustomDomainAliasResponse';
  emailAliases: Array<Scalars['String']>;
};

export type CreateEmailAliasRequest = {
  customDomain?: InputMaybe<Scalars['String']>;
  emailAlias: Scalars['String'];
};

export type CreateEmailAliasResponse = {
  __typename?: 'CreateEmailAliasResponse';
  emailAliases: Array<Scalars['String']>;
};

export type CreateMailFilterInput = {
  actions: Array<FilterActionInput>;
  encryptedByKey: Scalars['String'];
  encryptedSessionKey: Scalars['String'];
  filter: MailFilterInput;
  name?: InputMaybe<Scalars['String']>;
};

export type CreateOrUpdateContactRequest = {
  displayPictureData?: InputMaybe<UpdateDisplayPictureSkemailRequest>;
  emailAddress: Scalars['String'];
  firstName?: InputMaybe<Scalars['String']>;
  lastName?: InputMaybe<Scalars['String']>;
};

export type CreateOrUpdateDraftRequest = {
  draftID: Scalars['String'];
  encryptedDraft: Scalars['String'];
  encryptedKey: Scalars['String'];
};

export type CreateSrpMetamaskRequest = {
  acceptInviteStep2Request?: InputMaybe<AcceptInviteStep2Request>;
  captchaToken: Scalars['String'];
  challengeJwt: Scalars['String'];
  challengeSignature: Scalars['String'];
  encryptedUserData: Scalars['String'];
  platformInfo?: InputMaybe<PlatformInfo>;
  publicKey: Scalars['PublicKey'];
  salt: Scalars['String'];
  signingPublicKey: Scalars['String'];
  userAttributionData: UserAttributionInput;
  verifier: Scalars['String'];
  walletAddress: Scalars['String'];
};

export type CreateSrpRequest = {
  acceptInviteStep2Request?: InputMaybe<AcceptInviteStep2Request>;
  captchaToken: Scalars['String'];
  encryptedUserData: Scalars['String'];
  platformInfo?: InputMaybe<PlatformInfo>;
  publicKey: Scalars['PublicKey'];
  salt: Scalars['String'];
  signingPublicKey: Scalars['String'];
  skiffMailAlias?: InputMaybe<Scalars['String']>;
  udToken?: InputMaybe<Scalars['String']>;
  userAttributionData: UserAttributionInput;
  verifier: Scalars['String'];
};

export type CreateSrpResponse = {
  __typename?: 'CreateSrpResponse';
  cacheKey?: Maybe<Scalars['String']>;
  createdMailAccount?: Maybe<Scalars['Boolean']>;
  email?: Maybe<Scalars['String']>;
  jwt?: Maybe<Scalars['String']>;
  recoveryEmail?: Maybe<Scalars['String']>;
  rootOrgID?: Maybe<Scalars['String']>;
  status: LoginMutationStatus;
  userID?: Maybe<Scalars['String']>;
  walletAddress?: Maybe<Scalars['String']>;
};

export type CreateTeamRequest = {
  everyoneDocumentPermissionProxy: DocumentPermissionProxyInput;
  icon: Scalars['String'];
  name: Scalars['String'];
  orgID: Scalars['String'];
  rootDocument: NewDocRequest;
};

export type CreateUdAliasRequest = {
  udToken: Scalars['String'];
};

export type CreateUploadAvatarLinkResponse = {
  __typename?: 'CreateUploadAvatarLinkResponse';
  profileCustomURI: Scalars['String'];
  writeUrl: Scalars['String'];
};

export type CreateUploadContactAvatarLinkRequest = {
  contactEmail: Scalars['String'];
};

export type CreateUserLabelRequest = {
  color: Scalars['String'];
  labelName: Scalars['String'];
  variant: UserLabelVariant;
};

export type CreateWalletChallengeRequest = {
  walletAddress: Scalars['String'];
};

export type CreateWalletChallengeRequestSkemail = {
  walletAddress: Scalars['String'];
};

export type CreateWalletChallengeResponse = {
  __typename?: 'CreateWalletChallengeResponse';
  token: Scalars['String'];
};

export type CreateWalletChallengeResponseSkemail = {
  __typename?: 'CreateWalletChallengeResponseSkemail';
  token: Scalars['String'];
};

export type CreditAmount = {
  __typename?: 'CreditAmount';
  cents: Scalars['Int'];
  editorStorageBytes: Scalars['String'];
  skemailStorageBytes: Scalars['String'];
};

export type CreditAmountInput = {
  cents: Scalars['Int'];
  editorStorageBytes: Scalars['String'];
  skemailStorageBytes: Scalars['String'];
};

export enum CreditInfo {
  CreditsFromAndroidApp = 'CREDITS_FROM_ANDROID_APP',
  CreditsFromGmailImport = 'CREDITS_FROM_GMAIL_IMPORT',
  CreditsFromGoogleDriveImports = 'CREDITS_FROM_GOOGLE_DRIVE_IMPORTS',
  CreditsFromIosApp = 'CREDITS_FROM_IOS_APP',
  CreditsFromMacApp = 'CREDITS_FROM_MAC_APP',
  CreditsFromOutlookImport = 'CREDITS_FROM_OUTLOOK_IMPORT',
  CreditsFromReferrals = 'CREDITS_FROM_REFERRALS',
  CurrentCredits = 'CURRENT_CREDITS',
  TotalCreditsEarned = 'TOTAL_CREDITS_EARNED'
}

export type CreditInfoResponse = {
  __typename?: 'CreditInfoResponse';
  amount: CreditAmount;
  count: Scalars['Int'];
  info: CreditInfo;
};

export enum CreditTransactionReason {
  AndroidApp = 'ANDROID_APP',
  EnsName = 'ENS_NAME',
  GmailImport = 'GMAIL_IMPORT',
  GoogleDriveImport = 'GOOGLE_DRIVE_IMPORT',
  IosApp = 'IOS_APP',
  MacApp = 'MAC_APP',
  Manual = 'MANUAL',
  OutlookImport = 'OUTLOOK_IMPORT',
  RedeemedStripeCoupon = 'REDEEMED_STRIPE_COUPON',
  Referee = 'REFEREE',
  Referral = 'REFERRAL',
  RevertSkiffCreditCouponProration = 'REVERT_SKIFF_CREDIT_COUPON_PRORATION',
  SkiffCreditCouponProration = 'SKIFF_CREDIT_COUPON_PRORATION',
  StripeCredit = 'STRIPE_CREDIT',
  StripeDebit = 'STRIPE_DEBIT'
}

export type CurrentlyEditingUser = {
  __typename?: 'CurrentlyEditingUser';
  color: Scalars['String'];
  displayPictureData?: Maybe<DisplayPictureData>;
  name: Scalars['String'];
  userID: Scalars['String'];
};

export type CustomDomainRecord = {
  __typename?: 'CustomDomainRecord';
  createdAt: Scalars['Date'];
  dnsRecords: Array<DnsRecord>;
  domain: Scalars['String'];
  domainID: Scalars['String'];
  skiffManaged: Scalars['Boolean'];
  verificationStatus: Scalars['String'];
};

export type CustomDomainSubscriptionInfo = {
  __typename?: 'CustomDomainSubscriptionInfo';
  cancelAtPeriodEnd: Scalars['Boolean'];
  domainID: Scalars['String'];
  supposedEndDate: Scalars['Date'];
};

export type DnsRecord = {
  __typename?: 'DNSRecord';
  data: Scalars['String'];
  error?: Maybe<DnsRecordStatusError>;
  name: Scalars['String'];
  type: DnsRecordType;
};

export enum DnsRecordType {
  Cname = 'CNAME',
  Mx = 'MX',
  Txt = 'TXT'
}

export enum DateFormat {
  DdMmYyyy = 'DD_MM_YYYY',
  MmDdYyyy = 'MM_DD_YYYY',
  YyyyMmDd = 'YYYY_MM_DD'
}

export type DecryptedAttachment = {
  __typename?: 'DecryptedAttachment';
  attachmentID: Scalars['String'];
  decryptedMetadata?: Maybe<AttachmentMetadata>;
};

export type DefaultDisplayPictureData = {
  __typename?: 'DefaultDisplayPictureData';
  profilePictureData: Scalars['String'];
};

export type DeleteAccountRequest = {
  loginSrpRequest: LoginSrpRequest;
  signature: Scalars['String'];
};

export type DeleteAccountResponse = {
  __typename?: 'DeleteAccountResponse';
  status: RequestStatus;
};

export type DeleteContactRequest = {
  emailAddress: Scalars['String'];
};

export type DeleteCustomDomainAliasRequest = {
  captchaToken: Scalars['String'];
  emailAlias: Scalars['String'];
  userID?: InputMaybe<Scalars['String']>;
};

export type DeleteCustomDomainRequest = {
  domainID: Scalars['String'];
};

export type DeleteDocRequest = {
  docsToDelete: Array<DocToDelete>;
};

export type DeleteDocResponse = {
  __typename?: 'DeleteDocResponse';
  status: RequestStatus;
};

export type DeleteDraftRequest = {
  draftID: Scalars['String'];
};

export type DeleteInviteRequest = {
  docID: Scalars['String'];
  email: Scalars['String'];
};

export type DeleteInviteResponse = {
  __typename?: 'DeleteInviteResponse';
  status: RequestStatus;
};

export type DeleteLinkRequest = {
  docID: Scalars['String'];
};

export type DeleteLinkResponse = {
  __typename?: 'DeleteLinkResponse';
  status: RequestStatus;
};

export type DeleteMailAccountRequest = {
  signature: Scalars['String'];
};

export type DeleteMailAccountResponse = {
  __typename?: 'DeleteMailAccountResponse';
  status: RequestStatus;
};

export type DeleteMailFilterInput = {
  mailFilterID: Scalars['String'];
};

export type DeleteSnapshotRequest = {
  docID: Scalars['String'];
  versions: Array<Scalars['Int']>;
};

export type DeleteSnapshotResponse = {
  __typename?: 'DeleteSnapshotResponse';
  document?: Maybe<Document>;
};

export type DeleteTeamRequest = {
  teamID: Scalars['String'];
};

export type DeleteThreadRequest = {
  threadIDs: Array<Scalars['String']>;
};

export type DeleteUserLabelRequest = {
  labelID: Scalars['String'];
};

export type DeleteUserOrganizationMembershipRequest = {
  orgID: Scalars['String'];
  userID: Scalars['String'];
};

export type DisableEmailAutoForwardingRequest = {
  client: EmailAutoForwardingClient;
};

export type DisableMfaRequest = {
  credentialID?: InputMaybe<Scalars['String']>;
  disableTotp: Scalars['Boolean'];
  loginSrpRequest: LoginSrpRequest;
};

export type DisableMfaResponse = {
  __typename?: 'DisableMfaResponse';
  status: RequestStatus;
};

export type DisplayPictureData = {
  __typename?: 'DisplayPictureData';
  profileAccentColor?: Maybe<Scalars['String']>;
  profileCustomURI?: Maybe<Scalars['String']>;
  profileIcon?: Maybe<Scalars['String']>;
};

export type DisplayPictureDataSkemail = {
  __typename?: 'DisplayPictureDataSkemail';
  profileAccentColor?: Maybe<Scalars['String']>;
  profileCustomURI?: Maybe<Scalars['String']>;
  profileIcon?: Maybe<Scalars['String']>;
};

export type DnsRecordStatusError = {
  __typename?: 'DnsRecordStatusError';
  errorData?: Maybe<DnsRecordStatusErrorData>;
  errorType: Scalars['String'];
};

export type DnsRecordStatusErrorData = {
  __typename?: 'DnsRecordStatusErrorData';
  retrievedRecord?: Maybe<SingleRetrievedRecord>;
};

export type DocToDelete = {
  docID: Scalars['String'];
  signature: Scalars['String'];
};

export type Document = {
  __typename?: 'Document';
  collaborators: Array<DocumentCollaborator>;
  contents: EncryptedContentsOutput;
  createdAt?: Maybe<Scalars['Date']>;
  currentUserPermissionLevel: PermissionLevel;
  currentlyEditingUsers: Array<Maybe<CurrentlyEditingUser>>;
  decryptedContents: DocumentDecryptedContents;
  decryptedMetadata: DocumentDecryptedMetadata;
  decryptedPrivateHierarchicalKey?: Maybe<Scalars['String']>;
  decryptedSessionKey: Scalars['String'];
  docID: Scalars['String'];
  documentType: NwContentType;
  hasChildren: Scalars['Boolean'];
  hierarchicalPermissionChain: Array<HierarchicalPermissionChainLink>;
  invites: Array<PendingUserInvite>;
  link?: Maybe<LinkOutput>;
  metadata: EncryptedMetadataOutput;
  newHierarchicalKeyRequired: Scalars['Boolean'];
  newSessionKeyRequired: Scalars['Boolean'];
  parentID?: Maybe<Scalars['String']>;
  parentKeysClaim?: Maybe<Scalars['String']>;
  parentKeysClaimEncryptedByKey?: Maybe<Scalars['String']>;
  parentPublicHierarchicalKey?: Maybe<Scalars['String']>;
  parentsBreadcrumb: Array<Document>;
  permissionProxies: Array<DocumentPermissionProxy>;
  previousParentID?: Maybe<Scalars['String']>;
  publicHierarchicalKey?: Maybe<Scalars['String']>;
  publicOrgData?: Maybe<Array<Maybe<PublicOrgData>>>;
  snapshots: Array<DocumentSnapshot>;
  team?: Maybe<Team>;
  trashedAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['Date']>;
};

export type DocumentCollaborator = {
  __typename?: 'DocumentCollaborator';
  expiryDate?: Maybe<Scalars['Date']>;
  permissionLevel: PermissionLevel;
  sourceDocID: Scalars['String'];
  user: User;
};

export type DocumentDecryptedContents = {
  __typename?: 'DocumentDecryptedContents';
  contentsArr: Array<DocumentDecryptedContentsChunk>;
};

export type DocumentDecryptedContentsChunk = {
  __typename?: 'DocumentDecryptedContentsChunk';
  chunkData: Scalars['JSON'];
  chunkNumber: Scalars['Int'];
};

export type DocumentDecryptedMetadata = {
  __typename?: 'DocumentDecryptedMetadata';
  color?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  fileSizeBytes?: Maybe<Scalars['Int']>;
  icon?: Maybe<Scalars['String']>;
  mimeType?: Maybe<Scalars['String']>;
  timeLastModified?: Maybe<Scalars['Date']>;
  title: Scalars['String'];
};

export enum DocumentEventType {
  CommentReply = 'COMMENT_REPLY',
  DocumentEdit = 'DOCUMENT_EDIT',
  DocumentShare = 'DOCUMENT_SHARE',
  NewComment = 'NEW_COMMENT',
  NewCommentMention = 'NEW_COMMENT_MENTION',
  NewMention = 'NEW_MENTION'
}

export enum DocumentOperation {
  Delete = 'DELETE',
  Save = 'SAVE',
  Share = 'SHARE',
  Unshare = 'UNSHARE',
  UpgradeKeys = 'UPGRADE_KEYS'
}

export type DocumentPermissionProxy = {
  __typename?: 'DocumentPermissionProxy';
  sourceDocID: Scalars['String'];
  sourceDocPublicHierarchicalKey: Scalars['String'];
  sourceKeysClaim: Scalars['String'];
  sourceTeam: Team;
};

export type DocumentPermissionProxyInput = {
  sourceDocID: Scalars['String'];
  sourceDocPublicHierarchicalKey: Scalars['String'];
  sourceKeysClaim: Scalars['String'];
  sourceKeysClaimEncryptedByKey: Scalars['String'];
  targetDocID: Scalars['String'];
  targetDocPublicHierarchicalKey: Scalars['String'];
};

export type DocumentSnapshot = {
  __typename?: 'DocumentSnapshot';
  createdAt: Scalars['Date'];
  data: Scalars['String'];
  decryptedData: Scalars['JSON'];
  decryptedKey: Scalars['String'];
  hierarchicalPermissionChain: Array<HierarchicalPermissionChainLink>;
  version: Scalars['Int'];
};

export enum DocumentVisibility {
  All = 'ALL',
  Drive = 'DRIVE',
  Pages = 'PAGES'
}

export type Domain = {
  __typename?: 'Domain';
  available: Scalars['Boolean'];
  currency?: Maybe<Scalars['String']>;
  domain: Scalars['String'];
  period?: Maybe<Scalars['Int']>;
  price?: Maybe<Scalars['Float']>;
};

export type DomainAliasData = {
  __typename?: 'DomainAliasData';
  displayEmailAlias: Scalars['String'];
  emailAlias?: Maybe<Scalars['String']>;
  isCatchall: Scalars['Boolean'];
  userID: Scalars['String'];
};

export type DomainDetails = {
  __typename?: 'DomainDetails';
  domain: Scalars['String'];
  expiresAt: Scalars['String'];
  renewAuto: Scalars['Boolean'];
  renewalDetails: RenewalDetails;
  status: Scalars['String'];
};

export type DowngradeProgress = {
  __typename?: 'DowngradeProgress';
  currentStorageInMb: Scalars['Int'];
  customDomains: Scalars['Int'];
  emailAliases: Scalars['Int'];
  shortAliases: Scalars['Int'];
  userFolders: Scalars['Int'];
  userLabels: Scalars['Int'];
  userMailFilters: Scalars['Int'];
  workspaceUsers: Scalars['Int'];
};

export type Draft = {
  __typename?: 'Draft';
  draftID: Scalars['String'];
  encryptedDraft: Scalars['String'];
  encryptedKey: Scalars['String'];
  updatedAt?: Maybe<Scalars['Date']>;
};

export type EditOrganizationRequest = {
  displayPictureData?: InputMaybe<UpdateDisplayPictureRequest>;
  name?: InputMaybe<Scalars['String']>;
  orgID: Scalars['String'];
};

export type EditOrganizationResponse = {
  __typename?: 'EditOrganizationResponse';
  organization: Organization;
};

export type EditTeamRequest = {
  icon?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  teamID: Scalars['String'];
};

export type EditUserLabelRequest = {
  color?: InputMaybe<Scalars['String']>;
  labelID: Scalars['String'];
  labelName?: InputMaybe<Scalars['String']>;
  variant?: InputMaybe<UserLabelVariant>;
};

export type Email = {
  __typename?: 'Email';
  attachmentMetadata: Array<EncryptedAttachmentMetadata>;
  bcc: Array<AddressObject>;
  cc: Array<AddressObject>;
  createdAt: Scalars['Date'];
  decryptedAttachmentMetadata?: Maybe<Array<DecryptedAttachment>>;
  decryptedHtml?: Maybe<Scalars['String']>;
  decryptedRawMime?: Maybe<Scalars['String']>;
  decryptedSessionKey?: Maybe<Scalars['String']>;
  decryptedSubject?: Maybe<Scalars['String']>;
  decryptedText?: Maybe<Scalars['String']>;
  decryptedTextAsHtml?: Maybe<Scalars['String']>;
  decryptedTextSnippet?: Maybe<Scalars['String']>;
  encryptedHtml: EncryptedDataOutput;
  encryptedRawMimeUrl?: Maybe<Scalars['String']>;
  encryptedSessionKey: EncryptedSessionKeyOutput;
  encryptedSubject: EncryptedDataOutput;
  encryptedText: EncryptedDataOutput;
  encryptedTextAsHtml: EncryptedDataOutput;
  encryptedTextSnippet?: Maybe<EncryptedDataOutput>;
  from: AddressObject;
  id: Scalars['String'];
  replyTo?: Maybe<AddressObject>;
  scheduleSendAt?: Maybe<Scalars['Date']>;
  threadID?: Maybe<Scalars['String']>;
  to: Array<AddressObject>;
};

export enum EmailAutoForwardingClient {
  Gmail = 'Gmail',
  Outlook = 'Outlook'
}

/** The user's email auto-forwarding settings for a given external email client. */
export type EmailAutoForwardingClientSettings = {
  __typename?: 'EmailAutoForwardingClientSettings';
  enabled: Scalars['Boolean'];
};

export type EmailAutoForwardingSettings = {
  __typename?: 'EmailAutoForwardingSettings';
  gmail: EmailAutoForwardingClientSettings;
  outlook: EmailAutoForwardingClientSettings;
};

export type EmailsWithUnreadIcsResponse = {
  __typename?: 'EmailsWithUnreadICSResponse';
  emails: Array<Email>;
  hasMore: Scalars['Boolean'];
};

export type EnableEmailAutoForwardingRequest = {
  client: EmailAutoForwardingClient;
  code: Scalars['String'];
};

export type EncryptedAttachmentInput = {
  encryptedContent: EncryptedFileInput;
  encryptedMetadata: EncryptedDataInput;
};

export type EncryptedAttachmentMetadata = {
  __typename?: 'EncryptedAttachmentMetadata';
  attachmentID: Scalars['String'];
  encryptedData: EncryptedDataOutput;
  encryptedFileSizeBytes?: Maybe<Scalars['Int']>;
};

export type EncryptedChunk = {
  chunkNumber: Scalars['Int'];
  content: Scalars['String'];
  signature: Scalars['String'];
  signedBy: Scalars['String'];
};

export type EncryptedChunkOutput = {
  __typename?: 'EncryptedChunkOutput';
  chunkNumber: Scalars['Int'];
  content: Scalars['String'];
  signature: Scalars['String'];
  signedBy: Scalars['String'];
};

export type EncryptedContents = {
  contentsArr: Array<EncryptedChunk>;
};

export type EncryptedContentsOutput = {
  __typename?: 'EncryptedContentsOutput';
  contentsArr: Array<EncryptedChunkOutput>;
};

export type EncryptedDataInput = {
  encryptedData: Scalars['String'];
};

export type EncryptedDataOutput = {
  __typename?: 'EncryptedDataOutput';
  encryptedData: Scalars['String'];
};

export type EncryptedFileInput = {
  encryptedFile: Scalars['Upload'];
};

export type EncryptedMetadata = {
  encryptedMetadata: Scalars['String'];
  signature: Scalars['String'];
  signedBy: Scalars['String'];
};

export type EncryptedMetadataOutput = {
  __typename?: 'EncryptedMetadataOutput';
  encryptedMetadata: Scalars['String'];
  signature: Scalars['String'];
  signedBy: Scalars['String'];
};

export type EncryptedSessionKeyInput = {
  encryptedBy: Scalars['PublicKey'];
  encryptedSessionKey: Scalars['String'];
};

export type EncryptedSessionKeyOutput = {
  __typename?: 'EncryptedSessionKeyOutput';
  encryptedBy: Scalars['PublicKey'];
  encryptedSessionKey: Scalars['String'];
};

export type EnrollMfaRequest = {
  dataMFA: Scalars['String'];
  loginSrpRequest: LoginSrpRequest;
  signature: Scalars['String'];
};

export type EnrollMfaResponse = {
  __typename?: 'EnrollMfaResponse';
  backupCodes: Array<Scalars['String']>;
  status: RequestStatus;
};

export enum EntityType {
  Org = 'ORG',
  User = 'USER'
}

export type EventAroundDateInput = {
  calendarID: Scalars['String'];
  date: Scalars['Date'];
};

export enum EventType {
  ActiveStatus = 'ACTIVE_STATUS',
  DeleteDocument = 'DELETE_DOCUMENT',
  DocumentRestore = 'DOCUMENT_RESTORE',
  DocumentUpdate = 'DOCUMENT_UPDATE',
  FilesystemUpdate = 'FILESYSTEM_UPDATE',
  JoinDocumentRoom = 'JOIN_DOCUMENT_ROOM',
  LeaveDocumentRoom = 'LEAVE_DOCUMENT_ROOM',
  Logout = 'LOGOUT',
  MetadataUpdate = 'METADATA_UPDATE',
  ShareDocument = 'SHARE_DOCUMENT',
  UnshareDocument = 'UNSHARE_DOCUMENT'
}

export enum EventUpdateType {
  Content = 'Content',
  Preferences = 'Preferences',
  Rsvp = 'RSVP'
}

export type EventsInput = {
  calendarID: Scalars['String'];
  eventsIDs: Array<Scalars['String']>;
};

export type FilesystemNode = {
  docID: Scalars['String'];
};

export type FilterAction = {
  __typename?: 'FilterAction';
  actionType: ActionType;
  serializedData?: Maybe<Scalars['String']>;
};

export type FilterActionInput = {
  actionType: ActionType;
  serializedData?: InputMaybe<Scalars['String']>;
};

export enum FilterField {
  Contains = 'CONTAINS'
}

export enum FilterType {
  And = 'AND',
  Bcc = 'BCC',
  Body = 'BODY',
  Cc = 'CC',
  From = 'FROM',
  Not = 'NOT',
  Or = 'OR',
  Recipient = 'RECIPIENT',
  Subject = 'SUBJECT',
  To = 'TO'
}

export type GenerateCustomDomainRecordsRequest = {
  domain: Scalars['String'];
};

export type GenerateCustomDomainRecordsResponse = {
  __typename?: 'GenerateCustomDomainRecordsResponse';
  dkimRecords: Array<DnsRecord>;
  dmarcRecord: DnsRecord;
  domainID: Scalars['String'];
  mxRecords: Array<DnsRecord>;
  spfRecords: DnsRecord;
};

export type GenerateDocPublicLinkAuthTokenStep1Request = {
  docID: Scalars['String'];
};

export type GenerateDocPublicLinkAuthTokenStep1Response = {
  __typename?: 'GenerateDocPublicLinkAuthTokenStep1Response';
  salt: Scalars['String'];
  serverEphemeralPublic: Scalars['String'];
};

export type GenerateDocPublicLinkAuthTokenStep2Request = {
  clientEphemeralPublic: Scalars['String'];
  clientSessionProof: Scalars['String'];
  docID: Scalars['String'];
  serverEphemeralPublic: Scalars['String'];
};

export type GenerateDocPublicLinkAuthTokenStep2Response = {
  __typename?: 'GenerateDocPublicLinkAuthTokenStep2Response';
  encryptedPrivateHierarchicalKey: Scalars['String'];
  jwt: Scalars['String'];
  serverSessionProof: Scalars['String'];
};

export type GenerateWebAuthnChallengeResponse = {
  __typename?: 'GenerateWebAuthnChallengeResponse';
  options: Scalars['JSON'];
};

export type GenerateWebAuthnRegistrationResponse = {
  __typename?: 'GenerateWebAuthnRegistrationResponse';
  options: Scalars['JSON'];
};

export type GetAliasValidRequest = {
  alias: Scalars['String'];
};

export type GetBillingPortalSessionRequest = {
  redirectURL?: InputMaybe<Scalars['String']>;
};

export type GetCheckoutSessionRequest = {
  interval: SubscriptionInterval;
  redirectURL?: InputMaybe<Scalars['String']>;
  subscriptionPlan: SubscriptionPlan;
};

export type GetCoinbaseCheckoutIdRequest = {
  plan: SubscriptionPlan;
};

export type GetCoinbaseCheckoutIdResponse = {
  __typename?: 'GetCoinbaseCheckoutIDResponse';
  coinbaseCheckoutID: Scalars['String'];
};

export type GetContactsRequest = {
  emailAddresses: Array<Scalars['String']>;
};

export type GetCreditsRequest = {
  entityID: Scalars['String'];
  entityType: EntityType;
  include: Array<CreditInfo>;
};

export type GetCreditsResponse = {
  __typename?: 'GetCreditsResponse';
  credits: Array<CreditInfoResponse>;
};

export type GetCurrentUserCustomDomainsResponse = {
  __typename?: 'GetCurrentUserCustomDomainsResponse';
  domains: Array<CustomDomainRecord>;
};

export type GetCustomDomainCheckoutSessionRequest = {
  customDomain: Scalars['String'];
  redirectURL?: InputMaybe<Scalars['String']>;
};

export type GetDefaultProfilePictureRequest = {
  messageID: Scalars['String'];
};

export type GetDocumentRequest = {
  docID: Scalars['String'];
};

export type GetDocumentsRequest = {
  activeProductApp: ProductApp;
  docIDs?: InputMaybe<Array<Scalars['String']>>;
  manuallySharedOnRootDocumentsOfOrgRootDocumentID?: InputMaybe<Scalars['String']>;
  parentID?: InputMaybe<Scalars['String']>;
  personalRootDocuments?: InputMaybe<Scalars['Boolean']>;
  sharedOnRootDocuments?: InputMaybe<Scalars['Boolean']>;
  trashedChildren?: InputMaybe<Scalars['Boolean']>;
};

export type GetDomainSuggestionsResponse = {
  __typename?: 'GetDomainSuggestionsResponse';
  domains?: Maybe<Array<Scalars['String']>>;
};

export type GetMailFiltersInput = {
  clientside?: InputMaybe<Scalars['Boolean']>;
};

export type GetMboxImportUrlRequest = {
  fileSizeInBytes: Scalars['Int'];
};

export type GetMboxImportUrlResponse = {
  __typename?: 'GetMboxImportUrlResponse';
  fileID: Scalars['String'];
  uploadData: Scalars['String'];
};

export type GetRecoveryPublicKeysAndDataRequest = {
  username: Scalars['String'];
};

export type GetSearchIndexProgressRequest = {
  newestThreadUpdatedAtInIndex: Scalars['Date'];
  oldestThreadUpdatedAtInIndex: Scalars['Date'];
};

export type GetTemplatesRequest = {
  templatesIDs?: InputMaybe<Array<Scalars['String']>>;
};

export type GetUserRequest = {
  challengeJwt?: InputMaybe<Scalars['String']>;
  challengeSignature?: InputMaybe<Scalars['String']>;
  emailPasscode?: InputMaybe<Scalars['String']>;
  isNotLoggedIn?: InputMaybe<Scalars['Boolean']>;
  paperShareHash?: InputMaybe<Scalars['String']>;
  userID?: InputMaybe<Scalars['String']>;
  username?: InputMaybe<Scalars['String']>;
};

export type GetUsersRequest = {
  userIDs: Array<Scalars['String']>;
};

export type GetValidPaperShareHashRequest = {
  paperShareHash: Scalars['String'];
  username: Scalars['String'];
};

export type GrantCreditsRequest = {
  creditAmount: CreditAmountInput;
  creditTransactionReason: CreditTransactionReason;
};

export type GrantCreditsResponse = {
  __typename?: 'GrantCreditsResponse';
  creditsGranted: CreditAmount;
  remainingCreditsToEarnForReason: CreditAmount;
};

export type HierarchicalPermissionChainLink = {
  __typename?: 'HierarchicalPermissionChainLink';
  docID: Scalars['String'];
  encryptedSessionKey?: Maybe<Scalars['String']>;
  encryptedSessionKeyEncryptedByKey?: Maybe<Scalars['String']>;
  keysClaim?: Maybe<Scalars['String']>;
  keysClaimEncryptedByKey?: Maybe<Scalars['String']>;
  permission?: Maybe<PermissionEntry>;
  previousLinkDocID?: Maybe<Scalars['String']>;
};

export enum ImportClients {
  Gmail = 'Gmail',
  Outlook = 'Outlook'
}

export type ImportEmlEmailRequest = {
  emlFiles: Array<Scalars['Upload']>;
  role?: InputMaybe<Role>;
};

export type ImportGmailRequest = {
  code: Scalars['String'];
  subscribeToAutoImport?: InputMaybe<Scalars['Boolean']>;
};

export type ImportMboxRequest = {
  fileID: Scalars['String'];
};

export type IndexableDocument = {
  __typename?: 'IndexableDocument';
  docID: Scalars['String'];
  updatedAt: Scalars['Date'];
};

export type InternalAttendee = {
  __typename?: 'InternalAttendee';
  calendarID: Scalars['String'];
  deleted: Scalars['Boolean'];
  displayName?: Maybe<Scalars['String']>;
  email: Scalars['String'];
  encryptedByKey: Scalars['String'];
  encryptedSessionKey: Scalars['String'];
  optional: Scalars['Boolean'];
  permission: AttendeePermission;
  status: AttendeeStatus;
  updatedAt: Scalars['Date'];
};

export type InternalAttendeeInput = {
  calendarID: Scalars['String'];
  deleted: Scalars['Boolean'];
  displayName?: InputMaybe<Scalars['String']>;
  email: Scalars['String'];
  encryptedByKey: Scalars['String'];
  encryptedSessionKey: Scalars['String'];
  optional: Scalars['Boolean'];
  permission: AttendeePermission;
  status: AttendeeStatus;
  updatedAt: Scalars['Date'];
};

export type Invoice = {
  __typename?: 'Invoice';
  amountDue?: Maybe<Scalars['Int']>;
  created?: Maybe<Scalars['Date']>;
  invoiceTiers?: Maybe<Array<Scalars['String']>>;
  status?: Maybe<Scalars['String']>;
  url?: Maybe<Scalars['String']>;
};

export type InvoiceHistory = {
  __typename?: 'InvoiceHistory';
  invoiceHistory?: Maybe<Array<Maybe<Invoice>>>;
};

export type LastUpdateKeyMap = {
  __typename?: 'LastUpdateKeyMap';
  deleted?: Maybe<Scalars['Date']>;
  endDate?: Maybe<Scalars['Date']>;
  parentRecurrenceID?: Maybe<Scalars['Date']>;
  recurrenceDate?: Maybe<Scalars['Date']>;
  recurrenceRule?: Maybe<Scalars['Date']>;
  sequence?: Maybe<Scalars['Date']>;
  startDate?: Maybe<Scalars['Date']>;
};

export type LastUpdateKeyMapInput = {
  deleted?: InputMaybe<Scalars['Date']>;
  endDate?: InputMaybe<Scalars['Date']>;
  parentRecurrenceID?: InputMaybe<Scalars['Date']>;
  recurrenceDate?: InputMaybe<Scalars['Date']>;
  recurrenceRule?: InputMaybe<Scalars['Date']>;
  sequence?: InputMaybe<Scalars['Date']>;
  startDate?: InputMaybe<Scalars['Date']>;
};

export type LastViewedReferralCreditResponse = {
  __typename?: 'LastViewedReferralCreditResponse';
  amount: CreditAmount;
  count: Scalars['Int'];
};

export type LinkOutput = {
  __typename?: 'LinkOutput';
  decryptedLinkKey: Scalars['String'];
  encryptedLinkKey: Scalars['String'];
  permissionLevel: PermissionLevel;
  salt: Scalars['String'];
};

export enum LoginMutationStatus {
  Authenticated = 'AUTHENTICATED',
  AuthFailure = 'AUTH_FAILURE',
  ChangeTemporaryPassword = 'CHANGE_TEMPORARY_PASSWORD',
  Created = 'CREATED',
  InvalidJwt = 'INVALID_JWT',
  Rejected = 'REJECTED',
  TokenNeeded = 'TOKEN_NEEDED',
  Updated = 'UPDATED',
  UsernameInvalid = 'USERNAME_INVALID',
  WebauthnTokenNeeded = 'WEBAUTHN_TOKEN_NEEDED'
}

export type LoginSrpRequest = {
  captchaToken?: InputMaybe<Scalars['String']>;
  clientEphemeralPublic?: InputMaybe<Scalars['String']>;
  clientSessionProof?: InputMaybe<Scalars['String']>;
  platformInfo?: InputMaybe<PlatformInfo>;
  step: Scalars['Int'];
  tokenMFA?: InputMaybe<Scalars['String']>;
  username: Scalars['String'];
  verifyWebAuthnData?: InputMaybe<Scalars['JSON']>;
};

export type LoginSrpResponse = {
  __typename?: 'LoginSrpResponse';
  cacheKey?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  encryptedDocumentData?: Maybe<Scalars['String']>;
  encryptedMetamaskSecret?: Maybe<Scalars['String']>;
  encryptedUserData?: Maybe<Scalars['String']>;
  jwt?: Maybe<Scalars['String']>;
  mfaTypes?: Maybe<Array<Scalars['String']>>;
  publicData?: Maybe<PublicData>;
  publicKey?: Maybe<Scalars['PublicKey']>;
  recoveryEmail?: Maybe<Scalars['String']>;
  rootOrgID?: Maybe<Scalars['String']>;
  salt?: Maybe<Scalars['String']>;
  serverEphemeralPublic?: Maybe<Scalars['String']>;
  serverSessionProof?: Maybe<Scalars['String']>;
  signingPublicKey?: Maybe<Scalars['String']>;
  status?: Maybe<LoginMutationStatus>;
  unverifiedRecoveryEmail?: Maybe<Scalars['String']>;
  userID?: Maybe<Scalars['String']>;
  walletAddress?: Maybe<Scalars['String']>;
  webAuthnChallengeResponse?: Maybe<GenerateWebAuthnChallengeResponse>;
};

export type MfaFactors = {
  __typename?: 'MFAFactors';
  backupCodes?: Maybe<Array<Scalars['String']>>;
  totpData?: Maybe<Scalars['String']>;
  webAuthnKeys?: Maybe<Array<WebAuthnKey>>;
};

export enum MfaTypes {
  BackupCode = 'BACKUP_CODE',
  Totp = 'TOTP',
  Webauthn = 'WEBAUTHN'
}

export type MailFilter = {
  __typename?: 'MailFilter';
  actions: Array<FilterAction>;
  clientside: Scalars['Boolean'];
  encryptedByKey?: Maybe<Scalars['String']>;
  encryptedSessionKey?: Maybe<Scalars['String']>;
  filter: MailFilterField;
  mailFilterID: Scalars['String'];
  name?: Maybe<Scalars['String']>;
};

export type MailFilterField = {
  __typename?: 'MailFilterField';
  filterField?: Maybe<FilterField>;
  filterType: FilterType;
  serializedData?: Maybe<Scalars['String']>;
  subFilter?: Maybe<Array<MailFilterField>>;
};

export type MailFilterInput = {
  filterField?: InputMaybe<FilterField>;
  filterType: FilterType;
  serializedData?: InputMaybe<Scalars['String']>;
  subFilter?: InputMaybe<Array<MailFilterInput>>;
};

export type Mailbox = {
  __typename?: 'Mailbox';
  pageInfo: MailboxPageInfo;
  threads: Array<UserThread>;
};

export type MailboxCursor = {
  date: Scalars['Date'];
  threadID: Scalars['String'];
};

export type MailboxCursorResponse = {
  __typename?: 'MailboxCursorResponse';
  date: Scalars['Date'];
  threadID: Scalars['String'];
};

export type MailboxFilters = {
  attachments?: InputMaybe<Scalars['Boolean']>;
  read?: InputMaybe<Scalars['Boolean']>;
};

export type MailboxPageInfo = {
  __typename?: 'MailboxPageInfo';
  cursor?: Maybe<MailboxCursorResponse>;
  hasNextPage: Scalars['Boolean'];
};

export type MailboxRequest = {
  clientsideFiltersApplied?: InputMaybe<Scalars['Boolean']>;
  cursor?: InputMaybe<MailboxCursor>;
  /** @deprecated Use lastUpdatedDate instead */
  emailsUpdatedAfterDate?: InputMaybe<Scalars['Date']>;
  /** @deprecated Use lastUpdatedDate instead */
  emailsUpdatedBeforeDate?: InputMaybe<Scalars['Date']>;
  filters?: InputMaybe<MailboxFilters>;
  isAliasInbox?: InputMaybe<Scalars['Boolean']>;
  label?: InputMaybe<Scalars['String']>;
  lastUpdatedDate?: InputMaybe<Scalars['Date']>;
  limit?: InputMaybe<Scalars['Int']>;
  noExcludedLabel?: InputMaybe<Scalars['Boolean']>;
  platformInfo?: InputMaybe<PlatformInfo>;
  polling?: InputMaybe<Scalars['Boolean']>;
  refetching?: InputMaybe<Scalars['Boolean']>;
  updatedAtOrderDirection?: InputMaybe<AscDesc>;
  useUpdatedAtField?: InputMaybe<Scalars['Boolean']>;
};

export type ManageOrganizationPaymentDetailsRequest = {
  orgID: Scalars['String'];
};

export type ManageOrganizationPaymentDetailsResponse = {
  __typename?: 'ManageOrganizationPaymentDetailsResponse';
  redirectURL: Scalars['String'];
};

export type MarkEmailAsReadIcsRequest = {
  emailIDs: Array<Scalars['String']>;
  reason?: InputMaybe<Scalars['String']>;
};

export type MarkThreadsAsClientsideFilteredInput = {
  threadIDs: Array<Scalars['String']>;
};

export type ModifyLabelsRequest = {
  systemLabels?: InputMaybe<Array<SystemLabels>>;
  threadIDs: Array<Scalars['String']>;
  userLabels?: InputMaybe<Array<Scalars['String']>>;
};

export type ModifyLabelsResponse = {
  __typename?: 'ModifyLabelsResponse';
  updatedThreads: Array<UpdatedThreadLabels>;
};

export type MoveDocRequest = {
  activeProductApp: ProductApp;
  currentEncryptedSessionKey: Scalars['String'];
  currentPublicHierarchicalKey: Scalars['String'];
  docID: Scalars['String'];
  newParentID: Scalars['String'];
  newParentKeysClaim: Scalars['String'];
  newParentKeysClaimEncryptedByKey: Scalars['String'];
  publicHierarchicalKeyOfParent: Scalars['String'];
};

export type MoveDocResponse = {
  __typename?: 'MoveDocResponse';
  document: Document;
};

export type Mutation = {
  __typename?: 'Mutation';
  acceptInviteStep1: AcceptInviteStep1Response;
  addEmail: AddEmailResponse;
  addPendingInvite: AddPendingInviteResponse;
  adjustBusinessPlan: AdjustBusinessPlanResponse;
  applyLabels?: Maybe<ModifyLabelsResponse>;
  blockEmailAddress?: Maybe<Scalars['Void']>;
  changeLinkPermission: ChangeLinkPermissionResponse;
  clearSessionCache: ClearSessionCacheResponse;
  confirmCacheUpload: ConfirmCacheUploadResponse;
  createCacheElement: CreateCacheElementResponse;
  createCalendarUser?: Maybe<Scalars['Void']>;
  createCustomDomainAlias?: Maybe<CreateCustomDomainAliasResponse>;
  createEmailAlias?: Maybe<CreateEmailAliasResponse>;
  createMailFilter?: Maybe<Scalars['Void']>;
  createOrUpdateContact?: Maybe<Scalars['Void']>;
  createOrUpdateDraft?: Maybe<Scalars['Void']>;
  createOrgUploadAvatarLink: CreateUploadAvatarLinkResponse;
  createSrp: CreateSrpResponse;
  createSrpMetamask: CreateSrpResponse;
  createTeam: Team;
  createUdAlias?: Maybe<CreateEmailAliasResponse>;
  createUploadAvatarLink: CreateUploadAvatarLinkResponse;
  createUploadContactAvatarLink: CreateUploadAvatarLinkResponse;
  createUserLabel?: Maybe<UserLabel>;
  createWalletChallenge: CreateWalletChallengeResponse;
  createWalletChallengeSkemail: CreateWalletChallengeResponseSkemail;
  deleteAccount: DeleteAccountResponse;
  deleteAutoReply?: Maybe<Scalars['Void']>;
  deleteContact?: Maybe<Scalars['Void']>;
  deleteCustomDomain?: Maybe<Scalars['Void']>;
  deleteCustomDomainAlias?: Maybe<Scalars['Void']>;
  deleteDoc: DeleteDocResponse;
  deleteDraft?: Maybe<Scalars['Void']>;
  deleteInvite: DeleteInviteResponse;
  deleteLink: DeleteLinkResponse;
  deleteMailAccount: DeleteMailAccountResponse;
  deleteMailFilter?: Maybe<Scalars['Void']>;
  deleteRecoveryEmail: Scalars['Boolean'];
  deleteSnapshot: DeleteSnapshotResponse;
  deleteTeam: Scalars['Boolean'];
  deleteThread?: Maybe<Scalars['Void']>;
  deleteUserLabel?: Maybe<Scalars['Void']>;
  deleteUserOrganizationMembership: Scalars['Boolean'];
  deleteUserSignature?: Maybe<Scalars['Void']>;
  disableEmailAutoForwarding?: Maybe<Scalars['Void']>;
  disableMfa: DisableMfaResponse;
  editOrganization: EditOrganizationResponse;
  editTeam: Team;
  editUserLabel?: Maybe<UserLabel>;
  enableEmailAutoForwarding?: Maybe<Scalars['Void']>;
  enrollMfa: EnrollMfaResponse;
  generateCustomDomainRecords: GenerateCustomDomainRecordsResponse;
  generateDocPublicLinkAuthTokenStep1: GenerateDocPublicLinkAuthTokenStep1Response;
  generateDocPublicLinkAuthTokenStep2: GenerateDocPublicLinkAuthTokenStep2Response;
  generateWebAuthnChallenge?: Maybe<GenerateWebAuthnChallengeResponse>;
  generateWebAuthnRegistration: GenerateWebAuthnRegistrationResponse;
  getMboxImportUrl?: Maybe<GetMboxImportUrlResponse>;
  grantCredits: GrantCreditsResponse;
  importEmlEmail?: Maybe<Scalars['Void']>;
  importGmailEmails?: Maybe<Scalars['Void']>;
  importMboxEmails?: Maybe<Scalars['Void']>;
  importOutlookEmails?: Maybe<Scalars['Void']>;
  loginSrp: LoginSrpResponse;
  manageOrganizationPaymentDetails: ManageOrganizationPaymentDetailsResponse;
  markCurrentUserOnboardedWorkspaceMigration?: Maybe<Scalars['Void']>;
  markEmailAsReadICS?: Maybe<Scalars['Void']>;
  markThreadsAsClientsideFiltered?: Maybe<Scalars['Void']>;
  moveDoc: MoveDocResponse;
  moveMultipleDoc: Array<MoveDocResponse>;
  newMultipleDocs: Array<NewDocResponse>;
  notificationClicked?: Maybe<Scalars['Boolean']>;
  provisionSrp: Scalars['Boolean'];
  purchaseCustomDomain: PurchaseCustomDomainResponse;
  referUser: ReferUserResponse;
  regenerateMfaBackupCodes: RegenerateMfaBackupCodesResponse;
  removeLabels?: Maybe<ModifyLabelsResponse>;
  replyToMessage?: Maybe<ReplyToEmailResponse>;
  resetAccount?: Maybe<Scalars['Boolean']>;
  restoreTrashDoc: MoveDocResponse;
  saveContents: SaveContentsResponse;
  saveCustomDomainRecords?: Maybe<Scalars['Void']>;
  saveMetadata: SaveMetadataResponse;
  sendAccessRequestEmail: Scalars['Boolean'];
  sendDocumentEvent?: Maybe<Scalars['Boolean']>;
  sendFeedback: Scalars['Boolean'];
  sendMessage?: Maybe<SendEmailResponse>;
  setAllThreadsReadStatus: Scalars['Boolean'];
  setAutoReply?: Maybe<Scalars['Void']>;
  setAutoSyncContactsSetting?: Maybe<Scalars['Void']>;
  setCalendarPushToken?: Maybe<Scalars['Void']>;
  setCatchallAddress: Scalars['Boolean'];
  setDefaultEmailAlias: Scalars['Boolean'];
  setLastViewedReferralCredit: Scalars['Boolean'];
  setNotificationPreferences?: Maybe<Scalars['Boolean']>;
  setPDSubscribeFlag?: Maybe<Scalars['Void']>;
  setPushToken?: Maybe<Scalars['Void']>;
  setReadStatus?: Maybe<SetReadStatusResponse>;
  setUseIPFS: SetUseIpfsResponse;
  setUserPreferences?: Maybe<UserPreferences>;
  setUserPublicKey?: Maybe<Scalars['Void']>;
  setUserSignature?: Maybe<Scalars['Void']>;
  setupLink: SetupLinkResponse;
  setupProvisionedUser: LoginSrpResponse;
  shareDoc: ShareDocResponse;
  shareTeamDocWithOtherTeam: Team;
  storeUnauthenticatedWorkspaceEvent: Scalars['Boolean'];
  storeWorkspaceEvent: Scalars['Boolean'];
  subscribeNotification?: Maybe<Scalars['Void']>;
  /** @deprecated Added sequence, use sync2 instead */
  sync?: Maybe<SyncResponse>;
  sync2?: Maybe<SyncResponse>;
  trashDocs: Array<MoveDocResponse>;
  unblockEmailAddress?: Maybe<Scalars['Void']>;
  unsendMessage?: Maybe<Email>;
  unsetCalendarPushToken?: Maybe<Scalars['Void']>;
  unsetPushToken?: Maybe<Scalars['Void']>;
  unshareDoc: UnshareDocResponse;
  unshareTeamDocWithOtherTeam: Team;
  unsubscribeFromGmailImport?: Maybe<Scalars['Void']>;
  unsubscribeNotification?: Maybe<Scalars['Void']>;
  updateDisplayName: UpdateDisplayNameResponse;
  updateDisplayPicture: User;
  updateDocumentData: UpdateDocumentDataResponse;
  updateEmailAliasActiveState?: Maybe<UpdateEmailAliasActiveStateResponse>;
  updateMailFilter?: Maybe<Scalars['Void']>;
  updateSrp: UpdateSrpResponse;
  updateUploadContactAvatarLink: UpdateUploadContactAvatarLinkResponse;
  upgradeHierarchicalKeys: UpgradeHierarchicalKeysResponse;
  upgradeKey: UpgradeKeyResponse;
  uploadRecoveryData: UploadRecoveryDataResponse;
  uploadSpamReport?: Maybe<Scalars['Void']>;
  verifyCustomDomain?: Maybe<Scalars['Void']>;
  verifyWalletAddressCreateAlias: CreateEmailAliasResponse;
  verifyWebAuthnRegistration: VerifyWebAuthnRegistrationResponse;
};


export type MutationAcceptInviteStep1Args = {
  request: AcceptInviteStep1Request;
};


export type MutationAddEmailArgs = {
  request: AddEmailRequest;
};


export type MutationAddPendingInviteArgs = {
  request: AddPendingInviteRequest;
};


export type MutationAdjustBusinessPlanArgs = {
  request: AdjustBusinessPlanRequest;
};


export type MutationApplyLabelsArgs = {
  request?: InputMaybe<ModifyLabelsRequest>;
};


export type MutationBlockEmailAddressArgs = {
  request?: InputMaybe<BlockEmailAddressRequest>;
};


export type MutationChangeLinkPermissionArgs = {
  request: ChangeLinkPermissionRequest;
};


export type MutationConfirmCacheUploadArgs = {
  request: ConfirmCacheUploadRequest;
};


export type MutationCreateCacheElementArgs = {
  request: CreateCacheElementRequest;
};


export type MutationCreateCalendarUserArgs = {
  request: CreateCalendarUserRequest;
};


export type MutationCreateCustomDomainAliasArgs = {
  request?: InputMaybe<CreateCustomDomainAliasRequest>;
};


export type MutationCreateEmailAliasArgs = {
  request?: InputMaybe<CreateEmailAliasRequest>;
};


export type MutationCreateMailFilterArgs = {
  input: CreateMailFilterInput;
};


export type MutationCreateOrUpdateContactArgs = {
  request: CreateOrUpdateContactRequest;
};


export type MutationCreateOrUpdateDraftArgs = {
  request: CreateOrUpdateDraftRequest;
};


export type MutationCreateSrpArgs = {
  request: CreateSrpRequest;
};


export type MutationCreateSrpMetamaskArgs = {
  request: CreateSrpMetamaskRequest;
};


export type MutationCreateTeamArgs = {
  request: CreateTeamRequest;
};


export type MutationCreateUdAliasArgs = {
  request?: InputMaybe<CreateUdAliasRequest>;
};


export type MutationCreateUploadContactAvatarLinkArgs = {
  request: CreateUploadContactAvatarLinkRequest;
};


export type MutationCreateUserLabelArgs = {
  request?: InputMaybe<CreateUserLabelRequest>;
};


export type MutationCreateWalletChallengeArgs = {
  request: CreateWalletChallengeRequest;
};


export type MutationCreateWalletChallengeSkemailArgs = {
  request: CreateWalletChallengeRequestSkemail;
};


export type MutationDeleteAccountArgs = {
  request: DeleteAccountRequest;
};


export type MutationDeleteContactArgs = {
  request: DeleteContactRequest;
};


export type MutationDeleteCustomDomainArgs = {
  request: DeleteCustomDomainRequest;
};


export type MutationDeleteCustomDomainAliasArgs = {
  request?: InputMaybe<DeleteCustomDomainAliasRequest>;
};


export type MutationDeleteDocArgs = {
  request: DeleteDocRequest;
};


export type MutationDeleteDraftArgs = {
  request: DeleteDraftRequest;
};


export type MutationDeleteInviteArgs = {
  request: DeleteInviteRequest;
};


export type MutationDeleteLinkArgs = {
  request: DeleteLinkRequest;
};


export type MutationDeleteMailAccountArgs = {
  deleteRequest: DeleteMailAccountRequest;
};


export type MutationDeleteMailFilterArgs = {
  input: DeleteMailFilterInput;
};


export type MutationDeleteSnapshotArgs = {
  request: DeleteSnapshotRequest;
};


export type MutationDeleteTeamArgs = {
  request: DeleteTeamRequest;
};


export type MutationDeleteThreadArgs = {
  request?: InputMaybe<DeleteThreadRequest>;
};


export type MutationDeleteUserLabelArgs = {
  request?: InputMaybe<DeleteUserLabelRequest>;
};


export type MutationDeleteUserOrganizationMembershipArgs = {
  request: DeleteUserOrganizationMembershipRequest;
};


export type MutationDisableEmailAutoForwardingArgs = {
  request: DisableEmailAutoForwardingRequest;
};


export type MutationDisableMfaArgs = {
  request: DisableMfaRequest;
};


export type MutationEditOrganizationArgs = {
  request: EditOrganizationRequest;
};


export type MutationEditTeamArgs = {
  request: EditTeamRequest;
};


export type MutationEditUserLabelArgs = {
  request?: InputMaybe<EditUserLabelRequest>;
};


export type MutationEnableEmailAutoForwardingArgs = {
  request: EnableEmailAutoForwardingRequest;
};


export type MutationEnrollMfaArgs = {
  request: EnrollMfaRequest;
};


export type MutationGenerateCustomDomainRecordsArgs = {
  request: GenerateCustomDomainRecordsRequest;
};


export type MutationGenerateDocPublicLinkAuthTokenStep1Args = {
  request: GenerateDocPublicLinkAuthTokenStep1Request;
};


export type MutationGenerateDocPublicLinkAuthTokenStep2Args = {
  request: GenerateDocPublicLinkAuthTokenStep2Request;
};


export type MutationGetMboxImportUrlArgs = {
  getImportUrlRequest: GetMboxImportUrlRequest;
};


export type MutationGrantCreditsArgs = {
  request: GrantCreditsRequest;
};


export type MutationImportEmlEmailArgs = {
  importRequest: ImportEmlEmailRequest;
};


export type MutationImportGmailEmailsArgs = {
  request: ImportGmailRequest;
};


export type MutationImportMboxEmailsArgs = {
  importMboxRequest: ImportMboxRequest;
};


export type MutationImportOutlookEmailsArgs = {
  code: Scalars['String'];
};


export type MutationLoginSrpArgs = {
  request: LoginSrpRequest;
};


export type MutationManageOrganizationPaymentDetailsArgs = {
  request: ManageOrganizationPaymentDetailsRequest;
};


export type MutationMarkEmailAsReadIcsArgs = {
  request: MarkEmailAsReadIcsRequest;
};


export type MutationMarkThreadsAsClientsideFilteredArgs = {
  input: MarkThreadsAsClientsideFilteredInput;
};


export type MutationMoveDocArgs = {
  request: MoveDocRequest;
};


export type MutationMoveMultipleDocArgs = {
  request: Array<MoveDocRequest>;
};


export type MutationNewMultipleDocsArgs = {
  request: Array<NewDocRequest>;
};


export type MutationNotificationClickedArgs = {
  request: NotificationClickedRequest;
};


export type MutationProvisionSrpArgs = {
  request: ProvisionSrpRequest;
};


export type MutationPurchaseCustomDomainArgs = {
  request: PurchaseCustomDomainRequest;
};


export type MutationReferUserArgs = {
  request: ReferUserRequest;
};


export type MutationRegenerateMfaBackupCodesArgs = {
  request: RegenerateMfaBackupCodesRequest;
};


export type MutationRemoveLabelsArgs = {
  request?: InputMaybe<ModifyLabelsRequest>;
};


export type MutationReplyToMessageArgs = {
  message?: InputMaybe<ReplyToEmailRequest>;
};


export type MutationResetAccountArgs = {
  request: ResetAccountRequest;
};


export type MutationRestoreTrashDocArgs = {
  request: TrashDocRequest;
};


export type MutationSaveContentsArgs = {
  request: SaveContentsRequest;
};


export type MutationSaveCustomDomainRecordsArgs = {
  request: SaveCustomDomainRequest;
};


export type MutationSaveMetadataArgs = {
  request: SaveMetadataRequest;
};


export type MutationSendAccessRequestEmailArgs = {
  request: SendAccessRequestEmailRequest;
};


export type MutationSendDocumentEventArgs = {
  request: SendDocumentEventRequest;
};


export type MutationSendFeedbackArgs = {
  request: SendFeedbackRequest;
};


export type MutationSendMessageArgs = {
  message?: InputMaybe<SendEmailRequest>;
};


export type MutationSetAllThreadsReadStatusArgs = {
  request: SetAllThreadsReadStatusRequest;
};


export type MutationSetAutoReplyArgs = {
  request?: InputMaybe<SetAutoReplyRequest>;
};


export type MutationSetAutoSyncContactsSettingArgs = {
  value: Scalars['Boolean'];
};


export type MutationSetCalendarPushTokenArgs = {
  request: SetCalendarPushTokenRequest;
};


export type MutationSetCatchallAddressArgs = {
  request: SetCatchallAddressRequest;
};


export type MutationSetDefaultEmailAliasArgs = {
  request?: InputMaybe<SetDefaultEmailAliasRequest>;
};


export type MutationSetLastViewedReferralCreditArgs = {
  request: SetLastViewedReferralCreditRequest;
};


export type MutationSetNotificationPreferencesArgs = {
  request: SetNotificationPreferencesRequest;
};


export type MutationSetPdSubscribeFlagArgs = {
  request?: InputMaybe<SetPdSubscribeFlagRequest>;
};


export type MutationSetPushTokenArgs = {
  request?: InputMaybe<SetPushTokenRequest>;
};


export type MutationSetReadStatusArgs = {
  request?: InputMaybe<SetReadStatusRequest>;
};


export type MutationSetUseIpfsArgs = {
  request: SetUseIpfsRequest;
};


export type MutationSetUserPreferencesArgs = {
  request: SetUserPreferencesRequest;
};


export type MutationSetUserPublicKeyArgs = {
  request?: InputMaybe<SetUserPublicKeyRequest>;
};


export type MutationSetUserSignatureArgs = {
  request?: InputMaybe<SetUserSignatureRequest>;
};


export type MutationSetupLinkArgs = {
  request: SetupLinkRequest;
};


export type MutationSetupProvisionedUserArgs = {
  request: SetupProvisionedUserRequest;
};


export type MutationShareDocArgs = {
  request: ShareDocRequest;
};


export type MutationShareTeamDocWithOtherTeamArgs = {
  request: ShareTeamDocWithOtherTeamRequest;
};


export type MutationStoreUnauthenticatedWorkspaceEventArgs = {
  request: WorkspaceEventRequest;
};


export type MutationStoreWorkspaceEventArgs = {
  request: WorkspaceEventRequest;
};


export type MutationSubscribeNotificationArgs = {
  request?: InputMaybe<SubscribeNotificationRequest>;
};


export type MutationSyncArgs = {
  request: SyncRequest;
};


export type MutationSync2Args = {
  request: SyncRequest2;
};


export type MutationTrashDocsArgs = {
  request: Array<TrashDocRequest>;
};


export type MutationUnblockEmailAddressArgs = {
  request?: InputMaybe<UnblockEmailAddressRequest>;
};


export type MutationUnsendMessageArgs = {
  message?: InputMaybe<UnsendEmailRequest>;
};


export type MutationUnsetCalendarPushTokenArgs = {
  request: UnsetCalendarPushTokenRequest;
};


export type MutationUnsetPushTokenArgs = {
  request?: InputMaybe<UnsetPushTokenRequest>;
};


export type MutationUnshareDocArgs = {
  request: UnshareDocRequest;
};


export type MutationUnshareTeamDocWithOtherTeamArgs = {
  request: UnshareTeamDocWithOtherTeamRequest;
};


export type MutationUpdateDisplayNameArgs = {
  request: UpdateDisplayNameRequest;
};


export type MutationUpdateDisplayPictureArgs = {
  request: UpdateDisplayPictureRequest;
};


export type MutationUpdateDocumentDataArgs = {
  request: UpdateDocumentDataRequest;
};


export type MutationUpdateEmailAliasActiveStateArgs = {
  request?: InputMaybe<UpdateEmailAliasActiveStateRequest>;
};


export type MutationUpdateMailFilterArgs = {
  input: UpdateMailFilterInput;
};


export type MutationUpdateSrpArgs = {
  request: UpdateSrpRequest;
};


export type MutationUpdateUploadContactAvatarLinkArgs = {
  request: UpdateUploadContactAvatarLinkRequest;
};


export type MutationUpgradeHierarchicalKeysArgs = {
  request: UpgradeHierarchicalKeysRequest;
};


export type MutationUpgradeKeyArgs = {
  request: UpgradeKeyRequest;
};


export type MutationUploadRecoveryDataArgs = {
  request: UploadRecoveryDataRequest;
};


export type MutationUploadSpamReportArgs = {
  request: UploadSpamReportRequest;
};


export type MutationVerifyCustomDomainArgs = {
  domainID: Scalars['String'];
};


export type MutationVerifyWalletAddressCreateAliasArgs = {
  request: VerifyWalletAddressCreateAliasRequest;
};


export type MutationVerifyWebAuthnRegistrationArgs = {
  request: VerifyWebAuthnRegistrationRequest;
};

export type NativeMailbox = {
  __typename?: 'NativeMailbox';
  pageInfo: MailboxPageInfo;
  slimThreads: Array<SlimUserThread>;
  threads: Array<UserThread>;
};

export type NativeMailboxRequest = {
  cursor?: InputMaybe<MailboxCursor>;
  lastUpdatedDate?: InputMaybe<Scalars['Date']>;
  limit?: InputMaybe<Scalars['Int']>;
  limitWithSlims?: InputMaybe<Scalars['Int']>;
  onlySlimThreads?: InputMaybe<Scalars['Boolean']>;
  platformInfo?: InputMaybe<PlatformInfo>;
  returnDeleted?: InputMaybe<Scalars['Boolean']>;
  updatedAtOrderDirection?: InputMaybe<AscDesc>;
  useUpdatedAtField?: InputMaybe<Scalars['Boolean']>;
};

export type NewDocRequest = {
  activeProductApp: ProductApp;
  docID: Scalars['ID'];
  documentType: NwContentType;
  encryptedContents: EncryptedContents;
  encryptedMetadata: EncryptedMetadata;
  encryptedSessionKey: Scalars['String'];
  encryptedSessionKeyEncryptedByKey: Scalars['String'];
  parentDocID?: InputMaybe<Scalars['String']>;
  parentKeysClaim?: InputMaybe<Scalars['String']>;
  parentKeysClaimEncryptedByKey?: InputMaybe<Scalars['String']>;
  parentSignature?: InputMaybe<Scalars['String']>;
  permissions: Array<PermissionEntryInput>;
  publicHierarchicalKey: Scalars['String'];
  publicHierarchicalKeyOfParent?: InputMaybe<Scalars['String']>;
  signatures: Array<Scalars['String']>;
  templateID?: InputMaybe<Scalars['String']>;
};

export type NewDocResponse = {
  __typename?: 'NewDocResponse';
  docID: Scalars['ID'];
  document?: Maybe<Document>;
  error?: Maybe<BatchError>;
};

export enum NotificationChannelType {
  Email = 'EMAIL'
}

export type NotificationClickedRequest = {
  notificationID: Scalars['String'];
};

export enum NwContentType {
  File = 'FILE',
  Folder = 'FOLDER',
  Pdf = 'PDF',
  RichText = 'RICH_TEXT'
}

export type Organization = {
  __typename?: 'Organization';
  displayPictureData: DisplayPictureData;
  everyoneTeam: Team;
  hasCustomized: Scalars['Boolean'];
  name: Scalars['String'];
  orgID: Scalars['String'];
  personalTeam: Team;
  rootDocID: Scalars['String'];
  rootDocPublicHierarchicalKey?: Maybe<Scalars['String']>;
  teams: Array<Team>;
};

export type PaidUpStatus = {
  __typename?: 'PaidUpStatus';
  downgradeProgress: DowngradeProgress;
  paidUp: Scalars['Boolean'];
};

export type PendingDocumentKeyUpgradesCollaborator = {
  __typename?: 'PendingDocumentKeyUpgradesCollaborator';
  publicKey: Scalars['PublicKey'];
  userID: Scalars['String'];
};

export type PendingDocumentKeyUpgradesNewHierarchicalKey = {
  __typename?: 'PendingDocumentKeyUpgradesNewHierarchicalKey';
  collaboratorsIDs: Array<Scalars['String']>;
  currentPublicHierarchicalKey?: Maybe<Scalars['String']>;
  docID: Scalars['String'];
  encryptedLinkKey?: Maybe<Scalars['String']>;
  hierarchicalPermissionChain: Array<HierarchicalPermissionChainLink>;
};

export type PendingDocumentKeyUpgradesNewKeysClaim = {
  __typename?: 'PendingDocumentKeyUpgradesNewKeysClaim';
  currentKeysClaim?: Maybe<Scalars['String']>;
  docID: Scalars['String'];
  hierarchicalPermissionChain: Array<HierarchicalPermissionChainLink>;
  keysClaimSourceDocID: Scalars['String'];
  keysClaimSourceDocPublicHierarchicalKey?: Maybe<Scalars['String']>;
};

export type PendingDocumentKeyUpgradesOutput = {
  __typename?: 'PendingDocumentKeyUpgradesOutput';
  collaborators: Array<PendingDocumentKeyUpgradesCollaborator>;
  newHierarchicalKeys: Array<PendingDocumentKeyUpgradesNewHierarchicalKey>;
  newKeysClaims: Array<PendingDocumentKeyUpgradesNewKeysClaim>;
};

export type PendingDocumentKeyUpgradesRequest = {
  rootDocumentId: Scalars['String'];
};

export type PendingUserInvite = {
  __typename?: 'PendingUserInvite';
  docID: Scalars['String'];
  email: Scalars['String'];
  permissionLevel: PermissionLevel;
};

export type PermissionEntry = {
  __typename?: 'PermissionEntry';
  encryptedBy: Scalars['PublicKey'];
  encryptedKey?: Maybe<Scalars['String']>;
  encryptedPrivateHierarchicalKey?: Maybe<Scalars['String']>;
  expiryDate?: Maybe<Scalars['Date']>;
  userID: Scalars['String'];
};

export type PermissionEntryInput = {
  encryptedBy: Scalars['PublicKey'];
  encryptedPrivateHierarchicalKey: Scalars['String'];
  expiryDate?: InputMaybe<Scalars['Date']>;
  permissionLevel: PermissionLevel;
  userID: Scalars['String'];
};

export enum PermissionLevel {
  Admin = 'ADMIN',
  Editor = 'EDITOR',
  Viewer = 'VIEWER'
}

export type PlatformInfo = {
  browserName?: InputMaybe<Scalars['String']>;
  isAndroid: Scalars['Boolean'];
  isBgTask?: InputMaybe<Scalars['Boolean']>;
  isIos: Scalars['Boolean'];
  isMacOs: Scalars['Boolean'];
  isMobile: Scalars['Boolean'];
  isReactNative?: InputMaybe<Scalars['Boolean']>;
  isSkiffWindowsDesktop?: InputMaybe<Scalars['Boolean']>;
  languageCode?: InputMaybe<Scalars['String']>;
  manufacturer?: InputMaybe<Scalars['String']>;
  timezone?: InputMaybe<Scalars['String']>;
};

export type PrivateUserData = {
  __typename?: 'PrivateUserData';
  documentKey?: Maybe<Scalars['String']>;
  privateKey?: Maybe<Scalars['String']>;
  signingPrivateKey?: Maybe<Scalars['String']>;
};

export enum ProductApp {
  Calendar = 'CALENDAR',
  Drive = 'DRIVE',
  Mail = 'MAIL',
  Pages = 'PAGES'
}

export type ProvisionEmailDetails = {
  deliveryEmail: Scalars['String'];
  temporaryPassword: Scalars['String'];
};

export type ProvisionSrpRequest = {
  createSrpRequest: CreateSrpRequest;
  emailAlias: Scalars['String'];
  newUserID: Scalars['String'];
  provisionEmailDetails?: InputMaybe<ProvisionEmailDetails>;
  shareDocRequest: ShareDocRequest;
};

export type PublicData = {
  __typename?: 'PublicData';
  displayName?: Maybe<Scalars['String']>;
  displayPictureData?: Maybe<DisplayPictureData>;
};

export type PublicOrgData = {
  __typename?: 'PublicOrgData';
  displayPictureData?: Maybe<DisplayPictureData>;
  name: Scalars['String'];
  orgID: Scalars['String'];
};

export type PurchaseCustomDomainRequest = {
  domain: Scalars['String'];
};

export type PurchaseCustomDomainResponse = {
  __typename?: 'PurchaseCustomDomainResponse';
  domainID: Scalars['String'];
};

export type PushCalendarEventInput = {
  calendarID: Scalars['String'];
  creatorCalendarID: Scalars['String'];
  eventData: CalendarEventData;
  externalCreator?: InputMaybe<Scalars['String']>;
  internalAttendeeList: Array<InternalAttendeeInput>;
  parentEventID: Scalars['String'];
  updateTypes: Array<EventUpdateType>;
};

export type PushCalendarEventInput2 = {
  calendarID: Scalars['String'];
  creatorCalendarID: Scalars['String'];
  eventData: CalendarEventData2;
  externalCreator?: InputMaybe<Scalars['String']>;
  internalAttendeeList: Array<InternalAttendeeInput>;
  parentEventID: Scalars['String'];
  updateTypes: Array<EventUpdateType>;
};

export type Query = {
  __typename?: 'Query';
  aliasValid: Scalars['Boolean'];
  allContacts: Array<Contact>;
  allDrafts: Array<Draft>;
  allFolderDocuments: Array<Document>;
  apiVersion?: Maybe<Scalars['String']>;
  attachments?: Maybe<Array<Maybe<Attachment>>>;
  autoReply?: Maybe<AutoReplyOutput>;
  billingPortal?: Maybe<CreateBillingPortalSessionOutput>;
  browserPushNotificationsEnabled: Scalars['Boolean'];
  calendar: Calendar;
  checkIfDomainsAvailable: CheckIfDomainsAvailableResponse;
  checkoutPortal: CheckoutSession;
  contacts: Array<Contact>;
  credits: GetCreditsResponse;
  currentUser?: Maybe<User>;
  currentUserAlterEgos: Array<UserAlterEgo>;
  customDomainCheckoutPortal: CheckoutSession;
  customDomains: Array<Scalars['String']>;
  decryptionServicePublicKey?: Maybe<Scalars['PublicKey']>;
  defaultProfilePicture?: Maybe<DefaultDisplayPictureData>;
  document: Document;
  documents: Array<Document>;
  emailAutoForwardingSettings: EmailAutoForwardingSettings;
  /** @deprecated Added pagination, use emailsWithUnreadICS2 instead */
  emailsWithUnreadICS: Array<Email>;
  emailsWithUnreadICS2: EmailsWithUnreadIcsResponse;
  events: Array<CalendarEvent>;
  eventsAroundDate: Array<CalendarEvent>;
  getAliasesOnDomain: AliasesOnDomainResponse;
  getBonfidaNames: Array<Scalars['String']>;
  getCoinbaseCheckoutID: GetCoinbaseCheckoutIdResponse;
  getCurrentUserCustomDomains: GetCurrentUserCustomDomainsResponse;
  getDomainDetails: DomainDetails;
  getDomainSuggestions: GetDomainSuggestionsResponse;
  getENSName?: Maybe<Scalars['String']>;
  getGmailAutoImportStatus: AutoImportStatus;
  getGoogleAuthURL: Scalars['String'];
  getICNSName?: Maybe<Scalars['String']>;
  getOutlookAuthUrl: Scalars['String'];
  getStargazeName?: Maybe<Scalars['String']>;
  isBlocked: Scalars['Boolean'];
  isCustomDomain: Scalars['Boolean'];
  isHolderOfNFT: Scalars['Boolean'];
  lastViewedReferralCredit: LastViewedReferralCreditResponse;
  mailFilters: Array<MailFilter>;
  mailbox?: Maybe<Mailbox>;
  nativeMailbox?: Maybe<NativeMailbox>;
  orgMemberDefaultEmailAlias?: Maybe<Scalars['String']>;
  orgMemberEmailAliases: Array<Scalars['String']>;
  organization: Organization;
  pendingDocumentKeyUpgrades: PendingDocumentKeyUpgradesOutput;
  recoveryPublicKeysAndData?: Maybe<RecoveryPublicKeysAndDataOutput>;
  searchIndexProgress: SearchIndexProgress;
  searchIndexableDocuments: Array<IndexableDocument>;
  sessionCache: SessionCacheOutput;
  sessionCacheChallenge: SessionCacheChallengeResponse;
  sessionCacheMobile?: Maybe<Scalars['Void']>;
  status?: Maybe<Scalars['String']>;
  team: Team;
  templates: Array<Template>;
  unread: Scalars['Int'];
  user?: Maybe<User>;
  userCalendar: UserCalendar;
  userLabels: Array<UserLabel>;
  userPreferences?: Maybe<UserPreferences>;
  userSignature?: Maybe<UserSignatureOutput>;
  userThread?: Maybe<UserThread>;
  userThreads: Array<UserThread>;
  users?: Maybe<Array<User>>;
  usersFromEmailAlias: Array<Maybe<User>>;
  usersFromEmailAliasWithCatchall: Array<Maybe<User>>;
  validPaperShareHash: Scalars['Boolean'];
};


export type QueryAliasValidArgs = {
  request: GetAliasValidRequest;
};


export type QueryAttachmentsArgs = {
  ids?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};


export type QueryBillingPortalArgs = {
  request?: InputMaybe<GetBillingPortalSessionRequest>;
};


export type QueryCalendarArgs = {
  calendarID: Scalars['String'];
};


export type QueryCheckIfDomainsAvailableArgs = {
  domains: Array<Scalars['String']>;
};


export type QueryCheckoutPortalArgs = {
  request: GetCheckoutSessionRequest;
};


export type QueryContactsArgs = {
  request: GetContactsRequest;
};


export type QueryCreditsArgs = {
  request: GetCreditsRequest;
};


export type QueryCustomDomainCheckoutPortalArgs = {
  request: GetCustomDomainCheckoutSessionRequest;
};


export type QueryDefaultProfilePictureArgs = {
  request: GetDefaultProfilePictureRequest;
};


export type QueryDocumentArgs = {
  request: GetDocumentRequest;
};


export type QueryDocumentsArgs = {
  request: GetDocumentsRequest;
};


export type QueryEventsArgs = {
  request: EventsInput;
};


export type QueryEventsAroundDateArgs = {
  request: EventAroundDateInput;
};


export type QueryGetAliasesOnDomainArgs = {
  domainID: Scalars['String'];
};


export type QueryGetBonfidaNamesArgs = {
  solanaAddress: Scalars['String'];
};


export type QueryGetCoinbaseCheckoutIdArgs = {
  request: GetCoinbaseCheckoutIdRequest;
};


export type QueryGetDomainDetailsArgs = {
  domain: Scalars['String'];
};


export type QueryGetDomainSuggestionsArgs = {
  domain: Scalars['String'];
  limit?: InputMaybe<Scalars['Int']>;
};


export type QueryGetEnsNameArgs = {
  ethereumAddress: Scalars['String'];
};


export type QueryGetIcnsNameArgs = {
  cosmosAddress: Scalars['String'];
};


export type QueryGetStargazeNameArgs = {
  cosmosAddress: Scalars['String'];
};


export type QueryIsBlockedArgs = {
  senderAddress?: InputMaybe<Scalars['String']>;
};


export type QueryIsCustomDomainArgs = {
  domains: Array<Scalars['String']>;
};


export type QueryIsHolderOfNftArgs = {
  nftContractAddress: Scalars['String'];
  userAddress: Scalars['String'];
};


export type QueryMailFiltersArgs = {
  request?: InputMaybe<GetMailFiltersInput>;
};


export type QueryMailboxArgs = {
  request: MailboxRequest;
};


export type QueryNativeMailboxArgs = {
  request: NativeMailboxRequest;
};


export type QueryOrgMemberDefaultEmailAliasArgs = {
  userID: Scalars['String'];
};


export type QueryOrgMemberEmailAliasesArgs = {
  userID: Scalars['String'];
};


export type QueryOrganizationArgs = {
  id: Scalars['String'];
};


export type QueryPendingDocumentKeyUpgradesArgs = {
  request: PendingDocumentKeyUpgradesRequest;
};


export type QueryRecoveryPublicKeysAndDataArgs = {
  request: GetRecoveryPublicKeysAndDataRequest;
};


export type QuerySearchIndexProgressArgs = {
  request: GetSearchIndexProgressRequest;
};


export type QuerySessionCacheChallengeArgs = {
  req: SessionCacheInput;
};


export type QuerySessionCacheMobileArgs = {
  req: SessionCacheMobileRequest;
};


export type QueryTeamArgs = {
  id: Scalars['String'];
};


export type QueryTemplatesArgs = {
  request: GetTemplatesRequest;
};


export type QueryUnreadArgs = {
  label: Scalars['String'];
};


export type QueryUserArgs = {
  request: GetUserRequest;
};


export type QueryUserCalendarArgs = {
  calendarID: Scalars['String'];
};


export type QueryUserThreadArgs = {
  threadID?: InputMaybe<Scalars['String']>;
};


export type QueryUserThreadsArgs = {
  returnDeleted?: InputMaybe<Scalars['Boolean']>;
  threadIDs: Array<Scalars['String']>;
};


export type QueryUsersArgs = {
  request: GetUsersRequest;
};


export type QueryUsersFromEmailAliasArgs = {
  emailAliases: Array<Scalars['String']>;
};


export type QueryUsersFromEmailAliasWithCatchallArgs = {
  emailAliases: Array<Scalars['String']>;
};


export type QueryValidPaperShareHashArgs = {
  request: GetValidPaperShareHashRequest;
};

export type RecoveryPublicKeysAndDataOutput = {
  __typename?: 'RecoveryPublicKeysAndDataOutput';
  encryptedRecoveryData?: Maybe<Scalars['String']>;
  publicKey: Scalars['PublicKey'];
  recoveryServerShare?: Maybe<Scalars['String']>;
  recoverySigningPublicKey?: Maybe<Scalars['PublicKey']>;
};

export enum RecurrenceDay {
  Friday = 'FRIDAY',
  Monday = 'MONDAY',
  Saturday = 'SATURDAY',
  Sunday = 'SUNDAY',
  Thursday = 'THURSDAY',
  Tuesday = 'TUESDAY',
  Wednesday = 'WEDNESDAY'
}

export enum RecurrenceFrequency {
  Daily = 'DAILY',
  Hourly = 'HOURLY',
  Minutely = 'MINUTELY',
  Monthly = 'MONTHLY',
  Secondly = 'SECONDLY',
  Weekly = 'WEEKLY',
  Yearly = 'YEARLY'
}

export type RecurrenceRule = {
  __typename?: 'RecurrenceRule';
  byDays?: Maybe<Array<RecurrenceDay>>;
  count?: Maybe<Scalars['Int']>;
  excludeDates: Array<Scalars['Date']>;
  frequency: RecurrenceFrequency;
  interval?: Maybe<Scalars['Int']>;
  isAllDay?: Maybe<Scalars['Boolean']>;
  startDate: Scalars['Date'];
  timezone?: Maybe<Scalars['String']>;
  until?: Maybe<Scalars['Date']>;
};

export type RecurrenceRuleInput = {
  byDays?: InputMaybe<Array<RecurrenceDay>>;
  count?: InputMaybe<Scalars['Int']>;
  excludeDates: Array<Scalars['Date']>;
  frequency: RecurrenceFrequency;
  interval?: InputMaybe<Scalars['Int']>;
  isAllDay?: InputMaybe<Scalars['Boolean']>;
  startDate: Scalars['Date'];
  timezone?: InputMaybe<Scalars['String']>;
  until?: InputMaybe<Scalars['Date']>;
};

export type ReferUserRequest = {
  email: Scalars['String'];
  permissionLevel?: InputMaybe<PermissionLevel>;
  referralTemplate: Scalars['String'];
};

export type ReferUserResponse = {
  __typename?: 'ReferUserResponse';
  status: RequestStatus;
};

export type RegenerateMfaBackupCodesRequest = {
  loginSrpRequest: LoginSrpRequest;
  signature: Scalars['String'];
};

export type RegenerateMfaBackupCodesResponse = {
  __typename?: 'RegenerateMfaBackupCodesResponse';
  backupCodes: Array<Scalars['String']>;
  status: RequestStatus;
};

export type RenewalDetails = {
  __typename?: 'RenewalDetails';
  price?: Maybe<Scalars['Float']>;
};

export type ReplyToEmailRequest = {
  attachments: Array<EncryptedAttachmentInput>;
  bcc: Array<SendAddressRequest>;
  captchaToken: Scalars['String'];
  cc: Array<SendAddressRequest>;
  customMessageID?: InputMaybe<Scalars['String']>;
  encryptedHtml: EncryptedDataInput;
  encryptedSubject: EncryptedDataInput;
  encryptedText: EncryptedDataInput;
  encryptedTextAsHtml: EncryptedDataInput;
  encryptedTextSnippet?: InputMaybe<EncryptedDataInput>;
  externalEncryptedSessionKey?: InputMaybe<EncryptedSessionKeyInput>;
  from: SendAddressRequest;
  rawSubject: Scalars['String'];
  replyID: Scalars['String'];
  scheduleSendAt?: InputMaybe<Scalars['Date']>;
  to: Array<SendAddressRequest>;
};

export type ReplyToEmailResponse = {
  __typename?: 'ReplyToEmailResponse';
  messageID: Scalars['String'];
  threadID: Scalars['String'];
};

export enum RequestStatus {
  Failed = 'FAILED',
  Rejected = 'REJECTED',
  Saved = 'SAVED',
  Success = 'SUCCESS'
}

export type ResetAccountRequest = {
  emailPasscode?: InputMaybe<Scalars['String']>;
  encryptedUserData: Scalars['String'];
  salt: Scalars['String'];
  saltSignature: Scalars['String'];
  userDataSignature: Scalars['String'];
  username: Scalars['String'];
  verifier: Scalars['String'];
  verifierSignature: Scalars['String'];
};

export enum Role {
  Bcc = 'BCC',
  Cc = 'CC',
  From = 'FROM',
  To = 'TO'
}

export type SaveContentsRequest = {
  createSnapshot?: InputMaybe<Scalars['Boolean']>;
  docID: Scalars['String'];
  encryptedContents: EncryptedContents;
  previousEncryptedContentsHash: Scalars['String'];
  restoringDocument?: InputMaybe<Scalars['Boolean']>;
};

export type SaveContentsResponse = {
  __typename?: 'SaveContentsResponse';
  document: Document;
};

export type SaveCustomDomainRequest = {
  domain: Scalars['String'];
  domainID: Scalars['String'];
};

export type SaveMetadataRequest = {
  docID: Scalars['String'];
  encryptedMetadata: EncryptedMetadata;
  previousEncryptedMetadataHash: Scalars['String'];
};

export type SaveMetadataResponse = {
  __typename?: 'SaveMetadataResponse';
  document: Document;
};

export type SearchIndexProgress = {
  __typename?: 'SearchIndexProgress';
  isIndexComplete: Scalars['Boolean'];
  numIndexableThreads: Scalars['Int'];
  numThreadsIndexed: Scalars['Int'];
};

export type SendAccessRequestEmailRequest = {
  docID: Scalars['String'];
};

export type SendAddressRequest = {
  address: Scalars['String'];
  encryptedSessionKey?: InputMaybe<EncryptedSessionKeyInput>;
  name?: InputMaybe<Scalars['String']>;
};

export type SendDocumentEventRequest = {
  audience: Array<Scalars['String']>;
  docID: Scalars['String'];
  nodeID?: InputMaybe<Scalars['String']>;
  type: DocumentEventType;
};

export type SendEmailRequest = {
  attachments: Array<EncryptedAttachmentInput>;
  bcc: Array<SendAddressRequest>;
  calendarInvite?: InputMaybe<Scalars['Boolean']>;
  captchaToken: Scalars['String'];
  cc: Array<SendAddressRequest>;
  encryptedHtml: EncryptedDataInput;
  encryptedSubject: EncryptedDataInput;
  encryptedText: EncryptedDataInput;
  encryptedTextAsHtml: EncryptedDataInput;
  encryptedTextSnippet?: InputMaybe<EncryptedDataInput>;
  externalEncryptedSessionKey?: InputMaybe<EncryptedSessionKeyInput>;
  from: SendAddressRequest;
  rawSubject: Scalars['String'];
  scheduleSendAt?: InputMaybe<Scalars['Date']>;
  to: Array<SendAddressRequest>;
};

export type SendEmailResponse = {
  __typename?: 'SendEmailResponse';
  messageID: Scalars['String'];
  threadID: Scalars['String'];
};

export type SendFeedbackRequest = {
  feedback: Scalars['String'];
  isMobile: Scalars['Boolean'];
  isNative: Scalars['Boolean'];
  origin: Scalars['String'];
  zendeskUploadTokens: Array<Scalars['String']>;
};

export type SessionCacheChallengeResponse = {
  __typename?: 'SessionCacheChallengeResponse';
  encryptedChallenge: Scalars['String'];
  serverPublicKey: Scalars['String'];
};

export type SessionCacheInput = {
  userID: Scalars['String'];
};

export type SessionCacheMobileRequest = {
  challenge: Scalars['String'];
  userID: Scalars['String'];
};

export type SessionCacheOutput = {
  __typename?: 'SessionCacheOutput';
  alternativeCacheKeys: Array<Scalars['String']>;
  cacheKey: Scalars['String'];
};

export type SetAllThreadsReadStatusRequest = {
  label: Scalars['String'];
  read: Scalars['Boolean'];
};

export type SetAutoReplyRequest = {
  encryptedHtml: EncryptedDataInput;
  encryptedSkiffSessionKey: EncryptedSessionKeyInput;
  encryptedSubject: EncryptedDataInput;
  encryptedText: EncryptedDataInput;
  encryptedTextAsHtml: EncryptedDataInput;
  encryptedTextSnippet?: InputMaybe<EncryptedDataInput>;
  encryptedUserSessionKey: EncryptedSessionKeyInput;
};

export type SetCalendarPushTokenRequest = {
  deviceID: Scalars['String'];
  os: Scalars['String'];
  token: Scalars['String'];
};

export type SetCatchallAddressRequest = {
  domainID: Scalars['String'];
  emailAlias?: InputMaybe<Scalars['String']>;
};

export type SetDefaultEmailAliasRequest = {
  defaultAlias: Scalars['String'];
};

export type SetLastViewedReferralCreditRequest = {
  amount: CreditAmountInput;
  count: Scalars['Int'];
};

export type SetNotificationPreferencesRequest = {
  email: Scalars['Boolean'];
  inApp: Scalars['Boolean'];
};

export type SetPdSubscribeFlagRequest = {
  subscribed: Scalars['Boolean'];
};

export type SetPushTokenRequest = {
  deviceID: Scalars['String'];
  os: Scalars['String'];
  token: Scalars['String'];
};

export type SetReadStatusRequest = {
  read: Scalars['Boolean'];
  threadIDs: Array<Scalars['String']>;
};

export type SetReadStatusResponse = {
  __typename?: 'SetReadStatusResponse';
  updatedThreadIDs: Array<Scalars['String']>;
};

export type SetUseIpfsRequest = {
  useIPFS: Scalars['Boolean'];
};

export type SetUseIpfsResponse = {
  __typename?: 'SetUseIPFSResponse';
  status: RequestStatus;
};

export type SetUserPreferencesRequest = {
  blockRemoteContent?: InputMaybe<Scalars['Boolean']>;
  dateFormat?: InputMaybe<Scalars['String']>;
  defaultCalendarColor?: InputMaybe<Scalars['String']>;
  hideActivationChecklist?: InputMaybe<Scalars['Boolean']>;
  hourFormat?: InputMaybe<Scalars['String']>;
  leftSwipeGesture?: InputMaybe<SwipeSetting>;
  rightSwipeGesture?: InputMaybe<SwipeSetting>;
  securedBySkiffSigDisabled?: InputMaybe<Scalars['Boolean']>;
  showAliasInboxes?: InputMaybe<Scalars['Boolean']>;
  showPageIcon?: InputMaybe<Scalars['Boolean']>;
  startDayOfTheWeek?: InputMaybe<Scalars['Int']>;
  theme?: InputMaybe<Scalars['String']>;
  threadFormat?: InputMaybe<ThreadDisplayFormat>;
};

export type SetUserPublicKeyRequest = {
  publicKey: Scalars['PublicKeyWithSignature'];
  signingPublicKey: Scalars['PublicKey'];
};

export type SetUserSignatureRequest = {
  sessionKey: EncryptedSessionKeyInput;
  userSignature: EncryptedDataInput;
};

export type SetupLinkRequest = {
  currentEncryptedSessionKey: Scalars['String'];
  currentPublicHierarchicalKey: Scalars['String'];
  docID: Scalars['String'];
  encryptedLinkKey: Scalars['String'];
  encryptedPrivateHierarchicalKey: Scalars['String'];
  encryptedSessionKey: Scalars['String'];
  linkKeySignature: Scalars['String'];
  permissionLevel: PermissionLevel;
  salt: Scalars['String'];
  sessionKeySignature: Scalars['String'];
  verifier: Scalars['String'];
};

export type SetupLinkResponse = {
  __typename?: 'SetupLinkResponse';
  document: Document;
};

export type SetupProvisionedUserRequest = {
  loginSrpRequest: LoginSrpRequest;
  updateSrpRequest: UpdateSrpRequest;
};

export type ShareDocEventData = {
  __typename?: 'ShareDocEventData';
  targetUser: Scalars['String'];
};

export type ShareDocRequest = {
  currentPublicHierarchicalKey: Scalars['String'];
  docID: Scalars['String'];
  newPermissionEntries: Array<PermissionEntryInput>;
  signatures: Array<Scalars['String']>;
};

export type ShareDocResponse = {
  __typename?: 'ShareDocResponse';
  document: Document;
};

export type SharePermissionInput = {
  expiryDate?: InputMaybe<Scalars['Date']>;
  permissionLevel: PermissionLevel;
};

export type ShareTeamDocWithOtherTeamRequest = {
  documentPermissionProxy: DocumentPermissionProxyInput;
};

export enum SignatureContext {
  DeleteAccount = 'DELETE_ACCOUNT',
  DeleteDoc = 'DELETE_DOC',
  DeleteRecoveryData = 'DELETE_RECOVERY_DATA',
  DisableMfa = 'DISABLE_MFA',
  DocumentChunk = 'DOCUMENT_CHUNK',
  DocumentData = 'DOCUMENT_DATA',
  DocumentMetadata = 'DOCUMENT_METADATA',
  DocumentParent = 'DOCUMENT_PARENT',
  EnrollMfa = 'ENROLL_MFA',
  LinksLinkKey = 'LINKS_LINK_KEY',
  LinksSessionKey = 'LINKS_SESSION_KEY',
  MobileLogin = 'MOBILE_LOGIN',
  RecoveryData = 'RECOVERY_DATA',
  RegenerateMfaBackupCodes = 'REGENERATE_MFA_BACKUP_CODES',
  SessionKey = 'SESSION_KEY',
  SrpSalt = 'SRP_SALT',
  SrpVerifier = 'SRP_VERIFIER',
  UnshareDoc = 'UNSHARE_DOC',
  UpdateUserData = 'UPDATE_USER_DATA',
  UploadRecoveryEncryptedUserData = 'UPLOAD_RECOVERY_ENCRYPTED_USER_DATA',
  UploadRecoveryEncryptionPublicKey = 'UPLOAD_RECOVERY_ENCRYPTION_PUBLIC_KEY',
  UploadRecoveryServerShare = 'UPLOAD_RECOVERY_SERVER_SHARE',
  UploadRecoverySigningPublicKey = 'UPLOAD_RECOVERY_SIGNING_PUBLIC_KEY',
  UserData = 'USER_DATA',
  UserPublicKey = 'USER_PUBLIC_KEY'
}

export type SingleRetrievedRecord = {
  __typename?: 'SingleRetrievedRecord';
  data: Scalars['String'];
  priority?: Maybe<Scalars['String']>;
};

export type SlimUserThread = {
  __typename?: 'SlimUserThread';
  attributes: ThreadAttributes;
  deletedAt?: Maybe<Scalars['Date']>;
  emailsUpdatedAt: Scalars['Date'];
  permanentlyDeleted: Scalars['Boolean'];
  sentLabelUpdatedAt?: Maybe<Scalars['Date']>;
  threadID: Scalars['String'];
  updatedAt: Scalars['Date'];
};

export type StorageUsage = {
  __typename?: 'StorageUsage';
  attachmentUsageBytes: Scalars['String'];
  messageUsageBytes: Scalars['String'];
};

export type SubscribeNotificationRequest = {
  auth: Scalars['String'];
  endpoint: Scalars['String'];
  p256dh: Scalars['String'];
};

export type SubscriptionInfo = {
  __typename?: 'SubscriptionInfo';
  billingInterval?: Maybe<SubscriptionInterval>;
  cancelAtPeriodEnd: Scalars['Boolean'];
  isCryptoSubscription: Scalars['Boolean'];
  quantity?: Maybe<Scalars['Int']>;
  stripeStatus?: Maybe<Scalars['String']>;
  subscriptionPlan: Scalars['String'];
  supposedEndDate?: Maybe<Scalars['Date']>;
};

export enum SubscriptionInterval {
  Monthly = 'MONTHLY',
  Yearly = 'YEARLY'
}

export enum SubscriptionPlan {
  Business = 'BUSINESS',
  Essential = 'ESSENTIAL',
  Free = 'FREE',
  Pro = 'PRO'
}

export enum SwipeSetting {
  Archive = 'ARCHIVE',
  Delete = 'DELETE',
  Unread = 'UNREAD'
}

export type SyncRequest = {
  calendarID: Scalars['String'];
  checkpoint?: InputMaybe<Scalars['Date']>;
  events: Array<PushCalendarEventInput>;
};

export type SyncRequest2 = {
  calendarID: Scalars['String'];
  checkpoint?: InputMaybe<Scalars['Date']>;
  events: Array<PushCalendarEventInput2>;
};

export type SyncResponse = {
  __typename?: 'SyncResponse';
  checkpoint?: Maybe<Scalars['Date']>;
  events: Array<Maybe<CalendarEvent>>;
  state: SyncState;
};

export enum SyncState {
  Conflict = 'CONFLICT',
  Synced = 'SYNCED'
}

export enum SystemLabels {
  Archive = 'ARCHIVE',
  Drafts = 'DRAFTS',
  Imports = 'IMPORTS',
  Inbox = 'INBOX',
  ScheduleSend = 'SCHEDULE_SEND',
  Sent = 'SENT',
  Spam = 'SPAM',
  Trash = 'TRASH',
  Virus = 'VIRUS'
}

export type Team = {
  __typename?: 'Team';
  accessLevel?: Maybe<TeamAccess>;
  icon: Scalars['String'];
  name: Scalars['String'];
  organization: Organization;
  personal: Scalars['Boolean'];
  rootDocument?: Maybe<Document>;
  teamID: Scalars['String'];
};

export enum TeamAccess {
  Everyone = 'EVERYONE',
  InviteOnly = 'INVITE_ONLY',
  Personal = 'PERSONAL'
}

export type Template = {
  __typename?: 'Template';
  contents: TemplateContent;
  createdAt?: Maybe<Scalars['Date']>;
  group: Scalars['String'];
  metadata: TemplateMetaData;
  parentID?: Maybe<Scalars['String']>;
  templateID: Scalars['String'];
  updatedAt?: Maybe<Scalars['Date']>;
};

export type TemplateContent = {
  __typename?: 'TemplateContent';
  pmDoc: Scalars['JSON'];
};

export type TemplateMetaData = {
  __typename?: 'TemplateMetaData';
  color?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  icon?: Maybe<Scalars['String']>;
  title: Scalars['String'];
};

export type ThreadAttributes = {
  __typename?: 'ThreadAttributes';
  read: Scalars['Boolean'];
  systemLabels: Array<Scalars['String']>;
  userLabels: Array<UserLabel>;
};

export enum ThreadDisplayFormat {
  Full = 'FULL',
  Right = 'RIGHT'
}

export type TrashDocRequest = {
  activeProductApp: ProductApp;
  currentEncryptedSessionKey: Scalars['String'];
  currentPublicHierarchicalKey: Scalars['String'];
  docID: Scalars['String'];
  newParentKeysClaim: Scalars['String'];
  newParentKeysClaimEncryptedByKey: Scalars['String'];
  publicHierarchicalKeyOfParent: Scalars['String'];
};

export type UnblockEmailAddressRequest = {
  emailAddressToUnblock?: InputMaybe<Scalars['String']>;
};

export type UnsendEmailRequest = {
  messageID: Scalars['String'];
  threadID: Scalars['String'];
};

export type UnsetCalendarPushTokenRequest = {
  deviceID: Scalars['String'];
};

export type UnsetPushTokenRequest = {
  deviceID: Scalars['String'];
};

export type UnshareDocEventData = {
  __typename?: 'UnshareDocEventData';
  targetUser: Scalars['String'];
};

export type UnshareDocRequest = {
  docID: Scalars['String'];
  signature: Scalars['String'];
  usersToUnshare: Array<Scalars['String']>;
};

export type UnshareDocResponse = {
  __typename?: 'UnshareDocResponse';
  document: Document;
};

export type UnshareTeamDocWithOtherTeamRequest = {
  sourceTeamRootDocumentID: Scalars['String'];
  targetTeamRootDocumentID: Scalars['String'];
};

export type UpdateDisplayNameRequest = {
  displayName: Scalars['String'];
};

export type UpdateDisplayNameResponse = {
  __typename?: 'UpdateDisplayNameResponse';
  status: RequestStatus;
};

export type UpdateDisplayPictureRequest = {
  profileAccentColor?: InputMaybe<Scalars['String']>;
  profileCustomURI?: InputMaybe<Scalars['String']>;
  profileIcon?: InputMaybe<Scalars['String']>;
};

export type UpdateDisplayPictureSkemailRequest = {
  profileAccentColor?: InputMaybe<Scalars['String']>;
  profileCustomURI?: InputMaybe<Scalars['String']>;
  profileIcon?: InputMaybe<Scalars['String']>;
};

export type UpdateDocumentDataRequest = {
  encryptedDocumentData: Scalars['String'];
  signature: Scalars['String'];
};

export type UpdateDocumentDataResponse = {
  __typename?: 'UpdateDocumentDataResponse';
  status: RequestStatus;
};

export type UpdateEmailAliasActiveStateRequest = {
  captchaToken: Scalars['String'];
  emailAlias: Scalars['String'];
  isActive: Scalars['Boolean'];
};

export type UpdateEmailAliasActiveStateResponse = {
  __typename?: 'UpdateEmailAliasActiveStateResponse';
  status: RequestStatus;
};

export type UpdateMailFilterInput = {
  actions: Array<FilterActionInput>;
  encryptedByKey?: InputMaybe<Scalars['String']>;
  encryptedSessionKey?: InputMaybe<Scalars['String']>;
  filter: MailFilterInput;
  mailFilterID: Scalars['String'];
  name?: InputMaybe<Scalars['String']>;
};

export type UpdateSrpRequest = {
  encryptedMetamaskSecret?: InputMaybe<Scalars['String']>;
  encryptedUserData: Scalars['String'];
  loginSrpRequest?: InputMaybe<LoginSrpRequest>;
  salt: Scalars['String'];
  saltSignature: Scalars['String'];
  userDataSignature: Scalars['String'];
  verifier: Scalars['String'];
  verifierSignature: Scalars['String'];
};

export type UpdateSrpResponse = {
  __typename?: 'UpdateSrpResponse';
  status: LoginMutationStatus;
};

export type UpdateUploadContactAvatarLinkRequest = {
  newContactEmail: Scalars['String'];
  oldContactEmail: Scalars['String'];
};

export type UpdateUploadContactAvatarLinkResponse = {
  __typename?: 'UpdateUploadContactAvatarLinkResponse';
  newProfileCustomURI: Scalars['String'];
};

export type UpdatedThreadLabels = {
  __typename?: 'UpdatedThreadLabels';
  systemLabels: Array<SystemLabels>;
  threadID: Scalars['String'];
  userLabels: Array<UserLabel>;
};

export type UpgradeHierarchicalKeysNewHierarchicalKeyItem = {
  docID: Scalars['String'];
  encryptedPrivateHierarchicalKeyByLinkKey?: InputMaybe<Scalars['String']>;
  encryptedSessionKey: Scalars['String'];
  encryptedSessionKeyEncryptedByKey: Scalars['String'];
  permissions: Array<UpgradeHierarchicalKeysRequestPermissionItem>;
  previousEncryptedLinkKey?: InputMaybe<Scalars['String']>;
  previousEncryptedSessionKey?: InputMaybe<Scalars['String']>;
  previousPublicHierarchicalKey?: InputMaybe<Scalars['String']>;
  publicHierarchicalKey: Scalars['String'];
};

export type UpgradeHierarchicalKeysNewKeysClaimItem = {
  docID: Scalars['String'];
  keysClaim: Scalars['String'];
  keysClaimEncryptedByKey: Scalars['String'];
  keysClaimSourceDocID: Scalars['String'];
  keysClaimSourceDocPublicHierarchicalKey: Scalars['String'];
  previousKeysClaim?: InputMaybe<Scalars['String']>;
};

export type UpgradeHierarchicalKeysRequest = {
  newHierarchicalKeys: Array<UpgradeHierarchicalKeysNewHierarchicalKeyItem>;
  newKeysClaims: Array<UpgradeHierarchicalKeysNewKeysClaimItem>;
};

export type UpgradeHierarchicalKeysRequestPermissionItem = {
  encryptedBy: Scalars['PublicKey'];
  encryptedPrivateHierarchicalKey: Scalars['String'];
  userID: Scalars['String'];
};

export type UpgradeHierarchicalKeysResponse = {
  __typename?: 'UpgradeHierarchicalKeysResponse';
  documents: Array<Document>;
};

export type UpgradeKeyRequest = {
  docID: Scalars['String'];
  encryptedContents: EncryptedContents;
  encryptedLinkKey?: InputMaybe<Scalars['String']>;
  encryptedMetadata: EncryptedMetadata;
  encryptedSessionKey: Scalars['String'];
  encryptedSessionKeyEncryptedByKey: Scalars['String'];
  previousEncryptedContentsHash: Scalars['String'];
  previousEncryptedLinkKey?: InputMaybe<Scalars['String']>;
  privateHierarchicalKeyEncryptedByLinkKey?: InputMaybe<Scalars['String']>;
  publicHierarchicalKey: Scalars['String'];
  sessionKeyEncryptedByLinkKey?: InputMaybe<Scalars['String']>;
};

export type UpgradeKeyResponse = {
  __typename?: 'UpgradeKeyResponse';
  document: Document;
};

export type UploadRecoveryDataRequest = {
  browserShareHash: Scalars['String'];
  encryptedRecoveryData: Scalars['String'];
  encryptedRecoveryDataSignature: Scalars['String'];
  paperShareHash: Scalars['String'];
  recoveryEncryptionPublicKey: Scalars['PublicKey'];
  recoveryServerShare: Scalars['String'];
  recoveryServerShareSignature: Scalars['String'];
  recoverySigningPublicKey: Scalars['PublicKey'];
};

export type UploadRecoveryDataResponse = {
  __typename?: 'UploadRecoveryDataResponse';
  status: RequestStatus;
};

export type UploadSpamReportRequest = {
  emailID: Scalars['String'];
  fromAddress: Scalars['String'];
  rawMime?: InputMaybe<Scalars['String']>;
  threadID: Scalars['String'];
};

export type User = {
  __typename?: 'User';
  accountTags?: Maybe<Array<Scalars['String']>>;
  autoSyncContactsSetting?: Maybe<Scalars['Boolean']>;
  calendars?: Maybe<Array<UserCalendar>>;
  canDirectlyUpdateSrp?: Maybe<Scalars['Boolean']>;
  createdAt: Scalars['Date'];
  customDomainSubscriptionsInfo?: Maybe<Array<CustomDomainSubscriptionInfo>>;
  dataMFA?: Maybe<Scalars['String']>;
  defaultEmailAlias?: Maybe<Scalars['String']>;
  emailAliases?: Maybe<Array<Scalars['String']>>;
  encryptedMetamaskSecret?: Maybe<Scalars['String']>;
  encryptedRecoveryData?: Maybe<Scalars['String']>;
  hasTemporaryPassword: Scalars['Boolean'];
  invoiceHistory: InvoiceHistory;
  jwt?: Maybe<Scalars['String']>;
  mfa: MfaFactors;
  mfaTypes?: Maybe<Array<Scalars['String']>>;
  onboardedWorkspaceMigration: Scalars['Boolean'];
  paidUpStatus?: Maybe<PaidUpStatus>;
  passwordDerivedSecret?: Maybe<Scalars['String']>;
  primaryCalendar?: Maybe<Calendar>;
  privateDocumentData?: Maybe<UserPrivateDocumentData>;
  privateUserData?: Maybe<PrivateUserData>;
  publicData: PublicData;
  publicKey: Scalars['PublicKey'];
  recoveryEmail?: Maybe<Scalars['String']>;
  recoveryServerShare?: Maybe<Scalars['String']>;
  recoverySigningPublicKey?: Maybe<Scalars['PublicKey']>;
  rootOrgID?: Maybe<Scalars['String']>;
  rootOrganization: Organization;
  signingPublicKey: Scalars['String'];
  skemailStorageUsage?: Maybe<StorageUsage>;
  storageUsed: Scalars['String'];
  subscribedToPD?: Maybe<Scalars['Boolean']>;
  subscriptionInfo: SubscriptionInfo;
  unverifiedRecoveryEmail?: Maybe<Scalars['String']>;
  userID: Scalars['String'];
  userPreferences?: Maybe<UserPreferences>;
  username: Scalars['String'];
  walletAddress?: Maybe<Scalars['String']>;
};

export type UserAlterEgo = {
  __typename?: 'UserAlterEgo';
  orgName: Scalars['String'];
  userID: Scalars['String'];
  username: Scalars['String'];
};

export type UserAttributionInput = {
  attributionContent?: InputMaybe<Scalars['String']>;
  attributionData?: InputMaybe<Scalars['String']>;
  attributionSource?: InputMaybe<Scalars['String']>;
  attributionTitle?: InputMaybe<Scalars['String']>;
  attributionWallet?: InputMaybe<Scalars['Boolean']>;
  referrerUsername?: InputMaybe<Scalars['String']>;
};

export type UserCalendar = {
  __typename?: 'UserCalendar';
  calendarID: Scalars['String'];
  encryptedByKey: Scalars['String'];
  encryptedPrivateKey?: Maybe<Scalars['String']>;
  publicKey: Scalars['String'];
};

export enum UserFeature {
  EmailNotificationDisabled = 'EMAIL_NOTIFICATION_DISABLED',
  InAppNotificationDisabled = 'IN_APP_NOTIFICATION_DISABLED',
  IpfsEnabled = 'IPFS_ENABLED',
  LogMime = 'LOG_MIME'
}

export type UserLabel = {
  __typename?: 'UserLabel';
  color: Scalars['String'];
  labelID: Scalars['String'];
  labelName: Scalars['String'];
  variant: UserLabelVariant;
};

export enum UserLabelVariant {
  Alias = 'ALIAS',
  Folder = 'FOLDER',
  Plain = 'PLAIN'
}

export type UserPreferences = {
  __typename?: 'UserPreferences';
  blockRemoteContent?: Maybe<Scalars['Boolean']>;
  dateFormat?: Maybe<Scalars['String']>;
  defaultCalendarColor?: Maybe<Scalars['String']>;
  hideActivationChecklist?: Maybe<Scalars['Boolean']>;
  hourFormat?: Maybe<Scalars['String']>;
  leftSwipeGesture?: Maybe<SwipeSetting>;
  rightSwipeGesture?: Maybe<SwipeSetting>;
  securedBySkiffSigDisabled?: Maybe<Scalars['Boolean']>;
  showAliasInboxes?: Maybe<Scalars['Boolean']>;
  showPageIcon?: Maybe<Scalars['Boolean']>;
  startDayOfTheWeek?: Maybe<Scalars['Int']>;
  theme?: Maybe<Scalars['String']>;
  threadFormat?: Maybe<ThreadDisplayFormat>;
};

export type UserPrivateDocumentData = {
  __typename?: 'UserPrivateDocumentData';
  documentData?: Maybe<Scalars['JSON']>;
  recoveryBrowserShare?: Maybe<Scalars['String']>;
  verifiedKeys?: Maybe<UserVerifiedKey>;
};

export type UserSignatureOutput = {
  __typename?: 'UserSignatureOutput';
  sessionKey: EncryptedSessionKeyOutput;
  userSignature: EncryptedDataOutput;
};

export enum UserTags {
  PilotProgram = 'PILOT_PROGRAM',
  UserFeatures = 'USER_FEATURES'
}

export type UserThread = {
  __typename?: 'UserThread';
  attributes: ThreadAttributes;
  deletedAt?: Maybe<Scalars['Date']>;
  emails: Array<Email>;
  emailsUpdatedAt: Scalars['Date'];
  permanentlyDeleted: Scalars['Boolean'];
  sentLabelUpdatedAt?: Maybe<Scalars['Date']>;
  threadID: Scalars['String'];
  updatedAt: Scalars['Date'];
  userID: Scalars['String'];
};

export type UserVerifiedKey = {
  __typename?: 'UserVerifiedKey';
  keys?: Maybe<Scalars['JSON']>;
  lastVerifiedDate?: Maybe<Scalars['Date']>;
};

export type VerifyWalletAddressCreateAliasRequest = {
  challenge: Scalars['String'];
  challengeSignature: Scalars['String'];
  isEditorOnboarding: Scalars['Boolean'];
  source: Scalars['String'];
  walletType: Scalars['String'];
};

export type VerifyWebAuthnRegistrationRequest = {
  keyName?: InputMaybe<Scalars['String']>;
  verificationData: Scalars['JSON'];
};

export type VerifyWebAuthnRegistrationResponse = {
  __typename?: 'VerifyWebAuthnRegistrationResponse';
  status: RequestStatus;
};

export type WebAuthnKey = {
  __typename?: 'WebAuthnKey';
  credentialID: Scalars['String'];
  keyName?: Maybe<Scalars['String']>;
  lastSuccessfulChallenge?: Maybe<Scalars['Date']>;
  transports?: Maybe<Array<Scalars['String']>>;
};

export type WorkspaceEventRequest = {
  data: Scalars['String'];
  eventName: WorkspaceEventType;
  platformInfo?: InputMaybe<PlatformInfo>;
  version: Scalars['String'];
};

export enum WorkspaceEventType {
  AcceptInviteFail = 'ACCEPT_INVITE_FAIL',
  AccountRecoveryFailure = 'ACCOUNT_RECOVERY_FAILURE',
  AccountRecoveryForgotPassword = 'ACCOUNT_RECOVERY_FORGOT_PASSWORD',
  AccountRecoveryForgotPasswordMobile = 'ACCOUNT_RECOVERY_FORGOT_PASSWORD_MOBILE',
  AccountRecoveryKeyReset = 'ACCOUNT_RECOVERY_KEY_RESET',
  AccountRecoveryNoAccountFound = 'ACCOUNT_RECOVERY_NO_ACCOUNT_FOUND',
  AccountRecoveryNoBrowserShare = 'ACCOUNT_RECOVERY_NO_BROWSER_SHARE',
  AccountRecoverySuccess = 'ACCOUNT_RECOVERY_SUCCESS',
  AccountRecoveryToggle = 'ACCOUNT_RECOVERY_TOGGLE',
  ActivationChecklistItemClick = 'ACTIVATION_CHECKLIST_ITEM_CLICK',
  ActivationChecklistPermanentlyHide = 'ACTIVATION_CHECKLIST_PERMANENTLY_HIDE',
  ActivationChecklistStartCheckout = 'ACTIVATION_CHECKLIST_START_CHECKOUT',
  ActivationChecklistToggle = 'ACTIVATION_CHECKLIST_TOGGLE',
  AddAccountStart = 'ADD_ACCOUNT_START',
  AliasInboxDisabled = 'ALIAS_INBOX_DISABLED',
  AliasInboxEnabled = 'ALIAS_INBOX_ENABLED',
  AliasNext = 'ALIAS_NEXT',
  BackgroundTaskDuration = 'BACKGROUND_TASK_DURATION',
  BuyCustomDomainClick = 'BUY_CUSTOM_DOMAIN_CLICK',
  BuyCustomDomainWithTrialClick = 'BUY_CUSTOM_DOMAIN_WITH_TRIAL_CLICK',
  CloseBanner = 'CLOSE_BANNER',
  CloseDownloadCalendarMobileBanner = 'CLOSE_DOWNLOAD_CALENDAR_MOBILE_BANNER',
  CloseSkemailBanner = 'CLOSE_SKEMAIL_BANNER',
  CreateMailFilterClicked = 'CREATE_MAIL_FILTER_CLICKED',
  CryptoCheckoutStarted = 'CRYPTO_CHECKOUT_STARTED',
  CustomDomainPurchased = 'CUSTOM_DOMAIN_PURCHASED',
  CustomDomainSuggestionsShown = 'CUSTOM_DOMAIN_SUGGESTIONS_SHOWN',
  DashboardInviteSent = 'DASHBOARD_INVITE_SENT',
  DelinquencyBannerClick = 'DELINQUENCY_BANNER_CLICK',
  DelinquencyBannerShown = 'DELINQUENCY_BANNER_SHOWN',
  DelinquencyModalShown = 'DELINQUENCY_MODAL_SHOWN',
  DelinquencyModalUpgradeClick = 'DELINQUENCY_MODAL_UPGRADE_CLICK',
  DirectOnboardingCalendar = 'DIRECT_ONBOARDING_CALENDAR',
  DirectOnboardingDrive = 'DIRECT_ONBOARDING_DRIVE',
  DirectOnboardingMail = 'DIRECT_ONBOARDING_MAIL',
  DirectOnboardingPages = 'DIRECT_ONBOARDING_PAGES',
  DisableDefaultSignature = 'DISABLE_DEFAULT_SIGNATURE',
  DriveImport = 'DRIVE_IMPORT',
  DriveSignInInitiate = 'DRIVE_SIGN_IN_INITIATE',
  DriveSignInSuccess = 'DRIVE_SIGN_IN_SUCCESS',
  DriveStart = 'DRIVE_START',
  EnableDefaultSignature = 'ENABLE_DEFAULT_SIGNATURE',
  GenerateJitsiLink = 'GENERATE_JITSI_LINK',
  GetStartedChecklistAllComplete = 'GET_STARTED_CHECKLIST_ALL_COMPLETE',
  GetStartedChecklistItemClick = 'GET_STARTED_CHECKLIST_ITEM_CLICK',
  GetStartedChecklistItemComplete = 'GET_STARTED_CHECKLIST_ITEM_COMPLETE',
  GetStartedChecklistItemSkip = 'GET_STARTED_CHECKLIST_ITEM_SKIP',
  GetStartedChecklistPartialComplete = 'GET_STARTED_CHECKLIST_PARTIAL_COMPLETE',
  GetStartedChecklistSkipAll = 'GET_STARTED_CHECKLIST_SKIP_ALL',
  GetStartedStepComplete = 'GET_STARTED_STEP_COMPLETE',
  GetStartedStepSkip = 'GET_STARTED_STEP_SKIP',
  IpfsToggle = 'IPFS_TOGGLE',
  JoyrideSkip = 'JOYRIDE_SKIP',
  LoginPage = 'LOGIN_PAGE',
  Logout = 'LOGOUT',
  MailImportOpen = 'MAIL_IMPORT_OPEN',
  MobileMailAppError = 'MOBILE_MAIL_APP_ERROR',
  MobileThreadRecovered = 'MOBILE_THREAD_RECOVERED',
  NativeAddAccount = 'NATIVE_ADD_ACCOUNT',
  NewUpload = 'NEW_UPLOAD',
  OnboardingDownloadRecoveryKey = 'ONBOARDING_DOWNLOAD_RECOVERY_KEY',
  OnboardingPlanSelect = 'ONBOARDING_PLAN_SELECT',
  OnboardingRecoveryInstruction = 'ONBOARDING_RECOVERY_INSTRUCTION',
  OnboardingSelectCalendar = 'ONBOARDING_SELECT_CALENDAR',
  OnboardingSelectDrive = 'ONBOARDING_SELECT_DRIVE',
  OnboardingSelectLearnMore = 'ONBOARDING_SELECT_LEARN_MORE',
  OnboardingSelectMail = 'ONBOARDING_SELECT_MAIL',
  OnboardingSelectPages = 'ONBOARDING_SELECT_PAGES',
  OnboardingSetRecoveryEmail = 'ONBOARDING_SET_RECOVERY_EMAIL',
  OnboardingStepFinished = 'ONBOARDING_STEP_FINISHED',
  OnboardingStepShown = 'ONBOARDING_STEP_SHOWN',
  OnboardingViewPlanDetailsClick = 'ONBOARDING_VIEW_PLAN_DETAILS_CLICK',
  OnboardInviteSent = 'ONBOARD_INVITE_SENT',
  OpenInboxFirstTimeFromOrgSelect = 'OPEN_INBOX_FIRST_TIME_FROM_ORG_SELECT',
  OpenInboxFromBanner = 'OPEN_INBOX_FROM_BANNER',
  OpenInboxFromJoyride = 'OPEN_INBOX_FROM_JOYRIDE',
  OpenSkemailAndroidAppFromBanner = 'OPEN_SKEMAIL_ANDROID_APP_FROM_BANNER',
  OpenSkemailIphoneAppFromBanner = 'OPEN_SKEMAIL_IPHONE_APP_FROM_BANNER',
  PerformedBackgroundTask = 'PERFORMED_BACKGROUND_TASK',
  PlanChangeStarted = 'PLAN_CHANGE_STARTED',
  PlanTableShown = 'PLAN_TABLE_SHOWN',
  PwNextBtn = 'PW_NEXT_BTN',
  Search = 'SEARCH',
  SelectTheme = 'SELECT_THEME',
  SignupConnectWalletStart = 'SIGNUP_CONNECT_WALLET_START',
  SignupStart = 'SIGNUP_START',
  SkemailAppCreateFolder = 'SKEMAIL_APP_CREATE_FOLDER',
  SkemailAppCreateLabel = 'SKEMAIL_APP_CREATE_LABEL',
  SkemailAppLoadingTime = 'SKEMAIL_APP_LOADING_TIME',
  SkemailAppLoadingTimeout = 'SKEMAIL_APP_LOADING_TIMEOUT',
  SkemailAppLogin = 'SKEMAIL_APP_LOGIN',
  SkemailAppLoginAttempt = 'SKEMAIL_APP_LOGIN_ATTEMPT',
  SkemailAppOpenCompose = 'SKEMAIL_APP_OPEN_COMPOSE',
  SkemailAppSendClick = 'SKEMAIL_APP_SEND_CLICK',
  SkemailAppThreadLoadingTime = 'SKEMAIL_APP_THREAD_LOADING_TIME',
  SwitchFromEditorToEmail = 'SWITCH_FROM_EDITOR_TO_EMAIL',
  SwitchFromEmailToEditor = 'SWITCH_FROM_EMAIL_TO_EDITOR',
  ToastCtaClick = 'TOAST_CTA_CLICK',
  ToastImpression = 'TOAST_IMPRESSION',
  TwoFactorToggle = 'TWO_FACTOR_TOGGLE',
  UpgradeFromSearch = 'UPGRADE_FROM_SEARCH',
  UpgradeFromStorage = 'UPGRADE_FROM_STORAGE',
  UpgradeFromUpload = 'UPGRADE_FROM_UPLOAD',
  UpgradeStarted = 'UPGRADE_STARTED',
  UserBrowser = 'USER_BROWSER',
  UserMacDesktop = 'USER_MAC_DESKTOP',
  UserOs = 'USER_OS',
  UserPlatform = 'USER_PLATFORM',
  UserReactNative = 'USER_REACT_NATIVE',
  UserSkemailApp = 'USER_SKEMAIL_APP'
}

export enum Join__Graph {
  Editor = 'EDITOR',
  Skalendar = 'SKALENDAR',
  Skemail = 'SKEMAIL'
}

export enum Link__Purpose {
  /** `EXECUTION` features provide metadata necessary for operation execution. */
  Execution = 'EXECUTION',
  /** `SECURITY` features provide metadata necessary to securely resolve fields. */
  Security = 'SECURITY'
}
