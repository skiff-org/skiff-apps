import srp from 'secure-remote-password/client';
import { createKeyFromSecret, createSRPKey, createPasswordDerivedSecret } from '@skiff-org/skiff-crypto';
import {
  LoginSrpStep1Document,
  LoginSrpStep1Mutation,
  LoginSrpStep2Document,
  LoginSrpStep2Mutation,
  LoginSrpStep1MutationVariables,
  LoginSrpStep2MutationVariables,
  decryptPrivateDocumentData,
  decryptPrivateUserData,
  EMPTY_DOCUMENT_DATA,
  writeSessionCacheData
} from 'skiff-front-graphql';
import { models } from 'skiff-front-graphql';
import { LoginSrpRequest, PublicKeyWithSignature } from 'skiff-graphql';
import { assertExists } from 'skiff-utils';

import client from '../apollo/client';

enum LoginMutationStatus {
  Authenticated = 'AUTHENTICATED',
  AuthFailure = 'AUTH_FAILURE',
  Created = 'CREATED',
  InvalidJwt = 'INVALID_JWT',
  Rejected = 'REJECTED',
  TokenNeeded = 'TOKEN_NEEDED',
  Updated = 'UPDATED',
  UsernameInvalid = 'USERNAME_INVALID'
}

const LoginErrors = {
  CHECK_USERNAME_PASSWORD: 'Check your username and password. Contact support@skiff.org for support.',
  CHECK_2FA_TOKEN: 'Login failed. Please check your two-factor authentication token.',
  TOKEN_NOT_ACCEPTED: 'Token was not accepted. Please re-enter verification token.',
  SERVER_CONNECTION_FAILED: 'Unable to connect to server. Contact support@skiff.org for support.',
  LINK_EXPIRED: 'Email verification link expired. Contact support@skiff.org for support.',
  GENERIC_FAILURE: 'Login failed. Contact support@skiff.org for support.'
};

/**
 * Calls the login srp step 1 and returns the request for step 2
 * @param {string} username
 * @param {string} password
 * @param {string} tokenMFA
 */
export async function getLoginSrpRequest(username: string, password: string, tokenMFA?: string) {
  const clientEphemeral = srp.generateEphemeral();
  // Step 1: Send username to server
  const step1Response = await client.mutate<LoginSrpStep1Mutation, LoginSrpStep1MutationVariables>({
    mutation: LoginSrpStep1Document,
    variables: {
      request: {
        step: 1,
        username
      }
    }
  });
  if (!step1Response.data) {
    throw new Error('No data returned from server (step 1).');
  }
  const { salt, serverEphemeralPublic } = step1Response.data.loginSrp;
  // Derive shared session key
  assertExists(salt);
  assertExists(serverEphemeralPublic);
  const masterSecret = await createKeyFromSecret(password, salt);
  const privateKey = createSRPKey(masterSecret, salt);
  const clientSession = srp.deriveSession(clientEphemeral.secret, serverEphemeralPublic, salt, username, privateKey);

  const loginSrpRequest: LoginSrpRequest = {
    step: 2,
    username,
    clientSessionProof: clientSession.proof,
    clientEphemeralPublic: clientEphemeral.public,
    tokenMFA
  };

  return loginSrpRequest;
}

/**
 * Run SRP authentication with server.
 * @param {string} newUsername - User's username.
 * @param {string} newPassword - User's password.
 * @param {string} tokenMFA - MFA token for login.
 */
export async function authenticateServerSRP(newUsername: string, newPassword: string, tokenMFA?: string) {
  const clientEphemeral = srp.generateEphemeral();
  // Step 1: Send username to server
  const step1Response = await client.mutate<LoginSrpStep1Mutation, LoginSrpStep1MutationVariables>({
    mutation: LoginSrpStep1Document,
    variables: {
      request: {
        step: 1,
        username: newUsername
      }
    }
  });
  assertExists(step1Response.data);
  const { salt, serverEphemeralPublic } = step1Response.data.loginSrp;
  assertExists(salt);
  assertExists(serverEphemeralPublic);
  // Derive shared session key
  const masterSecret = await createKeyFromSecret(newPassword, salt);
  const privateKey = createSRPKey(masterSecret, salt);
  const clientSession = srp.deriveSession(clientEphemeral.secret, serverEphemeralPublic, salt, newUsername, privateKey);

  // Step 2: Sent clientSession.proof to server
  const step2Response = await client.mutate<LoginSrpStep2Mutation, LoginSrpStep2MutationVariables>({
    mutation: LoginSrpStep2Document,
    variables: {
      request: {
        step: 2,
        username: newUsername,
        clientSessionProof: clientSession.proof,
        clientEphemeralPublic: clientEphemeral.public,
        tokenMFA
      }
    }
  });

  assertExists(step2Response.data);

  // return salt to be used with argon2 key derivation
  return {
    clientEphemeral,
    clientSession,
    loginSrp: step2Response.data.loginSrp,
    salt,
    masterSecret
  };
}

export type LoginServerSRPResponse = {
  /** User object, populated when login successful */
  user?: models.User;
  /** Error message, populated when login unsuccessful */
  error?: string;
  /** Whether MFA token is needed */
  tokenNeeded?: boolean;
};

/**
 * Attempts to log a user in
 * @param {string} username - User's username
 * @param {string} password - User's password
 * @param {string} tokenMFA - MFA token for login
 * @returns {LoginServerSRPResponse} response - Server SRP response
 */
export async function loginServerSRP(
  username: string,
  password: string,
  tokenMFA?: string
): Promise<LoginServerSRPResponse> {
  const loginErrMessage = tokenMFA ? LoginErrors.CHECK_2FA_TOKEN : LoginErrors.CHECK_USERNAME_PASSWORD;
  const lowerCaseUsername = username.toLowerCase();
  const { clientEphemeral, clientSession, loginSrp, masterSecret, salt } = await authenticateServerSRP(
    lowerCaseUsername,
    password,
    tokenMFA
  );
  const {
    userID,
    cacheKey,
    encryptedDocumentData,
    serverSessionProof,
    status,
    encryptedUserData,
    publicKey,
    signingPublicKey,
    publicData,
    rootOrgID
  } = loginSrp;
  if (status === LoginMutationStatus.Authenticated) {
    try {
      assertExists(serverSessionProof);
      srp.verifySession(clientEphemeral.public, clientSession, serverSessionProof);
    } catch (err) {
      return { error: LoginErrors.GENERIC_FAILURE };
    }

    assertExists(encryptedUserData);
    const passwordDerivedSecret = createPasswordDerivedSecret(masterSecret, salt);
    const decryptedPrivateData = decryptPrivateUserData(encryptedUserData, passwordDerivedSecret);
    const decryptedDocumentData = encryptedDocumentData
      ? decryptPrivateDocumentData(encryptedDocumentData, decryptedPrivateData)
      : EMPTY_DOCUMENT_DATA;

    assertExists(userID);
    assertExists(signingPublicKey);
    assertExists(publicData);
    assertExists(publicKey);
    assertExists(rootOrgID);
    const userObj: models.User = {
      userID,
      username: lowerCaseUsername,
      privateUserData: decryptedPrivateData,
      signingPublicKey,
      publicKey: publicKey as PublicKeyWithSignature, // see https://linear.app/skiff/issue/EMAIL-413/fix-publickey-type-incompatibility
      publicData,
      passwordDerivedSecret,
      privateDocumentData: decryptedDocumentData,
      rootOrgID: rootOrgID
    };

    if (cacheKey) {
      writeSessionCacheData({ user: userObj }, cacheKey);
    }

    return { user: userObj };
  }
  if (status === LoginMutationStatus.AuthFailure) {
    return { error: loginErrMessage };
  }
  if (status === LoginMutationStatus.TokenNeeded) {
    return { tokenNeeded: true };
  }
  // Fall through; shouldn't get here, but if we do return an error message
  return { error: LoginErrors.GENERIC_FAILURE };
}
