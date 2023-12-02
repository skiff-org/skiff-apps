import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import {
  GetGoogleAuthUrlQuery,
  GetGoogleAuthUrlDocument,
  GetOutlookAuthUrlDocument,
  GetOutlookAuthUrlQuery
} from 'skiff-front-graphql';
import { AuthAction, ImportClients } from 'skiff-graphql';

import client from '../apollo/client';
import {
  GOOGLE_MAIL_IMPORT_PARAMS,
  OUTLOOK_MAIL_IMPORT_PARAMS,
  GENERAL_MAIL_IMPORT_PARAMS
} from '../constants/settings.constants';

import { extractHashParamFromURL } from './navigation';

interface DefinedOAuthCodes {
  authCode: string;
  state: string;
}
interface NullOAuthCodes {
  authCode: null;
  state: null;
}
type OAuthCodes = DefinedOAuthCodes | NullOAuthCodes;

export const getGoogleOAuth2CodeInURL = (): OAuthCodes => {
  try {
    if (!window) return { authCode: null, state: null };
    const url = new URL(window.location.href);
    const authCode = url.searchParams.get('code');
    const scope = url.searchParams.get('scope');
    const user = url.searchParams.get('authuser');
    const state = url.searchParams.get('state');
    return scope && user && authCode && state ? { authCode, state } : { authCode: null, state: null };
  } catch (err) {
    return { authCode: null, state: null };
  }
};

export const getOutlookCodeInURL = (): OAuthCodes => {
  try {
    if (!window) return { authCode: null, state: null };
    const url = new URL(window.location.href);
    const authCode = url.searchParams.get('code');
    const session = url.searchParams.get('client_info');
    const state = url.searchParams.get('state');
    return session && authCode && state ? { authCode, state } : { authCode: null, state: null };
  } catch (err) {
    return { authCode: null, state: null };
  }
};

export const signIntoGoogle = async (client: ApolloClient<NormalizedCacheObject>, action: AuthAction) => {
  const loginUrl = await client.query<GetGoogleAuthUrlQuery>({
    query: GetGoogleAuthUrlDocument,
    variables: {
      action
    }
  });
  if (!loginUrl.data.getGoogleAuthURL) return;

  window.location.replace(loginUrl.data.getGoogleAuthURL);
};

export const signIntoOutlook = async (action: AuthAction) => {
  const loginUrl = await client.query<GetOutlookAuthUrlQuery>({
    query: GetOutlookAuthUrlDocument,
    variables: {
      action
    }
  });
  if (!loginUrl.data.getOutlookAuthUrl) return;
  window.location.replace(loginUrl.data.getOutlookAuthUrl);
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
  const currPathname = window.location.pathname;
  const newQuery = new URLSearchParams(window.location.search);
  paramsToDelete.forEach((param) => newQuery.delete(param));
  const hash = extractHashParamFromURL(currPathname);
  const newURL = `${currPathname}?${encodeURIComponent(newQuery.toString())}${hash ? hash : ''}`;
  void window.history.replaceState(undefined, '', newURL);
};
