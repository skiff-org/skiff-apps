import { FieldReadFunction, TypePolicy } from '@apollo/client';
import { decryptDatagramV2, decryptSymmetric } from 'skiff-crypto';
import { Document, LinkLinkKeyDatagram, ThumbnailDatagram } from 'skiff-front-graphql';
import { assertExists } from 'skiff-utils';

import { memoizeFieldReadFunction } from '../../helpers';
import { decryptMetadata } from '../../utils/documentUtils/docCryptoUtils';
import { getCurrentUserData, getDocumentDerivedPassword } from '../localState';
import { getPublicDocumentDecryptedPrivateHierarchicalKeys } from '../publicDocumentAuth';
import { decryptDocumentContent, decryptHierarchicalPermissionsChain, parseAsMemoizedDate } from '../typePolicyHelpers';

// Extend the document graphql schema by adding the decryptedSessionKey locally which is then available to every other react components or graphql functions
const readDecryptedSessionKey: FieldReadFunction<Document['decryptedSessionKey']> = memoizeFieldReadFunction(
  (_, options) => {
    const hierarchicalPermissionsChain =
      options.readField<Document['hierarchicalPermissionChain']>('hierarchicalPermissionChain');
    const docID = options.readField<Document['docID']>('docID');
    const currentUser = getCurrentUserData();
    const publicDocumentDecryptedPrivateHierarchicalKeys = getPublicDocumentDecryptedPrivateHierarchicalKeys();

    return {
      privateKey: currentUser?.privateUserData?.privateKey,
      publicDocumentDecryptedPrivateHierarchicalKeys,
      hierarchicalPermissionsChain,
      docID
    };
  },
  ({ privateKey, hierarchicalPermissionsChain, docID, publicDocumentDecryptedPrivateHierarchicalKeys }) => {
    try {
      assertExists(hierarchicalPermissionsChain, `no hierarchical permission chain field for doc ${docID ?? ''}`); // safe-guard against querying a document without including hierarchicalPermissionChain
      return decryptHierarchicalPermissionsChain(
        privateKey,
        publicDocumentDecryptedPrivateHierarchicalKeys,
        hierarchicalPermissionsChain
      ).decryptedSessionKey;
    } catch (e) {
      console.error(`Could not decrypt hierarchical permission chain of doc ${docID ?? ''}`, e);
      return '';
    }
  }
);

const readDecryptedPrivateHierarchicalKey: FieldReadFunction<Document['decryptedPrivateHierarchicalKey']> =
  memoizeFieldReadFunction(
    (_, options) => {
      const hierarchicalPermissionsChain =
        options.readField<Document['hierarchicalPermissionChain']>('hierarchicalPermissionChain');
      const currentUser = getCurrentUserData();
      const publicDocumentDecryptedPrivateHierarchicalKeys = getPublicDocumentDecryptedPrivateHierarchicalKeys();
      const docID = options.readField<Document['docID']>('docID');

      return {
        privateKey: currentUser?.privateUserData?.privateKey,
        hierarchicalPermissionsChain,
        publicDocumentDecryptedPrivateHierarchicalKeys,
        docID
      };
    },
    ({ privateKey, hierarchicalPermissionsChain, publicDocumentDecryptedPrivateHierarchicalKeys, docID }) => {
      try {
        assertExists(hierarchicalPermissionsChain, `no hierarchical permission chain field for doc ${docID ?? ''}`); // safe-guard against querying a document without including hierarchicalPermissionChain
        return decryptHierarchicalPermissionsChain(
          privateKey,
          publicDocumentDecryptedPrivateHierarchicalKeys,
          hierarchicalPermissionsChain
        ).decryptedPrivateHierarchicalKey;
      } catch (e) {
        console.error(`Could not decrypt hierarchical permission chain of doc ${docID ?? ''}`, e);
        return '';
      }
    }
  );

const FALLBACK_METADATA: Document['decryptedMetadata'] = {
  timeLastModified: null,
  description: null,
  icon: null,
  title: '- Decryption error -',
  color: null,
  fileSizeBytes: 0,
  mimeType: ''
};

// This is called when a apollo query required the decryptedMetadata field in a document, it gets the session key, decrypt the metadata and returns it
const readDecryptedMetadata: FieldReadFunction<Document['decryptedMetadata']> = memoizeFieldReadFunction(
  (_, options) => {
    const encryptedMetadata = options.readField<Document['metadata']>('metadata');
    const sessionKey = options.readField<Document['decryptedSessionKey']>('decryptedSessionKey');
    const docID = options.readField<Document['docID']>('docID');
    const team = options.readField<Document['team']>('team');
    const teamName = team ? options.readField<string>('name', team) : 'NAME_NOT_FOUND';
    const teamIcon = team ? options.readField<string>('icon', team) : 'ICON_NOT_FOUND';
    const teamRootDoc = team ? options.readField<Document>('rootDocument', team) : undefined;
    const teamRootDocID = team ? options.readField<Document>('docID', teamRootDoc) : undefined;
    assertExists(teamName);
    return { encryptedMetadata, sessionKey, docID, teamName, teamIcon, teamRootDocID };
  },
  ({ encryptedMetadata, sessionKey, docID, teamName, teamIcon, teamRootDocID }) => {
    if (!encryptedMetadata || !sessionKey) {
      if (teamRootDocID === docID) {
        // this happens if the team was created backend-side, for personal teams for example
        return {
          ...FALLBACK_METADATA,
          title: teamName,
          icon: teamIcon
        };
      }

      return FALLBACK_METADATA;
    }
    try {
      const decryptedMetadata = decryptMetadata(encryptedMetadata, sessionKey);
      // if document is a team root document, replace its title with the team name
      if (teamRootDocID === docID) {
        decryptedMetadata.title = teamName;
        decryptedMetadata.icon = teamIcon;
      }

      return {
        // Legacy: need to manually set the timeLastModified to null if it doesn't exists to make sure Apollo has all the data for the query
        timeLastModified: null,
        description: null,
        icon: null,
        color: null,
        fileSizeBytes: null,
        mimeType: null,
        ...decryptedMetadata
      };
    } catch (e) {
      console.error(`Could not decrypt metadata for doc ${docID ?? ''}`, e);
      return FALLBACK_METADATA;
    }
  }
);

const readDecryptedLink: FieldReadFunction<Document['link']> = memoizeFieldReadFunction(
  (existing, options) => {
    const sessionKey = options.readField<Document['decryptedSessionKey']>('decryptedSessionKey');
    const encryptedLinkKey = existing?.encryptedLinkKey;
    const salt = existing?.salt;
    const permissionLevel = existing?.permissionLevel;
    const docID = options.readField<Document['docID']>('docID');
    return { sessionKey, encryptedLinkKey, permissionLevel, salt, docID };
  },
  ({ sessionKey, encryptedLinkKey, permissionLevel, salt, docID }) => {
    if (!encryptedLinkKey || !sessionKey) {
      return null;
    }
    try {
      assertExists(permissionLevel);
      assertExists(encryptedLinkKey);
      assertExists(salt);
      return {
        permissionLevel,
        encryptedLinkKey,
        decryptedLinkKey: decryptSymmetric(encryptedLinkKey, sessionKey, LinkLinkKeyDatagram),
        salt
      };
    } catch (e) {
      console.error(`Could not decrypt link for doc ${docID ?? ''}`, e);
      return null;
    }
  }
);

const FALLBACK_CONTENTS: Document['decryptedContents'] = {
  contentsArr: []
};

const readDecryptedContents: FieldReadFunction<Document['decryptedContents']> = memoizeFieldReadFunction(
  (_, options) => {
    const docID = options.readField<Document['docID']>('docID') as string;
    const sessionKey = options.readField<Document['decryptedSessionKey']>('decryptedSessionKey');
    const encryptedContents = options.readField<Document['contents']>('contents');
    const documentPassword = getDocumentDerivedPassword(docID);
    return {
      sessionKey,
      encryptedContents,
      documentPassword,
      docID
    };
  },
  ({ sessionKey, encryptedContents, documentPassword, docID }) => {
    if (!encryptedContents || !sessionKey) {
      return FALLBACK_CONTENTS;
    }
    try {
      return decryptDocumentContent(encryptedContents, sessionKey, documentPassword);
    } catch (e) {
      console.error(`Could not decrypt encryptedContents for doc ${docID}`, e);
      return FALLBACK_CONTENTS;
    }
  }
);

const readDecryptedThumbnail: FieldReadFunction<Document['decryptedThumbnail']> = memoizeFieldReadFunction(
  (_, options) => {
    const docID = options.readField<Document['docID']>('docID') as string;
    const sessionKey = options.readField<Document['decryptedSessionKey']>('decryptedSessionKey');
    const encryptedThumbnail = options.readField<Document['thumbnail']>('thumbnail');
    return {
      sessionKey,
      encryptedThumbnail,
      docID
    };
  },
  ({ sessionKey, encryptedThumbnail, docID }) => {
    if (!encryptedThumbnail || !sessionKey) {
      return '';
    }
    try {
      return decryptDatagramV2(ThumbnailDatagram, sessionKey, encryptedThumbnail).body.decryptedThumbnail;
    } catch (e) {
      console.error(`Could not decrypt encryptedThumbnail for doc ${docID}`, e);
      return '';
    }
  }
);

export const documentTypePolicy: TypePolicy = {
  keyFields: ['docID'],
  fields: {
    contents: {
      // used to silence an apollo warning message when overwriting the content in cache
      merge: (_existing, incoming) => incoming
    },
    decryptedSessionKey: {
      read: readDecryptedSessionKey
    },
    decryptedPrivateHierarchicalKey: {
      read: readDecryptedPrivateHierarchicalKey
    },
    decryptedMetadata: {
      read: readDecryptedMetadata
    },
    link: {
      read: readDecryptedLink
    },
    decryptedContents: {
      read: readDecryptedContents
    },
    currentlyEditingUsers: {
      // we need to set a fallback for when we don't yet have set the currently editing users from the editor component
      read: (existing = []) => existing,
      // used to silence an apollo warning message when overwriting the currently editing users
      merge: (_existing, incoming) => incoming
    },
    updatedAt: {
      read: parseAsMemoizedDate
    },
    createdAt: {
      read: parseAsMemoizedDate
    },
    decryptedThumbnail: {
      read: readDecryptedThumbnail
    }
  }
};
