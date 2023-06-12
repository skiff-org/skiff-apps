/* eslint-disable @typescript-eslint/no-throw-literal */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable max-classes-per-file */
import { ApolloError } from 'apollo-server-errors'; // Using apollo-server-errors instead of apollo-server directly to prevent client from triggering a compilation error
import { CALENDAR_SYNC_ERROR_MESSAGE, PaywallErrorCode } from 'skiff-utils';

/**
 * Helper class to wrap ApolloError, add default values for message and code and add assert / assertExists methods
 */
export abstract class LogicError extends ApolloError {}

const createErrorObject = <T extends Record<string, any> = Record<string, never>>(
  code: string,
  defaultMessage: string
) =>
  class extends LogicError {
    static CODE = code;

    declare extensions: T;

    constructor(message: string | void, extensions?: T) {
      super(message || defaultMessage, code, extensions);
    }

    // can assert on anything except a promise, this is done to prevent
    static assert<U>(condition: U extends Promise<unknown> ? never : U, message: string | void, extensions?: T): void {
      if (!condition) {
        throw new this(message, extensions);
      }
    }

    static assertExists<U>(object: U | undefined | null, message: string | void, extensions?: T): asserts object is U {
      if (object === undefined || object === null) {
        throw new this(message, extensions);
      }
    }
  };

const _DocumentContentConflict = createErrorObject('DOCUMENT_CONTENT_CONFLICT', 'Document content conflict');
export const DocumentContentConflict: typeof _DocumentContentConflict = _DocumentContentConflict; // workaround https://github.com/microsoft/TypeScript/issues/34596#issuecomment-691574987

const _NotFound = createErrorObject('NOT_FOUND', 'Not found');
export const NotFound: typeof _NotFound = _NotFound;

const _Conflict = createErrorObject('CONFLICT', 'Conflict');
export const Conflict: typeof _Conflict = _Conflict;

const _NotAuthorized = createErrorObject('NOT_AUTHORIZED', 'Not authorized');
export const NotAuthorized: typeof _NotAuthorized = _NotAuthorized;

const _AuthenticationError = createErrorObject('AUTHENTICATION_ERROR', 'Authentication error');
export const AuthenticationError: typeof _AuthenticationError = _AuthenticationError;

const _BadRequest = createErrorObject('BAD_REQUEST', 'Bad request');
export const BadRequest: typeof _BadRequest = _BadRequest;

const _NeedNewSessionKey = createErrorObject<{ docID: string }>('NEED_NEW_SESSION_KEY', 'Need new session key');
export const NeedNewSessionKey: typeof _NeedNewSessionKey = _NeedNewSessionKey;

const _NeedNewHierarchicalKey = createErrorObject<{ docID: string }>(
  'NEED_NEW_HIERARCHICAL_KEY',
  'Need new hierarchical key'
);
export const NeedNewHierarchicalKey: typeof _NeedNewHierarchicalKey = _NeedNewHierarchicalKey;

const _NewKeyNotNeeded = createErrorObject('NEW_KEY_NOT_NEEDED', `Document doesn't need a new key`);
export const NewKeyNotNeeded: typeof _NewKeyNotNeeded = _NewKeyNotNeeded;

const _InvalidSignature = createErrorObject('INVALID_SIGNATURE', 'Invalid signature');
export const InvalidSignature: typeof _InvalidSignature = _InvalidSignature;

const _DocumentDoesNotExist = createErrorObject('DOCUMENT_DOES_NOT_EXIST', 'Document does not exist');
export const DocumentDoesNotExist: typeof _DocumentDoesNotExist = _DocumentDoesNotExist;

const _UserDoesNotExist = createErrorObject('USER_DOES_NOT_EXIST', 'User does not exist');
export const UserDoesNotExist: typeof _UserDoesNotExist = _UserDoesNotExist;

const _DocumentTooLarge = createErrorObject('DOCUMENT_TOO_LARGE', 'Document too large');
export const DocumentTooLarge: typeof _DocumentTooLarge = _DocumentTooLarge;

const _DocumentHierarchyConflict = createErrorObject('DOCUMENT_HIERARCHY_CONFLICT', 'Document hierarchy conflict');
export const DocumentHierarchyConflict: typeof _DocumentHierarchyConflict = _DocumentHierarchyConflict;

const _DocumentBatchTooLong = createErrorObject('DOCUMENT_BATCH_TOO_LARGE', 'Document batch is too large');
export const DocumentBatchTooLong: typeof _DocumentBatchTooLong = _DocumentBatchTooLong;

const _RateLimitError = createErrorObject<{ msBeforeNext: number; throttled?: boolean }>(
  'RATE_LIMIT_EXCEEDED',
  'rate limit exceeded'
);
export const RateLimitError: typeof _RateLimitError = _RateLimitError;

const _RawStorageError = createErrorObject('RAW_STORAGE_ERROR', 'Raw Storage Failure');
export const RawStorageError: typeof _RawStorageError = _RawStorageError;

const _InternalError = createErrorObject('INTERNAL_ERROR', 'Internal Error');
export const InternalError: typeof _InternalError = _InternalError;

const _BackupEmailExists = createErrorObject('BACKUP_EMAIL_EXISTS', 'Could not add email. Please enter another email.');
export const BackupEmailExists: typeof _BackupEmailExists = _BackupEmailExists;

const _UserNeedEmailAddress = createErrorObject(
  'USER_NEED_EMAIL_ADDRESS',
  'Current user need an email address for this action'
);
export const UserNeedEmailAddress: typeof _UserNeedEmailAddress = _UserNeedEmailAddress;

const _AlreadySubscribed = createErrorObject('ALREAD_SUBSCRIBED', 'You are already subscribed to a paying plan');
export const AlreadySubscribed: typeof _AlreadySubscribed = _AlreadySubscribed;

// TODO @rrrliu: Fix this before we launch Skiff 2.0
const _AliasLimitError = createErrorObject(PaywallErrorCode.AliasLimit, 'Reached alias limit.');
export const AliasLimitError: typeof _AliasLimitError = _AliasLimitError;

const _ShortAliasError = createErrorObject(PaywallErrorCode.ShortAlias, 'Reached short alias limit for tier.');
export const ShortAliasError: typeof _ShortAliasError = _ShortAliasError;

const _StorageLimitError = createErrorObject(PaywallErrorCode.StorageLimit, 'Reached storage limit for tier.');
export const StorageLimitError: typeof _StorageLimitError = _StorageLimitError;

const _UploadLimitError = createErrorObject(PaywallErrorCode.UploadLimit, 'Reached upload limit for tier.');
export const UploadLimitError: typeof _UploadLimitError = _UploadLimitError;

const _MessageLimitError = createErrorObject(PaywallErrorCode.MessageLimit, 'Reached message limit for tier.');
export const MessageLimitError: typeof _MessageLimitError = _MessageLimitError;

const _CustomDomainLimitError = createErrorObject(
  PaywallErrorCode.CustomDomainLimit,
  'Reached custom domain limit for tier.'
);
export const CustomDomainLimitError: typeof _CustomDomainLimitError = _CustomDomainLimitError;

const _UserLabelLimitError = createErrorObject(PaywallErrorCode.UserLabelLimit, 'Reached custom label limit for tier.');
export const UserLabelLimitError: typeof _UserLabelLimitError = _UserLabelLimitError;

const _UserFolderLimitError = createErrorObject(
  PaywallErrorCode.UserFolderLimit,
  'Reached custom folder limit for tier.'
);
export const UserFolderLimitError: typeof _UserFolderLimitError = _UserFolderLimitError;

const _WorkspaceUserLimitError = createErrorObject(
  PaywallErrorCode.WorkspaceUserLimit,
  'Reached user limit for workspace.'
);
export const WorkspaceUserLimitError: typeof _WorkspaceUserLimitError = _WorkspaceUserLimitError;

const _InvalidEthereumAddress = createErrorObject('INVALID_ETHEREUM_ADDRESS', 'Not a valid Ethereum address');
export const InvalidEthereumAddress: typeof _InvalidEthereumAddress = _InvalidEthereumAddress;

const _SyncFailedError = createErrorObject('SYNC_ERROR', CALENDAR_SYNC_ERROR_MESSAGE);
export const SyncFailedError: typeof _SyncFailedError = _SyncFailedError;

const _InvalidAliasDeletionError = createErrorObject('INVALID_ALIAS_DELETION', 'Could not delete invalid alias');
export const InvalidAliasDeletionError: typeof _InvalidAliasDeletionError = _InvalidAliasDeletionError;

const _CustomDomainIsDefaultAliasError = createErrorObject(
  'CUSTOM_DOMAIN_IN_USE_AS_DEFAULT',
  'Could not delete custom domain in use in default alias'
);
export const CustomDomainIsDefaultAliasError: typeof _CustomDomainIsDefaultAliasError =
  _CustomDomainIsDefaultAliasError;

const _CustomDomainIsInAllAliasesError = createErrorObject(
  'CUSTOM_DOMAIN_IS_IN_ALL_ALIASES',
  'Could not delete custom domain because a workspace member has no aliases without it'
);
export const CustomDomainIsInAllAliasesError: typeof _CustomDomainIsInAllAliasesError =
  _CustomDomainIsInAllAliasesError;

const _TrashError = createErrorObject('TRASH_ERROR', 'Trash action failed');
export const TrashError: typeof _TrashError = _TrashError;

const _MailFilterLimitError = createErrorObject(
  PaywallErrorCode.MailFilterLimit,
  'Reached mail filter limit for tier.'
);
export const MailFilterLimitError: typeof _MailFilterLimitError = _MailFilterLimitError;

export type LogicErrorTypes =
  | typeof DocumentContentConflict
  | typeof NotFound
  | typeof Conflict
  | typeof NotAuthorized
  | typeof BadRequest
  | typeof NeedNewSessionKey
  | typeof NeedNewHierarchicalKey
  | typeof NewKeyNotNeeded
  | typeof InvalidSignature
  | typeof DocumentDoesNotExist
  | typeof UserDoesNotExist
  | typeof DocumentTooLarge
  | typeof DocumentHierarchyConflict
  | typeof DocumentBatchTooLong
  | typeof RateLimitError
  | typeof RawStorageError
  | typeof InternalError
  | typeof BackupEmailExists
  | typeof AliasLimitError
  | typeof ShortAliasError
  | typeof StorageLimitError
  | typeof UploadLimitError
  | typeof CustomDomainLimitError
  | typeof MessageLimitError
  | typeof UserLabelLimitError
  | typeof UserFolderLimitError
  | typeof WorkspaceUserLimitError
  | typeof MailFilterLimitError
  | typeof InvalidEthereumAddress
  | typeof InvalidAliasDeletionError
  | typeof CustomDomainIsDefaultAliasError
  | typeof CustomDomainIsInAllAliasesError;
