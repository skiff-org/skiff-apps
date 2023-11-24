import { models } from 'skiff-front-graphql';

export const MOCK_USER: models.User = {
  userID: 'userID',
  username: 'mock_username',
  publicData: {
    displayName: 'Test user'
  },
  privateUserData: {
    privateKey: '',
    signingPrivateKey: '',
    documentKey: ''
  },
  publicKey: { key: '', signature: '' },
  signingPublicKey: '',
  passwordDerivedSecret: '',
  privateDocumentData: {
    verifiedKeys: {
      lastVerifiedDate: '',
      keys: {}
    },
    recoveryBrowserShare: ''
  },
  rootOrgID: ''
};
