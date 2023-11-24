import React, { Suspense } from 'react';

import { RouterLabelContext } from '../context/RouterLabelContext';
import { useCurrentLabel } from '../hooks/useCurrentLabel';
import { HiddenLabel, HiddenLabels, LABEL_TO_HIDDEN_LABEL } from '../utils/label';

const MailboxSearchResults = React.lazy(() => import('../components/mailbox/MailboxSearchResults'));

const FullViewSearch = () => {
  const { label: currentLabel } = useCurrentLabel();
  const systemLabel = LABEL_TO_HIDDEN_LABEL[currentLabel ?? HiddenLabels.Search] as HiddenLabel;

  return (
    <RouterLabelContext.Provider value={systemLabel}>
      <Suspense fallback={null}>
        <MailboxSearchResults />
      </Suspense>
    </RouterLabelContext.Provider>
  );
};

export default FullViewSearch;
