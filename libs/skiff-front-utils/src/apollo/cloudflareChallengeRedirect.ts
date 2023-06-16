import { NetworkError } from '@apollo/client/errors';
import { onError } from '@apollo/client/link/error';
import { isMobile } from 'react-device-detect';

import { EditorAppRoutes } from '../constants';

import { getStatusCodeFromApolloNetworkError } from './errorUtils';

/**
 * Returns true if the provided Apollo network error appears to have been
 * triggered by a Cloudflare WAF challenge.
 *
 * From the Cloudflare docs:
 * > When an XHR or AJAX request triggers a Challenge action, the HTTP response
 * > will have a 403 status code.
 *
 * So if a GraphQL request fails with a 403 status code, we'll assume the error
 * was caused by a Cloudflare WAF challenge. Ideally, we'd key off of a more
 * dedicated signal (e.g. a custom HTTP response header or a custom HTTP status
 * code). However, we had trouble implementing those approaches in Cloudflare.
 *
 * In practice, our GraphQL server doesn't return 403 status codes right now
 * anyways. Right now, our GraphQL server always uses 200. As a result, if our
 * app sends a GraphQL request and receives a 403 response, we can assume that
 * the error was triggered by the Cloudflare WAF.
 *
 * For more background, see the Cloudflare docs:
 * https://developers.cloudflare.com/firewall/known-issues-and-faq/#do-the-challenge-actions-support-content-types-other-than-html-for-example-ajax-or-xhr-requests
 *
 * TODO (CAT-527): Do we also need to check for 503 status codes? A Cloudflare
 * support rep said that Cloudflare returns 503 errors for JS challenges.
 * However, the docs above suggest Cloudflare only uses 403. We'd prefer not to
 * check for 503 errors since that could result in false positives. In
 * particular, AWS ALB may return a 503 error. We wouldn't want to send a user
 * into the Cloudflare challenge flow if they got a 503 error from ALB.
 */
const isPotentialCloudflareChallengeError = (networkError: NonNullable<NetworkError>) =>
  getStatusCodeFromApolloNetworkError(networkError) === 403;

/**
 * Apollo Client link to handle errors caused by Cloudflare WAF challenges.
 *
 * If an Apollo network error appears to have been caused by a Cloudflare WAF
 * challenge, we should load the Cloudflare challenge page so that the user
 * can attempt the challenge.
 */
export const cloudflareChallengeRedirectLink = onError(({ networkError }) => {
  // For now, don't run this logic on mobile. We can always revisit this if
  // mobile users experience issues.
  if (isMobile) {
    return;
  }

  if (networkError && isPotentialCloudflareChallengeError(networkError)) {
    // Pass the current time in the search params to make the URL dynamic. This
    // should help prevent the browser from using its cache. We need the browser
    // to send a fresh request to Cloudflare so that Cloudflare can serve the
    // challenge page. Note: We aren't actually 100% sure if this dummy search
    // param is necessary to avoid the cache, but it doesn't hurt.
    const time = new Date().getTime();
    const timeDummySearch = `?t=${time}`;

    const challengePageUrl = new URL(
      `${EditorAppRoutes.CLOUDFLARE_MANAGED_CHALLENGE}${timeDummySearch}`,
      window.location.origin
    );
    window.location.assign(challengePageUrl);

    return;
  }
});
