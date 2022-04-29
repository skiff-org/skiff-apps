import { Mailbox } from '../components/mailbox/Mailbox';
import MobileHead from '../components/shared/MobileHead';
import { RouterLabelContext } from '../context/RouterLabelContext';
import { SystemLabels } from '../generated/graphql';
import { useCurrentLabel } from '../hooks/useCurrentLabel';
import { LABEL_TO_SYSTEM_LABEL } from '../utils/label';

const SystemLabelMailbox = () => {
  const currentLabel = useCurrentLabel();
  const systemLabel = LABEL_TO_SYSTEM_LABEL[currentLabel ?? SystemLabels.Inbox];
  // If we can't parse label, just return inbox
  return (
    <RouterLabelContext.Provider value={systemLabel}>
      <MobileHead />
      <Mailbox />
    </RouterLabelContext.Provider>
  );
};

export default SystemLabelMailbox;
