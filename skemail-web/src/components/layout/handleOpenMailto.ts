import { useFlags } from 'launchdarkly-react-client-sdk';
import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { useDrafts } from '../../hooks/useDrafts';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';

export function useHandleMailto() {
  const { composeNewDraft } = useDrafts();

  const dispatch = useDispatch();
  const lastToValue = useRef<string | undefined>(undefined);
  const flags = useFlags();
  const registerHandler = (flags.registerMailtoHandler as boolean) || window.location.hostname === 'localhost';

  // get the to= query param from the url, then open compose
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (!registerHandler) {
      return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    let to = urlParams.get('to');
    if (!to) {
      return;
    }
    // remove mailto: if it exists
    if (to.startsWith('mailto:')) {
      to = to.replace('mailto:', '');
    }
    // check last to value
    if (lastToValue.current === to) {
      return;
    }
    lastToValue.current = to;
    setTimeout(() => {
      if (!to) {
        return;
      }
      composeNewDraft();
      dispatch(skemailModalReducer.actions.directMessageCompose({ address: to }));
    }, 2000);
  }, [dispatch, composeNewDraft, registerHandler]);
}
