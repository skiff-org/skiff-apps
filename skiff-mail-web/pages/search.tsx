import dynamic from 'next/dynamic';

import { RouterLabelContext } from '../context/RouterLabelContext';
import { useCurrentLabel } from '../hooks/useCurrentLabel';
import { HiddenLabels, LABEL_TO_HIDDEN_LABEL } from '../utils/label';

const MailboxSearchResults = dynamic(() => import('../components/mailbox/MailboxSearchResults'));

const FullViewSearch = () => {
  const { label: currentLabel } = useCurrentLabel();
  const systemLabel = LABEL_TO_HIDDEN_LABEL[currentLabel ?? HiddenLabels.Search];

  return (
    <RouterLabelContext.Provider value={systemLabel}>
      <MailboxSearchResults />
    </RouterLabelContext.Provider>
  );
};

export default FullViewSearch;
