import { SystemLabels } from 'skiff-graphql';

import { Mailbox } from '../components/mailbox/Mailbox';
import MobileHead from '../components/shared/MobileHead';
import { FALLBACK_ROUTER_LABEL, RouterLabelContext } from '../context/RouterLabelContext';
import { useCurrentLabel } from '../hooks/useCurrentLabel';
import { LABEL_TO_SYSTEM_LABEL, getSystemLabels, SystemLabel } from '../utils/label';

const labelIsSystemLabel = (label: string | null): label is SystemLabels =>
  Object.values(SystemLabels).includes(label as SystemLabels);

const SystemLabelMailbox = () => {
  const { label: currentLabel } = useCurrentLabel();

  // If we can't parse label, just return inbox

  const systemLabel: SystemLabel = labelIsSystemLabel(currentLabel)
    ? LABEL_TO_SYSTEM_LABEL[currentLabel]
    : FALLBACK_ROUTER_LABEL;

  return (
    <RouterLabelContext.Provider value={systemLabel}>
      <MobileHead />
      <Mailbox />
    </RouterLabelContext.Provider>
  );
};

// Generate static paths for export
export function getStaticPaths() {
  return {
    paths: getSystemLabels(true).map(({ value }) => ({
      params: { systemLabel: value.toLowerCase() }
    })),
    fallback: false
  };
}

// Required for getStaticPaths
export function getStaticProps() {
  return {
    props: {}
  };
}

export default SystemLabelMailbox;
