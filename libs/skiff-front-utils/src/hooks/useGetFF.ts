import { useFlags } from 'launchdarkly-react-client-sdk';

import { getEnvironment } from '../utils';

export const useGetFF = <T>(flagName: string) => {
  const flags = useFlags();
  if (typeof window === 'undefined') {
    return false;
  }
  const env = getEnvironment(new URL(window.location.origin));
  return env === 'local' || env === 'vercel' || (flags[flagName] as T);
};
