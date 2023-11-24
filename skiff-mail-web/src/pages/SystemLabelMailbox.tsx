import { useEffect, useState } from 'react';
import { SystemLabels } from 'skiff-graphql';

import { Mailbox } from '../components/mailbox/Mailbox';
import MobileHead from '../components/shared/MobileHead';
import { FALLBACK_ROUTER_LABEL, RouterLabelContext } from '../context/RouterLabelContext';
import { useCurrentLabel } from '../hooks/useCurrentLabel';
import { LABEL_TO_SYSTEM_LABEL } from '../utils/label';
import { useNavigate } from '../utils/navigation';

export const labelIsSystemLabel = (label: string | null): label is SystemLabels =>
  Object.values(SystemLabels).includes(label as SystemLabels);

const SystemLabelMailbox = () => {
  const { label: currentLabel } = useCurrentLabel();
  const { navigateToInbox } = useNavigate();

  const [systemLabel, setSystemLabel] = useState(FALLBACK_ROUTER_LABEL);

  useEffect(() => {
    // If we can't parse label, just return inbox, which is the fallback
    if (!labelIsSystemLabel(currentLabel)) {
      navigateToInbox();
    } else {
      setSystemLabel(LABEL_TO_SYSTEM_LABEL[currentLabel]);
    }
  }, [currentLabel, navigateToInbox]);

  return (
    <RouterLabelContext.Provider value={systemLabel}>
      <MobileHead />
      <Mailbox />
    </RouterLabelContext.Provider>
  );
};

export default SystemLabelMailbox;
