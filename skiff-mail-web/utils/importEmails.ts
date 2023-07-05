import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import omit from 'lodash/omit';
import router from 'next/router';
import { GetGoogleAuthUrlQuery, GetGoogleAuthUrlDocument } from 'skiff-front-graphql';
import { ImportClients } from 'skiff-graphql';

import {
  GOOGLE_MAIL_IMPORT_PARAMS,
  OUTLOOK_MAIL_IMPORT_PARAMS,
  GENERAL_MAIL_IMPORT_PARAMS
} from '../constants/settings.constants';

import { extractHashParamFromURL } from './navigation';

export const getGoogleOAuth2CodeInURL = () => {
  try {
    if (!window) return null;
    const url = new URL(window.location.href);
    const authCode = url.searchParams.get('code');
    const scope = url.searchParams.get('scope');
    const user = url.searchParams.get('authuser');
    return scope && user ? authCode : null;
  } catch (err) {
    return null;
  }
};

export const getOutlookCodeInURL = () => {
  try {
    if (!window) return null;
    const url = new URL(window.location.href);
    const authCode = url.searchParams.get('code');
    const session = url.searchParams.get('client_info');
    return session ? authCode : null;
  } catch (err) {
    return null;
  }
};

export const signIntoGoogle = async (client: ApolloClient<NormalizedCacheObject>) => {
  const loginUrl = await client.query<GetGoogleAuthUrlQuery>({
    query: GetGoogleAuthUrlDocument
  });
  if (!loginUrl.data.getGoogleAuthURL) return;

  window.location.replace(loginUrl.data.getGoogleAuthURL);
};

const getParamsToDelete = (provider: ImportClients) => {
  const paramsToDelete: string[] = [];
  switch (provider) {
    case ImportClients.Gmail:
      paramsToDelete.push(...GOOGLE_MAIL_IMPORT_PARAMS);
      break;
    case ImportClients.Outlook:
      paramsToDelete.push(...OUTLOOK_MAIL_IMPORT_PARAMS);
      break;
  }
  paramsToDelete.push(...GENERAL_MAIL_IMPORT_PARAMS);
  return paramsToDelete;
};

export const clearAuthCodes = (provider: ImportClients) => {
  const paramsToDelete = getParamsToDelete(provider);
  const newQuery = omit(router.query, paramsToDelete);
  const hash = extractHashParamFromURL(router.asPath);
  void router.replace({ query: newQuery, hash, pathname: router.pathname }, undefined, { shallow: true });
};
