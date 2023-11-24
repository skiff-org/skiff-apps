import HCaptcha from '@hcaptcha/react-hcaptcha';
import React, { useCallback, useMemo, useRef } from 'react';

import { getEnvironment } from '../utils/envUtils';

// Create account captcha key
export const HCAPTCHA_SITE_KEY = process.env.HCAPTCHA_SITE_KEY || 'ffffffff-ffff-ffff-ffff-ffffffffffff';
export const PASSIVE_HCAPTCHA_SITE_KEY =
  process.env.PASSIVE_HCAPTCHA_SITE_KEY || 'ffffffff-ffff-ffff-ffff-ffffffffffff';
export const HCAPTCHA_TEST_SITE_KEY = '20000000-ffff-ffff-ffff-000000000002';
export const HCAPTCHA_TEST_SAFE_RESPONSE = '20000000-aaaa-bbbb-cccc-000000000002';

// Test tokens for Hcaptcha, replace the above real token by these:
// export const HCAPTCHA_SITE_KEY = '10000000-ffff-ffff-ffff-000000000001'; // Always validate
// export const HCAPTCHA_SITE_KEY = '30000000-ffff-ffff-ffff-000000000003'; // Always detect bot

/**
 * Asynchronous Hcaptcha challenge, you need to add `hcaptchaElement` to your render output
 * then call `await requestHcaptchaToken()` when needing a token, will return the token or throw an error
 */
export default function useAsyncHcaptcha(isPassive: boolean) {
  const hcaptchaRef = useRef<HCaptcha | null>(null);
  const callbackRef = useRef<((error: any, token: string | null) => void) | undefined>(undefined);

  const requestHcaptchaToken = useCallback(() => {
    // Return dummy token if running locally
    if (getEnvironment(new URL(origin)) === 'local') {
      return Promise.resolve(HCAPTCHA_TEST_SAFE_RESPONSE);
    }
    return new Promise<string>((resolve, reject) => {
      if (!hcaptchaRef.current) {
        reject('hcaptchaRef does not exist');
        return;
      }
      hcaptchaRef.current.execute();
      callbackRef.current = (error, token) => {
        callbackRef.current = undefined;
        if (!token || error) {
          reject(error);
          return;
        }
        resolve(token);
      };
    });
  }, []);

  const getSiteKey = () => {
    if (getEnvironment(new URL(origin)) === 'local') {
      return HCAPTCHA_TEST_SITE_KEY;
    } else if (isPassive) {
      return PASSIVE_HCAPTCHA_SITE_KEY;
    } else {
      return HCAPTCHA_SITE_KEY;
    }
  };

  const hcaptchaElement = useMemo(
    () => (
      <HCaptcha
        onClose={() => {
          callbackRef.current?.('Closed', null);
        }}
        onError={(e) => {
          callbackRef.current?.(e, null);
        }}
        onVerify={(token: string) => {
          callbackRef.current?.(null, token);
        }}
        ref={(ref) => {
          hcaptchaRef.current = ref;
        }}
        sitekey={getSiteKey()}
        size='invisible'
      />
    ),
    []
  );

  return {
    hcaptchaElement,
    requestHcaptchaToken
  };
}
