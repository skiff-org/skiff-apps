"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Link__Purpose = exports.Join__Graph = exports.WorkspaceEventType = exports.UserTags = exports.UserLabelVariant = exports.UserFeature = exports.ThreadDisplayFormat = exports.TeamAccess = exports.SystemLabels = exports.SyncState = exports.SwipeSetting = exports.SubscriptionPlan = exports.SubscriptionInterval = exports.SignatureContext = exports.Role = exports.RequestStatus = exports.RecurrenceFrequency = exports.RecurrenceDay = exports.ProductApp = exports.PermissionLevel = exports.NwContentType = exports.NotificationChannelType = exports.MfaTypes = exports.LoginMutationStatus = exports.ImportClients = exports.FilterType = exports.FilterField = exports.EventUpdateType = exports.EventType = exports.EntityType = exports.EmailAutoForwardingClient = exports.DocumentVisibility = exports.DocumentOperation = exports.DocumentEventType = exports.DateFormat = exports.DnsRecordType = exports.CreditTransactionReason = exports.CreditInfo = exports.CacheControlScope = exports.BottomDrawerModes = exports.AttendeeStatus = exports.AttendeePermission = exports.AscDesc = exports.AdditionalContext = exports.ActionType = exports.AccountRecovery = exports.AccentColor = void 0;
var AccentColor;
(function (AccentColor) {
    AccentColor["Blue"] = "BLUE";
    AccentColor["DarkBlue"] = "DARK_BLUE";
    AccentColor["Green"] = "GREEN";
    AccentColor["Orange"] = "ORANGE";
    AccentColor["Pink"] = "PINK";
    AccentColor["Red"] = "RED";
    AccentColor["Yellow"] = "YELLOW";
})(AccentColor || (exports.AccentColor = AccentColor = {}));
var AccountRecovery;
(function (AccountRecovery) {
    AccountRecovery["EmailSendFailed"] = "EMAIL_SEND_FAILED";
    AccountRecovery["InvalidRecoveryKey"] = "INVALID_RECOVERY_KEY";
    AccountRecovery["NotVerifiedEmail"] = "NOT_VERIFIED_EMAIL";
    AccountRecovery["SentEmail"] = "SENT_EMAIL";
    AccountRecovery["VerifiedEmail"] = "VERIFIED_EMAIL";
    AccountRecovery["VerifiedRecoveryKey"] = "VERIFIED_RECOVERY_KEY";
})(AccountRecovery || (exports.AccountRecovery = AccountRecovery = {}));
var ActionType;
(function (ActionType) {
    ActionType["ApplyLabel"] = "APPLY_LABEL";
    ActionType["ApplySystemLabel"] = "APPLY_SYSTEM_LABEL";
    ActionType["MarkAsRead"] = "MARK_AS_READ";
})(ActionType || (exports.ActionType = ActionType = {}));
var AdditionalContext;
(function (AdditionalContext) {
    AdditionalContext["LastChunk"] = "LAST_CHUNK";
    AdditionalContext["NotLastChunk"] = "NOT_LAST_CHUNK";
    AdditionalContext["NoContext"] = "NO_CONTEXT";
})(AdditionalContext || (exports.AdditionalContext = AdditionalContext = {}));
var AscDesc;
(function (AscDesc) {
    AscDesc["Asc"] = "ASC";
    AscDesc["Desc"] = "DESC";
})(AscDesc || (exports.AscDesc = AscDesc = {}));
var AttendeePermission;
(function (AttendeePermission) {
    AttendeePermission["Owner"] = "OWNER";
    AttendeePermission["Read"] = "READ";
    AttendeePermission["Write"] = "WRITE";
})(AttendeePermission || (exports.AttendeePermission = AttendeePermission = {}));
var AttendeeStatus;
(function (AttendeeStatus) {
    AttendeeStatus["Maybe"] = "MAYBE";
    AttendeeStatus["No"] = "NO";
    AttendeeStatus["Pending"] = "PENDING";
    AttendeeStatus["Yes"] = "YES";
})(AttendeeStatus || (exports.AttendeeStatus = AttendeeStatus = {}));
var BottomDrawerModes;
(function (BottomDrawerModes) {
    BottomDrawerModes["Closed"] = "CLOSED";
    BottomDrawerModes["Feedback"] = "FEEDBACK";
    BottomDrawerModes["Uploads"] = "UPLOADS";
})(BottomDrawerModes || (exports.BottomDrawerModes = BottomDrawerModes = {}));
var CacheControlScope;
(function (CacheControlScope) {
    CacheControlScope["Private"] = "PRIVATE";
    CacheControlScope["Public"] = "PUBLIC";
})(CacheControlScope || (exports.CacheControlScope = CacheControlScope = {}));
var CreditInfo;
(function (CreditInfo) {
    CreditInfo["CreditsFromAndroidApp"] = "CREDITS_FROM_ANDROID_APP";
    CreditInfo["CreditsFromGmailImport"] = "CREDITS_FROM_GMAIL_IMPORT";
    CreditInfo["CreditsFromGoogleDriveImports"] = "CREDITS_FROM_GOOGLE_DRIVE_IMPORTS";
    CreditInfo["CreditsFromIosApp"] = "CREDITS_FROM_IOS_APP";
    CreditInfo["CreditsFromMacApp"] = "CREDITS_FROM_MAC_APP";
    CreditInfo["CreditsFromOutlookImport"] = "CREDITS_FROM_OUTLOOK_IMPORT";
    CreditInfo["CreditsFromReferrals"] = "CREDITS_FROM_REFERRALS";
    CreditInfo["CurrentCredits"] = "CURRENT_CREDITS";
    CreditInfo["TotalCreditsEarned"] = "TOTAL_CREDITS_EARNED";
})(CreditInfo || (exports.CreditInfo = CreditInfo = {}));
var CreditTransactionReason;
(function (CreditTransactionReason) {
    CreditTransactionReason["AndroidApp"] = "ANDROID_APP";
    CreditTransactionReason["EnsName"] = "ENS_NAME";
    CreditTransactionReason["GmailImport"] = "GMAIL_IMPORT";
    CreditTransactionReason["GoogleDriveImport"] = "GOOGLE_DRIVE_IMPORT";
    CreditTransactionReason["IosApp"] = "IOS_APP";
    CreditTransactionReason["MacApp"] = "MAC_APP";
    CreditTransactionReason["Manual"] = "MANUAL";
    CreditTransactionReason["OutlookImport"] = "OUTLOOK_IMPORT";
    CreditTransactionReason["RedeemedStripeCoupon"] = "REDEEMED_STRIPE_COUPON";
    CreditTransactionReason["Referee"] = "REFEREE";
    CreditTransactionReason["Referral"] = "REFERRAL";
    CreditTransactionReason["RevertSkiffCreditCouponProration"] = "REVERT_SKIFF_CREDIT_COUPON_PRORATION";
    CreditTransactionReason["SkiffCreditCouponProration"] = "SKIFF_CREDIT_COUPON_PRORATION";
    CreditTransactionReason["StripeCredit"] = "STRIPE_CREDIT";
    CreditTransactionReason["StripeDebit"] = "STRIPE_DEBIT";
})(CreditTransactionReason || (exports.CreditTransactionReason = CreditTransactionReason = {}));
var DnsRecordType;
(function (DnsRecordType) {
    DnsRecordType["Cname"] = "CNAME";
    DnsRecordType["Mx"] = "MX";
    DnsRecordType["Txt"] = "TXT";
})(DnsRecordType || (exports.DnsRecordType = DnsRecordType = {}));
var DateFormat;
(function (DateFormat) {
    DateFormat["DdMmYyyy"] = "DD_MM_YYYY";
    DateFormat["MmDdYyyy"] = "MM_DD_YYYY";
    DateFormat["YyyyMmDd"] = "YYYY_MM_DD";
})(DateFormat || (exports.DateFormat = DateFormat = {}));
var DocumentEventType;
(function (DocumentEventType) {
    DocumentEventType["CommentReply"] = "COMMENT_REPLY";
    DocumentEventType["DocumentEdit"] = "DOCUMENT_EDIT";
    DocumentEventType["DocumentShare"] = "DOCUMENT_SHARE";
    DocumentEventType["NewComment"] = "NEW_COMMENT";
    DocumentEventType["NewCommentMention"] = "NEW_COMMENT_MENTION";
    DocumentEventType["NewMention"] = "NEW_MENTION";
})(DocumentEventType || (exports.DocumentEventType = DocumentEventType = {}));
var DocumentOperation;
(function (DocumentOperation) {
    DocumentOperation["Delete"] = "DELETE";
    DocumentOperation["Save"] = "SAVE";
    DocumentOperation["Share"] = "SHARE";
    DocumentOperation["Unshare"] = "UNSHARE";
    DocumentOperation["UpgradeKeys"] = "UPGRADE_KEYS";
})(DocumentOperation || (exports.DocumentOperation = DocumentOperation = {}));
var DocumentVisibility;
(function (DocumentVisibility) {
    DocumentVisibility["All"] = "ALL";
    DocumentVisibility["Drive"] = "DRIVE";
    DocumentVisibility["Pages"] = "PAGES";
})(DocumentVisibility || (exports.DocumentVisibility = DocumentVisibility = {}));
var EmailAutoForwardingClient;
(function (EmailAutoForwardingClient) {
    EmailAutoForwardingClient["Gmail"] = "Gmail";
    EmailAutoForwardingClient["Outlook"] = "Outlook";
})(EmailAutoForwardingClient || (exports.EmailAutoForwardingClient = EmailAutoForwardingClient = {}));
var EntityType;
(function (EntityType) {
    EntityType["Org"] = "ORG";
    EntityType["User"] = "USER";
})(EntityType || (exports.EntityType = EntityType = {}));
var EventType;
(function (EventType) {
    EventType["ActiveStatus"] = "ACTIVE_STATUS";
    EventType["DeleteDocument"] = "DELETE_DOCUMENT";
    EventType["DocumentRestore"] = "DOCUMENT_RESTORE";
    EventType["DocumentUpdate"] = "DOCUMENT_UPDATE";
    EventType["FilesystemUpdate"] = "FILESYSTEM_UPDATE";
    EventType["JoinDocumentRoom"] = "JOIN_DOCUMENT_ROOM";
    EventType["LeaveDocumentRoom"] = "LEAVE_DOCUMENT_ROOM";
    EventType["Logout"] = "LOGOUT";
    EventType["MetadataUpdate"] = "METADATA_UPDATE";
    EventType["ShareDocument"] = "SHARE_DOCUMENT";
    EventType["UnshareDocument"] = "UNSHARE_DOCUMENT";
})(EventType || (exports.EventType = EventType = {}));
var EventUpdateType;
(function (EventUpdateType) {
    EventUpdateType["Content"] = "Content";
    EventUpdateType["Preferences"] = "Preferences";
    EventUpdateType["Rsvp"] = "RSVP";
})(EventUpdateType || (exports.EventUpdateType = EventUpdateType = {}));
var FilterField;
(function (FilterField) {
    FilterField["Contains"] = "CONTAINS";
})(FilterField || (exports.FilterField = FilterField = {}));
var FilterType;
(function (FilterType) {
    FilterType["And"] = "AND";
    FilterType["Bcc"] = "BCC";
    FilterType["Body"] = "BODY";
    FilterType["Cc"] = "CC";
    FilterType["From"] = "FROM";
    FilterType["Not"] = "NOT";
    FilterType["Or"] = "OR";
    FilterType["Recipient"] = "RECIPIENT";
    FilterType["Subject"] = "SUBJECT";
    FilterType["To"] = "TO";
})(FilterType || (exports.FilterType = FilterType = {}));
var ImportClients;
(function (ImportClients) {
    ImportClients["Gmail"] = "Gmail";
    ImportClients["Outlook"] = "Outlook";
})(ImportClients || (exports.ImportClients = ImportClients = {}));
var LoginMutationStatus;
(function (LoginMutationStatus) {
    LoginMutationStatus["Authenticated"] = "AUTHENTICATED";
    LoginMutationStatus["AuthFailure"] = "AUTH_FAILURE";
    LoginMutationStatus["ChangeTemporaryPassword"] = "CHANGE_TEMPORARY_PASSWORD";
    LoginMutationStatus["Created"] = "CREATED";
    LoginMutationStatus["InvalidJwt"] = "INVALID_JWT";
    LoginMutationStatus["Rejected"] = "REJECTED";
    LoginMutationStatus["TokenNeeded"] = "TOKEN_NEEDED";
    LoginMutationStatus["Updated"] = "UPDATED";
    LoginMutationStatus["UsernameInvalid"] = "USERNAME_INVALID";
    LoginMutationStatus["WebauthnTokenNeeded"] = "WEBAUTHN_TOKEN_NEEDED";
})(LoginMutationStatus || (exports.LoginMutationStatus = LoginMutationStatus = {}));
var MfaTypes;
(function (MfaTypes) {
    MfaTypes["BackupCode"] = "BACKUP_CODE";
    MfaTypes["Totp"] = "TOTP";
    MfaTypes["Webauthn"] = "WEBAUTHN";
})(MfaTypes || (exports.MfaTypes = MfaTypes = {}));
var NotificationChannelType;
(function (NotificationChannelType) {
    NotificationChannelType["Email"] = "EMAIL";
})(NotificationChannelType || (exports.NotificationChannelType = NotificationChannelType = {}));
var NwContentType;
(function (NwContentType) {
    NwContentType["File"] = "FILE";
    NwContentType["Folder"] = "FOLDER";
    NwContentType["Pdf"] = "PDF";
    NwContentType["RichText"] = "RICH_TEXT";
})(NwContentType || (exports.NwContentType = NwContentType = {}));
var PermissionLevel;
(function (PermissionLevel) {
    PermissionLevel["Admin"] = "ADMIN";
    PermissionLevel["Editor"] = "EDITOR";
    PermissionLevel["Viewer"] = "VIEWER";
})(PermissionLevel || (exports.PermissionLevel = PermissionLevel = {}));
var ProductApp;
(function (ProductApp) {
    ProductApp["Calendar"] = "CALENDAR";
    ProductApp["Drive"] = "DRIVE";
    ProductApp["Mail"] = "MAIL";
    ProductApp["Pages"] = "PAGES";
})(ProductApp || (exports.ProductApp = ProductApp = {}));
var RecurrenceDay;
(function (RecurrenceDay) {
    RecurrenceDay["Friday"] = "FRIDAY";
    RecurrenceDay["Monday"] = "MONDAY";
    RecurrenceDay["Saturday"] = "SATURDAY";
    RecurrenceDay["Sunday"] = "SUNDAY";
    RecurrenceDay["Thursday"] = "THURSDAY";
    RecurrenceDay["Tuesday"] = "TUESDAY";
    RecurrenceDay["Wednesday"] = "WEDNESDAY";
})(RecurrenceDay || (exports.RecurrenceDay = RecurrenceDay = {}));
var RecurrenceFrequency;
(function (RecurrenceFrequency) {
    RecurrenceFrequency["Daily"] = "DAILY";
    RecurrenceFrequency["Hourly"] = "HOURLY";
    RecurrenceFrequency["Minutely"] = "MINUTELY";
    RecurrenceFrequency["Monthly"] = "MONTHLY";
    RecurrenceFrequency["Secondly"] = "SECONDLY";
    RecurrenceFrequency["Weekly"] = "WEEKLY";
    RecurrenceFrequency["Yearly"] = "YEARLY";
})(RecurrenceFrequency || (exports.RecurrenceFrequency = RecurrenceFrequency = {}));
var RequestStatus;
(function (RequestStatus) {
    RequestStatus["Failed"] = "FAILED";
    RequestStatus["Rejected"] = "REJECTED";
    RequestStatus["Saved"] = "SAVED";
    RequestStatus["Success"] = "SUCCESS";
})(RequestStatus || (exports.RequestStatus = RequestStatus = {}));
var Role;
(function (Role) {
    Role["Bcc"] = "BCC";
    Role["Cc"] = "CC";
    Role["From"] = "FROM";
    Role["To"] = "TO";
})(Role || (exports.Role = Role = {}));
var SignatureContext;
(function (SignatureContext) {
    SignatureContext["DeleteAccount"] = "DELETE_ACCOUNT";
    SignatureContext["DeleteDoc"] = "DELETE_DOC";
    SignatureContext["DeleteRecoveryData"] = "DELETE_RECOVERY_DATA";
    SignatureContext["DisableMfa"] = "DISABLE_MFA";
    SignatureContext["DocumentChunk"] = "DOCUMENT_CHUNK";
    SignatureContext["DocumentData"] = "DOCUMENT_DATA";
    SignatureContext["DocumentMetadata"] = "DOCUMENT_METADATA";
    SignatureContext["DocumentParent"] = "DOCUMENT_PARENT";
    SignatureContext["EnrollMfa"] = "ENROLL_MFA";
    SignatureContext["LinksLinkKey"] = "LINKS_LINK_KEY";
    SignatureContext["LinksSessionKey"] = "LINKS_SESSION_KEY";
    SignatureContext["MobileLogin"] = "MOBILE_LOGIN";
    SignatureContext["RecoveryData"] = "RECOVERY_DATA";
    SignatureContext["RegenerateMfaBackupCodes"] = "REGENERATE_MFA_BACKUP_CODES";
    SignatureContext["SessionKey"] = "SESSION_KEY";
    SignatureContext["SrpSalt"] = "SRP_SALT";
    SignatureContext["SrpVerifier"] = "SRP_VERIFIER";
    SignatureContext["UnshareDoc"] = "UNSHARE_DOC";
    SignatureContext["UpdateUserData"] = "UPDATE_USER_DATA";
    SignatureContext["UploadRecoveryEncryptedUserData"] = "UPLOAD_RECOVERY_ENCRYPTED_USER_DATA";
    SignatureContext["UploadRecoveryEncryptionPublicKey"] = "UPLOAD_RECOVERY_ENCRYPTION_PUBLIC_KEY";
    SignatureContext["UploadRecoveryServerShare"] = "UPLOAD_RECOVERY_SERVER_SHARE";
    SignatureContext["UploadRecoverySigningPublicKey"] = "UPLOAD_RECOVERY_SIGNING_PUBLIC_KEY";
    SignatureContext["UserData"] = "USER_DATA";
    SignatureContext["UserPublicKey"] = "USER_PUBLIC_KEY";
})(SignatureContext || (exports.SignatureContext = SignatureContext = {}));
var SubscriptionInterval;
(function (SubscriptionInterval) {
    SubscriptionInterval["Monthly"] = "MONTHLY";
    SubscriptionInterval["Yearly"] = "YEARLY";
})(SubscriptionInterval || (exports.SubscriptionInterval = SubscriptionInterval = {}));
var SubscriptionPlan;
(function (SubscriptionPlan) {
    SubscriptionPlan["Business"] = "BUSINESS";
    SubscriptionPlan["Essential"] = "ESSENTIAL";
    SubscriptionPlan["Free"] = "FREE";
    SubscriptionPlan["Pro"] = "PRO";
})(SubscriptionPlan || (exports.SubscriptionPlan = SubscriptionPlan = {}));
var SwipeSetting;
(function (SwipeSetting) {
    SwipeSetting["Archive"] = "ARCHIVE";
    SwipeSetting["Delete"] = "DELETE";
    SwipeSetting["Unread"] = "UNREAD";
})(SwipeSetting || (exports.SwipeSetting = SwipeSetting = {}));
var SyncState;
(function (SyncState) {
    SyncState["Conflict"] = "CONFLICT";
    SyncState["Synced"] = "SYNCED";
})(SyncState || (exports.SyncState = SyncState = {}));
var SystemLabels;
(function (SystemLabels) {
    SystemLabels["Archive"] = "ARCHIVE";
    SystemLabels["Drafts"] = "DRAFTS";
    SystemLabels["Imports"] = "IMPORTS";
    SystemLabels["Inbox"] = "INBOX";
    SystemLabels["ScheduleSend"] = "SCHEDULE_SEND";
    SystemLabels["Sent"] = "SENT";
    SystemLabels["Spam"] = "SPAM";
    SystemLabels["Trash"] = "TRASH";
    SystemLabels["Virus"] = "VIRUS";
})(SystemLabels || (exports.SystemLabels = SystemLabels = {}));
var TeamAccess;
(function (TeamAccess) {
    TeamAccess["Everyone"] = "EVERYONE";
    TeamAccess["InviteOnly"] = "INVITE_ONLY";
    TeamAccess["Personal"] = "PERSONAL";
})(TeamAccess || (exports.TeamAccess = TeamAccess = {}));
var ThreadDisplayFormat;
(function (ThreadDisplayFormat) {
    ThreadDisplayFormat["Full"] = "FULL";
    ThreadDisplayFormat["Right"] = "RIGHT";
})(ThreadDisplayFormat || (exports.ThreadDisplayFormat = ThreadDisplayFormat = {}));
var UserFeature;
(function (UserFeature) {
    UserFeature["EmailNotificationDisabled"] = "EMAIL_NOTIFICATION_DISABLED";
    UserFeature["InAppNotificationDisabled"] = "IN_APP_NOTIFICATION_DISABLED";
    UserFeature["IpfsEnabled"] = "IPFS_ENABLED";
    UserFeature["LogMime"] = "LOG_MIME";
})(UserFeature || (exports.UserFeature = UserFeature = {}));
var UserLabelVariant;
(function (UserLabelVariant) {
    UserLabelVariant["Alias"] = "ALIAS";
    UserLabelVariant["Folder"] = "FOLDER";
    UserLabelVariant["Plain"] = "PLAIN";
})(UserLabelVariant || (exports.UserLabelVariant = UserLabelVariant = {}));
var UserTags;
(function (UserTags) {
    UserTags["PilotProgram"] = "PILOT_PROGRAM";
    UserTags["UserFeatures"] = "USER_FEATURES";
})(UserTags || (exports.UserTags = UserTags = {}));
var WorkspaceEventType;
(function (WorkspaceEventType) {
    WorkspaceEventType["AcceptInviteFail"] = "ACCEPT_INVITE_FAIL";
    WorkspaceEventType["AccountRecoveryFailure"] = "ACCOUNT_RECOVERY_FAILURE";
    WorkspaceEventType["AccountRecoveryForgotPassword"] = "ACCOUNT_RECOVERY_FORGOT_PASSWORD";
    WorkspaceEventType["AccountRecoveryForgotPasswordMobile"] = "ACCOUNT_RECOVERY_FORGOT_PASSWORD_MOBILE";
    WorkspaceEventType["AccountRecoveryKeyReset"] = "ACCOUNT_RECOVERY_KEY_RESET";
    WorkspaceEventType["AccountRecoveryNoAccountFound"] = "ACCOUNT_RECOVERY_NO_ACCOUNT_FOUND";
    WorkspaceEventType["AccountRecoveryNoBrowserShare"] = "ACCOUNT_RECOVERY_NO_BROWSER_SHARE";
    WorkspaceEventType["AccountRecoverySuccess"] = "ACCOUNT_RECOVERY_SUCCESS";
    WorkspaceEventType["AccountRecoveryToggle"] = "ACCOUNT_RECOVERY_TOGGLE";
    WorkspaceEventType["ActivationChecklistItemClick"] = "ACTIVATION_CHECKLIST_ITEM_CLICK";
    WorkspaceEventType["ActivationChecklistPermanentlyHide"] = "ACTIVATION_CHECKLIST_PERMANENTLY_HIDE";
    WorkspaceEventType["ActivationChecklistStartCheckout"] = "ACTIVATION_CHECKLIST_START_CHECKOUT";
    WorkspaceEventType["ActivationChecklistToggle"] = "ACTIVATION_CHECKLIST_TOGGLE";
    WorkspaceEventType["AddAccountStart"] = "ADD_ACCOUNT_START";
    WorkspaceEventType["AliasInboxDisabled"] = "ALIAS_INBOX_DISABLED";
    WorkspaceEventType["AliasInboxEnabled"] = "ALIAS_INBOX_ENABLED";
    WorkspaceEventType["AliasNext"] = "ALIAS_NEXT";
    WorkspaceEventType["BackgroundTaskDuration"] = "BACKGROUND_TASK_DURATION";
    WorkspaceEventType["BuyCustomDomainClick"] = "BUY_CUSTOM_DOMAIN_CLICK";
    WorkspaceEventType["BuyCustomDomainWithTrialClick"] = "BUY_CUSTOM_DOMAIN_WITH_TRIAL_CLICK";
    WorkspaceEventType["CloseBanner"] = "CLOSE_BANNER";
    WorkspaceEventType["CloseDownloadCalendarMobileBanner"] = "CLOSE_DOWNLOAD_CALENDAR_MOBILE_BANNER";
    WorkspaceEventType["CloseSkemailBanner"] = "CLOSE_SKEMAIL_BANNER";
    WorkspaceEventType["CreateMailFilterClicked"] = "CREATE_MAIL_FILTER_CLICKED";
    WorkspaceEventType["CryptoCheckoutStarted"] = "CRYPTO_CHECKOUT_STARTED";
    WorkspaceEventType["CustomDomainPurchased"] = "CUSTOM_DOMAIN_PURCHASED";
    WorkspaceEventType["CustomDomainSuggestionsShown"] = "CUSTOM_DOMAIN_SUGGESTIONS_SHOWN";
    WorkspaceEventType["DashboardInviteSent"] = "DASHBOARD_INVITE_SENT";
    WorkspaceEventType["DelinquencyBannerClick"] = "DELINQUENCY_BANNER_CLICK";
    WorkspaceEventType["DelinquencyBannerShown"] = "DELINQUENCY_BANNER_SHOWN";
    WorkspaceEventType["DelinquencyModalShown"] = "DELINQUENCY_MODAL_SHOWN";
    WorkspaceEventType["DelinquencyModalUpgradeClick"] = "DELINQUENCY_MODAL_UPGRADE_CLICK";
    WorkspaceEventType["DirectOnboardingCalendar"] = "DIRECT_ONBOARDING_CALENDAR";
    WorkspaceEventType["DirectOnboardingDrive"] = "DIRECT_ONBOARDING_DRIVE";
    WorkspaceEventType["DirectOnboardingMail"] = "DIRECT_ONBOARDING_MAIL";
    WorkspaceEventType["DirectOnboardingPages"] = "DIRECT_ONBOARDING_PAGES";
    WorkspaceEventType["DisableDefaultSignature"] = "DISABLE_DEFAULT_SIGNATURE";
    WorkspaceEventType["DriveImport"] = "DRIVE_IMPORT";
    WorkspaceEventType["DriveSignInInitiate"] = "DRIVE_SIGN_IN_INITIATE";
    WorkspaceEventType["DriveSignInSuccess"] = "DRIVE_SIGN_IN_SUCCESS";
    WorkspaceEventType["DriveStart"] = "DRIVE_START";
    WorkspaceEventType["EnableDefaultSignature"] = "ENABLE_DEFAULT_SIGNATURE";
    WorkspaceEventType["GenerateJitsiLink"] = "GENERATE_JITSI_LINK";
    WorkspaceEventType["GetStartedChecklistAllComplete"] = "GET_STARTED_CHECKLIST_ALL_COMPLETE";
    WorkspaceEventType["GetStartedChecklistItemClick"] = "GET_STARTED_CHECKLIST_ITEM_CLICK";
    WorkspaceEventType["GetStartedChecklistItemComplete"] = "GET_STARTED_CHECKLIST_ITEM_COMPLETE";
    WorkspaceEventType["GetStartedChecklistItemSkip"] = "GET_STARTED_CHECKLIST_ITEM_SKIP";
    WorkspaceEventType["GetStartedChecklistPartialComplete"] = "GET_STARTED_CHECKLIST_PARTIAL_COMPLETE";
    WorkspaceEventType["GetStartedChecklistSkipAll"] = "GET_STARTED_CHECKLIST_SKIP_ALL";
    WorkspaceEventType["GetStartedStepComplete"] = "GET_STARTED_STEP_COMPLETE";
    WorkspaceEventType["GetStartedStepSkip"] = "GET_STARTED_STEP_SKIP";
    WorkspaceEventType["IpfsToggle"] = "IPFS_TOGGLE";
    WorkspaceEventType["JoyrideSkip"] = "JOYRIDE_SKIP";
    WorkspaceEventType["LoginPage"] = "LOGIN_PAGE";
    WorkspaceEventType["Logout"] = "LOGOUT";
    WorkspaceEventType["MailImportOpen"] = "MAIL_IMPORT_OPEN";
    WorkspaceEventType["MobileMailAppError"] = "MOBILE_MAIL_APP_ERROR";
    WorkspaceEventType["MobileThreadRecovered"] = "MOBILE_THREAD_RECOVERED";
    WorkspaceEventType["NativeAddAccount"] = "NATIVE_ADD_ACCOUNT";
    WorkspaceEventType["NewUpload"] = "NEW_UPLOAD";
    WorkspaceEventType["OnboardingDownloadRecoveryKey"] = "ONBOARDING_DOWNLOAD_RECOVERY_KEY";
    WorkspaceEventType["OnboardingPlanSelect"] = "ONBOARDING_PLAN_SELECT";
    WorkspaceEventType["OnboardingRecoveryInstruction"] = "ONBOARDING_RECOVERY_INSTRUCTION";
    WorkspaceEventType["OnboardingSelectCalendar"] = "ONBOARDING_SELECT_CALENDAR";
    WorkspaceEventType["OnboardingSelectDrive"] = "ONBOARDING_SELECT_DRIVE";
    WorkspaceEventType["OnboardingSelectLearnMore"] = "ONBOARDING_SELECT_LEARN_MORE";
    WorkspaceEventType["OnboardingSelectMail"] = "ONBOARDING_SELECT_MAIL";
    WorkspaceEventType["OnboardingSelectPages"] = "ONBOARDING_SELECT_PAGES";
    WorkspaceEventType["OnboardingSetRecoveryEmail"] = "ONBOARDING_SET_RECOVERY_EMAIL";
    WorkspaceEventType["OnboardingStepFinished"] = "ONBOARDING_STEP_FINISHED";
    WorkspaceEventType["OnboardingStepShown"] = "ONBOARDING_STEP_SHOWN";
    WorkspaceEventType["OnboardingViewPlanDetailsClick"] = "ONBOARDING_VIEW_PLAN_DETAILS_CLICK";
    WorkspaceEventType["OnboardInviteSent"] = "ONBOARD_INVITE_SENT";
    WorkspaceEventType["OpenInboxFirstTimeFromOrgSelect"] = "OPEN_INBOX_FIRST_TIME_FROM_ORG_SELECT";
    WorkspaceEventType["OpenInboxFromBanner"] = "OPEN_INBOX_FROM_BANNER";
    WorkspaceEventType["OpenInboxFromJoyride"] = "OPEN_INBOX_FROM_JOYRIDE";
    WorkspaceEventType["OpenSkemailAndroidAppFromBanner"] = "OPEN_SKEMAIL_ANDROID_APP_FROM_BANNER";
    WorkspaceEventType["OpenSkemailIphoneAppFromBanner"] = "OPEN_SKEMAIL_IPHONE_APP_FROM_BANNER";
    WorkspaceEventType["PerformedBackgroundTask"] = "PERFORMED_BACKGROUND_TASK";
    WorkspaceEventType["PlanChangeStarted"] = "PLAN_CHANGE_STARTED";
    WorkspaceEventType["PlanTableShown"] = "PLAN_TABLE_SHOWN";
    WorkspaceEventType["PwNextBtn"] = "PW_NEXT_BTN";
    WorkspaceEventType["Search"] = "SEARCH";
    WorkspaceEventType["SelectTheme"] = "SELECT_THEME";
    WorkspaceEventType["SignupConnectWalletStart"] = "SIGNUP_CONNECT_WALLET_START";
    WorkspaceEventType["SignupStart"] = "SIGNUP_START";
    WorkspaceEventType["SkemailAppCreateFolder"] = "SKEMAIL_APP_CREATE_FOLDER";
    WorkspaceEventType["SkemailAppCreateLabel"] = "SKEMAIL_APP_CREATE_LABEL";
    WorkspaceEventType["SkemailAppLoadingTime"] = "SKEMAIL_APP_LOADING_TIME";
    WorkspaceEventType["SkemailAppLoadingTimeout"] = "SKEMAIL_APP_LOADING_TIMEOUT";
    WorkspaceEventType["SkemailAppLogin"] = "SKEMAIL_APP_LOGIN";
    WorkspaceEventType["SkemailAppLoginAttempt"] = "SKEMAIL_APP_LOGIN_ATTEMPT";
    WorkspaceEventType["SkemailAppOpenCompose"] = "SKEMAIL_APP_OPEN_COMPOSE";
    WorkspaceEventType["SkemailAppSendClick"] = "SKEMAIL_APP_SEND_CLICK";
    WorkspaceEventType["SkemailAppThreadLoadingTime"] = "SKEMAIL_APP_THREAD_LOADING_TIME";
    WorkspaceEventType["SwitchFromEditorToEmail"] = "SWITCH_FROM_EDITOR_TO_EMAIL";
    WorkspaceEventType["SwitchFromEmailToEditor"] = "SWITCH_FROM_EMAIL_TO_EDITOR";
    WorkspaceEventType["ToastCtaClick"] = "TOAST_CTA_CLICK";
    WorkspaceEventType["ToastImpression"] = "TOAST_IMPRESSION";
    WorkspaceEventType["TwoFactorToggle"] = "TWO_FACTOR_TOGGLE";
    WorkspaceEventType["UpgradeFromSearch"] = "UPGRADE_FROM_SEARCH";
    WorkspaceEventType["UpgradeFromStorage"] = "UPGRADE_FROM_STORAGE";
    WorkspaceEventType["UpgradeFromUpload"] = "UPGRADE_FROM_UPLOAD";
    WorkspaceEventType["UpgradeStarted"] = "UPGRADE_STARTED";
    WorkspaceEventType["UserBrowser"] = "USER_BROWSER";
    WorkspaceEventType["UserMacDesktop"] = "USER_MAC_DESKTOP";
    WorkspaceEventType["UserOs"] = "USER_OS";
    WorkspaceEventType["UserPlatform"] = "USER_PLATFORM";
    WorkspaceEventType["UserReactNative"] = "USER_REACT_NATIVE";
    WorkspaceEventType["UserSkemailApp"] = "USER_SKEMAIL_APP";
})(WorkspaceEventType || (exports.WorkspaceEventType = WorkspaceEventType = {}));
var Join__Graph;
(function (Join__Graph) {
    Join__Graph["Editor"] = "EDITOR";
    Join__Graph["Skalendar"] = "SKALENDAR";
    Join__Graph["Skemail"] = "SKEMAIL";
})(Join__Graph || (exports.Join__Graph = Join__Graph = {}));
var Link__Purpose;
(function (Link__Purpose) {
    /** `EXECUTION` features provide metadata necessary for operation execution. */
    Link__Purpose["Execution"] = "EXECUTION";
    /** `SECURITY` features provide metadata necessary to securely resolve fields. */
    Link__Purpose["Security"] = "SECURITY";
})(Link__Purpose || (exports.Link__Purpose = Link__Purpose = {}));
//# sourceMappingURL=types.js.map