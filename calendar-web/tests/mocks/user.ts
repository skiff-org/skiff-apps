import { generatePublicPrivateKeyPair } from 'skiff-crypto';
import { models, CurrentUserEmailAliasesQuery, EMPTY_DOCUMENT_DATA } from 'skiff-front-graphql';
import { v4 } from 'uuid';

import { UserFromEmailAliasFragment } from '../../generated/graphql';

const calendarID = '891b0268-cd69-4124-b704-f71fc32ee01d';

export const mockUser1: models.User = {
  userID: 'b12dfe9b-a338-43f1-8396-e04a6d0b7d1b',
  username: 'guy353bot21',
  recoveryEmail: 'guy353bot21@skiff.town',
  passwordDerivedSecret: 'guy353bot21',
  publicData: { displayName: null, displayPictureData: null, __typename: 'PublicData' },
  publicKey: {
    key: 'Jrp82CeTfc+BD8QONtX5OePmNd/P2ETXXVA9jupP1kI=',
    signature: 'QW9mrUNBUEO8vo0/LI8NBHo7YsAcSlLQL5jZXzLa5pp13L0wj25cqArFFLqbp9NXsacmXE2eQz5jWNs0gPIsDg=='
  },
  signingPublicKey: 'XrJJwLVZEv+92LgMUbaR1t35IULX5A49pbySQRrn8os=',
  primaryCalendar: { calendarID },
  privateUserData: {
    privateKey: 'lTMS4WrYbhneBWCUwnRIfHwlKk3BayYatFOeNmF6qUo=',
    signingPrivateKey: 'lTMS4WrYbhneBWCUwnRIfHwlKk3BayYatFOeNmF6qUo',
    documentKey: 's234'
  },
  privateDocumentData: EMPTY_DOCUMENT_DATA,
  rootOrgID: '',
  defaultEmailAlias: 'guy353bot21@skiff.town'
};

export const mockUser2UserFromAliasResponse: UserFromEmailAliasFragment = {
  __typename: 'User',
  userID: 'd5b3e9f7-fe79-4663-a76b-75d040adb4f1',
  primaryCalendar: {
    calendarID: '96600c17-419e-45ed-80ea-1eb8b144deb7',
    publicKey: 'mHZvf67JoImVJbpxXVHgQ6jDg0cD1Er9u9VTRb3MpxA='
  }
};

export const generateCurrentUserEmailAliasesResponse = (user: models.User): CurrentUserEmailAliasesQuery => ({
  currentUser: { userID: user.userID, emailAliases: [user.defaultEmailAlias || ''], __typename: 'User' }
});

export const generateMockUser = (
  keyPair: ReturnType<typeof generatePublicPrivateKeyPair> = generatePublicPrivateKeyPair(),
  username: string = v4(),
  primaryCalendarID: string = v4()
): models.User => {
  return {
    userID: username,
    username,
    recoveryEmail: `${username}@skiff.town`,
    passwordDerivedSecret: username,
    publicData: { displayName: null, displayPictureData: null, __typename: 'PublicData' },
    publicKey: {
      key: keyPair.publicKey,
      signature: keyPair.publicKey
    },
    signingPublicKey: keyPair.signingPublicKey,
    primaryCalendar: { calendarID: primaryCalendarID },
    privateUserData: {
      privateKey: keyPair.privateKey,
      signingPrivateKey: keyPair.privateKey,
      documentKey: 's234'
    },
    privateDocumentData: EMPTY_DOCUMENT_DATA,
    rootOrgID: '',
    defaultEmailAlias: `${username}@skiff.town`
  };
};
