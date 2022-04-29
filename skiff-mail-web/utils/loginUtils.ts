import { encode as encodeBase64 } from '@stablelib/base64';
import argon2 from 'argon2-browser';
import hkdf from 'futoin-hkdf';
import jwt_decode from 'jwt-decode';
import srp from 'secure-remote-password/client';

import client from '../apollo/client';
import {
  LoginSrpStep1Document,
  LoginSrpStep1Mutation,
  LoginSrpStep2Document,
  LoginSrpStep2Mutation,
  LoginSrpStep2MutationVariables,
  PublicKeyWithSignature
} from '../generated/graphql';
import { User } from '../models/user';
import { decryptPrivateUserData, writeSessionCacheData } from './crypto/v1/user';
import { createPasswordDerivedSecret } from './crypto/v1/utils';
import { assertExists } from './typeUtils';

const ARGON2_LENGTH = 32;
const HKDF_LENGTH = 32;

async function createKeyFromSecret(secret: string, argonSalt: string) {
  const key = await argon2.hash({
    pass: secret,
    salt: argonSalt,
    hashLen: ARGON2_LENGTH, // desired hash length
    type: argon2.ArgonType.Argon2id
  });
  return encodeBase64(key.hash);
}

enum HkdfInfo {
  LOGIN = 'LOGIN',
  PRIVATE_KEYS = 'PRIVATE_KEYS',
  SIGNING_KEY_VERIFICATION_NUMBER = 'SIGNING_KEY_VERIFICATION_NUMBER'
}

async function createSRPKey(masterSecret: string, salt: string): Promise<string> {
  const privateKey = hkdf(masterSecret, HKDF_LENGTH, {
    salt,
    info: HkdfInfo.LOGIN,
    hash: 'SHA-256'
  }).toString('hex');
  return privateKey;
}

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

type DecodedJWT = {
  exp: number;
  aud: string;
  username: string;
  docID?: string; // for access request
  updatedEmail?: string; // used for change email
  curEmail?: string; // used for change email
  newEmail?: string; // for add email
  documentLink?: string; // link to access document
};

const LoginErrors = {
  CHECK_USERNAME_PASSWORD: 'Check your username and password. Contact support@skiff.org for support.',
  CHECK_2FA_TOKEN: 'Login failed. Please check your two-factor authentication token.',
  TOKEN_NOT_ACCEPTED: 'Token was not accepted. Please re-enter verification token.',
  SERVER_CONNECTION_FAILED: 'Unable to connect to server. Contact support@skiff.org for support.',
  LINK_EXPIRED: 'Email verification link expired. Contact support@skiff.org for support.',
  GENERIC_FAILURE: 'Login failed. Contact support@skiff.org for support.'
};

/**
 * Returns true if JWT has expired.
 * @param {string} curJwt - JWT to check.
 * @returns {boolean} True/false depending on whether JWT is expired or not.
 */
export function jwtHasExpired(curJwt: string) {
  try {
    const decodedJWT = jwt_decode(curJwt) as DecodedJWT;
    const curTimeSeconds = new Date().getTime() / 1000;
    if (decodedJWT.exp < curTimeSeconds) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
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
  const step1Response = await client.mutate<LoginSrpStep1Mutation, LoginSrpStep2MutationVariables>({
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
  const privateKey = await createSRPKey(masterSecret, salt);
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
  user?: User;
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
  const { userID, cacheKey, serverSessionProof, status, encryptedUserData, publicKey, signingPublicKey, publicData } =
    loginSrp;
  if (status === LoginMutationStatus.Authenticated) {
    try {
      assertExists(serverSessionProof);
      srp.verifySession(clientEphemeral.public, clientSession, serverSessionProof);
    } catch (err) {
      return { error: LoginErrors.GENERIC_FAILURE };
    }

    assertExists(encryptedUserData);
    const passwordDerivedSecret = await createPasswordDerivedSecret(masterSecret, salt);
    const decryptedPrivateData = decryptPrivateUserData(encryptedUserData, passwordDerivedSecret);

    assertExists(userID);
    assertExists(signingPublicKey);
    assertExists(publicData);
    assertExists(publicKey);
    const userObj: User = {
      userID,
      username: lowerCaseUsername,
      privateUserData: decryptedPrivateData,
      signingPublicKey,
      publicKey: publicKey as PublicKeyWithSignature, // see https://linear.app/skiff/issue/EMAIL-413/fix-publickey-type-incompatibility
      publicData
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
