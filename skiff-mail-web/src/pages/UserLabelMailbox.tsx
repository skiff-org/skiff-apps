import { useEffect } from 'react';
import { useUserLabelsQuery } from 'skiff-front-graphql';
import { usePrevious } from 'skiff-front-utils';

import { Mailbox } from '../components/mailbox/Mailbox';
import { RouterLabelContext } from '../context/RouterLabelContext';
import { useCurrentLabel } from '../hooks/useCurrentLabel';
import { userLabelFromGraphQL } from '../utils/label';
import { useNavigate } from '../utils/navigation';

const UserLabelMailbox = () => {
  const { label: currentLabel, userLabelVariant } = useCurrentLabel();
  const { data, loading } = useUserLabelsQuery();
  const allUserLabels = data?.userLabels ?? [];
  const userLabel = allUserLabels.find(
    (label) => label.labelName.toLowerCase() === currentLabel?.toLowerCase() && label.variant === userLabelVariant
  );
  const prevCurrentLabel = usePrevious(currentLabel);
  const prevLoading = usePrevious(loading);

  const { navigateToInbox } = useNavigate();

  useEffect(() => {
    // If userLabelVariant is not defined, this is not a user label.
    // Only check for redirect after the data is done loading
    if (!userLabelVariant || loading) return;
    // If the current label changes (switching between labels, folders, etc) or
    // if the loading state changes (on initial load) and userLabel is still not
    // defined, this means that the label does not exist for the current account.
    // In this case, we redirect to the inbox.
    if (!userLabel && (currentLabel !== prevCurrentLabel || loading !== prevLoading)) {
      navigateToInbox();
    }
  }, [currentLabel, loading, navigateToInbox, prevCurrentLabel, prevLoading, userLabel, userLabelVariant]);

  if (!userLabel) {
    return null;
  }

  return (
    <RouterLabelContext.Provider value={userLabelFromGraphQL(userLabel)}>
      <Mailbox />
    </RouterLabelContext.Provider>
  );
};

export default UserLabelMailbox;
