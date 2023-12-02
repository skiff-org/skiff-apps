import { createKeyFromSecret, createSRPKey } from 'skiff-crypto';
import {
  LoginSrpRequest,
  LoginSrpStep1Document,
  LoginSrpStep1Mutation,
  LoginSrpStep1MutationVariables
} from 'skiff-front-graphql';
import { assertExists } from 'skiff-utils';

import client from '../apollo/client';

/**
 * Calls the login srp step 1 and returns the request for step 2
 * @param {string} username
 * @param {string} password
 * @param {string} tokenMFA
 */
export async function getLoginSrpRequest(username: string, password: string, tokenMFA?: string) {
  const srp = await import('secure-remote-password/client');
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
