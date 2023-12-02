declare module '*.svg' {
  const content: any;
  export default content;
}

interface TokenClientConfig {
  client_id: string;
  scope: string;
  callback?: () => void;
}

interface TokenClient {
  requestAccessToken: () => void;
}

declare namespace google.accounts.oauth2 {
  export function revoke(token: string): void;
  export function initTokenClient(tokenClientConfig: TokenClientConfig): TokenClient;
  export function hasGrantedAllScopes(scope: string): boolean;
}
