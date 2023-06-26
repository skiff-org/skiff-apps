"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailFilterLimitError = exports.TrashError = exports.CustomDomainIsInAllAliasesError = exports.CustomDomainIsDefaultAliasError = exports.InvalidAliasDeletionError = exports.SyncFailedError = exports.InvalidEthereumAddress = exports.WorkspaceUserLimitError = exports.UserFolderLimitError = exports.UserLabelLimitError = exports.CustomDomainLimitError = exports.MessageLimitError = exports.UploadLimitError = exports.StorageLimitError = exports.ShortAliasError = exports.AliasLimitError = exports.AlreadySubscribed = exports.UserNeedEmailAddress = exports.BackupEmailExists = exports.InternalError = exports.RawStorageError = exports.RateLimitError = exports.DocumentBatchTooLong = exports.DocumentHierarchyConflict = exports.DocumentTooLarge = exports.UserDoesNotExist = exports.DocumentDoesNotExist = exports.InvalidSignature = exports.NewKeyNotNeeded = exports.NeedNewHierarchicalKey = exports.NeedNewSessionKey = exports.BadRequest = exports.AuthenticationError = exports.NotAuthorized = exports.Conflict = exports.NotFound = exports.DocumentContentConflict = exports.LogicError = void 0;
/* eslint-disable @typescript-eslint/no-throw-literal */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable max-classes-per-file */
const apollo_server_errors_1 = require("apollo-server-errors"); // Using apollo-server-errors instead of apollo-server directly to prevent client from triggering a compilation error
const skiff_utils_1 = require("skiff-utils");
/**
 * Helper class to wrap ApolloError, add default values for message and code and add assert / assertExists methods
 */
class LogicError extends apollo_server_errors_1.ApolloError {
}
exports.LogicError = LogicError;
const createErrorObject = (code, defaultMessage) => { var _a; return _a = class extends LogicError {
        constructor(message, extensions) {
            super(message || defaultMessage, code, extensions);
        }
        // can assert on anything except a promise, this is done to prevent
        static assert(condition, message, extensions) {
            if (!condition) {
                throw new this(message, extensions);
            }
        }
        static assertExists(object, message, extensions) {
            if (object === undefined || object === null) {
                throw new this(message, extensions);
            }
        }
    },
    _a.CODE = code,
    _a; };
const _DocumentContentConflict = createErrorObject('DOCUMENT_CONTENT_CONFLICT', 'Document content conflict');
exports.DocumentContentConflict = _DocumentContentConflict; // workaround https://github.com/microsoft/TypeScript/issues/34596#issuecomment-691574987
const _NotFound = createErrorObject('NOT_FOUND', 'Not found');
exports.NotFound = _NotFound;
const _Conflict = createErrorObject('CONFLICT', 'Conflict');
exports.Conflict = _Conflict;
const _NotAuthorized = createErrorObject('NOT_AUTHORIZED', 'Not authorized');
exports.NotAuthorized = _NotAuthorized;
const _AuthenticationError = createErrorObject('AUTHENTICATION_ERROR', 'Authentication error');
exports.AuthenticationError = _AuthenticationError;
const _BadRequest = createErrorObject('BAD_REQUEST', 'Bad request');
exports.BadRequest = _BadRequest;
const _NeedNewSessionKey = createErrorObject('NEED_NEW_SESSION_KEY', 'Need new session key');
exports.NeedNewSessionKey = _NeedNewSessionKey;
const _NeedNewHierarchicalKey = createErrorObject('NEED_NEW_HIERARCHICAL_KEY', 'Need new hierarchical key');
exports.NeedNewHierarchicalKey = _NeedNewHierarchicalKey;
const _NewKeyNotNeeded = createErrorObject('NEW_KEY_NOT_NEEDED', `Document doesn't need a new key`);
exports.NewKeyNotNeeded = _NewKeyNotNeeded;
const _InvalidSignature = createErrorObject('INVALID_SIGNATURE', 'Invalid signature');
exports.InvalidSignature = _InvalidSignature;
const _DocumentDoesNotExist = createErrorObject('DOCUMENT_DOES_NOT_EXIST', 'Document does not exist');
exports.DocumentDoesNotExist = _DocumentDoesNotExist;
const _UserDoesNotExist = createErrorObject('USER_DOES_NOT_EXIST', 'User does not exist');
exports.UserDoesNotExist = _UserDoesNotExist;
const _DocumentTooLarge = createErrorObject('DOCUMENT_TOO_LARGE', 'Document too large');
exports.DocumentTooLarge = _DocumentTooLarge;
const _DocumentHierarchyConflict = createErrorObject('DOCUMENT_HIERARCHY_CONFLICT', 'Document hierarchy conflict');
exports.DocumentHierarchyConflict = _DocumentHierarchyConflict;
const _DocumentBatchTooLong = createErrorObject('DOCUMENT_BATCH_TOO_LARGE', 'Document batch is too large');
exports.DocumentBatchTooLong = _DocumentBatchTooLong;
const _RateLimitError = createErrorObject('RATE_LIMIT_EXCEEDED', 'rate limit exceeded');
exports.RateLimitError = _RateLimitError;
const _RawStorageError = createErrorObject('RAW_STORAGE_ERROR', 'Raw Storage Failure');
exports.RawStorageError = _RawStorageError;
const _InternalError = createErrorObject('INTERNAL_ERROR', 'Internal Error');
exports.InternalError = _InternalError;
const _BackupEmailExists = createErrorObject('BACKUP_EMAIL_EXISTS', 'Could not add email. Please enter another email.');
exports.BackupEmailExists = _BackupEmailExists;
const _UserNeedEmailAddress = createErrorObject('USER_NEED_EMAIL_ADDRESS', 'Current user need an email address for this action');
exports.UserNeedEmailAddress = _UserNeedEmailAddress;
const _AlreadySubscribed = createErrorObject('ALREAD_SUBSCRIBED', 'You are already subscribed to a paying plan');
exports.AlreadySubscribed = _AlreadySubscribed;
// TODO @rrrliu: Fix this before we launch Skiff 2.0
const _AliasLimitError = createErrorObject(skiff_utils_1.PaywallErrorCode.AliasLimit, 'Reached alias limit.');
exports.AliasLimitError = _AliasLimitError;
const _ShortAliasError = createErrorObject(skiff_utils_1.PaywallErrorCode.ShortAlias, 'Reached short alias limit for tier.');
exports.ShortAliasError = _ShortAliasError;
const _StorageLimitError = createErrorObject(skiff_utils_1.PaywallErrorCode.StorageLimit, 'Reached storage limit for tier.');
exports.StorageLimitError = _StorageLimitError;
const _UploadLimitError = createErrorObject(skiff_utils_1.PaywallErrorCode.UploadLimit, 'Reached upload limit for tier.');
exports.UploadLimitError = _UploadLimitError;
const _MessageLimitError = createErrorObject(skiff_utils_1.PaywallErrorCode.MessageLimit, 'Reached message limit for tier.');
exports.MessageLimitError = _MessageLimitError;
const _CustomDomainLimitError = createErrorObject(skiff_utils_1.PaywallErrorCode.CustomDomainLimit, 'Reached custom domain limit for tier.');
exports.CustomDomainLimitError = _CustomDomainLimitError;
const _UserLabelLimitError = createErrorObject(skiff_utils_1.PaywallErrorCode.UserLabelLimit, 'Reached custom label limit for tier.');
exports.UserLabelLimitError = _UserLabelLimitError;
const _UserFolderLimitError = createErrorObject(skiff_utils_1.PaywallErrorCode.UserFolderLimit, 'Reached custom folder limit for tier.');
exports.UserFolderLimitError = _UserFolderLimitError;
const _WorkspaceUserLimitError = createErrorObject(skiff_utils_1.PaywallErrorCode.WorkspaceUserLimit, 'Reached user limit for workspace.');
exports.WorkspaceUserLimitError = _WorkspaceUserLimitError;
const _InvalidEthereumAddress = createErrorObject('INVALID_ETHEREUM_ADDRESS', 'Not a valid Ethereum address');
exports.InvalidEthereumAddress = _InvalidEthereumAddress;
const _SyncFailedError = createErrorObject('SYNC_ERROR', skiff_utils_1.CALENDAR_SYNC_ERROR_MESSAGE);
exports.SyncFailedError = _SyncFailedError;
const _InvalidAliasDeletionError = createErrorObject('INVALID_ALIAS_DELETION', 'Could not delete invalid alias');
exports.InvalidAliasDeletionError = _InvalidAliasDeletionError;
const _CustomDomainIsDefaultAliasError = createErrorObject('CUSTOM_DOMAIN_IN_USE_AS_DEFAULT', 'Could not delete custom domain in use in default alias');
exports.CustomDomainIsDefaultAliasError = _CustomDomainIsDefaultAliasError;
const _CustomDomainIsInAllAliasesError = createErrorObject('CUSTOM_DOMAIN_IS_IN_ALL_ALIASES', 'Could not delete custom domain because a workspace member has no aliases without it');
exports.CustomDomainIsInAllAliasesError = _CustomDomainIsInAllAliasesError;
const _TrashError = createErrorObject('TRASH_ERROR', 'Trash action failed');
exports.TrashError = _TrashError;
const _MailFilterLimitError = createErrorObject(skiff_utils_1.PaywallErrorCode.MailFilterLimit, 'Reached mail filter limit for tier.');
exports.MailFilterLimitError = _MailFilterLimitError;
//# sourceMappingURL=errors.js.map