import { Mailbox } from '../components/mailbox/Mailbox';
import { RouterLabelContext } from '../context/RouterLabelContext';
import { useUserLabelsQuery } from '../generated/graphql';
import { useCurrentLabel } from '../hooks/useCurrentLabel';
import { userLabelFromGraphQL } from '../utils/label';

const UserLabelMailbox = () => {
  const currentLabel = useCurrentLabel();
  const { data } = useUserLabelsQuery();
  const allUserLabels = data?.userLabels ?? [];
  const userLabel = allUserLabels.find((label) => label.labelName.toLowerCase() === currentLabel?.toLowerCase());
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
